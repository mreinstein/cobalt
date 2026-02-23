import getPreferredFormat from '../get-preferred-format.js'
import { DisplacementComposition } from './displacement-composition.js'
import { DisplacementParametersBuffer } from './displacement-parameters-buffer.js'
import { DisplacementTexture } from './displacement-texture.js'
import { TrianglesBuffer } from './triangles-buffer.js'

// adapted to webgpu from https://github.com/pixijs/pixijs/tree/dev/packages/filter-displacement

/**
 * Refs:
 *   color (textureView, bgra8unorm, read) - input framebuffer texture with the scene drawn
 *   map (cobaltTexture, bgra8unorm, read) - displacement map (perlin noise texture works well here)
 *   out (textureView, bgra8unorm, write) - result texture
 */
export default {
    type: 'cobalt:displacement',

    // cobalt event handling functions

    // @params Object cobalt renderer world object
    // @params Object options optional data passed when initing this node
    onInit: async function (cobalt, options = {}) {
        return init(cobalt, options)
    },

    onRun: function (cobalt, node, webGpuCommandEncoder) {
        // do whatever you need for this node. webgpu renderpasses, etc.
        draw(cobalt, node, webGpuCommandEncoder)
    },

    onDestroy: function (cobalt, node) {
        // any cleanup for your node should go here (releasing textures, etc.)
        destroy(node)
    },

    onResize: function (cobalt, node) {
        // do whatever you need when the dimensions of the renderer change (resize textures, etc.)
        node.data.displacementTexture.resize(cobalt.viewport.width, cobalt.viewport.height)

        node.data.displacementComposition.setColorTextureView(node.refs.color.data.view)
        node.data.displacementComposition.setNoiseMapTextureView(node.refs.map.view)
        node.data.displacementComposition.setDisplacementTextureView(
            node.data.displacementTexture.getView(),
        )
    },

    onViewportPosition: function (cobalt, node) {
        node.data.displacementTexture.setViewport(cobalt.viewport)
    },

    // optional
    customFunctions: {
        addTriangle: function (cobalt, node, triangleVertices) {
            return node.data.trianglesBuffer.addTriangle(triangleVertices)
        },

        removeTriangle: function (cobalt, node, triangleId) {
            node.data.trianglesBuffer.removeTriangle(triangleId)
        },

        setPosition: function (cobalt, node, triangleId, triangleVertices) {
            node.data.trianglesBuffer.setTriangle(triangleId, triangleVertices)
        },
    },
}

// This corresponds to a WebGPU render pass.  It handles 1 sprite layer.
async function init(cobalt, node) {
    const { device } = cobalt

    const displacementParameters = new DisplacementParametersBuffer({
        device,
        initialParameters: {
            offsetX: node.options.offseyX ?? 0,
            offsetY: node.options.offseyY ?? 0,
            scale: node.options.scale ?? 20,
        },
    })

    const MAX_SPRITE_COUNT = 256 // max number of displacement sprites in this render pass

    const trianglesBuffer = new TrianglesBuffer({
        device,
        maxSpriteCount: MAX_SPRITE_COUNT,
    })

    const displacementTexture = new DisplacementTexture({
        device,

        width: cobalt.viewport.width,
        height: cobalt.viewport.height,

        blurFactor: 8,

        trianglesBuffer,
    })

    const displacementComposition = new DisplacementComposition({
        device,
        targetFormat: getPreferredFormat(cobalt),

        colorTextureView: node.refs.color.data.view,
        noiseMapTextureView: node.refs.map.view,
        displacementTextureView: displacementTexture.getView(),

        displacementParametersBuffer: displacementParameters,
    })

    return {
        displacementParameters,
        displacementTexture,
        displacementComposition,
        trianglesBuffer,
    }
}

function draw(cobalt, node, commandEncoder) {
    const spriteCount = node.data.trianglesBuffer.spriteCount

    if (spriteCount === 0) return

    node.data.trianglesBuffer.update()

    node.data.displacementTexture.update(commandEncoder)

    const renderpass = commandEncoder.beginRenderPass({
        label: 'displacement',
        colorAttachments: [
            {
                view: node.refs.out,
                clearValue: cobalt.clearValue,
                loadOp: 'load',
                storeOp: 'store',
            },
        ],
    })
    renderpass.executeBundles([node.data.displacementComposition.getRenderBundle()])
    renderpass.end()
}

function destroy(node) {
    node.data.trianglesBuffer.destroy()
    node.data.trianglesBuffer = null

    node.data.displacementParameters.destroy()
    node.data.displacementParameters = null

    node.data.displacementTexture.destroy()
    node.data.displacementTexture = null

    node.data.displacementComposition.destroy()
    node.data.displacementComposition = null
}
