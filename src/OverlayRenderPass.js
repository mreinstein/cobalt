import uuid                    from './uuid.js'
import { vec4 }                from './deps.js'
import { FLOAT32S_PER_SPRITE } from './constants.js'


const _tmpVec4 = vec4.create()


// this corresponds to a WebGPU render pass.  It may handle 1 or more sprite layers.
export function create (renderer, minLayer, maxLayer) {
    const device = renderer.device

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
        layout: renderer.overlay.bindGroupLayout,
        entries: [
            {
                binding: 0,
                resource: {
                    buffer: renderer.overlay.uniformBuffer
                }
            },
            {
                binding: 1,
                resource: renderer.sprite.material.view
            },
            {
                binding: 2,
                resource: renderer.sprite.material.sampler
            },
            {
                binding: 3,
                resource: {
                    buffer: spriteBuffer
                }
            },
        ]
    })

    return {
        type: 'overlay',

        // layer range this render pass is responsible for drawing.
        minLayer,
        maxLayer,

        id: uuid(),

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


export function destroy (c, rp) {
    const device = c.device

    rp.instancedDrawCalls = null
    
    rp.bindGroup = null

    rp.spriteBuffer.destroy()
    rp.spriteBuffer = null

    rp.spriteData = null
    rp.spriteIndices.clear()
    rp.spriteIndices = null
}
