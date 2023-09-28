import * as Cobalt   from '../bundle.js'
import Game          from './Game.js'
import { ECS, vec3 } from './deps.js'


const UP_VECTOR = [ 0, 0, 1 ]
const SPRITE = [ 'sprite' ]


// @param Object renderer Cobalt render state
export default function createRendererSystem (renderer) {

    // temporary variables, allocated once to avoid garbage collection
    const _tmpVec3 = vec3.create()
    const buf = new Float32Array(136)  // tile instance data stored in a UBO

    return function rendererSystem (world) {
    
        const removedEntities = {
            count: 0,
            entries: new Array(100)
        }

        const onUpdate = function (dt) {
     
            const device = renderer.device
            const context = renderer.context

            ECS.getEntities(world, SPRITE, 'removed', removedEntities)

            for (let i=0; i < removedEntities.count; i++) {
                const oldSprite = removedEntities.entries[i]
                Cobalt.removeSprite(Game.renderer, oldSprite.sprite.cobaltSpriteId)
            }

            Cobalt.draw(Game.renderer)
        }

        return { onUpdate }
    }
}
