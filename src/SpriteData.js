import { xtParser } from './deps.js'


const data = {
    load: async function () {
        //data.animationFrames = await loadSpriteAnimationFrames('assets/sprite-animation-frames.xt')
        data.layers = await loadSpriteLayers('assets/sprite-layers.xt')
        //data.animations = await loadSpriteAnimations('assets/sprite-animations.xt')
        //data.sprites = await loadSprites(`assets/sprites.xt`)
        //data.spritesheet = await loadSpriteSheet('assets/spritesheet.xt')
        return data.layers
    },
    layers: { },
    animationFrames: { },
    animations: { },
    spritesheet: { },
    sprites: { }
}


export async function loadSpriteLayers (url) {
    let result = await fetch(url)
    result = await result.text()

    const spriteLayerLineDescriptor = {
        columns: [
            {
                name: 'layer',
                type: 'string',
                optional: false,
            },
            {
                name: 'zIndex',
                type: 'int',
                optional: false,
            },
            {
                name: 'type',
                type: 'string',
                optional: false,
            },
            {
                name: 'castShadow',
                type: 'boolean',
                optional: false,
            },
            {
                name: 'receiveShadow',
                type: 'boolean',
                optional: false,
            },
        ],

        getKey: function (entry) {
            return entry.layer
        },

        getValue: function (entry) {
            return entry
        },
    }

    return xtParser(result, spriteLayerLineDescriptor)
}

/*
async function loadSpriteAnimationFrames (url) {
    let result = await fetch(url)
    result = await result.text()

    const spriteLineDescriptor = {
        columns: [
            {
                name: 'name',
                type: 'string',
                optional: false,
            },
            {
                name: 'frame',
                type: 'int',
                optional: false,
            },
            {
                name: 'frameDuration',
                type: 'float',
                optional: false,
            },
            {
                name: 'trigger',
                type: 'string',
                optional: true,
            },
        ],

        getKey: function (entry) {
            return `${entry.name}_${entry.frame}`
        },

        getValue: function (entry) {
            return entry
        },
    }

    return xtParser(result, spriteLineDescriptor)
}


async function loadSpriteAnimations (url) {
    let result = await fetch(url)
    result = await result.text()

    const animationLineDescriptor = {
        columns: [
            {
                name: 'name',
                type: 'string',
                optional: false,
            },
            {
                name: 'frameCount',
                type: 'int',
                optional: false,
            },
            {
                name: 'loop',
                type: 'boolean',
                optional: false,
            }
        ],

        getKey: function (entry) {
            return entry.name
        },

        getValue: function (entry) {
            return entry
        },
    }

    return xtParser(result, animationLineDescriptor)
}


async function loadSprites (url) {
    let result = await fetch(url)
    result = await result.text()

    const animationLineDescriptor = {
        columns: [
            {
                name: 'name',
                type: 'string',
                optional: false,
            },
            {
                name: 'offsetX',
                type: 'int',
                optional: false,
            },
            {
                name: 'offsetY',
                type: 'int',
                optional: false,
            },
            {
                name: 'width',
                type: 'int',
                optional: false,
            },
            {
                name: 'height',
                type: 'int',
                optional: false,
            },
            {
                name: 'normal',
                type: 'boolean',
                optional: false,
            },
            {
                name: 'emissive',
                type: 'boolean',
                optional: false,
            },
            {
                name: 'castShadow',
                type: 'boolean',
                optional: false,
            },
            {
                name: 'receiveShadow',
                type: 'boolean',
                optional: false,
            },
        ],

        getKey: function (entry) {
            return entry.name
        },

        getValue: function (entry) {
            return entry
        },
    }

    return xtParser(result, animationLineDescriptor)
}
*/

/*
function loadTexture(name) {
    return new Promise((resolve, reject) => {
        new THREE.TextureLoader().load(
            `assets/${name}.png`,
            (texture) => {
                texture.magFilter = THREE.NearestFilter
                texture.minFilter = THREE.NearestFilter
                texture.name = name
                resolve(texture)
            },
            undefined,
            reject
        )
    })
}
*/

/*
async function loadSpriteSheet (url) {
    let result = await fetch(url)
    result = await result.text()

    const spritesheetLineDescriptor = {
        columns: [
            {
                name: 'name',
                type: 'string',
                optional: false,
            },
            {
                name: 'u',
                type: 'float',
                optional: false,
            },
            {
                name: 'v',
                type: 'float',
                optional: false,
            },
            {
                name: 'w',
                type: 'float',
                optional: false,
            },
            {
                name: 'h',
                type: 'float',
                optional: false,
            },
        ],

        getKey: function (entry) {
            return entry.name
        },

        getValue: function (entry) {
            return entry
        }
    }

    return xtParser(result, spritesheetLineDescriptor)
}
*/


export default data
