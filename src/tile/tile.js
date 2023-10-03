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

    onDestroy: function (data) {
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

    const bindGroup = device.createBindGroup({
        layout: cobalt.resources.tileAtlas.data.tileBindGroupLayout,
        entries: [
            {
                binding: 0,
                resource: material.view
            },
            {
                binding: 1,
                resource: material.sampler
            }
        ]
    })

    return {
        bindGroup,
        material,
        scrollScale: nodeData.options.scrollScale,
    }
}


function draw (cobalt, nodeData, commandEncoder) {
    
	// TODO: maybe store a state variable on the cobalt object that tracks how many render nodes have run so far
	// would be reset each frame
	//
	//const loadOp = 'clear' //(actualRenderCount < 1) ? 'clear' : 'load'
    const loadOp = (nodeData.options.textureUrl === 'assets/spelunky0.png') ? 'clear' : 'load'

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

    // common stuff; the transform data and the tile atlas texture
    renderpass.setBindGroup(1, tileAtlas.atlasBindGroup)

    // render each of the tile layers
    //for (let j=0; j < renderPass.layers.length; j++) {
        renderpass.setBindGroup(0, nodeData.data.bindGroup) //renderpass.setBindGroup(0, renderPass.layers[j].bindGroup)
        // vertexCount, instanceCount, baseVertexIdx, baseInstanceIdx
        renderpass.draw(6, 1, 0, 0)
    //}

    renderpass.end()
}


function destroy (nodeData) {
    nodeData.matarial.texture.destroy()
    nodeData.matarial.texture = undefined
}
