export default function createTexture (device, label, width, height, mip_count, format, usage) {
    
    const texture = device.createTexture({
        label,
        size: { width, height },
        format,
        usage,
        mipLevelCount: mip_count,
        sampleCount: 1,
        dimension: '2d',
    })

    const view = texture.createView()

    const mip_view = [ ]

    for (let i=0; i < mip_count; i++)
        mip_view.push(texture.createView({
            label,
            format,
            dimension: '2d',
            aspect: 'all',
            baseMipLevel: i,
            mipLevelCount: 1,
            baseArrayLayer: 0,
            arrayLayerCount: 1,
        }))

    const sampler = device.createSampler({
        label: 'hdr sampler',
        addressModeU: 'clamp-to-edge',
        addressModeV: 'clamp-to-edge',
        addressModeW: 'clamp-to-edge',
        magFilter: 'linear',
        minFilter: 'linear',
        mipmapFilter: 'linear',
    })

    return {
        size: { width, height },
        texture,
        view,
        mip_view,
        sampler,
    }
}
