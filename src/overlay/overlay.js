import * as publicAPI          from '../sprite/public-api.js'
import createSpriteQuads       from '../sprite/create-sprite-quads.js'
import overlayWGSL             from './overlay.wgsl'
import sortedBinaryInsert      from '../sprite/sorted-binary-insert.js'
import uuid                    from '../uuid.js'
import { FLOAT32S_PER_SPRITE } from './constants.js'
import { mat4, vec3, vec4 }    from '../deps.js'


// a sprite renderer with coordinates in screen space. useful for HUD/ui stuff

const _tmpVec4 = vec4.create()
const _tmpVec3 = vec3.create()


export default {
    type: 'cobalt:overlay',
    refs: [
        { name: 'spritesheet', type: 'customResource', access: 'read' },
        { name: 'color', type: 'textView', format: 'rgba8unorm', access: 'write' },
    ],

    // cobalt event handling functions

    // @params Object cobalt renderer world object
    // @params Object options optional data passed when initing this node
    onInit: async function (cobalt, options={}) {
        return init(cobalt, options)
    },

    onRun: function (cobalt, node, webGpuCommandEncoder) {
        // do whatever you need for this node. webgpu renderpasses, etc.
        draw(cobalt, node, webGpuCommandEncoder)
    },

    onDestroy: function (cobalt, node) {
        // any cleanup for your node should go here (releasing textures, etc.)
        destroy(node)
    },

    onResize: function (cobalt, node) {
        _writeOverlayBuffer(cobalt, node)
    },

    onViewportPosition: function (cobalt, node) {
        _writeOverlayBuffer(cobalt, node)
    },

    // optional
    customFunctions: { ...publicAPI },
}


// This corresponds to a WebGPU render pass.  It handles 1 sprite layer.
async function init (cobalt, nodeData) {
    const { device } = cobalt

    const MAX_SPRITE_COUNT = 16192  // max number of sprites in a single sprite render pass

    const numInstances = MAX_SPRITE_COUNT

    const translateFloatCount = 2 // vec2
    const translateSize = Float32Array.BYTES_PER_ELEMENT * translateFloatCount  // in bytes

    const scaleFloatCount = 2 // vec2
    const scaleSize = Float32Array.BYTES_PER_ELEMENT * scaleFloatCount  // in bytes

    const tintFloatCount = 4 // vec4
    const tintSize = Float32Array.BYTES_PER_ELEMENT * tintFloatCount // in bytes

    const opacityFloatCount = 4 // vec4. technically we only need 3 floats (opacity, rotation, emissiveIntensity) but that screws up data alignment in the shader
    const opacitySize = Float32Array.BYTES_PER_ELEMENT * opacityFloatCount  // in bytes

    // instanced sprite data (scale, translation, tint, opacity)
    const spriteBuffer = device.createBuffer({
        size: (translateSize + scaleSize + tintSize + opacitySize) * numInstances, // 4x4 matrix with 4 bytes per float32, per instance
        usage: GPUBufferUsage.VERTEX | GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
    })

    // the view and project matrices
    const uniformBuffer = device.createBuffer({
        size: 64 * 2, // 4x4 matrix with 4 bytes per float32, times 2 matrices (view, projection)
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
    })

    const bindGroupLayout = device.createBindGroupLayout({
        entries: [
            {
                binding: 0,
                visibility: GPUShaderStage.VERTEX,
                buffer: { }
            },
            {
                binding: 1,
                visibility: GPUShaderStage.FRAGMENT,
                texture:  { }
            },
            {
                binding: 2,
                visibility: GPUShaderStage.FRAGMENT,
                sampler: { }
            },
            {
                binding: 3,
                visibility: GPUShaderStage.VERTEX,
                buffer: {
                    type: 'read-only-storage'
                }
            },
        ],
    })

    const bindGroup = device.createBindGroup({
        layout: bindGroupLayout,
        entries: [
            {
                binding: 0,
                resource: {
                    buffer: uniformBuffer,
                }
            },
            {
                binding: 1,
                resource: nodeData.refs.spritesheet.data.colorTexture.view
            },
            {
                binding: 2,
                resource: nodeData.refs.spritesheet.data.colorTexture.sampler
            },
            {
                binding: 3,
                resource: {
                    buffer: spriteBuffer
                }
            }
        ]
    })


    const pipelineLayout = device.createPipelineLayout({
        bindGroupLayouts: [ bindGroupLayout ]
    })

    const pipeline = device.createRenderPipeline({
        label: 'overlay',
        vertex: {
            module: device.createShaderModule({
                code: overlayWGSL
            }),
            entryPoint: 'vs_main',
            buffers: [ nodeData.refs.spritesheet.data.quads.bufferLayout ]
        },

        fragment: {
            module: device.createShaderModule({
                code: overlayWGSL
            }),
            entryPoint: 'fs_main',
            targets: [
                // color
                {
                    format: 'bgra8unorm',
                    blend: {
                        color: {
                            srcFactor: 'src-alpha',
                            dstFactor: 'one-minus-src-alpha',
                        },
                        alpha: {
                            srcFactor: 'zero',
                            dstFactor: 'one'
                        }
                    }
                }
            ]
        },

        primitive: {
            topology: 'triangle-list'
        },

        layout: pipelineLayout
    })
    
    return {
        // instancedDrawCalls is used to actually perform draw calls within the render pass
        // layout is interleaved with baseVtxIdx (the sprite type), and instanceCount (how many sprites)
        // [
        //    baseVtxIdx0, instanceCount0,
        //    baseVtxIdx1, instanceCount1,
        //    ...
        // ]
        instancedDrawCalls: new Uint32Array(MAX_SPRITE_COUNT * 2),
        instancedDrawCallCount: 0,

        spriteBuffer,
        uniformBuffer,
        pipeline,
        bindGroupLayout,
        bindGroup,

        // actual sprite instance data. ordered by layer, then sprite type
        // this is used to update the spriteBuffer.
        spriteData: new Float32Array(MAX_SPRITE_COUNT * FLOAT32S_PER_SPRITE), 
        spriteCount: 0,

        spriteIndices: new Map(), // key is spriteId, value is insert index of the sprite. e.g., 0 means 1st sprite , 1 means 2nd sprite, etc.

        // when a sprite is changed the renderpass is dirty, and should have it's instance data copied to the gpu
        dirty: false,
    }
}


function draw (cobalt, node, commandEncoder) {
    const { device } = cobalt

    // on the first render, we should clear the color attachment.
    // otherwise load it, so multiple sprite passes can build up data in the color and emissive textures
    const loadOp = node.options.loadOp || 'load'

    if (node.data.dirty) {
        _rebuildSpriteDrawCalls(node.data)
        node.data.dirty = false
    }

    // TODO: somehow spriteCount can be come negative?! for now just guard against this
    if (node.data.spriteCount > 0) {
        const writeLength = node.data.spriteCount * FLOAT32S_PER_SPRITE * Float32Array.BYTES_PER_ELEMENT
        device.queue.writeBuffer(node.data.spriteBuffer, 0, node.data.spriteData.buffer, 0, writeLength)
    }


    const renderpass = commandEncoder.beginRenderPass({
        colorAttachments: [
            // color
            {
                view: node.refs.color,
                clearValue: cobalt.clearValue,
                loadOp: loadOp,
                storeOp: 'store'
            },
        ]
    })

    renderpass.setPipeline(node.data.pipeline)
    renderpass.setBindGroup(0, node.data.bindGroup)
    renderpass.setVertexBuffer(0, node.refs.spritesheet.data.quads.buffer)

    // write sprite instance data into the storage buffer, sorted by sprite type. e.g.,
    //      renderpass.draw(6,  1,  0, 0)  //  1 hero instance
    //      renderpass.draw(6, 14,  6, 1)  // 14 bat instances
    //      renderpass.draw(6,  5, 12, 15) //  5 bullet instances

    // render each sprite type's instances
    const vertexCount = 6
    let baseInstanceIdx = 0

    for (let i=0; i < node.data.instancedDrawCallCount; i++) {
        // [
        //    baseVtxIdx0, instanceCount0,
        //    baseVtxIdx1, instanceCount1,
        //    ...
        // ]
        const baseVertexIdx = node.data.instancedDrawCalls[i*2  ] * vertexCount
        const instanceCount = node.data.instancedDrawCalls[i*2+1]
        renderpass.draw(vertexCount, instanceCount, baseVertexIdx, baseInstanceIdx)
        baseInstanceIdx += instanceCount
    }

    renderpass.end()
}


// build instancedDrawCalls
function _rebuildSpriteDrawCalls (renderPass) {
    let currentSpriteType = -1
    let instanceCount = 0
    renderPass.instancedDrawCallCount = 0

    for (let i=0; i < renderPass.spriteCount; i++) {

        // 12th float is order. lower bits 0-15 are spriteType, bits 16-23 are sprite Z index
        const spriteType = renderPass.spriteData[i * FLOAT32S_PER_SPRITE + 11] & 0xFFFF

        if (spriteType !== currentSpriteType) {
            if (instanceCount > 0) {
                renderPass.instancedDrawCalls[renderPass.instancedDrawCallCount * 2]     = currentSpriteType
                renderPass.instancedDrawCalls[renderPass.instancedDrawCallCount * 2 + 1] = instanceCount
                renderPass.instancedDrawCallCount++
            }

            currentSpriteType = spriteType
            instanceCount = 0
        }

        instanceCount++
    }

    if (instanceCount > 0) {
        renderPass.instancedDrawCalls[renderPass.instancedDrawCallCount * 2]     = currentSpriteType
        renderPass.instancedDrawCalls[renderPass.instancedDrawCallCount * 2 + 1] = instanceCount
        renderPass.instancedDrawCallCount++
    }
}


function _writeOverlayBuffer (cobalt, nodeData) {
    // TODO: I think this buffer can be written just once since the overlays never change. (0,0 always top left corner)
    const zoom = 1.0 // cobalt.viewport.zoom

    // TODO: is rounding really needed here?
    const GAME_WIDTH = Math.round(cobalt.viewport.width / zoom)
    const GAME_HEIGHT = Math.round(cobalt.viewport.height / zoom)

    const projection = mat4.ortho(0,    GAME_WIDTH,   GAME_HEIGHT,    0,   -10.0,   10.0)

    // set x,y,z camera position
    vec3.set(0, 0, 0, _tmpVec3)
    const view = mat4.translation(_tmpVec3)

    cobalt.device.queue.writeBuffer(nodeData.data.uniformBuffer, 0, view.buffer)
    cobalt.device.queue.writeBuffer(nodeData.data.uniformBuffer, 64, projection.buffer)
}


function destroy (nodeData) {
    nodeData.data.instancedDrawCalls = null
    
    nodeData.data.bindGroup = null

    nodeData.data.spriteBuffer.destroy()
    nodeData.data.spriteBuffer = null

    nodeData.data.uniformBuffer.destroy()
    nodeData.data.uniformBuffer = null

    nodeData.data.spriteData = null
    nodeData.data.spriteIndices.clear()
    nodeData.data.spriteIndices = null
}

