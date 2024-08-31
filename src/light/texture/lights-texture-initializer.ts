import { LightsBuffer } from "../lights-buffer";
import { type ILightsTexture } from "./lights-texture";

class LightsTextureInitializer {
    private readonly lightsBuffer: LightsBuffer;

    private readonly renderPipeline: GPURenderPipeline;
    private readonly bindgroup: GPUBindGroup;

    private readonly renderBundle: GPURenderBundle;

    public constructor(device: GPUDevice, lightsBuffer: LightsBuffer, lightsTexture: ILightsTexture, maxLightSize: number) {
        this.lightsBuffer = lightsBuffer;

        const shaderModule = device.createShaderModule({
            label: "LightsTextureInitializer shader module",
            code: `
${LightsBuffer.structs.definition}

@group(0) @binding(0) var<storage,read> lightsBuffer: LightsBuffer;

struct VertexIn {
    @builtin(vertex_index) vertexIndex: u32,
};

struct VertexOut {
    @builtin(position) position: vec4<f32>,
    @location(0) uv: vec2<f32>,
};

const cellsGridSizeU = vec2<u32>(${lightsTexture.gridSize.x}, ${lightsTexture.gridSize.y});
const cellsGridSizeF = vec2<f32>(${lightsTexture.gridSize.x}, ${lightsTexture.gridSize.y});

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
    size: f32,
    intensity: f32,
    attenuationLinear: f32,
    attenuationExp: f32,
};

fn get_light_properties(lightId: u32) -> LightProperties {
    var lightProperties: LightProperties;
    if (lightId < lightsBuffer.count) {
        let light = lightsBuffer.lights[lightId];
        lightProperties.size = light.size;
        lightProperties.intensity = light.intensity;
        lightProperties.attenuationLinear = light.attenuationLinear;
        lightProperties.attenuationExp = light.attenuationExp;
    } else {
        lightProperties.size = 0.0;
        lightProperties.intensity = 0.0;
        lightProperties.attenuationLinear = 0.0;
        lightProperties.attenuationExp = 0.0;
    }
    return lightProperties;
}

@fragment
fn main_fragment(in: VertexOut) -> FragmentOut {
    let cellId = vec2<u32>(in.uv);

    let lightIdFrom = 4u * (cellId.x + cellId.y * cellsGridSizeU.x);
    let lightProperties = array<LightProperties, 4>(
        get_light_properties(lightIdFrom + 0u),
        get_light_properties(lightIdFrom + 1u),
        get_light_properties(lightIdFrom + 2u),
        get_light_properties(lightIdFrom + 3u),
    );

    let sizes = vec4<f32>(
        lightProperties[0].size,
        lightProperties[1].size,
        lightProperties[2].size,
        lightProperties[3].size,
    );

    let localUv = fract(in.uv);
    let fromCenter = 2.0 * localUv - 1.0;
    let uvDistanceFromCenter = distance(vec2<f32>(0,0), fromCenter);
    let distancesFromCenter = vec4<f32>(uvDistanceFromCenter / sizes * f32(${maxLightSize}));

    let intensities = vec4<f32>(
        lightProperties[0].intensity * (1.0 + 1.0 * step(uvDistanceFromCenter, 0.01)),
        lightProperties[1].intensity * (1.0 + 1.0 * step(uvDistanceFromCenter, 0.01)),
        lightProperties[2].intensity * (1.0 + 1.0 * step(uvDistanceFromCenter, 0.01)),
        lightProperties[3].intensity * (1.0 + 1.0 * step(uvDistanceFromCenter, 0.01)),
    );
    let attenuationsLinear = vec4<f32>(
        lightProperties[0].attenuationLinear,
        lightProperties[1].attenuationLinear,
        lightProperties[2].attenuationLinear,
        lightProperties[3].attenuationLinear,
    );
    let attenuationsExp = vec4<f32>(
        lightProperties[0].attenuationExp,
        lightProperties[1].attenuationExp,
        lightProperties[2].attenuationExp,
        lightProperties[3].attenuationExp,
    );

    var lightIntensities = intensities / (1.0 + distancesFromCenter * (attenuationsLinear + distancesFromCenter * attenuationsExp)); // base intensity equation
    lightIntensities *= cos(distancesFromCenter * ${Math.PI / 2}); // soft limit;
    lightIntensities *= step(distancesFromCenter, vec4<f32>(1.0)); // hard limit

    var out: FragmentOut;
    out.color = lightIntensities;
    return out;
}
            `,
        });

        this.renderPipeline = device.createRenderPipeline({
            label: "LightsTextureInitializer renderpipeline",
            layout: "auto",
            vertex: {
                module: shaderModule,
                entryPoint: "main_vertex",
            },
            fragment: {
                module: shaderModule,
                entryPoint: "main_fragment",
                targets: [{
                    format: lightsTexture.format,
                }],
            },
            primitive: {
                cullMode: "none",
                topology: "triangle-strip",
            },
            multisample: {
                count: lightsTexture.sampleCount,
            },
        });

        this.bindgroup = device.createBindGroup({
            label: "LightsTextureInitializer bindgroup 0",
            layout: this.renderPipeline.getBindGroupLayout(0),
            entries: [
                {
                    binding: 0,
                    resource: { buffer: this.lightsBuffer.gpuBuffer },
                },
            ]
        });

        const renderBundleEncoder = device.createRenderBundleEncoder({
            label: "LightsTextureInitializer renderbundle encoder",
            colorFormats: [lightsTexture.format],
            sampleCount: lightsTexture.sampleCount,
        });
        renderBundleEncoder.setPipeline(this.renderPipeline);
        renderBundleEncoder.setBindGroup(0, this.bindgroup);
        renderBundleEncoder.draw(4);
        this.renderBundle = renderBundleEncoder.finish({ label: "LightsTextureInitializer renderbundle" });
    }

    public getRenderBundle(): GPURenderBundle {
        return this.renderBundle;
    }
}

export {
    LightsTextureInitializer
};

