import Game                            from './Game.js'
import * as SpriteRenderPass           from './SpriteRenderPass.js'
import constants                       from './constants.js'
import { ECS, mat4, vec2, vec3, vec4 } from './deps.js'


const UP_VECTOR = [ 0, 0, 1 ]
const SPRITE = [ 'sprite' ]

// temporary variables, allocated once to avoid garbage collection
const _tmpMat4 = mat4.create()
const _tmpVec3 = vec3.create()
const _tmpVec4 = vec4.create()
const buf = new Float32Array(136)  // tile instance data stored in a UBO


export default function rendererSystem (world) {
    
    const onUpdate = function (dt) {
 
        const device = Game.renderer.device
        const context = Game.renderer.context
        const renderPasses = Game.renderer.renderPasses

        for (const newSprite of ECS.getEntities(world, SPRITE, 'added'))
            SpriteRenderPass.addSprite(newSprite, Game.renderer)

        for (const newSprite of ECS.getEntities(world, SPRITE, 'removed'))
            SpriteRenderPass.removeSprite(newSprite, Game.renderer)


        // camera stuff
        /* 
        const Camera = {
            position: vec2.fromValues(constants.GAME_WIDTH / 2, constants.GAME_HEIGHT / 2),
            shake: vec2.create()
        }
        const viewport = {
            position: vec2.fromValues(
                -round(Camera.position[0] + Camera.shake[0]) + constants.GAME_WIDTH / 2,
                -round(Camera.position[1] + Camera.shake[1]) + constants.GAME_HEIGHT / 2
            )
        }
        */

        // write tile metadata to UBO
        const elapsed = performance.now()
        const x = (Math.sin(elapsed / 2000) * 0.5 + 0.5) * 128
        const y = (Math.sin(elapsed / 5000) * 0.5 + 0.5) * 170

        const tile = Game.renderer.tile
        const tileScale = tile.tileScale
        const tileSize = tile.tileSize

        vec2.set(Game.renderer.viewport.position, Math.floor(x * tileScale), Math.floor(y * tileScale))


        // TODO: I think zoom can be achieved by adjusting the left/right/bottom/top based on scale factor
        const projection = mat4.create()
        //                out    left   right    bottom   top     near     far
        //mat4.ortho(projection,    0,    800,      600,    0,   -10.0,   10.0)
        mat4.ortho(projection,    0,    constants.GAME_WIDTH,   constants.GAME_HEIGHT,    0,   -10.0,   10.0)

        //mat4.scale(projection, projection, [1.5, 1.5, 1 ])
    
        const view = mat4.create()
        // set x,y,z camera position
        vec3.set(_tmpVec3, -Game.renderer.viewport.position[0], -Game.renderer.viewport.position[1], 0)
        mat4.fromTranslation(view, _tmpVec3)
    
        // might be useful if we ever switch to a 3d perspective camera setup
        //mat4.lookAt(view, [0, 0, 0], [0, 0, -1], [0, 1, 0])
        //mat4.targetTo(view, [0, 0, 0], [0, 0, -1], [0, 1, 0])
    
        // camera zoom
        //mat4.scale(view, view, [ 0.9, 0.9, 1 ])
    
        //mat4.fromScaling(view, [ 1.5, 1.5, 1 ])
        //mat4.translate(view, view, [ 0, 0, 0 ])

        device.queue.writeBuffer(Game.renderer.sprite.uniformBuffer, 0, view.buffer)
        device.queue.writeBuffer(Game.renderer.sprite.uniformBuffer, 64, projection.buffer)


        const commandEncoder = device.createCommandEncoder()
        const textureView = context.getCurrentTexture().createView()
        
        // viewOffset.  [ 0, 0 ] is the top left corner of the level
        buf[0] = Game.renderer.viewport.position[0] // viewoffset[0] 
        buf[1] = Game.renderer.viewport.position[1] // viewOffset[1]


        // TODO: everything after buf[1] doesn't need to be updated every frame

        buf[2] = constants.GAME_WIDTH / tileScale          // viewportSize[0]
        buf[3] = constants.GAME_HEIGHT / tileScale         // viewportSize[1]

        buf[4] = 1 / tile.spritesMaterial.imageData.width  // inverseSpriteTextureSize[0]
        buf[5] = 1 / tile.spritesMaterial.imageData.height // inverseSpriteTextureSize[1]

        buf[6] = tileSize
        buf[7] = 1.0 / tileSize                            // inverseTileSize

        // copy each tile layer's instance data into the UBO
        let i = 8
        for (const rp of Game.renderer.renderPasses) {
            if (rp.type === 'tile' && rp.layers.length) {
                for (const l of rp.layers) {
                    buf[i]   = l.scrollScale        // scrollScale[0]
                    buf[i+1] = l.scrollScale        // scrollScale[1]
                    buf[i+2] = 1/l.imageData.width  // inverseTileTextureSize[0]
                    buf[i+3] = 1/l.imageData.height // inverseTileTextureSize[1]
                    i += 4
                }
            }
        }
        
        device.queue.writeBuffer(tile.uniformBuffer, 0, buf, 0, i)

        let actualRenderCount = 0 // number of renderpasses taht actually activated so far

        for (const renderPass of renderPasses) {

            const loadOp = (actualRenderCount < 1) ? 'clear' : 'load'

            if (renderPass.type === 'tile' && renderPass.layers.length) {
                actualRenderCount++
                //const commandEncoder = device.createCommandEncoder()
                //const textureView = context.getCurrentTexture().createView()

                const renderpass = commandEncoder.beginRenderPass({
                    colorAttachments: [
                        {
                            view: textureView,
                            clearValue: Game.renderer.clearValue,
                            loadOp,
                            storeOp: 'store'
                        }
                    ]
                })

                renderpass.setPipeline(tile.pipeline)
                renderpass.setVertexBuffer(0, tile.triangleMesh.buffer)
    
                // common stuff; the transform data and the sprite texture
                renderpass.setBindGroup(1, tile.spriteBindGroup)

                // render each of the tile layers
                for (let j=0; j < renderPass.layers.length; j++) {
                    renderpass.setBindGroup(0, renderPass.layers[j].bindGroup)
                    // vertexCount, instanceCount, baseVertexIdx, baseInstanceIdx
                    renderpass.draw(6, 1, 0, renderPass.layers[j].instanceIndex)
                }

                renderpass.end()


            } else if (renderPass.type === 'sprite' && renderPass.spriteCount > 0) {
                actualRenderCount++

                if (renderPass.dirty) {
                    rebuildDrawCalls(renderPass)
                    renderPass.dirty = false
                }

                device.queue.writeBuffer(renderPass.spriteBuffer, 0, renderPass.spriteData.buffer)

                const renderpass = commandEncoder.beginRenderPass({
                    colorAttachments: [
                        {
                            view: textureView,
                            clearValue: Game.renderer.clearValue,
                            loadOp,
                            storeOp: 'store'
                        }
                    ]
                })
            
                renderpass.setPipeline(Game.renderer.sprite.pipeline)
                renderpass.setBindGroup(0, renderPass.bindGroup)
                renderpass.setVertexBuffer(0, Game.renderer.sprite.triangleMesh.buffer)

                // write sprite instance data into the storage buffer, sorted by sprite type. e.g.,
                //      renderpass.draw(6,  1,  0, 0)  //  1 hero instance
                //      renderpass.draw(6, 14,  6, 1)  // 14 bat instances
                //      renderpass.draw(6,  5, 12, 15) //  5 bullet instances

                // render each sprite type's instances
                const vertexCount = 6
                let baseInstanceIdx = 0

                for (let i=0; i < renderPass.instancedDrawCallCount; i++) {
                    // [
                    //    baseVtxIdx0, instanceCount0,
                    //    baseVtxIdx1, instanceCount1,
                    //    ...
                    // ]
                    const baseVertexIdx = renderPass.instancedDrawCalls[i*2  ] * vertexCount
                    const instanceCount = renderPass.instancedDrawCalls[i*2+1]
                    renderpass.draw(vertexCount, instanceCount, baseVertexIdx, baseInstanceIdx)
                    baseInstanceIdx += instanceCount
                }

                renderpass.end()
            }
        }

        device.queue.submit([ commandEncoder.finish() ])
    }

    return { onUpdate }
}


// build instancedDrawCalls
function rebuildDrawCalls (renderPass) {
    let currentSpriteType = -1
    let instanceCount = 0
    renderPass.instancedDrawCallCount = 0

    for (let i=0; i < renderPass.spriteCount; i++) {
        const s = renderPass.spriteEntities[i].sprite
        if (s.spriteType !== currentSpriteType) {
            if (instanceCount > 0) {
                renderPass.instancedDrawCalls[renderPass.instancedDrawCallCount * 2]     = s.spriteType
                renderPass.instancedDrawCalls[renderPass.instancedDrawCallCount * 2 + 1] = instanceCount
                renderPass.instancedDrawCallCount++
            }
            currentSpriteType = s.spriteType
        }
        instanceCount++
    }

    if (instanceCount > 0) {
        renderPass.instancedDrawCalls[renderPass.instancedDrawCallCount * 2]     = currentSpriteType
        renderPass.instancedDrawCalls[renderPass.instancedDrawCallCount * 2 + 1] = instanceCount
        renderPass.instancedDrawCallCount++
    }
}
