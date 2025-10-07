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

    const spriteNode = opts.spriteNode

    const cobaltSpriteId = spriteNode.addSprite(opts.name, 
                                           opts.position,
                                           opts.scale,
                                           opts.tint,
                                           opts.opacity,
                                           opts.rotation,
                                           opts.zIndex)

    ECS.addComponentToEntity(world, ENTITY, 'sprite', {
        name: opts.name,

        layer: opts.layer,
        rotation: opts.rotation, // radians
        scale: opts.scale,
        opacity: opts.opacity,  // 0 is transparent, 1 is opaque
        tint: opts.tint,

        // cobalt references
        cobaltSpriteId,
        spriteNode,
    })

    return ENTITY
}
