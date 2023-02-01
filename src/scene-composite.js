import fetchShader from './fetch-shader.js'


export async function initSceneComposite (device, viewportWidth, viewportHeight, bloom_mat) {
    const shader = await fetchShader('/src/scene-composite.wgsl')
    const format = navigator.gpu.getPreferredCanvasFormat() // bgra8unorm

    const bloom_intensity = 40.0
    const bloom_combine_constant = 0.68
    const dat = new Float32Array([ bloom_intensity, bloom_combine_constant ])
    const params_buf = device.createBuffer({
        label: 'scene composite params buffer',
        size: dat.byteLength, // vec4<f32> and f32 and u32 with 4 bytes per float32 and 4 bytes per u32
        mappedAtCreation: true,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
    })

    new Float32Array(params_buf.getMappedRange()).set(dat)

    params_buf.unmap()

    const pipeline = device.createRenderPipeline({
        layout: 'auto',
        vertex: {
          module: device.createShaderModule({
            code: shader,
          }),
          entryPoint: 'vert_main',
        },
        fragment: {
          module: device.createShaderModule({
            code: shader,
          }),
          entryPoint: 'frag_main',
          targets: [
            {
              format,
            },
          ],
        },
        primitive: {
          topology: 'triangle-list',
        },
    })

    const bindGroup = device.createBindGroup({
        layout: pipeline.getBindGroupLayout(0),
        entries: [
          {
            binding: 0,
            resource: bloom_mat.hdr_sampler,
          },
          // color
          {
            binding: 1,
            resource: bloom_mat.hdr_texture.view,
          },
          // emissive
          {
            binding: 2,
            resource: bloom_mat.bind_groups_textures[2].mip_view[0],
          },
          {
            binding: 3,
            resource: {
                buffer: params_buf,
            },
          },
        ],
    })

    return {
        bindGroup,
        pipeline,
        params_buf,
    }
}


// combine bloom and color textures and draw to a fullscreen quad
export function render_scene_composite (renderer, commandEncoder) {
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
}
