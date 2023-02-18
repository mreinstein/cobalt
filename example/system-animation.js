import * as Cobalt from '../src/cobalt.js'
import Game        from './Game.js'
import { ECS }     from './deps.js'


const SPRITE = [ 'sprite' ]


export default function animationSystem (world) {

    const onUpdate = function (dt) {
        // TODO: remove this short-circuit after bloom is finished
        // temporarily shutting off animation because we're testing an emissive sprite which only has 1 frame
        return

        for (const e of ECS.getEntities(world, SPRITE)) {
               
            e.animation.accumulator++

            if (e.animation.accumulator % 7 === 0) {
                //                                            frame count 
                e.animation.frame = (e.animation.frame + 1) % 6
                Cobalt.setSpriteName(Game.renderer, e.sprite.cobaltSpriteId, `bucky_repeater_shoot_forward-${e.animation.frame}.png`, e.sprite.scale)
            } else {
                Cobalt.setSpriteRotation(Game.renderer, e.sprite.cobaltSpriteId, e.sprite.rotation + 0.01)
            }

            // copying the entire sprite is quite a bit slower when dealing with high sprite counts
            //SpriteRenderPass.updateSprite(Game.renderer, e)
        }
    }

    return { onUpdate }
}
