import Global           from './Global.js'
import * as Cobalt      from '../../bundle.js'
import constants        from './constants.js'
import dat              from 'https://cdn.skypack.dev/pin/dat.gui@v0.7.9-2wtQAdFH5SRwnJLDWGNz/mode=imports,min/optimized/dat.gui.js'
import debounce         from 'https://cdn.skypack.dev/pin/lodash.debounce@v4.0.8-4GXU9B066R3Th6HmjZmO/lodash.debounce.js'
import rendererSystem   from './system-renderer.js'
import { ECS, vec2 }    from './deps.js'


async function main () {

    const canvas = document.querySelector('canvas')

    const viewportWidth = constants.GAME_WIDTH
    const viewportHeight = constants.GAME_HEIGHT
    Global.renderer = await Cobalt.init(canvas, viewportWidth, viewportHeight)

    // instantiate all resource nodes
    
    const pNode = await Cobalt.initNode(Global.renderer, {
        type: 'cobalt:primitives',
        refs: {
            // key is the var name defined in this node
            // value is the var name in the cobalt resources dictionary
            color: 'FRAME_TEXTURE_VIEW',
        },
        options: { }
    })

    // use resizeViewport to init values on load:
    resizeViewport(Global.renderer, window.innerWidth, window.innerHeight)

    // window resize is *expensive* - best to debounce:
    const debouncedResize = debounce(function () {
       resizeViewport(Global.renderer, window.innerWidth, window.innerHeight) 
    }, 50)

    window.addEventListener('resize', debouncedResize, { passive: true })

    const world = ECS.createWorld()
    ECS.addSystem(world, rendererSystem)
    
    Global.world = world

    const gameLoop = function () {
        const newTime = performance.now()
        const frameTime = newTime - Global.lastFrameTime
        Global.lastFrameTime = newTime
        ECS.update(world, frameTime)
        ECS.cleanup(world)

        requestAnimationFrame(gameLoop)
    }

    requestAnimationFrame(gameLoop)
}


function resizeViewport (renderer, width, height) {

    const { canvas, device } = renderer

    // determine which screen dimension is most constrained
    // we floor the render scale to an integer because we get weird texture artifacts when trying to render at
    // certain float values (e.g., 3.0145833333333334)
    const renderScale = Math.floor(Math.min(width/constants.GAME_WIDTH, height/constants.GAME_HEIGHT))

    canvas.width = Math.ceil(constants.GAME_WIDTH)
    canvas.height = Math.ceil(constants.GAME_HEIGHT)

    Cobalt.setViewportDimensions(renderer, constants.GAME_WIDTH, constants.GAME_HEIGHT)

    // https://www.khronos.org/webgl/wiki/HandlingHighDPI
    // webgl display resolution size within canvas
    const resolution = window.devicePixelRatio || 1

    // center the canvas if native window doesn't match aspect ratio
    canvas.style.width = canvas.width * renderScale + 'px'
    canvas.style.height = canvas.height * renderScale + 'px'
    
    canvas.style.left = Math.round((width - canvas.width * renderScale) / 2) + 'px'
    canvas.style.top = Math.round((height - canvas.height * renderScale) / 2) + 'px'
}


main()
