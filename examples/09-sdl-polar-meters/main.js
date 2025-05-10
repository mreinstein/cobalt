import * as Cobalt from '../../bundle.js'
import sdl         from '@kmamal/sdl'
import gpu         from '@kmamal/gpu'
import { vec2 }    from 'wgpu-matrix'


async function main () {
    const width = 480
    const height = 340

    const window = sdl.video.createWindow({ webgpu: true, width, height/*, borderless: true*/ })

    window.setTitle('examples/09-sdl-polar-meters')

    const c = await Cobalt.init({ sdlWindow: window, gpu }, width, height)

    const pNode = await Cobalt.initNode(c, {
        type: 'cobalt:primitives',
        refs: {
            // key is the var name defined in this node
            // value is the var name in the cobalt resources dictionary
            color: 'FRAME_TEXTURE_VIEW',
        },
        options: { }
    })

    const gameLoop = function () {

        const z = 16.0 

        c.viewport.zoom = z  // pixels per meter

        Cobalt.setViewportDimensions(c, width, height)
        Cobalt.setViewportPosition(c, [ 1, -16 ])
        //Cobalt.setViewportPosition(c, [ 240, 170 ])

        pNode.clear()

        //pNode.filledBox([ 240, 170 ], 480/z, 340/z, [ 0, 1, 0, 1 ])
        pNode.filledBox([ 1, -16 ], 1.0, 2.0, [ 0, 1, 0, 1 ])
        

        Cobalt.draw(c)
    }

    gameLoop()

}


main()
