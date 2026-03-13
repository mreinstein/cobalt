export default function createTexture(
    device,
    label,
    width,
    height,
    mip_count,
    format,
    usage,
    filter = 'linear',
) {
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

    const mip_view = []

    for (let i = 0; i < mip_count; i++)
        mip_view.push(
            texture.createView({
                label,
                format,
                dimension: '2d',
                aspect: 'all',
                baseMipLevel: i,
                mipLevelCount: 1,
                baseArrayLayer: 0,
                arrayLayerCount: 1,
            }),
        )

    const sampler = device.createSampler({
        label: `${label} sampler`,
        addressModeU: 'clamp-to-edge',
        addressModeV: 'clamp-to-edge',
        addressModeW: 'clamp-to-edge',
        magFilter: filter,
        minFilter: filter,
        mipmapFilter: filter,
    })

    return {
        size: { width, height },
        texture,
        view,
        mip_view,
        sampler,
    }
}
