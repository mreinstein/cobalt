import createTexture from './create-texture.js'
import getPreferredFormat from './get-preferred-format.js'

export default async function createTextureFromUrl(c, label, url, format) {
    const response = await fetch(url)
    const blob = await response.blob()

    format = format || getPreferredFormat(c)

    const imageData = await createImageBitmap(
        blob /*, { premultiplyAlpha: 'none', resizeQuality: 'pixelated' }*/,
    )

    const usage =
        GPUTextureUsage.TEXTURE_BINDING |
        GPUTextureUsage.COPY_DST |
        GPUTextureUsage.RENDER_ATTACHMENT
    const mip_count = 1
    const t = createTexture(
        c.device,
        label,
        imageData.width,
        imageData.height,
        mip_count,
        format,
        usage,
    )

    c.device.queue.copyExternalImageToTexture(
        { source: imageData },
        { texture: t.texture },
        {
            width: imageData.width,
            height: imageData.height,
        },
    )

    // nearest neighbor filtering is good for da pixel art
    const samplerDescriptor = {
        addressModeU: 'repeat', // repeat | clamp-to-edge
        addressModeV: 'repeat', // repeat | clamp-to-edge
        magFilter: 'nearest',
        minFilter: 'nearest',
        mipmapFilter: 'nearest',
        maxAnisotropy: 1,
    }

    t.sampler = c.device.createSampler(samplerDescriptor)
    return t
}
