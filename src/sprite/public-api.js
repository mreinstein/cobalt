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
    const sprites = renderPass.data.sprites
    for (let i = 0; i < sprites.length; i++) {
        if (sprites[i].id === id) {
            sprites[i] = sprites[sprites.length - 1]
            sprites.pop()
            return
        }
    }
}

// remove all sprites
export function clear(cobalt, renderPass) {
    renderPass.data.sprites.length = 0
}

export function setSpriteName(cobalt, renderPass, id, name) {
    const sprites = renderPass.data.sprites
    const len = sprites.length

    for (let i = 0; i < len; i++) {
        if (sprites[i].id === id) {
            sprites[i].spriteID = renderPass.refs.spritesheet.data.idByName.get(name)
            return
        }
    }
}

export function setSpritePosition(cobalt, renderPass, id, position) {
    const sprites = renderPass.data.sprites
    const len = sprites.length

    for (let i = 0; i < len; i++) {
        if (sprites[i].id === id) {
            vec2.copy(position, sprites[i].position)
            return
        }
    }
}

export function setSpriteTint(cobalt, renderPass, id, tint) {
    const sprites = renderPass.data.sprites
    const len = sprites.length

    for (let i = 0; i < len; i++) {
        if (sprites[i].id === id) {
            vec4.copy(tint, sprites[i].tint)
            return
        }
    }
}

export function setSpriteOpacity(cobalt, renderPass, id, opacity) {
    const sprites = renderPass.data.sprites
    const len = sprites.length

    for (let i = 0; i < len; i++) {
        if (sprites[i].id === id) {
            sprites[i].opacity = opacity
            return
        }
    }
}

export function setSpriteRotation(cobalt, renderPass, id, rotation) {
    const sprites = renderPass.data.sprites
    const len = sprites.length

    for (let i = 0; i < len; i++) {
        if (sprites[i].id === id) {
            sprites[i].rotation = rotation
            return
        }
    }
}

export function setSpriteScale(cobalt, renderPass, id, scale) {
    const sprites = renderPass.data.sprites
    const len = sprites.length

    for (let i = 0; i < len; i++) {
        if (sprites[i].id === id) {
            vec2.copy(scale, sprites[i].scale)
            return
        }
    }
}
