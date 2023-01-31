export async function initBlur (device, canvas, viewportWidth, viewportHeight) {

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

    // blurData
    return {
    	blockDim,
    	batch,
    	blurPipeline,
    	computeConstants,
    	computeBindGroup0,
    	computeBindGroup1,
    	computeBindGroup2,
    	settings,
    }
}


export function render_bloom (renderer, commandEncoder, blurData) {
	const blockDim = blurData.blockDim
    const batch = blurData.batch
    const srcWidth = renderer.viewport.width
    const srcHeight = renderer.viewport.height

    const computePass = commandEncoder.beginComputePass()
    computePass.setPipeline(blurData.blurPipeline)
    computePass.setBindGroup(0, blurData.computeConstants)

    computePass.setBindGroup(1, blurData.computeBindGroup0)
    computePass.dispatchWorkgroups(
      Math.ceil(srcWidth / blockDim),
      Math.ceil(srcHeight / batch[1])
    )

    computePass.setBindGroup(1, blurData.computeBindGroup1)
    computePass.dispatchWorkgroups(
      Math.ceil(srcHeight / blockDim),
      Math.ceil(srcWidth / batch[1])
    )

    for (let i = 0; i < blurData.settings.iterations - 1; ++i) {
      computePass.setBindGroup(1, blurData.computeBindGroup2)
      computePass.dispatchWorkgroups(
        Math.ceil(srcWidth / blockDim),
        Math.ceil(srcHeight / batch[1])
      )

      computePass.setBindGroup(1, blurData.computeBindGroup1)
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

    passEncoder.setPipeline(renderer.postProcessing.pipeline)
    passEncoder.setBindGroup(0, renderer.postProcessing.bindGroup)
    passEncoder.draw(6, 1, 0, 0)
    passEncoder.end()
}

