export default async function createTexture (device, label, url, format='rgba8unorm') {
    
    const response = await fetch(url)
    const blob = await response.blob()

    const imageData = await createImageBitmap(blob/*, { premultiplyAlpha: 'none', resizeQuality: 'pixelated' }*/)
    
    const textureDescriptor = {
        label,
        size: {
            width: imageData.width,
            height: imageData.height
        },
        format,
        usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.RENDER_ATTACHMENT
    }
    
    const texture = device.createTexture(textureDescriptor)

    device.queue.copyExternalImageToTexture(
         { source: imageData },
         { texture },
         textureDescriptor.size
    )

    const viewDescriptor = {
        label,
        format,
        dimension: '2d',
        aspect: 'all',
        baseMipLevel: 0,
        mipLevelCount: 1,
        baseArrayLayer: 0,
        arrayLayerCount: 1
    }

    const view = texture.createView(viewDescriptor)

    const samplerDescriptor = {
        addressModeU: 'repeat', // repeat | clamp-to-edge
        addressModeV: 'repeat', // repeat | clamp-to-edge
        magFilter: 'nearest',
        minFilter: 'nearest',
        mipmapFilter: 'nearest',
        maxAnisotropy: 1
    }

    const sampler = device.createSampler(samplerDescriptor)

    return {
        texture,
        view,
        sampler,
        imageData
    }
}
