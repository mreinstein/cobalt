import * as OverlayRenderPass  from './OverlayRenderPass.js'
import * as SpriteRenderPass   from './SpriteRenderPass.js'
import * as TileRenderPass     from './TileRenderPass.js'
import fetchShader             from './fetch-shader.js'
import createSpriteQuads       from './create-sprite-quads.js'
import createTileQuad          from './create-tile-quad.js'
import { createTexture }       from './create-texture.js'
import { WebGPUTextureLoader } from 'https://cdn.jsdelivr.net/gh/toji/web-texture-tool/src/webgpu-texture-loader.js'
import { initBloom }           from './bloom.js'
import { initFinal }           from './final.js'


// create and initialize a WebGPU renderer for a given canvas
// returns the data structure containing all WebGPU related stuff
export default async function createRenderer (canvas, viewportWidth, viewportHeight, spritesheet, layers, spriteTextureUrl, emissiveSpriteTextureUrl, tileData) {

    const adapter = await navigator.gpu?.requestAdapter({ powerPreference: 'high-performance' })

    const device = await adapter?.requestDevice()
    const context = canvas.getContext('webgpu')

    const format = navigator.gpu.getPreferredCanvasFormat() // bgra8unorm

    context.configure({
        device,
        format,
        alphaMode: 'opaque'
    })

    const sprite = await buildSpritePipeline(device, canvas, format, spritesheet, spriteTextureUrl, emissiveSpriteTextureUrl)
    const tile = await buildTilePipeline(device, canvas, format, tileData)

    const bloom = await initBloom(device, canvas, viewportWidth, viewportHeight)

    const postProcessing = await initFinal(device, viewportWidth, viewportHeight, bloom)

    const renderer = {
        canvas,
        spritesheet,

        // device/context objects
        adapter,
        device,
        context,
        format,

        sprite,  // common data related to all sprite render passes
        tile,    // common data related to all tile render passes

        // key is layerId, value is the index of the renderPass responsible for drawing this layer
        renderPassLookup: [ ],

        // ordered list of WebGPU render passes.  available types:  TILE | SPRITE | OVERLAY
        renderPasses: [ ],

        // all the sprite/tile renderpasses draw to this texture except the overlay layers
        postProcessing,

        bloom, // bloom v2, the sexy one

        // used in the color attachments of renderpass
        clearValue: { r: 0.0, g: 0.0, b: 0.0, a: 1.0 },

        viewport: {
            width: viewportWidth,
            height: viewportHeight,
            zoom: 1.0,
            position: [ 0, 0 ]  // TODO: ehh is this the top left or center point of the viewport?
        },
    }

    buildRenderPasses(renderer, layers, tileData)

    console.log('wow', renderer)
    return renderer
}


async function buildSpritePipeline (device, canvas, format, spritesheet, spriteTextureUrl, emissiveSpriteTextureUrl) {
    const quads = createSpriteQuads(device, spritesheet)

    const [ material, emissiveTexture ] = await Promise.all([
        createTexture(device, spriteTextureUrl, 'rgba8unorm'),
        createTexture(device, emissiveSpriteTextureUrl, 'rgba16float'),
    ])

    // for some reason this needs to be done _after_ creating the material, or the rendering will be pixelated
    canvas.style.imageRendering = 'pixelated'

    const shader = await fetchShader('/src/sprite.wgsl')

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
                code: shader
            }),
            entryPoint: 'vs_main',
            buffers: [ quads.bufferLayout ]
        },

        fragment: {
            module: device.createShaderModule({
                code: shader
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
        /*
        depthStencil: {
            depthWriteEnabled: true,
            depthCompare: 'less',
            format: 'depth24plus',
        },
        */

        layout: pipelineLayout
    })
    
    return {
        pipeline,
        uniformBuffer, // perspective and view matrices for the camera
        quads,
        material,
        emissiveTexture,
        bindGroupLayout,
        spritesheet,
    }
}


async function buildTilePipeline (device, canvas, format, tileData) {
    const quad = createTileQuad(device)

    const atlasMaterial = await createTexture(device, tileData.atlasTextureUrl)

    const shader = await fetchShader('/src/tile.wgsl')

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
                code: shader
            }),
            entryPoint: 'vs_main',
            buffers: [ quad.bufferLayout ]
        },

        fragment: {
            module: device.createShaderModule({
                code: shader
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

    // key is layer name, value is the bind group for the tile layer
    const tileBindGroups = { }

    // key is layer name, value is a bind group
    const tileMaterials = { }

    for (const layerName in tileData.layers) {
        const tileLayerMaterial = await createTexture(device, tileData.layers[layerName].mapTextureUrl)

        const tileBindGroup = device.createBindGroup({
            layout: tileBindGroupLayout,
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

        tileBindGroups[layerName] = tileBindGroup
        tileMaterials[layerName] = tileLayerMaterial
    }

    return {
        pipeline,
        uniformBuffer,
        atlasBindGroup,   // tile atlas texture, transform UBO
        atlasMaterial,

        tileBindGroupLayout,

        tileMaterials,  // key is layer name, value is the material
        tileBindGroups, // key is layer name, value is a bind group

        quad,

        tileSize: tileData.tileSize,
        tileScale: tileData.tileScale,

        instanceCount: 0,   // how many tile layer instances there are
    }
}


function buildRenderPasses (renderer, layers, tileData) {
    // generate renderPass and renderPassLookup from layers
    const layerCount = Object.keys(layers).length
    let currentLayerType
    let minLayer = 0 
    let lc = 0

    const renderPasses = [ ]
    const renderPassLookup = [ ]

    for (let i=0; i < layerCount; i++) {
        const layer = Object.values(layers).find((L) => L.zIndex === i)
        if (!currentLayerType)
            currentLayerType = layer.type

        if (currentLayerType !== layer.type) {
            const maxLayer = minLayer + lc - 1
            if (currentLayerType === 'sprite')
                renderPasses.push(SpriteRenderPass.create(renderer, minLayer, maxLayer))
            else if (currentLayerType === 'tile')
                renderPasses.push(TileRenderPass.create(renderer, layers, minLayer, maxLayer, tileData))
            else
                renderPasses.push(OverlayRenderPass.create(renderer, minLayer, maxLayer))

            currentLayerType = layer.type
            renderPassLookup[minLayer + lc] = renderPasses.length
            minLayer += lc

            lc = 1

        } else {
            renderPassLookup[minLayer + lc] = renderPasses.length
            lc++
        }
    }

    if (lc > 0) {
        const maxLayer = minLayer + lc - 1
        if (currentLayerType === 'sprite')
            renderPasses.push(SpriteRenderPass.create(renderer, minLayer, maxLayer))
        else if (currentLayerType === 'tile')
            renderPasses.push(TileRenderPass.create(renderer, layers, minLayer, maxLayer))
        else
            renderPasses.push(OverlayRenderPass.create(renderer, minLayer, maxLayer))

        renderPassLookup[minLayer + lc] = renderPasses.length
    }

    renderer.renderPasses = renderPasses
    renderer.renderPassLookup = renderPassLookup
}
