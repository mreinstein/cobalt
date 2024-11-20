import * as Cobalt from '../../bundle.js'
import Global      from './Global.js'
import { ECS }     from './deps.js'


// @param Object renderer Cobalt render state
export default function rendererSystem (world) {
    
    // Normallly you should never store state in a system
    // but this is a simple demo, so whatever.
    let box1Angle = 0
    let box2Angle = 0
    let zoom = 1


    const onUpdate = function (/*dt*/) {
        const renderer = Global.renderer

        const pNode = renderer.nodes.find((n) => n.type === 'cobalt:primitives')

        pNode.clear()

        pNode.save()
        pNode.translate([ 250, 120 ])
        pNode.rotate(box2Angle)
        pNode.scale([ 1.5 + Math.sin(zoom), 1.5 + Math.sign(zoom) ])
        pNode.translate([ -250, -120 ])
        const pt1 = [ 150, 120 ]
        const pt2 = [ 350, 120 ]
        pNode.line(pt1,  pt2, [ 1, 0, 0, 1 ], 2)
        pNode.restore()

        pNode.save()
        pNode.translate([ 50, 170 ])
        pNode.rotate(box2Angle)
        pNode.translate([ -50, -170 ])
        pNode.filledBox([ 50, 170 ], 42, 23, [ 0, 1, 0, 1 ])

        pNode.restore()

        pNode.line([ 100, 10 ], [ 100, 100 ], [ 1, 1, 0, 1 ], 1)
        pNode.line([ 450, 10 ], [ 100, 100 ], [ 0, 1, 1, 1 ], 1)

        pNode.filledEllipse([ 180, 80 ], 20, 40, 20, [ 1, 0, 1, 0.6 ])

        pNode.filledEllipse([ 192, 140 ], 8, 8, 20, [ 1, 1, 1, 0.9 ])

        pNode.ellipse([ 240, 140 ], 8, 18, 20, [ 0, 0, 1, 0.9 ])

        //            pos        w   h          c       lineW
        pNode.box([ 120, 130 ], 42, 23, [ 1, 0, 1, 1 ], 1)


        const segments = [
             [ [ 200, 200 ], [ 210, 230 ] ],
             [ [ 210, 230 ], [ 240, 180 ] ],
             [ [ 240, 180 ], [ 260, 199 ] ],
             
        ]
        pNode.strokePath(segments, [ 0, 1, 0, 1 ], 1)


        pNode.translate([ 330, 170 ])
        pNode.rotate(-box2Angle)
        pNode.translate([ -330, -170 ])

        const points = [
            [ 300, 200 ],
            [ 310, 220 ],
            [ 370, 150 ],
            [ 315, 110 ],
        ]
        pNode.filledPath(points, [ 0, 1, 1, 1 ])

        box1Angle -= 0.05
        box2Angle += 0.05
        zoom += 0.05

        Cobalt.draw(Global.renderer)
    }

    return { onUpdate }
}
