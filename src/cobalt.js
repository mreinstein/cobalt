export { default as createTexture }        from './create-texture.js'
export { default as createTextureFromUrl } from './create-texture-from-url.js'


// built-in run nodes
import bloomNode        from './bloom/bloom.js'
import compositeNode    from './scene-composite/scene-composite.js'
import spriteNode       from './sprite/sprite.js'
import tileNode         from './tile/tile.js'
import displacementNode from './displacement/displacement.js'
import overlayNode      from './overlay/overlay.js'    
import fbBlitNode       from './fb-blit/fb-blit.js'  
import primitivesNode   from './primitives/primitives.js'

// built-in resource nodes
import tileAtlasNode    from './tile/atlas.js'
import spritesheetNode  from './sprite/spritesheet.js'
import fbTextureNode    from './fb-texture/fb-texture.js'


// create and initialize a WebGPU renderer for a given canvas
// returns the data structure containing all WebGPU related stuff
export async function init (ctx, viewportWidth, viewportHeight) {

    let device, gpu, context, canvas

    // determine if an sdl/gpu context was passed, or if this is a browser canvas
    if (ctx.sdlWindow && ctx.gpu) {
        // this is an sdl/gpu context
        gpu = ctx.gpu
        
        const instance = gpu.create([ "verbose=1" ])
        const adapter = await instance.requestAdapter()
        device = await adapter.requestDevice()
        context = gpu.renderGPUDeviceToWindow({ device, window: ctx.sdlWindow })

        // gpu module doesn't expose these globals to node namespace so manually wire them up
        global.GPUBufferUsage = gpu.GPUBufferUsage
        global.GPUShaderStage = gpu.GPUShaderStage
        global.GPUTextureUsage = gpu.GPUTextureUsage

    } else {
        // ctx is a canvas element
        canvas = ctx

        const adapter = await navigator.gpu?.requestAdapter({ powerPreference: 'high-performance' })

        device = await adapter?.requestDevice()
        gpu = navigator.gpu

        context = canvas.getContext('webgpu')

        context.configure({
            device,
            format: navigator.gpu?.getPreferredCanvasFormat(), // bgra8unorm
            alphaMode: 'opaque'
        })
    }
    

    const nodeDefs = {
        // TODO: namespace the builtins?  e.g., builtin_bloom or cobalt_bloom, etc.
        //
        // built in resource nodes
        tileAtlas: tileAtlasNode,
        spritesheet: spritesheetNode,
        fbTexture: fbTextureNode,

        // builtin run nodes
        bloom: bloomNode,
        composite: compositeNode,
        sprite: spriteNode,
        tile: tileNode,
        displacement: displacementNode,
        overlay: overlayNode,
        fbBlit: fbBlitNode,
        primitives: primitivesNode,
    }

    return {
        nodeDefs,
        // runnable nodes. ordering dictates render order (first to last)
        nodes: [ ],

        // keeps references to all node refs that need to access the per-frame default texture view
        // these refs are updated on each invocation of Cobalt.draw(...)
        defaultTextureViewRefs: [ ],

		canvas,
		device,
		context,
        gpu,

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
    if (!nodeDefinition?.type)
        throw new Error(`Can't define a new node missing a type.`)

    c.nodeDefs[nodeDefinition.type] = nodeDefinition
}


export async function initNode (c, nodeData) {
    const nodeDef = c.nodeDefs[nodeData?.type]

    if (!nodeDef)
        throw new Error(`Can't initialize a new node missing a type.`)

    const node = {
        type: nodeData.type,
        refs: nodeData.refs || { },
        options: nodeData.options || { },
        data: { },
        enabled: true, // when disabled, the node won't be run
    }

    for (const refName in node.refs) {
        if (node.refs[refName] === 'FRAME_TEXTURE_VIEW') {
            c.defaultTextureViewRefs.push({ node, refName })
            node.refs[refName] = getCurrentTextureView(c)
        }
    }

    node.data = await nodeDef.onInit(c, node)

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

    const v = getCurrentTextureView(c)

    // some nodes may need a reference to the default texture view (the frame backing)
    // this is generated each draw frame so we need to update the references
    for (const r of c.defaultTextureViewRefs)
        r.node.refs[r.refName] = v

    // run all of the enabled nodes
    for (const node of c.nodes) {
        if (!node.enabled)
            continue

        const nodeDef = c.nodeDefs[node.type]
        nodeDef.onRun(c, node, commandEncoder)
    }

    device.queue.submit([ commandEncoder.finish() ])

    // for sdl + gpu setups, we need to do this swap() step
    if (!c.canvas)
        c.context.swap()
}


// clean up all the loaded data so we could re-load a level, etc.
export function reset (c) {
    for (const n of c.nodes) {
        const nodeDef = c.nodeDefs[n.type]
        nodeDef.onDestroy(c, n)
    }
    c.nodes.length = 0
    c.defaultTextureViewRefs.length = 0
}


export function setViewportDimensions (c, width, height) {
	c.viewport.width = width
	c.viewport.height = height

    for (const n of c.nodes) {
        const nodeDef = c.nodeDefs[n.type]
        nodeDef.onResize(c, n)
    }
}


// @param Array pos top left corner of da viewport
export function setViewportPosition (c, pos) {
    c.viewport.position[0] = pos[0] - (c.viewport.width / 2 / c.viewport.zoom)
    c.viewport.position[1] = pos[1] - (c.viewport.height / 2 / c.viewport.zoom)

    for (const n of c.nodes) {
        const nodeDef = c.nodeDefs[n.type]
        nodeDef.onViewportPosition(c, n)
    }
}


export function getPreferredFormat (cobalt) {
    if (cobalt.canvas)
        return navigator.gpu.getPreferredCanvasFormat()
    else
        return cobalt.context.getPreferredFormat()
}


export function getCurrentTextureView (cobalt) {
    if (cobalt.canvas)
        return cobalt.context.getCurrentTexture().createView()
    else {
        //return cobalt.context.getCurrentTexture().createView()
        return cobalt.context.getCurrentTextureView()
    }
}
