import * as Cobalt from '../../bundle.js'
import Game        from './Game.js'
import { ECS }     from './deps.js'


// @param Object renderer Cobalt render state
export default function createRendererSystem (renderer) {

    // temporary variables, allocated once to avoid garbage collection
    const buf = new Float32Array(136)  // tile instance data stored in a UBO

    return function rendererSystem (world) {
    
        const onUpdate = function (/*dt*/) {
     
            const device = renderer.device
            const context = renderer.context

            Cobalt.draw(Game.renderer)
        }

        return { onUpdate }
    }
}
