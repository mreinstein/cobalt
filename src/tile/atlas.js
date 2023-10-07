import createTextureFromUrl from '../create-texture-from-url.js'
import createTileQuad       from './create-tile-quad.js'
import tileWGSL             from './tile.wgsl'


const _buf = new Float32Array(8) //(136)  // tile instance data stored in a UBO


// shared tile atlas resource, used by each tile render node
export default {
    type: 'tileAtlas',
    refs: [ ],

    // @params Object cobalt renderer world object
    // @params Object options optional data passed when initing this node
    onInit: async function (cobalt, options={}) {
        return init(cobalt, options)
    },

    onRun: function (cobalt, nodeData, webGpuCommandEncoder) {
        // do whatever you need for this node. webgpu renderpasses, etc.
    },

    onDestroy: function (cobalt, data) {
        // any cleanup for your node should go here (releasing textures, etc.)
        destroy(data)
    },

    onResize: function (cobalt, nodeData) {
        // do whatever you need when the dimensions of the renderer change (resize textures, etc.)
        _writeTileBuffer(cobalt, nodeData)
    },

    onViewportPosition: function (cobalt, nodeData) {
        _writeTileBuffer(cobalt, nodeData)
    },
}


async function init (cobalt, nodeData) {
    const { device } = cobalt

    const quad = createTileQuad(device)

    const atlasMaterial = await createTextureFromUrl(cobalt, 'tile atlas', nodeData.options.textureUrl)

    const uniformBuffer = device.createBuffer({
        size: 32, //32 + (16 * 32), // in bytes.  32 for common data + (32 max tile layers * 16 bytes per tile layer)
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
                buffer: { }
            },
            {
                binding: 1,
                visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
                texture:  { }
            },
            {
                binding: 2,
                visibility: GPUShaderStage.FRAGMENT,
                sampler: { }
            },
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

    return {
        pipeline,
        uniformBuffer,
        atlasBindGroup,   // tile atlas texture, transform UBO
        atlasMaterial,

        tileBindGroupLayout,

        quad,

        tileSize: nodeData.options.tileSize,
        tileScale: nodeData.options.tileScale,
    }
}


function destroy (data) {
    data.atlasMaterial.texture.destroy()
    data.atlasMaterial.texture = undefined
}


function _writeTileBuffer (c, nodeData) {
    // viewOffset.  [ 0, 0 ] is the top left corner of the level
    _buf[0] = c.viewport.position[0] // viewoffset[0] 
    _buf[1] = c.viewport.position[1] // viewOffset[1]

    const tile = nodeData.data
    const { tileScale, tileSize } = tile

    const GAME_WIDTH = c.viewport.width / c.viewport.zoom
    const GAME_HEIGHT = c.viewport.height / c.viewport.zoom

    _buf[2] = GAME_WIDTH / tileScale          // viewportSize[0]
    _buf[3] = GAME_HEIGHT / tileScale         // viewportSize[1]

    _buf[4] = 1 / tile.atlasMaterial.texture.width  // inverseAtlasTextureSize[0]
    _buf[5] = 1 / tile.atlasMaterial.texture.height // inverseAtlasTextureSize[1]

    _buf[6] = tileSize
    _buf[7] = 1.0 / tileSize                            // inverseTileSize

    /*
    // copy each tile layer's instance data into the UBO
    let i = 8
    for (const node of c.nodes) {
        if (node.type === 'tile') {
            const tileTexture = node.data.material.size

            _buf[i]   = node.options.scrollScale        // scrollScale[0]
            _buf[i+1] = node.options.scrollScale        // scrollScale[1]
            _buf[i+2] = 1/tileTexture.width  // inverseTileTextureSize[0]
            _buf[i+3] = 1/tileTexture.height // inverseTileTextureSize[1]
            i += 4
        }
    }

    c.device.queue.writeBuffer(tile.uniformBuffer, 0, _buf, 0, i)
    */
    
    c.device.queue.writeBuffer(tile.uniformBuffer, 0, _buf, 0, 8)
}
