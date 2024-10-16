import sortedBinaryInsert      from './sorted-binary-insert.js'
import uuid                    from '../uuid.js'
import { FLOAT32S_PER_SPRITE } from './constants.js'


// returns a unique identifier for the created sprite
export function addSprite (cobalt, renderPass, name, position, scale, tint, opacity, rotation, zIndex) {

    const spritesheet = renderPass.refs.spritesheet.data.spritesheet
    renderPass = renderPass.data

    const spriteType = spritesheet.locations.indexOf(name)

    // find the place in our spriteData where this sprite belongs.
    const insertIdx = sortedBinaryInsert(zIndex, spriteType, renderPass)

    // shift down all the data in spriteData from insertIdx to spriteCount-1
    // https://stackoverflow.com/questions/35563529/how-to-copy-typedarray-into-another-typedarray
    const offset = (insertIdx + 1) * FLOAT32S_PER_SPRITE
    renderPass.spriteData.set(
        renderPass.spriteData.subarray(insertIdx * FLOAT32S_PER_SPRITE, renderPass.spriteCount * FLOAT32S_PER_SPRITE),
        offset
    )

    copySpriteDataToBuffer(renderPass, spritesheet, insertIdx, name, position, scale, tint, opacity, rotation, zIndex)

    // shift down all of the sprite indices
    for (const [ spriteId, idx ] of renderPass.spriteIndices)
        if (idx >= insertIdx)
            renderPass.spriteIndices.set(spriteId, idx+1)

    // store the location of this sprite's data in the renderPass's float32array so that we can 
    // reference it later, when we need to remove or update this sprite component
    const spriteId = uuid()

    renderPass.spriteIndices.set(spriteId, insertIdx)
    renderPass.spriteCount++
    renderPass.dirty = true

    return spriteId
}


export function removeSprite (cobalt, renderPass, spriteId) {
    renderPass = renderPass.data
    const removeIdx = renderPass.spriteIndices.get(spriteId)

    // shift up all of the sprites after the remove location by 1
    for (const [ spriteId, idx ] of renderPass.spriteIndices)
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
    renderPass.spriteCount--
    renderPass.dirty = true
}


// remove all sprites
export function clear (cobalt, renderPass) {
    renderPass = renderPass.data
    renderPass.spriteIndices.clear()
    renderPass.spriteCount = 0
    renderPass.instancedDrawCallCount = 0
    renderPass.dirty = true
}


export function setSpriteName (cobalt, renderPass, spriteId, name, scale) {
    const spritesheet = renderPass.refs.spritesheet.data.spritesheet
    renderPass = renderPass.data

    const spriteType = spritesheet.locations.indexOf(name)

    const SPRITE_WIDTH = spritesheet.spriteMeta[name].w
    const SPRITE_HEIGHT = spritesheet.spriteMeta[name].h

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


export function setSpritePosition (cobalt, renderPass, spriteId, position) {
    renderPass = renderPass.data

    const spriteIdx = renderPass.spriteIndices.get(spriteId)
    const offset = spriteIdx * FLOAT32S_PER_SPRITE

    renderPass.spriteData[offset]   = position[0]
    renderPass.spriteData[offset+1] = position[1]

    renderPass.dirty = true
}


export function setSpriteTint (cobalt, renderPass, spriteId, tint) {
    renderPass = renderPass.data

    const spriteIdx = renderPass.spriteIndices.get(spriteId)
    const offset = spriteIdx * FLOAT32S_PER_SPRITE

    renderPass.spriteData[offset+4] = tint[0]
    renderPass.spriteData[offset+5] = tint[1]
    renderPass.spriteData[offset+6] = tint[2]
    renderPass.spriteData[offset+7] = tint[3]
    
    renderPass.dirty = true
}


export function setSpriteOpacity (cobalt, renderPass, spriteId, opacity) {
    renderPass = renderPass.data

    const spriteIdx = renderPass.spriteIndices.get(spriteId)
    const offset = spriteIdx * FLOAT32S_PER_SPRITE

    renderPass.spriteData[offset+8] = opacity

    renderPass.dirty = true
}


export function setSpriteRotation (cobalt, renderPass, spriteId, rotation) {
    renderPass = renderPass.data

    const spriteIdx = renderPass.spriteIndices.get(spriteId)
    const offset = spriteIdx * FLOAT32S_PER_SPRITE

    renderPass.spriteData[offset+9] = rotation
    renderPass.dirty = true
}


export function setSpriteScale (cobalt, renderPass, spriteId, name, scale) {
    renderPass = renderPass.data

    const spriteIdx = renderPass.spriteIndices.get(spriteId)
    const offset = spriteIdx * FLOAT32S_PER_SPRITE

    const SPRITE_WIDTH = spritesheet.spriteMeta[name].w
    const SPRITE_HEIGHT = spritesheet.spriteMeta[name].h

    renderPass.spriteData[offset+2] = SPRITE_WIDTH * scale[0]
    renderPass.spriteData[offset+3] = SPRITE_HEIGHT * scale[1]

    renderPass.dirty = true
}


export function setSprite (cobalt, renderPass, spriteId, name, position, scale, tint, opacity, rotation, zIndex) {
    const spritesheet = renderPass.refs.spritesheet.data.spritesheet
    renderPass = renderPass.data

    const spriteIdx = renderPass.spriteIndices.get(spriteId)
    copySpriteDataToBuffer(renderPass, spritesheet, spriteIdx, name, position, scale, tint, opacity, rotation, zIndex)

    renderPass.dirty = true
}


// copy sprite data into the webgpu renderpass
function copySpriteDataToBuffer (renderPass, spritesheet, insertIdx, name, position, scale, tint, opacity, rotation, zIndex) {
    
    if (!spritesheet.spriteMeta[name])
        throw new Error(`Sprite name ${name} could not be found in the spritesheet metaData`)

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
