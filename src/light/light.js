import * as publicAPI from './public-api.js'
import { Viewport } from "./viewport";
import { LightsRenderer } from './lights-renderer.js';
import { LightsBuffer } from './lights-buffer.js';


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
        node.data.viewport.setTopLeft(...cobalt.viewport.position);
    },

    // optional
    customFunctions: {
        ...publicAPI,
    },
}


async function init(cobalt, node) {

    const { device } = cobalt

    // a 2048x2048 light texture with 4 channels (rgba) with each light lighting a 256x256 region can hold 256 lights
    const MAX_LIGHT_COUNT = 256;
    const MAX_LIGHT_SIZE = 256;
    const lightsBuffer = new LightsBuffer(device, MAX_LIGHT_COUNT);

    const viewport = new Viewport({
        viewportSize: {
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
        lightsBuffer,
        lightsTextureProperties: {
            resolutionPerLight: MAX_LIGHT_SIZE,
            maxLightSize: MAX_LIGHT_SIZE,
            antialiased: false,
            filtering: "nearest",
        },
    });

    return {
        lightsBuffer,
        lightsBufferNeedsUpdate: true,

        lightsTextureNeedsUpdate: true,
        lightsRenderer,

        viewport,

        lights: [],
    }
}


function draw(cobalt, node, commandEncoder) {
    if (node.data.lightsBufferNeedsUpdate) {
        const lightsBuffer = node.data.lightsBuffer;
        lightsBuffer.setLights(node.data.lights);
        node.data.lightsBufferNeedsUpdate = false;
        node.data.lightsTextureNeedsUpdate = true;
    }

    const lightsRenderer = node.data.lightsRenderer;

    if (node.data.lightsTextureNeedsUpdate) {
        lightsRenderer.computeLightsTexture(commandEncoder);
        node.data.lightsTextureNeedsUpdate = false;
    }

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

    node.data.viewport.setZoom(cobalt.viewport.zoom);
    const invertVpMatrix = node.data.viewport.invertViewProjectionMatrix;
    lightsRenderer.render(renderpass, invertVpMatrix);

    renderpass.end()
}

function destroy(node) {
    node.data.lightsBuffer.destroy();
    node.data.lightsRenderer.destroy();
}

function resize(cobalt, node) {
    node.data.lightsRenderer.setAlbedo({
        view: node.refs.in.data.view,
        sampler: node.refs.in.data.sampler
    });

    node.data.viewport.setViewportSize(cobalt.viewport.width, cobalt.viewport.height);
}
