import createSpriteQuads       from './create-sprite-quads.js'
import createTextureFromBuffer from '../create-texture-from-buffer.js'
import createTextureFromUrl    from '../create-texture-from-url.js'
import readSpriteSheet         from './read-spritesheet.js'
import spriteWGSL              from './sprite.wgsl'
import round                   from 'round-half-up-symmetric'
import { mat4, vec3 }          from 'wgpu-matrix'


// shared spritesheet resource, used by each sprite render node


// temporary variables, allocated once to avoid garbage collection
const _tmpVec3 = vec3.create(0, 0, 0)


export default {
    type: 'cobalt:spritesheet',
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
async function init (cobalt, node) {
    const { canvas, device } = cobalt

    let spritesheet, colorTexture, emissiveTexture

    const format = node.options.format || 'rgba8unorm'

    if (canvas) {
        // browser (canvas) path
        spritesheet = await fetchJson(node.options.spriteSheetJsonUrl)
        spritesheet = readSpriteSheet(spritesheet)

        colorTexture = await createTextureFromUrl(cobalt, 'sprite', node.options.colorTextureUrl, format)
        emissiveTexture = await createTextureFromUrl(cobalt, 'emissive sprite', node.options.emissiveTextureUrl, format)
        
        // for some reason this needs to be done _after_ creating the material, or the rendering will be blurry
        canvas.style.imageRendering = 'pixelated'
    }
    else {
        // sdl + gpu path
        spritesheet = readSpriteSheet(node.options.spriteSheetJson)

        colorTexture = await createTextureFromBuffer(cobalt, 'sprite', node.options.colorTexture, format)
        emissiveTexture = await createTextureFromBuffer(cobalt, 'emissive sprite', node.options.emissiveTexture, format)
    }
    
    const quads = createSpriteQuads(device, spritesheet)

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
        label: 'spritesheet',
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
        pipeline,
        uniformBuffer, // perspective and view matrices for the camera
        quads,
        colorTexture,
        emissiveTexture,
        bindGroupLayout,
        spritesheet,
    }
}


function destroy (node) {
    node.data.quads.buffer.destroy()
    node.data.colorTexture.buffer.destroy()
    node.data.uniformBuffer.destroy()
    node.data.emissiveTexture.texture.destroy()
}


async function fetchJson (url) {
    const raw = await fetch(url)
    return raw.json()
}


function _writeSpriteBuffer (cobalt, node) {

    const { device, viewport } = cobalt

    const GAME_WIDTH = viewport.width / viewport.zoom
    const GAME_HEIGHT = viewport.height / viewport.zoom

    //                         left          right    bottom        top     near     far
    const projection = mat4.ortho(0,    GAME_WIDTH,   GAME_HEIGHT,    0,   -10.0,   10.0)

    
    // TODO: if this doesn't introduce jitter into the crossroads render, remove this disabled code entirely.
    //
    // I'm disabling the rounding because I think it fails in cases where units are not expressed in pixels
    // e.g., most physics engines operate on meters, not pixels, so we don't want to round to the nearest integer as that 
    // probably isn't high enough resolution. That would mean the camera could be snapped by up to 0.5 meters
    // in that case. I think the better solution for expressing camera position in pixels is to round before calling
    // cobalt.setViewportPosition(...)
    //
    // set 3d camera position
    vec3.set(-round(viewport.position[0]), -round(viewport.position[1]), 0, _tmpVec3)
    //vec3.set(-viewport.position[0], -viewport.position[1], 0, _tmpVec3)
    const view = mat4.translation(_tmpVec3)

    device.queue.writeBuffer(node.data.uniformBuffer, 0, view.buffer)
    device.queue.writeBuffer(node.data.uniformBuffer, 64, projection.buffer)
}

