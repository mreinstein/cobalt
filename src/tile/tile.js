import createTextureFromBuffer from '../create-texture-from-buffer.js'
import createTextureFromUrl    from '../create-texture-from-url.js'
import getPreferredFormat      from '../get-preferred-format.js'


/*
Tile layers are totally static, and there are usually many of them in a grid, in several layers.

These use a `TileRenderPass` data structure which provides 100% GPU hardware based tile rendering, making them _almost_ free CPU-wise.

Internally, `TileRenderPass` objects store 1 or more layers, which hold a reference to a sprite texture, and a layer texture.
When a tile layer is drawn, it loads the 2 textures into the gpu.
One of these textures is a lookup table, where each pixel corresponds to a type of sprite.
Because this processing can happen completely in the fragment shader, there's no need to do expensive loops over slow arrays in js land, which is the typical approach for current state-of-the-art web renderers.

Inspired by/ported from https://blog.tojicode.com/2012/07/sprite-tile-maps-on-gpu.html
*/


export default {
    type: 'cobalt:tile',
    refs: [
        { name: 'tileAtlas', type: 'textureView', format: 'rgba8unorm', access: 'write' },
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
        destroy(node)
    },

    onResize: function (cobalt, node) {
        // do whatever you need when the dimensions of the renderer change (resize textures, etc.)
    },

    onViewportPosition: function (cobalt, node) {
    },

    // optional
    customFunctions: {
        setTexture: async function (cobalt, node, textureUrl) {
            const { canvas, device } = cobalt

            destroy(node)

            const format = getPreferredFormat(cobalt)

            let material

            if (canvas) {
                // browser (canvas) path
                node.options.textureUrl = textureUrl
                material = await createTextureFromUrl(cobalt, 'tile map', node.options.textureUrl, format)
            }
            else {
                // sdl + gpu path
                material = await createTextureFromBuffer(cobalt, 'tile map', node.options.texture, format)
            }

            const bindGroup = device.createBindGroup({
                layout: node.refs.tileAtlas.data.tileBindGroupLayout,
                entries: [
                    {
                        binding: 0,
                        resource: {
                            buffer: node.data.uniformBuffer
                        }
                    },
                    {
                        binding: 1,
                        resource: material.view
                    },
                    {
                        binding: 2,
                        resource: material.sampler
                    },
                ]
            })

            node.data.bindGroup = bindGroup
            node.data.material = material
        },
    },
}


async function init (cobalt, nodeData) {
    const { device } = cobalt

    // build the tile layer and add it to the cobalt data structure
    const material = await createTextureFromUrl(cobalt, 'tile map', nodeData.options.textureUrl)

    const dat = new Float32Array([ nodeData.options.scrollScale, nodeData.options.scrollScale ])

    const usage = GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST

    const descriptor = {
        size: dat.byteLength,
        usage,
        // make this memory space accessible from the CPU (host visible)
        mappedAtCreation: true
    }

    const uniformBuffer = device.createBuffer(descriptor)
    new Float32Array(uniformBuffer.getMappedRange()).set(dat)
    uniformBuffer.unmap()

    const bindGroup = device.createBindGroup({
        layout: nodeData.refs.tileAtlas.data.tileBindGroupLayout,
        entries: [
            {
                binding: 0,
                resource: {
                    buffer: uniformBuffer
                }
            },
            {
                binding: 1,
                resource: material.view
            },
            {
                binding: 2,
                resource: material.sampler
            },
        ]
    })

    return {
        bindGroup,
        material,
        uniformBuffer,
        scrollScale: nodeData.options.scrollScale,
    }
}


function draw (cobalt, nodeData, commandEncoder) {

    const { device } = cobalt

    // on the first render, we should clear the color attachment.
    // otherwise load it, so multiple sprite passes can build up data in the color and emissive textures
    const loadOp = nodeData.options.loadOp || 'load'

	const renderpass = commandEncoder.beginRenderPass({
        label: 'tile',
        colorAttachments: [
            {
                view: nodeData.refs.hdr.data.view,
                clearValue: cobalt.clearValue,
                loadOp,
                storeOp: 'store'
            }
        ]
    })

    const tileAtlas = nodeData.refs.tileAtlas.data

    renderpass.setPipeline(tileAtlas.pipeline)

    renderpass.setBindGroup(0, nodeData.data.bindGroup)

    // common stuff; the transform data and the tile atlas texture
    renderpass.setBindGroup(1, tileAtlas.atlasBindGroup)

    renderpass.draw(3) // fullscreen triangle

    renderpass.end()
}


function destroy (nodeData) {
    nodeData.data.material.texture.destroy()
    nodeData.data.material.texture = undefined
}

