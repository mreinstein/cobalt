import * as publicAPI from './public-api.js'
import { Viewport } from "./viewport";
import { LightsRenderer } from './lights-renderer.js';


/**
 * 2D lighting and Shadows
 */

export default {
    type: 'cobalt:light',

    // the inputs and outputs to this node
    refs: [
        { name: 'in', type: 'textureView', format: 'rgba16float', access: 'read' },
        { name: 'out', type: 'textureView', format: 'rgba16float', access: 'write' },
    ],

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
        // runs when the viewport size changes (handle resizing textures, etc.)
        resize(cobalt, node)
    },

    onViewportPosition: function (cobalt, node) {
        // runs when the viewport position changes
        node.data.viewport.setCenter(...cobalt.viewport.position);
    },

    // optional
    customFunctions: {
        ...publicAPI,
    },
}


async function init(cobalt, node) {

    const { device } = cobalt

    // a 2048x2048 light texture with 4 channels (rgba) with each light lighting a 256x256 region can hold 256 lights
    //const MAX_LIGHT_COUNT = 256

    const viewport = new Viewport({
        canvasSize: {
            width: cobalt.viewport.width,
            height: cobalt.viewport.height,
        },
        center: cobalt.viewport.position,
        zoom: cobalt.viewport.zoom,
    });

    const lightsRenderer = new LightsRenderer({
        device,
        albedo: {
            view: node.refs.in.data.view,
            sampler: node.refs.in.data.sampler
        },
        targetTexture: node.refs.out.data.texture,
    });

    return {
        lightsRenderer,
        viewport,

        lights: [], // light config
    }
}


function draw(cobalt, node, commandEncoder) {
    // TODO: put all the renderpass logic in here
    /*
    lighting pseudo code:
        draw lights to light texture
        draw shadow projections to light texture
        combine input texture and light texture into output texture
    */

    const renderpass = commandEncoder.beginRenderPass({
        colorAttachments: [
            {
                view: node.refs.out.data.view,
                clearValue: cobalt.clearValue,
                loadOp: 'load',
                storeOp: 'store'
            }
        ]
    })

    const viewMatrix = node.data.viewport.viewMatrix;
    const lightsRenderer = node.data.lightsRenderer;
    lightsRenderer.render(renderpass, viewMatrix);

    renderpass.end()
}

function destroy(node) {
    // TODO: cleanup WebGpu buffers, etc. here
}

function resize(cobalt, node) {
    node.data.lightsRenderer.setAlbedo({
        view: node.refs.in.data.view,
        sampler: node.refs.in.data.sampler
    });

    node.data.viewport.setCanvasSize(cobalt.viewport.width, cobalt.viewport.height);
}
