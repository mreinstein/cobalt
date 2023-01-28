import * as SpriteRenderPass     from './SpriteRenderPass.js'
import { ECS, mat4, vec2, vec3 } from './deps.js'
import { render_bloom }          from './bloom.js'


const UP_VECTOR = [ 0, 0, 1 ]
const SPRITE = [ 'sprite' ]


// @param Object renderer Cobalt render state
export default function createRendererSystem (renderer) {

    // temporary variables, allocated once to avoid garbage collection
    const _tmpVec3 = vec3.create()
    const buf = new Float32Array(136)  // tile instance data stored in a UBO

    return function rendererSystem (world) {
    
        const onUpdate = function (dt) {
     
            const device = renderer.device
            const context = renderer.context

            for (const newSprite of ECS.getEntities(world, SPRITE, 'added')) {
                newSprite.sprite.spriteType = renderer.spritesheet.locations.indexOf(newSprite.sprite.name)
                SpriteRenderPass.addSprite(renderer, newSprite)
            }

            for (const newSprite of ECS.getEntities(world, SPRITE, 'removed'))
                SpriteRenderPass.removeSprite(renderer, newSprite)

            // camera stuff
            /* 
            const Camera = {
                position: vec2.fromValues(renderer.viewport.width / 2, renderer.viewport.height / 2),
                shake: vec2.create()
            }
            const viewport = {
                position: vec2.fromValues(
                    -round(Camera.position[0] + Camera.shake[0]) + renderer.viewport.width / 2,
                    -round(Camera.position[1] + Camera.shake[1]) + renderer.viewport.height / 2
                )
            }
            */

            // TODO: I think zoom can be achieved by adjusting the left/right/bottom/top based on scale factor
            const projection = mat4.create()
            //                out    left   right    bottom   top     near     far
            //mat4.ortho(projection,    0,    800,      600,    0,   -10.0,   10.0)

            const GAME_WIDTH = Math.round(renderer.viewport.width * renderer.viewport.zoom)
            const GAME_HEIGHT = Math.round(renderer.viewport.height * renderer.viewport.zoom)

            mat4.ortho(projection,    0,    GAME_WIDTH,   GAME_HEIGHT,    0,   -10.0,   10.0)

            //mat4.scale(projection, projection, [1.5, 1.5, 1 ])
        
            const view = mat4.create()
            // set x,y,z camera position
            vec3.set(_tmpVec3, -renderer.viewport.position[0], -renderer.viewport.position[1], 0)
            mat4.fromTranslation(view, _tmpVec3)
        
            // might be useful if we ever switch to a 3d perspective camera setup
            //mat4.lookAt(view, [0, 0, 0], [0, 0, -1], [0, 1, 0])
            //mat4.targetTo(view, [0, 0, 0], [0, 0, -1], [0, 1, 0])
        
            // camera zoom
            //mat4.scale(view, view, [ 0.9, 0.9, 1 ])
        
            //mat4.fromScaling(view, [ 1.5, 1.5, 1 ])
            //mat4.translate(view, view, [ 0, 0, 0 ])

            device.queue.writeBuffer(renderer.sprite.uniformBuffer, 0, view.buffer)
            device.queue.writeBuffer(renderer.sprite.uniformBuffer, 64, projection.buffer)


            const commandEncoder = device.createCommandEncoder()
            
            // viewOffset.  [ 0, 0 ] is the top left corner of the level
            buf[0] = renderer.viewport.position[0] // viewoffset[0] 
            buf[1] = renderer.viewport.position[1] // viewOffset[1]


            // TODO: everything after buf[1] doesn't need to be updated every frame
            const tile = renderer.tile
            const { tileScale, tileSize } = tile

            buf[2] = GAME_WIDTH / tileScale          // viewportSize[0]
            buf[3] = GAME_HEIGHT / tileScale         // viewportSize[1]

            buf[4] = 1 / tile.atlasMaterial.imageData.width  // inverseAtlasTextureSize[0]
            buf[5] = 1 / tile.atlasMaterial.imageData.height // inverseAtlasTextureSize[1]

            buf[6] = tileSize
            buf[7] = 1.0 / tileSize                            // inverseTileSize

            // copy each tile layer's instance data into the UBO
            let i = 8
            for (const rp of renderer.renderPasses) {
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

            let actualRenderCount = 0 // number of renderpasses that actually activated so far
            let actualSpriteRenderCount = 0 // number of sprite renderpasses that actually activated so far

            for (const renderPass of renderer.renderPasses) {

                const loadOp = (actualRenderCount < 1) ? 'clear' : 'load'

                if (renderPass.type === 'tile' && renderPass.layers.length) {
                    actualRenderCount++
                    
                    const renderpass = commandEncoder.beginRenderPass({
                        colorAttachments: [
                            {
                                view: renderer.bloom.hdr_texture.view,
                                clearValue: renderer.clearValue,
                                loadOp,
                                storeOp: 'store'
                            }
                        ]
                    })

                    renderpass.setPipeline(tile.pipeline)
                    renderpass.setVertexBuffer(0, tile.quad.buffer)
        
                    // common stuff; the transform data and the tile atlas texture
                    renderpass.setBindGroup(1, tile.atlasBindGroup)

                    // render each of the tile layers
                    for (let j=0; j < renderPass.layers.length; j++) {
                        renderpass.setBindGroup(0, renderPass.layers[j].bindGroup)
                        // vertexCount, instanceCount, baseVertexIdx, baseInstanceIdx
                        renderpass.draw(6, 1, 0, renderPass.layers[j].instanceIndex)
                    }

                    renderpass.end()

                } else if (renderPass.type === 'sprite' && renderPass.spriteCount > 0) {
                    actualRenderCount++
                    actualSpriteRenderCount++

                    if (renderPass.dirty) {
                        rebuildSpriteDrawCalls(renderPass)
                        renderPass.dirty = false
                    }

                    device.queue.writeBuffer(renderPass.spriteBuffer, 0, renderPass.spriteData.buffer)

                    const renderpass = commandEncoder.beginRenderPass({
                        colorAttachments: [
                            // color
                            {
                                view: renderer.bloom.hdr_texture.view,
                                clearValue: renderer.clearValue,
                                loadOp,
                                storeOp: 'store'
                            },

                            // emissive
                            {
                                view: renderer.bloom.emissiveTextureView,
                                clearValue: renderer.clearValue,
                                loadOp: (actualSpriteRenderCount < 2) ? 'clear' : 'load',
                                storeOp: 'store'
                            }
                        ]
                    })
                
                    renderpass.setPipeline(renderer.sprite.pipeline)
                    renderpass.setBindGroup(0, renderPass.bindGroup)
                    renderpass.setVertexBuffer(0, renderer.sprite.quads.buffer)

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


            render_bloom(renderer, commandEncoder)   // OMG, the advanced fancy bloom :o


            // combine emissive and color textures and draw as post processing fullscreen quad
            const passEncoder = commandEncoder.beginRenderPass({
              colorAttachments: [
                {
                  view: renderer.context.getCurrentTexture().createView(),
                  clearValue: { r: 0.0, g: 0.0, b: 0.0, a: 1.0 },
                  loadOp: 'clear',
                  storeOp: 'store',
                },
              ],
            })

            passEncoder.setPipeline(renderer.postProcessing.pipeline)
            passEncoder.setBindGroup(0, renderer.postProcessing.bindGroup)
            passEncoder.draw(6, 1, 0, 0)
            passEncoder.end()


            //renderPixelationFilter(renderer, commandEncoder, renderer.postProcessing.pixelationStuff)


            // TODO: render all layers on top of the postProcessing here (UI layers)


            device.queue.submit([ commandEncoder.finish() ])
        }

        return { onUpdate }
    }
}

/*
function renderBlurFilter (renderer, commandEncoder, filterData) {

    const blockDim = filterData.blockDim
    const batch = filterData.batch
    const srcWidth = renderer.viewport.width
    const srcHeight = renderer.viewport.height

    const computePass = commandEncoder.beginComputePass()
    computePass.setPipeline(filterData.blurPipeline)
    computePass.setBindGroup(0, filterData.computeConstants)

    computePass.setBindGroup(1, filterData.computeBindGroup0)
    computePass.dispatchWorkgroups(
      Math.ceil(srcWidth / blockDim),
      Math.ceil(srcHeight / batch[1])
    )

    computePass.setBindGroup(1, filterData.computeBindGroup1)
    computePass.dispatchWorkgroups(
      Math.ceil(srcHeight / blockDim),
      Math.ceil(srcWidth / batch[1])
    )

    for (let i = 0; i < filterData.settings.iterations - 1; ++i) {
      computePass.setBindGroup(1, filterData.computeBindGroup2)
      computePass.dispatchWorkgroups(
        Math.ceil(srcWidth / blockDim),
        Math.ceil(srcHeight / batch[1])
      )

      computePass.setBindGroup(1, filterData.computeBindGroup1)
      computePass.dispatchWorkgroups(
        Math.ceil(srcHeight / blockDim),
        Math.ceil(srcWidth / batch[1])
      )
    }

    computePass.end()

    const textureView = renderer.context.getCurrentTexture().createView()

    const passEncoder = commandEncoder.beginRenderPass({
      colorAttachments: [
        {
          view: textureView,
          clearValue: { r: 0.0, g: 0.0, b: 0.0, a: 1.0 },
          loadOp: 'clear',
          storeOp: 'store',
        },
      ],
    });

    passEncoder.setPipeline(renderer.postProcessing.pipeline) //fullscreenQuadPipeline);
    passEncoder.setBindGroup(0, renderer.postProcessing.bindGroup) //showResultBindGroup);
    passEncoder.draw(6, 1, 0, 0)
    passEncoder.end()
}
*/


// build instancedDrawCalls
function rebuildSpriteDrawCalls (renderPass) {
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
