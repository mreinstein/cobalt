import displacementWGSL from './displacement.wgsl'
import uuid             from '../uuid.js'
import { round, mat4, vec3 }   from '../deps.js'


// TODO:
// adapt this to webgpu https://github.com/pixijs/pixijs/tree/dev/packages/filter-displacement

// temporary variables, allocated once to avoid garbage collection
const _tmpVec3 = vec3.create(0, 0, 0)

const FLOAT32S_PER_SPRITE = 6 // vec2(translate) + vec2(scale) + rotation + opacity 


export default {
    type: 'displacement',
    refs: [

    	// input framebuffer texture with the scene drawn
    	{ name: 'color', type: 'textureView', format: 'bgra8unorm', access: 'read' },

    	// displacement map (probably a perlin noise texture)
        { name: 'map', type: 'textureView', format: 'bgra8unorm', access: 'read' },

        // result we're writing to
        { name: 'out', type: 'textureView', format: 'bgra8unorm', access: 'write' },
    ],

    // cobalt event handling functions

    // @params Object cobalt renderer world object
    // @params Object options optional data passed when initing this node
    onInit: async function (cobalt, options={}) {
        return init(cobalt, options)
    },

    onRun: function (cobalt, node, webGpuCommandEncoder, runCount) {
        // do whatever you need for this node. webgpu renderpasses, etc.
        draw(cobalt, node, webGpuCommandEncoder, runCount)
    },

    onDestroy: function (cobalt, node) {
        // any cleanup for your node should go here (releasing textures, etc.)
        destroy(node)
    },

    onResize: function (cobalt, node) {
        // do whatever you need when the dimensions of the renderer change (resize textures, etc.)
        resize(cobalt, node)
    },

    onViewportPosition: function (cobalt, node) {
    	_writeTransformBuffer(cobalt, node)
    },

    // optional
    customFunctions: {
    
        addTriangle: function (cobalt, node, triangleVertices) {
        	const triangleId = uuid()
        	const insertIdx = node.data.spriteCount
        	node.data.spriteIndices.set(triangleId, insertIdx)

        	const offset = insertIdx * FLOAT32S_PER_SPRITE

			// p0
		    node.data.spriteData[offset]   = triangleVertices[0][0]
		    node.data.spriteData[offset+1] = triangleVertices[0][1]
		    
		    // p1
		    node.data.spriteData[offset+2] = triangleVertices[1][0]
		    node.data.spriteData[offset+3] = triangleVertices[1][1]

		    // p2
		    node.data.spriteData[offset+4] = triangleVertices[2][0]
		    node.data.spriteData[offset+5] = triangleVertices[2][1]

			node.data.spriteCount++
        	return triangleId
        },

        removeTriangle: function (cobalt, node, triangleId) {
			node.data.spriteIndices.delete(triangleId)
		    node.data.spriteCount--
        },

        setPosition: function (cobalt, node, triangleId, vertices) {
        	
			const spriteIdx = node.data.spriteIndices.get(triangleId)
		    const offset = spriteIdx * FLOAT32S_PER_SPRITE

		    // p0
		    node.data.spriteData[offset]   = triangleVertices[0][0]
		    node.data.spriteData[offset+1] = triangleVertices[0][1]
		    
		    // p1
		    node.data.spriteData[offset+2] = triangleVertices[1][0]
		    node.data.spriteData[offset+3] = triangleVertices[1][1]

		    // p2
		    node.data.spriteData[offset+4] = triangleVertices[2][0]
		    node.data.spriteData[offset+5] = triangleVertices[2][1]
        },
    },
}


// This corresponds to a WebGPU render pass.  It handles 1 sprite layer.
async function init (cobalt, node) {
    const { device } = cobalt
    
    const MAX_SPRITE_COUNT = 256  // max number of displacement sprites in this render pass

    const numInstances = MAX_SPRITE_COUNT

    const translateFloatCount = 2 // vec2
    const translateSize = Float32Array.BYTES_PER_ELEMENT * translateFloatCount  // in bytes

    const scaleFloatCount = 2 // vec2
    const scaleSize = Float32Array.BYTES_PER_ELEMENT * scaleFloatCount  // in bytes


    const rotationFloatCount = 2 // vec2 (rotation, opacity)
    const rotationSize = Float32Array.BYTES_PER_ELEMENT * rotationFloatCount  // in bytes

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
            /*
            {
                binding: 1,
                visibility: GPUShaderStage.FRAGMENT,
                storageTexture: {
                    access: 'write-only',
                    format: 'rgba16float',
                    viewDimension: '2d'
                }
            },
            */
            
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
            /*
            {
                binding: 3,
                visibility: GPUShaderStage.FRAGMENT,
                texture:  { }
            }
            */
        ],
    })

    const pipelineLayout = device.createPipelineLayout({
        bindGroupLayouts: [ bindGroupLayout ]
    })

    //const map = node.refs.map.data
    //const color = node.refs.color.data
    const sampler = device.createSampler({
        label: `displacement ampler`,
        addressModeU: 'clamp-to-edge',
        addressModeV: 'clamp-to-edge',
        addressModeW: 'clamp-to-edge',
        magFilter: 'linear',
        minFilter: 'linear',
        mipmapFilter: 'linear',
    })


    const bindGroup = device.createBindGroup({
        layout: bindGroupLayout,
        entries: [
            {
                binding: 0,
                resource: {
                    buffer: uniformBuffer
                }
            },
        
            {
                binding: 1,
                resource: node.refs.color.data.view
            },
            {
                binding: 2,
                resource: sampler
            },
            /*
            {
                binding: 3,
                resource: map.texture.view
            }
            */
        ]
    }) 

    const buffer = device.createBuffer({
        size: MAX_SPRITE_COUNT * FLOAT32S_PER_SPRITE,
        usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
    })

    const bufferLayout = {
        arrayStride: 8,
        stepMode: 'vertex',
        attributes: [
            // position
            {
                shaderLocation: 0,
                format: 'float32x2',
                offset: 0
            },
        ]
    }


    const pipeline = device.createRenderPipeline({
        label: 'displacement',
        vertex: {
            module: device.createShaderModule({
                code: displacementWGSL
            }),
            entryPoint: 'vs_main',
            buffers: [ bufferLayout ]
        },

        fragment: {
            module: device.createShaderModule({
                code: displacementWGSL
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
                },
            ]
        },

        primitive: {
            topology: 'triangle-list'
        },

        layout: pipelineLayout
    })

    return {
        bindGroup,
        bindGroupLayout,
        uniformBuffer,

        sampler,

        pipeline,

        buffer, // where the per-triangle vertex data is stored

        // actual vertex data. this is used to update the buffer.
        spriteData: new Float32Array(MAX_SPRITE_COUNT * FLOAT32S_PER_SPRITE), 
        spriteCount: 0,

        spriteIndices: new Map(), // key is spriteId, value is insert index of the sprite. e.g., 0 means 1st sprite , 1 means 2nd sprite, etc.
    }
}


// @param Integer runCount  how many nodes in the graph have been run already
function draw (cobalt, node, commandEncoder, runCount) {

	if (node.data.spriteCount === 0)
		return

    const { device } = cobalt

    const len = FLOAT32S_PER_SPRITE * node.data.spriteCount * Float32Array.BYTES_PER_ELEMENT
  	device.queue.writeBuffer(node.data.buffer, 0, node.data.spriteData.buffer, 0, len)

    const renderpass = commandEncoder.beginRenderPass({
        colorAttachments: [
            // color
            {
                view: node.refs.out,
                clearValue: cobalt.clearValue,
                loadOp: 'load',
                storeOp: 'store'
            },
        ]
    })

    renderpass.setPipeline(node.data.pipeline)
   	
    renderpass.setBindGroup(0, node.data.bindGroup)
	
    renderpass.setVertexBuffer(0, node.data.buffer)

    // render each sprite type's instances
    const vertexCount = node.data.spriteCount * 3 // 3 vertices per triangle
    const instanceCount = 1
    const baseInstanceIdx = 0
    const baseVertexIdx = 0

    renderpass.draw(vertexCount, instanceCount, baseVertexIdx, baseInstanceIdx)

    renderpass.end()
}


function destroy (node) { 
    node.data.bindGroup = null

    node.data.buffer.destroy()
    node.data.buffer = null

    node.data.uniformBuffer.destroy()
    node.data.uniformBuffer = null

    node.data.spriteData = null
    node.data.spriteIndices.clear()
    node.data.spriteIndices = null
}


function resize (cobalt, node) {
    const { device } = cobalt

    // re-build the bind group
    node.data.bindGroup = device.createBindGroup({
        layout: node.data.bindGroupLayout,
        entries: [
            {
                binding: 0,
                resource: {
                    buffer: node.data.uniformBuffer
                }
            },
            {
                binding: 1,
                resource: node.refs.color.data.view
            },
            {
                binding: 2,
                resource: node.data.sampler
            },
            /*
            {
                binding: 3,
                resource: map.texture.view
            }
            */
        ]
    }) 
}


function _writeTransformBuffer (cobalt, node) {
	const { device } = cobalt

    const GAME_WIDTH = cobalt.viewport.width / cobalt.viewport.zoom
    const GAME_HEIGHT = cobalt.viewport.height / cobalt.viewport.zoom

    //                         left          right    bottom        top     near     far
    const projection = mat4.ortho(0,    GAME_WIDTH,   GAME_HEIGHT,    0,   -10.0,   10.0)

    // set x,y,z camera position
    vec3.set(-round(cobalt.viewport.position[0]), -round(cobalt.viewport.position[1]), 0, _tmpVec3)
    const view = mat4.translation(_tmpVec3)

    device.queue.writeBuffer(node.data.uniformBuffer, 0, view.buffer)
    device.queue.writeBuffer(node.data.uniformBuffer, 64, projection.buffer)
}
