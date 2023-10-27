# Cobalt

![A chunk of cobalt](cobalt2.jpeg)

An opinionated 2D node graph based on WebGpu, minimizing CPU usage and maximizing frame rate.


## Goals

* pure WebGpu: no fallbacks to WebGl or canvas
* minimal abstractions: provide very light abstractions over what webgpu provides
* gl-matrix compatible: use primitives compatible with how webgpu and webgl store rendering data (float32 arrays)
* GC friendly: does not thrash the garbage collector. uses API design that won't allocate memory all over the place
* back-to-front z-indexing


## Non-goals
This library is intentionally very low level. It provides a way to define nodes, and link them together via refs.
It is _NOT_ a high level abstraction that enables you to forget about how webgpu works.

This library is geared torwards people building their own renderers that want to leverage WebGpu, but want a minimal
node graph implementation that simplifies the linking of textures and other assets between render/compute passes.


## Partial Example

This isn't a complete example by any stretch but shows how to initialize cobalt, 
define the skeleton of a sprite node renderer, and instantiate nodes, linking them together by `refs`, and then a draw loop.

There is a more complete example in `example/index.html` which you can actually run.


```js
import * as Cobalt from 'cobalt'


function main () {
	const c = init(window.innerWidth, window.innerHeight)

	const drawLoop = function () {
		Cobalt.draw(c)
		requestAnimationFrame(drawLoop)
	}

	requestAnimationFrame(drawLoop)
}


// setup our render graph and return a new cobalt instance
function init (viewportWidth, viewportHeight) {
	const c = Cobalt.init(canvas, viewportWidth, viewportHeight)

	// you can define your own types of nodes.
	// Here is a skeleton of your own custom sprite renderer:
	Cobalt.defineNode(c, {
		type: 'sprite',
	    refs: [
	    	{ name: 'spritesheet', type: 'customResource' },
	        { name: 'hdr', type: 'textureView', format: 'rgba16float', access: 'write' },
	    ],

	    // @params Object cobalt renderer world object
	    // @params Object options optional data passed when initing this node
	    onInit: async function (cobalt, options={}) {
	        
	    },

	    onRun: function (cobalt, node, webGpuCommandEncoder) {
	        // do whatever you need for this node for each draw call. perform webgpu renderpasses, etc.
	    },

	    onDestroy: function (cobalt, node) {
	        // any cleanup for your node should go here (releasing textures, etc.
	    },

	    onResize: function (cobalt, node) {
	        // do whatever you need when the dimensions of the renderer change (resize textures, etc.)
	    },

	    onViewportPosition: function (cobalt, node) {
	        // called whenever the viewport position changes
	    },

	    // completely optional functions.
	    // these are exposed on the created node when you init them later.
	    customFunctions: {
	    	//                  the 1st 2 args are injected automatically by cobalt
	    	addSprite: function (cobalt, node, spriteName, ...other args can follow here) {
	    		// TODO: lookup spriteName in node.refs.spritesheet
	    	}
	    }
	})


	// wire up the render graph:

	// spritesheet is a built-in cobalt node
	const spritesheet = await Cobalt.initNode(Game.renderer, {
	    type: 'spritesheet',
	    refs: { },
	    options: {
	        spriteSheetJsonUrl: './assets/spritesheet.json',
	        colorTextureUrl: 'assets/spritesheet.png',
	        emissiveTextureUrl: 'assets/spritesheet_emissive.png'
	    }
	})

	// fbTexture is also a built-in cobalt node type. It's size will match
	// cobalt's viewport size. cobalt will hande resizing this automatically.
	// frame buffer textures are essential for post processing effects.
	const hdrTex = await Cobalt.initNode(Game.renderer, {
	    type: 'fbTexture',
	    refs: { },
	    options: {
	        label: 'hdr color texture',
	        format: 'rgba16float',
	        mip_count: 1,
	        viewportScale: 1.0,
	        usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.STORAGE_BINDING | GPUTextureUsage.TEXTURE_BINDING,
	    }
	})


	// the order of nodes matters. The earlier a node is inited, the lower the z-index.
	// Said differently, the last nodd created will draw after all the other nodes.
	const spriteRenderer = Cobalt.initNode({
		type: 'sprite',
	    refs: {
	        // key is the var name defined in this node. value is the node being pointed to
	        spritesheet: spritesheet,
	        hdr: hdrTex,

	        // when a ref value is set to FRAME_TEXTURE_VIEW this ref will be set to the current frames default view texture.
	        // (basically the final texture that gets written to the screen)
	        out: 'FRAME_TEXTURE_VIEW',
	    },
	    options: {
	        // you can put your own custom options in here for the node that are passed when a new node of this type is init'd
	    }
	})

	// add your sprites by invoking the custom function defined on your sprite node
	spriteRenderer.addSprite( spriteName,...other args)  // sprite 1
	spriteRenderer.addSprite( spriteName,...other args)  // sprite 2
	                                                     // ...
	spriteRenderer.addSprite( spriteName,...other args)  // sprite n

	Cobalt.setViewportPosition(c, [ 50, 50 ]) // center the camera at 50, 50

	// handle window resizing
	resizeViewport(c, viewportWidth, viewportHeight)

	window.addEventListener('resize', function () {
		resizeViewport(c, window.innerWidth, window.innerHeight)
	}, { passive: true })
}


function resizeViewport (cobalt, width, height) {

    const { canvas, device } = cobalt

    // determine which screen dimension is most constrained
    // we floor the render scale to an integer because we get weird texture artifacts when trying to render at
    // certain float values (e.g., 3.0145833333333334)
    const renderScale = Math.floor(Math.min(width/constants.GAME_WIDTH, height/constants.GAME_HEIGHT))

    canvas.width = Math.ceil(constants.GAME_WIDTH)
    canvas.height = Math.ceil(constants.GAME_HEIGHT)

    Cobalt.setViewportDimensions(cobalt, constants.GAME_WIDTH, constants.GAME_HEIGHT)

    // https://www.khronos.org/webgl/wiki/HandlingHighDPI
    // webgpu display resolution size within canvas
    const resolution = window.devicePixelRatio || 1

    // center the canvas if native window doesn't match aspect ratio
    canvas.style.width = canvas.width * renderScale + 'px'
    canvas.style.height = canvas.height * renderScale + 'px'
    
    canvas.style.left = Math.round((width - canvas.width * renderScale) / 2) + 'px'
    canvas.style.top = Math.round((height - canvas.height * renderScale) / 2) + 'px'
}

```
