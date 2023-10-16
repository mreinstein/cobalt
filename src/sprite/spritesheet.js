import createSpriteQuads     from './create-sprite-quads.js'
import createTextureFromUrl  from '../create-texture-from-url.js'
import readSpriteSheet       from './read-spritesheet.js'
import spriteWGSL            from './sprite.wgsl'
import { round, mat4, vec3 } from '../deps.js'


// shared spritesheet resource, used by each sprite render node


// temporary variables, allocated once to avoid garbage collection
const _tmpVec3 = vec3.create(0, 0, 0)


export default {
    type: 'spritesheet',
    refs: [ ],

    // @params Object cobalt renderer world object
    // @params Object options optional data passed when initing this node
    onInit: async function (cobalt, options={}) {
        return init(cobalt, options)
    },

    onRun: function (cobalt, node, webGpuCommandEncoder) {
        // do whatever you need for this node. webgpu renderpasses, etc.
    },

    onDestroy: function (cobalt, node) {
        // any cleanup for your node should go here (releasing textures, etc.)
        destroy(node)
    },

    onResize: function (cobalt, node) {
        // do whatever you need when the dimensions of the renderer change (resize textures, etc.)
        _writeSpriteBuffer(cobalt, node)
    },

    onViewportPosition: function (cobalt, node) {
        _writeSpriteBuffer(cobalt, node)
    },
}


// configure the common settings for sprite rendering
async function init (cobalt, nodeData) {
    const { canvas, device } = cobalt

    let spritesheet = await fetchJson(nodeData.options.spriteSheetJsonUrl)
    spritesheet = readSpriteSheet(spritesheet)
    
    const quads = createSpriteQuads(device, spritesheet)

    const [ colorTexture, emissiveTexture ] = await Promise.all([
        createTextureFromUrl(cobalt, 'sprite', nodeData.options.colorTextureUrl, 'rgba8unorm'),
        createTextureFromUrl(cobalt, 'emissive sprite', nodeData.options.emissiveTextureUrl, 'rgba8unorm'),
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
    
    return {
        renderPassLookup: new Map(), // key is spriteId, value is the cobalt.renderPasses[] entry containing this sprite
        pipeline,
        uniformBuffer, // perspective and view matrices for the camera
        quads,
        colorTexture,
        emissiveTexture,
        bindGroupLayout,
        spritesheet,
    }
}


function destroy (nodeData) {    
    nodeData.data.renderPassLookup.clear()
    nodeData.data.quads.buffer.destroy()
    nodeData.data.colorTexture.buffer.destroy()
    nodeData.data.uniformBuffer.destroy()
    nodeData.data.emissiveTexture.texture.destroy()
}


async function fetchJson (url) {
    const raw = await fetch(url)
    return raw.json()
}


function _writeSpriteBuffer (cobalt, nodeData) {

    const { device } = cobalt

    // TODO: achieve zoom instead by adjusting the left/right/bottom/top based on scale factor?
    //                out    left   right    bottom   top     near     far
    //mat4.ortho(projection,    0,    800,      600,    0,   -10.0,   10.0)

    const GAME_WIDTH = cobalt.viewport.width / cobalt.viewport.zoom
    const GAME_HEIGHT = cobalt.viewport.height / cobalt.viewport.zoom

    //                         left          right    bottom        top     near     far
    const projection = mat4.ortho(0,    GAME_WIDTH,   GAME_HEIGHT,    0,   -10.0,   10.0)


    //mat4.scale(projection, projection, [1.5, 1.5, 1 ])

    // set x,y,z camera position
    vec3.set(-round(cobalt.viewport.position[0]), -round(cobalt.viewport.position[1]), 0, _tmpVec3)
    const view = mat4.translation(_tmpVec3)

    // might be useful if we ever switch to a 3d perspective camera setup
    //mat4.lookAt(view, [0, 0, 0], [0, 0, -1], [0, 1, 0])
    //mat4.targetTo(view, [0, 0, 0], [0, 0, -1], [0, 1, 0])

    // camera zoom
    //mat4.scale(view, view, [ 0.9, 0.9, 1 ])

    //mat4.fromScaling(view, [ 1.5, 1.5, 1 ])
    //mat4.translate(view, view, [ 0, 0, 0 ])

    device.queue.writeBuffer(nodeData.data.uniformBuffer, 0, view.buffer)
    device.queue.writeBuffer(nodeData.data.uniformBuffer, 64, projection.buffer)
}

