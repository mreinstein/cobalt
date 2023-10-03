import createSpriteQuads    from './create-sprite-quads.js'
import createTextureFromUrl from '../create-texture-from-url.js'


// an emissive sprite renderer

export default {
    type: 'sprite',
    refs: [
        { name: 'colorSpriteSheet', type: 'webGpuTextureFrameView', format: 'rgba16float', access: 'read' },
        { name: 'emissiveSpriteSheet', type: 'webGpuTextureFrameView', format: 'rgba16float', access: 'read' },
        { name: 'hdr', type: 'webGpuTextureFrameView', format: 'rgba16float', access: 'write' },
        { name: 'emissive', type: 'webGpuTextureFrameView', format: 'rgba16float', access: 'write' },
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
        destroy(data)
    },

    onResize: function (cobalt, data) {
        // do whatever you need when the dimensions of the renderer change (resize textures, etc.)
    },

    onViewportPosition: function (cobalt, data) {

    },
}


async function init (cobalt, nodeData) {
    const { device } = cobalt

    // TODO

    /*
    // configure the common settings for sprite rendering
    const { canvas, device } = c

    const spritesheet = readSpriteSheet(spritesheetJson)

    const quads = createSpriteQuads(device, spritesheet)

    const [ material, emissiveTexture ] = await Promise.all([
        createTextureFromUrl(c, 'sprite', spriteTextureUrl, 'rgba8unorm'),
        createTextureFromUrl(c, 'emissive sprite', emissiveSpriteTextureUrl, 'rgba16float'),
    ])

    // for some reason this needs to be done _after_ creating the material, or the rendering will be pixelated
    canvas.style.imageRendering = 'pixelated'

    const uniformBuffer = device.createBuffer({
        size: 64 * 2, // 4x4 matrix with 4 bytes per float32, times 2 matrices (view, projection)
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
    })

    const bindGroupLayout = device.createBindGroupLayout({
        entries: [
            {
                binding: 0,
                visibility: GPUShaderStage.VERTEX,
                buffer: { }
            },
            {
                binding: 1,
                visibility: GPUShaderStage.FRAGMENT,
                texture:  { }
            },
            {
                binding: 2,
                visibility: GPUShaderStage.FRAGMENT,
                sampler: { }
            },
            {
                binding: 3,
                visibility: GPUShaderStage.VERTEX,
                buffer: {
                    type: 'read-only-storage'
                }
            },
            {
                binding: 4,
                visibility: GPUShaderStage.FRAGMENT,
                texture:  { }
            },
        ],
    })

    const pipelineLayout = device.createPipelineLayout({
        bindGroupLayouts: [ bindGroupLayout ]
    })

    const pipeline = device.createRenderPipeline({
        label: 'sprite',
        vertex: {
            module: device.createShaderModule({
                code: spriteWGSL
            }),
            entryPoint: 'vs_main',
            buffers: [ quads.bufferLayout ]
        },

        fragment: {
            module: device.createShaderModule({
                code: spriteWGSL
            }),
            entryPoint: 'fs_main',
            targets: [
                // color
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
                },

                // emissive
                {
                    format: 'rgba16float',
                }
            ]
        },

        primitive: {
            topology: 'triangle-list'
        },

        layout: pipelineLayout
    })
    
    c.sprite = {
        renderPassLookup: new Map(), // key is spriteId, value is the cobalt.renderPasses[] entry containing this sprite
        pipeline,
        uniformBuffer, // perspective and view matrices for the camera
        quads,
        material,
        emissiveTexture,
        bindGroupLayout,
        spritesheet,
    }
    */
}


function draw (cobalt, nodeData, commandEncoder) {
    /*
	// TODO: maybe store a state variable on the cobalt object that tracks how many render nodes have run so far
	// would be reset each frame
	//
	//const loadOp = 'clear' //(actualRenderCount < 1) ? 'clear' : 'load'
    const loadOp = (nodeData.options.textureUrl === 'assets/spelunky0.png') ? 'clear' : 'load'

	actualSpriteRenderCount++

    if (renderPass.dirty) {
        _rebuildSpriteDrawCalls(renderPass)
        renderPass.dirty = false
    }

    device.queue.writeBuffer(renderPass.spriteBuffer, 0, renderPass.spriteData.buffer)

    const renderpass = commandEncoder.beginRenderPass({
        colorAttachments: [
            // color
            {
                view: c.resources.hdr.data.value.view, //c.tmp_hdr_texture.view, // OLD c.bloom.hdr_texture.view,
                clearValue: c.clearValue,
                loadOp,
                storeOp: 'store'
            },

            // emissive
            {
                view:  c.resources.emissive.data.value.view, //c.tmp_emissive_texture.view, // OLD c.bloom.emissiveTextureView,
                clearValue: c.clearValue,
                loadOp: (actualSpriteRenderCount < 2) ? 'clear' : 'load',
                storeOp: 'store'
            }
        ]
    })

    renderpass.setPipeline(c.sprite.pipeline)
    renderpass.setBindGroup(0, renderPass.bindGroup)
    renderpass.setVertexBuffer(0, c.sprite.quads.buffer)

    // write sprite instance data into the storage buffer, sorted by sprite type. e.g.,
    //      renderpass.draw(6,  1,  0, 0)  //  1 hero instance
    //      renderpass.draw(6, 14,  6, 1)  // 14 bat instances
    //      renderpass.draw(6,  5, 12, 15) //  5 bullet instances

    // render each sprite type's instances
    const vertexCount = 6
    let baseInstanceIdx = 0

    for (let i=0; i < renderPass.instancedDrawCallCount; i++) {
        // [
        //    baseVtxIdx0, instanceCount0,
        //    baseVtxIdx1, instanceCount1,
        //    ...
        // ]
        const baseVertexIdx = renderPass.instancedDrawCalls[i*2  ] * vertexCount
        const instanceCount = renderPass.instancedDrawCalls[i*2+1]
        renderpass.draw(vertexCount, instanceCount, baseVertexIdx, baseInstanceIdx)
        baseInstanceIdx += instanceCount
    }

    renderpass.end()
    */
}

/*
// build instancedDrawCalls
function _rebuildSpriteDrawCalls (renderPass) {
    let currentSpriteType = -1
    let instanceCount = 0
    renderPass.instancedDrawCallCount = 0

    for (let i=0; i < renderPass.spriteCount; i++) {

        // 12th float is order. lower bits 0-15 are spriteType, bits 16-23 are sprite Z index
        const spriteType = renderPass.spriteData[i * FLOAT32S_PER_SPRITE + 11] & 0xFFFF

        if (spriteType !== currentSpriteType) {
            if (instanceCount > 0) {
                renderPass.instancedDrawCalls[renderPass.instancedDrawCallCount * 2]     = currentSpriteType
                renderPass.instancedDrawCalls[renderPass.instancedDrawCallCount * 2 + 1] = instanceCount
                renderPass.instancedDrawCallCount++
            }

            currentSpriteType = spriteType
            instanceCount = 0
        }

        instanceCount++
    }

    if (instanceCount > 0) {
        renderPass.instancedDrawCalls[renderPass.instancedDrawCallCount * 2]     = currentSpriteType
        renderPass.instancedDrawCalls[renderPass.instancedDrawCallCount * 2 + 1] = instanceCount
        renderPass.instancedDrawCallCount++
    }
}


function _writeSpriteBuffer (c) {
    // TODO: achieve zoom instead by adjusting the left/right/bottom/top based on scale factor?
    //                out    left   right    bottom   top     near     far
    //mat4.ortho(projection,    0,    800,      600,    0,   -10.0,   10.0)

    const GAME_WIDTH = c.viewport.width / c.viewport.zoom
    const GAME_HEIGHT = c.viewport.height / c.viewport.zoom

    //                         left          right    bottom        top     near     far
    const projection = mat4.ortho(0,    GAME_WIDTH,   GAME_HEIGHT,    0,   -10.0,   10.0)


    //mat4.scale(projection, projection, [1.5, 1.5, 1 ])

    // set x,y,z camera position
    vec3.set(-c.viewport.position[0], -c.viewport.position[1], 0, _tmpVec3)
    const view = mat4.translation(_tmpVec3)

    // might be useful if we ever switch to a 3d perspective camera setup
    //mat4.lookAt(view, [0, 0, 0], [0, 0, -1], [0, 1, 0])
    //mat4.targetTo(view, [0, 0, 0], [0, 0, -1], [0, 1, 0])

    // camera zoom
    //mat4.scale(view, view, [ 0.9, 0.9, 1 ])

    //mat4.fromScaling(view, [ 1.5, 1.5, 1 ])
    //mat4.translate(view, view, [ 0, 0, 0 ])

    c.device.queue.writeBuffer(c.sprite.uniformBuffer, 0, view.buffer)
    c.device.queue.writeBuffer(c.sprite.uniformBuffer, 64, projection.buffer)
}
*/


function destroy (nodeData) {
    /*
    if (c.sprite) {
        c.sprite.renderPassLookup.clear()
        c.sprite.quads.buffer.destroy()
        c.sprite.material.buffer.destroy()
        c.sprite.uniformBuffer.destroy()
        c.sprite.emissiveTexture.texture.destroy()
        c.sprite = null
    }
    */
}
