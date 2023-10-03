import * as SpriteRenderPass   from './SpriteRenderPass.js'
import { FLOAT32S_PER_SPRITE } from './constants.js'


// an emissive sprite renderer

export default {
    type: 'sprite',
    refs: [
        { name: 'spritesheet', type: 'customResource', access: 'read' },
        { name: 'hdr', type: 'webGpuTextureFrameView', format: 'rgba16float', access: 'write' },
        { name: 'emissive', type: 'webGpuTextureFrameView', format: 'rgba16float', access: 'write' },
    ],

    // cobalt event handling functions

    // @params Object cobalt renderer world object
    // @params Object options optional data passed when initing this node
    onInit: async function (cobalt, options={}) {
        return init(cobalt, options)
    },

    onRun: function (cobalt, nodeData, webGpuCommandEncoder, runCount) {
        // do whatever you need for this node. webgpu renderpasses, etc.
        draw(cobalt, nodeData, webGpuCommandEncoder, runCount)
    },

    onDestroy: function (cobalt, data) {
        // any cleanup for your node should go here (releasing textures, etc.)
        destroy(data)
    },

    onResize: function (cobalt, data) {
        // do whatever you need when the dimensions of the renderer change (resize textures, etc.)
    },

    onViewportPosition: function (cobalt, data) {
    },

    // optional
    customFunctions: {
        ...SpriteRenderPass,
    },
}


// This corresponds to a WebGPU render pass.  It handles 1 sprite layer.
async function init (cobalt, nodeData) {
    const { canvas, device } = cobalt
    
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

    // instanced sprite data (scale, translation, tint, opacity, rotation, emissiveIntensity)
    const spriteBuffer = device.createBuffer({
        size: (translateSize + scaleSize + tintSize + opacitySize) * numInstances, // 4x4 matrix with 4 bytes per float32, per instance
        usage: GPUBufferUsage.VERTEX | GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
        //mappedAtCreation: true,
    })

    const bindGroup = device.createBindGroup({
        layout: cobalt.resources.spritesheet.data.bindGroupLayout,
        entries: [
            {
                binding: 0,
                resource: {
                    buffer: cobalt.resources.spritesheet.data.uniformBuffer
                }
            },
            {
                binding: 1,
                resource: cobalt.resources.spritesheet.data.colorTexture.view
            },
            {
                binding: 2,
                resource: cobalt.resources.spritesheet.data.colorTexture.sampler
            },
            {
                binding: 3,
                resource: {
                    buffer: spriteBuffer
                }
            },
            {
                binding: 4,
                resource: cobalt.resources.spritesheet.data.emissiveTexture.view
            },
        ]
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

        bindGroup,
        spriteBuffer,

        // actual sprite instance data. ordered by layer, then sprite type
        // this is used to update the spriteBuffer.
        spriteData: new Float32Array(MAX_SPRITE_COUNT * FLOAT32S_PER_SPRITE), 
        spriteCount: 0,

        spriteIndices: new Map(), // key is spriteId, value is insert index of the sprite. e.g., 0 means 1st sprite , 1 means 2nd sprite, etc.

        // when a sprite is changed the renderpass is dirty, and should have it's instance data copied to the gpu
        dirty: false,
    }
}


// @param Integer runCount  how many nodes in the graph have been run already
function draw (cobalt, nodeData, commandEncoder, runCount) {
    const { device } = cobalt

    // on the first render, we should clear the color attachment.
    // otherwise load it, so multiple sprite passes can build up data in the color and emissive textures
	const loadOp = (runCount === 0) ? 'clear' : 'load'

    if (nodeData.data.dirty) {
        _rebuildSpriteDrawCalls(nodeData.data)
        nodeData.data.dirty = false
    }

    device.queue.writeBuffer(nodeData.data.spriteBuffer, 0, nodeData.data.spriteData.buffer)

    const renderpass = commandEncoder.beginRenderPass({
        colorAttachments: [
            // color
            {
                view: cobalt.resources.hdr.data.value.view,
                clearValue: cobalt.clearValue,
                loadOp,
                storeOp: 'store'
            },

            // emissive
            {
                view: cobalt.resources.emissive.data.value.view,
                clearValue: cobalt.clearValue,
                // TODO: why less than 2?? what crazy ass magic number is this??
                loadOp: 'clear', //(actualSpriteRenderCount < 2) ? 'clear' : 'load',
                storeOp: 'store'
            }
        ]
    })

    renderpass.setPipeline(cobalt.resources.spritesheet.data.pipeline)
    renderpass.setBindGroup(0, nodeData.data.bindGroup)
    renderpass.setVertexBuffer(0, cobalt.resources.spritesheet.data.quads.buffer)

    // write sprite instance data into the storage buffer, sorted by sprite type. e.g.,
    //      renderpass.draw(6,  1,  0, 0)  //  1 hero instance
    //      renderpass.draw(6, 14,  6, 1)  // 14 bat instances
    //      renderpass.draw(6,  5, 12, 15) //  5 bullet instances

    // render each sprite type's instances
    const vertexCount = 6
    let baseInstanceIdx = 0

    for (let i=0; i < nodeData.data.instancedDrawCallCount; i++) {
        // [
        //    baseVtxIdx0, instanceCount0,
        //    baseVtxIdx1, instanceCount1,
        //    ...
        // ]
        const baseVertexIdx = nodeData.data.instancedDrawCalls[i*2  ] * vertexCount
        const instanceCount = nodeData.data.instancedDrawCalls[i*2+1]
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


function destroy (nodeData) {
    nodeData.data.instancedDrawCalls = null
    
    nodeData.data.bindGroup = null

    nodeData.data.spriteBuffer.destroy()
    nodeData.data.spriteBuffer = null

    nodeData.data.spriteData = null
    nodeData.data.spriteIndices.clear()
    nodeData.data.spriteIndices = null
}


async function fetchJson (url) {
    const raw = await fetch(url)
    return raw.json()
}

