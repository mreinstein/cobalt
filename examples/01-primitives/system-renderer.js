import * as Cobalt from '../../bundle.js'
import Global      from './Global.js'
import { ECS }     from './deps.js'


// @param Object renderer Cobalt render state
export default function rendererSystem (world) {
    
    const onUpdate = function (/*dt*/) {
        const renderer = Global.renderer
        const device = renderer.device
        const context = renderer.context
        Cobalt.draw(Global.renderer)
    }

    return { onUpdate }
}
