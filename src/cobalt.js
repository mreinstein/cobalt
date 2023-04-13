import * as OverlayRenderPass                         from './OverlayRenderPass.js'
import * as SpriteRenderPass                          from './SpriteRenderPass.js'
import createSpriteQuads                              from './create-sprite-quads.js'
import createTileQuad                                 from './create-tile-quad.js'
import createTexture                                  from './create-texture.js'
import readSpriteSheet                                from './read-spritesheet.js'
import overlayWGSL                                    from './overlay.wgsl'
import spriteWGSL                                     from './sprite.wgsl'
import tileWGSL                                       from './tile.wgsl'
import uuid                                           from './uuid.js'
import * as Bloom                                     from './bloom.js'
import * as SceneComposite                            from './scene-composite.js'
import { removeArrayItems, mat4, vec3 }               from './deps.js'
import { FLOAT32S_PER_SPRITE }                        from './constants.js'


// temporary variables, allocated once to avoid garbage collection
const _tmpVec3 = vec3.create()
const _buf = new Float32Array(136)  // tile instance data stored in a UBO


/////////////////////////////////
// general calls

// create and initialize a WebGPU renderer for a given canvas
// returns the data structure containing all WebGPU related stuff
export async function create (canvas, viewportWidth, viewportHeight) {

	const adapter = await navigator.gpu?.requestAdapter({ powerPreference: 'high-performance' })

    const device = await adapter?.requestDevice()
    const context = canvas.getContext('webgpu')

    const format = navigator.gpu.getPreferredCanvasFormat() // bgra8unorm

    context.configure({
        device,
        format,
        alphaMode: 'opaque'
    })

    const bloom = await Bloom.init(device, canvas, viewportWidth, viewportHeight)
    const postProcessing = await SceneComposite.init(device, bloom)

	return {
		canvas,
		device,
		context,

		sprite: undefined,  // common data related to all sprite render passes
        tile: undefined,    // common data related to all tile render passes

        renderPasses: [ ],       // ordered list of WebGPU render passes.  available types:  TILE | SPRITE | OVERLAY
        //activeRenderPasses: [ ], // ordered list of active entries from renderPasses
        //activeRenderPassesLength: 0,

        // all the sprite/tile renderpasses draw to this texture except the overlay layers
        postProcessing,

        bloom,

        // used in the color attachments of renderpass
        clearValue: { r: 0.0, g: 0.0, b: 0.0, a: 1.0 },

        viewport: {
            width: viewportWidth,
            height: viewportHeight,
            zoom: 1.0,
            position: [ 0, 0 ]  // top left point of the viewport
        },
	}
}


export function draw (c) {
	const { device, context } = c

    const commandEncoder = device.createCommandEncoder()

    let actualRenderCount = 0 // number of renderpasses that actually activated so far
    let actualSpriteRenderCount = 0 // number of sprite renderpasses that actually activated so far

    const tile = c.tile

    for (const renderPass of c.renderPasses) {

        const loadOp = (actualRenderCount < 1) ? 'clear' : 'load'

        if (renderPass.type === 'tile') { 
            actualRenderCount++
            
            const renderpass = commandEncoder.beginRenderPass({
                colorAttachments: [
                    {
                        view: c.bloom.hdr_texture.view,
                        clearValue: c.clearValue,
                        loadOp,
                        storeOp: 'store'
                    }
                ]
            })

            renderpass.setPipeline(tile.pipeline)
            renderpass.setVertexBuffer(0, tile.quad.buffer)

            // common stuff; the transform data and the tile atlas texture
            renderpass.setBindGroup(1, tile.atlasBindGroup)

            // render each of the tile layers
            for (let j=0; j < renderPass.layers.length; j++) {
                renderpass.setBindGroup(0, renderPass.layers[j].bindGroup)
                // vertexCount, instanceCount, baseVertexIdx, baseInstanceIdx
                renderpass.draw(6, 1, 0, 0)
            }

            renderpass.end()

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
                        view: c.bloom.hdr_texture.view,
                        clearValue: c.clearValue,
                        loadOp,
                        storeOp: 'store'
                    },

                    // emissive
                    {
                        view: c.bloom.emissiveTextureView,
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

    Bloom.draw(c, commandEncoder)

    const v = c.context.getCurrentTexture().createView()

    // combine bloom and color textures and draw to a fullscreen quad
    SceneComposite.draw(c, commandEncoder, v)

    // TODO: render other post processing effects
    //renderPixelationFilter(c, commandEncoder)
    //renderVignetteFilter(c, commandEncoder)
    //renderFilmGrainFilter(c, commandEncoder)

    
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
}


////////////////////////////////
// camera/viewport related calls
export function setViewportDimensions (c, width, height) {
	c.viewport.width = width
	c.viewport.height = height
    if (c.sprite)
	   _writeSpriteBuffer(c)

    if (c.overlay)
        _writeOverlayBuffer(c)

	if (c.tile)
		_writeTileBuffer(c)

    Bloom.resize(c.device, c.bloom, c.viewport.width, c.viewport.height)
    SceneComposite.resize(c, c.viewport.width, c.viewport.height)
}


// @param Array pos top left corner of da viewport
export function setViewportPosition (c, pos) {
	c.viewport.position[0] = pos[0]
	c.viewport.position[1] = pos[1]
	if (c.sprite)
        _writeSpriteBuffer(c)

    if (c.overlay)
        _writeOverlayBuffer(c)

	if (c.tile)
		_writeTileBuffer(c)
}


function _writeTileBuffer (c) {
	// viewOffset.  [ 0, 0 ] is the top left corner of the level
    _buf[0] = c.viewport.position[0] // viewoffset[0] 
    _buf[1] = c.viewport.position[1] // viewOffset[1]

    const tile = c.tile
    const { tileScale, tileSize } = tile

    const GAME_WIDTH = c.viewport.width / c.viewport.zoom
    const GAME_HEIGHT = c.viewport.height / c.viewport.zoom

    _buf[2] = GAME_WIDTH / tileScale          // viewportSize[0]
    _buf[3] = GAME_HEIGHT / tileScale         // viewportSize[1]

    _buf[4] = 1 / tile.atlasMaterial.imageData.width  // inverseAtlasTextureSize[0]
    _buf[5] = 1 / tile.atlasMaterial.imageData.height // inverseAtlasTextureSize[1]

    _buf[6] = tileSize
    _buf[7] = 1.0 / tileSize                            // inverseTileSize

    // copy each tile layer's instance data into the UBO
    let i = 8
    for (const rp of c.renderPasses) {
        if (rp.type === 'tile' && rp.layers.length) {
            for (const l of rp.layers) {
                _buf[i]   = l.scrollScale        // scrollScale[0]
                _buf[i+1] = l.scrollScale        // scrollScale[1]
                _buf[i+2] = 1/l.imageData.width  // inverseTileTextureSize[0]
                _buf[i+3] = 1/l.imageData.height // inverseTileTextureSize[1]
                i += 4
            }
        }
    }
    
    c.device.queue.writeBuffer(tile.uniformBuffer, 0, _buf, 0, i)
}


function _writeSpriteBuffer (c) {
    // TODO: I think zoom can be achieved by adjusting the left/right/bottom/top based on scale factor
    const projection = mat4.create()

    //                out    left   right    bottom   top     near     far
    //mat4.ortho(projection,    0,    800,      600,    0,   -10.0,   10.0)

    const GAME_WIDTH = c.viewport.width / c.viewport.zoom
    const GAME_HEIGHT = c.viewport.height / c.viewport.zoom

    mat4.ortho(projection,    0,    GAME_WIDTH,   GAME_HEIGHT,    0,   -10.0,   10.0)

    //mat4.scale(projection, projection, [1.5, 1.5, 1 ])

    const view = mat4.create()
    // set x,y,z camera position
    vec3.set(_tmpVec3, -c.viewport.position[0], -c.viewport.position[1], 0)
    mat4.fromTranslation(view, _tmpVec3)

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
    // TODO: I think this buffer can be written just once since the overlays never change. (0,0 always top left corner)
    const projection = mat4.create()

    const zoom = 1.0 // c.viewport.zoom
    const GAME_WIDTH = Math.round(c.viewport.width / zoom)
    const GAME_HEIGHT = Math.round(c.viewport.height / zoom)

    mat4.ortho(projection,    0,    GAME_WIDTH,   GAME_HEIGHT,    0,   -10.0,   10.0)

    const view = mat4.create()
    // set x,y,z camera position
    vec3.set(_tmpVec3, 0, 0, 0)
    mat4.fromTranslation(view, _tmpVec3)

    c.device.queue.writeBuffer(c.overlay.uniformBuffer, 0, view.buffer)
    c.device.queue.writeBuffer(c.overlay.uniformBuffer, 64, projection.buffer)
}



////////////////////////////////
// tile calls

// configure the common settings for tile map rendering
export async function configureTileRenderer (c, atlasTextureUrl, tileSize=16, tileScale=1.0) {

	const device = c.device

    const quad = createTileQuad(device)

    const atlasMaterial = await createTexture(device, 'tile atlas', atlasTextureUrl)

    const uniformBuffer = device.createBuffer({
        size: 32 + (16 * 32), // in bytes.  32 for common data + (32 max tile layers * 16 bytes per tile layer)
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
    })

    const atlasBindGroupLayout = device.createBindGroupLayout({
        entries: [
            {
                binding: 0,
                visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
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
            }
        ],
    })

    const atlasBindGroup = device.createBindGroup({
        layout: atlasBindGroupLayout,
        entries: [
            {
                binding: 0,
                resource: {
                    buffer: uniformBuffer
                }
            },
            {
                binding: 1,
                resource: atlasMaterial.view
            },
            {
                binding: 2,
                resource: atlasMaterial.sampler
            }
        ]
    })

    const tileBindGroupLayout = device.createBindGroupLayout({
        entries: [
            {
                binding: 0,
                visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
                texture:  { }
            },
            {
                binding: 1,
                visibility: GPUShaderStage.FRAGMENT,
                sampler: { }
            }
        ],
    })

    const pipelineLayout = device.createPipelineLayout({
        bindGroupLayouts: [ tileBindGroupLayout, atlasBindGroupLayout ]
    })

    const pipeline = device.createRenderPipeline({
        label: 'tile',
        vertex: {
            module: device.createShaderModule({
                code: tileWGSL
            }),
            entryPoint: 'vs_main',
            buffers: [ quad.bufferLayout ]
        },

        fragment: {
            module: device.createShaderModule({
                code: tileWGSL
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

	c.tile = {
		pipeline,
        uniformBuffer,
        atlasBindGroup,   // tile atlas texture, transform UBO
        atlasMaterial,

        tileBindGroupLayout,

        tileMaterials: { },  // key is layer id, value is the material
        tileBindGroups: { }, // key is layer id, value is the bind group

        quad,

        tileSize,
        tileScale,
	}
}


export async function addTileLayer (c, scrollScale, tileMapTextureUrl, zIndex) {
	if (!c.tile)
		throw new Error(`Cobalt's tile renderer is not configured.  Please call configureTileRenderer(...) before adding any tile layers.`)

	const device = c.device

	const tileLayerId = uuid()

	// build the tile layer and add it to the cobalt data structure
	const tileLayerMaterial = await createTexture(device, 'tile map', tileMapTextureUrl)

	const tileBindGroup = device.createBindGroup({
        layout: c.tile.tileBindGroupLayout,
        entries: [
            {
                binding: 0,
                resource: tileLayerMaterial.view
            },
            {
                binding: 1,
                resource: tileLayerMaterial.sampler
            }
        ]
    })

    c.tile.tileBindGroups[tileLayerId] = tileBindGroup
    c.tile.tileMaterials[tileLayerId] = tileLayerMaterial

    const rp = c.renderPasses.find((rp) => rp.type === 'tile' && rp.minLayer <= zIndex && rp.maxLayer >= zIndex)

    if (!rp)
        throw new Error(`Unable to add tile layer; zIndex ${zIndex} not declared in layers`)

    rp.layers.push({
        tileLayerId,
        imageData: tileLayerMaterial.imageData,
        bindGroup: tileBindGroup,
        scrollScale: scrollScale,
    })

	return tileLayerId
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
        createTexture(device, 'sprite', spriteTextureUrl, 'rgba8unorm'),
        createTexture(device, 'emissive sprite', emissiveSpriteTextureUrl, 'rgba16float'),
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

    const material = await createTexture(device, 'overlay', spriteTextureUrl, 'rgba8unorm')

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
