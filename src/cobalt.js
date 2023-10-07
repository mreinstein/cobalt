export { default as createTexture } from './create-texture.js'

// built-in run nodes
import bloomNode                    from './bloom/bloom.js'
import compositeNode                from './scene-composite/scene-composite.js'
import spriteNode                   from './sprite/sprite.js'
import tileNode                     from './tile/tile.js'
// built-in resource nodes
import tileAtlasNode                from './tile/atlas.js'
import spritesheetNode              from './sprite/spritesheet.js'
import fbTextureNode                from './fb-texture/fb-texture.js'
import overlayNode                  from './overlay/overlay.js'      


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
        overlay: overlayNode,
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
            position: [ 0, 0 ]  // [ top, left ] visible point
        },
	}
}


export function defineNode (c, nodeDefinition) {
    if (!c.nodeDefs[nodeDefinition?.type])
        throw new Error(`Can't define a new node missing a type.`)

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
        data: data || { },
        enabled: true, // when disabled, the node won't be run
    }

    // copy in all custom functions, and ensure the first parameter is the node itself 
    const customFunctions = nodeDef.customFunctions || { }
    for (const fnName in customFunctions) {
        node[fnName] = function (...args) {
            return customFunctions[fnName](c, node, ...args)
        }
    }

    c.nodes.push(node)
    return node
}


export function draw (c) {
	const { device, context } = c

    const commandEncoder = device.createCommandEncoder()

    const v = c.context.getCurrentTexture().createView()

    let runCount = 0 // track how many nodes have run so far this frame

    // run all of the defined nodes
    for (const n of c.nodes) {
        const nodeDef = c.nodeDefs[n.type]

        // some nodes may need a reference to the default texture view (the frame backing)
        // this is generated each draw frame so we need to update the references
        for (const arg of nodeDef.refs)
            if (arg.type === 'webGpuTextureFrameView')
                n.refs[arg.name] = v

        if (n.enabled) {
            nodeDef.onRun(c, n, commandEncoder, runCount)
            runCount++
        }
    }

    device.queue.submit([ commandEncoder.finish() ])
}


// clean up all the loaded data so we could re-load a level, etc.
export function reset (c) {

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
}
