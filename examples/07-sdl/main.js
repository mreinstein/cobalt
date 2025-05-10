import * as Cobalt       from '../../bundle.js'
import sdl               from '@kmamal/sdl'
import gpu               from '@kmamal/gpu'
import { PNG }           from 'pngjs'
import fs                from 'node:fs'
import path              from 'node:path'
import { fileURLToPath } from 'node:url'
import { vec3, vec4 }    from 'wgpu-matrix'


const __dirname = fileURLToPath(new URL('.', import.meta.url))


async function main () {
    const window = sdl.video.createWindow({ webgpu: true, width: 480, height: 270 })

    window.setTitle('examples/07-sdl')

    //const { pixelWidth: width, pixelHeight: height } = window
    const width = 480
    const height = 270

    const c = await Cobalt.init({ sdlWindow: window, gpu }, width, height)

    // instantiate all resource nodes
    const spriteSheetJson = JSON.parse(fs.readFileSync(path.join(__dirname, 'assets/spritesheet.json'), 'utf8'))
 
    const pngData = await fs.promises.readFile(path.join(__dirname, 'assets/spritesheet.png'))
    const colorTexture = PNG.sync.read(pngData)

    const pngData2 = await fs.promises.readFile(path.join(__dirname, 'assets/spritesheet_emissive.png'))
    const emissiveTexture = PNG.sync.read(pngData2)

    
    const pNode = await Cobalt.initNode(c, {
        type: 'cobalt:primitives',
        refs: {
            // key is the var name defined in this node
            // value is the var name in the cobalt resources dictionary
            color: 'FRAME_TEXTURE_VIEW',
        },
        options: {
            //zIndex: 5,
        }
    })

    //              start        end            color        width
    pNode.line([ 0, 0 ],  [ 479, 269 ], [ 1, 0, 0, 1 ], 5)
    pNode.line([ 100, 10 ], [ 100, 100 ], [ 1, 1, 0, 1 ], 1)
    pNode.line([ 450, 10 ], [ 100, 100 ], [ 0, 1, 1, 1 ], 1)

    pNode.filledEllipse([ 180, 80 ], 20, 40, 20, [ 1, 0, 1, 0.6 ])

    pNode.filledEllipse([ 192, 140 ], 8, 8, 20, [ 1, 1, 1, 0.9 ])

    pNode.filledBox([ 50, 170 ], 42, 23, [ 0, 1, 0, 1 ])

    pNode.box([ 120, 130 ], 42, 23, [ 1, 0, 1, 1 ], 1)
    
    

    const spritesheet = await Cobalt.initNode(c, {
        type: 'cobalt:spritesheet',
        refs: { },
        options: {
            spriteSheetJson,
            colorTexture,
            emissiveTexture,
        }
    })

    
    const overlayNode = await Cobalt.initNode(c, {
        type: 'cobalt:overlay',
        refs: {
            // key is the var name defined in this node
            // value is the var name in the cobalt resources dictionary
            spritesheet: spritesheet,
            color: 'FRAME_TEXTURE_VIEW',
        },
        options: { }
    })
    
    // test sprites
    overlayNode.addSprite('health-0.png',  // name
                           [ 20, 20 ],     // position
                           vec3.create(1, 1, 1),
                           vec4.create(0, 0, 0, 0),  // tint
                           1.0, // opacity
                           0,  // rotation
                           //zIndex
                          )

    overlayNode.addSprite('health-0.png',  // name
                           [ 420, 220 ],     // position
                           vec3.create(1, 1, 1),
                           vec4.create(0, 0, 0, 0),  // tint
                           1.0, // opacity
                           0,  // rotation
                           //zIndex
                          )

    Cobalt.setViewportDimensions(c, width, height)
    Cobalt.draw(c)
}


main()
