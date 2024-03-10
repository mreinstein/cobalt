import createTexture from './create-texture.js'


export default function createTextureFromBuffer (c, label, image, format='rgba8unorm') {

    const usage = GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.RENDER_ATTACHMENT
    const mip_count = 1
    const t = createTexture(c.device, label, image.width, image.height, mip_count, format, usage)

    /*
    c.device.queue.copyExternalImageToTexture(
        { source: image },
        { texture: t.texture },
        {
            width: image.width,
            height: image.height
        }
    )*/

    c.device.queue.writeTexture(
        { texture: t.texture },
        image.data,
        { bytesPerRow: 4 * image.width },
        { width: image.width, height: image.height }
    ) 

    // nearest neighbor filtering is good for da pixel art
    const samplerDescriptor = {
        addressModeU: 'repeat', // repeat | clamp-to-edge
        addressModeV: 'repeat', // repeat | clamp-to-edge
        magFilter: 'nearest',
        minFilter: 'nearest',
        mipmapFilter: 'nearest',
        maxAnisotropy: 1
    }

    t.sampler = c.device.createSampler(samplerDescriptor)
    return t
}
