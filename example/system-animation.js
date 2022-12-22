import * as SpriteRenderPass from '../src/SpriteRenderPass.js'
import Game                  from './Game.js'
import ECS                   from 'https://cdn.skypack.dev/ecs'


const SPRITE = [ 'sprite' ]


export default function animationSystem (world) {
    
    const tmp = [
        'bucky_repeater_shoot_forward-0.png',
        'bucky_repeater_shoot_forward-1.png',
        'bucky_repeater_shoot_forward-2.png',
        'bucky_repeater_shoot_forward-3.png',
        'bucky_repeater_shoot_forward-4.png',
        'bucky_repeater_shoot_forward-5.png' ]

    const lookup = { } // key is sprite name, value is spriteType

    for (const l in Game.spritesheet.locations)
        lookup[Game.spritesheet.locations[l]] = parseInt(l, 10)

    const onUpdate = function (dt) {
        for (const e of ECS.getEntities(world, SPRITE)) {
               
            e.animation.accumulator++

            if (e.animation.accumulator % 7 === 0) {
                setNextSpriteFrame(e, tmp, lookup)
                SpriteRenderPass.updateSpriteAnimation(Game.renderer, e)
            } else {
                e.sprite.rotation += 0.01
                //e.sprite.scale[0] += 0.01
                //e.sprite.scale[1] += 0.01
                SpriteRenderPass.updateSpriteRotation(Game.renderer, e)
            }

            // copying the entire sprite is quite a bit slower when dealing with high sprite counts
            //SpriteRenderPass.updateSprite(Game.renderer, e)
        }
    }

    return { onUpdate }
}


function setNextSpriteFrame (e, tmp, lookup) {
    e.animation.frame = (e.animation.frame + 1) % tmp.length
    e.sprite.name = tmp[e.animation.frame]
    e.sprite.spriteType = lookup[e.sprite.name]
}
