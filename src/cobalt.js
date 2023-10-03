import * as OverlayRenderPass                         from './OverlayRenderPass.js'
import * as SpriteRenderPass                          from './SpriteRenderPass.js'
import createTexture                                  from './create-texture.js'
import createTextureFromUrl                           from './create-texture-from-url.js'
export { default as createTexture }                   from './create-texture.js'
import createSpriteQuads                              from './create-sprite-quads.js'
import readSpriteSheet                                from './read-spritesheet.js'
import overlayWGSL                                    from './overlay.wgsl'
import spriteWGSL                                     from './sprite.wgsl'
import uuid                                           from './uuid.js'
import { removeArrayItems, mat4, vec3 }               from './deps.js'
import { FLOAT32S_PER_SPRITE }                        from './constants.js'


// built-in run nodes
import bloomNode                                      from './bloom/bloom.js'
import compositeNode                                  from './scene-composite/scene-composite.js'
import spriteNode                                     from './sprite/sprite.js'
import tileNode                                       from './tile/tile.js'
// built-in resource nodes
import tileAtlasNode                                  from './tile/atlas.js'
import spritesheetNode                                from './sprite/spritesheet.js'
import fbTextureNode                                  from './fb-texture/fb-texture.js'


// temporary variables, allocated once to avoid garbage collection
const _tmpVec3 = vec3.create(0, 0, 0)


/////////////////////////////////
// general calls

// create and initialize a WebGPU renderer for a given canvas
// returns the data structure containing all WebGPU related stuff
export async function init (canvas, viewportWidth, viewportHeight) {

	const adapter = await navigator.gpu?.requestAdapter({ powerPreference: 'high-performance' })

    const device = await adapter?.requestDevice()
    const context = canvas.getContext('webgpu')

    const format = navigator.gpu.getPreferredCanvasFormat() // bgra8unorm

    context.configure({
        device,
        format,
        alphaMode: 'opaque'
    })

    const nodeDefs = {
        // TODO: namespace the builtins  e.g., builtin_bloom or cobalt_bloom, etc.
        //
        // builtin node types
        bloom: bloomNode,
        composite: compositeNode,
        sprite: spriteNode,
        tile: tileNode,
        tileAtlas: tileAtlasNode,
        spritesheet: spritesheetNode,
        fbTexture: fbTextureNode,
    }

	return {
        nodeDefs,
        // runnable nodes. ordering dictates render order (first to last)
        nodes: [ ],

        // named resources shard/referenced across run nodes
        resources: { },

		canvas,
		device,
		context,

        // used in the color attachments of renderpass
        clearValue: { r: 0.0, g: 0.0, b: 0.0, a: 1.0 },

        viewport: {
            width: viewportWidth,
            height: viewportHeight,
            zoom: 1.0,
            position: [ 0, 0 ]  // top left point of the viewport
        },



        // TODO: this stuff is all processing node specific; move to those modules

		sprite: undefined,  // common data related to all sprite render passes
        
        renderPasses: [ ],       // ordered list of WebGPU render passes.  available types:  TILE | SPRITE | OVERLAY
	}
}


export function defineNode (c, nodeDefinition) {
    /*
    sample nodeDefinition structure
    {
        type: 'bloom',
        // refs are named links to other nodes
        refs: [
            { name: 'emissive', type: 'webGpuTextureView', format: 'rgba16', access: 'read' },
            { name: 'hdr',      type: 'webGpuTextureView', format: 'rgba16', access: 'read' },
            { name: 'bloom',    type: 'webGpuTextureView', format: 'rgba16', access: 'readwrite' },
        ],
        onInit: function (cobalt, options={}) {
            // return whatever data you want to store for this node
            return { }
        },
        onRun: function (cobalt, data, webGpuCommandEncoder) {
            // do whatever you need for this node. webgpu renderpasses, etc.
        },
        onDestroy: function (cobalt, data) {
            // any cleanup for your node should go here (releasing textures, etc.)
        },
        onResize: function (cobalt, data) {
            // do whatever you need when the dimensions of the renderer change (resize textures, etc.)
        },
        onViewportPosition: function (cobalt, data) {
            // do whatever you need when the dimensions of the renderer change (resize textures, etc.)
        },
    }
    */

    if (!c.nodeDefs[nodeData?.type])
        throw new Error(`Can't initialize a new node missing a type.`)

    c.nodeDefs[nodeDefinition.type] = nodeDefinition
}



export async function addResourceNode (c, nodeData) {
    if (!nodeData.name)
        throw new Error(`Can't create a resource node without a name property.`)

    c.resources[nodeData.name] = await initNode(c, nodeData)

    return c.resources[nodeData.name]
}


export async function initNode (c, nodeData) {
    const nodeDef = c.nodeDefs[nodeData?.type]

    if (!nodeDef)
        throw new Error(`Can't initialize a new node missing a type.`)
    
    const data = await nodeDef.onInit(c, nodeData)

    const node = {
        type: nodeData.type,
        refs: nodeData.refs || { },
        options: nodeData.options || { },
        data: data || { }
    }

    console.log('added node:', node)

    c.nodes.push(node)
    return node
}


export function draw (c) {
	const { device, context } = c

    const commandEncoder = device.createCommandEncoder()

    let actualRenderCount = 0 // number of renderpasses that actually activated so far
    let actualSpriteRenderCount = 0 // number of sprite renderpasses that actually activated so far

    for (const renderPass of c.renderPasses) {

        const loadOp = (actualRenderCount < 1) ? 'clear' : 'load'

        if (renderPass.type === 'tile') {
            actualRenderCount++

        } else if (renderPass.type === 'sprite') {
            actualRenderCount++
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
        }
    }


    const v = c.context.getCurrentTexture().createView()

    // run all of the defined nodes
    for (const n of c.nodes) {
        const nodeDef = c.nodeDefs[n.type]

        // some nodes may need a reference to the default texture view (the frame backing)
        for (const arg of nodeDef.refs)
            if (arg.type === 'webGpuTextureFrameView')
                n.refs[arg.name] = v

        nodeDef.onRun(c, n, commandEncoder)
    }

    /*
    // render all GUI/overlay layers on top of the postProcessing
    for (const renderPass of c.renderPasses) {
        if (renderPass.type === 'overlay') {

            //const loadOp = (actualRenderCount < 1) ? 'clear' : 'load'

            actualRenderCount++
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
                        view: v, //c.bloom.hdr_texture.view,
                        clearValue: c.clearValue,
                        loadOp: 'load',
                        storeOp: 'store'
                    },
                ]
            })
        
            renderpass.setPipeline(c.overlay.pipeline)
            renderpass.setBindGroup(0, renderPass.bindGroup)
            renderpass.setVertexBuffer(0, c.overlay.quads.buffer)

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
        }
    }
    */

    device.queue.submit([ commandEncoder.finish() ])
}


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


export function removeSprites (c) {
    for (const rp of c.renderPasses) {
        if (rp.type === 'sprite')
            rp.spriteCount = 0
        else if (rp.type === 'overlay')
            rp.spriteCount = 0
    }
}


// clean up all the loaded data so we could re-load a level, etc.
export function reset (c) {

    for (const rp of c.renderPasses) {
        if (rp.type === 'tile') { 
            for (const layer of rp.layers)
                removeTileLayer(c, layer.tileLayerId)
        }
        else if (rp.type === 'sprite') {
            SpriteRenderPass.destroy(c, rp)
        }
        else if (rp.type === 'overlay') { 
            OverlayRenderPass.destroy(c, rp)
        }
    }

    c.sprite.renderPassLookup.clear()
    c.renderPasses.length = 0

    for (const name in c.resources) {
        const res = c.resources[name]
        const nodeDef = c.nodeDefs[res.type]
        nodeDef.onDestroy(c, res)
    }

    c.resources = { }

    for (const n of c.nodes) {
        const nodeDef = c.nodeDefs[n.type]
        nodeDef.onDestroy(c, n)
    }
    c.nodes.length = 0
}


////////////////////////////////
// camera/viewport related calls
export function setViewportDimensions (c, width, height) {
	c.viewport.width = width
	c.viewport.height = height

    for (const resName in c.resources) {
        const res = c.resources[resName]
        const nodeDef = c.nodeDefs[res.type]
        nodeDef.onResize(c, res)
    }

    for (const n of c.nodes) {
        const nodeDef = c.nodeDefs[n.type]
        nodeDef.onResize(c, n)
    }


    // TODO: these dont belong here, move them to the individual onResize calls
    if (c.sprite)
       _writeSpriteBuffer(c)

    if (c.overlay)
        _writeOverlayBuffer(c)
}


// @param Array pos top left corner of da viewport
export function setViewportPosition (c, pos) {
    c.viewport.position[0] = pos[0] - (c.viewport.width / 2 / c.viewport.zoom)
    c.viewport.position[1] = pos[1] - (c.viewport.height / 2 / c.viewport.zoom)

    for (const resName in c.resources) {
        const res = c.resources[resName]
        const nodeDef = c.nodeDefs[res.type]
        nodeDef.onViewportPosition(c, res)
    }

    for (const n of c.nodes) {
        const nodeDef = c.nodeDefs[n.type]
        nodeDef.onViewportPosition(c, n)
    }

    // TODO: these dont belong here, move them to the individual onViewportPosition calls
	if (c.sprite)
        _writeSpriteBuffer(c)

    if (c.overlay)
        _writeOverlayBuffer(c)
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


function _writeOverlayBuffer (c) {
    // TODO: I think this buffer only needs writing once since the overlays never change. (0,0 always top left corner)
    
    const zoom = 1.0 // c.viewport.zoom
    const GAME_WIDTH = Math.round(c.viewport.width / zoom)
    const GAME_HEIGHT = Math.round(c.viewport.height / zoom)

    //                         left          right    bottom        top     near     far
    const projection = mat4.ortho(0,    GAME_WIDTH,   GAME_HEIGHT,    0,   -10.0,   10.0)

    // set x,y,z camera position
    vec3.set(0, 0, 0, _tmpVec3)
    const view = mat4.translation(_tmpVec3)

    c.device.queue.writeBuffer(c.overlay.uniformBuffer, 0, view.buffer)
    c.device.queue.writeBuffer(c.overlay.uniformBuffer, 64, projection.buffer)
}





export function removeTileLayer (c, tileLayerId) {

    const rp = c.renderPasses.find((rp) => rp.type === 'tile' && !!rp.layers.find((L) => L.tileLayerId === tileLayerId))

    if (!rp)
        throw new Error(`could not remove tile layer, layer id ${tileLayerId} not found in any render passes.`)

    const layer = rp.layers.find((L) => L.tileLayerId === tileLayerId)

    for (let i=rp.layers.length-1; i >= 0; i--)
        if (rp.layers[i].tileLayerId === tileLayerId)
            removeArrayItems(rp.layers, i, 1)

    delete c.tile.tileBindGroups[tileLayerId]

    c.tile.tileMaterials[tileLayerId].texture.destroy()

    delete c.tile.tileMaterials[tileLayerId]
}


// configure the common settings for sprite rendering
export async function configureSpriteRenderer (c, spritesheetJson, spriteTextureUrl, emissiveSpriteTextureUrl) {
    const { canvas, device } = c

    if (c.sprite) {
        c.sprite.renderPassLookup.clear()
        c.sprite.quads.buffer.destroy()
        c.sprite.material.buffer.destroy()
        c.sprite.uniformBuffer.destroy()
        c.sprite.emissiveTexture.texture.destroy()
        c.sprite = null
    }

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

    await configureOverlayRenderer(c, spritesheetJson, spriteTextureUrl)
}


// configure the common settings for sprite overlay rendering
export async function configureOverlayRenderer (c, spritesheetJson, spriteTextureUrl) {
    const { canvas, device } = c

    const spritesheet = readSpriteSheet(spritesheetJson)

    const quads = createSpriteQuads(device, spritesheet)

    const material = await createTextureFromUrl(c, 'overlay', spriteTextureUrl, 'rgba8unorm')

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
        ],
    })

    const pipelineLayout = device.createPipelineLayout({
        bindGroupLayouts: [ bindGroupLayout ]
    })

    const pipeline = device.createRenderPipeline({
        label: 'overlay',
        vertex: {
            module: device.createShaderModule({
                code: overlayWGSL
            }),
            entryPoint: 'vs_main',
            buffers: [ quads.bufferLayout ]
        },

        fragment: {
            module: device.createShaderModule({
                code: overlayWGSL
            }),
            entryPoint: 'fs_main',
            targets: [
                // color
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
    
    c.overlay = {
        pipeline,
        uniformBuffer, // perspective and view matrices for the camera
        quads,
        material,
        bindGroupLayout,
    }
}


// given an array of layer descriptors, build the render passes
// e.g., [ { name: 'water', type: 'tile' }, { name: 'hero', type: 'sprite' }, ... ]
export function configureLayers (c, layers) {
 
    let currentLayerType
    let minLayer = 0 
    let lc = 0

    const renderPasses = [ ]

    for (const layer of layers) {

        if (!currentLayerType)
            currentLayerType = layer.type

        if (currentLayerType !== layer.type) {
            const maxLayer = minLayer + lc - 1
            if (currentLayerType === 'sprite') {
                renderPasses.push(SpriteRenderPass.create(c, minLayer, maxLayer))
            }
            else if (currentLayerType === 'tile') {
                renderPasses.push({
                    type: 'tile',

                    id: uuid(),

                    // layer range this render pass is responsible for drawing.
                    minLayer,
                    maxLayer,

                    // each one of these corresponds to a WebGpu draw call
                    layers: [ ],
                })
            }
            else if (currentLayerType === 'overlay') {
                renderPasses.push(OverlayRenderPass.create(c, minLayer, maxLayer))
            } else {
                throw new Error(`Unknown layer type: '${currentLayerType}'`)
            }

            currentLayerType = layer.type
            minLayer += lc

            lc = 1

        } else {
            lc++
        }
    }

    if (lc > 0) {
        const maxLayer = minLayer + lc - 1
        if (currentLayerType === 'sprite') {
            renderPasses.push(SpriteRenderPass.create(c, minLayer, maxLayer))
        }
        else if (currentLayerType === 'tile') {
            renderPasses.push({
                type: 'tile',

                id: uuid(),

                // layer range this render pass is responsible for drawing.
                minLayer,
                maxLayer,

                // each one of these corresponds to a WebGpu draw call
                layers: [ ],
            })
        }
        else if (currentLayerType === 'overlay') {
            renderPasses.push(OverlayRenderPass.create(c, minLayer, maxLayer))
        } else {
            throw new Error(`Unknown layer type: '${currentLayerType}'`)
        }
    }

    c.renderPasses = renderPasses
}


export function addSprite (c, name, position, width, height, scale, tint, opacity, rotation, zIndex) {
    return SpriteRenderPass.addSprite(c, name, position, width, height, scale, tint, opacity, rotation, zIndex)
}


export function removeSprite (c, spriteId) {
    SpriteRenderPass.removeSprite(c, spriteId)
}


export function setSpriteName (c, spriteId, name, scale) {
    SpriteRenderPass.setSpriteName(c, spriteId, name, scale)
}


export function setSpritePosition (c, spriteId, position) {
    SpriteRenderPass.setSpritePosition(c, spriteId, position)
}


export function setSpriteTint (c, spriteId, tint) {
    SpriteRenderPass.setSpriteTint(c, spriteId, tint)
}


export function setSpriteOpacity (c, spriteId, opacity) {
    SpriteRenderPass.setSpriteOpacity(c, spriteId, opacity)
}


export function setSpriteRotation (c, spriteId, rotation) {
    SpriteRenderPass.setSpriteRotation(c, spriteId, rotation)
}
