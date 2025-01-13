import primitivesWGSL             from './primitives.wgsl'
import publicAPI                  from './public-api.js'
import { FLOAT32S_PER_SPRITE }    from './constants.js'
import round                      from 'round-half-up-symmetric'
import { mat4, mat3, vec2, vec3 } from 'wgpu-matrix'


// a graphics primitives renderer (lines, boxes, etc.)


// temporary variables, allocated once to avoid garbage collection
const _tmpVec3 = vec3.create(0, 0, 0)


export default {
    type: 'cobalt:primitives',
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
        _writeMatricesBuffer(cobalt, node)
    },

    onViewportPosition: function (cobalt, node) {
        _writeMatricesBuffer(cobalt, node)
    },

    // optional
    customFunctions: publicAPI,
}


// This corresponds to a WebGPU render pass.  It handles 1 sprite layer.
async function init (cobalt, node) {
    const { device } = cobalt

    // Define vertices and indices for your line represented as two triangles (a rectangle)
    // For example, this could represent a line segment from (10, 10) to (100, 10) with a thickness of 10 units
    // Updated vertices in normalized device coordinates (NDC)
    const vertices = new Float32Array(300000)

    const vertexBuffer = device.createBuffer({
        size: vertices.byteLength,
        usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
        //mappedAtCreation: true,
    })


    //new Float32Array(vertexBuffer.getMappedRange()).set(vertices);
    //vertexBuffer.unmap()

    const uniformBuffer = device.createBuffer({
        size: 64 * 2, // 4x4 matrix with 4 bytes per float32, times 2 matrices (view, projection)
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
    })

    // Shader modules
    const shaderModule = device.createShaderModule({
        code: primitivesWGSL,
    })

    const bindGroupLayout = device.createBindGroupLayout({
        entries: [
            {
                binding: 0,
                visibility: GPUShaderStage.VERTEX,
                buffer: { }
            },
        ],
    })

    const pipelineLayout = device.createPipelineLayout({
        bindGroupLayouts: [ bindGroupLayout ]
    })

    const bindGroup = device.createBindGroup({
        layout: bindGroupLayout,
        entries: [
            {
                binding: 0,
                resource: {
                    buffer: uniformBuffer
                }
            },
        ]
    })

    // Create render pipeline
    const pipeline = device.createRenderPipeline({
        layout: pipelineLayout,
        vertex: {
            module: shaderModule,
            entryPoint: 'vs_main',
            buffers: [{
                arrayStride: 6 * Float32Array.BYTES_PER_ELEMENT, // 2 floats per vertex position + 4 floats per vertex color
                //stepMode: 'vertex',
                attributes: [
                    // position
                    {
                        shaderLocation: 0,
                        offset: 0,
                        format: 'float32x2',
                    },
                    // color
                    {
                        shaderLocation: 1,
                        format: 'float32x4',
                        offset: 8
                    }
                ],
            }],
        },
        fragment: {
            module: shaderModule,
            entryPoint: 'fs_main',
            targets: [
                {
                    format: 'bgra8unorm',
                    blend: {
                        color: {
                            srcFactor: 'src-alpha',
                            dstFactor: 'one-minus-src-alpha',
                        },
                        alpha: {
                            srcFactor: 'zero',
                            dstFactor: 'one'
                        }
                    }
                },
            ],
        },
        primitive: {
            topology: 'triangle-list',
        },
    })


    return {
        uniformBuffer, // perspective and view matrices for the camera
        vertexBuffer,
        pipeline,
        bindGroup,

        // triangle data used to render the primitives
        vertexCount: 0,

        dirty: false, // when more stuff has been drawn and vertexBuffer needs updating
        vertices, // [ x, y, x, y, ... ]

        // saving/restoring will push/pop transforms off of this stack.
        // works very similarly to HTML Canvas's transforms.
        // https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Transformations
        transforms: [ mat3.identity() ],
    }
}


function draw (cobalt, node, commandEncoder) {

    if (node.data.vertexCount === 0) // no primitives to draw, bail
        return

    const { device } = cobalt

    if (node.data.dirty) {
        node.data.dirty = false
        const stride = 6 * Float32Array.BYTES_PER_ELEMENT // 2 floats per vertex position + 4 floats per vertex color

        let byteCount = node.data.vertexCount * stride
        if (byteCount > node.data.vertexBuffer.size) {
            console.warn('too many primitives, bailing')
            return
        }
        
        cobalt.device.queue.writeBuffer(node.data.vertexBuffer, 0, node.data.vertices.buffer, 0, byteCount)
    }

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

    renderpass.setPipeline(node.data.pipeline)
    renderpass.setBindGroup(0, node.data.bindGroup)
    renderpass.setVertexBuffer(0, node.data.vertexBuffer)
    renderpass.draw(node.data.vertexCount)  // Draw 18 vertices, forming six triangles
    renderpass.end()
}


function destroy (node) {
    node.data.vertexBuffer.destroy()
    node.data.vertexBuffer = null
    node.data.uniformBuffer.destroy()
    node.data.uniformBuffer = null
    node.data.transforms.length = 0
}


function _writeMatricesBuffer (cobalt, node) {
    const { device } = cobalt

    const GAME_WIDTH = cobalt.viewport.width / cobalt.viewport.zoom
    const GAME_HEIGHT = cobalt.viewport.height / cobalt.viewport.zoom

    //                         left          right    bottom        top     near     far
    const projection = mat4.ortho(0,    GAME_WIDTH,   GAME_HEIGHT,    0,   -10.0,   10.0)

    // TODO: 1.0 must be subtracted from both x and y values otherwise everything get shifted down and to the right
    //       when rendered.  This is true for both sdl and browser backed rendering.  I don't understand why though!!
    vec3.set(-cobalt.viewport.position[0] - 1.0, -cobalt.viewport.position[1] - 1.0 , 0, _tmpVec3)
    
    const view = mat4.translation(_tmpVec3)

    device.queue.writeBuffer(node.data.uniformBuffer, 0, view.buffer)
    device.queue.writeBuffer(node.data.uniformBuffer, 64, projection.buffer)
}
