import * as OverlayRenderPass   from './OverlayRenderPass.js'
import * as SpriteRenderPass    from './SpriteRenderPass.js'
import * as TileRenderPass      from './TileRenderPass.js'
import constants                from './constants.js'
import fetchShader              from './fetch-shader.js'
import createSpriteTriangleMesh from './sprite-triangle-mesh.js'
import createTileTriangleMesh   from './tile-triangle-mesh.js'
import { createMaterial }       from './material.js'


// create and initialize a WebGPU renderer for a given canvas
// returns the data structure containing all WebGPU related stuff
export default async function createRenderer (canvas, spritesheet, layers, spriteTextureUrl, tileData) {

    const adapter = await navigator.gpu?.requestAdapter({ powerPreference: 'high-performance' })

    const device = await adapter?.requestDevice()
    const context = canvas.getContext('webgpu')
    const format = 'bgra8unorm'

    context.configure({
        device,
        format,
        alphaMode: 'opaque'
    })

    const sprite = await buildSpritePipeline(device, canvas, format, spritesheet, spriteTextureUrl)
    const tile = await buildTilePipeline(device, canvas, format, tileData)

    const renderer = {
        canvas,

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

        // used in the color attachments of renderpass
        clearValue: { r: 0.5, g: 0.0, b: 0.25, a: 1.0 },

        viewport: {
            position: [ 0, 0 ]  // TODO: ehh is this the top left or center point of the viewport?
        },
    }

    buildRenderPasses(renderer, layers, tileData)

    return renderer
}


async function buildSpritePipeline (device, canvas, format, spritesheet, spriteTextureUrl) {
    const triangleMesh = createSpriteTriangleMesh(device, spritesheet)

    const material = await createMaterial(device, spriteTextureUrl)

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
            }
        ],
    })

    const pipelineLayout = device.createPipelineLayout({
        bindGroupLayouts: [ bindGroupLayout ]
    })

    const pipeline = device.createRenderPipeline({
        vertex: {
            module: device.createShaderModule({
                code: shader
            }),
            entryPoint: 'vs_main',
            buffers: [ triangleMesh.bufferLayout ]
        },

        fragment: {
            module: device.createShaderModule({
                code: shader
            }),
            entryPoint: 'fs_main',
            targets: [
                {
                    format,
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
        triangleMesh,
        material,
        bindGroupLayout,
    }
}


async function buildTilePipeline (device, canvas, format, tileData) {
    const triangleMesh = createTileTriangleMesh(device)

    const spritesMaterial = await createMaterial(device, tileData.spriteTextureUrl)

    const shader = await fetchShader('/src/tile.wgsl')

    const uniformBuffer = device.createBuffer({
        size: 32 + (16 * 32), // in bytes.  32 for common data + (32 max tile layers * 16 bytes per tile layer)
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
    })

    const spriteBindGroupLayout = device.createBindGroupLayout({
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

    const spriteBindGroup = device.createBindGroup({
        layout: spriteBindGroupLayout,
        entries: [
            {
                binding: 0,
                resource: {
                    buffer: uniformBuffer
                }
            },
            {
                binding: 1,
                resource: spritesMaterial.view
            },
            {
                binding: 2,
                resource: spritesMaterial.sampler
            }
        ]
    })

    const tileBindGroupLayout = device.createBindGroupLayout({
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

    const pipelineLayout = device.createPipelineLayout({
        bindGroupLayouts: [ tileBindGroupLayout, spriteBindGroupLayout ]
    })

    const pipeline = device.createRenderPipeline({
        vertex: {
            module: device.createShaderModule({
                code: shader
            }),
            entryPoint: 'vs_main',
            buffers: [ triangleMesh.bufferLayout ]
        },

        fragment: {
            module: device.createShaderModule({
                code: shader
            }),
            entryPoint: 'fs_main',
            targets: [
                {
                    format,
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
        const tileLayerMaterial = await createMaterial(device, tileData.layers[layerName].textureUrl)

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
        spriteBindGroup,   // sprite texture, transform UBO
        spritesMaterial,

        tileBindGroupLayout,

        tileMaterials,  // key is layer name, value is the material
        tileBindGroups, // key is layer name, value is a bind group

        triangleMesh,

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
                renderPasses.push(TileRenderPass.create(renderer, minLayer, maxLayer, tileData))
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
            renderPasses.push(TileRenderPass.create(renderer, minLayer, maxLayer))
        else
            renderPasses.push(OverlayRenderPass.create(renderer, minLayer, maxLayer))

        renderPassLookup[minLayer + lc] = renderPasses.length
    }

    renderer.renderPasses = renderPasses
    renderer.renderPassLookup = renderPassLookup
}
