import createTexture from '../create-texture.js'


// Frame buffer textures automatically resize to match the cobalt viewport.

export default {
    type: 'fbTexture',
    refs: [ ],

    // @params Object cobalt renderer world object
    // @params Object options optional data passed when initing this node
    onInit: async function (cobalt, options={}) {
        return init(cobalt, options)
    },

    onRun: function (cobalt, nodeData, webGpuCommandEncoder) {
        // do whatever you need for this node. webgpu renderpasses, etc.
    },

    onDestroy: function (cobalt, data) {
        // any cleanup for your node should go here (releasing textures, etc.)
        destroy(data)
    },

    onResize: function (cobalt, data) {
        // do whatever you need when the dimensions of the renderer change (resize textures, etc.)
        resize(cobalt, data)
    },

    onViewportPosition: function (cobalt, data) {

    },
}


async function init (cobalt, nodeData) {
    const { device } = cobalt

    const { label, mip_count, format, usage, viewportScale } = nodeData.options

    return createTexture(device, label, cobalt.viewport.width * viewportScale, cobalt.viewport.height * viewportScale, mip_count, format, usage)
}


function destroy (cobalt, nodeData) {
    // destroy the existing texture before we re-create it to avoid leaking memory
    nodeData.data.texture.destroy()
}


function resize (cobalt, nodeData) {
    const { device } = cobalt
	destroy(cobalt, nodeData)
    const { width, height } = cobalt.viewport
    const { options } = nodeData
    const scale = nodeData.options.viewportScale
    nodeData.data = createTexture(device, options.label, width * scale, height * scale, options.mip_count, options.format, options.usage)
}
