import round from 'round-half-up-symmetric'
import { mat4, vec3 } from 'wgpu-matrix'
import getPreferredFormat from '../get-preferred-format.js'
import * as publicAPI from './public-api.js'
import spriteWGSL from './sprite.wgsl'

// temporary variables, allocated once to avoid garbage collection
const _tmpVec3 = vec3.create(0, 0, 0)
const _projection = mat4.identity()
const _view = mat4.identity()

// Packed instance layout: 52 bytes (aligned for vec4 fetch)
const INSTANCE_STRIDE = 64

// Offsets inside one instance (bytes)
const OFF_POS = 0 // float32x2 (8B)
const OFF_SIZE = 8 // float32x2 (8B)
const OFF_SCALE = 16 // float32x2 (8B)
const OFF_TINT = 24 // float32x4 (16B)
const OFF_SPRITEID = 40 // uint32 (4B)
const OFF_OPACITY = 44 // float32 (4B)
const OFF_ROT = 48 // float32 (4B)

/**
 * Refs:
 *   spritesheet (customResource, read) - spritesheet to source frames from
 *   color (textureView, rgba8unorm, write) - render target
 */
export default {
    type: 'cobalt:sprite',

    // cobalt event handling functions

    // @params Object cobalt renderer world object
    // @params Object options optional data passed when initing this node
    onInit: async function (cobalt, options = {}) {
        return init(cobalt, options)
    },

    onRun: function (cobalt, node, webGpuCommandEncoder) {
        // do whatever you need for this node. webgpu renderpasses, etc.
        draw(cobalt, node, webGpuCommandEncoder)
    },

    // Clean up GPU resources. Most WebGPU objects are GC-managed and don't
    // expose destroy(); buffers/textures/query-sets do.
    onDestroy: function (cobalt, node) {
        // Explicitly destroy GPU resources that have a destroy() method
        try {
            node.data.instanceBuf?.destroy()
        } catch {}
        try {
            node.data.spriteBuf?.destroy()
        } catch {}
        try {
            node.data.uniformBuffer?.destroy()
        } catch {}

        // These do not have destroy(); drop references to let GC reclaim
        node.data.pipeline = null // GPURenderPipeline
        node.data.bindGroup = null // GPUBindGroup
        node.data.bindGroupLayout = null // GPUBindGroupLayout

        // CPU-side allocations
        node.data.instanceStaging = null
        node.data.instanceView = null
        node.data.sprites.length = 0
        node.data.visible.length = 0
    },

    onResize: function (cobalt, node) {
        writeCameraBuffer(cobalt, node)
    },

    onViewportPosition: function (cobalt, node) {
        writeCameraBuffer(cobalt, node)
    },

    // optional
    customFunctions: {
        ...publicAPI,
    },
}

async function init(cobalt, nodeData) {
    const { device } = cobalt

    const { descs, names } = nodeData.refs.spritesheet.data.spritesheet

    const uniformBuffer = device.createBuffer({
        size: 64 * 2, // 4x4 matrix with 4 bytes per float32, times 2 matrices (view, projection)
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    })

    // Pack into std430-like struct (4*float*? + vec2 + vec2 → 32 bytes). We'll just write tightly as 8 floats.
    const BYTES_PER_DESC = 8 * 4 // 8 float32s
    const buf = new ArrayBuffer(BYTES_PER_DESC * descs.length)
    const f32 = new Float32Array(buf)
    for (let i = 0; i < descs.length; i++) {
        const d = descs[i]
        const base = i * 8
        f32[base + 0] = d.UvOrigin[0]
        f32[base + 1] = d.UvOrigin[1]
        f32[base + 2] = d.UvSpan[0]
        f32[base + 3] = d.UvSpan[1]
        f32[base + 4] = d.FrameSize[0]
        f32[base + 5] = d.FrameSize[1]
        f32[base + 6] = d.CenterOffset[0]
        f32[base + 7] = d.CenterOffset[1]
    }

    // create buffer for sprite uv lookup
    const spriteBuf = device.createBuffer({
        label: 'sprite desc table',
        size: Math.max(16, buf.byteLength),
        usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
    })

    device.queue.writeBuffer(spriteBuf, 0, buf)

    // --- Instance buffer (growable) ---
    const instanceCap = 1024
    const instanceBuf = device.createBuffer({
        label: 'sprite instances',
        size: INSTANCE_STRIDE * instanceCap,
        usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
    })
    const instanceStaging = new ArrayBuffer(INSTANCE_STRIDE * instanceCap)
    const instanceView = new DataView(instanceStaging)

    // --- Pipeline ---
    const shader = device.createShaderModule({ code: spriteWGSL })
    const bgl = device.createBindGroupLayout({
        entries: [
            {
                binding: 0,
                visibility: GPUShaderStage.VERTEX,
                buffer: { type: 'uniform' },
            },
            {
                binding: 1,
                visibility: GPUShaderStage.FRAGMENT,
                sampler: { type: 'filtering' },
            },
            {
                binding: 2,
                visibility: GPUShaderStage.FRAGMENT,
                texture: { sampleType: 'float' },
            },
            {
                binding: 3,
                visibility: GPUShaderStage.VERTEX,
                buffer: { type: 'read-only-storage' },
            },
        ],
    })
    const pipelineLayout = device.createPipelineLayout({
        bindGroupLayouts: [bgl],
    })

    const instLayout = {
        arrayStride: INSTANCE_STRIDE,
        stepMode: 'instance',
        attributes: [
            { shaderLocation: 0, offset: OFF_POS, format: 'float32x2' },
            { shaderLocation: 1, offset: OFF_SIZE, format: 'float32x2' },
            { shaderLocation: 2, offset: OFF_SCALE, format: 'float32x2' },
            { shaderLocation: 3, offset: OFF_TINT, format: 'float32x4' },
            { shaderLocation: 4, offset: OFF_SPRITEID, format: 'uint32' },
            { shaderLocation: 5, offset: OFF_OPACITY, format: 'float32' },
            { shaderLocation: 6, offset: OFF_ROT, format: 'float32' },
        ],
    }

    const pipeline = device.createRenderPipeline({
        layout: pipelineLayout,
        vertex: {
            module: shader,
            entryPoint: 'vs_main',
            buffers: [instLayout],
        },
        fragment: {
            module: shader,
            entryPoint: 'fs_main',
            targets: [
                // color
                {
                    format: getPreferredFormat(cobalt),
                    blend: {
                        color: {
                            srcFactor: 'src-alpha',
                            dstFactor: 'one-minus-src-alpha',
                        },
                        alpha: {
                            srcFactor: 'zero',
                            dstFactor: 'one',
                        },
                    },
                },
            ],
        },
        primitive: { topology: 'triangle-strip', cullMode: 'none' },
        multisample: { count: 1 },
    })

    const bindGroup = device.createBindGroup({
        layout: bgl,
        entries: [
            // Uniform buffer (view + proj matrices)
            { binding: 0, resource: { buffer: uniformBuffer } },

            { binding: 1, resource: nodeData.refs.spritesheet.data.colorTexture.sampler },
            { binding: 2, resource: nodeData.refs.spritesheet.data.colorTexture.view },
            { binding: 3, resource: { buffer: spriteBuf } },
        ],
    })

    return {
        sprites: [],
        visible: [],
        visibleCount: 0,
        viewRect: { x: 0, y: 0, w: 0, h: 0 },

        spriteBuf,
        uniformBuffer,

        instanceCap,
        instanceView,
        instanceBuf,
        instanceStaging,

        pipeline,
        bindGroup,
    }
}

function ensureCapacity(cobalt, node, nInstances) {
    const { instanceCap } = node.data

    if (nInstances <= instanceCap) return

    let newCap = instanceCap
    if (newCap === 0) newCap = 1024

    while (newCap < nInstances) newCap *= 2

    node.data.instanceBuf.destroy()
    node.data.instanceBuf = cobalt.device.createBuffer({
        size: INSTANCE_STRIDE * newCap,
        usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
    })

    node.data.instanceStaging = new ArrayBuffer(INSTANCE_STRIDE * newCap)
    node.data.instanceView = new DataView(node.data.instanceStaging)
    node.data.instanceCap = newCap
}

function draw(cobalt, node, commandEncoder) {
    const { device, context } = cobalt

    const { instanceView, instanceBuf, instanceStaging, pipeline, bindGroup } = node.data

    const { descs } = node.refs.spritesheet.data.spritesheet

    const viewRect = node.data.viewRect

    viewRect.x = cobalt.viewport.position[0]
    viewRect.y = cobalt.viewport.position[1]
    viewRect.w = cobalt.viewport.width
    viewRect.h = cobalt.viewport.height

    node.data.visibleCount = 0

    for (const s of node.data.sprites) {
        const d = descs[s.spriteID]
        if (!d) continue

        // avoid sprite viewport culling when drawing in screenspace mode (typically ui/hud layers)
        if (!node.options.isScreenSpace) {
            const sx = d.FrameSize[0] * s.sizeX * s.scale[0] * 0.5
            const sy = d.FrameSize[1] * s.sizeY * s.scale[1] * 0.5
            const rad = Math.hypot(sx, sy)
            const x = s.position[0],
                y = s.position[1]
            if (
                x + rad < viewRect.x ||
                x - rad > viewRect.x + viewRect.w ||
                y + rad < viewRect.y ||
                y - rad > viewRect.y + viewRect.h
            )
                continue
        }

        node.data.visible[node.data.visibleCount] = s
        node.data.visibleCount++
    }

    ensureCapacity(cobalt, node, node.data.visibleCount)

    // Pack instances into staging buffer
    for (let i = 0; i < node.data.visibleCount; i++) {
        const base = i * INSTANCE_STRIDE
        const s = node.data.visible[i]
        const tint = s.tint

        instanceView.setFloat32(base + OFF_POS + 0, s.position[0], true)
        instanceView.setFloat32(base + OFF_POS + 4, s.position[1], true)

        instanceView.setFloat32(base + OFF_SIZE + 0, s.sizeX, true)
        instanceView.setFloat32(base + OFF_SIZE + 4, s.sizeY, true)

        instanceView.setFloat32(base + OFF_SCALE + 0, s.scale[0], true)
        instanceView.setFloat32(base + OFF_SCALE + 4, s.scale[1], true)

        instanceView.setFloat32(base + OFF_TINT + 0, tint[0], true)
        instanceView.setFloat32(base + OFF_TINT + 4, tint[1], true)
        instanceView.setFloat32(base + OFF_TINT + 8, tint[2], true)
        instanceView.setFloat32(base + OFF_TINT + 12, tint[3], true)

        instanceView.setUint32(base + OFF_SPRITEID, s.spriteID >>> 0, true)

        instanceView.setFloat32(base + OFF_OPACITY, s.opacity, true)

        instanceView.setFloat32(base + OFF_ROT, s.rotation, true)
    }

    device.queue.writeBuffer(
        instanceBuf,
        0,
        instanceStaging,
        0,
        node.data.visibleCount * INSTANCE_STRIDE,
    )

    const loadOp = node.options.loadOp || 'load'

    const pass = commandEncoder.beginRenderPass({
        label: 'sprite renderpass',
        colorAttachments: [
            // color
            {
                view: node.refs.color,
                clearValue: cobalt.clearValue,
                loadOp: loadOp,
                storeOp: 'store',
            },
        ],
    })

    pass.setPipeline(pipeline)
    pass.setBindGroup(0, bindGroup)
    pass.setVertexBuffer(0, instanceBuf)
    if (node.data.visibleCount) pass.draw(4, node.data.visibleCount, 0, 0) // triangle strip, 4 verts per instance
    pass.end()
}

function writeCameraBuffer(cobalt, node) {
    const { device, viewport } = cobalt

    const GAME_WIDTH = viewport.width / viewport.zoom
    const GAME_HEIGHT = viewport.height / viewport.zoom

    //      left    right       bottom   top   near   far
    mat4.ortho(0, GAME_WIDTH, GAME_HEIGHT, 0, -10.0, 10.0, _projection)

    // set 3d camera position
    if (node.options.isScreenSpace) {
        vec3.set(0, 0, 0, _tmpVec3)
    } else {
        // TODO: if this doesn't introduce jitter into the crossroads render, remove this disabled code entirely.
        //
        // I'm disabling the rounding because I think it fails in cases where units are not expressed in pixels
        // e.g., most physics engines operate on meters, not pixels, so we don't want to round to the nearest integer as that
        // probably isn't high enough resolution. That would mean the camera could be snapped by up to 0.5 meters
        // in that case. I think the better solution for expressing camera position in pixels is to round before calling
        // cobalt.setViewportPosition(...)
        //
        vec3.set(-round(viewport.position[0]), -round(viewport.position[1]), 0, _tmpVec3)
        //vec3.set(-viewport.position[0], -viewport.position[1], 0, _tmpVec3)
    }

    mat4.translation(_tmpVec3, _view)

    device.queue.writeBuffer(node.data.uniformBuffer, 0, _view.buffer)
    device.queue.writeBuffer(node.data.uniformBuffer, 64, _projection.buffer)
}
