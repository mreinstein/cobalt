import createTextureFromUrl from '../create-texture-from-url.js'


export default {
    type: 'tile',
    refs: [
        { name: 'tileAtlas', type: 'webGpuTextureFrameView', format: 'rgba8unorm', access: 'write' },
    ],

    // @params Object cobalt renderer world object
    // @params Object options optional data passed when initing this node
    onInit: async function (cobalt, options={}) {
        return init(cobalt, options)
    },

    onRun: function (cobalt, nodeData, webGpuCommandEncoder) {
        // do whatever you need for this node. webgpu renderpasses, etc.
        draw(cobalt, nodeData, webGpuCommandEncoder)
    },

    onDestroy: function (cobalt, data) {
        // any cleanup for your node should go here (releasing textures, etc.)
        //destroy(data)
    },

    onResize: function (cobalt, data) {
        // do whatever you need when the dimensions of the renderer change (resize textures, etc.)
    },

    onViewportPosition: function (cobalt, data) {
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
        layout: cobalt.resources.tileAtlas.data.tileBindGroupLayout,
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



// @param Integer runCount  how many nodes in the graph have been run already
function draw (cobalt, nodeData, commandEncoder, runCount) {
    const { device } = cobalt

    // on the first render, we should clear the color attachment.
    // otherwise load it, so multiple sprite passes can build up data in the color and emissive textures
    const loadOp = (runCount === 0) ? 'clear' : 'load'

	const renderpass = commandEncoder.beginRenderPass({
        colorAttachments: [
            {
                view: cobalt.resources.hdr.data.value.view,
                clearValue: cobalt.clearValue,
                loadOp,
                storeOp: 'store'
            }
        ]
    })

    const tileAtlas = cobalt.resources.tileAtlas.data

    renderpass.setPipeline(tileAtlas.pipeline)
    renderpass.setVertexBuffer(0, tileAtlas.quad.buffer)

    renderpass.setBindGroup(0, nodeData.data.bindGroup)

    // common stuff; the transform data and the tile atlas texture
    renderpass.setBindGroup(1, tileAtlas.atlasBindGroup)

    // vertexCount, instanceCount, baseVertexIdx, baseInstanceIdx
    renderpass.draw(6, 1, 0, 0)

    renderpass.end()
}


function destroy (nodeData) {
    nodeData.matarial.texture.destroy()
    nodeData.matarial.texture = undefined
}
