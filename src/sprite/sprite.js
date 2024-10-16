import * as publicAPI          from '../sprite/public-api.js'
import { FLOAT32S_PER_SPRITE } from './constants.js'


// an emissive sprite renderer


/*
Sprites are typically dynamic; they can move, they are animated, they can be colored, rotated etc.

These use a `SpriteRenderPass` data structure which allows for dynamically adding/removing/updating sprites at run time.

Internally, `SpriteRenderPass` objects are rendered as instanced triangles.
Adding and removing sprites pre-sorts all triangles based on they layer they're on + the type of sprite they are.
This lines up the data nicely for WebGpu such that they don't require any work in the render loop.

Each type of sprite is rendered as 2 triangles, with a number instances for each sprite.
This instance data is transfered to the GPU, which is then calculated in the shaders (position, rotation, scale, tinting, opacity, etc.)

All of the matrix math for these sprites is done in a vertex shader, so they are fairly efficient to move, color and rotate, but it's not free.
There is still some CPU required as the number of sprites increases.
*/

export default {
    type: 'cobalt:sprite',
    refs: [
        { name: 'spritesheet', type: 'customResource', access: 'read' },
        { name: 'hdr', type: 'textureView', format: 'rgba16float', access: 'write' },
        { name: 'emissive', type: 'textureView', format: 'rgba16float', access: 'write' },
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
        // do whatever you need when the dimensions of the renderer change (resize textures, etc.)
    },

    onViewportPosition: function (cobalt, node) {
    },

    // optional
    customFunctions: {
        ...publicAPI,
    },
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

    // instanced sprite data (scale, translation, tint, opacity, rotation, emissiveIntensity)
    const spriteBuffer = device.createBuffer({
        size: (translateSize + scaleSize + tintSize + opacitySize) * numInstances, // 4x4 matrix with 4 bytes per float32, per instance
        usage: GPUBufferUsage.VERTEX | GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
        //mappedAtCreation: true,
    })

    const spritesheet = nodeData.refs.spritesheet.data

    const bindGroup = device.createBindGroup({
        layout: nodeData.refs.spritesheet.data.bindGroupLayout,
        entries: [
            {
                binding: 0,
                resource: {
                    buffer: spritesheet.uniformBuffer
                }
            },
            {
                binding: 1,
                resource: spritesheet.colorTexture.view
            },
            {
                binding: 2,
                resource: spritesheet.colorTexture.sampler
            },
            {
                binding: 3,
                resource: {
                    buffer: spriteBuffer
                }
            },
            {
                binding: 4,
                resource: spritesheet.emissiveTexture.view
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


function draw (cobalt, node, commandEncoder) {
    const { device } = cobalt

    // on the first render, we should clear the color attachment.
    // otherwise load it, so multiple sprite passes can build up data in the color and emissive textures
	const loadOp = node.options.loadOp || 'load'

    if (node.data.dirty) {
        _rebuildSpriteDrawCalls(node.data)
        node.data.dirty = false
    }

    device.queue.writeBuffer(node.data.spriteBuffer, 0, node.data.spriteData.buffer)

    const renderpass = commandEncoder.beginRenderPass({
        colorAttachments: [
            // color
            {
                view: node.refs.hdr.data.view,
                clearValue: cobalt.clearValue,
                loadOp,
                storeOp: 'store'
            },

            // emissive
            {
                view: node.refs.emissive.data.view,
                clearValue: cobalt.clearValue,
                loadOp: 'clear',
                storeOp: 'store'
            }
        ]
    })

    renderpass.setPipeline(node.refs.spritesheet.data.pipeline)
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


function destroy (node) {
    node.data.instancedDrawCalls = null
    
    node.data.bindGroup = null

    node.data.spriteBuffer.destroy()
    node.data.spriteBuffer = null

    node.data.spriteData = null
    node.data.spriteIndices.clear()
    node.data.spriteIndices = null
}


async function fetchJson (url) {
    const raw = await fetch(url)
    return raw.json()
}

