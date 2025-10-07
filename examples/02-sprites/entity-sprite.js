import * as Cobalt         from '../../bundle.js'
import animationComponent  from './component-animation.js'
import transformComponent  from './component-transform.js'
import { ECS, vec2, vec3, vec4 } from './deps.js'


export default function spriteEntity (world, opts) {
    const ENTITY = ECS.createEntity(world)

    ECS.addComponentToEntity(world, ENTITY, 'transform', transformComponent({
        position: vec3.create(opts.position[0], opts.position[1], 0)
    }))

    ECS.addComponentToEntity(world, ENTITY, 'animation', animationComponent({
        name: opts.name
    }))

    const tint = opts.tint || vec4.fromValues(0, 0, 0, 0)

    const opacity = opts.opacity ?? 1

    const spriteNode = opts.spriteNode

    const scale = vec2.fromValues(1, 1)


    const cobaltSpriteId = spriteNode.addSprite(opts.name, 
                                           opts.position,
                                           scale,
                                           tint,
                                           opacity,
                                           opts.rotation ?? 0,
                                           opts.zIndex)

    ECS.addComponentToEntity(world, ENTITY, 'sprite', {
        name: opts.name,

        layer: opts.layer,
        rotation: opts.rotation ?? 0, // radians
        scale,
        opacity,  // 0 is transparent, 1 is opaque
        tint,

        // cobalt references
        cobaltSpriteId,
        spriteNode,
    })

    return ENTITY
}
