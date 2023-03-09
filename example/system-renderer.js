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


// build instancedDrawCalls
function rebuildSpriteDrawCalls (renderPass) {
    let currentSpriteType = -1
    let instanceCount = 0
    renderPass.instancedDrawCallCount = 0

    for (let i=0; i < renderPass.spriteCount; i++) {
        const s = renderPass.spriteEntities[i].sprite

        if (s.spriteType !== currentSpriteType) {
            currentSpriteType = s.spriteType
            instanceCount = 0
        }

        instanceCount++

        renderPass.instancedDrawCalls[renderPass.instancedDrawCallCount * 2]     = s.spriteType
        renderPass.instancedDrawCalls[renderPass.instancedDrawCallCount * 2 + 1] = instanceCount
        renderPass.instancedDrawCallCount++
    }

    if (instanceCount > 0) {
        renderPass.instancedDrawCalls[renderPass.instancedDrawCallCount * 2]     = currentSpriteType
        renderPass.instancedDrawCalls[renderPass.instancedDrawCallCount * 2 + 1] = instanceCount
        renderPass.instancedDrawCallCount++
    }
}
