import createTexture from '../create-texture.js'
import getPreferredFormat from '../get-preferred-format.js'

// Frame buffer textures automatically resize to match the cobalt viewport.

export default {
    type: 'fbTexture',
    refs: [],

    // @params Object cobalt renderer world object
    // @params Object options optional data passed when initing this node
    onInit: async function (cobalt, options = {}) {
        return init(cobalt, options)
    },

    onRun: function (cobalt, node, webGpuCommandEncoder) {
        // do whatever you need for this node. webgpu renderpasses, etc.
    },

    onDestroy: function (cobalt, node) {
        // any cleanup for your node should go here (releasing textures, etc.)
        destroy(data)
    },

    onResize: function (cobalt, node) {
        // do whatever you need when the dimensions of the renderer change (resize textures, etc.)
        resize(cobalt, node)
    },

    onViewportPosition: function (cobalt, node) {},
}

async function init(cobalt, node) {
    const { device } = cobalt

    node.options.format =
        node.options.format === 'PREFERRED_TEXTURE_FORMAT'
            ? getPreferredFormat(cobalt)
            : node.options.format

    const { format, label, mip_count, usage, viewportScale } = node.options

    return createTexture(
        device,
        label,
        cobalt.viewport.width * viewportScale,
        cobalt.viewport.height * viewportScale,
        mip_count,
        format,
        usage,
    )
}

function destroy(node) {
    // destroy the existing texture before we re-create it to avoid leaking memory
    node.data.texture.destroy()
}

function resize(cobalt, node) {
    const { device } = cobalt
    destroy(node)
    const { width, height } = cobalt.viewport
    const { options } = node
    const scale = node.options.viewportScale
    node.data = createTexture(
        device,
        options.label,
        width * scale,
        height * scale,
        options.mip_count,
        options.format,
        options.usage,
    )
}
