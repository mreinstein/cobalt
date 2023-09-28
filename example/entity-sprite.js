import * as Cobalt         from '../bundle.js'
import Game                from './Game.js'
import animationComponent  from './component-animation.js'
import transformComponent  from './component-transform.js'
import { ECS, vec3, vec4 } from './deps.js'


export default function spriteEntity (world, opts) {
    const ENTITY = ECS.createEntity(world)

    ECS.addComponentToEntity(world, ENTITY, 'transform', transformComponent({
        position: vec3.create(opts.position[0], opts.position[1], 0)
    }))

    ECS.addComponentToEntity(world, ENTITY, 'animation', animationComponent({
        name: opts.name
    }))

    const tint = vec4.create(0, 0, 0, 0)

    const opacity = opts.opacity ?? 255

    const cobaltSpriteId = Cobalt.addSprite(Game.renderer,
                                           opts.name, 
                                           opts.position,
                                           opts.width,
                                           opts.height,
                                           vec3.create(1, 1, 1),
                                           tint,
                                           opacity / 255,
                                           opts.rotation || 0,
                                           opts.zIndex)

    ECS.addComponentToEntity(world, ENTITY, 'sprite', {
        name: opts.name,

        layer: opts.layer,
        rotation: 0, // radians
        scale: vec3.create(1, 1, 1),
        opacity: 1,  // 0 is transparent, 1 is opaque
        tint: vec4.create(0, 0, 0, 0),

        cobaltSpriteId,
    })

    return ENTITY
}
