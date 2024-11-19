import * as Cobalt from '../../bundle.js'
import Global      from './Global.js'
import { ECS }     from './deps.js'


// @param Object renderer Cobalt render state
export default function rendererSystem (world) {
    
    let box1Angle = 0
    let box2Angle = 0


    const onUpdate = function (/*dt*/) {
        const renderer = Global.renderer
        const device = renderer.device
        const context = renderer.context


        const pNode = renderer.nodes.find((n) => n.type === 'cobalt:primitives')

        pNode.clear()

        //              start        end            color        width
        pNode.line([ 10, 10 ],  [ 150, 100 ], [ 1, 0, 0, 1 ], 5)
        pNode.line([ 100, 10 ], [ 100, 100 ], [ 1, 1, 0, 1 ], 1)
        pNode.line([ 450, 10 ], [ 100, 100 ], [ 0, 1, 1, 1 ], 1)

        pNode.filledEllipse([ 180, 80 ], 20, 40, 20, [ 1, 0, 1, 0.6 ])

        pNode.filledEllipse([ 192, 140 ], 8, 8, 20, [ 1, 1, 1, 0.9 ])

        pNode.ellipse([ 240, 140 ], 8, 18, 20, [ 0, 0, 1, 0.9 ])

        //                   pos      w   h       c            ϴ
        pNode.filledBox([ 50, 170 ], 42, 23, [ 0, 1, 0, 1 ], box1Angle)

        //            pos        w   h          c        ϴ        lineW
        pNode.box([ 120, 130 ], 42, 23, [ 1, 0, 1, 1 ], box2Angle, 1)

        box1Angle -= 0.05
        box2Angle += 0.05


        Cobalt.draw(Global.renderer)
    }

    return { onUpdate }
}
