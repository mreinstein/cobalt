//import * as SpriteRenderPass   from './SpriteRenderPass.js'
import { FLOAT32S_PER_SPRITE } from './constants.js'


// a graphics primitives renderer (lines, boxes, etc.)


/*
Sprites are typically dynamic; they can move, they are animated, they can be colored, rotated etc.

These use a `SpriteRenderPass` data structure which allows for dynamically adding/removing/updating sprites at run time.

Internally, `SpriteRenderPass` objects are rendered as instanced triangles.
Adding and removing sprites pre-sorts all triangles based on they layer they're on + the type of sprite they are.
This lines up the data nicely for WebGpu such that they don't require any work in the render loop.

Each type of sprite is rendered as 2 triangles, with a number instances for each sprite.
This instance data is transfered to the GPU, which is then calculated in the shaders (position, rotation, scale, tinting, opacity, etc.)

All of the matrix math for these sprites is done in a vertex shader, so they are fairly efficient to move, color and rotate, but it's not free.
There is still some CPU required as the number of sprites increases.
*/

export default {
    type: 'primitives',
    refs: [
        { name: 'color', type: 'textView', format: 'rgba8unorm', access: 'write' },
    ],

    // cobalt event handling functions

    // @params Object cobalt renderer world object
    // @params Object options optional data passed when initing this node
    onInit: async function (cobalt, options={}) {
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
    },

    onViewportPosition: function (cobalt, node) {

    },

    // optional
    customFunctions: {
        /*...SpriteRenderPass,*/
    },
}


// This corresponds to a WebGPU render pass.  It handles 1 sprite layer.
async function init (cobalt, nodeData) {
    const { device } = cobalt

    // Define vertices and indices for your line represented as two triangles (a rectangle)
    // For example, this could represent a line segment from (10, 10) to (100, 10) with a thickness of 10 units
    // Updated vertices in normalized device coordinates (NDC)
    const vertices = new Float32Array([
        // First line (horizontal)
        -0.8, -0.15, // Bottom left
        -0.2, -0.15, // Bottom right
        -0.8, -0.05, // Top left
        -0.8, -0.05, // Top left
        -0.2, -0.15, // Bottom right
        -0.2, -0.05, // Top right
        
        // Second line (vertical)
        0.15, 0.1,  // Bottom left
        0.25, 0.1,  // Bottom right
        0.15, 0.7,  // Top left
        0.15, 0.7,  // Top left
        0.25, 0.1,  // Bottom right
        0.25, 0.7,  // Top right
        
        // Third line (diagonal, adjusted for visibility)
        -0.55, -0.45, // Bottom left (slightly left and down from start point)
        -0.45, -0.55, // Top left (slightly up and left from start point)
         0.45,  0.55, // Bottom right (slightly right and up from end point)
        -0.45, -0.55, // Top left (repeat for second triangle)
         0.55,  0.45, // Top right (slightly right and down from end point)
         0.45,  0.55, // Bottom right (repeat for second triangle)
    ]);


    const vertexBuffer = device.createBuffer({
        size: vertices.byteLength,
        usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
        mappedAtCreation: true,
    });
    new Float32Array(vertexBuffer.getMappedRange()).set(vertices);
    vertexBuffer.unmap();

    // Shader modules
    const shaderModule = device.createShaderModule({
        code: `
        @vertex
        fn vs_main(@location(0) position: vec2<f32>) -> @builtin(position) vec4<f32> {
            // Transform position here if necessary
            return vec4<f32>(position, 0.0, 1.0);
        }

        @fragment
        fn fs_main() -> @location(0) vec4<f32> {
            return vec4<f32>(1.0, 0.0, 0.0, 1.0); // Red color for the line
        }
        `,
    });

    // Create render pipeline
    const pipeline = device.createRenderPipeline({
        layout: 'auto',
        vertex: {
            module: shaderModule,
            entryPoint: 'vs_main',
            buffers: [{
                arrayStride: 2 * Float32Array.BYTES_PER_ELEMENT, // 2 floats per vertex
                attributes: [{
                    shaderLocation: 0,
                    offset: 0,
                    format: 'float32x2',
                }],
            }],
        },
        fragment: {
            module: shaderModule,
            entryPoint: 'fs_main',
            targets: [{ format: 'bgra8unorm' }],
        },
        primitive: {
            topology: 'triangle-list',
        },
    });


    return {
        vertexBuffer,
        pipeline,
    }
}


function draw (cobalt, node, commandEncoder) {
    const { device } = cobalt

    const loadOp = node.options.loadOp || 'load'

    const renderpass = commandEncoder.beginRenderPass({
        colorAttachments: [
            // color
            {
                view: node.refs.color, //node.refs.color.data.view,
                clearValue: cobalt.clearValue,
                loadOp,
                storeOp: 'store'
            }
        ]
    })

    renderpass.setPipeline(node.data.pipeline);
    renderpass.setVertexBuffer(0, node.data.vertexBuffer);
    renderpass.draw(18); // Draw 6 vertices, forming two triangles
    renderpass.end();
}


function destroy (nodeData) {
    nodeData.data.vertexBuffer.destroy()
    nodeData.data.vertexBuffer = null
}

