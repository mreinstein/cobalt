import { vec2, vec4 } from 'wgpu-matrix'
import uuid from '../uuid.js'

// returns a unique identifier for the created sprite
export function addSprite(cobalt, renderPass, name, position, scale, tint, opacity, rotation) {
    const { idByName } = renderPass.refs.spritesheet.data

    renderPass.data.sprites.push({
        position: vec2.clone(position),
        sizeX: 1,
        sizeY: 1,
        scale: vec2.clone(scale),
        rotation,
        opacity,
        tint: vec4.clone(tint),
        spriteID: idByName.get(name),
        id: uuid(),
    })

    return renderPass.data.sprites.at(-1).id
}

export function removeSprite(cobalt, renderPass, id) {
    for (let i = 0; i < renderPass.data.sprites.length; i++) {
        if (renderPass.data.sprites[i].id === id) {
            renderPass.data.sprites.splice(i, 1)
            return
        }
    }
}

// remove all sprites
export function clear(cobalt, renderPass) {
    renderPass.data.sprites.length = 0
}

export function setSpriteName(cobalt, renderPass, id, name) {
    const sprite = renderPass.data.sprites.find((s) => s.id === id)

    if (!sprite) return

    const { idByName } = renderPass.refs.spritesheet.data

    sprite.spriteID = idByName.get(name)
}

export function setSpritePosition(cobalt, renderPass, id, position) {
    const sprite = renderPass.data.sprites.find((s) => s.id === id)
    if (!sprite) return

    vec2.copy(position, sprite.position)
}

export function setSpriteTint(cobalt, renderPass, id, tint) {
    const sprite = renderPass.data.sprites.find((s) => s.id === id)
    if (!sprite) return

    vec4.copy(tint, sprite.tint)
}

export function setSpriteOpacity(cobalt, renderPass, id, opacity) {
    const sprite = renderPass.data.sprites.find((s) => s.id === id)
    if (!sprite) return

    sprite.opacity = opacity
}

export function setSpriteRotation(cobalt, renderPass, id, rotation) {
    const sprite = renderPass.data.sprites.find((s) => s.id === id)
    if (!sprite) return

    sprite.rotation = rotation
}

export function setSpriteScale(cobalt, renderPass, id, scale) {
    const sprite = renderPass.data.sprites.find((s) => s.id === id)
    if (!sprite) return

    vec2.copy(scale, sprite.scale)
}
