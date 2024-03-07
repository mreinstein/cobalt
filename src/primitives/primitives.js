import primitivesWGSL              from './primitives.wgsl'
import { FLOAT32S_PER_SPRITE }     from './constants.js'
import { round, mat4, vec2, vec3 } from '../deps.js'


// a graphics primitives renderer (lines, boxes, etc.)


// temporary variables, allocated once to avoid garbage collection
const _tmpVec3 = vec3.create(0, 0, 0)


// return component of vector perpendicular to a unit basis vector
// (IMPORTANT NOTE: assumes "basis" has unit magnitude (length==1))
function perpendicularComponent (inp) {
    return [ -inp[1], inp[0] ]
}


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
        _writeMatricesBuffer(cobalt, node)
    },

    onViewportPosition: function (cobalt, node) {
        _writeMatricesBuffer(cobalt, node)
    },

    // optional
    customFunctions: {
        addLine: function (cobalt, node, start, end, color, lineWidth=1) {
            
            const delta = vec2.sub(end, start)

            const unitBasis = vec2.normalize(delta)
            const perp = perpendicularComponent(unitBasis)

            const halfLineWidth = lineWidth / 2
            
            let i = node.data.vertexCount * 6 // 2 floats position + 4 floats color per vertex

            // triangle 1
            // pt 1
            node.data.vertices[i + 0] = start[0] + perp[0] * halfLineWidth
            node.data.vertices[i + 1] = start[1] + perp[1] * halfLineWidth

            // pt1 color
            node.data.vertices[i + 2] = color[0]
            node.data.vertices[i + 3] = color[1]
            node.data.vertices[i + 4] = color[2]
            node.data.vertices[i + 5] = color[3]

            // pt 2
            node.data.vertices[i + 6] = start[0] - perp[0] * halfLineWidth
            node.data.vertices[i + 7] = start[1] - perp[1] * halfLineWidth

            // pt2 color
            node.data.vertices[i + 8] = color[0]
            node.data.vertices[i + 9] = color[1]
            node.data.vertices[i + 10] = color[2]
            node.data.vertices[i + 11] = color[3]

            // pt 3
            node.data.vertices[i + 12] = end[0] + perp[0] * halfLineWidth
            node.data.vertices[i + 13] = end[1] + perp[1] * halfLineWidth

            // pt3 color
            node.data.vertices[i + 14] = color[0]
            node.data.vertices[i + 15] = color[1]
            node.data.vertices[i + 16] = color[2]
            node.data.vertices[i + 17] = color[3]
            

            // triangle 2
            // pt 2
            node.data.vertices[i + 18] = start[0] - perp[0] * halfLineWidth
            node.data.vertices[i + 19] = start[1] - perp[1] * halfLineWidth

            // pt2 color
            node.data.vertices[i + 20] = color[0]
            node.data.vertices[i + 21] = color[1]
            node.data.vertices[i + 22] = color[2]
            node.data.vertices[i + 23] = color[3]
            
            // pt 3
            node.data.vertices[i + 24] = end[0] + perp[0] * halfLineWidth
            node.data.vertices[i + 25] = end[1] + perp[1] * halfLineWidth

            // pt3 color
            node.data.vertices[i + 26] = color[0]
            node.data.vertices[i + 27] = color[1]
            node.data.vertices[i + 28] = color[2]
            node.data.vertices[i + 29] = color[3]

            // pt 4
            node.data.vertices[i + 30] = end[0] - perp[0] * halfLineWidth
            node.data.vertices[i + 31] = end[1] - perp[1] * halfLineWidth

            // pt4 color
            node.data.vertices[i + 32] = color[0]
            node.data.vertices[i + 33] = color[1]
            node.data.vertices[i + 34] = color[2]
            node.data.vertices[i + 35] = color[3]


            node.data.vertexCount += 6

            cobalt.device.queue.writeBuffer(node.data.vertexBuffer, 0, node.data.vertices.buffer)
        },

        addEllipse: function (cobalt, node, center, width, height, numSegments, color) {

            const [ x, y ] = center

            // angle between each segment
            const deltaAngle = 2 * Math.PI / numSegments

            // Generate points for the ellipsoid
            for (let i = 0; i < numSegments; i++) {
                // Angle for this and the next segment
                const angle = i * deltaAngle
                const nextAngle = (i + 1) * deltaAngle

                // Calculate x and y for the current and next points on the ellipse
                const currX = x + width * Math.cos(angle)
                const currY = y + height * Math.sin(angle)
                const nextX = x + width * Math.cos(nextAngle)
                const nextY = y + height * Math.sin(nextAngle)

                // Add vertices for the triangles (first point is always the center)
                // First triangle vertex (center of ellipse)

                const vi = (node.data.vertexCount * 6) + (i * 18)

                //const vi = v * 6 // 2 floats position + 4 floats color per vertex * 3 vertices


                // position
                node.data.vertices[vi + 0] = x
                node.data.vertices[vi + 1] = y

                // color
                node.data.vertices[vi + 2] = color[0]
                node.data.vertices[vi + 3] = color[1]
                node.data.vertices[vi + 4] = color[2]
                node.data.vertices[vi + 5] = color[3]
                

                // Second triangle vertex (current point on ellipse)
            
                // position
                node.data.vertices[vi + 6] = currX
                node.data.vertices[vi + 7] = currY

                // color
                node.data.vertices[vi + 8] = color[0]
                node.data.vertices[vi + 9] = color[1]
                node.data.vertices[vi + 10] = color[2]
                node.data.vertices[vi + 11] = color[3]

                
                // Third triangle vertex (next point on ellipse)
                // position
                node.data.vertices[vi + 12] = nextX
                node.data.vertices[vi + 13] = nextY

                // color
                node.data.vertices[vi + 14] = color[0]
                node.data.vertices[vi + 15] = color[1]
                node.data.vertices[vi + 16] = color[2]
                node.data.vertices[vi + 17] = color[3]
            }

            node.data.vertexCount += (3 * numSegments)

            cobalt.device.queue.writeBuffer(node.data.vertexBuffer, 0, node.data.vertices.buffer)
        },

        clear: function (cobalt, node) {
            node.data.vertexCount = 0
        },
    },
}


// This corresponds to a WebGPU render pass.  It handles 1 sprite layer.
async function init (cobalt, node) {
    const { device } = cobalt

    // Define vertices and indices for your line represented as two triangles (a rectangle)
    // For example, this could represent a line segment from (10, 10) to (100, 10) with a thickness of 10 units
    // Updated vertices in normalized device coordinates (NDC)
    const vertices = new Float32Array(10000) // up to 5,000 vertices

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
        vertices, // x, y, x, y, ...
    }
}


function draw (cobalt, node, commandEncoder) {

    if (node.data.vertexCount === 0) // no primitives to draw, bail
        return

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
}


function _writeMatricesBuffer (cobalt, node) {
    const { device } = cobalt

    // TODO: achieve zoom instead by adjusting the left/right/bottom/top based on scale factor?
    //                out    left   right    bottom   top     near     far
    //mat4.ortho(projection,    0,    800,      600,    0,   -10.0,   10.0)

    const GAME_WIDTH = cobalt.viewport.width / cobalt.viewport.zoom
    const GAME_HEIGHT = cobalt.viewport.height / cobalt.viewport.zoom

    //                         left          right    bottom        top     near     far
    const projection = mat4.ortho(0,    GAME_WIDTH,   GAME_HEIGHT,    0,   -10.0,   10.0)


    //mat4.scale(projection, projection, [1.5, 1.5, 1 ])

    // set x,y,z camera position
    vec3.set(-round(cobalt.viewport.position[0]), -round(cobalt.viewport.position[1]), 0, _tmpVec3)
    const view = mat4.translation(_tmpVec3)

    // might be useful if we ever switch to a 3d perspective camera setup
    //mat4.lookAt(view, [0, 0, 0], [0, 0, -1], [0, 1, 0])
    //mat4.targetTo(view, [0, 0, 0], [0, 0, -1], [0, 1, 0])

    // camera zoom
    //mat4.scale(view, view, [ 0.9, 0.9, 1 ])

    //mat4.fromScaling(view, [ 1.5, 1.5, 1 ])
    //mat4.translate(view, view, [ 0, 0, 0 ])

    device.queue.writeBuffer(node.data.uniformBuffer, 0, view.buffer)
    device.queue.writeBuffer(node.data.uniformBuffer, 64, projection.buffer)
}

