import * as Cobalt from '../bundle.js'
import { ECS }     from './deps.js'


const SPRITE_QUERY = [ 'sprite' ]


export default function animationSystem (world) {

    const onUpdate = function (dt) {
        for (const e of ECS.getEntities(world, SPRITE_QUERY)) {
               
            e.animation.accumulator++

            if (e.animation.accumulator % 7 === 0) {
                //                                            frame count 
                e.animation.frame = (e.animation.frame + 1) % 6
                e.sprite.spriteNode.setSpriteName(e.sprite.cobaltSpriteId, `bucky_repeater_shoot_forward-${e.animation.frame}.png`, e.sprite.scale)
            } else {
                 e.sprite.spriteNode.setSpriteRotation(e.sprite.cobaltSpriteId, e.sprite.rotation + 0.01)
            }
        }
    }

    return { onUpdate }
}
