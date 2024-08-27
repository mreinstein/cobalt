import testWGSL       from './test.wgsl'
import * as publicAPI from './public-api.js'


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
        // runs when the viewport size changes (handle resizing textures, etc.)
        resize(cobalt, node)
    },

    onViewportPosition: function (cobalt, node) {
        // runs when the viewport position changes
    },

    // optional
    customFunctions: {
        ...publicAPI,
    },
}


async function init (cobalt, node) {

    const { device } = cobalt

    // a 2048x2048 light texture with 4 channels (rgba) with each light lighting a 256x256 region can hold 256 lights
    //const MAX_LIGHT_COUNT = 256


    const bindGroupLayout = device.createBindGroupLayout({
        entries: [
            {
                binding: 0,
                visibility: GPUShaderStage.FRAGMENT,
                texture:  { }
            },
            {
                binding: 1,
                visibility: GPUShaderStage.FRAGMENT,
                sampler: { }
            }
        ],
    })

    const bindGroup = device.createBindGroup({
        layout: bindGroupLayout,
        entries: [
            {
                binding: 0,
                resource: node.refs.in.data.view
            },
            {
                binding: 1,
                resource: node.refs.in.data.sampler
            }
        ]
    })

    const pipelineLayout = device.createPipelineLayout({
        bindGroupLayouts: [ bindGroupLayout ]
    })

    const pipeline = device.createRenderPipeline({
        label: 'lights-shadows',
        vertex: {
            module: device.createShaderModule({
                code: testWGSL
            }),
            entryPoint: 'vs_main'
        },

        fragment: {
            module: device.createShaderModule({
                code: testWGSL
            }),
            entryPoint: 'fs_main',
            targets: [
                {
                    format: 'rgba16float',
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
                }
            ]
        },

        primitive: {
            topology: 'triangle-list'
        },

        layout: pipelineLayout
    })

    return {
        bindGroupLayout,
        bindGroup,
        pipeline,

        lights: [ ], // light config
    }
}


function draw (cobalt, node, commandEncoder) {
    const { device } = cobalt

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

    renderpass.setPipeline(node.data.pipeline)

    renderpass.setBindGroup(0, node.data.bindGroup)

    renderpass.draw(3)

    renderpass.end()
}


function destroy (node) {
    // TODO: cleanup WebGpu buffers, etc. here
}


function resize (cobalt, node) {
    const { device } = cobalt

    // re-build the bind group
    node.data.bindGroup = device.createBindGroup({
        layout: node.data.bindGroupLayout,
        entries: [
            {
                binding: 0,
                resource: node.refs.in.data.view
            },
            {
                binding: 1,
                resource: node.refs.in.data.sampler
            }
        ]
    })
}