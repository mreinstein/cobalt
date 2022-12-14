import sortedBinaryInsert from './sorted-binary-insert.js'
import toWorld            from './transform-to-world.js'
import { vec4 }           from './deps.js'


const FLOAT32S_PER_SPRITE = 12 // translate + scale + tint + opacity 

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

    const opacityFloatCount = 4 // vec4. technically we only need 1 float but that screws up data alignment in the shader
    const opacitySize = Float32Array.BYTES_PER_ELEMENT * opacityFloatCount  // in bytes

    // instanced sprite data (scale, translation, tint, opacity, rotation)
    const spriteBuffer = device.createBuffer({
        size: (translateSize + scaleSize + tintSize + opacitySize) * numInstances, // 4x4 matrix with 4 bytes per float32, per instance
        usage: GPUBufferUsage.VERTEX | GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
        //mappedAtCreation: true,
    })

    const bindGroup = device.createBindGroup({
        layout: renderer.sprite.bindGroupLayout,
        entries: [
            {
                binding: 0,
                resource: {
                    buffer: renderer.sprite.uniformBuffer
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
            }
        ]
    })

    return {
        type: 'sprite',

        // layer range this render pass is responsible for drawing.
        minLayer,
        maxLayer,

        // instancedDrawCalls is used to actually perform draw calls within the render pass
        // layout is interleaved with baseVtxIdx (the sprite type), and instanceCount (how many sprites)
        // [
        //    baseVtxIdx0, instanceCount0,
        //    baseVtxIdx1, instanceCount1,
        //    ...
        // ]
        instancedDrawCalls: new Uint32Array(MAX_SPRITE_COUNT * 2),
        instancedDrawCallCount: 0,

        // stores a reference to a sprite component so it can be used to update the sprite as needed
        // [ sprite0Component, sprite1Component, ... ]
        spriteEntities: new Array(MAX_SPRITE_COUNT),

        bindGroup,
        spriteBuffer,

        // actual sprite instance data. ordered by layer, then sprite type
        // this is used to update the spriteBuffer.
        spriteData: new Float32Array(MAX_SPRITE_COUNT * FLOAT32S_PER_SPRITE), 
        spriteCount: 0,

        // when a sprite is changed the renderpass is dirty, and should have it's instance data
        // copied to the gpu
        dirty: false,
    }
}


export function addSprite (renderer, spriteEntity) {
    const renderPass = renderer.renderPasses[renderer.renderPassLookup[spriteEntity.sprite.layer]]

    // find the place in our spriteData where this sprite belongs.
    const insertIdx = sortedBinaryInsert(spriteEntity, renderPass.spriteEntities, renderPass.spriteCount)

    // shift down all of the sprites after the insert location by 1
    for (let i=renderPass.spriteCount-1; i >= insertIdx; i--) {
        renderPass.spriteEntities[i+1] = renderPass.spriteEntities[i]
        renderPass.spriteEntities[i+1].sprite.dataIndex += 1
    }

    renderPass.spriteEntities[insertIdx] = spriteEntity

    // shift down all the data in spriteData from insertIdx to spriteCount-1
    // https://stackoverflow.com/questions/35563529/how-to-copy-typedarray-into-another-typedarray
    const offset = (insertIdx + 1) * FLOAT32S_PER_SPRITE
    renderPass.spriteData.set(
        renderPass.spriteData.subarray(insertIdx * FLOAT32S_PER_SPRITE, renderPass.spriteCount * FLOAT32S_PER_SPRITE),
        offset
    )

    copySpriteDataToBuffer(renderer.sprite.spritesheet, spriteEntity, renderPass, insertIdx)
    
    // store the location of this sprite's data in the renderer's float32array so that we can 
    // reference it later, when we need to remove or update this sprite component
    spriteEntity.sprite.dataIndex = insertIdx

    renderPass.spriteCount++

    renderPass.dirty = true
}


export function removeSprite (renderer, spriteEntity) {
    const renderPass = renderer.renderPasses[renderer.renderPassLookup[spriteEntity.sprite.layer]]

    const removeIdx = spriteEntity.sprite.dataIndex

    // shift up all of the sprites after the insert location by 1
    for (let i=removeIdx; i < renderPass.spriteCount-1; i++) {
        renderPass.spriteEntities[i] = renderPass.spriteEntities[i+1]
        renderPass.spriteEntities[i].sprite.dataIndex -= 1
    }

    // shift up all the data in spriteData from removeIdx to spriteCount-1
    // https://stackoverflow.com/questions/35563529/how-to-copy-typedarray-into-another-typedarray
    let offset = removeIdx * FLOAT32S_PER_SPRITE
    renderPass.spriteData.set(
        renderPass.spriteData.subarray((removeIdx + 1) * FLOAT32S_PER_SPRITE, renderPass.spriteCount * FLOAT32S_PER_SPRITE),
        offset
    )

    renderPass.spriteCount--

    renderPass.dirty = true
}


export function updateSprite (renderer, spriteEntity) {
    const renderPass = renderer.renderPasses[renderer.renderPassLookup[spriteEntity.sprite.layer]]
    copySpriteDataToBuffer(renderer.sprite.spritesheet, spriteEntity, renderPass, spriteEntity.sprite.dataIndex)
    renderPass.dirty = true
}


export function updateSpriteAnimation (renderer, spriteEntity) {
    const renderPass = renderer.renderPasses[renderer.renderPassLookup[spriteEntity.sprite.layer]]
    const SPRITE_WIDTH = renderer.sprite.spritesheet.spriteMeta[spriteEntity.sprite.name].w
    const SPRITE_HEIGHT = renderer.sprite.spritesheet.spriteMeta[spriteEntity.sprite.name].h

    const offset = spriteEntity.sprite.dataIndex * FLOAT32S_PER_SPRITE

    renderPass.spriteData[offset]   = spriteEntity.transform.position[0]
    renderPass.spriteData[offset+1] = spriteEntity.transform.position[1]
    renderPass.spriteData[offset+2] = SPRITE_WIDTH * spriteEntity.sprite.scale[0]
    renderPass.spriteData[offset+3] = SPRITE_HEIGHT * spriteEntity.sprite.scale[1]
    
    renderPass.dirty = true
}


export function updateSpriteRotation (renderer, spriteEntity) {
    const renderPass = renderer.renderPasses[renderer.renderPassLookup[spriteEntity.sprite.layer]]
    const offset = spriteEntity.sprite.dataIndex * FLOAT32S_PER_SPRITE

    renderPass.spriteData[offset+9] = spriteEntity.sprite.rotation
}


// copy data from the ECS based sprite entity into the webgpu renderpass
function copySpriteDataToBuffer (spritesheet, spriteEntity, renderPass, insertIdx) {
    const offset = insertIdx * FLOAT32S_PER_SPRITE
    //  TODO: handle linked relativeTo fields in transform

    const SPRITE_WIDTH = spritesheet.spriteMeta[spriteEntity.sprite.name].w
    const SPRITE_HEIGHT = spritesheet.spriteMeta[spriteEntity.sprite.name].h

    // recurse down through the data structure to follow relativeTo as far as it'll go
    // e.g., text characters are relativeTo textEntity, textEntity is relativeTo npcEntity
    toWorld(_tmpVec4, spriteEntity.transform)

    renderPass.spriteData[offset]   = _tmpVec4[0]
    renderPass.spriteData[offset+1] = _tmpVec4[1]
    renderPass.spriteData[offset+2] = SPRITE_WIDTH * spriteEntity.sprite.scale[0]
    renderPass.spriteData[offset+3] = SPRITE_HEIGHT * spriteEntity.sprite.scale[1]
    renderPass.spriteData[offset+4] = spriteEntity.sprite.tint[0]
    renderPass.spriteData[offset+5] = spriteEntity.sprite.tint[1]
    renderPass.spriteData[offset+6] = spriteEntity.sprite.tint[2]
    renderPass.spriteData[offset+7] = spriteEntity.sprite.tint[3]
    renderPass.spriteData[offset+8] = spriteEntity.sprite.opacity
    renderPass.spriteData[offset+9] = spriteEntity.sprite.rotation
}
