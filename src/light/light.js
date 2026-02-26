import * as wgpuMatrix from 'wgpu-matrix'
import getPreferredFormat from '../get-preferred-format.js'
import {
    createLightsBuffer,
    destroyLightsBuffer,
    LIGHTS_STRUCT_DEFINITION,
    writeLightsBuffer,
} from './lights-buffer.js'
import * as publicAPI from './public-api.js'
import {
    createLightsTextureMask,
    destroyMask,
    setMaskLightsCount,
    setMaskObstacles,
} from './texture/lights-texture-mask.js'

/**
 * 2D lighting and Shadows
 *
 * Refs:
 *   in (textureView, any color format, read) - albedo input texture
 *   out (textureView or FRAME_TEXTURE_VIEW, any color format, write) - lit output texture
 */
export default {
    type: 'cobalt:light',

    onInit: async function (cobalt, node) {
        return init(cobalt, node)
    },

    onRun: function (cobalt, node, webGpuCommandEncoder) {
        draw(cobalt, node, webGpuCommandEncoder)
    },

    onDestroy: function (cobalt, node) {
        destroy(node)
    },

    onResize: function (cobalt, node) {
        resize(cobalt, node)
    },

    onViewportPosition: function (cobalt, node) {
        const { viewport } = cobalt
        node.data.viewportTopLeft = [...viewport.position]
        node.data.invViewProjectionMatrix = computeInvertViewProjectionMatrix(
            node.data.viewportWidth,
            node.data.viewportHeight,
            node.data.viewportZoom,
            node.data.viewportTopLeft,
        )
    },

    customFunctions: { ...publicAPI },
}

async function init(cobalt, node) {
    const { device } = cobalt

    // a 2048x2048 light texture with 4 channels (rgba) with each light lighting a 256x256 region can hold 256 lights
    const MAX_LIGHT_COUNT = 256
    const MAX_LIGHT_SIZE = 256
    const textureFormat = getPreferredFormat(cobalt)
    const resolutionPerLight = MAX_LIGHT_SIZE
    const filtering = 'nearest'

    // --- lights storage buffer ---
    const lightsBufferData = createLightsBuffer(device, MAX_LIGHT_COUNT)

    // --- lights atlas texture ---
    const cellsCount = MAX_LIGHT_COUNT / 4
    const gridSize = {
        x: Math.ceil(Math.sqrt(cellsCount)),
        y: 0,
    }
    gridSize.y = Math.ceil(cellsCount / gridSize.x)

    const lightTextureSize = {
        width: gridSize.x * resolutionPerLight,
        height: gridSize.y * resolutionPerLight,
    }

    const lightsTexture = device.createTexture({
        label: 'LightsTexture texture',
        size: [lightTextureSize.width, lightTextureSize.height],
        format: textureFormat,
        usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.RENDER_ATTACHMENT,
    })

    const lightsTextureRenderpassDescriptor = {
        label: 'lights-renderer render to texture renderpass',
        colorAttachments: [
            {
                view: lightsTexture.createView(),
                clearValue: [0, 0, 0, 1],
                loadOp: 'load',
                storeOp: 'store',
            },
        ],
    }

    // descriptor object passed to initializer + mask (metadata only, no GPU resources)
    const lightsTextureDescriptor = {
        gridSize,
        format: textureFormat,
        sampleCount: 1,
    }

    // --- initializer sub-pass (radial attenuation pre-pass, baked render bundle) ---
    const initializerShaderModule = device.createShaderModule({
        label: 'LightsTextureInitializer shader module',
        code: `
${LIGHTS_STRUCT_DEFINITION}

@group(0) @binding(0) var<storage,read> lightsBuffer: LightsBuffer;

struct VertexIn {
    @builtin(vertex_index) vertexIndex: u32,
};

struct VertexOut {
    @builtin(position) position: vec4<f32>,
    @location(0) uv: vec2<f32>,
};

const cellsGridSizeU = vec2<u32>(${gridSize.x}, ${gridSize.y});
const cellsGridSizeF = vec2<f32>(${gridSize.x}, ${gridSize.y});

@vertex
fn main_vertex(in: VertexIn) -> VertexOut {
    const corners = array<vec2<f32>, 4>(
        vec2<f32>(-1, -1),
        vec2<f32>(1, -1),
        vec2<f32>(-1, 1),
        vec2<f32>(1, 1),
    );
    let screenPosition = corners[in.vertexIndex];

    var out: VertexOut;
    out.position = vec4<f32>(screenPosition, 0.0, 1.0);
    out.uv = (0.5 + 0.5 * screenPosition) * cellsGridSizeF;
    return out;
}

struct FragmentOut {
    @location(0) color: vec4<f32>,
};

struct LightProperties {
    radius: f32,
    intensity: f32,
    attenuationLinear: f32,
    attenuationExp: f32,
};

fn get_light_properties(lightId: u32) -> LightProperties {
    var p: LightProperties;
    if (lightId < lightsBuffer.count) {
        let light = lightsBuffer.lights[lightId];
        p.radius = light.radius;
        p.intensity = 1.0;
        p.attenuationLinear = light.attenuationLinear;
        p.attenuationExp = light.attenuationExp;
    }
    return p;
}

@fragment
fn main_fragment(in: VertexOut) -> FragmentOut {
    let cellId = vec2<u32>(in.uv);
    let lightIdFrom = 4u * (cellId.x + cellId.y * cellsGridSizeU.x);
    let p = array<LightProperties, 4>(
        get_light_properties(lightIdFrom + 0u),
        get_light_properties(lightIdFrom + 1u),
        get_light_properties(lightIdFrom + 2u),
        get_light_properties(lightIdFrom + 3u),
    );

    let localUv = fract(in.uv);
    let fromCenter = 2.0 * localUv - 1.0;
    let uvDist = distance(vec2<f32>(0.0, 0.0), fromCenter);
    let sizes = vec4<f32>(p[0].radius, p[1].radius, p[2].radius, p[3].radius);
    let d = vec4<f32>(uvDist / sizes * f32(${MAX_LIGHT_SIZE}));

    let intensities    = vec4<f32>(p[0].intensity, p[1].intensity, p[2].intensity, p[3].intensity)
                       * (1.0 + step(uvDist, 0.01));
    let attenuationL   = vec4<f32>(p[0].attenuationLinear, p[1].attenuationLinear, p[2].attenuationLinear, p[3].attenuationLinear);
    let attenuationE   = vec4<f32>(p[0].attenuationExp,    p[1].attenuationExp,    p[2].attenuationExp,    p[3].attenuationExp);

    var lightIntensities = intensities / (1.0 + d * (attenuationL + d * attenuationE));
    lightIntensities *= cos(d * ${Math.PI / 2});
    lightIntensities *= step(d, vec4<f32>(1.0));

    var out: FragmentOut;
    out.color = lightIntensities;
    return out;
}
        `,
    })

    const initializerPipeline = device.createRenderPipeline({
        label: 'LightsTextureInitializer renderpipeline',
        layout: 'auto',
        vertex: { module: initializerShaderModule, entryPoint: 'main_vertex' },
        fragment: {
            module: initializerShaderModule,
            entryPoint: 'main_fragment',
            targets: [{ format: textureFormat }],
        },
        primitive: { cullMode: 'none', topology: 'triangle-strip' },
    })

    const initializerBindgroup = device.createBindGroup({
        label: 'LightsTextureInitializer bindgroup',
        layout: initializerPipeline.getBindGroupLayout(0),
        entries: [{ binding: 0, resource: { buffer: lightsBufferData.lightsBufferGpu } }],
    })

    const initializerBundleEncoder = device.createRenderBundleEncoder({
        label: 'LightsTextureInitializer renderbundle encoder',
        colorFormats: [textureFormat],
    })
    initializerBundleEncoder.setPipeline(initializerPipeline)
    initializerBundleEncoder.setBindGroup(0, initializerBindgroup)
    initializerBundleEncoder.draw(4)
    const initializerRenderBundle = initializerBundleEncoder.finish({
        label: 'LightsTextureInitializer renderbundle',
    })

    // --- mask sub-pass (shadow/occlusion geometry) ---
    const maskData = createLightsTextureMask(
        device,
        lightsBufferData.lightsBufferGpu,
        lightsTextureDescriptor,
        MAX_LIGHT_SIZE,
    )

    // --- final composite render pipeline ---
    //   out ref is either a node (with .data.texture.format) or a raw GPUTextureView (FRAME_TEXTURE_VIEW)
    const rendererTargetFormat = node.refs.out.data?.texture?.format || getPreferredFormat(cobalt)

    const rendererUniformsBufferGpu = device.createBuffer({
        label: 'LightsRenderer uniforms buffer',
        size: 80,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    })

    const rendererShaderModule = device.createShaderModule({
        label: 'LightsRenderer shader module',
        code: `
struct Uniforms {                  //            align(16) size(80)
    invertViewMatrix: mat4x4<f32>, // offset(0)  align(16) size(64)
    ambientLight: vec3<f32>,       // offset(64) align(16) size(12)
};

${LIGHTS_STRUCT_DEFINITION}

@group(0) @binding(0) var<uniform> uniforms: Uniforms;
@group(0) @binding(1) var<storage,read> lightsBuffer: LightsBuffer;
@group(0) @binding(2) var lightsTexture: texture_2d<f32>;
@group(0) @binding(3) var lightsTextureSampler: sampler;

@group(1) @binding(0) var albedoTexture: texture_2d<f32>;
@group(1) @binding(1) var albedoSampler: sampler;

struct VertexIn {
    @builtin(vertex_index) vertexIndex: u32,
};

struct VertexOut {
    @builtin(position) position: vec4<f32>,
    @location(0) worldPosition: vec2<f32>,
    @location(1) uv: vec2<f32>,
};

@vertex
fn main_vertex(in: VertexIn) -> VertexOut {
    const corners = array<vec2<f32>, 4>(
        vec2<f32>(-1, -1),
        vec2<f32>(1, -1),
        vec2<f32>(-1, 1),
        vec2<f32>(1, 1),
    );
    let screenPosition = corners[in.vertexIndex];

    var out: VertexOut;
    out.position = vec4<f32>(screenPosition, 0.0, 1.0);
    out.worldPosition = (uniforms.invertViewMatrix * out.position).xy;
    out.uv = 0.5 + 0.5 * screenPosition * vec2<f32>(1.0, -1.0);
    return out;
}

struct FragmentOut {
    @location(0) color: vec4<f32>,
};

const cellsGridSizeU = vec2<u32>(${gridSize.x}, ${gridSize.y});
const cellsGridSizeF = vec2<f32>(${gridSize.x}, ${gridSize.y});

fn sampleLightBaseIntensity(lightId: u32, localUv: vec2<f32>) -> f32 {
    let cellIndex = lightId / 4u;
    let indexInCell = lightId % 4u;

    let cellIdU = vec2<u32>(
        cellIndex % cellsGridSizeU.x,
        cellIndex / cellsGridSizeU.x,
    );
    let cellIdF = vec2<f32>(cellIdU);
    let uv = (cellIdF + localUv) / cellsGridSizeF;
    let uvYInverted = vec2<f32>(uv.x, 1.0 - uv.y);
    let sample = textureSampleLevel(lightsTexture, lightsTextureSampler, uvYInverted, 0.0);
    let channel = vec4<f32>(
        vec4<u32>(indexInCell) == vec4<u32>(0u, 1u, 2u, 3u),
    );
    return dot(sample, channel);
}

fn compute_lights(worldPosition: vec2<f32>) -> vec3<f32> {
    var color = vec3<f32>(uniforms.ambientLight);

    const maxUvDistance = f32(${1 - 2 / resolutionPerLight});

    let lightsCount = lightsBuffer.count;
    for (var iLight = 0u; iLight < lightsCount; iLight++) {
        let light = lightsBuffer.lights[iLight];
        let lightSize = f32(${resolutionPerLight});
        let relativePosition = (worldPosition - light.position) / lightSize;
        if (max(abs(relativePosition.x), abs(relativePosition.y)) < maxUvDistance) {
            let localUv = 0.5 + 0.5 * relativePosition;
            let lightIntensity = light.intensity * sampleLightBaseIntensity(iLight, localUv);
            color += lightIntensity * light.color;
        }
    }

    return color;
}

@fragment
fn main_fragment(in: VertexOut) -> FragmentOut {
    let light = clamp(compute_lights(in.worldPosition), vec3<f32>(0.0), vec3<f32>(1.0));
    let albedo = textureSample(albedoTexture, albedoSampler, in.uv);
    let color = albedo.rgb * light;

    var out: FragmentOut;
    out.color = vec4<f32>(color, 1.0);
    return out;
}
        `,
    })

    const rendererPipeline = device.createRenderPipeline({
        label: 'LightsRenderer renderpipeline',
        layout: 'auto',
        vertex: {
            module: rendererShaderModule,
            entryPoint: 'main_vertex',
        },
        fragment: {
            module: rendererShaderModule,
            entryPoint: 'main_fragment',
            targets: [{ format: rendererTargetFormat }],
        },
        primitive: {
            cullMode: 'none',
            topology: 'triangle-strip',
        },
    })

    const rendererBindgroup0 = device.createBindGroup({
        label: 'LightsRenderer bindgroup 0',
        layout: rendererPipeline.getBindGroupLayout(0),
        entries: [
            {
                binding: 0,
                resource: { buffer: rendererUniformsBufferGpu },
            },
            {
                binding: 1,
                resource: { buffer: lightsBufferData.lightsBufferGpu },
            },
            {
                binding: 2,
                resource: lightsTexture.createView({ label: 'LightsRenderer lightsTexture view' }),
            },
            {
                binding: 3,
                resource: device.createSampler({
                    label: 'LightsRenderer sampler',
                    addressModeU: 'clamp-to-edge',
                    addressModeV: 'clamp-to-edge',
                    magFilter: filtering,
                    minFilter: filtering,
                }),
            },
        ],
    })

    const rendererBindgroup1 = buildRendererBindgroup1(device, rendererPipeline, {
        view: node.refs.in.data.view,
        sampler: node.refs.in.data.sampler,
    })

    // viewport
    const viewportTopLeft = [...cobalt.viewport.position]
    const invViewProjectionMatrix = computeInvertViewProjectionMatrix(
        cobalt.viewport.width,
        cobalt.viewport.height,
        cobalt.viewport.zoom,
        viewportTopLeft,
    )

    const data = {
        // lights storage buffer
        ...lightsBufferData,

        // lights atlas texture
        lightsTexture,
        lightsTextureRenderpassDescriptor,
        gridSize,

        // initializer sub-pass
        initializerPipeline,
        initializerBindgroup,
        initializerRenderBundle,

        // mask sub-pass
        ...maskData,

        // final composite pass
        rendererTargetFormat,
        rendererPipeline,
        rendererUniformsBufferGpu,
        rendererBindgroup0,
        rendererBindgroup1,
        rendererRenderBundle: null, // set below after data is fully constructed

        // viewport (flat, no class)
        invViewProjectionMatrix,
        viewportWidth: cobalt.viewport.width,
        viewportHeight: cobalt.viewport.height,
        viewportZoom: cobalt.viewport.zoom,
        viewportTopLeft,

        // logical state
        lights: [],
        ambientLight: [0.2, 0.2, 0.2],
        lightsBufferNeedsUpdate: true,
        lightsTextureNeedsUpdate: true,
    }

    data.rendererRenderBundle = buildRendererRenderBundle(device, data)

    return data
}

function draw(cobalt, node, commandEncoder) {
    const d = node.data
    const { device } = cobalt

    if (d.lightsBufferNeedsUpdate) {
        writeLightsBuffer(device, d, d.lights)
        d.lightsBufferNeedsUpdate = false
        d.lightsTextureNeedsUpdate = true
    }

    if (d.lightsTextureNeedsUpdate) {
        computeLightsTexture(device, d, commandEncoder)
        d.lightsTextureNeedsUpdate = false
    }

    // update zoom and recompute invert VP matrix
    d.viewportZoom = cobalt.viewport.zoom
    d.invViewProjectionMatrix = computeInvertViewProjectionMatrix(
        d.viewportWidth,
        d.viewportHeight,
        d.viewportZoom,
        d.viewportTopLeft,
    )

    // write uniforms: invertViewMatrix (64 bytes) + ambientLight (12 bytes)
    const uniformsCpu = new ArrayBuffer(80)
    new Float32Array(uniformsCpu, 0, 16).set(d.invViewProjectionMatrix)
    new Float32Array(uniformsCpu, 64, 3).set(d.ambientLight)
    device.queue.writeBuffer(d.rendererUniformsBufferGpu, 0, uniformsCpu)

    const renderpass = commandEncoder.beginRenderPass({
        label: 'light',
        colorAttachments: [
            {
                //    out is passed as a node     ||  FRAME_TEXTURE_VIEW
                view: node.refs.out.data?.view || node.refs.out,
                clearValue: cobalt.clearValue,
                loadOp: 'load',
                storeOp: 'store',
            },
        ],
    })
    renderpass.executeBundles([d.rendererRenderBundle])
    renderpass.end()
}

function destroy(node) {
    const d = node.data
    destroyLightsBuffer(d)
    d.lightsTexture.destroy()
    d.rendererUniformsBufferGpu.destroy()
    destroyMask(d)
}

function resize(cobalt, node) {
    const d = node.data
    const { device } = cobalt

    d.viewportWidth = cobalt.viewport.width
    d.viewportHeight = cobalt.viewport.height
    d.invViewProjectionMatrix = computeInvertViewProjectionMatrix(
        d.viewportWidth,
        d.viewportHeight,
        d.viewportZoom,
        d.viewportTopLeft,
    )

    // rebuild bindgroup1 with the new albedo texture view/sampler from the resized input node
    d.rendererBindgroup1 = buildRendererBindgroup1(device, d.rendererPipeline, {
        view: node.refs.in.data.view,
        sampler: node.refs.in.data.sampler,
    })
    d.rendererRenderBundle = buildRendererRenderBundle(device, d)
}

// ---- helpers ----

function computeLightsTexture(device, data, commandEncoder) {
    setMaskLightsCount(device, data, data.lightsCount)
    const renderpassEncoder = commandEncoder.beginRenderPass(data.lightsTextureRenderpassDescriptor)
    const w = data.lightsTexture.width
    const h = data.lightsTexture.height
    renderpassEncoder.setViewport(0, 0, w, h, 0, 1)
    renderpassEncoder.setScissorRect(0, 0, w, h)
    renderpassEncoder.executeBundles([data.initializerRenderBundle, data.maskRenderBundle])
    renderpassEncoder.end()
}

function buildRendererBindgroup1(device, pipeline, albedo) {
    return device.createBindGroup({
        label: 'LightsRenderer bindgroup 1',
        layout: pipeline.getBindGroupLayout(1),
        entries: [
            {
                binding: 0,
                resource: albedo.view,
            },
            {
                binding: 1,
                resource: albedo.sampler,
            },
        ],
    })
}

function computeInvertViewProjectionMatrix(width, height, zoom, topLeft) {
    const m = wgpuMatrix.mat4.identity()
    wgpuMatrix.mat4.multiply(wgpuMatrix.mat4.scaling([1, -1, 0]), m, m)
    wgpuMatrix.mat4.multiply(wgpuMatrix.mat4.translation([1, 1, 0]), m, m)
    wgpuMatrix.mat4.multiply(
        wgpuMatrix.mat4.scaling([(0.5 * width) / zoom, (0.5 * height) / zoom, 0]),
        m,
        m,
    )
    wgpuMatrix.mat4.multiply(wgpuMatrix.mat4.translation([topLeft[0], topLeft[1], 0]), m, m)
    return m
}

function buildRendererRenderBundle(device, data) {
    const renderBundleEncoder = device.createRenderBundleEncoder({
        label: 'LightsRenderer renderbundle encoder',
        colorFormats: [data.rendererTargetFormat],
    })
    renderBundleEncoder.setPipeline(data.rendererPipeline)
    renderBundleEncoder.setBindGroup(0, data.rendererBindgroup0)
    renderBundleEncoder.setBindGroup(1, data.rendererBindgroup1)
    renderBundleEncoder.draw(4)
    return renderBundleEncoder.finish({ label: 'LightsRenderer renderbundle' })
}
