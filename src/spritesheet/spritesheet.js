import createTextureFromBuffer from '../create-texture-from-buffer.js'
import createTextureFromUrl    from '../create-texture-from-url.js'
import readSpriteSheet         from './read-spritesheet.js'


// shared spritesheet resource, used by each sprite render node

export default {
    type: 'cobalt:spritesheet',
    refs: [ ],

    // @params Object cobalt renderer world object
    // @params Object options optional data passed when initing this node
    onInit: async function (cobalt, options={}) {
        return init(cobalt, options)
    },

    onRun: function (cobalt, node, webGpuCommandEncoder) { },

    onDestroy: function (cobalt, node) {
        // any cleanup for your node should go here (releasing textures, etc.)
        destroy(node)
    },

    onResize: function (cobalt, node) { },

    onViewportPosition: function (cobalt, node) { },
}


// configure the common settings for sprite rendering
async function init (cobalt, node) {
    const { canvas, device } = cobalt

    let spritesheet, colorTexture, emissiveTexture

    const format = node.options.format || 'rgba8unorm'

    if (canvas) {
        // browser (canvas) path
        spritesheet = await fetch(node.options.spriteSheetJsonUrl)
        spritesheet = await spritesheet.json()
        spritesheet = readSpriteSheet(spritesheet)

        colorTexture = await createTextureFromUrl(cobalt, 'sprite', node.options.colorTextureUrl, format)
        emissiveTexture = await createTextureFromUrl(cobalt, 'emissive sprite', node.options.emissiveTextureUrl, format)
        
        // for some reason this needs to be done _after_ creating the material, or the rendering will be blurry
        canvas.style.imageRendering = 'pixelated'
    }
    else {
        // sdl + gpu path
        spritesheet = readSpriteSheet(node.options.spriteSheetJson)

        colorTexture = await createTextureFromBuffer(cobalt, 'sprite', node.options.colorTexture, format)
        emissiveTexture = await createTextureFromBuffer(cobalt, 'emissive sprite', node.options.emissiveTexture, format)
    }

    // Map sprite name → ID
    const idByName = new Map(spritesheet.names.map((n,i)=>[n,i]))
    
    return {
        colorTexture,
        emissiveTexture,
        spritesheet,
        idByName,
    }
}


function destroy (node) {
    node.data.quads.buffer.destroy()
    node.data.colorTexture.buffer.destroy()
    node.data.emissiveTexture.texture.destroy()
}
