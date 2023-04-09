import bloomWGSL from './bloom.wgsl'


// ported from https://github.com/rledrin/WebGPU-Bloom

// confirmed validation on how these iterators actually behave in rust:
//	for i in 1..BLOOM_MIP_COUNT                  visits 1, 2, 3, 4, 5, 6
//  for i in (0..=BLOOM_MIP_COUNT - 2).rev()     visits 5, 4, 3, 2, 1, 0


// TODO: investigate dynamic ubo offsets again. I feel like that could be more efficient
// good example of this: https://github.com/austinEng/webgpu-samples/blob/main/src/sample/animometer/main.ts


const BLOOM_MIP_COUNT = 7

const MODE_PREFILTER      = 0
const MODE_DOWNSAMPLE     = 1
const MODE_UPSAMPLE_FIRST = 2
const MODE_UPSAMPLE       = 3

// https://github.com/austinEng/webgpu-samples/blob/main/src/sample/animometer/main.ts#L167-L174
const ALIGNMENT = 256 // 256-byte alignment for Dynamic Uniform Buffers


export async function init (device, canvas, viewportWidth, viewportHeight) {
    
    const hdr_texture = newTexture(
        device,
        'hdr render texture',
        viewportWidth,
        viewportHeight,
        1,
        'rgba16float',
        GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.STORAGE_BINDING | GPUTextureUsage.TEXTURE_BINDING,
    )

    const hdr_sampler = device.createSampler({
    	label: 'hdr sampler',
        addressModeU: 'clamp-to-edge',
        addressModeV: 'clamp-to-edge',
        addressModeW: 'clamp-to-edge',
        magFilter: 'linear',
        minFilter: 'linear',
        mipmapFilter: 'linear',
    })

    const emissiveTexture = device.createTexture({
        size: [ viewportWidth, viewportHeight, 1 ],
        format: 'rgba16float',
        usage:
          GPUTextureUsage.TEXTURE_BINDING |
          GPUTextureUsage.COPY_DST |
          GPUTextureUsage.RENDER_ATTACHMENT,
    })

    const emissiveTextureView = emissiveTexture.createView({
        format: 'rgba16float',
        dimension: '2d',
        aspect: 'all',
        baseMipLevel: 0,
        mipLevelCount: 1,
        baseArrayLayer: 0,
        arrayLayerCount: 1
    })


    const bloom_mat = {
        compute_pipeline: null,
        bind_group: [ ],
        bind_group_layout: [ ],
        bind_groups_textures: [ ],
        hdr_texture,
        hdr_sampler,

        // where sprites draw their emission pixels to
        emissiveTexture,
        emissiveTextureView,
    }

    const layout = device.createBindGroupLayout({
        entries: [
            {
                binding: 0,
                visibility: GPUShaderStage.COMPUTE,
                storageTexture: {
                    access: 'write-only',
                    format: 'rgba16float',
                    viewDimension: '2d'
                }
            },
            {
                binding: 1,
                visibility: GPUShaderStage.COMPUTE,
                texture: {
                    sampleType: 'float',
                    viewDimension: '2d',
                    multisampled: false
                }
            },
            {
                binding: 2,
                visibility: GPUShaderStage.COMPUTE,
                texture: {
                    sampleType: 'float',
                    viewDimension: '2d',
                    multisampled: false
                }
            },
            {
                binding: 3,
                visibility: GPUShaderStage.COMPUTE,
                sampler: { }
            },
            {
                binding: 4,
                visibility: GPUShaderStage.COMPUTE,
                buffer: {
                    type: 'uniform',
                    //minBindingSize: 24 // sizeOf(BloomParam)
                }
            },
            {
                binding: 5,
                visibility: GPUShaderStage.COMPUTE,
                buffer: {
                    type: 'uniform',
                    //minBindingSize: 4 // sizeOf(lode_mode Param)
                }
            },
        ]
    })

    bloom_mat.bind_group_layout.push(layout)

    bloom_mat.bind_groups_textures.push(newTexture(
        device,
        'bloom downsampler image 0',
        viewportWidth / 2,
        viewportHeight / 2,
        BLOOM_MIP_COUNT,
        'rgba16float',
        GPUTextureUsage.STORAGE_BINDING | GPUTextureUsage.TEXTURE_BINDING,
    ))

    bloom_mat.bind_groups_textures.push(newTexture(
        device,
        'bloom downsampler image 1',
        viewportWidth / 2,
        viewportHeight / 2,
        BLOOM_MIP_COUNT,
        'rgba16float',
        GPUTextureUsage.STORAGE_BINDING | GPUTextureUsage.TEXTURE_BINDING,
    ))

    bloom_mat.bind_groups_textures.push(newTexture(
        device,
        'bloom upsampler image',
        viewportWidth / 2,
        viewportHeight / 2,
        BLOOM_MIP_COUNT,
        'rgba16float',
        GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.STORAGE_BINDING | GPUTextureUsage.TEXTURE_BINDING,
    ))

    const compute_pipeline_layout = device.createPipelineLayout({
        bindGroupLayouts: bloom_mat.bind_group_layout
    })

    const compute_pipeline = device.createComputePipeline({
        layout: compute_pipeline_layout,
        compute: {
            module: device.createShaderModule({
                code: bloomWGSL,
            }),
            entryPoint: 'cs_main',
        },
    })

    set_all_bind_group(device, bloom_mat)

    bloom_mat.compute_pipeline = compute_pipeline

    return bloom_mat
}


function newTexture (device, label, width, height, mip_count, format, usage) {
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

    return {
    	size: { width, height },
        texture,
        view,
        mip_view,
    }
}


function set_all_bind_group (device, bloom_mat) {

    // create a buffer that holds static parameters, shared across all bloom bind groups
    const bloom_threshold = 0.1//1.0
    const bloom_knee = 0.2
    const combine_constant = 0.68

    const dat = new Float32Array([ bloom_threshold,
                                bloom_threshold - bloom_knee,
                                bloom_knee * 2.0,
                                0.25 / bloom_knee,
                                combine_constant,
                                // required byte alignment bs
                                0, 0, 0
                                ])

    const params_buf = device.createBuffer({
        label: 'bloom static parameters buffer',
        size: dat.byteLength, // vec4<f32> and f32 and u32 with 4 bytes per float32 and 4 bytes per u32
        mappedAtCreation: true,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
    })

    new Float32Array(params_buf.getMappedRange()).set(dat)

    params_buf.unmap()


    bloom_mat.bind_group.length = 0
    bloom_mat.params_buf = params_buf

    // Prefilter bind group
    bloom_mat.bind_group.push(create_bloom_bind_group(
        device,
        bloom_mat,
        bloom_mat.bind_groups_textures[0].mip_view[0],
        bloom_mat.emissiveTextureView, //bloom_mat.hdr_texture.view,
        bloom_mat.hdr_texture.view, // unused here, only for upsample passes
        bloom_mat.hdr_sampler,
        params_buf,
        MODE_PREFILTER << 16 | 0, // mode_lod value
    ));

    // Downsample bind groups
    for ( let i=1; i < BLOOM_MIP_COUNT; i++) {
        // Ping
        bloom_mat.bind_group.push(create_bloom_bind_group(
            device,
            bloom_mat,
            bloom_mat.bind_groups_textures[1].mip_view[i],
            bloom_mat.bind_groups_textures[0].view,
            bloom_mat.hdr_texture.view, // unused here, only for upsample passes
            bloom_mat.hdr_sampler,
            params_buf,
            MODE_DOWNSAMPLE << 16 | (i - 1), // mode_lod value
        ))

        // Pong
        bloom_mat.bind_group.push(create_bloom_bind_group(
            device,
            bloom_mat,
            bloom_mat.bind_groups_textures[0].mip_view[i],
            bloom_mat.bind_groups_textures[1].view,
            bloom_mat.hdr_texture.view, // unused here, only for upsample passes
            bloom_mat.hdr_sampler,
            params_buf,
            MODE_DOWNSAMPLE << 16 | i, // mode_lod value
        ))
    }

    // First Upsample
    bloom_mat.bind_group.push(create_bloom_bind_group(
        device,
        bloom_mat,
        bloom_mat.bind_groups_textures[2].mip_view[BLOOM_MIP_COUNT - 1],
        bloom_mat.bind_groups_textures[0].view,
        bloom_mat.hdr_texture.view,  // unused here, only for upsample passes
        bloom_mat.hdr_sampler,
        params_buf,
        MODE_UPSAMPLE_FIRST << 16 | (BLOOM_MIP_COUNT - 2), // mode_lod value
    ))

    let o = true

    // Upsample
    for (let i = BLOOM_MIP_COUNT-2; i >= 0; i--) {
        if (o) {
            bloom_mat.bind_group.push(create_bloom_bind_group(
                device,
                bloom_mat,
                bloom_mat.bind_groups_textures[1].mip_view[i],
                bloom_mat.bind_groups_textures[0].view,
                bloom_mat.bind_groups_textures[2].view,
                bloom_mat.hdr_sampler,
                params_buf,
                MODE_UPSAMPLE << 16 | i, // mode_lod value
            ))
            o = false
        } else {
            bloom_mat.bind_group.push(create_bloom_bind_group(
                device,
                bloom_mat,
                bloom_mat.bind_groups_textures[2].mip_view[i],
                bloom_mat.bind_groups_textures[0].view,
                bloom_mat.bind_groups_textures[1].view,
                bloom_mat.hdr_sampler,
                params_buf,
                MODE_UPSAMPLE << 16 | i, // mode_lod value
            ))
            o = true
        }
    }
}


function create_bloom_bind_group (device, bloom_mat, output_image, input_image, bloom_image, sampler, params_buf, mode_lod) {

    const dat2 = new Uint32Array([ mode_lod ])

    const lod_buf = device.createBuffer({
        label: 'bloom static mode_lod buffer',
        size: dat2.byteLength,
        mappedAtCreation: true,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
    })

    new Uint32Array(lod_buf.getMappedRange()).set(dat2)

    lod_buf.unmap()

    return device.createBindGroup({
    	label: 'bloom bind group layout',
        layout: bloom_mat.bind_group_layout[0],
        entries: [
            {
                binding: 0,
                resource: output_image
            },
            {
                binding: 1,
                resource: input_image
            },
            {
                binding: 2,
                resource: bloom_image
            },
            {
                binding: 3,
                resource: sampler
            },
            {
                binding: 4,
                resource: {
                    buffer: params_buf
                }
            },
            {
                binding: 5,
                resource: {
                    buffer: lod_buf
                }
            }
        ]
    })
}


export function draw (renderer, commandEncoder) {
	const MODE_PREFILTER = 0
	const MODE_DOWNSAMPLE = 1
	const MODE_UPSAMPLE_FIRST = 2
	const MODE_UPSAMPLE = 3

	const bloom_mat = renderer.bloom
	
	let bind_group_index = 0

	const compute_pass = commandEncoder.beginComputePass({
		label: 'bloom Compute Pass',
	})

	compute_pass.setPipeline(bloom_mat.compute_pipeline)


	// PreFilter
	compute_pass.setBindGroup(0, bloom_mat.bind_group[bind_group_index])
	bind_group_index += 1

	let mip_size = get_mip_size(0, bloom_mat.bind_groups_textures[0])

	compute_pass.dispatchWorkgroups(mip_size.width / 8 + 1, mip_size.height / 4 + 1, 1)

	// Downsample
	for (let i=1; i < BLOOM_MIP_COUNT; i++) {
		mip_size = get_mip_size(i, bloom_mat.bind_groups_textures[0])
	
		// Ping
		compute_pass.setBindGroup(0, bloom_mat.bind_group[bind_group_index])
		bind_group_index += 1
		compute_pass.dispatchWorkgroups(mip_size.width / 8 + 1, mip_size.height / 4 + 1, 1)

		// Pong
		compute_pass.setBindGroup(0, bloom_mat.bind_group[bind_group_index])
		bind_group_index += 1
		compute_pass.dispatchWorkgroups(mip_size.width / 8 + 1, mip_size.height / 4 + 1, 1)
	}


	// First Upsample
	compute_pass.setBindGroup(0, bloom_mat.bind_group[bind_group_index])
	bind_group_index += 1
	mip_size = get_mip_size(BLOOM_MIP_COUNT - 1, bloom_mat.bind_groups_textures[2])
	compute_pass.dispatchWorkgroups(mip_size.width / 8 + 1, mip_size.height / 4 + 1, 1)

	
	// Upsample
	for (let i=BLOOM_MIP_COUNT - 2; i >= 0; i--) {
		mip_size = get_mip_size(i, bloom_mat.bind_groups_textures[2])
	
		compute_pass.setBindGroup(0, bloom_mat.bind_group[bind_group_index])
		bind_group_index += 1
		compute_pass.dispatchWorkgroups(mip_size.width / 8 + 1, mip_size.height / 4 + 1, 1)
	}


	compute_pass.end()
}


function get_mip_size (current_mip, texture) {
	let width = texture.size.width
	let height = texture.size.height

	for (let i =0; i < current_mip; i++) {
		width /= 2
		height /= 2
	}

	return { width, height, depthOrArrayLayers: 1 }
}


export function resize (device, bloom_mat, viewportWidth, viewportHeight) {

    destroy(device, bloom_mat)

    bloom_mat.hdr_texture = newTexture(
        device,
        'hdr render texture',
        viewportWidth,
        viewportHeight,
        1,
        'rgba16float',
        GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.STORAGE_BINDING | GPUTextureUsage.TEXTURE_BINDING,
    )

    bloom_mat.emissiveTexture = device.createTexture({
        size: [ viewportWidth, viewportHeight, 1 ],
        format: 'rgba16float',
        usage:
          GPUTextureUsage.TEXTURE_BINDING |
          GPUTextureUsage.COPY_DST |
          GPUTextureUsage.RENDER_ATTACHMENT,
    })

    bloom_mat.emissiveTextureView = bloom_mat.emissiveTexture.createView({
        format: 'rgba16float',
        dimension: '2d',
        aspect: 'all',
        baseMipLevel: 0,
        mipLevelCount: 1,
        baseArrayLayer: 0,
        arrayLayerCount: 1
    })

    bloom_mat.bind_groups_textures.push(newTexture(
        device,
        'bloom downsampler image 0',
        viewportWidth / 2,
        viewportHeight / 2,
        BLOOM_MIP_COUNT,
        'rgba16float',
        GPUTextureUsage.STORAGE_BINDING | GPUTextureUsage.TEXTURE_BINDING,
    ))

    bloom_mat.bind_groups_textures.push(newTexture(
        device,
        'bloom downsampler image 1',
        viewportWidth / 2,
        viewportHeight / 2,
        BLOOM_MIP_COUNT,
        'rgba16float',
        GPUTextureUsage.STORAGE_BINDING | GPUTextureUsage.TEXTURE_BINDING,
    ))

    bloom_mat.bind_groups_textures.push(newTexture(
        device,
        'bloom upsampler image',
        viewportWidth / 2,
        viewportHeight / 2,
        BLOOM_MIP_COUNT,
        'rgba16float',
        GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.STORAGE_BINDING | GPUTextureUsage.TEXTURE_BINDING,
    ))

    set_all_bind_group(device, bloom_mat)
}


export function destroy (device, bloom_mat) {
    bloom_mat.hdr_texture.texture.destroy()
    bloom_mat.emissiveTexture.destroy()

    for (const t of bloom_mat.bind_groups_textures)
        t.texture.destroy()
    
    bloom_mat.bind_groups_textures.length = 0
}
