import fetchShader from './fetch-shader.js'


export async function initFinal (device, viewportWidth, viewportHeight, bloom_mat) {
    const shader = await fetchShader('/src/fullscreenTexturedQuad.wgsl')
    const format = navigator.gpu.getPreferredCanvasFormat() // bgra8unorm

    /*

    const colorTexture = device.createTexture({
        size: [ viewportWidth, viewportHeight, 1 ],
        format,
        usage:
          GPUTextureUsage.TEXTURE_BINDING |
          GPUTextureUsage.COPY_DST |
          GPUTextureUsage.RENDER_ATTACHMENT,
    })

    const colorTextureView = colorTexture.createView({
        format,
        dimension: '2d',
        aspect: 'all',
        baseMipLevel: 0,
        mipLevelCount: 1,
        baseArrayLayer: 0,
        arrayLayerCount: 1
    })
    */

    /*
    const blurWGSL = await fetchShader('/src/blur.wgsl')

    const blurPipeline = device.createComputePipeline({
        layout: 'auto',
        compute: {
            module: device.createShaderModule({
                code: blurWGSL,
            }),
            entryPoint: 'main',
        },
    })

    const textures = [0, 1].map(() => {
        return device.createTexture({
            size: {
                width: viewportWidth,
                height: viewportHeight,
            },
            format: 'rgba8unorm',
            usage:
            GPUTextureUsage.COPY_DST |
            GPUTextureUsage.STORAGE_BINDING |
            GPUTextureUsage.TEXTURE_BINDING,
        })
    })

    const buffer0 = (() => {
        const buffer = device.createBuffer({
            size: 4,
            mappedAtCreation: true,
            usage: GPUBufferUsage.UNIFORM,
        })
        new Uint32Array(buffer.getMappedRange())[0] = 0
        buffer.unmap()
        return buffer
    })()

    const buffer1 = (() => {
        const buffer = device.createBuffer({
          size: 4,
          mappedAtCreation: true,
          usage: GPUBufferUsage.UNIFORM,
      });
        new Uint32Array(buffer.getMappedRange())[0] = 1
        buffer.unmap()
        return buffer
    })()

    const blurParamsBuffer = device.createBuffer({
        size: 8,
        usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.UNIFORM,
    })

    const sampler = device.createSampler({
        magFilter: 'nearest', // 'linear'
        minFilter: 'nearest', // 'linear'
    })

    const computeConstants = device.createBindGroup({
        layout: blurPipeline.getBindGroupLayout(0),
        entries: [
            {
                binding: 0,
                resource: sampler,
            },
            {
                binding: 1,
                resource: {
                    buffer: blurParamsBuffer,
                },
            },
        ],
    })

    const computeBindGroup0 = device.createBindGroup({
        layout: blurPipeline.getBindGroupLayout(1),
        entries: [
            {
                binding: 1,
                resource: emissiveTextureView, //colorTextureView,
            },
            {
                binding: 2,
                resource: textures[0].createView(),
            },
            {
                binding: 3,
                resource: {
                    buffer: buffer0,
                },
            },
        ],
    })

    const computeBindGroup1 = device.createBindGroup({
        layout: blurPipeline.getBindGroupLayout(1),
        entries: [
          {
            binding: 1,
            resource: textures[0].createView(),
          },
          {
            binding: 2,
            resource: textures[1].createView(),
          },
          {
            binding: 3,
            resource: {
              buffer: buffer1,
            },
          },
        ],
    })

    const computeBindGroup2 = device.createBindGroup({
        layout: blurPipeline.getBindGroupLayout(1),
        entries: [
            {
                binding: 1,
                resource: textures[1].createView(),
            },
            {
                binding: 2,
                resource: textures[0].createView(),
            },
            {
                binding: 3,
                resource: {
                  buffer: buffer0,
                },
            },
        ],
    })

    // Constants from the blur.wgsl shader.
    const tileDim = 128
    const batch = [ 4, 4 ]

    const settings = {
        filterSize: 5,
        iterations: 2,
    }

    let blockDim = tileDim - (settings.filterSize - 1)

    device.queue.writeBuffer(
        blurParamsBuffer,
        0,
        new Uint32Array([ settings.filterSize, blockDim ])
    )
    */

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
            resource: bloom_mat.hdr_sampler, //sampler,
          },
          // color
          {
            binding: 1,
            resource: bloom_mat.hdr_texture.view, //colorTextureView,
          },
          // emissive
          {
            binding: 2,
            resource: bloom_mat.bind_groups_textures[2].mip_view[0], //bloom_mat.bind_groups_textures[2].mip_view[3], // should be 0
          },
        ],
    })

    return {
        bindGroup,
        pipeline,
    }
}
