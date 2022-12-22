import animationComponent  from './component-animation.js'
import transformComponent  from './component-transform.js'
import { ECS, vec3, vec4 } from './deps.js'


export default function spriteEntity (world, opts) {
    const ENTITY = ECS.createEntity(world)

    ECS.addComponentToEntity(world, ENTITY, 'transform', transformComponent({
        position: vec3.fromValues(opts.position[0], opts.position[1], 0)
    }))

    ECS.addComponentToEntity(world, ENTITY, 'animation', animationComponent({
        name: opts.name
    }))

    ECS.addComponentToEntity(world, ENTITY, 'sprite', {
        name: opts.name,

        // filled in at run time by the renderer when the sprite is created. declares the position of this sprite in the vertex array
        spriteType: -1,

        layer: opts.layer,
        rotation: 0, // radians
        scale: vec3.fromValues(1, 1, 1),
        opacity: 1,  // 0 is transparent, 1 is opaque
        tint: vec4.fromValues(0, 0, 0, 0),

        // location in the spriteRenderPass's Float32Array. we store this so
        // we can update or remove the render data as the sprite component changes
        dataIndex: -1,
    })

    return ENTITY
}
