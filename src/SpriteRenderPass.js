import sortedBinaryInsert      from './sorted-binary-insert.js'
import uuid                    from './uuid.js'
import { FLOAT32S_PER_SPRITE } from './constants.js'


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
            },
            {
                binding: 4,
                resource: renderer.sprite.emissiveTexture.view
            },
        ]
    })

    return {
        type: 'sprite',

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


// returns a unique identifier for the created sprite
export function addSprite (c, name, position, width, height, scale, tint, opacity, rotation, zIndex) {

    const renderPass = c.renderPasses.find((rp) => rp.type !== 'tile' && rp.minLayer <= zIndex && rp.maxLayer >= zIndex)

    if (!renderPass)
        throw new Error(`Unable to add sprite; zIndex ${zIndex} not declared in layers`)

    const spriteType = c.sprite.spritesheet.locations.indexOf(name)

    // find the place in our spriteData where this sprite belongs.
    const insertIdx = sortedBinaryInsert(zIndex, spriteType, renderPass)

    // shift down all the data in spriteData from insertIdx to spriteCount-1
    // https://stackoverflow.com/questions/35563529/how-to-copy-typedarray-into-another-typedarray
    const offset = (insertIdx + 1) * FLOAT32S_PER_SPRITE
    renderPass.spriteData.set(
        renderPass.spriteData.subarray(insertIdx * FLOAT32S_PER_SPRITE, renderPass.spriteCount * FLOAT32S_PER_SPRITE),
        offset
    )

    copySpriteDataToBuffer(c.sprite.spritesheet, renderPass, insertIdx, name, position, width, height, scale, tint, opacity, rotation, zIndex)

    // shift down all of the sprite indices
    for (const [ spriteId, idx] of renderPass.spriteIndices)
        if (idx >= insertIdx)
            renderPass.spriteIndices.set(spriteId, idx+1)

    // store the location of this sprite's data in the renderPass's float32array so that we can 
    // reference it later, when we need to remove or update this sprite component
    const spriteId = uuid()

    c.sprite.renderPassLookup.set(spriteId, renderPass)
    renderPass.spriteIndices.set(spriteId, insertIdx)

    renderPass.spriteCount++

    renderPass.dirty = true
    
    return spriteId
}


export function removeSprite (c, spriteId) {
    const renderPass = c.sprite.renderPassLookup.get(spriteId)

    if (!renderPass)
        throw new Error(`Unable to remove sprite; spriteId ${spriteId} could not be found in any render passes`)

    const removeIdx = renderPass.spriteIndices.get(spriteId)

    // shift up all of the sprites after the remove location by 1
    for (const [ spriteId, idx] of renderPass.spriteIndices)
        if (idx > removeIdx)
            renderPass.spriteIndices.set(spriteId, idx-1)

    // shift up all the data in spriteData from removeIdx to spriteCount-1
    // https://stackoverflow.com/questions/35563529/how-to-copy-typedarray-into-another-typedarray
    let offset = removeIdx * FLOAT32S_PER_SPRITE
    renderPass.spriteData.set(
        renderPass.spriteData.subarray((removeIdx + 1) * FLOAT32S_PER_SPRITE, renderPass.spriteCount * FLOAT32S_PER_SPRITE),
        offset
    )

    renderPass.spriteIndices.delete(spriteId)

    c.sprite.renderPassLookup.delete(spriteId)

    renderPass.spriteCount--

    renderPass.dirty = true
}


export function setSpriteName (c, spriteId, name, scale) {
    const renderPass = c.sprite.renderPassLookup.get(spriteId)

    if (!renderPass)
        throw new Error(`Unable to update sprite name; spriteId ${spriteId} could not be found in any render passes`)

    const spriteType = c.sprite.spritesheet.locations.indexOf(name)

    const SPRITE_WIDTH = c.sprite.spritesheet.spriteMeta[name].w
    const SPRITE_HEIGHT = c.sprite.spritesheet.spriteMeta[name].h

    const spriteIdx = renderPass.spriteIndices.get(spriteId)
    const offset = spriteIdx * FLOAT32S_PER_SPRITE

    renderPass.spriteData[offset+2] = SPRITE_WIDTH * scale[0]
    renderPass.spriteData[offset+3] = SPRITE_HEIGHT * scale[1]

    // 12th float is order. lower bits 0-15 are spriteType, bits 16-23 are sprite Z index
    const zIndex = renderPass.spriteData[offset + 11] >> 16 & 0xFF

    // sortValue is used to sort the sprite by layer, then sprite type
    //   zIndex      0-255 (8 bits)
    //   spriteType  0-65,535 (16 bits)
    const sortValue = (zIndex << 16 & 0xFF0000) | (spriteType & 0xFFFF)
    renderPass.spriteData[offset+11] = sortValue

    renderPass.dirty = true
}


export function setSpritePosition (c, spriteId, position) {
    const renderPass = c.sprite.renderPassLookup.get(spriteId)

    if (!renderPass)
        throw new Error(`Unable to update sprite position; spriteId ${spriteId} could not be found in any render passes`)

    const spriteIdx = renderPass.spriteIndices.get(spriteId)
    const offset = spriteIdx * FLOAT32S_PER_SPRITE

    renderPass.spriteData[offset]   = position[0]
    renderPass.spriteData[offset+1] = position[1]

    renderPass.dirty = true
}


export function setSpriteTint (c, spriteId, tint) {
    const renderPass = c.sprite.renderPassLookup.get(spriteId)

    if (!renderPass)
        throw new Error(`Unable to update sprite tint; spriteId ${spriteId} could not be found in any render passes`)
    
    const spriteIdx = renderPass.spriteIndices.get(spriteId)
    const offset = spriteIdx * FLOAT32S_PER_SPRITE

    renderPass.spriteData[offset+4] = tint[0]
    renderPass.spriteData[offset+5] = tint[1]
    renderPass.spriteData[offset+6] = tint[2]
    renderPass.spriteData[offset+7] = tint[3]
    
    renderPass.dirty = true
}


export function setSpriteOpacity (c, spriteId, opacity) {
    const renderPass = c.sprite.renderPassLookup.get(spriteId)

    if (!renderPass)
        throw new Error(`Unable to update sprite opacity; spriteId ${spriteId} could not be found in any render passes`)

    const spriteIdx = renderPass.spriteIndices.get(spriteId)
    const offset = spriteIdx * FLOAT32S_PER_SPRITE

    renderPass.spriteData[offset+8] = opacity

    renderPass.dirty = true
}


export function setSpriteRotation (c, spriteId, rotation) {
    const renderPass = c.sprite.renderPassLookup.get(spriteId)

    if (!renderPass)
        throw new Error(`Unable to update sprite rotation; spriteId ${spriteId} could not be found in any render passes`)
    
    const spriteIdx = renderPass.spriteIndices.get(spriteId)
    const offset = spriteIdx * FLOAT32S_PER_SPRITE

    renderPass.spriteData[offset+9] = rotation
    renderPass.dirty = true
}


export function setSprite (c, spriteId, name, position, width, height, scale, tint, opacity, rotation, zIndex) {
    const renderPass = c.sprite.renderPassLookup.get(spriteId)

    if (!renderPass)
        throw new Error(`Unable to update sprite rotation; spriteId ${spriteId} could not be found in any render passes`)

    const spriteIdx = renderPass.spriteIndices.get(spriteId)
    copySpriteDataToBuffer(c.sprite.spritesheet, renderPass, spriteIdx, name, position, width, height, scale, tint, opacity, rotation, zIndex)

    renderPass.dirty = true
}


// copy sprite data into the webgpu renderpass
function copySpriteDataToBuffer (spritesheet, renderPass, insertIdx, name, position, width, height, scale, tint, opacity, rotation, zIndex) {
    const offset = insertIdx * FLOAT32S_PER_SPRITE

    const SPRITE_WIDTH = spritesheet.spriteMeta[name].w
    const SPRITE_HEIGHT = spritesheet.spriteMeta[name].h

    // sortValue is used to sort the sprite by layer, then sprite type
    //   layer       can be a value up to 255 (8 bits)
    //   spriteType  can be a value up to 65,535 (16 bits)
    const spriteType = spritesheet.locations.indexOf(name)
    const sortValue = (zIndex << 16 & 0xFF0000) | (spriteType & 0xFFFF)

    renderPass.spriteData[offset]   = position[0]
    renderPass.spriteData[offset+1] = position[1]
    renderPass.spriteData[offset+2] = SPRITE_WIDTH * scale[0]
    renderPass.spriteData[offset+3] = SPRITE_HEIGHT * scale[1]
    renderPass.spriteData[offset+4] = tint[0]
    renderPass.spriteData[offset+5] = tint[1]
    renderPass.spriteData[offset+6] = tint[2]
    renderPass.spriteData[offset+7] = tint[3]
    renderPass.spriteData[offset+8] = opacity
    renderPass.spriteData[offset+9] = rotation
    // we used to set emissive intensity per-sprite, but now we use the alpha channel in the emissions texure,
    // which enables us to adjust emission strength on a per-pixel basis. Copying it into the sprite data is a leftover
    //renderPass.spriteData[offset+10] = emissiveIntensity
    renderPass.spriteData[offset+11] = sortValue
}
