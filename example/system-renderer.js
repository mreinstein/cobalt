import * as Cobalt from '../bundle.js'
import Game        from './Game.js'
import { ECS }     from './deps.js'


const SPRITE_QUERY = [ 'sprite' ]


// @param Object renderer Cobalt render state
export default function createRendererSystem (renderer) {

    // temporary variables, allocated once to avoid garbage collection
    const buf = new Float32Array(136)  // tile instance data stored in a UBO
    const removedEntities = {
        count: 0,
        entries: new Array(100)
    }

    return function rendererSystem (world) {
    
        const onUpdate = function (/*dt*/) {
     
            const device = renderer.device
            const context = renderer.context

            ECS.getEntities(world, SPRITE_QUERY, 'removed', removedEntities)

            for (let i=0; i < removedEntities.count; i++) {
                const oldSprite = removedEntities.entries[i]
                oldSprite.spriteNode.removeSprite(oldSprite.sprite.cobaltSpriteId)
            }

            Cobalt.draw(Game.renderer)
        }

        return { onUpdate }
    }
}
