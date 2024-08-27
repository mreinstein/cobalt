import blitWGSL from './fb-blit.wgsl'


// blit a source texture into a destination texture

export default {
    type: 'cobalt:fbBlit',
    refs: [
        { name: 'in', type: 'cobaltTexture', format: 'bgra8unorm', access: 'read' },
        { name: 'out', type: 'cobaltTexture', format: 'bgra8unorm', access: 'write' },
    ],

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
    },

    onResize: function (cobalt, node) {
        // do whatever you need when the dimensions of the renderer change (resize textures, etc.)
        resize(cobalt, node)
    },

    onViewportPosition: function (cobalt, node) { },
}


async function init (cobalt, node) {
    const { device } = cobalt

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
        label: 'fb-blit',
        vertex: {
            module: device.createShaderModule({
                code: blitWGSL
            }),
            entryPoint: 'vs_main',
            buffers: [ /*quad.bufferLayout*/ ]
        },

        fragment: {
            module: device.createShaderModule({
                code: blitWGSL
            }),
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
    }
}


function draw (cobalt, node, commandEncoder) {
    const { device } = cobalt
    
    const renderpass = commandEncoder.beginRenderPass({
        colorAttachments: [
            {
                view: node.refs.out,
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
