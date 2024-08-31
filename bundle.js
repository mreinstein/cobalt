var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// src/create-texture.js
function createTexture(device, label, width, height, mip_count, format, usage) {
  const texture = device.createTexture({
    label,
    size: { width, height },
    format,
    usage,
    mipLevelCount: mip_count,
    sampleCount: 1,
    dimension: "2d"
  });
  const view = texture.createView();
  const mip_view = [];
  for (let i = 0; i < mip_count; i++)
    mip_view.push(texture.createView({
      label,
      format,
      dimension: "2d",
      aspect: "all",
      baseMipLevel: i,
      mipLevelCount: 1,
      baseArrayLayer: 0,
      arrayLayerCount: 1
    }));
  const sampler = device.createSampler({
    label: `${label} sampler`,
    addressModeU: "clamp-to-edge",
    addressModeV: "clamp-to-edge",
    addressModeW: "clamp-to-edge",
    magFilter: "linear",
    minFilter: "linear",
    mipmapFilter: "linear"
  });
  return {
    size: { width, height },
    texture,
    view,
    mip_view,
    sampler
  };
}

// src/create-texture-from-url.js
async function createTextureFromUrl(c, label, url, format = "rgba8unorm") {
  const response = await fetch(url);
  const blob = await response.blob();
  const imageData = await createImageBitmap(
    blob
    /*, { premultiplyAlpha: 'none', resizeQuality: 'pixelated' }*/
  );
  const usage = GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.RENDER_ATTACHMENT;
  const mip_count = 1;
  const t = createTexture(c.device, label, imageData.width, imageData.height, mip_count, format, usage);
  c.device.queue.copyExternalImageToTexture(
    { source: imageData },
    { texture: t.texture },
    {
      width: imageData.width,
      height: imageData.height
    }
  );
  const samplerDescriptor = {
    addressModeU: "repeat",
    // repeat | clamp-to-edge
    addressModeV: "repeat",
    // repeat | clamp-to-edge
    magFilter: "nearest",
    minFilter: "nearest",
    mipmapFilter: "nearest",
    maxAnisotropy: 1
  };
  t.sampler = c.device.createSampler(samplerDescriptor);
  return t;
}

// src/create-texture-from-buffer.js
function createTextureFromBuffer(c, label, image, format = "rgba8unorm") {
  const usage = GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.RENDER_ATTACHMENT;
  const mip_count = 1;
  const t = createTexture(c.device, label, image.width, image.height, mip_count, format, usage);
  c.device.queue.writeTexture(
    { texture: t.texture },
    image.data,
    { bytesPerRow: 4 * image.width },
    { width: image.width, height: image.height }
  );
  const samplerDescriptor = {
    addressModeU: "repeat",
    // repeat | clamp-to-edge
    addressModeV: "repeat",
    // repeat | clamp-to-edge
    magFilter: "nearest",
    minFilter: "nearest",
    mipmapFilter: "nearest",
    maxAnisotropy: 1
  };
  t.sampler = c.device.createSampler(samplerDescriptor);
  return t;
}

// src/bloom/bloom.wgsl
var bloom_default = "// Compute Shader\r\n\r\nconst BLOOM_MIP_COUNT: i32 = 7;\r\n\r\nconst MODE_PREFILTER: u32 = 0u;\r\nconst MODE_DOWNSAMPLE: u32 = 1u;\r\nconst MODE_UPSAMPLE_FIRST: u32 = 2u;\r\nconst MODE_UPSAMPLE: u32 = 3u;\r\n\r\nconst EPSILON: f32 = 1.0e-4;\r\n\r\nstruct bloom_param {\r\n	parameters: vec4<f32>, // (x) threshold, (y) threshold - knee, (z) knee * 2, (w) 0.25 / knee\r\n	combine_constant: f32,\r\n	doop: u32,\r\n	ferp: u32,\r\n}\r\n\r\nstruct mode_lod_param {\r\n	mode_lod: u32,\r\n}\r\n\r\n\r\n@group(0) @binding(0) var output_texture: texture_storage_2d<rgba16float, write>;\r\n@group(0) @binding(1) var input_texture: texture_2d<f32>;\r\n@group(0) @binding(2) var bloom_texture: texture_2d<f32>;\r\n@group(0) @binding(3) var samp: sampler;\r\n@group(0) @binding(4) var<uniform> param: bloom_param;\r\n@group(0) @binding(5) var<uniform> pc: mode_lod_param;\r\n\r\n\r\n// PushConstants don't work in webgpu in chrome because they've been removed from the spec for v1 :(\r\n// might be added after v1 though https://github.com/gpuweb/gpuweb/issues/75\r\n//var<push_constant> pc: PushConstants;\r\n\r\n\r\n// Quadratic color thresholding\r\n// curve = (threshold - knee, knee * 2, 0.25 / knee)\r\nfn QuadraticThreshold(color: vec4<f32>, threshold: f32, curve: vec3<f32>) -> vec4<f32>\r\n{\r\n	// Maximum pixel brightness\r\n	let brightness = max(max(color.r, color.g), color.b);\r\n	// Quadratic curve\r\n	var rq: f32 = clamp(brightness - curve.x, 0.0, curve.y);\r\n	rq = curve.z * (rq * rq);\r\n	let ret_color = color * max(rq, brightness - threshold) / max(brightness, EPSILON);\r\n	return ret_color;\r\n}\r\n\r\nfn Prefilter(color: vec4<f32>, uv: vec2<f32>) -> vec4<f32>\r\n{\r\n	let clamp_value = 20.0;\r\n	var c = min(vec4<f32>(clamp_value), color);\r\n	c = QuadraticThreshold(color, param.parameters.x, param.parameters.yzw);\r\n	return c;\r\n}\r\n\r\nfn DownsampleBox13(tex: texture_2d<f32>, lod: f32, uv: vec2<f32>, tex_size: vec2<f32>) -> vec3<f32>\r\n{\r\n	// Center\r\n	let A = textureSampleLevel(tex, samp, uv, lod).rgb;\r\n\r\n	let texel_size = tex_size * 0.5; // Sample from center of texels\r\n\r\n	// Inner box\r\n	let B = textureSampleLevel(tex, samp, uv + texel_size * vec2<f32>(-1.0, -1.0), lod).rgb;\r\n	let C = textureSampleLevel(tex, samp, uv + texel_size * vec2<f32>(-1.0, 1.0), lod).rgb;\r\n	let D = textureSampleLevel(tex, samp, uv + texel_size * vec2<f32>(1.0, 1.0), lod).rgb;\r\n	let E = textureSampleLevel(tex, samp, uv + texel_size * vec2<f32>(1.0, -1.0), lod).rgb;\r\n\r\n	// Outer box\r\n	let F = textureSampleLevel(tex, samp, uv + texel_size * vec2<f32>(-2.0, -2.0), lod).rgb;\r\n	let G = textureSampleLevel(tex, samp, uv + texel_size * vec2<f32>(-2.0, 0.0), lod).rgb;\r\n	let H = textureSampleLevel(tex, samp, uv + texel_size * vec2<f32>(0.0, 2.0), lod).rgb;\r\n	let I = textureSampleLevel(tex, samp, uv + texel_size * vec2<f32>(2.0, 2.0), lod).rgb;\r\n	let J = textureSampleLevel(tex, samp, uv + texel_size * vec2<f32>(2.0, 2.0), lod).rgb;\r\n	let K = textureSampleLevel(tex, samp, uv + texel_size * vec2<f32>(2.0, 0.0), lod).rgb;\r\n	let L = textureSampleLevel(tex, samp, uv + texel_size * vec2<f32>(-2.0, -2.0), lod).rgb;\r\n	let M = textureSampleLevel(tex, samp, uv + texel_size * vec2<f32>(0.0, -2.0), lod).rgb;\r\n\r\n	// Weights\r\n	var result: vec3<f32> = vec3<f32>(0.0);\r\n	// Inner box\r\n	result = result + (B + C + D + E) * 0.5;\r\n	// Bottom-left box\r\n	result = result + (F + G + A + M) * 0.125;\r\n	// Top-left box\r\n	result = result + (G + H + I + A) * 0.125;\r\n	// Top-right box\r\n	result = result + (A + I + J + K) * 0.125;\r\n	// Bottom-right box\r\n	result = result + (M + A + K + L) * 0.125;\r\n\r\n	// 4 samples each\r\n	result = result * 0.25;\r\n\r\n	return result;\r\n}\r\n\r\nfn UpsampleTent9(tex: texture_2d<f32>, lod: f32, uv: vec2<f32>, texel_size: vec2<f32>, radius: f32) -> vec3<f32>\r\n{\r\n	let offset = texel_size.xyxy * vec4<f32>(1.0, 1.0, -1.0, 0.0) * radius;\r\n\r\n	// Center\r\n	var result: vec3<f32> = textureSampleLevel(tex, samp, uv, lod).rgb * 4.0;\r\n\r\n	result = result + textureSampleLevel(tex, samp, uv - offset.xy, lod).rgb;\r\n	result = result + textureSampleLevel(tex, samp, uv - offset.wy, lod).rgb * 2.0;\r\n	result = result + textureSampleLevel(tex, samp, uv - offset.zy, lod).rgb;\r\n\r\n	result = result + textureSampleLevel(tex, samp, uv + offset.zw, lod).rgb * 2.0;\r\n	result = result + textureSampleLevel(tex, samp, uv + offset.xw, lod).rgb * 2.0;\r\n\r\n	result = result + textureSampleLevel(tex, samp, uv + offset.zy, lod).rgb;\r\n	result = result + textureSampleLevel(tex, samp, uv + offset.wy, lod).rgb * 2.0;\r\n	result = result + textureSampleLevel(tex, samp, uv + offset.xy, lod).rgb;\r\n\r\n	return result * (1.0 / 16.0);\r\n}\r\n\r\nfn combine(ex_color: vec3<f32>, color_to_add: vec3<f32>, combine_constant: f32) -> vec3<f32>\r\n{\r\n	let existing_color = ex_color + (-color_to_add);\r\n	let blended_color = (combine_constant * existing_color) + color_to_add;\r\n	return blended_color;\r\n}\r\n\r\n\r\n@compute @workgroup_size(8, 4, 1)\r\nfn cs_main(@builtin(global_invocation_id) global_invocation_id: vec3<u32>)\r\n{\r\n	let mode = pc.mode_lod >> 16u;\r\n	let lod = pc.mode_lod & 65535u;\r\n\r\n	let imgSize = textureDimensions(output_texture);\r\n\r\n	if (global_invocation_id.x < u32(imgSize.x) && global_invocation_id.y < u32(imgSize.y)) {\r\n		\r\n		var texCoords: vec2<f32> = vec2<f32>(f32(global_invocation_id.x) / f32(imgSize.x), f32(global_invocation_id.y) / f32(imgSize.y));\r\n		texCoords = texCoords + (1.0 / vec2<f32>(imgSize)) * 0.5;\r\n\r\n		let texSize = vec2<f32>(textureDimensions(input_texture, i32(lod)));\r\n		var color: vec4<f32> = vec4<f32>(1.0);\r\n\r\n		if (mode == MODE_PREFILTER)\r\n		{\r\n			color = vec4<f32>(DownsampleBox13(input_texture, f32(lod), texCoords, 1.0 / texSize), 1.0);\r\n			color = Prefilter(color, texCoords);\r\n		}\r\n		else if (mode == MODE_DOWNSAMPLE)\r\n		{\r\n			color = vec4<f32>(DownsampleBox13(input_texture, f32(lod), texCoords, 1.0 / texSize), 1.0);\r\n		}\r\n		else if (mode == MODE_UPSAMPLE_FIRST)\r\n		{\r\n			let bloomTexSize = textureDimensions(input_texture, i32(lod) + 1);\r\n			let sampleScale = 1.0;\r\n			let upsampledTexture = UpsampleTent9(input_texture, f32(lod) + 1.0, texCoords, 1.0 / vec2<f32>(bloomTexSize), sampleScale);\r\n\r\n			let existing = textureSampleLevel(input_texture, samp, texCoords, f32(lod)).rgb;\r\n			color = vec4<f32>(combine(existing, upsampledTexture, param.combine_constant), 1.0);\r\n		}\r\n		else if (mode == MODE_UPSAMPLE)\r\n		{\r\n			let bloomTexSize = textureDimensions(bloom_texture, i32(lod) + 1);\r\n			let sampleScale = 1.0;\r\n			let upsampledTexture = UpsampleTent9(bloom_texture, f32(lod) + 1.0, texCoords, 1.0 / vec2<f32>(bloomTexSize), sampleScale);\r\n\r\n			let existing = textureSampleLevel(input_texture, samp, texCoords, f32(lod)).rgb;\r\n			color = vec4<f32>(combine(existing, upsampledTexture, param.combine_constant), 1.0);\r\n		}\r\n\r\n		textureStore(output_texture, vec2<i32>(global_invocation_id.xy), color);\r\n	}\r\n}\r\n\r\n";

// src/bloom/bloom.js
var BLOOM_MIP_COUNT = 7;
var MODE_PREFILTER = 0;
var MODE_DOWNSAMPLE = 1;
var MODE_UPSAMPLE_FIRST = 2;
var MODE_UPSAMPLE = 3;
var bloom_default2 = {
  type: "cobalt:bloom",
  refs: [
    { name: "emissive", type: "textureView", format: "rgba16", access: "read" },
    { name: "hdr", type: "textureView", format: "rgba16", access: "read" },
    { name: "bloom", type: "textureView", format: "rgba16", access: "readwrite" }
  ],
  // @params Object cobalt renderer world object
  // @params Object options optional data passed when initing this node
  onInit: async function(cobalt, options = {}) {
    return init(cobalt, options);
  },
  onRun: function(cobalt, node, webGpuCommandEncoder) {
    draw(cobalt, node.data, webGpuCommandEncoder);
  },
  onDestroy: function(cobalt, node) {
    destroy(node);
  },
  onResize: function(cobalt, node) {
    resize(cobalt, node);
  },
  onViewportPosition: function(cobalt, node) {
  }
};
function init(cobalt, nodeData) {
  const { device } = cobalt;
  const viewportWidth = cobalt.viewport.width;
  const viewportHeight = cobalt.viewport.height;
  const bloom_mat = {
    compute_pipeline: null,
    bind_group: [],
    bind_group_layout: [],
    bind_groups_textures: []
  };
  const layout = device.createBindGroupLayout({
    entries: [
      {
        binding: 0,
        visibility: GPUShaderStage.COMPUTE,
        storageTexture: {
          access: "write-only",
          format: "rgba16float",
          viewDimension: "2d"
        }
      },
      {
        binding: 1,
        visibility: GPUShaderStage.COMPUTE,
        texture: {
          sampleType: "float",
          viewDimension: "2d",
          multisampled: false
        }
      },
      {
        binding: 2,
        visibility: GPUShaderStage.COMPUTE,
        texture: {
          sampleType: "float",
          viewDimension: "2d",
          multisampled: false
        }
      },
      {
        binding: 3,
        visibility: GPUShaderStage.COMPUTE,
        sampler: {}
      },
      {
        binding: 4,
        visibility: GPUShaderStage.COMPUTE,
        buffer: {
          type: "uniform"
          //minBindingSize: 24 // sizeOf(BloomParam)
        }
      },
      {
        binding: 5,
        visibility: GPUShaderStage.COMPUTE,
        buffer: {
          type: "uniform"
          //minBindingSize: 4 // sizeOf(lode_mode Param)
        }
      }
    ]
  });
  bloom_mat.bind_group_layout.push(layout);
  bloom_mat.bind_groups_textures.push(createTexture(
    device,
    "bloom downsampler image 0",
    viewportWidth / 2,
    viewportHeight / 2,
    BLOOM_MIP_COUNT,
    "rgba16float",
    GPUTextureUsage.STORAGE_BINDING | GPUTextureUsage.TEXTURE_BINDING
  ));
  bloom_mat.bind_groups_textures.push(createTexture(
    device,
    "bloom downsampler image 1",
    viewportWidth / 2,
    viewportHeight / 2,
    BLOOM_MIP_COUNT,
    "rgba16float",
    GPUTextureUsage.STORAGE_BINDING | GPUTextureUsage.TEXTURE_BINDING
  ));
  bloom_mat.bind_groups_textures.push(nodeData.refs.bloom.data);
  const compute_pipeline_layout = device.createPipelineLayout({
    bindGroupLayouts: bloom_mat.bind_group_layout
  });
  const compute_pipeline = device.createComputePipeline({
    layout: compute_pipeline_layout,
    compute: {
      module: device.createShaderModule({
        code: bloom_default
      }),
      entryPoint: "cs_main"
    }
  });
  set_all_bind_group(cobalt, bloom_mat, nodeData);
  bloom_mat.compute_pipeline = compute_pipeline;
  return bloom_mat;
}
function set_all_bind_group(cobalt, bloom_mat, node) {
  const { refs } = node;
  const { device } = cobalt;
  const bloom_threshold = node.options.bloom_threshold ?? 0.1;
  const bloom_knee = node.options.bloom_knee ?? 0.2;
  const combine_constant = node.options.bloom_combine_constant ?? 0.68;
  const dat = new Float32Array([
    bloom_threshold,
    bloom_threshold - bloom_knee,
    bloom_knee * 2,
    0.25 / bloom_knee,
    combine_constant,
    // required byte alignment bs
    0,
    0,
    0
  ]);
  const params_buf = device.createBuffer({
    label: "bloom static parameters buffer",
    size: dat.byteLength,
    // vec4<f32> and f32 and u32 with 4 bytes per float32 and 4 bytes per u32
    mappedAtCreation: true,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
  });
  new Float32Array(params_buf.getMappedRange()).set(dat);
  params_buf.unmap();
  bloom_mat.bind_group.length = 0;
  bloom_mat.params_buf = params_buf;
  bloom_mat.bind_group.push(create_bloom_bind_group(
    device,
    bloom_mat,
    bloom_mat.bind_groups_textures[0].mip_view[0],
    refs.emissive.data.view,
    refs.hdr.data.view,
    // unused here, only for upsample passes
    refs.hdr.data.sampler,
    params_buf,
    MODE_PREFILTER << 16 | 0
    // mode_lod value
  ));
  for (let i = 1; i < BLOOM_MIP_COUNT; i++) {
    bloom_mat.bind_group.push(create_bloom_bind_group(
      device,
      bloom_mat,
      bloom_mat.bind_groups_textures[1].mip_view[i],
      bloom_mat.bind_groups_textures[0].view,
      refs.hdr.data.view,
      // unused here, only for upsample passes
      refs.hdr.data.sampler,
      params_buf,
      MODE_DOWNSAMPLE << 16 | i - 1
      // mode_lod value
    ));
    bloom_mat.bind_group.push(create_bloom_bind_group(
      device,
      bloom_mat,
      bloom_mat.bind_groups_textures[0].mip_view[i],
      bloom_mat.bind_groups_textures[1].view,
      refs.hdr.data.view,
      // unused here, only for upsample passes
      refs.hdr.data.sampler,
      params_buf,
      MODE_DOWNSAMPLE << 16 | i
      // mode_lod value
    ));
  }
  bloom_mat.bind_group.push(create_bloom_bind_group(
    device,
    bloom_mat,
    bloom_mat.bind_groups_textures[2].mip_view[BLOOM_MIP_COUNT - 1],
    bloom_mat.bind_groups_textures[0].view,
    refs.hdr.data.view,
    // unused here, only for upsample passes
    refs.hdr.data.sampler,
    params_buf,
    MODE_UPSAMPLE_FIRST << 16 | BLOOM_MIP_COUNT - 2
    // mode_lod value
  ));
  let o = true;
  for (let i = BLOOM_MIP_COUNT - 2; i >= 0; i--) {
    if (o) {
      bloom_mat.bind_group.push(create_bloom_bind_group(
        device,
        bloom_mat,
        bloom_mat.bind_groups_textures[1].mip_view[i],
        bloom_mat.bind_groups_textures[0].view,
        bloom_mat.bind_groups_textures[2].view,
        refs.hdr.data.sampler,
        params_buf,
        MODE_UPSAMPLE << 16 | i
        // mode_lod value
      ));
      o = false;
    } else {
      bloom_mat.bind_group.push(create_bloom_bind_group(
        device,
        bloom_mat,
        bloom_mat.bind_groups_textures[2].mip_view[i],
        bloom_mat.bind_groups_textures[0].view,
        bloom_mat.bind_groups_textures[1].view,
        refs.hdr.data.sampler,
        params_buf,
        MODE_UPSAMPLE << 16 | i
        // mode_lod value
      ));
      o = true;
    }
  }
}
function create_bloom_bind_group(device, bloom_mat, output_image, input_image, bloom_image, sampler, params_buf, mode_lod) {
  const dat2 = new Uint32Array([mode_lod]);
  const lod_buf = device.createBuffer({
    label: "bloom static mode_lod buffer",
    size: dat2.byteLength,
    mappedAtCreation: true,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
  });
  new Uint32Array(lod_buf.getMappedRange()).set(dat2);
  lod_buf.unmap();
  return device.createBindGroup({
    label: "bloom bind group layout",
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
  });
}
function draw(cobalt, bloom_mat, commandEncoder) {
  const MODE_PREFILTER2 = 0;
  const MODE_DOWNSAMPLE2 = 1;
  const MODE_UPSAMPLE_FIRST2 = 2;
  const MODE_UPSAMPLE2 = 3;
  let bind_group_index = 0;
  const compute_pass = commandEncoder.beginComputePass({
    label: "bloom Compute Pass"
  });
  compute_pass.setPipeline(bloom_mat.compute_pipeline);
  compute_pass.setBindGroup(0, bloom_mat.bind_group[bind_group_index]);
  bind_group_index += 1;
  let mip_size = get_mip_size(0, bloom_mat.bind_groups_textures[0]);
  compute_pass.dispatchWorkgroups(mip_size.width / 8 + 1, mip_size.height / 4 + 1, 1);
  for (let i = 1; i < BLOOM_MIP_COUNT; i++) {
    mip_size = get_mip_size(i, bloom_mat.bind_groups_textures[0]);
    compute_pass.setBindGroup(0, bloom_mat.bind_group[bind_group_index]);
    bind_group_index += 1;
    compute_pass.dispatchWorkgroups(mip_size.width / 8 + 1, mip_size.height / 4 + 1, 1);
    compute_pass.setBindGroup(0, bloom_mat.bind_group[bind_group_index]);
    bind_group_index += 1;
    compute_pass.dispatchWorkgroups(mip_size.width / 8 + 1, mip_size.height / 4 + 1, 1);
  }
  compute_pass.setBindGroup(0, bloom_mat.bind_group[bind_group_index]);
  bind_group_index += 1;
  mip_size = get_mip_size(BLOOM_MIP_COUNT - 1, bloom_mat.bind_groups_textures[2]);
  compute_pass.dispatchWorkgroups(mip_size.width / 8 + 1, mip_size.height / 4 + 1, 1);
  for (let i = BLOOM_MIP_COUNT - 2; i >= 0; i--) {
    mip_size = get_mip_size(i, bloom_mat.bind_groups_textures[2]);
    compute_pass.setBindGroup(0, bloom_mat.bind_group[bind_group_index]);
    bind_group_index += 1;
    compute_pass.dispatchWorkgroups(mip_size.width / 8 + 1, mip_size.height / 4 + 1, 1);
  }
  compute_pass.end();
}
function get_mip_size(current_mip, texture) {
  let width = texture.size.width;
  let height = texture.size.height;
  for (let i = 0; i < current_mip; i++) {
    width /= 2;
    height /= 2;
  }
  return { width, height, depthOrArrayLayers: 1 };
}
function resize(cobalt, nodeData) {
  const { device } = cobalt;
  const bloom_mat = nodeData.data;
  destroy(bloom_mat);
  bloom_mat.bind_groups_textures.push(createTexture(
    device,
    "bloom downsampler image 0",
    cobalt.viewport.width / 2,
    cobalt.viewport.height / 2,
    BLOOM_MIP_COUNT,
    "rgba16float",
    GPUTextureUsage.STORAGE_BINDING | GPUTextureUsage.TEXTURE_BINDING
  ));
  bloom_mat.bind_groups_textures.push(createTexture(
    device,
    "bloom downsampler image 1",
    cobalt.viewport.width / 2,
    cobalt.viewport.height / 2,
    BLOOM_MIP_COUNT,
    "rgba16float",
    GPUTextureUsage.STORAGE_BINDING | GPUTextureUsage.TEXTURE_BINDING
  ));
  bloom_mat.bind_groups_textures.push(nodeData.refs.bloom.data);
  set_all_bind_group(cobalt, bloom_mat, nodeData);
}
function destroy(bloom_mat) {
  for (const t of bloom_mat.bind_groups_textures)
    t.texture.destroy();
  bloom_mat.bind_groups_textures.length = 0;
}

// src/scene-composite/scene-composite.wgsl
var scene_composite_default = "\r\nstruct BloomComposite {\r\n  bloom_intensity: f32,\r\n  bloom_combine_constant: f32,\r\n}\r\n\r\n@group(0) @binding(0) var mySampler : sampler;\r\n@group(0) @binding(1) var colorTexture : texture_2d<f32>;\r\n@group(0) @binding(2) var emissiveTexture : texture_2d<f32>;\r\n@group(0) @binding(3) var<uniform> composite_parameter: BloomComposite;\r\n\r\nstruct VertexOutput {\r\n  @builtin(position) Position : vec4<f32>,\r\n  @location(0) fragUV : vec2<f32>,\r\n}\r\n\r\n// fullscreen triangle position and uvs\r\nconst positions = array<vec2<f32>, 3>(\r\n    vec2<f32>(-1.0, -3.0),\r\n    vec2<f32>(3.0, 1.0),\r\n    vec2<f32>(-1.0, 1.0)\r\n);\r\n\r\nconst uvs = array<vec2<f32>, 3>(\r\n    vec2<f32>(0.0, 2.0),\r\n    vec2<f32>(2.0, 0.0),\r\n    vec2<f32>(0.0, 0.0)\r\n);\r\n\r\n\r\n@vertex\r\nfn vert_main(@builtin(vertex_index) VertexIndex : u32) -> VertexOutput {\r\n\r\n  var output : VertexOutput;\r\n  output.Position = vec4<f32>(positions[VertexIndex], 0.0, 1.0);\r\n  output.fragUV = vec2<f32>(uvs[VertexIndex]);\r\n\r\n  return output;\r\n}\r\n\r\n\r\n// can be optimized into lut (compute can gen it)\r\nfn GTTonemap_point(x: f32) -> f32{\r\n  let m: f32 = 0.22; // linear section start\r\n  let a: f32 = 1.0;  // contrast\r\n  let c: f32 = 1.33; // black brightness\r\n  let P: f32 = 1.0;  // maximum brightness\r\n  let l: f32 = 0.4;  // linear section length\r\n  let l0: f32 = ((P-m)*l) / a; // 0.312\r\n  let S0: f32 = m + l0; // 0.532\r\n  let S1: f32 = m + a * l0; // 0.532\r\n  let C2: f32 = (a*P) / (P - S1); // 2.13675213675\r\n  let L: f32 = m + a * (x - m);\r\n  let T: f32 = m * pow(x/m, c);\r\n  let S: f32 = P - (P - S1) * exp(-C2*(x - S0)/P);\r\n  let w0: f32 = 1.0 - smoothstep(0.0, m, x);\r\n  var w2: f32 = 1.0;\r\n  if (x < m+l) {\r\n    w2 = 0.0;\r\n  }\r\n  let w1: f32 = 1.0 - w0 - w2;\r\n  return f32(T * w0 + L * w1 + S * w2);\r\n}\r\n\r\n// this costs about 0.2-0.3ms more than aces, as-is\r\nfn GTTonemap(x: vec3<f32>) -> vec3<f32>{\r\n  return vec3<f32>(GTTonemap_point(x.r), GTTonemap_point(x.g), GTTonemap_point(x.b));\r\n}\r\n\r\n\r\nfn aces(x: vec3<f32>) -> vec3<f32> {\r\n  let a: f32 = 2.51;\r\n  let b: f32 = 0.03;\r\n  let c: f32 = 2.43;\r\n  let d: f32 = 0.59;\r\n  let e: f32 = 0.14;\r\n  return clamp((x * (a * x + b)) / (x * (c * x + d) + e), vec3<f32>(0.0), vec3<f32>(1.0));\r\n}\r\n\r\n\r\n@fragment\r\nfn frag_main(@location(0) fragUV : vec2<f32>) -> @location(0) vec4<f32> {\r\n\r\n  let hdr_color = textureSample(colorTexture, mySampler, fragUV);\r\n  let bloom_color = textureSample(emissiveTexture, mySampler, fragUV);\r\n  \r\n  let combined_color = ((bloom_color * composite_parameter.bloom_intensity) * composite_parameter.bloom_combine_constant);\r\n\r\n  let mapped_color = GTTonemap(combined_color.rgb);\r\n  //let mapped_color = aces(combined_color.rgb);\r\n  let gamma_corrected_color = pow(mapped_color, vec3<f32>(1.0 / 2.2));\r\n\r\n  return vec4<f32>(gamma_corrected_color + hdr_color.rgb, 1.0);  \r\n}\r\n";

// src/scene-composite/scene-composite.js
var scene_composite_default2 = {
  type: "cobalt:bloom",
  refs: [
    { name: "hdr", type: "textureView", format: "rgba16", access: "read" },
    { name: "bloom", type: "textureView", format: "rgba16", access: "read" },
    { name: "combined", type: "textureView", format: "rgba8unorm", access: "write" }
  ],
  // @params Object cobalt renderer world object
  // @params Object options optional data passed when initing this node
  onInit: async function(cobalt, options = {}) {
    return init2(cobalt, options);
  },
  onRun: function(cobalt, node, webGpuCommandEncoder) {
    draw2(cobalt, node, webGpuCommandEncoder);
  },
  onDestroy: function(cobalt, node) {
  },
  onResize: function(cobalt, node) {
    resize2(cobalt, node);
  },
  onViewportPosition: function(cobalt, node) {
  }
};
function init2(cobalt, node) {
  const { options, refs } = node;
  const { device } = cobalt;
  const format = getPreferredFormat(cobalt);
  const bloom_intensity = options.bloom_intensity ?? 40;
  const bloom_combine_constant = options.bloom_combine_constant ?? 0.68;
  const dat = new Float32Array([bloom_intensity, bloom_combine_constant]);
  const params_buf = device.createBuffer({
    label: "scene composite params buffer",
    size: dat.byteLength,
    // vec4<f32> and f32 and u32 with 4 bytes per float32 and 4 bytes per u32
    mappedAtCreation: true,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
  });
  new Float32Array(params_buf.getMappedRange()).set(dat);
  params_buf.unmap();
  const pipeline = device.createRenderPipeline({
    layout: "auto",
    vertex: {
      module: device.createShaderModule({
        code: scene_composite_default
      }),
      entryPoint: "vert_main"
    },
    fragment: {
      module: device.createShaderModule({
        code: scene_composite_default
      }),
      entryPoint: "frag_main",
      targets: [
        {
          format
        }
      ]
    },
    primitive: {
      topology: "triangle-list"
    }
  });
  const bindGroup = device.createBindGroup({
    layout: pipeline.getBindGroupLayout(0),
    entries: [
      {
        binding: 0,
        resource: refs.hdr.data.sampler
      },
      // color
      {
        binding: 1,
        resource: refs.hdr.data.view
      },
      // emissive
      {
        binding: 2,
        resource: refs.bloom.data.mip_view[0]
      },
      {
        binding: 3,
        resource: {
          buffer: params_buf
        }
      }
    ]
  });
  return {
    bindGroup,
    pipeline,
    params_buf
  };
}
function draw2(cobalt, node, commandEncoder) {
  const passEncoder = commandEncoder.beginRenderPass({
    colorAttachments: [
      {
        view: node.refs.combined.data.view,
        //getCurrentTextureView(cobalt)
        clearValue: { r: 0, g: 0, b: 0, a: 1 },
        loadOp: "clear",
        storeOp: "store"
      }
    ]
  });
  const { pipeline, bindGroup } = node.data;
  passEncoder.setPipeline(pipeline);
  passEncoder.setBindGroup(0, bindGroup);
  passEncoder.draw(3);
  passEncoder.end();
}
function resize2(cobalt, node) {
  const { pipeline, params_buf } = node.data;
  const { device } = cobalt;
  node.data.bindGroup = device.createBindGroup({
    layout: pipeline.getBindGroupLayout(0),
    entries: [
      {
        binding: 0,
        resource: node.refs.hdr.data.sampler
      },
      // color
      {
        binding: 1,
        resource: node.refs.hdr.data.view
      },
      // emissive
      {
        binding: 2,
        resource: node.refs.bloom.data.mip_view[0]
        //bloom_mat.bind_groups_textures[2].mip_view[0],
      },
      {
        binding: 3,
        resource: {
          buffer: params_buf
        }
      }
    ]
  });
}

// src/sprite/api.js
var api_exports = {};
__export(api_exports, {
  addSprite: () => addSprite,
  clear: () => clear,
  removeSprite: () => removeSprite,
  setSprite: () => setSprite,
  setSpriteName: () => setSpriteName,
  setSpriteOpacity: () => setSpriteOpacity,
  setSpritePosition: () => setSpritePosition,
  setSpriteRotation: () => setSpriteRotation,
  setSpriteTint: () => setSpriteTint
});

// src/sprite/constants.js
var FLOAT32S_PER_SPRITE = 12;

// src/sprite/sorted-binary-insert.js
function sortedBinaryInsert(spriteZIndex, spriteType, renderPass) {
  if (renderPass.spriteCount === 0)
    return 0;
  let low = 0;
  let high = renderPass.spriteCount - 1;
  const order = spriteZIndex << 16 & 16711680 | spriteType & 65535;
  while (low <= high) {
    const lowOrder = renderPass.spriteData[low * FLOAT32S_PER_SPRITE + 11];
    if (order <= lowOrder)
      return low;
    const highOrder = renderPass.spriteData[high * FLOAT32S_PER_SPRITE + 11];
    if (order >= highOrder)
      return high + 1;
    const mid = Math.floor((low + high) / 2);
    const midOrder = renderPass.spriteData[mid * FLOAT32S_PER_SPRITE + 11];
    if (order === midOrder)
      return mid + 1;
    if (order > midOrder)
      low = mid + 1;
    else
      high = mid - 1;
  }
  return low;
}

// src/uuid.js
function _uuid() {
  return Math.ceil(Math.random() * (Number.MAX_SAFE_INTEGER - 10));
}

// src/sprite/api.js
function addSprite(cobalt, renderPass, name, position, scale, tint, opacity, rotation, zIndex) {
  const spritesheet = renderPass.refs.spritesheet.data.spritesheet;
  renderPass = renderPass.data;
  const spriteType = spritesheet.locations.indexOf(name);
  const insertIdx = sortedBinaryInsert(zIndex, spriteType, renderPass);
  const offset = (insertIdx + 1) * FLOAT32S_PER_SPRITE;
  renderPass.spriteData.set(
    renderPass.spriteData.subarray(insertIdx * FLOAT32S_PER_SPRITE, renderPass.spriteCount * FLOAT32S_PER_SPRITE),
    offset
  );
  copySpriteDataToBuffer(renderPass, spritesheet, insertIdx, name, position, scale, tint, opacity, rotation, zIndex);
  for (const [spriteId2, idx] of renderPass.spriteIndices)
    if (idx >= insertIdx)
      renderPass.spriteIndices.set(spriteId2, idx + 1);
  const spriteId = _uuid();
  renderPass.spriteIndices.set(spriteId, insertIdx);
  renderPass.spriteCount++;
  renderPass.dirty = true;
  return spriteId;
}
function removeSprite(cobalt, renderPass, spriteId) {
  renderPass = renderPass.data;
  const removeIdx = renderPass.spriteIndices.get(spriteId);
  for (const [spriteId2, idx] of renderPass.spriteIndices)
    if (idx > removeIdx)
      renderPass.spriteIndices.set(spriteId2, idx - 1);
  let offset = removeIdx * FLOAT32S_PER_SPRITE;
  renderPass.spriteData.set(
    renderPass.spriteData.subarray((removeIdx + 1) * FLOAT32S_PER_SPRITE, renderPass.spriteCount * FLOAT32S_PER_SPRITE),
    offset
  );
  renderPass.spriteIndices.delete(spriteId);
  renderPass.spriteCount--;
  renderPass.dirty = true;
}
function clear(cobalt, renderPass) {
  renderPass = renderPass.data;
  renderPass.spriteIndices.clear();
  renderPass.spriteCount = 0;
  renderPass.instancedDrawCallCount = 0;
  renderPass.dirty = true;
}
function setSpriteName(cobalt, renderPass, spriteId, name, scale) {
  const spritesheet = renderPass.refs.spritesheet.data.spritesheet;
  renderPass = renderPass.data;
  const spriteType = spritesheet.locations.indexOf(name);
  const SPRITE_WIDTH = spritesheet.spriteMeta[name].w;
  const SPRITE_HEIGHT = spritesheet.spriteMeta[name].h;
  const spriteIdx = renderPass.spriteIndices.get(spriteId);
  const offset = spriteIdx * FLOAT32S_PER_SPRITE;
  renderPass.spriteData[offset + 2] = SPRITE_WIDTH * scale[0];
  renderPass.spriteData[offset + 3] = SPRITE_HEIGHT * scale[1];
  const zIndex = renderPass.spriteData[offset + 11] >> 16 & 255;
  const sortValue = zIndex << 16 & 16711680 | spriteType & 65535;
  renderPass.spriteData[offset + 11] = sortValue;
  renderPass.dirty = true;
}
function setSpritePosition(cobalt, renderPass, spriteId, position) {
  renderPass = renderPass.data;
  const spriteIdx = renderPass.spriteIndices.get(spriteId);
  const offset = spriteIdx * FLOAT32S_PER_SPRITE;
  renderPass.spriteData[offset] = position[0];
  renderPass.spriteData[offset + 1] = position[1];
  renderPass.dirty = true;
}
function setSpriteTint(cobalt, renderPass, spriteId, tint) {
  renderPass = renderPass.data;
  const spriteIdx = renderPass.spriteIndices.get(spriteId);
  const offset = spriteIdx * FLOAT32S_PER_SPRITE;
  renderPass.spriteData[offset + 4] = tint[0];
  renderPass.spriteData[offset + 5] = tint[1];
  renderPass.spriteData[offset + 6] = tint[2];
  renderPass.spriteData[offset + 7] = tint[3];
  renderPass.dirty = true;
}
function setSpriteOpacity(cobalt, renderPass, spriteId, opacity) {
  renderPass = renderPass.data;
  const spriteIdx = renderPass.spriteIndices.get(spriteId);
  const offset = spriteIdx * FLOAT32S_PER_SPRITE;
  renderPass.spriteData[offset + 8] = opacity;
  renderPass.dirty = true;
}
function setSpriteRotation(cobalt, renderPass, spriteId, rotation) {
  renderPass = renderPass.data;
  const spriteIdx = renderPass.spriteIndices.get(spriteId);
  const offset = spriteIdx * FLOAT32S_PER_SPRITE;
  renderPass.spriteData[offset + 9] = rotation;
  renderPass.dirty = true;
}
function setSprite(cobalt, renderPass, spriteId, name, position, scale, tint, opacity, rotation, zIndex) {
  const spritesheet = renderPass.refs.spritesheet.data.spritesheet;
  renderPass = renderPass.data;
  const spriteIdx = renderPass.spriteIndices.get(spriteId);
  copySpriteDataToBuffer(renderPass, spritesheet, spriteIdx, name, position, scale, tint, opacity, rotation, zIndex);
  renderPass.dirty = true;
}
function copySpriteDataToBuffer(renderPass, spritesheet, insertIdx, name, position, scale, tint, opacity, rotation, zIndex) {
  if (!spritesheet.spriteMeta[name])
    throw new Error(`Sprite name ${name} could not be found in the spritesheet metaData`);
  const offset = insertIdx * FLOAT32S_PER_SPRITE;
  const SPRITE_WIDTH = spritesheet.spriteMeta[name].w;
  const SPRITE_HEIGHT = spritesheet.spriteMeta[name].h;
  const spriteType = spritesheet.locations.indexOf(name);
  const sortValue = zIndex << 16 & 16711680 | spriteType & 65535;
  renderPass.spriteData[offset] = position[0];
  renderPass.spriteData[offset + 1] = position[1];
  renderPass.spriteData[offset + 2] = SPRITE_WIDTH * scale[0];
  renderPass.spriteData[offset + 3] = SPRITE_HEIGHT * scale[1];
  renderPass.spriteData[offset + 4] = tint[0];
  renderPass.spriteData[offset + 5] = tint[1];
  renderPass.spriteData[offset + 6] = tint[2];
  renderPass.spriteData[offset + 7] = tint[3];
  renderPass.spriteData[offset + 8] = opacity;
  renderPass.spriteData[offset + 9] = rotation;
  renderPass.spriteData[offset + 11] = sortValue;
}

// src/sprite/sprite.js
var sprite_default = {
  type: "cobalt:sprite",
  refs: [
    { name: "spritesheet", type: "customResource", access: "read" },
    { name: "hdr", type: "textureView", format: "rgba16float", access: "write" },
    { name: "emissive", type: "textureView", format: "rgba16float", access: "write" }
  ],
  // cobalt event handling functions
  // @params Object cobalt renderer world object
  // @params Object options optional data passed when initing this node
  onInit: async function(cobalt, options = {}) {
    return init3(cobalt, options);
  },
  onRun: function(cobalt, node, webGpuCommandEncoder) {
    draw3(cobalt, node, webGpuCommandEncoder);
  },
  onDestroy: function(cobalt, node) {
    destroy2(node);
  },
  onResize: function(cobalt, node) {
  },
  onViewportPosition: function(cobalt, node) {
  },
  // optional
  customFunctions: {
    ...api_exports
  }
};
async function init3(cobalt, nodeData) {
  const { device } = cobalt;
  const MAX_SPRITE_COUNT = 16192;
  const numInstances = MAX_SPRITE_COUNT;
  const translateFloatCount = 2;
  const translateSize = Float32Array.BYTES_PER_ELEMENT * translateFloatCount;
  const scaleFloatCount = 2;
  const scaleSize = Float32Array.BYTES_PER_ELEMENT * scaleFloatCount;
  const tintFloatCount = 4;
  const tintSize = Float32Array.BYTES_PER_ELEMENT * tintFloatCount;
  const opacityFloatCount = 4;
  const opacitySize = Float32Array.BYTES_PER_ELEMENT * opacityFloatCount;
  const spriteBuffer = device.createBuffer({
    size: (translateSize + scaleSize + tintSize + opacitySize) * numInstances,
    // 4x4 matrix with 4 bytes per float32, per instance
    usage: GPUBufferUsage.VERTEX | GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST
    //mappedAtCreation: true,
  });
  const spritesheet = nodeData.refs.spritesheet.data;
  const bindGroup = device.createBindGroup({
    layout: nodeData.refs.spritesheet.data.bindGroupLayout,
    entries: [
      {
        binding: 0,
        resource: {
          buffer: spritesheet.uniformBuffer
        }
      },
      {
        binding: 1,
        resource: spritesheet.colorTexture.view
      },
      {
        binding: 2,
        resource: spritesheet.colorTexture.sampler
      },
      {
        binding: 3,
        resource: {
          buffer: spriteBuffer
        }
      },
      {
        binding: 4,
        resource: spritesheet.emissiveTexture.view
      }
    ]
  });
  return {
    // instancedDrawCalls is used to actually perform draw calls within the render pass
    // layout is interleaved with baseVtxIdx (the sprite type), and instanceCount (how many sprites)
    // [
    //    baseVtxIdx0, instanceCount0,
    //    baseVtxIdx1, instanceCount1,
    //    ...
    // ]
    instancedDrawCalls: new Uint32Array(MAX_SPRITE_COUNT * 2),
    instancedDrawCallCount: 0,
    bindGroup,
    spriteBuffer,
    // actual sprite instance data. ordered by layer, then sprite type
    // this is used to update the spriteBuffer.
    spriteData: new Float32Array(MAX_SPRITE_COUNT * FLOAT32S_PER_SPRITE),
    spriteCount: 0,
    spriteIndices: /* @__PURE__ */ new Map(),
    // key is spriteId, value is insert index of the sprite. e.g., 0 means 1st sprite , 1 means 2nd sprite, etc.
    // when a sprite is changed the renderpass is dirty, and should have it's instance data copied to the gpu
    dirty: false
  };
}
function draw3(cobalt, node, commandEncoder) {
  const { device } = cobalt;
  const loadOp = node.options.loadOp || "load";
  if (node.data.dirty) {
    _rebuildSpriteDrawCalls(node.data);
    node.data.dirty = false;
  }
  device.queue.writeBuffer(node.data.spriteBuffer, 0, node.data.spriteData.buffer);
  const renderpass = commandEncoder.beginRenderPass({
    colorAttachments: [
      // color
      {
        view: node.refs.hdr.data.view,
        clearValue: cobalt.clearValue,
        loadOp,
        storeOp: "store"
      },
      // emissive
      {
        view: node.refs.emissive.data.view,
        clearValue: cobalt.clearValue,
        loadOp: "clear",
        storeOp: "store"
      }
    ]
  });
  renderpass.setPipeline(node.refs.spritesheet.data.pipeline);
  renderpass.setBindGroup(0, node.data.bindGroup);
  renderpass.setVertexBuffer(0, node.refs.spritesheet.data.quads.buffer);
  const vertexCount = 6;
  let baseInstanceIdx = 0;
  for (let i = 0; i < node.data.instancedDrawCallCount; i++) {
    const baseVertexIdx = node.data.instancedDrawCalls[i * 2] * vertexCount;
    const instanceCount = node.data.instancedDrawCalls[i * 2 + 1];
    renderpass.draw(vertexCount, instanceCount, baseVertexIdx, baseInstanceIdx);
    baseInstanceIdx += instanceCount;
  }
  renderpass.end();
}
function _rebuildSpriteDrawCalls(renderPass) {
  let currentSpriteType = -1;
  let instanceCount = 0;
  renderPass.instancedDrawCallCount = 0;
  for (let i = 0; i < renderPass.spriteCount; i++) {
    const spriteType = renderPass.spriteData[i * FLOAT32S_PER_SPRITE + 11] & 65535;
    if (spriteType !== currentSpriteType) {
      if (instanceCount > 0) {
        renderPass.instancedDrawCalls[renderPass.instancedDrawCallCount * 2] = currentSpriteType;
        renderPass.instancedDrawCalls[renderPass.instancedDrawCallCount * 2 + 1] = instanceCount;
        renderPass.instancedDrawCallCount++;
      }
      currentSpriteType = spriteType;
      instanceCount = 0;
    }
    instanceCount++;
  }
  if (instanceCount > 0) {
    renderPass.instancedDrawCalls[renderPass.instancedDrawCallCount * 2] = currentSpriteType;
    renderPass.instancedDrawCalls[renderPass.instancedDrawCallCount * 2 + 1] = instanceCount;
    renderPass.instancedDrawCallCount++;
  }
}
function destroy2(node) {
  node.data.instancedDrawCalls = null;
  node.data.bindGroup = null;
  node.data.spriteBuffer.destroy();
  node.data.spriteBuffer = null;
  node.data.spriteData = null;
  node.data.spriteIndices.clear();
  node.data.spriteIndices = null;
}

// src/tile/tile.js
var tile_default = {
  type: "cobalt:tile",
  refs: [
    { name: "tileAtlas", type: "textureView", format: "rgba8unorm", access: "write" }
  ],
  // @params Object cobalt renderer world object
  // @params Object options optional data passed when initing this node
  onInit: async function(cobalt, options = {}) {
    return init4(cobalt, options);
  },
  onRun: function(cobalt, node, webGpuCommandEncoder) {
    draw4(cobalt, node, webGpuCommandEncoder);
  },
  onDestroy: function(cobalt, node) {
    destroy3(node);
  },
  onResize: function(cobalt, node) {
  },
  onViewportPosition: function(cobalt, node) {
  },
  // optional
  customFunctions: {
    setTexture: async function(cobalt, node, textureUrl) {
      const { device } = cobalt;
      destroy3(node);
      node.options.textureUrl = textureUrl;
      const material = await createTextureFromUrl(cobalt, "tile map", node.options.textureUrl);
      const bindGroup = device.createBindGroup({
        layout: node.refs.tileAtlas.data.tileBindGroupLayout,
        entries: [
          {
            binding: 0,
            resource: {
              buffer: node.data.uniformBuffer
            }
          },
          {
            binding: 1,
            resource: material.view
          },
          {
            binding: 2,
            resource: material.sampler
          }
        ]
      });
      node.data.bindGroup = bindGroup;
      node.data.material = material;
    }
  }
};
async function init4(cobalt, nodeData) {
  const { device } = cobalt;
  const material = await createTextureFromUrl(cobalt, "tile map", nodeData.options.textureUrl);
  const dat = new Float32Array([nodeData.options.scrollScale, nodeData.options.scrollScale]);
  const usage = GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST;
  const descriptor = {
    size: dat.byteLength,
    usage,
    // make this memory space accessible from the CPU (host visible)
    mappedAtCreation: true
  };
  const uniformBuffer = device.createBuffer(descriptor);
  new Float32Array(uniformBuffer.getMappedRange()).set(dat);
  uniformBuffer.unmap();
  const bindGroup = device.createBindGroup({
    layout: nodeData.refs.tileAtlas.data.tileBindGroupLayout,
    entries: [
      {
        binding: 0,
        resource: {
          buffer: uniformBuffer
        }
      },
      {
        binding: 1,
        resource: material.view
      },
      {
        binding: 2,
        resource: material.sampler
      }
    ]
  });
  return {
    bindGroup,
    material,
    uniformBuffer,
    scrollScale: nodeData.options.scrollScale
  };
}
function draw4(cobalt, nodeData, commandEncoder) {
  const { device } = cobalt;
  const loadOp = nodeData.options.loadOp || "load";
  const renderpass = commandEncoder.beginRenderPass({
    colorAttachments: [
      {
        view: nodeData.refs.hdr.data.view,
        clearValue: cobalt.clearValue,
        loadOp,
        storeOp: "store"
      }
    ]
  });
  const tileAtlas = nodeData.refs.tileAtlas.data;
  renderpass.setPipeline(tileAtlas.pipeline);
  renderpass.setBindGroup(0, nodeData.data.bindGroup);
  renderpass.setBindGroup(1, tileAtlas.atlasBindGroup);
  renderpass.draw(3);
  renderpass.end();
}
function destroy3(nodeData) {
  nodeData.data.material.texture.destroy();
  nodeData.data.material.texture = void 0;
}

// src/displacement/displacement.wgsl
var displacement_default = "// adapted from\r\n// https://github.com/pixijs/pixijs/blob/dev/packages/filter-displacement/src/displacement.frag\r\n\r\n\r\nstruct TransformData {\r\n    view: mat4x4<f32>,\r\n    projection: mat4x4<f32>\r\n};\r\n\r\nstruct displacement_param {\r\n    offset: vec2<f32>,\r\n    scale: f32,\r\n    noop: f32\r\n};\r\n\r\n@binding(0) @group(0) var<uniform> transformUBO: TransformData;\r\n@binding(1) @group(0) var myTexture: texture_2d<f32>;\r\n@binding(2) @group(0) var mySampler: sampler;\r\n@binding(3) @group(0) var mapTexture: texture_2d<f32>;\r\n@binding(4) @group(0) var<uniform> param: displacement_param;\r\n\r\nstruct Fragment {\r\n    @builtin(position) Position : vec4<f32>,\r\n    @location(0) TexCoord : vec2<f32>\r\n};\r\n\r\n// scale x, y, x\r\nconst sx: f32 = 1.0;\r\nconst sy: f32 = 1.0;\r\nconst sz: f32 = 1.0;\r\n\r\n// translate x, y, z\r\nconst tx: f32 = 1.0;\r\nconst ty: f32 = 1.0;\r\nconst tz: f32 = 0;\r\n\r\n// rotation\r\nconst rot: f32 = 0.0;\r\nconst s = sin(rot);\r\nconst c = cos(rot);\r\n\r\n// https://webglfundamentals.org/webgl/lessons/webgl-2d-matrices.html\r\n\r\nconst scaleM: mat4x4<f32> = mat4x4<f32>(sx, 0.0, 0.0, 0.0,\r\n                                       0.0,  sy, 0.0, 0.0,\r\n                                       0.0, 0.0, sz, 0.0,\r\n                                         0,   0,   0, 1.0);\r\n\r\n// rotation and translation\r\nconst modelM: mat4x4<f32> = mat4x4<f32>(c,   s, 0.0, 0.0,\r\n                                       -s,   c, 0.0, 0.0,\r\n                                      0.0, 0.0, 1.0, 0.0,\r\n                                       tx,  ty,  tz, 1.0) * scaleM;\r\n\r\n\r\n\r\n@vertex\r\nfn vs_main (@location(0) vertexPosition: vec2<f32>) -> Fragment  {\r\n\r\n    var output: Fragment;\r\n\r\n    output.Position = transformUBO.projection * transformUBO.view * modelM * vec4<f32>(vertexPosition, 0.0, 1.0);\r\n\r\n    // convert screen space (-1 -> 1) to texture space (0 -> 1)\r\n    output.TexCoord = vec2<f32>((output.Position.xy + 1.0) / 2.0);\r\n    output.TexCoord.y = 1.0 - output.TexCoord.y; // invert the Y because in texture space, y is positive up\r\n    \r\n    return output;\r\n}\r\n\r\n\r\n@fragment\r\nfn fs_main (@location(0) TexCoord: vec2<f32>) -> @location(0) vec4<f32> {\r\n\r\n    let dims = vec2<f32>(textureDimensions(mapTexture, 0));\r\n    let inv = param.offset / dims;\r\n\r\n    var map: vec4<f32> = textureSample(mapTexture, mySampler, TexCoord + inv);\r\n\r\n    let scale = param.scale;\r\n\r\n    map -= 0.5; // convert map value from (0 -> 1) to (-0.5 -> 0.5)\r\n\r\n    \r\n    let invTexSize = 1 / dims;\r\n\r\n    map.x = scale * invTexSize.x * map.x;\r\n    map.y = scale * invTexSize.y * map.y;\r\n\r\n    var clamped:vec2<f32> = vec2<f32>(TexCoord.x + map.x, TexCoord.y + map.y);\r\n\r\n    // keep the coordinates within the texture so we're not sampling outside of that \r\n    // this is undefined behavior for webgl. maybe it's fine for webgpu? *shrugs*\r\n    clamped = clamp(clamped, vec2<f32>(0,0), vec2<f32>(1, 1));\r\n\r\n    let outColor: vec4<f32> = textureSample(myTexture, mySampler, clamped);\r\n\r\n    return outColor;\r\n}\r\n";

// http-url:https://wgpu-matrix.org/dist/3.x/wgpu-matrix.module.js
function wrapConstructor(OriginalConstructor, modifier) {
  return class extends OriginalConstructor {
    constructor(...args) {
      super(...args);
      modifier(this);
    }
  };
}
var ZeroArray = wrapConstructor(Array, (a) => a.fill(0));
var EPSILON = 1e-6;
function getAPIImpl$5(Ctor) {
  function create(x = 0, y = 0) {
    const newDst = new Ctor(2);
    if (x !== void 0) {
      newDst[0] = x;
      if (y !== void 0) {
        newDst[1] = y;
      }
    }
    return newDst;
  }
  const fromValues = create;
  function set(x, y, dst) {
    const newDst = dst ?? new Ctor(2);
    newDst[0] = x;
    newDst[1] = y;
    return newDst;
  }
  function ceil(v, dst) {
    const newDst = dst ?? new Ctor(2);
    newDst[0] = Math.ceil(v[0]);
    newDst[1] = Math.ceil(v[1]);
    return newDst;
  }
  function floor(v, dst) {
    const newDst = dst ?? new Ctor(2);
    newDst[0] = Math.floor(v[0]);
    newDst[1] = Math.floor(v[1]);
    return newDst;
  }
  function round(v, dst) {
    const newDst = dst ?? new Ctor(2);
    newDst[0] = Math.round(v[0]);
    newDst[1] = Math.round(v[1]);
    return newDst;
  }
  function clamp(v, min2 = 0, max2 = 1, dst) {
    const newDst = dst ?? new Ctor(2);
    newDst[0] = Math.min(max2, Math.max(min2, v[0]));
    newDst[1] = Math.min(max2, Math.max(min2, v[1]));
    return newDst;
  }
  function add(a, b, dst) {
    const newDst = dst ?? new Ctor(2);
    newDst[0] = a[0] + b[0];
    newDst[1] = a[1] + b[1];
    return newDst;
  }
  function addScaled(a, b, scale2, dst) {
    const newDst = dst ?? new Ctor(2);
    newDst[0] = a[0] + b[0] * scale2;
    newDst[1] = a[1] + b[1] * scale2;
    return newDst;
  }
  function angle(a, b) {
    const ax = a[0];
    const ay = a[1];
    const bx = b[0];
    const by = b[1];
    const mag1 = Math.sqrt(ax * ax + ay * ay);
    const mag2 = Math.sqrt(bx * bx + by * by);
    const mag = mag1 * mag2;
    const cosine = mag && dot(a, b) / mag;
    return Math.acos(cosine);
  }
  function subtract(a, b, dst) {
    const newDst = dst ?? new Ctor(2);
    newDst[0] = a[0] - b[0];
    newDst[1] = a[1] - b[1];
    return newDst;
  }
  const sub = subtract;
  function equalsApproximately(a, b) {
    return Math.abs(a[0] - b[0]) < EPSILON && Math.abs(a[1] - b[1]) < EPSILON;
  }
  function equals(a, b) {
    return a[0] === b[0] && a[1] === b[1];
  }
  function lerp(a, b, t, dst) {
    const newDst = dst ?? new Ctor(2);
    newDst[0] = a[0] + t * (b[0] - a[0]);
    newDst[1] = a[1] + t * (b[1] - a[1]);
    return newDst;
  }
  function lerpV(a, b, t, dst) {
    const newDst = dst ?? new Ctor(2);
    newDst[0] = a[0] + t[0] * (b[0] - a[0]);
    newDst[1] = a[1] + t[1] * (b[1] - a[1]);
    return newDst;
  }
  function max(a, b, dst) {
    const newDst = dst ?? new Ctor(2);
    newDst[0] = Math.max(a[0], b[0]);
    newDst[1] = Math.max(a[1], b[1]);
    return newDst;
  }
  function min(a, b, dst) {
    const newDst = dst ?? new Ctor(2);
    newDst[0] = Math.min(a[0], b[0]);
    newDst[1] = Math.min(a[1], b[1]);
    return newDst;
  }
  function mulScalar(v, k, dst) {
    const newDst = dst ?? new Ctor(2);
    newDst[0] = v[0] * k;
    newDst[1] = v[1] * k;
    return newDst;
  }
  const scale = mulScalar;
  function divScalar(v, k, dst) {
    const newDst = dst ?? new Ctor(2);
    newDst[0] = v[0] / k;
    newDst[1] = v[1] / k;
    return newDst;
  }
  function inverse(v, dst) {
    const newDst = dst ?? new Ctor(2);
    newDst[0] = 1 / v[0];
    newDst[1] = 1 / v[1];
    return newDst;
  }
  const invert = inverse;
  function cross(a, b, dst) {
    const newDst = dst ?? new Ctor(3);
    const z = a[0] * b[1] - a[1] * b[0];
    newDst[0] = 0;
    newDst[1] = 0;
    newDst[2] = z;
    return newDst;
  }
  function dot(a, b) {
    return a[0] * b[0] + a[1] * b[1];
  }
  function length(v) {
    const v0 = v[0];
    const v1 = v[1];
    return Math.sqrt(v0 * v0 + v1 * v1);
  }
  const len = length;
  function lengthSq(v) {
    const v0 = v[0];
    const v1 = v[1];
    return v0 * v0 + v1 * v1;
  }
  const lenSq = lengthSq;
  function distance(a, b) {
    const dx = a[0] - b[0];
    const dy = a[1] - b[1];
    return Math.sqrt(dx * dx + dy * dy);
  }
  const dist = distance;
  function distanceSq(a, b) {
    const dx = a[0] - b[0];
    const dy = a[1] - b[1];
    return dx * dx + dy * dy;
  }
  const distSq = distanceSq;
  function normalize(v, dst) {
    const newDst = dst ?? new Ctor(2);
    const v0 = v[0];
    const v1 = v[1];
    const len2 = Math.sqrt(v0 * v0 + v1 * v1);
    if (len2 > 1e-5) {
      newDst[0] = v0 / len2;
      newDst[1] = v1 / len2;
    } else {
      newDst[0] = 0;
      newDst[1] = 0;
    }
    return newDst;
  }
  function negate(v, dst) {
    const newDst = dst ?? new Ctor(2);
    newDst[0] = -v[0];
    newDst[1] = -v[1];
    return newDst;
  }
  function copy(v, dst) {
    const newDst = dst ?? new Ctor(2);
    newDst[0] = v[0];
    newDst[1] = v[1];
    return newDst;
  }
  const clone = copy;
  function multiply(a, b, dst) {
    const newDst = dst ?? new Ctor(2);
    newDst[0] = a[0] * b[0];
    newDst[1] = a[1] * b[1];
    return newDst;
  }
  const mul = multiply;
  function divide(a, b, dst) {
    const newDst = dst ?? new Ctor(2);
    newDst[0] = a[0] / b[0];
    newDst[1] = a[1] / b[1];
    return newDst;
  }
  const div = divide;
  function random(scale2 = 1, dst) {
    const newDst = dst ?? new Ctor(2);
    const angle2 = Math.random() * 2 * Math.PI;
    newDst[0] = Math.cos(angle2) * scale2;
    newDst[1] = Math.sin(angle2) * scale2;
    return newDst;
  }
  function zero(dst) {
    const newDst = dst ?? new Ctor(2);
    newDst[0] = 0;
    newDst[1] = 0;
    return newDst;
  }
  function transformMat4(v, m, dst) {
    const newDst = dst ?? new Ctor(2);
    const x = v[0];
    const y = v[1];
    newDst[0] = x * m[0] + y * m[4] + m[12];
    newDst[1] = x * m[1] + y * m[5] + m[13];
    return newDst;
  }
  function transformMat3(v, m, dst) {
    const newDst = dst ?? new Ctor(2);
    const x = v[0];
    const y = v[1];
    newDst[0] = m[0] * x + m[4] * y + m[8];
    newDst[1] = m[1] * x + m[5] * y + m[9];
    return newDst;
  }
  function rotate(a, b, rad, dst) {
    const newDst = dst ?? new Ctor(2);
    const p0 = a[0] - b[0];
    const p1 = a[1] - b[1];
    const sinC = Math.sin(rad);
    const cosC = Math.cos(rad);
    newDst[0] = p0 * cosC - p1 * sinC + b[0];
    newDst[1] = p0 * sinC + p1 * cosC + b[1];
    return newDst;
  }
  function setLength(a, len2, dst) {
    const newDst = dst ?? new Ctor(2);
    normalize(a, newDst);
    return mulScalar(newDst, len2, newDst);
  }
  function truncate(a, maxLen, dst) {
    const newDst = dst ?? new Ctor(2);
    if (length(a) > maxLen) {
      return setLength(a, maxLen, newDst);
    }
    return copy(a, newDst);
  }
  function midpoint(a, b, dst) {
    const newDst = dst ?? new Ctor(2);
    return lerp(a, b, 0.5, newDst);
  }
  return {
    create,
    fromValues,
    set,
    ceil,
    floor,
    round,
    clamp,
    add,
    addScaled,
    angle,
    subtract,
    sub,
    equalsApproximately,
    equals,
    lerp,
    lerpV,
    max,
    min,
    mulScalar,
    scale,
    divScalar,
    inverse,
    invert,
    cross,
    dot,
    length,
    len,
    lengthSq,
    lenSq,
    distance,
    dist,
    distanceSq,
    distSq,
    normalize,
    negate,
    copy,
    clone,
    multiply,
    mul,
    divide,
    div,
    random,
    zero,
    transformMat4,
    transformMat3,
    rotate,
    setLength,
    truncate,
    midpoint
  };
}
var cache$5 = /* @__PURE__ */ new Map();
function getAPI$5(Ctor) {
  let api = cache$5.get(Ctor);
  if (!api) {
    api = getAPIImpl$5(Ctor);
    cache$5.set(Ctor, api);
  }
  return api;
}
function getAPIImpl$4(Ctor) {
  const vec23 = getAPI$5(Ctor);
  function create(v0, v1, v2, v3, v4, v5, v6, v7, v8) {
    const newDst = new Ctor(12);
    newDst[3] = 0;
    newDst[7] = 0;
    newDst[11] = 0;
    if (v0 !== void 0) {
      newDst[0] = v0;
      if (v1 !== void 0) {
        newDst[1] = v1;
        if (v2 !== void 0) {
          newDst[2] = v2;
          if (v3 !== void 0) {
            newDst[4] = v3;
            if (v4 !== void 0) {
              newDst[5] = v4;
              if (v5 !== void 0) {
                newDst[6] = v5;
                if (v6 !== void 0) {
                  newDst[8] = v6;
                  if (v7 !== void 0) {
                    newDst[9] = v7;
                    if (v8 !== void 0) {
                      newDst[10] = v8;
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
    return newDst;
  }
  function set(v0, v1, v2, v3, v4, v5, v6, v7, v8, dst) {
    const newDst = dst ?? new Ctor(12);
    newDst[0] = v0;
    newDst[1] = v1;
    newDst[2] = v2;
    newDst[3] = 0;
    newDst[4] = v3;
    newDst[5] = v4;
    newDst[6] = v5;
    newDst[7] = 0;
    newDst[8] = v6;
    newDst[9] = v7;
    newDst[10] = v8;
    newDst[11] = 0;
    return newDst;
  }
  function fromMat4(m4, dst) {
    const newDst = dst ?? new Ctor(12);
    newDst[0] = m4[0];
    newDst[1] = m4[1];
    newDst[2] = m4[2];
    newDst[3] = 0;
    newDst[4] = m4[4];
    newDst[5] = m4[5];
    newDst[6] = m4[6];
    newDst[7] = 0;
    newDst[8] = m4[8];
    newDst[9] = m4[9];
    newDst[10] = m4[10];
    newDst[11] = 0;
    return newDst;
  }
  function fromQuat(q, dst) {
    const newDst = dst ?? new Ctor(12);
    const x = q[0];
    const y = q[1];
    const z = q[2];
    const w = q[3];
    const x2 = x + x;
    const y2 = y + y;
    const z2 = z + z;
    const xx = x * x2;
    const yx = y * x2;
    const yy = y * y2;
    const zx = z * x2;
    const zy = z * y2;
    const zz = z * z2;
    const wx = w * x2;
    const wy = w * y2;
    const wz = w * z2;
    newDst[0] = 1 - yy - zz;
    newDst[1] = yx + wz;
    newDst[2] = zx - wy;
    newDst[3] = 0;
    newDst[4] = yx - wz;
    newDst[5] = 1 - xx - zz;
    newDst[6] = zy + wx;
    newDst[7] = 0;
    newDst[8] = zx + wy;
    newDst[9] = zy - wx;
    newDst[10] = 1 - xx - yy;
    newDst[11] = 0;
    return newDst;
  }
  function negate(m, dst) {
    const newDst = dst ?? new Ctor(12);
    newDst[0] = -m[0];
    newDst[1] = -m[1];
    newDst[2] = -m[2];
    newDst[4] = -m[4];
    newDst[5] = -m[5];
    newDst[6] = -m[6];
    newDst[8] = -m[8];
    newDst[9] = -m[9];
    newDst[10] = -m[10];
    return newDst;
  }
  function copy(m, dst) {
    const newDst = dst ?? new Ctor(12);
    newDst[0] = m[0];
    newDst[1] = m[1];
    newDst[2] = m[2];
    newDst[4] = m[4];
    newDst[5] = m[5];
    newDst[6] = m[6];
    newDst[8] = m[8];
    newDst[9] = m[9];
    newDst[10] = m[10];
    return newDst;
  }
  const clone = copy;
  function equalsApproximately(a, b) {
    return Math.abs(a[0] - b[0]) < EPSILON && Math.abs(a[1] - b[1]) < EPSILON && Math.abs(a[2] - b[2]) < EPSILON && Math.abs(a[4] - b[4]) < EPSILON && Math.abs(a[5] - b[5]) < EPSILON && Math.abs(a[6] - b[6]) < EPSILON && Math.abs(a[8] - b[8]) < EPSILON && Math.abs(a[9] - b[9]) < EPSILON && Math.abs(a[10] - b[10]) < EPSILON;
  }
  function equals(a, b) {
    return a[0] === b[0] && a[1] === b[1] && a[2] === b[2] && a[4] === b[4] && a[5] === b[5] && a[6] === b[6] && a[8] === b[8] && a[9] === b[9] && a[10] === b[10];
  }
  function identity(dst) {
    const newDst = dst ?? new Ctor(12);
    newDst[0] = 1;
    newDst[1] = 0;
    newDst[2] = 0;
    newDst[4] = 0;
    newDst[5] = 1;
    newDst[6] = 0;
    newDst[8] = 0;
    newDst[9] = 0;
    newDst[10] = 1;
    return newDst;
  }
  function transpose(m, dst) {
    const newDst = dst ?? new Ctor(12);
    if (newDst === m) {
      let t;
      t = m[1];
      m[1] = m[4];
      m[4] = t;
      t = m[2];
      m[2] = m[8];
      m[8] = t;
      t = m[6];
      m[6] = m[9];
      m[9] = t;
      return newDst;
    }
    const m00 = m[0 * 4 + 0];
    const m01 = m[0 * 4 + 1];
    const m02 = m[0 * 4 + 2];
    const m10 = m[1 * 4 + 0];
    const m11 = m[1 * 4 + 1];
    const m12 = m[1 * 4 + 2];
    const m20 = m[2 * 4 + 0];
    const m21 = m[2 * 4 + 1];
    const m22 = m[2 * 4 + 2];
    newDst[0] = m00;
    newDst[1] = m10;
    newDst[2] = m20;
    newDst[4] = m01;
    newDst[5] = m11;
    newDst[6] = m21;
    newDst[8] = m02;
    newDst[9] = m12;
    newDst[10] = m22;
    return newDst;
  }
  function inverse(m, dst) {
    const newDst = dst ?? new Ctor(12);
    const m00 = m[0 * 4 + 0];
    const m01 = m[0 * 4 + 1];
    const m02 = m[0 * 4 + 2];
    const m10 = m[1 * 4 + 0];
    const m11 = m[1 * 4 + 1];
    const m12 = m[1 * 4 + 2];
    const m20 = m[2 * 4 + 0];
    const m21 = m[2 * 4 + 1];
    const m22 = m[2 * 4 + 2];
    const b01 = m22 * m11 - m12 * m21;
    const b11 = -m22 * m10 + m12 * m20;
    const b21 = m21 * m10 - m11 * m20;
    const invDet = 1 / (m00 * b01 + m01 * b11 + m02 * b21);
    newDst[0] = b01 * invDet;
    newDst[1] = (-m22 * m01 + m02 * m21) * invDet;
    newDst[2] = (m12 * m01 - m02 * m11) * invDet;
    newDst[4] = b11 * invDet;
    newDst[5] = (m22 * m00 - m02 * m20) * invDet;
    newDst[6] = (-m12 * m00 + m02 * m10) * invDet;
    newDst[8] = b21 * invDet;
    newDst[9] = (-m21 * m00 + m01 * m20) * invDet;
    newDst[10] = (m11 * m00 - m01 * m10) * invDet;
    return newDst;
  }
  function determinant(m) {
    const m00 = m[0 * 4 + 0];
    const m01 = m[0 * 4 + 1];
    const m02 = m[0 * 4 + 2];
    const m10 = m[1 * 4 + 0];
    const m11 = m[1 * 4 + 1];
    const m12 = m[1 * 4 + 2];
    const m20 = m[2 * 4 + 0];
    const m21 = m[2 * 4 + 1];
    const m22 = m[2 * 4 + 2];
    return m00 * (m11 * m22 - m21 * m12) - m10 * (m01 * m22 - m21 * m02) + m20 * (m01 * m12 - m11 * m02);
  }
  const invert = inverse;
  function multiply(a, b, dst) {
    const newDst = dst ?? new Ctor(12);
    const a00 = a[0];
    const a01 = a[1];
    const a02 = a[2];
    const a10 = a[4 + 0];
    const a11 = a[4 + 1];
    const a12 = a[4 + 2];
    const a20 = a[8 + 0];
    const a21 = a[8 + 1];
    const a22 = a[8 + 2];
    const b00 = b[0];
    const b01 = b[1];
    const b02 = b[2];
    const b10 = b[4 + 0];
    const b11 = b[4 + 1];
    const b12 = b[4 + 2];
    const b20 = b[8 + 0];
    const b21 = b[8 + 1];
    const b22 = b[8 + 2];
    newDst[0] = a00 * b00 + a10 * b01 + a20 * b02;
    newDst[1] = a01 * b00 + a11 * b01 + a21 * b02;
    newDst[2] = a02 * b00 + a12 * b01 + a22 * b02;
    newDst[4] = a00 * b10 + a10 * b11 + a20 * b12;
    newDst[5] = a01 * b10 + a11 * b11 + a21 * b12;
    newDst[6] = a02 * b10 + a12 * b11 + a22 * b12;
    newDst[8] = a00 * b20 + a10 * b21 + a20 * b22;
    newDst[9] = a01 * b20 + a11 * b21 + a21 * b22;
    newDst[10] = a02 * b20 + a12 * b21 + a22 * b22;
    return newDst;
  }
  const mul = multiply;
  function setTranslation(a, v, dst) {
    const newDst = dst ?? identity();
    if (a !== newDst) {
      newDst[0] = a[0];
      newDst[1] = a[1];
      newDst[2] = a[2];
      newDst[4] = a[4];
      newDst[5] = a[5];
      newDst[6] = a[6];
    }
    newDst[8] = v[0];
    newDst[9] = v[1];
    newDst[10] = 1;
    return newDst;
  }
  function getTranslation(m, dst) {
    const newDst = dst ?? vec23.create();
    newDst[0] = m[8];
    newDst[1] = m[9];
    return newDst;
  }
  function getAxis(m, axis, dst) {
    const newDst = dst ?? vec23.create();
    const off = axis * 4;
    newDst[0] = m[off + 0];
    newDst[1] = m[off + 1];
    return newDst;
  }
  function setAxis(m, v, axis, dst) {
    const newDst = dst === m ? m : copy(m, dst);
    const off = axis * 4;
    newDst[off + 0] = v[0];
    newDst[off + 1] = v[1];
    return newDst;
  }
  function getScaling(m, dst) {
    const newDst = dst ?? vec23.create();
    const xx = m[0];
    const xy = m[1];
    const yx = m[4];
    const yy = m[5];
    newDst[0] = Math.sqrt(xx * xx + xy * xy);
    newDst[1] = Math.sqrt(yx * yx + yy * yy);
    return newDst;
  }
  function translation(v, dst) {
    const newDst = dst ?? new Ctor(12);
    newDst[0] = 1;
    newDst[1] = 0;
    newDst[2] = 0;
    newDst[4] = 0;
    newDst[5] = 1;
    newDst[6] = 0;
    newDst[8] = v[0];
    newDst[9] = v[1];
    newDst[10] = 1;
    return newDst;
  }
  function translate(m, v, dst) {
    const newDst = dst ?? new Ctor(12);
    const v0 = v[0];
    const v1 = v[1];
    const m00 = m[0];
    const m01 = m[1];
    const m02 = m[2];
    const m10 = m[1 * 4 + 0];
    const m11 = m[1 * 4 + 1];
    const m12 = m[1 * 4 + 2];
    const m20 = m[2 * 4 + 0];
    const m21 = m[2 * 4 + 1];
    const m22 = m[2 * 4 + 2];
    if (m !== newDst) {
      newDst[0] = m00;
      newDst[1] = m01;
      newDst[2] = m02;
      newDst[4] = m10;
      newDst[5] = m11;
      newDst[6] = m12;
    }
    newDst[8] = m00 * v0 + m10 * v1 + m20;
    newDst[9] = m01 * v0 + m11 * v1 + m21;
    newDst[10] = m02 * v0 + m12 * v1 + m22;
    return newDst;
  }
  function rotation(angleInRadians, dst) {
    const newDst = dst ?? new Ctor(12);
    const c = Math.cos(angleInRadians);
    const s = Math.sin(angleInRadians);
    newDst[0] = c;
    newDst[1] = s;
    newDst[2] = 0;
    newDst[4] = -s;
    newDst[5] = c;
    newDst[6] = 0;
    newDst[8] = 0;
    newDst[9] = 0;
    newDst[10] = 1;
    return newDst;
  }
  function rotate(m, angleInRadians, dst) {
    const newDst = dst ?? new Ctor(12);
    const m00 = m[0 * 4 + 0];
    const m01 = m[0 * 4 + 1];
    const m02 = m[0 * 4 + 2];
    const m10 = m[1 * 4 + 0];
    const m11 = m[1 * 4 + 1];
    const m12 = m[1 * 4 + 2];
    const c = Math.cos(angleInRadians);
    const s = Math.sin(angleInRadians);
    newDst[0] = c * m00 + s * m10;
    newDst[1] = c * m01 + s * m11;
    newDst[2] = c * m02 + s * m12;
    newDst[4] = c * m10 - s * m00;
    newDst[5] = c * m11 - s * m01;
    newDst[6] = c * m12 - s * m02;
    if (m !== newDst) {
      newDst[8] = m[8];
      newDst[9] = m[9];
      newDst[10] = m[10];
    }
    return newDst;
  }
  function scaling(v, dst) {
    const newDst = dst ?? new Ctor(12);
    newDst[0] = v[0];
    newDst[1] = 0;
    newDst[2] = 0;
    newDst[4] = 0;
    newDst[5] = v[1];
    newDst[6] = 0;
    newDst[8] = 0;
    newDst[9] = 0;
    newDst[10] = 1;
    return newDst;
  }
  function scale(m, v, dst) {
    const newDst = dst ?? new Ctor(12);
    const v0 = v[0];
    const v1 = v[1];
    newDst[0] = v0 * m[0 * 4 + 0];
    newDst[1] = v0 * m[0 * 4 + 1];
    newDst[2] = v0 * m[0 * 4 + 2];
    newDst[4] = v1 * m[1 * 4 + 0];
    newDst[5] = v1 * m[1 * 4 + 1];
    newDst[6] = v1 * m[1 * 4 + 2];
    if (m !== newDst) {
      newDst[8] = m[8];
      newDst[9] = m[9];
      newDst[10] = m[10];
    }
    return newDst;
  }
  function uniformScaling(s, dst) {
    const newDst = dst ?? new Ctor(12);
    newDst[0] = s;
    newDst[1] = 0;
    newDst[2] = 0;
    newDst[4] = 0;
    newDst[5] = s;
    newDst[6] = 0;
    newDst[8] = 0;
    newDst[9] = 0;
    newDst[10] = 1;
    return newDst;
  }
  function uniformScale(m, s, dst) {
    const newDst = dst ?? new Ctor(12);
    newDst[0] = s * m[0 * 4 + 0];
    newDst[1] = s * m[0 * 4 + 1];
    newDst[2] = s * m[0 * 4 + 2];
    newDst[4] = s * m[1 * 4 + 0];
    newDst[5] = s * m[1 * 4 + 1];
    newDst[6] = s * m[1 * 4 + 2];
    if (m !== newDst) {
      newDst[8] = m[8];
      newDst[9] = m[9];
      newDst[10] = m[10];
    }
    return newDst;
  }
  return {
    clone,
    create,
    set,
    fromMat4,
    fromQuat,
    negate,
    copy,
    equalsApproximately,
    equals,
    identity,
    transpose,
    inverse,
    invert,
    determinant,
    mul,
    multiply,
    setTranslation,
    getTranslation,
    getAxis,
    setAxis,
    getScaling,
    translation,
    translate,
    rotation,
    rotate,
    scaling,
    scale,
    uniformScaling,
    uniformScale
  };
}
var cache$4 = /* @__PURE__ */ new Map();
function getAPI$4(Ctor) {
  let api = cache$4.get(Ctor);
  if (!api) {
    api = getAPIImpl$4(Ctor);
    cache$4.set(Ctor, api);
  }
  return api;
}
function getAPIImpl$3(Ctor) {
  function create(x, y, z) {
    const newDst = new Ctor(3);
    if (x !== void 0) {
      newDst[0] = x;
      if (y !== void 0) {
        newDst[1] = y;
        if (z !== void 0) {
          newDst[2] = z;
        }
      }
    }
    return newDst;
  }
  const fromValues = create;
  function set(x, y, z, dst) {
    const newDst = dst ?? new Ctor(3);
    newDst[0] = x;
    newDst[1] = y;
    newDst[2] = z;
    return newDst;
  }
  function ceil(v, dst) {
    const newDst = dst ?? new Ctor(3);
    newDst[0] = Math.ceil(v[0]);
    newDst[1] = Math.ceil(v[1]);
    newDst[2] = Math.ceil(v[2]);
    return newDst;
  }
  function floor(v, dst) {
    const newDst = dst ?? new Ctor(3);
    newDst[0] = Math.floor(v[0]);
    newDst[1] = Math.floor(v[1]);
    newDst[2] = Math.floor(v[2]);
    return newDst;
  }
  function round(v, dst) {
    const newDst = dst ?? new Ctor(3);
    newDst[0] = Math.round(v[0]);
    newDst[1] = Math.round(v[1]);
    newDst[2] = Math.round(v[2]);
    return newDst;
  }
  function clamp(v, min2 = 0, max2 = 1, dst) {
    const newDst = dst ?? new Ctor(3);
    newDst[0] = Math.min(max2, Math.max(min2, v[0]));
    newDst[1] = Math.min(max2, Math.max(min2, v[1]));
    newDst[2] = Math.min(max2, Math.max(min2, v[2]));
    return newDst;
  }
  function add(a, b, dst) {
    const newDst = dst ?? new Ctor(3);
    newDst[0] = a[0] + b[0];
    newDst[1] = a[1] + b[1];
    newDst[2] = a[2] + b[2];
    return newDst;
  }
  function addScaled(a, b, scale2, dst) {
    const newDst = dst ?? new Ctor(3);
    newDst[0] = a[0] + b[0] * scale2;
    newDst[1] = a[1] + b[1] * scale2;
    newDst[2] = a[2] + b[2] * scale2;
    return newDst;
  }
  function angle(a, b) {
    const ax = a[0];
    const ay = a[1];
    const az = a[2];
    const bx = b[0];
    const by = b[1];
    const bz = b[2];
    const mag1 = Math.sqrt(ax * ax + ay * ay + az * az);
    const mag2 = Math.sqrt(bx * bx + by * by + bz * bz);
    const mag = mag1 * mag2;
    const cosine = mag && dot(a, b) / mag;
    return Math.acos(cosine);
  }
  function subtract(a, b, dst) {
    const newDst = dst ?? new Ctor(3);
    newDst[0] = a[0] - b[0];
    newDst[1] = a[1] - b[1];
    newDst[2] = a[2] - b[2];
    return newDst;
  }
  const sub = subtract;
  function equalsApproximately(a, b) {
    return Math.abs(a[0] - b[0]) < EPSILON && Math.abs(a[1] - b[1]) < EPSILON && Math.abs(a[2] - b[2]) < EPSILON;
  }
  function equals(a, b) {
    return a[0] === b[0] && a[1] === b[1] && a[2] === b[2];
  }
  function lerp(a, b, t, dst) {
    const newDst = dst ?? new Ctor(3);
    newDst[0] = a[0] + t * (b[0] - a[0]);
    newDst[1] = a[1] + t * (b[1] - a[1]);
    newDst[2] = a[2] + t * (b[2] - a[2]);
    return newDst;
  }
  function lerpV(a, b, t, dst) {
    const newDst = dst ?? new Ctor(3);
    newDst[0] = a[0] + t[0] * (b[0] - a[0]);
    newDst[1] = a[1] + t[1] * (b[1] - a[1]);
    newDst[2] = a[2] + t[2] * (b[2] - a[2]);
    return newDst;
  }
  function max(a, b, dst) {
    const newDst = dst ?? new Ctor(3);
    newDst[0] = Math.max(a[0], b[0]);
    newDst[1] = Math.max(a[1], b[1]);
    newDst[2] = Math.max(a[2], b[2]);
    return newDst;
  }
  function min(a, b, dst) {
    const newDst = dst ?? new Ctor(3);
    newDst[0] = Math.min(a[0], b[0]);
    newDst[1] = Math.min(a[1], b[1]);
    newDst[2] = Math.min(a[2], b[2]);
    return newDst;
  }
  function mulScalar(v, k, dst) {
    const newDst = dst ?? new Ctor(3);
    newDst[0] = v[0] * k;
    newDst[1] = v[1] * k;
    newDst[2] = v[2] * k;
    return newDst;
  }
  const scale = mulScalar;
  function divScalar(v, k, dst) {
    const newDst = dst ?? new Ctor(3);
    newDst[0] = v[0] / k;
    newDst[1] = v[1] / k;
    newDst[2] = v[2] / k;
    return newDst;
  }
  function inverse(v, dst) {
    const newDst = dst ?? new Ctor(3);
    newDst[0] = 1 / v[0];
    newDst[1] = 1 / v[1];
    newDst[2] = 1 / v[2];
    return newDst;
  }
  const invert = inverse;
  function cross(a, b, dst) {
    const newDst = dst ?? new Ctor(3);
    const t1 = a[2] * b[0] - a[0] * b[2];
    const t2 = a[0] * b[1] - a[1] * b[0];
    newDst[0] = a[1] * b[2] - a[2] * b[1];
    newDst[1] = t1;
    newDst[2] = t2;
    return newDst;
  }
  function dot(a, b) {
    return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  }
  function length(v) {
    const v0 = v[0];
    const v1 = v[1];
    const v2 = v[2];
    return Math.sqrt(v0 * v0 + v1 * v1 + v2 * v2);
  }
  const len = length;
  function lengthSq(v) {
    const v0 = v[0];
    const v1 = v[1];
    const v2 = v[2];
    return v0 * v0 + v1 * v1 + v2 * v2;
  }
  const lenSq = lengthSq;
  function distance(a, b) {
    const dx = a[0] - b[0];
    const dy = a[1] - b[1];
    const dz = a[2] - b[2];
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }
  const dist = distance;
  function distanceSq(a, b) {
    const dx = a[0] - b[0];
    const dy = a[1] - b[1];
    const dz = a[2] - b[2];
    return dx * dx + dy * dy + dz * dz;
  }
  const distSq = distanceSq;
  function normalize(v, dst) {
    const newDst = dst ?? new Ctor(3);
    const v0 = v[0];
    const v1 = v[1];
    const v2 = v[2];
    const len2 = Math.sqrt(v0 * v0 + v1 * v1 + v2 * v2);
    if (len2 > 1e-5) {
      newDst[0] = v0 / len2;
      newDst[1] = v1 / len2;
      newDst[2] = v2 / len2;
    } else {
      newDst[0] = 0;
      newDst[1] = 0;
      newDst[2] = 0;
    }
    return newDst;
  }
  function negate(v, dst) {
    const newDst = dst ?? new Ctor(3);
    newDst[0] = -v[0];
    newDst[1] = -v[1];
    newDst[2] = -v[2];
    return newDst;
  }
  function copy(v, dst) {
    const newDst = dst ?? new Ctor(3);
    newDst[0] = v[0];
    newDst[1] = v[1];
    newDst[2] = v[2];
    return newDst;
  }
  const clone = copy;
  function multiply(a, b, dst) {
    const newDst = dst ?? new Ctor(3);
    newDst[0] = a[0] * b[0];
    newDst[1] = a[1] * b[1];
    newDst[2] = a[2] * b[2];
    return newDst;
  }
  const mul = multiply;
  function divide(a, b, dst) {
    const newDst = dst ?? new Ctor(3);
    newDst[0] = a[0] / b[0];
    newDst[1] = a[1] / b[1];
    newDst[2] = a[2] / b[2];
    return newDst;
  }
  const div = divide;
  function random(scale2 = 1, dst) {
    const newDst = dst ?? new Ctor(3);
    const angle2 = Math.random() * 2 * Math.PI;
    const z = Math.random() * 2 - 1;
    const zScale = Math.sqrt(1 - z * z) * scale2;
    newDst[0] = Math.cos(angle2) * zScale;
    newDst[1] = Math.sin(angle2) * zScale;
    newDst[2] = z * scale2;
    return newDst;
  }
  function zero(dst) {
    const newDst = dst ?? new Ctor(3);
    newDst[0] = 0;
    newDst[1] = 0;
    newDst[2] = 0;
    return newDst;
  }
  function transformMat4(v, m, dst) {
    const newDst = dst ?? new Ctor(3);
    const x = v[0];
    const y = v[1];
    const z = v[2];
    const w = m[3] * x + m[7] * y + m[11] * z + m[15] || 1;
    newDst[0] = (m[0] * x + m[4] * y + m[8] * z + m[12]) / w;
    newDst[1] = (m[1] * x + m[5] * y + m[9] * z + m[13]) / w;
    newDst[2] = (m[2] * x + m[6] * y + m[10] * z + m[14]) / w;
    return newDst;
  }
  function transformMat4Upper3x3(v, m, dst) {
    const newDst = dst ?? new Ctor(3);
    const v0 = v[0];
    const v1 = v[1];
    const v2 = v[2];
    newDst[0] = v0 * m[0 * 4 + 0] + v1 * m[1 * 4 + 0] + v2 * m[2 * 4 + 0];
    newDst[1] = v0 * m[0 * 4 + 1] + v1 * m[1 * 4 + 1] + v2 * m[2 * 4 + 1];
    newDst[2] = v0 * m[0 * 4 + 2] + v1 * m[1 * 4 + 2] + v2 * m[2 * 4 + 2];
    return newDst;
  }
  function transformMat3(v, m, dst) {
    const newDst = dst ?? new Ctor(3);
    const x = v[0];
    const y = v[1];
    const z = v[2];
    newDst[0] = x * m[0] + y * m[4] + z * m[8];
    newDst[1] = x * m[1] + y * m[5] + z * m[9];
    newDst[2] = x * m[2] + y * m[6] + z * m[10];
    return newDst;
  }
  function transformQuat(v, q, dst) {
    const newDst = dst ?? new Ctor(3);
    const qx = q[0];
    const qy = q[1];
    const qz = q[2];
    const w2 = q[3] * 2;
    const x = v[0];
    const y = v[1];
    const z = v[2];
    const uvX = qy * z - qz * y;
    const uvY = qz * x - qx * z;
    const uvZ = qx * y - qy * x;
    newDst[0] = x + uvX * w2 + (qy * uvZ - qz * uvY) * 2;
    newDst[1] = y + uvY * w2 + (qz * uvX - qx * uvZ) * 2;
    newDst[2] = z + uvZ * w2 + (qx * uvY - qy * uvX) * 2;
    return newDst;
  }
  function getTranslation(m, dst) {
    const newDst = dst ?? new Ctor(3);
    newDst[0] = m[12];
    newDst[1] = m[13];
    newDst[2] = m[14];
    return newDst;
  }
  function getAxis(m, axis, dst) {
    const newDst = dst ?? new Ctor(3);
    const off = axis * 4;
    newDst[0] = m[off + 0];
    newDst[1] = m[off + 1];
    newDst[2] = m[off + 2];
    return newDst;
  }
  function getScaling(m, dst) {
    const newDst = dst ?? new Ctor(3);
    const xx = m[0];
    const xy = m[1];
    const xz = m[2];
    const yx = m[4];
    const yy = m[5];
    const yz = m[6];
    const zx = m[8];
    const zy = m[9];
    const zz = m[10];
    newDst[0] = Math.sqrt(xx * xx + xy * xy + xz * xz);
    newDst[1] = Math.sqrt(yx * yx + yy * yy + yz * yz);
    newDst[2] = Math.sqrt(zx * zx + zy * zy + zz * zz);
    return newDst;
  }
  function rotateX(a, b, rad, dst) {
    const newDst = dst ?? new Ctor(3);
    const p = [];
    const r = [];
    p[0] = a[0] - b[0];
    p[1] = a[1] - b[1];
    p[2] = a[2] - b[2];
    r[0] = p[0];
    r[1] = p[1] * Math.cos(rad) - p[2] * Math.sin(rad);
    r[2] = p[1] * Math.sin(rad) + p[2] * Math.cos(rad);
    newDst[0] = r[0] + b[0];
    newDst[1] = r[1] + b[1];
    newDst[2] = r[2] + b[2];
    return newDst;
  }
  function rotateY(a, b, rad, dst) {
    const newDst = dst ?? new Ctor(3);
    const p = [];
    const r = [];
    p[0] = a[0] - b[0];
    p[1] = a[1] - b[1];
    p[2] = a[2] - b[2];
    r[0] = p[2] * Math.sin(rad) + p[0] * Math.cos(rad);
    r[1] = p[1];
    r[2] = p[2] * Math.cos(rad) - p[0] * Math.sin(rad);
    newDst[0] = r[0] + b[0];
    newDst[1] = r[1] + b[1];
    newDst[2] = r[2] + b[2];
    return newDst;
  }
  function rotateZ(a, b, rad, dst) {
    const newDst = dst ?? new Ctor(3);
    const p = [];
    const r = [];
    p[0] = a[0] - b[0];
    p[1] = a[1] - b[1];
    p[2] = a[2] - b[2];
    r[0] = p[0] * Math.cos(rad) - p[1] * Math.sin(rad);
    r[1] = p[0] * Math.sin(rad) + p[1] * Math.cos(rad);
    r[2] = p[2];
    newDst[0] = r[0] + b[0];
    newDst[1] = r[1] + b[1];
    newDst[2] = r[2] + b[2];
    return newDst;
  }
  function setLength(a, len2, dst) {
    const newDst = dst ?? new Ctor(3);
    normalize(a, newDst);
    return mulScalar(newDst, len2, newDst);
  }
  function truncate(a, maxLen, dst) {
    const newDst = dst ?? new Ctor(3);
    if (length(a) > maxLen) {
      return setLength(a, maxLen, newDst);
    }
    return copy(a, newDst);
  }
  function midpoint(a, b, dst) {
    const newDst = dst ?? new Ctor(3);
    return lerp(a, b, 0.5, newDst);
  }
  return {
    create,
    fromValues,
    set,
    ceil,
    floor,
    round,
    clamp,
    add,
    addScaled,
    angle,
    subtract,
    sub,
    equalsApproximately,
    equals,
    lerp,
    lerpV,
    max,
    min,
    mulScalar,
    scale,
    divScalar,
    inverse,
    invert,
    cross,
    dot,
    length,
    len,
    lengthSq,
    lenSq,
    distance,
    dist,
    distanceSq,
    distSq,
    normalize,
    negate,
    copy,
    clone,
    multiply,
    mul,
    divide,
    div,
    random,
    zero,
    transformMat4,
    transformMat4Upper3x3,
    transformMat3,
    transformQuat,
    getTranslation,
    getAxis,
    getScaling,
    rotateX,
    rotateY,
    rotateZ,
    setLength,
    truncate,
    midpoint
  };
}
var cache$3 = /* @__PURE__ */ new Map();
function getAPI$3(Ctor) {
  let api = cache$3.get(Ctor);
  if (!api) {
    api = getAPIImpl$3(Ctor);
    cache$3.set(Ctor, api);
  }
  return api;
}
function getAPIImpl$2(Ctor) {
  const vec33 = getAPI$3(Ctor);
  function create(v0, v1, v2, v3, v4, v5, v6, v7, v8, v9, v10, v11, v12, v13, v14, v15) {
    const newDst = new Ctor(16);
    if (v0 !== void 0) {
      newDst[0] = v0;
      if (v1 !== void 0) {
        newDst[1] = v1;
        if (v2 !== void 0) {
          newDst[2] = v2;
          if (v3 !== void 0) {
            newDst[3] = v3;
            if (v4 !== void 0) {
              newDst[4] = v4;
              if (v5 !== void 0) {
                newDst[5] = v5;
                if (v6 !== void 0) {
                  newDst[6] = v6;
                  if (v7 !== void 0) {
                    newDst[7] = v7;
                    if (v8 !== void 0) {
                      newDst[8] = v8;
                      if (v9 !== void 0) {
                        newDst[9] = v9;
                        if (v10 !== void 0) {
                          newDst[10] = v10;
                          if (v11 !== void 0) {
                            newDst[11] = v11;
                            if (v12 !== void 0) {
                              newDst[12] = v12;
                              if (v13 !== void 0) {
                                newDst[13] = v13;
                                if (v14 !== void 0) {
                                  newDst[14] = v14;
                                  if (v15 !== void 0) {
                                    newDst[15] = v15;
                                  }
                                }
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
    return newDst;
  }
  function set(v0, v1, v2, v3, v4, v5, v6, v7, v8, v9, v10, v11, v12, v13, v14, v15, dst) {
    const newDst = dst ?? new Ctor(16);
    newDst[0] = v0;
    newDst[1] = v1;
    newDst[2] = v2;
    newDst[3] = v3;
    newDst[4] = v4;
    newDst[5] = v5;
    newDst[6] = v6;
    newDst[7] = v7;
    newDst[8] = v8;
    newDst[9] = v9;
    newDst[10] = v10;
    newDst[11] = v11;
    newDst[12] = v12;
    newDst[13] = v13;
    newDst[14] = v14;
    newDst[15] = v15;
    return newDst;
  }
  function fromMat3(m3, dst) {
    const newDst = dst ?? new Ctor(16);
    newDst[0] = m3[0];
    newDst[1] = m3[1];
    newDst[2] = m3[2];
    newDst[3] = 0;
    newDst[4] = m3[4];
    newDst[5] = m3[5];
    newDst[6] = m3[6];
    newDst[7] = 0;
    newDst[8] = m3[8];
    newDst[9] = m3[9];
    newDst[10] = m3[10];
    newDst[11] = 0;
    newDst[12] = 0;
    newDst[13] = 0;
    newDst[14] = 0;
    newDst[15] = 1;
    return newDst;
  }
  function fromQuat(q, dst) {
    const newDst = dst ?? new Ctor(16);
    const x = q[0];
    const y = q[1];
    const z = q[2];
    const w = q[3];
    const x2 = x + x;
    const y2 = y + y;
    const z2 = z + z;
    const xx = x * x2;
    const yx = y * x2;
    const yy = y * y2;
    const zx = z * x2;
    const zy = z * y2;
    const zz = z * z2;
    const wx = w * x2;
    const wy = w * y2;
    const wz = w * z2;
    newDst[0] = 1 - yy - zz;
    newDst[1] = yx + wz;
    newDst[2] = zx - wy;
    newDst[3] = 0;
    newDst[4] = yx - wz;
    newDst[5] = 1 - xx - zz;
    newDst[6] = zy + wx;
    newDst[7] = 0;
    newDst[8] = zx + wy;
    newDst[9] = zy - wx;
    newDst[10] = 1 - xx - yy;
    newDst[11] = 0;
    newDst[12] = 0;
    newDst[13] = 0;
    newDst[14] = 0;
    newDst[15] = 1;
    return newDst;
  }
  function negate(m, dst) {
    const newDst = dst ?? new Ctor(16);
    newDst[0] = -m[0];
    newDst[1] = -m[1];
    newDst[2] = -m[2];
    newDst[3] = -m[3];
    newDst[4] = -m[4];
    newDst[5] = -m[5];
    newDst[6] = -m[6];
    newDst[7] = -m[7];
    newDst[8] = -m[8];
    newDst[9] = -m[9];
    newDst[10] = -m[10];
    newDst[11] = -m[11];
    newDst[12] = -m[12];
    newDst[13] = -m[13];
    newDst[14] = -m[14];
    newDst[15] = -m[15];
    return newDst;
  }
  function copy(m, dst) {
    const newDst = dst ?? new Ctor(16);
    newDst[0] = m[0];
    newDst[1] = m[1];
    newDst[2] = m[2];
    newDst[3] = m[3];
    newDst[4] = m[4];
    newDst[5] = m[5];
    newDst[6] = m[6];
    newDst[7] = m[7];
    newDst[8] = m[8];
    newDst[9] = m[9];
    newDst[10] = m[10];
    newDst[11] = m[11];
    newDst[12] = m[12];
    newDst[13] = m[13];
    newDst[14] = m[14];
    newDst[15] = m[15];
    return newDst;
  }
  const clone = copy;
  function equalsApproximately(a, b) {
    return Math.abs(a[0] - b[0]) < EPSILON && Math.abs(a[1] - b[1]) < EPSILON && Math.abs(a[2] - b[2]) < EPSILON && Math.abs(a[3] - b[3]) < EPSILON && Math.abs(a[4] - b[4]) < EPSILON && Math.abs(a[5] - b[5]) < EPSILON && Math.abs(a[6] - b[6]) < EPSILON && Math.abs(a[7] - b[7]) < EPSILON && Math.abs(a[8] - b[8]) < EPSILON && Math.abs(a[9] - b[9]) < EPSILON && Math.abs(a[10] - b[10]) < EPSILON && Math.abs(a[11] - b[11]) < EPSILON && Math.abs(a[12] - b[12]) < EPSILON && Math.abs(a[13] - b[13]) < EPSILON && Math.abs(a[14] - b[14]) < EPSILON && Math.abs(a[15] - b[15]) < EPSILON;
  }
  function equals(a, b) {
    return a[0] === b[0] && a[1] === b[1] && a[2] === b[2] && a[3] === b[3] && a[4] === b[4] && a[5] === b[5] && a[6] === b[6] && a[7] === b[7] && a[8] === b[8] && a[9] === b[9] && a[10] === b[10] && a[11] === b[11] && a[12] === b[12] && a[13] === b[13] && a[14] === b[14] && a[15] === b[15];
  }
  function identity(dst) {
    const newDst = dst ?? new Ctor(16);
    newDst[0] = 1;
    newDst[1] = 0;
    newDst[2] = 0;
    newDst[3] = 0;
    newDst[4] = 0;
    newDst[5] = 1;
    newDst[6] = 0;
    newDst[7] = 0;
    newDst[8] = 0;
    newDst[9] = 0;
    newDst[10] = 1;
    newDst[11] = 0;
    newDst[12] = 0;
    newDst[13] = 0;
    newDst[14] = 0;
    newDst[15] = 1;
    return newDst;
  }
  function transpose(m, dst) {
    const newDst = dst ?? new Ctor(16);
    if (newDst === m) {
      let t;
      t = m[1];
      m[1] = m[4];
      m[4] = t;
      t = m[2];
      m[2] = m[8];
      m[8] = t;
      t = m[3];
      m[3] = m[12];
      m[12] = t;
      t = m[6];
      m[6] = m[9];
      m[9] = t;
      t = m[7];
      m[7] = m[13];
      m[13] = t;
      t = m[11];
      m[11] = m[14];
      m[14] = t;
      return newDst;
    }
    const m00 = m[0 * 4 + 0];
    const m01 = m[0 * 4 + 1];
    const m02 = m[0 * 4 + 2];
    const m03 = m[0 * 4 + 3];
    const m10 = m[1 * 4 + 0];
    const m11 = m[1 * 4 + 1];
    const m12 = m[1 * 4 + 2];
    const m13 = m[1 * 4 + 3];
    const m20 = m[2 * 4 + 0];
    const m21 = m[2 * 4 + 1];
    const m22 = m[2 * 4 + 2];
    const m23 = m[2 * 4 + 3];
    const m30 = m[3 * 4 + 0];
    const m31 = m[3 * 4 + 1];
    const m32 = m[3 * 4 + 2];
    const m33 = m[3 * 4 + 3];
    newDst[0] = m00;
    newDst[1] = m10;
    newDst[2] = m20;
    newDst[3] = m30;
    newDst[4] = m01;
    newDst[5] = m11;
    newDst[6] = m21;
    newDst[7] = m31;
    newDst[8] = m02;
    newDst[9] = m12;
    newDst[10] = m22;
    newDst[11] = m32;
    newDst[12] = m03;
    newDst[13] = m13;
    newDst[14] = m23;
    newDst[15] = m33;
    return newDst;
  }
  function inverse(m, dst) {
    const newDst = dst ?? new Ctor(16);
    const m00 = m[0 * 4 + 0];
    const m01 = m[0 * 4 + 1];
    const m02 = m[0 * 4 + 2];
    const m03 = m[0 * 4 + 3];
    const m10 = m[1 * 4 + 0];
    const m11 = m[1 * 4 + 1];
    const m12 = m[1 * 4 + 2];
    const m13 = m[1 * 4 + 3];
    const m20 = m[2 * 4 + 0];
    const m21 = m[2 * 4 + 1];
    const m22 = m[2 * 4 + 2];
    const m23 = m[2 * 4 + 3];
    const m30 = m[3 * 4 + 0];
    const m31 = m[3 * 4 + 1];
    const m32 = m[3 * 4 + 2];
    const m33 = m[3 * 4 + 3];
    const tmp0 = m22 * m33;
    const tmp1 = m32 * m23;
    const tmp2 = m12 * m33;
    const tmp3 = m32 * m13;
    const tmp4 = m12 * m23;
    const tmp5 = m22 * m13;
    const tmp6 = m02 * m33;
    const tmp7 = m32 * m03;
    const tmp8 = m02 * m23;
    const tmp9 = m22 * m03;
    const tmp10 = m02 * m13;
    const tmp11 = m12 * m03;
    const tmp12 = m20 * m31;
    const tmp13 = m30 * m21;
    const tmp14 = m10 * m31;
    const tmp15 = m30 * m11;
    const tmp16 = m10 * m21;
    const tmp17 = m20 * m11;
    const tmp18 = m00 * m31;
    const tmp19 = m30 * m01;
    const tmp20 = m00 * m21;
    const tmp21 = m20 * m01;
    const tmp22 = m00 * m11;
    const tmp23 = m10 * m01;
    const t0 = tmp0 * m11 + tmp3 * m21 + tmp4 * m31 - (tmp1 * m11 + tmp2 * m21 + tmp5 * m31);
    const t1 = tmp1 * m01 + tmp6 * m21 + tmp9 * m31 - (tmp0 * m01 + tmp7 * m21 + tmp8 * m31);
    const t2 = tmp2 * m01 + tmp7 * m11 + tmp10 * m31 - (tmp3 * m01 + tmp6 * m11 + tmp11 * m31);
    const t3 = tmp5 * m01 + tmp8 * m11 + tmp11 * m21 - (tmp4 * m01 + tmp9 * m11 + tmp10 * m21);
    const d = 1 / (m00 * t0 + m10 * t1 + m20 * t2 + m30 * t3);
    newDst[0] = d * t0;
    newDst[1] = d * t1;
    newDst[2] = d * t2;
    newDst[3] = d * t3;
    newDst[4] = d * (tmp1 * m10 + tmp2 * m20 + tmp5 * m30 - (tmp0 * m10 + tmp3 * m20 + tmp4 * m30));
    newDst[5] = d * (tmp0 * m00 + tmp7 * m20 + tmp8 * m30 - (tmp1 * m00 + tmp6 * m20 + tmp9 * m30));
    newDst[6] = d * (tmp3 * m00 + tmp6 * m10 + tmp11 * m30 - (tmp2 * m00 + tmp7 * m10 + tmp10 * m30));
    newDst[7] = d * (tmp4 * m00 + tmp9 * m10 + tmp10 * m20 - (tmp5 * m00 + tmp8 * m10 + tmp11 * m20));
    newDst[8] = d * (tmp12 * m13 + tmp15 * m23 + tmp16 * m33 - (tmp13 * m13 + tmp14 * m23 + tmp17 * m33));
    newDst[9] = d * (tmp13 * m03 + tmp18 * m23 + tmp21 * m33 - (tmp12 * m03 + tmp19 * m23 + tmp20 * m33));
    newDst[10] = d * (tmp14 * m03 + tmp19 * m13 + tmp22 * m33 - (tmp15 * m03 + tmp18 * m13 + tmp23 * m33));
    newDst[11] = d * (tmp17 * m03 + tmp20 * m13 + tmp23 * m23 - (tmp16 * m03 + tmp21 * m13 + tmp22 * m23));
    newDst[12] = d * (tmp14 * m22 + tmp17 * m32 + tmp13 * m12 - (tmp16 * m32 + tmp12 * m12 + tmp15 * m22));
    newDst[13] = d * (tmp20 * m32 + tmp12 * m02 + tmp19 * m22 - (tmp18 * m22 + tmp21 * m32 + tmp13 * m02));
    newDst[14] = d * (tmp18 * m12 + tmp23 * m32 + tmp15 * m02 - (tmp22 * m32 + tmp14 * m02 + tmp19 * m12));
    newDst[15] = d * (tmp22 * m22 + tmp16 * m02 + tmp21 * m12 - (tmp20 * m12 + tmp23 * m22 + tmp17 * m02));
    return newDst;
  }
  function determinant(m) {
    const m00 = m[0 * 4 + 0];
    const m01 = m[0 * 4 + 1];
    const m02 = m[0 * 4 + 2];
    const m03 = m[0 * 4 + 3];
    const m10 = m[1 * 4 + 0];
    const m11 = m[1 * 4 + 1];
    const m12 = m[1 * 4 + 2];
    const m13 = m[1 * 4 + 3];
    const m20 = m[2 * 4 + 0];
    const m21 = m[2 * 4 + 1];
    const m22 = m[2 * 4 + 2];
    const m23 = m[2 * 4 + 3];
    const m30 = m[3 * 4 + 0];
    const m31 = m[3 * 4 + 1];
    const m32 = m[3 * 4 + 2];
    const m33 = m[3 * 4 + 3];
    const tmp0 = m22 * m33;
    const tmp1 = m32 * m23;
    const tmp2 = m12 * m33;
    const tmp3 = m32 * m13;
    const tmp4 = m12 * m23;
    const tmp5 = m22 * m13;
    const tmp6 = m02 * m33;
    const tmp7 = m32 * m03;
    const tmp8 = m02 * m23;
    const tmp9 = m22 * m03;
    const tmp10 = m02 * m13;
    const tmp11 = m12 * m03;
    const t0 = tmp0 * m11 + tmp3 * m21 + tmp4 * m31 - (tmp1 * m11 + tmp2 * m21 + tmp5 * m31);
    const t1 = tmp1 * m01 + tmp6 * m21 + tmp9 * m31 - (tmp0 * m01 + tmp7 * m21 + tmp8 * m31);
    const t2 = tmp2 * m01 + tmp7 * m11 + tmp10 * m31 - (tmp3 * m01 + tmp6 * m11 + tmp11 * m31);
    const t3 = tmp5 * m01 + tmp8 * m11 + tmp11 * m21 - (tmp4 * m01 + tmp9 * m11 + tmp10 * m21);
    return m00 * t0 + m10 * t1 + m20 * t2 + m30 * t3;
  }
  const invert = inverse;
  function multiply(a, b, dst) {
    const newDst = dst ?? new Ctor(16);
    const a00 = a[0];
    const a01 = a[1];
    const a02 = a[2];
    const a03 = a[3];
    const a10 = a[4 + 0];
    const a11 = a[4 + 1];
    const a12 = a[4 + 2];
    const a13 = a[4 + 3];
    const a20 = a[8 + 0];
    const a21 = a[8 + 1];
    const a22 = a[8 + 2];
    const a23 = a[8 + 3];
    const a30 = a[12 + 0];
    const a31 = a[12 + 1];
    const a32 = a[12 + 2];
    const a33 = a[12 + 3];
    const b00 = b[0];
    const b01 = b[1];
    const b02 = b[2];
    const b03 = b[3];
    const b10 = b[4 + 0];
    const b11 = b[4 + 1];
    const b12 = b[4 + 2];
    const b13 = b[4 + 3];
    const b20 = b[8 + 0];
    const b21 = b[8 + 1];
    const b22 = b[8 + 2];
    const b23 = b[8 + 3];
    const b30 = b[12 + 0];
    const b31 = b[12 + 1];
    const b32 = b[12 + 2];
    const b33 = b[12 + 3];
    newDst[0] = a00 * b00 + a10 * b01 + a20 * b02 + a30 * b03;
    newDst[1] = a01 * b00 + a11 * b01 + a21 * b02 + a31 * b03;
    newDst[2] = a02 * b00 + a12 * b01 + a22 * b02 + a32 * b03;
    newDst[3] = a03 * b00 + a13 * b01 + a23 * b02 + a33 * b03;
    newDst[4] = a00 * b10 + a10 * b11 + a20 * b12 + a30 * b13;
    newDst[5] = a01 * b10 + a11 * b11 + a21 * b12 + a31 * b13;
    newDst[6] = a02 * b10 + a12 * b11 + a22 * b12 + a32 * b13;
    newDst[7] = a03 * b10 + a13 * b11 + a23 * b12 + a33 * b13;
    newDst[8] = a00 * b20 + a10 * b21 + a20 * b22 + a30 * b23;
    newDst[9] = a01 * b20 + a11 * b21 + a21 * b22 + a31 * b23;
    newDst[10] = a02 * b20 + a12 * b21 + a22 * b22 + a32 * b23;
    newDst[11] = a03 * b20 + a13 * b21 + a23 * b22 + a33 * b23;
    newDst[12] = a00 * b30 + a10 * b31 + a20 * b32 + a30 * b33;
    newDst[13] = a01 * b30 + a11 * b31 + a21 * b32 + a31 * b33;
    newDst[14] = a02 * b30 + a12 * b31 + a22 * b32 + a32 * b33;
    newDst[15] = a03 * b30 + a13 * b31 + a23 * b32 + a33 * b33;
    return newDst;
  }
  const mul = multiply;
  function setTranslation(a, v, dst) {
    const newDst = dst ?? identity();
    if (a !== newDst) {
      newDst[0] = a[0];
      newDst[1] = a[1];
      newDst[2] = a[2];
      newDst[3] = a[3];
      newDst[4] = a[4];
      newDst[5] = a[5];
      newDst[6] = a[6];
      newDst[7] = a[7];
      newDst[8] = a[8];
      newDst[9] = a[9];
      newDst[10] = a[10];
      newDst[11] = a[11];
    }
    newDst[12] = v[0];
    newDst[13] = v[1];
    newDst[14] = v[2];
    newDst[15] = 1;
    return newDst;
  }
  function getTranslation(m, dst) {
    const newDst = dst ?? vec33.create();
    newDst[0] = m[12];
    newDst[1] = m[13];
    newDst[2] = m[14];
    return newDst;
  }
  function getAxis(m, axis, dst) {
    const newDst = dst ?? vec33.create();
    const off = axis * 4;
    newDst[0] = m[off + 0];
    newDst[1] = m[off + 1];
    newDst[2] = m[off + 2];
    return newDst;
  }
  function setAxis(m, v, axis, dst) {
    const newDst = dst === m ? dst : copy(m, dst);
    const off = axis * 4;
    newDst[off + 0] = v[0];
    newDst[off + 1] = v[1];
    newDst[off + 2] = v[2];
    return newDst;
  }
  function getScaling(m, dst) {
    const newDst = dst ?? vec33.create();
    const xx = m[0];
    const xy = m[1];
    const xz = m[2];
    const yx = m[4];
    const yy = m[5];
    const yz = m[6];
    const zx = m[8];
    const zy = m[9];
    const zz = m[10];
    newDst[0] = Math.sqrt(xx * xx + xy * xy + xz * xz);
    newDst[1] = Math.sqrt(yx * yx + yy * yy + yz * yz);
    newDst[2] = Math.sqrt(zx * zx + zy * zy + zz * zz);
    return newDst;
  }
  function perspective(fieldOfViewYInRadians, aspect, zNear, zFar, dst) {
    const newDst = dst ?? new Ctor(16);
    const f = Math.tan(Math.PI * 0.5 - 0.5 * fieldOfViewYInRadians);
    newDst[0] = f / aspect;
    newDst[1] = 0;
    newDst[2] = 0;
    newDst[3] = 0;
    newDst[4] = 0;
    newDst[5] = f;
    newDst[6] = 0;
    newDst[7] = 0;
    newDst[8] = 0;
    newDst[9] = 0;
    newDst[11] = -1;
    newDst[12] = 0;
    newDst[13] = 0;
    newDst[15] = 0;
    if (Number.isFinite(zFar)) {
      const rangeInv = 1 / (zNear - zFar);
      newDst[10] = zFar * rangeInv;
      newDst[14] = zFar * zNear * rangeInv;
    } else {
      newDst[10] = -1;
      newDst[14] = -zNear;
    }
    return newDst;
  }
  function perspectiveReverseZ(fieldOfViewYInRadians, aspect, zNear, zFar = Infinity, dst) {
    const newDst = dst ?? new Ctor(16);
    const f = 1 / Math.tan(fieldOfViewYInRadians * 0.5);
    newDst[0] = f / aspect;
    newDst[1] = 0;
    newDst[2] = 0;
    newDst[3] = 0;
    newDst[4] = 0;
    newDst[5] = f;
    newDst[6] = 0;
    newDst[7] = 0;
    newDst[8] = 0;
    newDst[9] = 0;
    newDst[11] = -1;
    newDst[12] = 0;
    newDst[13] = 0;
    newDst[15] = 0;
    if (zFar === Infinity) {
      newDst[10] = 0;
      newDst[14] = zNear;
    } else {
      const rangeInv = 1 / (zFar - zNear);
      newDst[10] = zNear * rangeInv;
      newDst[14] = zFar * zNear * rangeInv;
    }
    return newDst;
  }
  function ortho(left, right, bottom, top, near, far, dst) {
    const newDst = dst ?? new Ctor(16);
    newDst[0] = 2 / (right - left);
    newDst[1] = 0;
    newDst[2] = 0;
    newDst[3] = 0;
    newDst[4] = 0;
    newDst[5] = 2 / (top - bottom);
    newDst[6] = 0;
    newDst[7] = 0;
    newDst[8] = 0;
    newDst[9] = 0;
    newDst[10] = 1 / (near - far);
    newDst[11] = 0;
    newDst[12] = (right + left) / (left - right);
    newDst[13] = (top + bottom) / (bottom - top);
    newDst[14] = near / (near - far);
    newDst[15] = 1;
    return newDst;
  }
  function frustum(left, right, bottom, top, near, far, dst) {
    const newDst = dst ?? new Ctor(16);
    const dx = right - left;
    const dy = top - bottom;
    const dz = near - far;
    newDst[0] = 2 * near / dx;
    newDst[1] = 0;
    newDst[2] = 0;
    newDst[3] = 0;
    newDst[4] = 0;
    newDst[5] = 2 * near / dy;
    newDst[6] = 0;
    newDst[7] = 0;
    newDst[8] = (left + right) / dx;
    newDst[9] = (top + bottom) / dy;
    newDst[10] = far / dz;
    newDst[11] = -1;
    newDst[12] = 0;
    newDst[13] = 0;
    newDst[14] = near * far / dz;
    newDst[15] = 0;
    return newDst;
  }
  function frustumReverseZ(left, right, bottom, top, near, far = Infinity, dst) {
    const newDst = dst ?? new Ctor(16);
    const dx = right - left;
    const dy = top - bottom;
    newDst[0] = 2 * near / dx;
    newDst[1] = 0;
    newDst[2] = 0;
    newDst[3] = 0;
    newDst[4] = 0;
    newDst[5] = 2 * near / dy;
    newDst[6] = 0;
    newDst[7] = 0;
    newDst[8] = (left + right) / dx;
    newDst[9] = (top + bottom) / dy;
    newDst[11] = -1;
    newDst[12] = 0;
    newDst[13] = 0;
    newDst[15] = 0;
    if (far === Infinity) {
      newDst[10] = 0;
      newDst[14] = near;
    } else {
      const rangeInv = 1 / (far - near);
      newDst[10] = near * rangeInv;
      newDst[14] = far * near * rangeInv;
    }
    return newDst;
  }
  const xAxis = vec33.create();
  const yAxis = vec33.create();
  const zAxis = vec33.create();
  function aim(position, target, up, dst) {
    const newDst = dst ?? new Ctor(16);
    vec33.normalize(vec33.subtract(target, position, zAxis), zAxis);
    vec33.normalize(vec33.cross(up, zAxis, xAxis), xAxis);
    vec33.normalize(vec33.cross(zAxis, xAxis, yAxis), yAxis);
    newDst[0] = xAxis[0];
    newDst[1] = xAxis[1];
    newDst[2] = xAxis[2];
    newDst[3] = 0;
    newDst[4] = yAxis[0];
    newDst[5] = yAxis[1];
    newDst[6] = yAxis[2];
    newDst[7] = 0;
    newDst[8] = zAxis[0];
    newDst[9] = zAxis[1];
    newDst[10] = zAxis[2];
    newDst[11] = 0;
    newDst[12] = position[0];
    newDst[13] = position[1];
    newDst[14] = position[2];
    newDst[15] = 1;
    return newDst;
  }
  function cameraAim(eye, target, up, dst) {
    const newDst = dst ?? new Ctor(16);
    vec33.normalize(vec33.subtract(eye, target, zAxis), zAxis);
    vec33.normalize(vec33.cross(up, zAxis, xAxis), xAxis);
    vec33.normalize(vec33.cross(zAxis, xAxis, yAxis), yAxis);
    newDst[0] = xAxis[0];
    newDst[1] = xAxis[1];
    newDst[2] = xAxis[2];
    newDst[3] = 0;
    newDst[4] = yAxis[0];
    newDst[5] = yAxis[1];
    newDst[6] = yAxis[2];
    newDst[7] = 0;
    newDst[8] = zAxis[0];
    newDst[9] = zAxis[1];
    newDst[10] = zAxis[2];
    newDst[11] = 0;
    newDst[12] = eye[0];
    newDst[13] = eye[1];
    newDst[14] = eye[2];
    newDst[15] = 1;
    return newDst;
  }
  function lookAt(eye, target, up, dst) {
    const newDst = dst ?? new Ctor(16);
    vec33.normalize(vec33.subtract(eye, target, zAxis), zAxis);
    vec33.normalize(vec33.cross(up, zAxis, xAxis), xAxis);
    vec33.normalize(vec33.cross(zAxis, xAxis, yAxis), yAxis);
    newDst[0] = xAxis[0];
    newDst[1] = yAxis[0];
    newDst[2] = zAxis[0];
    newDst[3] = 0;
    newDst[4] = xAxis[1];
    newDst[5] = yAxis[1];
    newDst[6] = zAxis[1];
    newDst[7] = 0;
    newDst[8] = xAxis[2];
    newDst[9] = yAxis[2];
    newDst[10] = zAxis[2];
    newDst[11] = 0;
    newDst[12] = -(xAxis[0] * eye[0] + xAxis[1] * eye[1] + xAxis[2] * eye[2]);
    newDst[13] = -(yAxis[0] * eye[0] + yAxis[1] * eye[1] + yAxis[2] * eye[2]);
    newDst[14] = -(zAxis[0] * eye[0] + zAxis[1] * eye[1] + zAxis[2] * eye[2]);
    newDst[15] = 1;
    return newDst;
  }
  function translation(v, dst) {
    const newDst = dst ?? new Ctor(16);
    newDst[0] = 1;
    newDst[1] = 0;
    newDst[2] = 0;
    newDst[3] = 0;
    newDst[4] = 0;
    newDst[5] = 1;
    newDst[6] = 0;
    newDst[7] = 0;
    newDst[8] = 0;
    newDst[9] = 0;
    newDst[10] = 1;
    newDst[11] = 0;
    newDst[12] = v[0];
    newDst[13] = v[1];
    newDst[14] = v[2];
    newDst[15] = 1;
    return newDst;
  }
  function translate(m, v, dst) {
    const newDst = dst ?? new Ctor(16);
    const v0 = v[0];
    const v1 = v[1];
    const v2 = v[2];
    const m00 = m[0];
    const m01 = m[1];
    const m02 = m[2];
    const m03 = m[3];
    const m10 = m[1 * 4 + 0];
    const m11 = m[1 * 4 + 1];
    const m12 = m[1 * 4 + 2];
    const m13 = m[1 * 4 + 3];
    const m20 = m[2 * 4 + 0];
    const m21 = m[2 * 4 + 1];
    const m22 = m[2 * 4 + 2];
    const m23 = m[2 * 4 + 3];
    const m30 = m[3 * 4 + 0];
    const m31 = m[3 * 4 + 1];
    const m32 = m[3 * 4 + 2];
    const m33 = m[3 * 4 + 3];
    if (m !== newDst) {
      newDst[0] = m00;
      newDst[1] = m01;
      newDst[2] = m02;
      newDst[3] = m03;
      newDst[4] = m10;
      newDst[5] = m11;
      newDst[6] = m12;
      newDst[7] = m13;
      newDst[8] = m20;
      newDst[9] = m21;
      newDst[10] = m22;
      newDst[11] = m23;
    }
    newDst[12] = m00 * v0 + m10 * v1 + m20 * v2 + m30;
    newDst[13] = m01 * v0 + m11 * v1 + m21 * v2 + m31;
    newDst[14] = m02 * v0 + m12 * v1 + m22 * v2 + m32;
    newDst[15] = m03 * v0 + m13 * v1 + m23 * v2 + m33;
    return newDst;
  }
  function rotationX(angleInRadians, dst) {
    const newDst = dst ?? new Ctor(16);
    const c = Math.cos(angleInRadians);
    const s = Math.sin(angleInRadians);
    newDst[0] = 1;
    newDst[1] = 0;
    newDst[2] = 0;
    newDst[3] = 0;
    newDst[4] = 0;
    newDst[5] = c;
    newDst[6] = s;
    newDst[7] = 0;
    newDst[8] = 0;
    newDst[9] = -s;
    newDst[10] = c;
    newDst[11] = 0;
    newDst[12] = 0;
    newDst[13] = 0;
    newDst[14] = 0;
    newDst[15] = 1;
    return newDst;
  }
  function rotateX(m, angleInRadians, dst) {
    const newDst = dst ?? new Ctor(16);
    const m10 = m[4];
    const m11 = m[5];
    const m12 = m[6];
    const m13 = m[7];
    const m20 = m[8];
    const m21 = m[9];
    const m22 = m[10];
    const m23 = m[11];
    const c = Math.cos(angleInRadians);
    const s = Math.sin(angleInRadians);
    newDst[4] = c * m10 + s * m20;
    newDst[5] = c * m11 + s * m21;
    newDst[6] = c * m12 + s * m22;
    newDst[7] = c * m13 + s * m23;
    newDst[8] = c * m20 - s * m10;
    newDst[9] = c * m21 - s * m11;
    newDst[10] = c * m22 - s * m12;
    newDst[11] = c * m23 - s * m13;
    if (m !== newDst) {
      newDst[0] = m[0];
      newDst[1] = m[1];
      newDst[2] = m[2];
      newDst[3] = m[3];
      newDst[12] = m[12];
      newDst[13] = m[13];
      newDst[14] = m[14];
      newDst[15] = m[15];
    }
    return newDst;
  }
  function rotationY(angleInRadians, dst) {
    const newDst = dst ?? new Ctor(16);
    const c = Math.cos(angleInRadians);
    const s = Math.sin(angleInRadians);
    newDst[0] = c;
    newDst[1] = 0;
    newDst[2] = -s;
    newDst[3] = 0;
    newDst[4] = 0;
    newDst[5] = 1;
    newDst[6] = 0;
    newDst[7] = 0;
    newDst[8] = s;
    newDst[9] = 0;
    newDst[10] = c;
    newDst[11] = 0;
    newDst[12] = 0;
    newDst[13] = 0;
    newDst[14] = 0;
    newDst[15] = 1;
    return newDst;
  }
  function rotateY(m, angleInRadians, dst) {
    const newDst = dst ?? new Ctor(16);
    const m00 = m[0 * 4 + 0];
    const m01 = m[0 * 4 + 1];
    const m02 = m[0 * 4 + 2];
    const m03 = m[0 * 4 + 3];
    const m20 = m[2 * 4 + 0];
    const m21 = m[2 * 4 + 1];
    const m22 = m[2 * 4 + 2];
    const m23 = m[2 * 4 + 3];
    const c = Math.cos(angleInRadians);
    const s = Math.sin(angleInRadians);
    newDst[0] = c * m00 - s * m20;
    newDst[1] = c * m01 - s * m21;
    newDst[2] = c * m02 - s * m22;
    newDst[3] = c * m03 - s * m23;
    newDst[8] = c * m20 + s * m00;
    newDst[9] = c * m21 + s * m01;
    newDst[10] = c * m22 + s * m02;
    newDst[11] = c * m23 + s * m03;
    if (m !== newDst) {
      newDst[4] = m[4];
      newDst[5] = m[5];
      newDst[6] = m[6];
      newDst[7] = m[7];
      newDst[12] = m[12];
      newDst[13] = m[13];
      newDst[14] = m[14];
      newDst[15] = m[15];
    }
    return newDst;
  }
  function rotationZ(angleInRadians, dst) {
    const newDst = dst ?? new Ctor(16);
    const c = Math.cos(angleInRadians);
    const s = Math.sin(angleInRadians);
    newDst[0] = c;
    newDst[1] = s;
    newDst[2] = 0;
    newDst[3] = 0;
    newDst[4] = -s;
    newDst[5] = c;
    newDst[6] = 0;
    newDst[7] = 0;
    newDst[8] = 0;
    newDst[9] = 0;
    newDst[10] = 1;
    newDst[11] = 0;
    newDst[12] = 0;
    newDst[13] = 0;
    newDst[14] = 0;
    newDst[15] = 1;
    return newDst;
  }
  function rotateZ(m, angleInRadians, dst) {
    const newDst = dst ?? new Ctor(16);
    const m00 = m[0 * 4 + 0];
    const m01 = m[0 * 4 + 1];
    const m02 = m[0 * 4 + 2];
    const m03 = m[0 * 4 + 3];
    const m10 = m[1 * 4 + 0];
    const m11 = m[1 * 4 + 1];
    const m12 = m[1 * 4 + 2];
    const m13 = m[1 * 4 + 3];
    const c = Math.cos(angleInRadians);
    const s = Math.sin(angleInRadians);
    newDst[0] = c * m00 + s * m10;
    newDst[1] = c * m01 + s * m11;
    newDst[2] = c * m02 + s * m12;
    newDst[3] = c * m03 + s * m13;
    newDst[4] = c * m10 - s * m00;
    newDst[5] = c * m11 - s * m01;
    newDst[6] = c * m12 - s * m02;
    newDst[7] = c * m13 - s * m03;
    if (m !== newDst) {
      newDst[8] = m[8];
      newDst[9] = m[9];
      newDst[10] = m[10];
      newDst[11] = m[11];
      newDst[12] = m[12];
      newDst[13] = m[13];
      newDst[14] = m[14];
      newDst[15] = m[15];
    }
    return newDst;
  }
  function axisRotation(axis, angleInRadians, dst) {
    const newDst = dst ?? new Ctor(16);
    let x = axis[0];
    let y = axis[1];
    let z = axis[2];
    const n = Math.sqrt(x * x + y * y + z * z);
    x /= n;
    y /= n;
    z /= n;
    const xx = x * x;
    const yy = y * y;
    const zz = z * z;
    const c = Math.cos(angleInRadians);
    const s = Math.sin(angleInRadians);
    const oneMinusCosine = 1 - c;
    newDst[0] = xx + (1 - xx) * c;
    newDst[1] = x * y * oneMinusCosine + z * s;
    newDst[2] = x * z * oneMinusCosine - y * s;
    newDst[3] = 0;
    newDst[4] = x * y * oneMinusCosine - z * s;
    newDst[5] = yy + (1 - yy) * c;
    newDst[6] = y * z * oneMinusCosine + x * s;
    newDst[7] = 0;
    newDst[8] = x * z * oneMinusCosine + y * s;
    newDst[9] = y * z * oneMinusCosine - x * s;
    newDst[10] = zz + (1 - zz) * c;
    newDst[11] = 0;
    newDst[12] = 0;
    newDst[13] = 0;
    newDst[14] = 0;
    newDst[15] = 1;
    return newDst;
  }
  const rotation = axisRotation;
  function axisRotate(m, axis, angleInRadians, dst) {
    const newDst = dst ?? new Ctor(16);
    let x = axis[0];
    let y = axis[1];
    let z = axis[2];
    const n = Math.sqrt(x * x + y * y + z * z);
    x /= n;
    y /= n;
    z /= n;
    const xx = x * x;
    const yy = y * y;
    const zz = z * z;
    const c = Math.cos(angleInRadians);
    const s = Math.sin(angleInRadians);
    const oneMinusCosine = 1 - c;
    const r00 = xx + (1 - xx) * c;
    const r01 = x * y * oneMinusCosine + z * s;
    const r02 = x * z * oneMinusCosine - y * s;
    const r10 = x * y * oneMinusCosine - z * s;
    const r11 = yy + (1 - yy) * c;
    const r12 = y * z * oneMinusCosine + x * s;
    const r20 = x * z * oneMinusCosine + y * s;
    const r21 = y * z * oneMinusCosine - x * s;
    const r22 = zz + (1 - zz) * c;
    const m00 = m[0];
    const m01 = m[1];
    const m02 = m[2];
    const m03 = m[3];
    const m10 = m[4];
    const m11 = m[5];
    const m12 = m[6];
    const m13 = m[7];
    const m20 = m[8];
    const m21 = m[9];
    const m22 = m[10];
    const m23 = m[11];
    newDst[0] = r00 * m00 + r01 * m10 + r02 * m20;
    newDst[1] = r00 * m01 + r01 * m11 + r02 * m21;
    newDst[2] = r00 * m02 + r01 * m12 + r02 * m22;
    newDst[3] = r00 * m03 + r01 * m13 + r02 * m23;
    newDst[4] = r10 * m00 + r11 * m10 + r12 * m20;
    newDst[5] = r10 * m01 + r11 * m11 + r12 * m21;
    newDst[6] = r10 * m02 + r11 * m12 + r12 * m22;
    newDst[7] = r10 * m03 + r11 * m13 + r12 * m23;
    newDst[8] = r20 * m00 + r21 * m10 + r22 * m20;
    newDst[9] = r20 * m01 + r21 * m11 + r22 * m21;
    newDst[10] = r20 * m02 + r21 * m12 + r22 * m22;
    newDst[11] = r20 * m03 + r21 * m13 + r22 * m23;
    if (m !== newDst) {
      newDst[12] = m[12];
      newDst[13] = m[13];
      newDst[14] = m[14];
      newDst[15] = m[15];
    }
    return newDst;
  }
  const rotate = axisRotate;
  function scaling(v, dst) {
    const newDst = dst ?? new Ctor(16);
    newDst[0] = v[0];
    newDst[1] = 0;
    newDst[2] = 0;
    newDst[3] = 0;
    newDst[4] = 0;
    newDst[5] = v[1];
    newDst[6] = 0;
    newDst[7] = 0;
    newDst[8] = 0;
    newDst[9] = 0;
    newDst[10] = v[2];
    newDst[11] = 0;
    newDst[12] = 0;
    newDst[13] = 0;
    newDst[14] = 0;
    newDst[15] = 1;
    return newDst;
  }
  function scale(m, v, dst) {
    const newDst = dst ?? new Ctor(16);
    const v0 = v[0];
    const v1 = v[1];
    const v2 = v[2];
    newDst[0] = v0 * m[0 * 4 + 0];
    newDst[1] = v0 * m[0 * 4 + 1];
    newDst[2] = v0 * m[0 * 4 + 2];
    newDst[3] = v0 * m[0 * 4 + 3];
    newDst[4] = v1 * m[1 * 4 + 0];
    newDst[5] = v1 * m[1 * 4 + 1];
    newDst[6] = v1 * m[1 * 4 + 2];
    newDst[7] = v1 * m[1 * 4 + 3];
    newDst[8] = v2 * m[2 * 4 + 0];
    newDst[9] = v2 * m[2 * 4 + 1];
    newDst[10] = v2 * m[2 * 4 + 2];
    newDst[11] = v2 * m[2 * 4 + 3];
    if (m !== newDst) {
      newDst[12] = m[12];
      newDst[13] = m[13];
      newDst[14] = m[14];
      newDst[15] = m[15];
    }
    return newDst;
  }
  function uniformScaling(s, dst) {
    const newDst = dst ?? new Ctor(16);
    newDst[0] = s;
    newDst[1] = 0;
    newDst[2] = 0;
    newDst[3] = 0;
    newDst[4] = 0;
    newDst[5] = s;
    newDst[6] = 0;
    newDst[7] = 0;
    newDst[8] = 0;
    newDst[9] = 0;
    newDst[10] = s;
    newDst[11] = 0;
    newDst[12] = 0;
    newDst[13] = 0;
    newDst[14] = 0;
    newDst[15] = 1;
    return newDst;
  }
  function uniformScale(m, s, dst) {
    const newDst = dst ?? new Ctor(16);
    newDst[0] = s * m[0 * 4 + 0];
    newDst[1] = s * m[0 * 4 + 1];
    newDst[2] = s * m[0 * 4 + 2];
    newDst[3] = s * m[0 * 4 + 3];
    newDst[4] = s * m[1 * 4 + 0];
    newDst[5] = s * m[1 * 4 + 1];
    newDst[6] = s * m[1 * 4 + 2];
    newDst[7] = s * m[1 * 4 + 3];
    newDst[8] = s * m[2 * 4 + 0];
    newDst[9] = s * m[2 * 4 + 1];
    newDst[10] = s * m[2 * 4 + 2];
    newDst[11] = s * m[2 * 4 + 3];
    if (m !== newDst) {
      newDst[12] = m[12];
      newDst[13] = m[13];
      newDst[14] = m[14];
      newDst[15] = m[15];
    }
    return newDst;
  }
  return {
    create,
    set,
    fromMat3,
    fromQuat,
    negate,
    copy,
    clone,
    equalsApproximately,
    equals,
    identity,
    transpose,
    inverse,
    determinant,
    invert,
    multiply,
    mul,
    setTranslation,
    getTranslation,
    getAxis,
    setAxis,
    getScaling,
    perspective,
    perspectiveReverseZ,
    ortho,
    frustum,
    frustumReverseZ,
    aim,
    cameraAim,
    lookAt,
    translation,
    translate,
    rotationX,
    rotateX,
    rotationY,
    rotateY,
    rotationZ,
    rotateZ,
    axisRotation,
    rotation,
    axisRotate,
    rotate,
    scaling,
    scale,
    uniformScaling,
    uniformScale
  };
}
var cache$2 = /* @__PURE__ */ new Map();
function getAPI$2(Ctor) {
  let api = cache$2.get(Ctor);
  if (!api) {
    api = getAPIImpl$2(Ctor);
    cache$2.set(Ctor, api);
  }
  return api;
}
function getAPIImpl$1(Ctor) {
  const vec33 = getAPI$3(Ctor);
  function create(x, y, z, w) {
    const newDst = new Ctor(4);
    if (x !== void 0) {
      newDst[0] = x;
      if (y !== void 0) {
        newDst[1] = y;
        if (z !== void 0) {
          newDst[2] = z;
          if (w !== void 0) {
            newDst[3] = w;
          }
        }
      }
    }
    return newDst;
  }
  const fromValues = create;
  function set(x, y, z, w, dst) {
    const newDst = dst ?? new Ctor(4);
    newDst[0] = x;
    newDst[1] = y;
    newDst[2] = z;
    newDst[3] = w;
    return newDst;
  }
  function fromAxisAngle(axis, angleInRadians, dst) {
    const newDst = dst ?? new Ctor(4);
    const halfAngle = angleInRadians * 0.5;
    const s = Math.sin(halfAngle);
    newDst[0] = s * axis[0];
    newDst[1] = s * axis[1];
    newDst[2] = s * axis[2];
    newDst[3] = Math.cos(halfAngle);
    return newDst;
  }
  function toAxisAngle(q, dst) {
    const newDst = dst ?? vec33.create(3);
    const angle2 = Math.acos(q[3]) * 2;
    const s = Math.sin(angle2 * 0.5);
    if (s > EPSILON) {
      newDst[0] = q[0] / s;
      newDst[1] = q[1] / s;
      newDst[2] = q[2] / s;
    } else {
      newDst[0] = 1;
      newDst[1] = 0;
      newDst[2] = 0;
    }
    return { angle: angle2, axis: newDst };
  }
  function angle(a, b) {
    const d = dot(a, b);
    return Math.acos(2 * d * d - 1);
  }
  function multiply(a, b, dst) {
    const newDst = dst ?? new Ctor(4);
    const ax = a[0];
    const ay = a[1];
    const az = a[2];
    const aw = a[3];
    const bx = b[0];
    const by = b[1];
    const bz = b[2];
    const bw = b[3];
    newDst[0] = ax * bw + aw * bx + ay * bz - az * by;
    newDst[1] = ay * bw + aw * by + az * bx - ax * bz;
    newDst[2] = az * bw + aw * bz + ax * by - ay * bx;
    newDst[3] = aw * bw - ax * bx - ay * by - az * bz;
    return newDst;
  }
  const mul = multiply;
  function rotateX(q, angleInRadians, dst) {
    const newDst = dst ?? new Ctor(4);
    const halfAngle = angleInRadians * 0.5;
    const qx = q[0];
    const qy = q[1];
    const qz = q[2];
    const qw = q[3];
    const bx = Math.sin(halfAngle);
    const bw = Math.cos(halfAngle);
    newDst[0] = qx * bw + qw * bx;
    newDst[1] = qy * bw + qz * bx;
    newDst[2] = qz * bw - qy * bx;
    newDst[3] = qw * bw - qx * bx;
    return newDst;
  }
  function rotateY(q, angleInRadians, dst) {
    const newDst = dst ?? new Ctor(4);
    const halfAngle = angleInRadians * 0.5;
    const qx = q[0];
    const qy = q[1];
    const qz = q[2];
    const qw = q[3];
    const by = Math.sin(halfAngle);
    const bw = Math.cos(halfAngle);
    newDst[0] = qx * bw - qz * by;
    newDst[1] = qy * bw + qw * by;
    newDst[2] = qz * bw + qx * by;
    newDst[3] = qw * bw - qy * by;
    return newDst;
  }
  function rotateZ(q, angleInRadians, dst) {
    const newDst = dst ?? new Ctor(4);
    const halfAngle = angleInRadians * 0.5;
    const qx = q[0];
    const qy = q[1];
    const qz = q[2];
    const qw = q[3];
    const bz = Math.sin(halfAngle);
    const bw = Math.cos(halfAngle);
    newDst[0] = qx * bw + qy * bz;
    newDst[1] = qy * bw - qx * bz;
    newDst[2] = qz * bw + qw * bz;
    newDst[3] = qw * bw - qz * bz;
    return newDst;
  }
  function slerp(a, b, t, dst) {
    const newDst = dst ?? new Ctor(4);
    const ax = a[0];
    const ay = a[1];
    const az = a[2];
    const aw = a[3];
    let bx = b[0];
    let by = b[1];
    let bz = b[2];
    let bw = b[3];
    let cosOmega = ax * bx + ay * by + az * bz + aw * bw;
    if (cosOmega < 0) {
      cosOmega = -cosOmega;
      bx = -bx;
      by = -by;
      bz = -bz;
      bw = -bw;
    }
    let scale0;
    let scale1;
    if (1 - cosOmega > EPSILON) {
      const omega = Math.acos(cosOmega);
      const sinOmega = Math.sin(omega);
      scale0 = Math.sin((1 - t) * omega) / sinOmega;
      scale1 = Math.sin(t * omega) / sinOmega;
    } else {
      scale0 = 1 - t;
      scale1 = t;
    }
    newDst[0] = scale0 * ax + scale1 * bx;
    newDst[1] = scale0 * ay + scale1 * by;
    newDst[2] = scale0 * az + scale1 * bz;
    newDst[3] = scale0 * aw + scale1 * bw;
    return newDst;
  }
  function inverse(q, dst) {
    const newDst = dst ?? new Ctor(4);
    const a0 = q[0];
    const a1 = q[1];
    const a2 = q[2];
    const a3 = q[3];
    const dot2 = a0 * a0 + a1 * a1 + a2 * a2 + a3 * a3;
    const invDot = dot2 ? 1 / dot2 : 0;
    newDst[0] = -a0 * invDot;
    newDst[1] = -a1 * invDot;
    newDst[2] = -a2 * invDot;
    newDst[3] = a3 * invDot;
    return newDst;
  }
  function conjugate(q, dst) {
    const newDst = dst ?? new Ctor(4);
    newDst[0] = -q[0];
    newDst[1] = -q[1];
    newDst[2] = -q[2];
    newDst[3] = q[3];
    return newDst;
  }
  function fromMat(m, dst) {
    const newDst = dst ?? new Ctor(4);
    const trace = m[0] + m[5] + m[10];
    if (trace > 0) {
      const root = Math.sqrt(trace + 1);
      newDst[3] = 0.5 * root;
      const invRoot = 0.5 / root;
      newDst[0] = (m[6] - m[9]) * invRoot;
      newDst[1] = (m[8] - m[2]) * invRoot;
      newDst[2] = (m[1] - m[4]) * invRoot;
    } else {
      let i = 0;
      if (m[5] > m[0]) {
        i = 1;
      }
      if (m[10] > m[i * 4 + i]) {
        i = 2;
      }
      const j = (i + 1) % 3;
      const k = (i + 2) % 3;
      const root = Math.sqrt(m[i * 4 + i] - m[j * 4 + j] - m[k * 4 + k] + 1);
      newDst[i] = 0.5 * root;
      const invRoot = 0.5 / root;
      newDst[3] = (m[j * 4 + k] - m[k * 4 + j]) * invRoot;
      newDst[j] = (m[j * 4 + i] + m[i * 4 + j]) * invRoot;
      newDst[k] = (m[k * 4 + i] + m[i * 4 + k]) * invRoot;
    }
    return newDst;
  }
  function fromEuler(xAngleInRadians, yAngleInRadians, zAngleInRadians, order, dst) {
    const newDst = dst ?? new Ctor(4);
    const xHalfAngle = xAngleInRadians * 0.5;
    const yHalfAngle = yAngleInRadians * 0.5;
    const zHalfAngle = zAngleInRadians * 0.5;
    const sx = Math.sin(xHalfAngle);
    const cx = Math.cos(xHalfAngle);
    const sy = Math.sin(yHalfAngle);
    const cy = Math.cos(yHalfAngle);
    const sz = Math.sin(zHalfAngle);
    const cz = Math.cos(zHalfAngle);
    switch (order) {
      case "xyz":
        newDst[0] = sx * cy * cz + cx * sy * sz;
        newDst[1] = cx * sy * cz - sx * cy * sz;
        newDst[2] = cx * cy * sz + sx * sy * cz;
        newDst[3] = cx * cy * cz - sx * sy * sz;
        break;
      case "xzy":
        newDst[0] = sx * cy * cz - cx * sy * sz;
        newDst[1] = cx * sy * cz - sx * cy * sz;
        newDst[2] = cx * cy * sz + sx * sy * cz;
        newDst[3] = cx * cy * cz + sx * sy * sz;
        break;
      case "yxz":
        newDst[0] = sx * cy * cz + cx * sy * sz;
        newDst[1] = cx * sy * cz - sx * cy * sz;
        newDst[2] = cx * cy * sz - sx * sy * cz;
        newDst[3] = cx * cy * cz + sx * sy * sz;
        break;
      case "yzx":
        newDst[0] = sx * cy * cz + cx * sy * sz;
        newDst[1] = cx * sy * cz + sx * cy * sz;
        newDst[2] = cx * cy * sz - sx * sy * cz;
        newDst[3] = cx * cy * cz - sx * sy * sz;
        break;
      case "zxy":
        newDst[0] = sx * cy * cz - cx * sy * sz;
        newDst[1] = cx * sy * cz + sx * cy * sz;
        newDst[2] = cx * cy * sz + sx * sy * cz;
        newDst[3] = cx * cy * cz - sx * sy * sz;
        break;
      case "zyx":
        newDst[0] = sx * cy * cz - cx * sy * sz;
        newDst[1] = cx * sy * cz + sx * cy * sz;
        newDst[2] = cx * cy * sz - sx * sy * cz;
        newDst[3] = cx * cy * cz + sx * sy * sz;
        break;
      default:
        throw new Error(`Unknown rotation order: ${order}`);
    }
    return newDst;
  }
  function copy(q, dst) {
    const newDst = dst ?? new Ctor(4);
    newDst[0] = q[0];
    newDst[1] = q[1];
    newDst[2] = q[2];
    newDst[3] = q[3];
    return newDst;
  }
  const clone = copy;
  function add(a, b, dst) {
    const newDst = dst ?? new Ctor(4);
    newDst[0] = a[0] + b[0];
    newDst[1] = a[1] + b[1];
    newDst[2] = a[2] + b[2];
    newDst[3] = a[3] + b[3];
    return newDst;
  }
  function subtract(a, b, dst) {
    const newDst = dst ?? new Ctor(4);
    newDst[0] = a[0] - b[0];
    newDst[1] = a[1] - b[1];
    newDst[2] = a[2] - b[2];
    newDst[3] = a[3] - b[3];
    return newDst;
  }
  const sub = subtract;
  function mulScalar(v, k, dst) {
    const newDst = dst ?? new Ctor(4);
    newDst[0] = v[0] * k;
    newDst[1] = v[1] * k;
    newDst[2] = v[2] * k;
    newDst[3] = v[3] * k;
    return newDst;
  }
  const scale = mulScalar;
  function divScalar(v, k, dst) {
    const newDst = dst ?? new Ctor(4);
    newDst[0] = v[0] / k;
    newDst[1] = v[1] / k;
    newDst[2] = v[2] / k;
    newDst[3] = v[3] / k;
    return newDst;
  }
  function dot(a, b) {
    return a[0] * b[0] + a[1] * b[1] + a[2] * b[2] + a[3] * b[3];
  }
  function lerp(a, b, t, dst) {
    const newDst = dst ?? new Ctor(4);
    newDst[0] = a[0] + t * (b[0] - a[0]);
    newDst[1] = a[1] + t * (b[1] - a[1]);
    newDst[2] = a[2] + t * (b[2] - a[2]);
    newDst[3] = a[3] + t * (b[3] - a[3]);
    return newDst;
  }
  function length(v) {
    const v0 = v[0];
    const v1 = v[1];
    const v2 = v[2];
    const v3 = v[3];
    return Math.sqrt(v0 * v0 + v1 * v1 + v2 * v2 + v3 * v3);
  }
  const len = length;
  function lengthSq(v) {
    const v0 = v[0];
    const v1 = v[1];
    const v2 = v[2];
    const v3 = v[3];
    return v0 * v0 + v1 * v1 + v2 * v2 + v3 * v3;
  }
  const lenSq = lengthSq;
  function normalize(v, dst) {
    const newDst = dst ?? new Ctor(4);
    const v0 = v[0];
    const v1 = v[1];
    const v2 = v[2];
    const v3 = v[3];
    const len2 = Math.sqrt(v0 * v0 + v1 * v1 + v2 * v2 + v3 * v3);
    if (len2 > 1e-5) {
      newDst[0] = v0 / len2;
      newDst[1] = v1 / len2;
      newDst[2] = v2 / len2;
      newDst[3] = v3 / len2;
    } else {
      newDst[0] = 0;
      newDst[1] = 0;
      newDst[2] = 0;
      newDst[3] = 1;
    }
    return newDst;
  }
  function equalsApproximately(a, b) {
    return Math.abs(a[0] - b[0]) < EPSILON && Math.abs(a[1] - b[1]) < EPSILON && Math.abs(a[2] - b[2]) < EPSILON && Math.abs(a[3] - b[3]) < EPSILON;
  }
  function equals(a, b) {
    return a[0] === b[0] && a[1] === b[1] && a[2] === b[2] && a[3] === b[3];
  }
  function identity(dst) {
    const newDst = dst ?? new Ctor(4);
    newDst[0] = 0;
    newDst[1] = 0;
    newDst[2] = 0;
    newDst[3] = 1;
    return newDst;
  }
  const tempVec3 = vec33.create();
  const xUnitVec3 = vec33.create();
  const yUnitVec3 = vec33.create();
  function rotationTo(aUnit, bUnit, dst) {
    const newDst = dst ?? new Ctor(4);
    const dot2 = vec33.dot(aUnit, bUnit);
    if (dot2 < -0.999999) {
      vec33.cross(xUnitVec3, aUnit, tempVec3);
      if (vec33.len(tempVec3) < 1e-6) {
        vec33.cross(yUnitVec3, aUnit, tempVec3);
      }
      vec33.normalize(tempVec3, tempVec3);
      fromAxisAngle(tempVec3, Math.PI, newDst);
      return newDst;
    } else if (dot2 > 0.999999) {
      newDst[0] = 0;
      newDst[1] = 0;
      newDst[2] = 0;
      newDst[3] = 1;
      return newDst;
    } else {
      vec33.cross(aUnit, bUnit, tempVec3);
      newDst[0] = tempVec3[0];
      newDst[1] = tempVec3[1];
      newDst[2] = tempVec3[2];
      newDst[3] = 1 + dot2;
      return normalize(newDst, newDst);
    }
  }
  const tempQuat1 = new Ctor(4);
  const tempQuat2 = new Ctor(4);
  function sqlerp(a, b, c, d, t, dst) {
    const newDst = dst ?? new Ctor(4);
    slerp(a, d, t, tempQuat1);
    slerp(b, c, t, tempQuat2);
    slerp(tempQuat1, tempQuat2, 2 * t * (1 - t), newDst);
    return newDst;
  }
  return {
    create,
    fromValues,
    set,
    fromAxisAngle,
    toAxisAngle,
    angle,
    multiply,
    mul,
    rotateX,
    rotateY,
    rotateZ,
    slerp,
    inverse,
    conjugate,
    fromMat,
    fromEuler,
    copy,
    clone,
    add,
    subtract,
    sub,
    mulScalar,
    scale,
    divScalar,
    dot,
    lerp,
    length,
    len,
    lengthSq,
    lenSq,
    normalize,
    equalsApproximately,
    equals,
    identity,
    rotationTo,
    sqlerp
  };
}
var cache$1 = /* @__PURE__ */ new Map();
function getAPI$1(Ctor) {
  let api = cache$1.get(Ctor);
  if (!api) {
    api = getAPIImpl$1(Ctor);
    cache$1.set(Ctor, api);
  }
  return api;
}
function getAPIImpl(Ctor) {
  function create(x, y, z, w) {
    const newDst = new Ctor(4);
    if (x !== void 0) {
      newDst[0] = x;
      if (y !== void 0) {
        newDst[1] = y;
        if (z !== void 0) {
          newDst[2] = z;
          if (w !== void 0) {
            newDst[3] = w;
          }
        }
      }
    }
    return newDst;
  }
  const fromValues = create;
  function set(x, y, z, w, dst) {
    const newDst = dst ?? new Ctor(4);
    newDst[0] = x;
    newDst[1] = y;
    newDst[2] = z;
    newDst[3] = w;
    return newDst;
  }
  function ceil(v, dst) {
    const newDst = dst ?? new Ctor(4);
    newDst[0] = Math.ceil(v[0]);
    newDst[1] = Math.ceil(v[1]);
    newDst[2] = Math.ceil(v[2]);
    newDst[3] = Math.ceil(v[3]);
    return newDst;
  }
  function floor(v, dst) {
    const newDst = dst ?? new Ctor(4);
    newDst[0] = Math.floor(v[0]);
    newDst[1] = Math.floor(v[1]);
    newDst[2] = Math.floor(v[2]);
    newDst[3] = Math.floor(v[3]);
    return newDst;
  }
  function round(v, dst) {
    const newDst = dst ?? new Ctor(4);
    newDst[0] = Math.round(v[0]);
    newDst[1] = Math.round(v[1]);
    newDst[2] = Math.round(v[2]);
    newDst[3] = Math.round(v[3]);
    return newDst;
  }
  function clamp(v, min2 = 0, max2 = 1, dst) {
    const newDst = dst ?? new Ctor(4);
    newDst[0] = Math.min(max2, Math.max(min2, v[0]));
    newDst[1] = Math.min(max2, Math.max(min2, v[1]));
    newDst[2] = Math.min(max2, Math.max(min2, v[2]));
    newDst[3] = Math.min(max2, Math.max(min2, v[3]));
    return newDst;
  }
  function add(a, b, dst) {
    const newDst = dst ?? new Ctor(4);
    newDst[0] = a[0] + b[0];
    newDst[1] = a[1] + b[1];
    newDst[2] = a[2] + b[2];
    newDst[3] = a[3] + b[3];
    return newDst;
  }
  function addScaled(a, b, scale2, dst) {
    const newDst = dst ?? new Ctor(4);
    newDst[0] = a[0] + b[0] * scale2;
    newDst[1] = a[1] + b[1] * scale2;
    newDst[2] = a[2] + b[2] * scale2;
    newDst[3] = a[3] + b[3] * scale2;
    return newDst;
  }
  function subtract(a, b, dst) {
    const newDst = dst ?? new Ctor(4);
    newDst[0] = a[0] - b[0];
    newDst[1] = a[1] - b[1];
    newDst[2] = a[2] - b[2];
    newDst[3] = a[3] - b[3];
    return newDst;
  }
  const sub = subtract;
  function equalsApproximately(a, b) {
    return Math.abs(a[0] - b[0]) < EPSILON && Math.abs(a[1] - b[1]) < EPSILON && Math.abs(a[2] - b[2]) < EPSILON && Math.abs(a[3] - b[3]) < EPSILON;
  }
  function equals(a, b) {
    return a[0] === b[0] && a[1] === b[1] && a[2] === b[2] && a[3] === b[3];
  }
  function lerp(a, b, t, dst) {
    const newDst = dst ?? new Ctor(4);
    newDst[0] = a[0] + t * (b[0] - a[0]);
    newDst[1] = a[1] + t * (b[1] - a[1]);
    newDst[2] = a[2] + t * (b[2] - a[2]);
    newDst[3] = a[3] + t * (b[3] - a[3]);
    return newDst;
  }
  function lerpV(a, b, t, dst) {
    const newDst = dst ?? new Ctor(4);
    newDst[0] = a[0] + t[0] * (b[0] - a[0]);
    newDst[1] = a[1] + t[1] * (b[1] - a[1]);
    newDst[2] = a[2] + t[2] * (b[2] - a[2]);
    newDst[3] = a[3] + t[3] * (b[3] - a[3]);
    return newDst;
  }
  function max(a, b, dst) {
    const newDst = dst ?? new Ctor(4);
    newDst[0] = Math.max(a[0], b[0]);
    newDst[1] = Math.max(a[1], b[1]);
    newDst[2] = Math.max(a[2], b[2]);
    newDst[3] = Math.max(a[3], b[3]);
    return newDst;
  }
  function min(a, b, dst) {
    const newDst = dst ?? new Ctor(4);
    newDst[0] = Math.min(a[0], b[0]);
    newDst[1] = Math.min(a[1], b[1]);
    newDst[2] = Math.min(a[2], b[2]);
    newDst[3] = Math.min(a[3], b[3]);
    return newDst;
  }
  function mulScalar(v, k, dst) {
    const newDst = dst ?? new Ctor(4);
    newDst[0] = v[0] * k;
    newDst[1] = v[1] * k;
    newDst[2] = v[2] * k;
    newDst[3] = v[3] * k;
    return newDst;
  }
  const scale = mulScalar;
  function divScalar(v, k, dst) {
    const newDst = dst ?? new Ctor(4);
    newDst[0] = v[0] / k;
    newDst[1] = v[1] / k;
    newDst[2] = v[2] / k;
    newDst[3] = v[3] / k;
    return newDst;
  }
  function inverse(v, dst) {
    const newDst = dst ?? new Ctor(4);
    newDst[0] = 1 / v[0];
    newDst[1] = 1 / v[1];
    newDst[2] = 1 / v[2];
    newDst[3] = 1 / v[3];
    return newDst;
  }
  const invert = inverse;
  function dot(a, b) {
    return a[0] * b[0] + a[1] * b[1] + a[2] * b[2] + a[3] * b[3];
  }
  function length(v) {
    const v0 = v[0];
    const v1 = v[1];
    const v2 = v[2];
    const v3 = v[3];
    return Math.sqrt(v0 * v0 + v1 * v1 + v2 * v2 + v3 * v3);
  }
  const len = length;
  function lengthSq(v) {
    const v0 = v[0];
    const v1 = v[1];
    const v2 = v[2];
    const v3 = v[3];
    return v0 * v0 + v1 * v1 + v2 * v2 + v3 * v3;
  }
  const lenSq = lengthSq;
  function distance(a, b) {
    const dx = a[0] - b[0];
    const dy = a[1] - b[1];
    const dz = a[2] - b[2];
    const dw = a[3] - b[3];
    return Math.sqrt(dx * dx + dy * dy + dz * dz + dw * dw);
  }
  const dist = distance;
  function distanceSq(a, b) {
    const dx = a[0] - b[0];
    const dy = a[1] - b[1];
    const dz = a[2] - b[2];
    const dw = a[3] - b[3];
    return dx * dx + dy * dy + dz * dz + dw * dw;
  }
  const distSq = distanceSq;
  function normalize(v, dst) {
    const newDst = dst ?? new Ctor(4);
    const v0 = v[0];
    const v1 = v[1];
    const v2 = v[2];
    const v3 = v[3];
    const len2 = Math.sqrt(v0 * v0 + v1 * v1 + v2 * v2 + v3 * v3);
    if (len2 > 1e-5) {
      newDst[0] = v0 / len2;
      newDst[1] = v1 / len2;
      newDst[2] = v2 / len2;
      newDst[3] = v3 / len2;
    } else {
      newDst[0] = 0;
      newDst[1] = 0;
      newDst[2] = 0;
      newDst[3] = 0;
    }
    return newDst;
  }
  function negate(v, dst) {
    const newDst = dst ?? new Ctor(4);
    newDst[0] = -v[0];
    newDst[1] = -v[1];
    newDst[2] = -v[2];
    newDst[3] = -v[3];
    return newDst;
  }
  function copy(v, dst) {
    const newDst = dst ?? new Ctor(4);
    newDst[0] = v[0];
    newDst[1] = v[1];
    newDst[2] = v[2];
    newDst[3] = v[3];
    return newDst;
  }
  const clone = copy;
  function multiply(a, b, dst) {
    const newDst = dst ?? new Ctor(4);
    newDst[0] = a[0] * b[0];
    newDst[1] = a[1] * b[1];
    newDst[2] = a[2] * b[2];
    newDst[3] = a[3] * b[3];
    return newDst;
  }
  const mul = multiply;
  function divide(a, b, dst) {
    const newDst = dst ?? new Ctor(4);
    newDst[0] = a[0] / b[0];
    newDst[1] = a[1] / b[1];
    newDst[2] = a[2] / b[2];
    newDst[3] = a[3] / b[3];
    return newDst;
  }
  const div = divide;
  function zero(dst) {
    const newDst = dst ?? new Ctor(4);
    newDst[0] = 0;
    newDst[1] = 0;
    newDst[2] = 0;
    newDst[3] = 0;
    return newDst;
  }
  function transformMat4(v, m, dst) {
    const newDst = dst ?? new Ctor(4);
    const x = v[0];
    const y = v[1];
    const z = v[2];
    const w = v[3];
    newDst[0] = m[0] * x + m[4] * y + m[8] * z + m[12] * w;
    newDst[1] = m[1] * x + m[5] * y + m[9] * z + m[13] * w;
    newDst[2] = m[2] * x + m[6] * y + m[10] * z + m[14] * w;
    newDst[3] = m[3] * x + m[7] * y + m[11] * z + m[15] * w;
    return newDst;
  }
  function setLength(a, len2, dst) {
    const newDst = dst ?? new Ctor(4);
    normalize(a, newDst);
    return mulScalar(newDst, len2, newDst);
  }
  function truncate(a, maxLen, dst) {
    const newDst = dst ?? new Ctor(4);
    if (length(a) > maxLen) {
      return setLength(a, maxLen, newDst);
    }
    return copy(a, newDst);
  }
  function midpoint(a, b, dst) {
    const newDst = dst ?? new Ctor(4);
    return lerp(a, b, 0.5, newDst);
  }
  return {
    create,
    fromValues,
    set,
    ceil,
    floor,
    round,
    clamp,
    add,
    addScaled,
    subtract,
    sub,
    equalsApproximately,
    equals,
    lerp,
    lerpV,
    max,
    min,
    mulScalar,
    scale,
    divScalar,
    inverse,
    invert,
    dot,
    length,
    len,
    lengthSq,
    lenSq,
    distance,
    dist,
    distanceSq,
    distSq,
    normalize,
    negate,
    copy,
    clone,
    multiply,
    mul,
    divide,
    div,
    zero,
    transformMat4,
    setLength,
    truncate,
    midpoint
  };
}
var cache = /* @__PURE__ */ new Map();
function getAPI(Ctor) {
  let api = cache.get(Ctor);
  if (!api) {
    api = getAPIImpl(Ctor);
    cache.set(Ctor, api);
  }
  return api;
}
function wgpuMatrixAPI(Mat3Ctor, Mat4Ctor, QuatCtor, Vec2Ctor, Vec3Ctor, Vec4Ctor) {
  return {
    /** @namespace mat4 */
    mat4: getAPI$2(Mat3Ctor),
    /** @namespace mat3 */
    mat3: getAPI$4(Mat4Ctor),
    /** @namespace quat */
    quat: getAPI$1(QuatCtor),
    /** @namespace vec2 */
    vec2: getAPI$5(Vec2Ctor),
    /** @namespace vec3 */
    vec3: getAPI$3(Vec3Ctor),
    /** @namespace vec4 */
    vec4: getAPI(Vec4Ctor)
  };
}
var {
  /**
   * 4x4 Matrix functions that default to returning `Float32Array`
   * @namespace
   */
  mat4,
  /**
   * 3x3 Matrix functions that default to returning `Float32Array`
   * @namespace
   */
  mat3,
  /**
   * Quaternion functions that default to returning `Float32Array`
   * @namespace
   */
  quat,
  /**
   * Vec2 functions that default to returning `Float32Array`
   * @namespace
   */
  vec2,
  /**
   * Vec3 functions that default to returning `Float32Array`
   * @namespace
   */
  vec3,
  /**
   * Vec3 functions that default to returning `Float32Array`
   * @namespace
   */
  vec4
} = wgpuMatrixAPI(Float32Array, Float32Array, Float32Array, Float32Array, Float32Array, Float32Array);
var {
  /**
   * 4x4 Matrix functions that default to returning `Float64Array`
   * @namespace
   */
  mat4: mat4d,
  /**
   * 3x3 Matrix functions that default to returning `Float64Array`
   * @namespace
   */
  mat3: mat3d,
  /**
   * Quaternion functions that default to returning `Float64Array`
   * @namespace
   */
  quat: quatd,
  /**
   * Vec2 functions that default to returning `Float64Array`
   * @namespace
   */
  vec2: vec2d,
  /**
   * Vec3 functions that default to returning `Float64Array`
   * @namespace
   */
  vec3: vec3d,
  /**
   * Vec3 functions that default to returning `Float64Array`
   * @namespace
   */
  vec4: vec4d
} = wgpuMatrixAPI(Float64Array, Float64Array, Float64Array, Float64Array, Float64Array, Float64Array);
var {
  /**
   * 4x4 Matrix functions that default to returning `number[]`
   * @namespace
   */
  mat4: mat4n,
  /**
   * 3x3 Matrix functions that default to returning `number[]`
   * @namespace
   */
  mat3: mat3n,
  /**
   * Quaternion functions that default to returning `number[]`
   * @namespace
   */
  quat: quatn,
  /**
   * Vec2 functions that default to returning `number[]`
   * @namespace
   */
  vec2: vec2n,
  /**
   * Vec3 functions that default to returning `number[]`
   * @namespace
   */
  vec3: vec3n,
  /**
   * Vec3 functions that default to returning `number[]`
   * @namespace
   */
  vec4: vec4n
} = wgpuMatrixAPI(ZeroArray, Array, Array, Array, Array, Array);

// src/displacement/displacement.js
var _tmpVec3 = vec3.create(0, 0, 0);
var FLOAT32S_PER_SPRITE2 = 6;
var displacement_default2 = {
  type: "cobalt:displacement",
  refs: [
    // input framebuffer texture with the scene drawn
    { name: "color", type: "textureView", format: "bgra8unorm", access: "read" },
    // displacement map (perlin noise texture works well here)
    { name: "map", type: "cobaltTexture", format: "bgra8unorm", access: "read" },
    // result we're writing to
    { name: "out", type: "textureView", format: "bgra8unorm", access: "write" }
  ],
  // cobalt event handling functions
  // @params Object cobalt renderer world object
  // @params Object options optional data passed when initing this node
  onInit: async function(cobalt, options = {}) {
    return init5(cobalt, options);
  },
  onRun: function(cobalt, node, webGpuCommandEncoder) {
    draw5(cobalt, node, webGpuCommandEncoder);
  },
  onDestroy: function(cobalt, node) {
    destroy4(node);
  },
  onResize: function(cobalt, node) {
    resize3(cobalt, node);
  },
  onViewportPosition: function(cobalt, node) {
    _writeTransformBuffer(cobalt, node);
  },
  // optional
  customFunctions: {
    addTriangle: function(cobalt, node, triangleVertices) {
      const triangleId = _uuid();
      const insertIdx = node.data.spriteCount;
      node.data.spriteIndices.set(triangleId, insertIdx);
      const offset = insertIdx * FLOAT32S_PER_SPRITE2;
      node.data.spriteData[offset] = triangleVertices[0][0];
      node.data.spriteData[offset + 1] = triangleVertices[0][1];
      node.data.spriteData[offset + 2] = triangleVertices[1][0];
      node.data.spriteData[offset + 3] = triangleVertices[1][1];
      node.data.spriteData[offset + 4] = triangleVertices[2][0];
      node.data.spriteData[offset + 5] = triangleVertices[2][1];
      node.data.spriteCount++;
      return triangleId;
    },
    removeTriangle: function(cobalt, node, triangleId) {
      node.data.spriteIndices.delete(triangleId);
      node.data.spriteCount--;
    },
    setPosition: function(cobalt, node, triangleId, triangleVertices) {
      const spriteIdx = node.data.spriteIndices.get(triangleId);
      const offset = spriteIdx * FLOAT32S_PER_SPRITE2;
      node.data.spriteData[offset] = triangleVertices[0][0];
      node.data.spriteData[offset + 1] = triangleVertices[0][1];
      node.data.spriteData[offset + 2] = triangleVertices[1][0];
      node.data.spriteData[offset + 3] = triangleVertices[1][1];
      node.data.spriteData[offset + 4] = triangleVertices[2][0];
      node.data.spriteData[offset + 5] = triangleVertices[2][1];
    }
  }
};
async function init5(cobalt, node) {
  const { device } = cobalt;
  const dat = new Float32Array([
    node.options.offseyX ?? 0,
    // offsetX
    node.options.offseyY ?? 0,
    // offsetY
    node.options.scale ?? 20,
    // scale
    0
    // unused, for byte alignment
  ]);
  const params_buf = device.createBuffer({
    label: "displacement options buffer",
    size: dat.byteLength,
    // vec4<f32> and f32 and u32 with 4 bytes per float32 and 4 bytes per u32
    mappedAtCreation: true,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
  });
  new Float32Array(params_buf.getMappedRange()).set(dat);
  params_buf.unmap();
  const MAX_SPRITE_COUNT = 256;
  const numInstances = MAX_SPRITE_COUNT;
  const translateFloatCount = 2;
  const translateSize = Float32Array.BYTES_PER_ELEMENT * translateFloatCount;
  const scaleFloatCount = 2;
  const scaleSize = Float32Array.BYTES_PER_ELEMENT * scaleFloatCount;
  const rotationFloatCount = 2;
  const rotationSize = Float32Array.BYTES_PER_ELEMENT * rotationFloatCount;
  const uniformBuffer = device.createBuffer({
    size: 64 * 2,
    // 4x4 matrix with 4 bytes per float32, times 2 matrices (view, projection)
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
  });
  const bindGroupLayout = device.createBindGroupLayout({
    entries: [
      {
        binding: 0,
        visibility: GPUShaderStage.VERTEX,
        buffer: {}
      },
      {
        binding: 1,
        visibility: GPUShaderStage.FRAGMENT,
        texture: {}
      },
      {
        binding: 2,
        visibility: GPUShaderStage.FRAGMENT,
        sampler: {}
      },
      {
        binding: 3,
        visibility: GPUShaderStage.FRAGMENT,
        texture: {}
      },
      {
        binding: 4,
        visibility: GPUShaderStage.FRAGMENT,
        buffer: {
          type: "uniform"
          //minBindingSize: 24 // sizeOf(BloomParam)
        }
      }
    ]
  });
  const pipelineLayout = device.createPipelineLayout({
    bindGroupLayouts: [bindGroupLayout]
  });
  const addressMode = "repeat";
  const filter = "linear";
  const sampler = device.createSampler({
    label: `displacement ampler`,
    addressModeU: addressMode,
    addressModeV: addressMode,
    addressModeW: addressMode,
    magFilter: filter,
    minFilter: filter,
    mipmapFilter: filter
  });
  const bindGroup = device.createBindGroup({
    layout: bindGroupLayout,
    entries: [
      {
        binding: 0,
        resource: {
          buffer: uniformBuffer
        }
      },
      {
        binding: 1,
        resource: node.refs.color.data.view
      },
      {
        binding: 2,
        resource: sampler
      },
      {
        binding: 3,
        resource: node.refs.map.view
      },
      {
        binding: 4,
        resource: {
          buffer: params_buf
        }
      }
    ]
  });
  const buffer = device.createBuffer({
    size: MAX_SPRITE_COUNT * FLOAT32S_PER_SPRITE2,
    usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST
  });
  const bufferLayout = {
    arrayStride: 8,
    stepMode: "vertex",
    attributes: [
      // position
      {
        shaderLocation: 0,
        format: "float32x2",
        offset: 0
      }
    ]
  };
  const pipeline = device.createRenderPipeline({
    label: "displacement",
    vertex: {
      module: device.createShaderModule({
        code: displacement_default
      }),
      entryPoint: "vs_main",
      buffers: [bufferLayout]
    },
    fragment: {
      module: device.createShaderModule({
        code: displacement_default
      }),
      entryPoint: "fs_main",
      targets: [
        // color
        {
          format: "bgra8unorm",
          blend: {
            color: {
              srcFactor: "src-alpha",
              dstFactor: "one-minus-src-alpha"
            },
            alpha: {
              srcFactor: "zero",
              dstFactor: "one"
            }
          }
        }
      ]
    },
    primitive: {
      topology: "triangle-list"
    },
    layout: pipelineLayout
  });
  return {
    bindGroup,
    bindGroupLayout,
    uniformBuffer,
    sampler,
    pipeline,
    params_buf,
    buffer,
    // where the per-triangle vertex data is stored
    // actual vertex data. this is used to update the buffer.
    spriteData: new Float32Array(MAX_SPRITE_COUNT * FLOAT32S_PER_SPRITE2),
    spriteCount: 0,
    spriteIndices: /* @__PURE__ */ new Map()
    // key is spriteId, value is insert index of the sprite. e.g., 0 means 1st sprite , 1 means 2nd sprite, etc.
  };
}
function draw5(cobalt, node, commandEncoder) {
  if (node.data.spriteCount === 0)
    return;
  const { device } = cobalt;
  const len = FLOAT32S_PER_SPRITE2 * node.data.spriteCount * Float32Array.BYTES_PER_ELEMENT;
  device.queue.writeBuffer(node.data.buffer, 0, node.data.spriteData.buffer, 0, len);
  const renderpass = commandEncoder.beginRenderPass({
    colorAttachments: [
      // color
      {
        view: node.refs.out,
        clearValue: cobalt.clearValue,
        loadOp: "load",
        storeOp: "store"
      }
    ]
  });
  renderpass.setPipeline(node.data.pipeline);
  renderpass.setBindGroup(0, node.data.bindGroup);
  renderpass.setVertexBuffer(0, node.data.buffer);
  const vertexCount = node.data.spriteCount * 3;
  const instanceCount = 1;
  const baseInstanceIdx = 0;
  const baseVertexIdx = 0;
  renderpass.draw(vertexCount, instanceCount, baseVertexIdx, baseInstanceIdx);
  renderpass.end();
}
function destroy4(node) {
  node.data.bindGroup = null;
  node.data.buffer.destroy();
  node.data.buffer = null;
  node.data.uniformBuffer.destroy();
  node.data.uniformBuffer = null;
  node.data.spriteData = null;
  node.data.spriteIndices.clear();
  node.data.spriteIndices = null;
  node.data.params_buf.destroy();
  node.data.params_buf = null;
}
function resize3(cobalt, node) {
  const { device } = cobalt;
  node.data.bindGroup = device.createBindGroup({
    layout: node.data.bindGroupLayout,
    entries: [
      {
        binding: 0,
        resource: {
          buffer: node.data.uniformBuffer
        }
      },
      {
        binding: 1,
        resource: node.refs.color.data.view
      },
      {
        binding: 2,
        resource: node.data.sampler
      },
      {
        binding: 3,
        resource: node.refs.map.view
      },
      {
        binding: 4,
        resource: {
          buffer: node.data.params_buf
        }
      }
    ]
  });
}
function _writeTransformBuffer(cobalt, node) {
  const { device } = cobalt;
  const GAME_WIDTH = cobalt.viewport.width / cobalt.viewport.zoom;
  const GAME_HEIGHT = cobalt.viewport.height / cobalt.viewport.zoom;
  const projection = mat4.ortho(0, GAME_WIDTH, GAME_HEIGHT, 0, -10, 10);
  vec3.set(-cobalt.viewport.position[0], -cobalt.viewport.position[1], 0, _tmpVec3);
  const view = mat4.translation(_tmpVec3);
  device.queue.writeBuffer(node.data.uniformBuffer, 0, view.buffer);
  device.queue.writeBuffer(node.data.uniformBuffer, 64, projection.buffer);
}

// src/sprite/create-sprite-quads.js
function createSpriteQuads(device, spritesheet) {
  const vertices = spritesheet.vertices;
  const usage = GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST;
  const descriptor = {
    size: vertices.byteLength,
    usage,
    // make this memory space accessible from the CPU (host visible)
    mappedAtCreation: true
  };
  const buffer = device.createBuffer(descriptor);
  new Float32Array(buffer.getMappedRange()).set(vertices);
  buffer.unmap();
  const bufferLayout = {
    arrayStride: 20,
    stepMode: "vertex",
    attributes: [
      // position
      {
        shaderLocation: 0,
        format: "float32x3",
        offset: 0
      },
      // uv
      {
        shaderLocation: 1,
        format: "float32x2",
        offset: 12
      }
    ]
  };
  return {
    buffer,
    bufferLayout
  };
}

// src/overlay/overlay.wgsl
var overlay_default = "struct TransformData {\r\n    view: mat4x4<f32>,\r\n    projection: mat4x4<f32>\r\n};\r\n\r\nstruct Sprite {\r\n    translate: vec2<f32>,\r\n    scale: vec2<f32>,\r\n    tint: vec4<f32>,\r\n    opacity: f32,\r\n    rotation: f32,\r\n    //emissiveIntensity: f32,\r\n    //sortValue: f32,\r\n};\r\n\r\nstruct SpritesBuffer {\r\n  models: array<Sprite>,\r\n};\r\n\r\n@binding(0) @group(0) var<uniform> transformUBO: TransformData;\r\n@binding(1) @group(0) var myTexture: texture_2d<f32>;\r\n@binding(2) @group(0) var mySampler: sampler;\r\n@binding(3) @group(0) var<storage, read> sprites : SpritesBuffer;\r\n\r\n\r\nstruct Fragment {\r\n    @builtin(position) Position : vec4<f32>,\r\n    @location(0) TexCoord : vec2<f32>,\r\n    @location(1) Tint : vec4<f32>,\r\n    @location(2) Opacity: f32,\r\n};\r\n\r\n\r\n@vertex\r\nfn vs_main (@builtin(instance_index) i_id : u32, \r\n            @location(0) vertexPosition: vec3<f32>,\r\n            @location(1) vertexTexCoord: vec2<f32>) -> Fragment  {\r\n\r\n    var output : Fragment;\r\n\r\n    var sx: f32 = sprites.models[i_id].scale.x;\r\n    var sy: f32 = sprites.models[i_id].scale.y;\r\n    var sz: f32 = 1.0;\r\n\r\n    var rot: f32 = sprites.models[i_id].rotation;\r\n\r\n    var tx: f32 = sprites.models[i_id].translate.x;\r\n    var ty: f32 = sprites.models[i_id].translate.y;\r\n    var tz: f32 = 0;\r\n\r\n    var s = sin(rot);\r\n    var c = cos(rot);\r\n\r\n    // TODO: can probably hardcode a view and projection matrix since this doesn't change\r\n\r\n    // https://webglfundamentals.org/webgl/lessons/webgl-2d-matrices.html\r\n\r\n    var scaleM: mat4x4<f32> = mat4x4<f32>(sx, 0.0, 0.0, 0.0,\r\n                                         0.0,  sy, 0.0, 0.0,\r\n                                         0.0, 0.0,  sz, 0.0,\r\n                                           0,   0,   0, 1.0);\r\n\r\n    // rotation and translation\r\n    var modelM: mat4x4<f32> = mat4x4<f32>(c,   s, 0.0, 0.0,\r\n                                         -s,   c, 0.0, 0.0,\r\n                                        0.0, 0.0, 1.0, 0.0,\r\n                                         tx,  ty,  tz, 1.0) * scaleM;\r\n\r\n    output.Position = transformUBO.projection * transformUBO.view * modelM * vec4<f32>(vertexPosition, 1.0);\r\n    \r\n    output.TexCoord = vertexTexCoord;\r\n    output.Tint = sprites.models[i_id].tint;\r\n    output.Opacity = sprites.models[i_id].opacity;\r\n    \r\n    return output;\r\n}\r\n\r\n@fragment\r\nfn fs_main (@location(0) TexCoord: vec2<f32>,\r\n            @location(1) Tint: vec4<f32>,\r\n            @location(2) Opacity: f32) -> @location(0) vec4<f32> {\r\n\r\n    var outColor: vec4<f32> = textureSample(myTexture, mySampler, TexCoord);\r\n    var output = vec4<f32>(outColor.rgb * (1.0 - Tint.a) + (Tint.rgb * Tint.a), outColor.a * Opacity);\r\n\r\n    return output;\r\n    //return vec4<f32>(1.0, 0.0, 1.0, 1.0);\r\n}\r\n";

// src/overlay/constants.js
var FLOAT32S_PER_SPRITE3 = 12;

// src/overlay/overlay.js
var _tmpVec4 = vec4.create();
var _tmpVec32 = vec3.create();
var overlay_default2 = {
  type: "cobalt:overlay",
  refs: [
    { name: "spritesheet", type: "customResource", access: "read" },
    { name: "color", type: "textView", format: "rgba8unorm", access: "write" }
  ],
  // cobalt event handling functions
  // @params Object cobalt renderer world object
  // @params Object options optional data passed when initing this node
  onInit: async function(cobalt, options = {}) {
    return init6(cobalt, options);
  },
  onRun: function(cobalt, node, webGpuCommandEncoder) {
    draw6(cobalt, node, webGpuCommandEncoder);
  },
  onDestroy: function(cobalt, node) {
    destroy5(node);
  },
  onResize: function(cobalt, node) {
    _writeOverlayBuffer(cobalt, node);
  },
  onViewportPosition: function(cobalt, node) {
    _writeOverlayBuffer(cobalt, node);
  },
  // optional
  customFunctions: { ...api_exports }
};
async function init6(cobalt, nodeData) {
  const { device } = cobalt;
  const MAX_SPRITE_COUNT = 16192;
  const numInstances = MAX_SPRITE_COUNT;
  const translateFloatCount = 2;
  const translateSize = Float32Array.BYTES_PER_ELEMENT * translateFloatCount;
  const scaleFloatCount = 2;
  const scaleSize = Float32Array.BYTES_PER_ELEMENT * scaleFloatCount;
  const tintFloatCount = 4;
  const tintSize = Float32Array.BYTES_PER_ELEMENT * tintFloatCount;
  const opacityFloatCount = 4;
  const opacitySize = Float32Array.BYTES_PER_ELEMENT * opacityFloatCount;
  const spriteBuffer = device.createBuffer({
    size: (translateSize + scaleSize + tintSize + opacitySize) * numInstances,
    // 4x4 matrix with 4 bytes per float32, per instance
    usage: GPUBufferUsage.VERTEX | GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST
  });
  const uniformBuffer = device.createBuffer({
    size: 64 * 2,
    // 4x4 matrix with 4 bytes per float32, times 2 matrices (view, projection)
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
  });
  const bindGroupLayout = device.createBindGroupLayout({
    entries: [
      {
        binding: 0,
        visibility: GPUShaderStage.VERTEX,
        buffer: {}
      },
      {
        binding: 1,
        visibility: GPUShaderStage.FRAGMENT,
        texture: {}
      },
      {
        binding: 2,
        visibility: GPUShaderStage.FRAGMENT,
        sampler: {}
      },
      {
        binding: 3,
        visibility: GPUShaderStage.VERTEX,
        buffer: {
          type: "read-only-storage"
        }
      }
    ]
  });
  const bindGroup = device.createBindGroup({
    layout: bindGroupLayout,
    entries: [
      {
        binding: 0,
        resource: {
          buffer: uniformBuffer
        }
      },
      {
        binding: 1,
        resource: nodeData.refs.spritesheet.data.colorTexture.view
      },
      {
        binding: 2,
        resource: nodeData.refs.spritesheet.data.colorTexture.sampler
      },
      {
        binding: 3,
        resource: {
          buffer: spriteBuffer
        }
      }
    ]
  });
  const pipelineLayout = device.createPipelineLayout({
    bindGroupLayouts: [bindGroupLayout]
  });
  const pipeline = device.createRenderPipeline({
    label: "overlay",
    vertex: {
      module: device.createShaderModule({
        code: overlay_default
      }),
      entryPoint: "vs_main",
      buffers: [nodeData.refs.spritesheet.data.quads.bufferLayout]
    },
    fragment: {
      module: device.createShaderModule({
        code: overlay_default
      }),
      entryPoint: "fs_main",
      targets: [
        // color
        {
          format: "bgra8unorm",
          blend: {
            color: {
              srcFactor: "src-alpha",
              dstFactor: "one-minus-src-alpha"
            },
            alpha: {
              srcFactor: "zero",
              dstFactor: "one"
            }
          }
        }
      ]
    },
    primitive: {
      topology: "triangle-list"
    },
    layout: pipelineLayout
  });
  return {
    // instancedDrawCalls is used to actually perform draw calls within the render pass
    // layout is interleaved with baseVtxIdx (the sprite type), and instanceCount (how many sprites)
    // [
    //    baseVtxIdx0, instanceCount0,
    //    baseVtxIdx1, instanceCount1,
    //    ...
    // ]
    instancedDrawCalls: new Uint32Array(MAX_SPRITE_COUNT * 2),
    instancedDrawCallCount: 0,
    spriteBuffer,
    uniformBuffer,
    pipeline,
    bindGroupLayout,
    bindGroup,
    // actual sprite instance data. ordered by layer, then sprite type
    // this is used to update the spriteBuffer.
    spriteData: new Float32Array(MAX_SPRITE_COUNT * FLOAT32S_PER_SPRITE3),
    spriteCount: 0,
    spriteIndices: /* @__PURE__ */ new Map(),
    // key is spriteId, value is insert index of the sprite. e.g., 0 means 1st sprite , 1 means 2nd sprite, etc.
    // when a sprite is changed the renderpass is dirty, and should have it's instance data copied to the gpu
    dirty: false
  };
}
function draw6(cobalt, node, commandEncoder) {
  const { device } = cobalt;
  const loadOp = node.options.loadOp || "load";
  if (node.data.dirty) {
    _rebuildSpriteDrawCalls2(node.data);
    node.data.dirty = false;
  }
  device.queue.writeBuffer(node.data.spriteBuffer, 0, node.data.spriteData.buffer);
  const renderpass = commandEncoder.beginRenderPass({
    colorAttachments: [
      // color
      {
        view: node.refs.color,
        clearValue: cobalt.clearValue,
        loadOp,
        storeOp: "store"
      }
    ]
  });
  renderpass.setPipeline(node.data.pipeline);
  renderpass.setBindGroup(0, node.data.bindGroup);
  renderpass.setVertexBuffer(0, node.refs.spritesheet.data.quads.buffer);
  const vertexCount = 6;
  let baseInstanceIdx = 0;
  for (let i = 0; i < node.data.instancedDrawCallCount; i++) {
    const baseVertexIdx = node.data.instancedDrawCalls[i * 2] * vertexCount;
    const instanceCount = node.data.instancedDrawCalls[i * 2 + 1];
    renderpass.draw(vertexCount, instanceCount, baseVertexIdx, baseInstanceIdx);
    baseInstanceIdx += instanceCount;
  }
  renderpass.end();
}
function _rebuildSpriteDrawCalls2(renderPass) {
  let currentSpriteType = -1;
  let instanceCount = 0;
  renderPass.instancedDrawCallCount = 0;
  for (let i = 0; i < renderPass.spriteCount; i++) {
    const spriteType = renderPass.spriteData[i * FLOAT32S_PER_SPRITE3 + 11] & 65535;
    if (spriteType !== currentSpriteType) {
      if (instanceCount > 0) {
        renderPass.instancedDrawCalls[renderPass.instancedDrawCallCount * 2] = currentSpriteType;
        renderPass.instancedDrawCalls[renderPass.instancedDrawCallCount * 2 + 1] = instanceCount;
        renderPass.instancedDrawCallCount++;
      }
      currentSpriteType = spriteType;
      instanceCount = 0;
    }
    instanceCount++;
  }
  if (instanceCount > 0) {
    renderPass.instancedDrawCalls[renderPass.instancedDrawCallCount * 2] = currentSpriteType;
    renderPass.instancedDrawCalls[renderPass.instancedDrawCallCount * 2 + 1] = instanceCount;
    renderPass.instancedDrawCallCount++;
  }
}
function _writeOverlayBuffer(cobalt, nodeData) {
  const zoom = 1;
  const GAME_WIDTH = Math.round(cobalt.viewport.width / zoom);
  const GAME_HEIGHT = Math.round(cobalt.viewport.height / zoom);
  const projection = mat4.ortho(0, GAME_WIDTH, GAME_HEIGHT, 0, -10, 10);
  vec3.set(0, 0, 0, _tmpVec32);
  const view = mat4.translation(_tmpVec32);
  cobalt.device.queue.writeBuffer(nodeData.data.uniformBuffer, 0, view.buffer);
  cobalt.device.queue.writeBuffer(nodeData.data.uniformBuffer, 64, projection.buffer);
}
function destroy5(nodeData) {
  nodeData.data.instancedDrawCalls = null;
  nodeData.data.bindGroup = null;
  nodeData.data.spriteBuffer.destroy();
  nodeData.data.spriteBuffer = null;
  nodeData.data.uniformBuffer.destroy();
  nodeData.data.uniformBuffer = null;
  nodeData.data.spriteData = null;
  nodeData.data.spriteIndices.clear();
  nodeData.data.spriteIndices = null;
}

// src/fb-blit/fb-blit.wgsl
var fb_blit_default = "\r\n@binding(0) @group(0) var tileTexture: texture_2d<f32>;\r\n@binding(1) @group(0) var tileSampler: sampler;\r\n\r\n\r\nstruct Fragment {\r\n    @builtin(position) Position : vec4<f32>,\r\n    @location(0) TexCoord : vec2<f32>\r\n};\r\n\r\n// fullscreen triangle position and uvs\r\nconst positions = array<vec2<f32>, 3>(\r\n    vec2<f32>(-1.0, -3.0),\r\n    vec2<f32>(3.0, 1.0),\r\n    vec2<f32>(-1.0, 1.0)\r\n);\r\n\r\nconst uvs = array<vec2<f32>, 3>(\r\n    vec2<f32>(0.0, 2.0),\r\n    vec2<f32>(2.0, 0.0),\r\n    vec2<f32>(0.0, 0.0)\r\n);\r\n\r\n@vertex\r\nfn vs_main (@builtin(vertex_index) VertexIndex : u32) -> Fragment  {\r\n\r\n    var output : Fragment;\r\n\r\n    output.Position = vec4<f32>(positions[VertexIndex], 0.0, 1.0);\r\n    output.TexCoord = vec2<f32>(uvs[VertexIndex]);\r\n\r\n    return output;\r\n}\r\n\r\n\r\n@fragment\r\nfn fs_main (@location(0) TexCoord: vec2<f32>) -> @location(0) vec4<f32> {\r\n    var col = textureSample(tileTexture, tileSampler, TexCoord);\r\n    return vec4<f32>(col.rgb, 1.0);\r\n}\r\n";

// src/fb-blit/fb-blit.js
var fb_blit_default2 = {
  type: "cobalt:fbBlit",
  refs: [
    { name: "in", type: "cobaltTexture", format: "bgra8unorm", access: "read" },
    { name: "out", type: "cobaltTexture", format: "bgra8unorm", access: "write" }
  ],
  // @params Object cobalt renderer world object
  // @params Object options optional data passed when initing this node
  onInit: async function(cobalt, options = {}) {
    return init7(cobalt, options);
  },
  onRun: function(cobalt, node, webGpuCommandEncoder) {
    draw7(cobalt, node, webGpuCommandEncoder);
  },
  onDestroy: function(cobalt, node) {
  },
  onResize: function(cobalt, node) {
    resize4(cobalt, node);
  },
  onViewportPosition: function(cobalt, node) {
  }
};
async function init7(cobalt, node) {
  const { device } = cobalt;
  const bindGroupLayout = device.createBindGroupLayout({
    entries: [
      {
        binding: 0,
        visibility: GPUShaderStage.FRAGMENT,
        texture: {}
      },
      {
        binding: 1,
        visibility: GPUShaderStage.FRAGMENT,
        sampler: {}
      }
    ]
  });
  const bindGroup = device.createBindGroup({
    layout: bindGroupLayout,
    entries: [
      {
        binding: 0,
        resource: node.refs.in.data.view
      },
      {
        binding: 1,
        resource: node.refs.in.data.sampler
      }
    ]
  });
  const pipelineLayout = device.createPipelineLayout({
    bindGroupLayouts: [bindGroupLayout]
  });
  const pipeline = device.createRenderPipeline({
    label: "fb-blit",
    vertex: {
      module: device.createShaderModule({
        code: fb_blit_default
      }),
      entryPoint: "vs_main",
      buffers: [
        /*quad.bufferLayout*/
      ]
    },
    fragment: {
      module: device.createShaderModule({
        code: fb_blit_default
      }),
      entryPoint: "fs_main",
      targets: [
        {
          format: "bgra8unorm",
          blend: {
            color: {
              srcFactor: "src-alpha",
              dstFactor: "one-minus-src-alpha"
            },
            alpha: {
              srcFactor: "zero",
              dstFactor: "one"
            }
          }
        }
      ]
    },
    primitive: {
      topology: "triangle-list"
    },
    layout: pipelineLayout
  });
  return {
    bindGroupLayout,
    bindGroup,
    pipeline
  };
}
function draw7(cobalt, node, commandEncoder) {
  const { device } = cobalt;
  const renderpass = commandEncoder.beginRenderPass({
    colorAttachments: [
      {
        view: node.refs.out,
        clearValue: cobalt.clearValue,
        loadOp: "load",
        storeOp: "store"
      }
    ]
  });
  renderpass.setPipeline(node.data.pipeline);
  renderpass.setBindGroup(0, node.data.bindGroup);
  renderpass.draw(3);
  renderpass.end();
}
function resize4(cobalt, node) {
  const { device } = cobalt;
  node.data.bindGroup = device.createBindGroup({
    layout: node.data.bindGroupLayout,
    entries: [
      {
        binding: 0,
        resource: node.refs.in.data.view
      },
      {
        binding: 1,
        resource: node.refs.in.data.sampler
      }
    ]
  });
}

// src/primitives/primitives.wgsl
var primitives_default = "struct TransformData {\r\n    view: mat4x4<f32>,\r\n    projection: mat4x4<f32>\r\n};\r\n\r\n@binding(0) @group(0) var<uniform> transformUBO: TransformData;\r\n\r\nstruct Fragment {\r\n    @builtin(position) Position : vec4<f32>,\r\n    @location(0) Color : vec4<f32>,\r\n};\r\n\r\n@vertex\r\nfn vs_main(@location(0) vertexPosition: vec2<f32>,\r\n           @location(1) vertexColor: vec4<f32>) -> Fragment {\r\n    \r\n    var sx: f32 = 1.0; //sprites.models[i_id].scale.x;\r\n    var sy: f32 = 1.0; // sprites.models[i_id].scale.y;\r\n    var sz: f32 = 1.0;\r\n\r\n    var rot: f32 = 0.0; //sprites.models[i_id].rotation;\r\n\r\n    var tx: f32 = 1.0; //sprites.models[i_id].translate.x;\r\n    var ty: f32 = 1.0; //sprites.models[i_id].translate.y;\r\n    var tz: f32 = 0;\r\n\r\n    var s = sin(rot);\r\n    var c = cos(rot);\r\n\r\n    // https://webglfundamentals.org/webgl/lessons/webgl-2d-matrices.html\r\n\r\n    var scaleM: mat4x4<f32> = mat4x4<f32>(sx, 0.0, 0.0, 0.0,\r\n                                         0.0,  sy, 0.0, 0.0,\r\n                                         0.0, 0.0, sz, 0.0,\r\n                                           0,   0,   0, 1.0);\r\n\r\n    // rotation and translation\r\n    var modelM: mat4x4<f32> = mat4x4<f32>(c,   s, 0.0, 0.0,\r\n                                         -s,   c, 0.0, 0.0,\r\n                                        0.0, 0.0, 1.0, 0.0,\r\n                                         tx,  ty,  tz, 1.0) * scaleM;\r\n\r\n    var output : Fragment;\r\n\r\n    output.Position = transformUBO.projection * transformUBO.view * modelM * vec4<f32>(vertexPosition, 0.0, 1.0);\r\n    output.Color = vertexColor;\r\n\r\n    return output;\r\n}\r\n\r\n@fragment\r\nfn fs_main(@location(0) Color: vec4<f32>) -> @location(0) vec4<f32> {\r\n    return Color;\r\n}\r\n";

// src/primitives/api.js
function line(cobalt, node, start, end, color, lineWidth = 1) {
  const delta = vec2.sub(end, start);
  const unitBasis = vec2.normalize(delta);
  const perp = perpendicularComponent(unitBasis);
  const halfLineWidth = lineWidth / 2;
  let i = node.data.vertexCount * 6;
  node.data.vertices[i + 0] = start[0] + perp[0] * halfLineWidth;
  node.data.vertices[i + 1] = start[1] + perp[1] * halfLineWidth;
  node.data.vertices[i + 2] = color[0];
  node.data.vertices[i + 3] = color[1];
  node.data.vertices[i + 4] = color[2];
  node.data.vertices[i + 5] = color[3];
  node.data.vertices[i + 6] = start[0] - perp[0] * halfLineWidth;
  node.data.vertices[i + 7] = start[1] - perp[1] * halfLineWidth;
  node.data.vertices[i + 8] = color[0];
  node.data.vertices[i + 9] = color[1];
  node.data.vertices[i + 10] = color[2];
  node.data.vertices[i + 11] = color[3];
  node.data.vertices[i + 12] = end[0] + perp[0] * halfLineWidth;
  node.data.vertices[i + 13] = end[1] + perp[1] * halfLineWidth;
  node.data.vertices[i + 14] = color[0];
  node.data.vertices[i + 15] = color[1];
  node.data.vertices[i + 16] = color[2];
  node.data.vertices[i + 17] = color[3];
  node.data.vertices[i + 18] = start[0] - perp[0] * halfLineWidth;
  node.data.vertices[i + 19] = start[1] - perp[1] * halfLineWidth;
  node.data.vertices[i + 20] = color[0];
  node.data.vertices[i + 21] = color[1];
  node.data.vertices[i + 22] = color[2];
  node.data.vertices[i + 23] = color[3];
  node.data.vertices[i + 24] = end[0] + perp[0] * halfLineWidth;
  node.data.vertices[i + 25] = end[1] + perp[1] * halfLineWidth;
  node.data.vertices[i + 26] = color[0];
  node.data.vertices[i + 27] = color[1];
  node.data.vertices[i + 28] = color[2];
  node.data.vertices[i + 29] = color[3];
  node.data.vertices[i + 30] = end[0] - perp[0] * halfLineWidth;
  node.data.vertices[i + 31] = end[1] - perp[1] * halfLineWidth;
  node.data.vertices[i + 32] = color[0];
  node.data.vertices[i + 33] = color[1];
  node.data.vertices[i + 34] = color[2];
  node.data.vertices[i + 35] = color[3];
  node.data.vertexCount += 6;
  cobalt.device.queue.writeBuffer(node.data.vertexBuffer, 0, node.data.vertices.buffer);
}
function perpendicularComponent(inp) {
  return [-inp[1], inp[0]];
}
var api_default = {
  line,
  filledEllipse: function(cobalt, node, center, halfWidth, halfHeight, numSegments, color) {
    const [x, y] = center;
    const deltaAngle = 2 * Math.PI / numSegments;
    for (let i = 0; i < numSegments; i++) {
      const angle = i * deltaAngle;
      const nextAngle = (i + 1) * deltaAngle;
      const currX = x + halfWidth * Math.cos(angle);
      const currY = y + halfHeight * Math.sin(angle);
      const nextX = x + halfWidth * Math.cos(nextAngle);
      const nextY = y + halfHeight * Math.sin(nextAngle);
      const vi = node.data.vertexCount * 6 + i * 18;
      node.data.vertices[vi + 0] = x;
      node.data.vertices[vi + 1] = y;
      node.data.vertices[vi + 2] = color[0];
      node.data.vertices[vi + 3] = color[1];
      node.data.vertices[vi + 4] = color[2];
      node.data.vertices[vi + 5] = color[3];
      node.data.vertices[vi + 6] = currX;
      node.data.vertices[vi + 7] = currY;
      node.data.vertices[vi + 8] = color[0];
      node.data.vertices[vi + 9] = color[1];
      node.data.vertices[vi + 10] = color[2];
      node.data.vertices[vi + 11] = color[3];
      node.data.vertices[vi + 12] = nextX;
      node.data.vertices[vi + 13] = nextY;
      node.data.vertices[vi + 14] = color[0];
      node.data.vertices[vi + 15] = color[1];
      node.data.vertices[vi + 16] = color[2];
      node.data.vertices[vi + 17] = color[3];
    }
    node.data.vertexCount += 3 * numSegments;
    cobalt.device.queue.writeBuffer(node.data.vertexBuffer, 0, node.data.vertices.buffer);
  },
  // @param Number angle rotation (radians)
  box: function(cobalt, node, center, width, height, color, angle = 0, lineWidth = 1) {
    const [x, y] = center;
    const halfWidth = width / 2;
    const halfHeight = height / 2;
    const topLeft = [x - halfWidth, y - halfHeight];
    const topRight = [x + halfWidth, y - halfHeight];
    const bottomLeft = [x - halfWidth, y + halfHeight];
    const bottomRight = [x + halfWidth, y + halfHeight];
    if (angle !== 0) {
      _rotate(topLeft, center, angle, topLeft);
      _rotate(topRight, center, angle, topRight);
      _rotate(bottomLeft, center, angle, bottomLeft);
      _rotate(bottomRight, center, angle, bottomRight);
    }
    line(cobalt, node, topLeft, topRight, color, lineWidth);
    line(cobalt, node, bottomLeft, bottomRight, color, lineWidth);
    line(cobalt, node, topLeft, bottomLeft, color, lineWidth);
    line(cobalt, node, topRight, bottomRight, color, lineWidth);
  },
  // @param Number angle rotation (radians)
  filledBox: function(cobalt, node, center, width, height, color, angle = 0) {
    const [x, y] = center;
    const halfWidth = width / 2;
    const halfHeight = height / 2;
    const topLeft = [x - halfWidth, y - halfHeight];
    const topRight = [x + halfWidth, y - halfHeight];
    const bottomLeft = [x - halfWidth, y + halfHeight];
    const bottomRight = [x + halfWidth, y + halfHeight];
    if (angle !== 0) {
      _rotate(topLeft, center, angle, topLeft);
      _rotate(topRight, center, angle, topRight);
      _rotate(bottomLeft, center, angle, bottomLeft);
      _rotate(bottomRight, center, angle, bottomRight);
    }
    let i = node.data.vertexCount * 6;
    node.data.vertices[i + 0] = topLeft[0];
    node.data.vertices[i + 1] = topLeft[1];
    node.data.vertices[i + 2] = color[0];
    node.data.vertices[i + 3] = color[1];
    node.data.vertices[i + 4] = color[2];
    node.data.vertices[i + 5] = color[3];
    node.data.vertices[i + 6] = bottomLeft[0];
    node.data.vertices[i + 7] = bottomLeft[1];
    node.data.vertices[i + 8] = color[0];
    node.data.vertices[i + 9] = color[1];
    node.data.vertices[i + 10] = color[2];
    node.data.vertices[i + 11] = color[3];
    node.data.vertices[i + 12] = topRight[0];
    node.data.vertices[i + 13] = topRight[1];
    node.data.vertices[i + 14] = color[0];
    node.data.vertices[i + 15] = color[1];
    node.data.vertices[i + 16] = color[2];
    node.data.vertices[i + 17] = color[3];
    node.data.vertices[i + 18] = bottomLeft[0];
    node.data.vertices[i + 19] = bottomLeft[1];
    node.data.vertices[i + 20] = color[0];
    node.data.vertices[i + 21] = color[1];
    node.data.vertices[i + 22] = color[2];
    node.data.vertices[i + 23] = color[3];
    node.data.vertices[i + 24] = bottomRight[0];
    node.data.vertices[i + 25] = bottomRight[1];
    node.data.vertices[i + 26] = color[0];
    node.data.vertices[i + 27] = color[1];
    node.data.vertices[i + 28] = color[2];
    node.data.vertices[i + 29] = color[3];
    node.data.vertices[i + 30] = topRight[0];
    node.data.vertices[i + 31] = topRight[1];
    node.data.vertices[i + 32] = color[0];
    node.data.vertices[i + 33] = color[1];
    node.data.vertices[i + 34] = color[2];
    node.data.vertices[i + 35] = color[3];
    node.data.vertexCount += 6;
    cobalt.device.queue.writeBuffer(node.data.vertexBuffer, 0, node.data.vertices.buffer);
  },
  clear: function(cobalt, node) {
    node.data.vertexCount = 0;
  }
};
function _rotate(a, b, rad, out) {
  let p0 = a[0] - b[0], p1 = a[1] - b[1], sinC = Math.sin(rad), cosC = Math.cos(rad);
  out[0] = p0 * cosC - p1 * sinC + b[0];
  out[1] = p0 * sinC + p1 * cosC + b[1];
  return out;
}

// src/primitives/primitives.js
var _tmpVec33 = vec3.create(0, 0, 0);
var primitives_default2 = {
  type: "cobalt:primitives",
  refs: [
    { name: "color", type: "textView", format: "rgba8unorm", access: "write" }
  ],
  // cobalt event handling functions
  // @params Object cobalt renderer world object
  // @params Object options optional data passed when initing this node
  onInit: async function(cobalt, options = {}) {
    return init8(cobalt, options);
  },
  onRun: function(cobalt, node, webGpuCommandEncoder) {
    draw8(cobalt, node, webGpuCommandEncoder);
  },
  onDestroy: function(cobalt, node) {
    destroy6(node);
  },
  onResize: function(cobalt, node) {
    _writeMatricesBuffer(cobalt, node);
  },
  onViewportPosition: function(cobalt, node) {
    _writeMatricesBuffer(cobalt, node);
  },
  // optional
  customFunctions: api_default
};
async function init8(cobalt, node) {
  const { device } = cobalt;
  const vertices = new Float32Array(1e4);
  const vertexBuffer = device.createBuffer({
    size: vertices.byteLength,
    usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST
    //mappedAtCreation: true,
  });
  const uniformBuffer = device.createBuffer({
    size: 64 * 2,
    // 4x4 matrix with 4 bytes per float32, times 2 matrices (view, projection)
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
  });
  const shaderModule = device.createShaderModule({
    code: primitives_default
  });
  const bindGroupLayout = device.createBindGroupLayout({
    entries: [
      {
        binding: 0,
        visibility: GPUShaderStage.VERTEX,
        buffer: {}
      }
    ]
  });
  const pipelineLayout = device.createPipelineLayout({
    bindGroupLayouts: [bindGroupLayout]
  });
  const bindGroup = device.createBindGroup({
    layout: bindGroupLayout,
    entries: [
      {
        binding: 0,
        resource: {
          buffer: uniformBuffer
        }
      }
    ]
  });
  const pipeline = device.createRenderPipeline({
    layout: pipelineLayout,
    vertex: {
      module: shaderModule,
      entryPoint: "vs_main",
      buffers: [{
        arrayStride: 6 * Float32Array.BYTES_PER_ELEMENT,
        // 2 floats per vertex position + 4 floats per vertex color
        //stepMode: 'vertex',
        attributes: [
          // position
          {
            shaderLocation: 0,
            offset: 0,
            format: "float32x2"
          },
          // color
          {
            shaderLocation: 1,
            format: "float32x4",
            offset: 8
          }
        ]
      }]
    },
    fragment: {
      module: shaderModule,
      entryPoint: "fs_main",
      targets: [
        {
          format: "bgra8unorm",
          blend: {
            color: {
              srcFactor: "src-alpha",
              dstFactor: "one-minus-src-alpha"
            },
            alpha: {
              srcFactor: "zero",
              dstFactor: "one"
            }
          }
        }
      ]
    },
    primitive: {
      topology: "triangle-list"
    }
  });
  return {
    uniformBuffer,
    // perspective and view matrices for the camera
    vertexBuffer,
    pipeline,
    bindGroup,
    // triangle data used to render the primitives
    vertexCount: 0,
    vertices
    // x, y, x, y, ...
  };
}
function draw8(cobalt, node, commandEncoder) {
  if (node.data.vertexCount === 0)
    return;
  const { device } = cobalt;
  const loadOp = node.options.loadOp || "load";
  const renderpass = commandEncoder.beginRenderPass({
    colorAttachments: [
      // color
      {
        view: node.refs.color,
        //node.refs.color.data.view,
        clearValue: cobalt.clearValue,
        loadOp,
        storeOp: "store"
      }
    ]
  });
  renderpass.setPipeline(node.data.pipeline);
  renderpass.setBindGroup(0, node.data.bindGroup);
  renderpass.setVertexBuffer(0, node.data.vertexBuffer);
  renderpass.draw(node.data.vertexCount);
  renderpass.end();
}
function destroy6(node) {
  node.data.vertexBuffer.destroy();
  node.data.vertexBuffer = null;
  node.data.uniformBuffer.destroy();
  node.data.uniformBuffer = null;
}
function _writeMatricesBuffer(cobalt, node) {
  const { device } = cobalt;
  const GAME_WIDTH = cobalt.viewport.width / cobalt.viewport.zoom;
  const GAME_HEIGHT = cobalt.viewport.height / cobalt.viewport.zoom;
  const projection = mat4.ortho(0, GAME_WIDTH, GAME_HEIGHT, 0, -10, 10);
  vec3.set(-cobalt.viewport.position[0], -cobalt.viewport.position[1], 0, _tmpVec33);
  const view = mat4.translation(_tmpVec33);
  device.queue.writeBuffer(node.data.uniformBuffer, 0, view.buffer);
  device.queue.writeBuffer(node.data.uniformBuffer, 64, projection.buffer);
}

// src/light/public-api.js
var public_api_exports = {};
__export(public_api_exports, {
  addLight: () => addLight,
  removeLight: () => removeLight
});
function addLight(cobalt, node, position) {
  node.data.lights.push({
    id: _uuid(),
    position: vec2.clone(position),
    size: 50,
    color: [1, 0.5, 0.5],
    intensity: 1,
    attenuationLinear: 0,
    attenuationExp: 7
  });
}
function removeLight(cobalt, node, lightId) {
  const light = node.data.lights.find((L) => L.id === lightId);
  const lightIdx = node.data.lights.indexOf(light);
  if (lightIdx < 0)
    return;
  node.data.lights.removeItem(lightIdx);
}

// node_modules/wgpu-matrix/dist/3.x/wgpu-matrix.module.js
function wrapConstructor2(OriginalConstructor, modifier) {
  return class extends OriginalConstructor {
    constructor(...args) {
      super(...args);
      modifier(this);
    }
  };
}
var ZeroArray2 = wrapConstructor2(Array, (a) => a.fill(0));
var EPSILON2 = 1e-6;
function getAPIImpl$52(Ctor) {
  function create(x = 0, y = 0) {
    const newDst = new Ctor(2);
    if (x !== void 0) {
      newDst[0] = x;
      if (y !== void 0) {
        newDst[1] = y;
      }
    }
    return newDst;
  }
  const fromValues = create;
  function set(x, y, dst) {
    const newDst = dst ?? new Ctor(2);
    newDst[0] = x;
    newDst[1] = y;
    return newDst;
  }
  function ceil(v, dst) {
    const newDst = dst ?? new Ctor(2);
    newDst[0] = Math.ceil(v[0]);
    newDst[1] = Math.ceil(v[1]);
    return newDst;
  }
  function floor(v, dst) {
    const newDst = dst ?? new Ctor(2);
    newDst[0] = Math.floor(v[0]);
    newDst[1] = Math.floor(v[1]);
    return newDst;
  }
  function round(v, dst) {
    const newDst = dst ?? new Ctor(2);
    newDst[0] = Math.round(v[0]);
    newDst[1] = Math.round(v[1]);
    return newDst;
  }
  function clamp(v, min2 = 0, max2 = 1, dst) {
    const newDst = dst ?? new Ctor(2);
    newDst[0] = Math.min(max2, Math.max(min2, v[0]));
    newDst[1] = Math.min(max2, Math.max(min2, v[1]));
    return newDst;
  }
  function add(a, b, dst) {
    const newDst = dst ?? new Ctor(2);
    newDst[0] = a[0] + b[0];
    newDst[1] = a[1] + b[1];
    return newDst;
  }
  function addScaled(a, b, scale2, dst) {
    const newDst = dst ?? new Ctor(2);
    newDst[0] = a[0] + b[0] * scale2;
    newDst[1] = a[1] + b[1] * scale2;
    return newDst;
  }
  function angle(a, b) {
    const ax = a[0];
    const ay = a[1];
    const bx = b[0];
    const by = b[1];
    const mag1 = Math.sqrt(ax * ax + ay * ay);
    const mag2 = Math.sqrt(bx * bx + by * by);
    const mag = mag1 * mag2;
    const cosine = mag && dot(a, b) / mag;
    return Math.acos(cosine);
  }
  function subtract(a, b, dst) {
    const newDst = dst ?? new Ctor(2);
    newDst[0] = a[0] - b[0];
    newDst[1] = a[1] - b[1];
    return newDst;
  }
  const sub = subtract;
  function equalsApproximately(a, b) {
    return Math.abs(a[0] - b[0]) < EPSILON2 && Math.abs(a[1] - b[1]) < EPSILON2;
  }
  function equals(a, b) {
    return a[0] === b[0] && a[1] === b[1];
  }
  function lerp(a, b, t, dst) {
    const newDst = dst ?? new Ctor(2);
    newDst[0] = a[0] + t * (b[0] - a[0]);
    newDst[1] = a[1] + t * (b[1] - a[1]);
    return newDst;
  }
  function lerpV(a, b, t, dst) {
    const newDst = dst ?? new Ctor(2);
    newDst[0] = a[0] + t[0] * (b[0] - a[0]);
    newDst[1] = a[1] + t[1] * (b[1] - a[1]);
    return newDst;
  }
  function max(a, b, dst) {
    const newDst = dst ?? new Ctor(2);
    newDst[0] = Math.max(a[0], b[0]);
    newDst[1] = Math.max(a[1], b[1]);
    return newDst;
  }
  function min(a, b, dst) {
    const newDst = dst ?? new Ctor(2);
    newDst[0] = Math.min(a[0], b[0]);
    newDst[1] = Math.min(a[1], b[1]);
    return newDst;
  }
  function mulScalar(v, k, dst) {
    const newDst = dst ?? new Ctor(2);
    newDst[0] = v[0] * k;
    newDst[1] = v[1] * k;
    return newDst;
  }
  const scale = mulScalar;
  function divScalar(v, k, dst) {
    const newDst = dst ?? new Ctor(2);
    newDst[0] = v[0] / k;
    newDst[1] = v[1] / k;
    return newDst;
  }
  function inverse(v, dst) {
    const newDst = dst ?? new Ctor(2);
    newDst[0] = 1 / v[0];
    newDst[1] = 1 / v[1];
    return newDst;
  }
  const invert = inverse;
  function cross(a, b, dst) {
    const newDst = dst ?? new Ctor(3);
    const z = a[0] * b[1] - a[1] * b[0];
    newDst[0] = 0;
    newDst[1] = 0;
    newDst[2] = z;
    return newDst;
  }
  function dot(a, b) {
    return a[0] * b[0] + a[1] * b[1];
  }
  function length(v) {
    const v0 = v[0];
    const v1 = v[1];
    return Math.sqrt(v0 * v0 + v1 * v1);
  }
  const len = length;
  function lengthSq(v) {
    const v0 = v[0];
    const v1 = v[1];
    return v0 * v0 + v1 * v1;
  }
  const lenSq = lengthSq;
  function distance(a, b) {
    const dx = a[0] - b[0];
    const dy = a[1] - b[1];
    return Math.sqrt(dx * dx + dy * dy);
  }
  const dist = distance;
  function distanceSq(a, b) {
    const dx = a[0] - b[0];
    const dy = a[1] - b[1];
    return dx * dx + dy * dy;
  }
  const distSq = distanceSq;
  function normalize(v, dst) {
    const newDst = dst ?? new Ctor(2);
    const v0 = v[0];
    const v1 = v[1];
    const len2 = Math.sqrt(v0 * v0 + v1 * v1);
    if (len2 > 1e-5) {
      newDst[0] = v0 / len2;
      newDst[1] = v1 / len2;
    } else {
      newDst[0] = 0;
      newDst[1] = 0;
    }
    return newDst;
  }
  function negate(v, dst) {
    const newDst = dst ?? new Ctor(2);
    newDst[0] = -v[0];
    newDst[1] = -v[1];
    return newDst;
  }
  function copy(v, dst) {
    const newDst = dst ?? new Ctor(2);
    newDst[0] = v[0];
    newDst[1] = v[1];
    return newDst;
  }
  const clone = copy;
  function multiply(a, b, dst) {
    const newDst = dst ?? new Ctor(2);
    newDst[0] = a[0] * b[0];
    newDst[1] = a[1] * b[1];
    return newDst;
  }
  const mul = multiply;
  function divide(a, b, dst) {
    const newDst = dst ?? new Ctor(2);
    newDst[0] = a[0] / b[0];
    newDst[1] = a[1] / b[1];
    return newDst;
  }
  const div = divide;
  function random(scale2 = 1, dst) {
    const newDst = dst ?? new Ctor(2);
    const angle2 = Math.random() * 2 * Math.PI;
    newDst[0] = Math.cos(angle2) * scale2;
    newDst[1] = Math.sin(angle2) * scale2;
    return newDst;
  }
  function zero(dst) {
    const newDst = dst ?? new Ctor(2);
    newDst[0] = 0;
    newDst[1] = 0;
    return newDst;
  }
  function transformMat4(v, m, dst) {
    const newDst = dst ?? new Ctor(2);
    const x = v[0];
    const y = v[1];
    newDst[0] = x * m[0] + y * m[4] + m[12];
    newDst[1] = x * m[1] + y * m[5] + m[13];
    return newDst;
  }
  function transformMat3(v, m, dst) {
    const newDst = dst ?? new Ctor(2);
    const x = v[0];
    const y = v[1];
    newDst[0] = m[0] * x + m[4] * y + m[8];
    newDst[1] = m[1] * x + m[5] * y + m[9];
    return newDst;
  }
  function rotate(a, b, rad, dst) {
    const newDst = dst ?? new Ctor(2);
    const p0 = a[0] - b[0];
    const p1 = a[1] - b[1];
    const sinC = Math.sin(rad);
    const cosC = Math.cos(rad);
    newDst[0] = p0 * cosC - p1 * sinC + b[0];
    newDst[1] = p0 * sinC + p1 * cosC + b[1];
    return newDst;
  }
  function setLength(a, len2, dst) {
    const newDst = dst ?? new Ctor(2);
    normalize(a, newDst);
    return mulScalar(newDst, len2, newDst);
  }
  function truncate(a, maxLen, dst) {
    const newDst = dst ?? new Ctor(2);
    if (length(a) > maxLen) {
      return setLength(a, maxLen, newDst);
    }
    return copy(a, newDst);
  }
  function midpoint(a, b, dst) {
    const newDst = dst ?? new Ctor(2);
    return lerp(a, b, 0.5, newDst);
  }
  return {
    create,
    fromValues,
    set,
    ceil,
    floor,
    round,
    clamp,
    add,
    addScaled,
    angle,
    subtract,
    sub,
    equalsApproximately,
    equals,
    lerp,
    lerpV,
    max,
    min,
    mulScalar,
    scale,
    divScalar,
    inverse,
    invert,
    cross,
    dot,
    length,
    len,
    lengthSq,
    lenSq,
    distance,
    dist,
    distanceSq,
    distSq,
    normalize,
    negate,
    copy,
    clone,
    multiply,
    mul,
    divide,
    div,
    random,
    zero,
    transformMat4,
    transformMat3,
    rotate,
    setLength,
    truncate,
    midpoint
  };
}
var cache$52 = /* @__PURE__ */ new Map();
function getAPI$52(Ctor) {
  let api = cache$52.get(Ctor);
  if (!api) {
    api = getAPIImpl$52(Ctor);
    cache$52.set(Ctor, api);
  }
  return api;
}
function getAPIImpl$42(Ctor) {
  const vec23 = getAPI$52(Ctor);
  function create(v0, v1, v2, v3, v4, v5, v6, v7, v8) {
    const newDst = new Ctor(12);
    newDst[3] = 0;
    newDst[7] = 0;
    newDst[11] = 0;
    if (v0 !== void 0) {
      newDst[0] = v0;
      if (v1 !== void 0) {
        newDst[1] = v1;
        if (v2 !== void 0) {
          newDst[2] = v2;
          if (v3 !== void 0) {
            newDst[4] = v3;
            if (v4 !== void 0) {
              newDst[5] = v4;
              if (v5 !== void 0) {
                newDst[6] = v5;
                if (v6 !== void 0) {
                  newDst[8] = v6;
                  if (v7 !== void 0) {
                    newDst[9] = v7;
                    if (v8 !== void 0) {
                      newDst[10] = v8;
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
    return newDst;
  }
  function set(v0, v1, v2, v3, v4, v5, v6, v7, v8, dst) {
    const newDst = dst ?? new Ctor(12);
    newDst[0] = v0;
    newDst[1] = v1;
    newDst[2] = v2;
    newDst[3] = 0;
    newDst[4] = v3;
    newDst[5] = v4;
    newDst[6] = v5;
    newDst[7] = 0;
    newDst[8] = v6;
    newDst[9] = v7;
    newDst[10] = v8;
    newDst[11] = 0;
    return newDst;
  }
  function fromMat4(m4, dst) {
    const newDst = dst ?? new Ctor(12);
    newDst[0] = m4[0];
    newDst[1] = m4[1];
    newDst[2] = m4[2];
    newDst[3] = 0;
    newDst[4] = m4[4];
    newDst[5] = m4[5];
    newDst[6] = m4[6];
    newDst[7] = 0;
    newDst[8] = m4[8];
    newDst[9] = m4[9];
    newDst[10] = m4[10];
    newDst[11] = 0;
    return newDst;
  }
  function fromQuat(q, dst) {
    const newDst = dst ?? new Ctor(12);
    const x = q[0];
    const y = q[1];
    const z = q[2];
    const w = q[3];
    const x2 = x + x;
    const y2 = y + y;
    const z2 = z + z;
    const xx = x * x2;
    const yx = y * x2;
    const yy = y * y2;
    const zx = z * x2;
    const zy = z * y2;
    const zz = z * z2;
    const wx = w * x2;
    const wy = w * y2;
    const wz = w * z2;
    newDst[0] = 1 - yy - zz;
    newDst[1] = yx + wz;
    newDst[2] = zx - wy;
    newDst[3] = 0;
    newDst[4] = yx - wz;
    newDst[5] = 1 - xx - zz;
    newDst[6] = zy + wx;
    newDst[7] = 0;
    newDst[8] = zx + wy;
    newDst[9] = zy - wx;
    newDst[10] = 1 - xx - yy;
    newDst[11] = 0;
    return newDst;
  }
  function negate(m, dst) {
    const newDst = dst ?? new Ctor(12);
    newDst[0] = -m[0];
    newDst[1] = -m[1];
    newDst[2] = -m[2];
    newDst[4] = -m[4];
    newDst[5] = -m[5];
    newDst[6] = -m[6];
    newDst[8] = -m[8];
    newDst[9] = -m[9];
    newDst[10] = -m[10];
    return newDst;
  }
  function copy(m, dst) {
    const newDst = dst ?? new Ctor(12);
    newDst[0] = m[0];
    newDst[1] = m[1];
    newDst[2] = m[2];
    newDst[4] = m[4];
    newDst[5] = m[5];
    newDst[6] = m[6];
    newDst[8] = m[8];
    newDst[9] = m[9];
    newDst[10] = m[10];
    return newDst;
  }
  const clone = copy;
  function equalsApproximately(a, b) {
    return Math.abs(a[0] - b[0]) < EPSILON2 && Math.abs(a[1] - b[1]) < EPSILON2 && Math.abs(a[2] - b[2]) < EPSILON2 && Math.abs(a[4] - b[4]) < EPSILON2 && Math.abs(a[5] - b[5]) < EPSILON2 && Math.abs(a[6] - b[6]) < EPSILON2 && Math.abs(a[8] - b[8]) < EPSILON2 && Math.abs(a[9] - b[9]) < EPSILON2 && Math.abs(a[10] - b[10]) < EPSILON2;
  }
  function equals(a, b) {
    return a[0] === b[0] && a[1] === b[1] && a[2] === b[2] && a[4] === b[4] && a[5] === b[5] && a[6] === b[6] && a[8] === b[8] && a[9] === b[9] && a[10] === b[10];
  }
  function identity(dst) {
    const newDst = dst ?? new Ctor(12);
    newDst[0] = 1;
    newDst[1] = 0;
    newDst[2] = 0;
    newDst[4] = 0;
    newDst[5] = 1;
    newDst[6] = 0;
    newDst[8] = 0;
    newDst[9] = 0;
    newDst[10] = 1;
    return newDst;
  }
  function transpose(m, dst) {
    const newDst = dst ?? new Ctor(12);
    if (newDst === m) {
      let t;
      t = m[1];
      m[1] = m[4];
      m[4] = t;
      t = m[2];
      m[2] = m[8];
      m[8] = t;
      t = m[6];
      m[6] = m[9];
      m[9] = t;
      return newDst;
    }
    const m00 = m[0 * 4 + 0];
    const m01 = m[0 * 4 + 1];
    const m02 = m[0 * 4 + 2];
    const m10 = m[1 * 4 + 0];
    const m11 = m[1 * 4 + 1];
    const m12 = m[1 * 4 + 2];
    const m20 = m[2 * 4 + 0];
    const m21 = m[2 * 4 + 1];
    const m22 = m[2 * 4 + 2];
    newDst[0] = m00;
    newDst[1] = m10;
    newDst[2] = m20;
    newDst[4] = m01;
    newDst[5] = m11;
    newDst[6] = m21;
    newDst[8] = m02;
    newDst[9] = m12;
    newDst[10] = m22;
    return newDst;
  }
  function inverse(m, dst) {
    const newDst = dst ?? new Ctor(12);
    const m00 = m[0 * 4 + 0];
    const m01 = m[0 * 4 + 1];
    const m02 = m[0 * 4 + 2];
    const m10 = m[1 * 4 + 0];
    const m11 = m[1 * 4 + 1];
    const m12 = m[1 * 4 + 2];
    const m20 = m[2 * 4 + 0];
    const m21 = m[2 * 4 + 1];
    const m22 = m[2 * 4 + 2];
    const b01 = m22 * m11 - m12 * m21;
    const b11 = -m22 * m10 + m12 * m20;
    const b21 = m21 * m10 - m11 * m20;
    const invDet = 1 / (m00 * b01 + m01 * b11 + m02 * b21);
    newDst[0] = b01 * invDet;
    newDst[1] = (-m22 * m01 + m02 * m21) * invDet;
    newDst[2] = (m12 * m01 - m02 * m11) * invDet;
    newDst[4] = b11 * invDet;
    newDst[5] = (m22 * m00 - m02 * m20) * invDet;
    newDst[6] = (-m12 * m00 + m02 * m10) * invDet;
    newDst[8] = b21 * invDet;
    newDst[9] = (-m21 * m00 + m01 * m20) * invDet;
    newDst[10] = (m11 * m00 - m01 * m10) * invDet;
    return newDst;
  }
  function determinant(m) {
    const m00 = m[0 * 4 + 0];
    const m01 = m[0 * 4 + 1];
    const m02 = m[0 * 4 + 2];
    const m10 = m[1 * 4 + 0];
    const m11 = m[1 * 4 + 1];
    const m12 = m[1 * 4 + 2];
    const m20 = m[2 * 4 + 0];
    const m21 = m[2 * 4 + 1];
    const m22 = m[2 * 4 + 2];
    return m00 * (m11 * m22 - m21 * m12) - m10 * (m01 * m22 - m21 * m02) + m20 * (m01 * m12 - m11 * m02);
  }
  const invert = inverse;
  function multiply(a, b, dst) {
    const newDst = dst ?? new Ctor(12);
    const a00 = a[0];
    const a01 = a[1];
    const a02 = a[2];
    const a10 = a[4 + 0];
    const a11 = a[4 + 1];
    const a12 = a[4 + 2];
    const a20 = a[8 + 0];
    const a21 = a[8 + 1];
    const a22 = a[8 + 2];
    const b00 = b[0];
    const b01 = b[1];
    const b02 = b[2];
    const b10 = b[4 + 0];
    const b11 = b[4 + 1];
    const b12 = b[4 + 2];
    const b20 = b[8 + 0];
    const b21 = b[8 + 1];
    const b22 = b[8 + 2];
    newDst[0] = a00 * b00 + a10 * b01 + a20 * b02;
    newDst[1] = a01 * b00 + a11 * b01 + a21 * b02;
    newDst[2] = a02 * b00 + a12 * b01 + a22 * b02;
    newDst[4] = a00 * b10 + a10 * b11 + a20 * b12;
    newDst[5] = a01 * b10 + a11 * b11 + a21 * b12;
    newDst[6] = a02 * b10 + a12 * b11 + a22 * b12;
    newDst[8] = a00 * b20 + a10 * b21 + a20 * b22;
    newDst[9] = a01 * b20 + a11 * b21 + a21 * b22;
    newDst[10] = a02 * b20 + a12 * b21 + a22 * b22;
    return newDst;
  }
  const mul = multiply;
  function setTranslation(a, v, dst) {
    const newDst = dst ?? identity();
    if (a !== newDst) {
      newDst[0] = a[0];
      newDst[1] = a[1];
      newDst[2] = a[2];
      newDst[4] = a[4];
      newDst[5] = a[5];
      newDst[6] = a[6];
    }
    newDst[8] = v[0];
    newDst[9] = v[1];
    newDst[10] = 1;
    return newDst;
  }
  function getTranslation(m, dst) {
    const newDst = dst ?? vec23.create();
    newDst[0] = m[8];
    newDst[1] = m[9];
    return newDst;
  }
  function getAxis(m, axis, dst) {
    const newDst = dst ?? vec23.create();
    const off = axis * 4;
    newDst[0] = m[off + 0];
    newDst[1] = m[off + 1];
    return newDst;
  }
  function setAxis(m, v, axis, dst) {
    const newDst = dst === m ? m : copy(m, dst);
    const off = axis * 4;
    newDst[off + 0] = v[0];
    newDst[off + 1] = v[1];
    return newDst;
  }
  function getScaling(m, dst) {
    const newDst = dst ?? vec23.create();
    const xx = m[0];
    const xy = m[1];
    const yx = m[4];
    const yy = m[5];
    newDst[0] = Math.sqrt(xx * xx + xy * xy);
    newDst[1] = Math.sqrt(yx * yx + yy * yy);
    return newDst;
  }
  function translation(v, dst) {
    const newDst = dst ?? new Ctor(12);
    newDst[0] = 1;
    newDst[1] = 0;
    newDst[2] = 0;
    newDst[4] = 0;
    newDst[5] = 1;
    newDst[6] = 0;
    newDst[8] = v[0];
    newDst[9] = v[1];
    newDst[10] = 1;
    return newDst;
  }
  function translate(m, v, dst) {
    const newDst = dst ?? new Ctor(12);
    const v0 = v[0];
    const v1 = v[1];
    const m00 = m[0];
    const m01 = m[1];
    const m02 = m[2];
    const m10 = m[1 * 4 + 0];
    const m11 = m[1 * 4 + 1];
    const m12 = m[1 * 4 + 2];
    const m20 = m[2 * 4 + 0];
    const m21 = m[2 * 4 + 1];
    const m22 = m[2 * 4 + 2];
    if (m !== newDst) {
      newDst[0] = m00;
      newDst[1] = m01;
      newDst[2] = m02;
      newDst[4] = m10;
      newDst[5] = m11;
      newDst[6] = m12;
    }
    newDst[8] = m00 * v0 + m10 * v1 + m20;
    newDst[9] = m01 * v0 + m11 * v1 + m21;
    newDst[10] = m02 * v0 + m12 * v1 + m22;
    return newDst;
  }
  function rotation(angleInRadians, dst) {
    const newDst = dst ?? new Ctor(12);
    const c = Math.cos(angleInRadians);
    const s = Math.sin(angleInRadians);
    newDst[0] = c;
    newDst[1] = s;
    newDst[2] = 0;
    newDst[4] = -s;
    newDst[5] = c;
    newDst[6] = 0;
    newDst[8] = 0;
    newDst[9] = 0;
    newDst[10] = 1;
    return newDst;
  }
  function rotate(m, angleInRadians, dst) {
    const newDst = dst ?? new Ctor(12);
    const m00 = m[0 * 4 + 0];
    const m01 = m[0 * 4 + 1];
    const m02 = m[0 * 4 + 2];
    const m10 = m[1 * 4 + 0];
    const m11 = m[1 * 4 + 1];
    const m12 = m[1 * 4 + 2];
    const c = Math.cos(angleInRadians);
    const s = Math.sin(angleInRadians);
    newDst[0] = c * m00 + s * m10;
    newDst[1] = c * m01 + s * m11;
    newDst[2] = c * m02 + s * m12;
    newDst[4] = c * m10 - s * m00;
    newDst[5] = c * m11 - s * m01;
    newDst[6] = c * m12 - s * m02;
    if (m !== newDst) {
      newDst[8] = m[8];
      newDst[9] = m[9];
      newDst[10] = m[10];
    }
    return newDst;
  }
  function scaling(v, dst) {
    const newDst = dst ?? new Ctor(12);
    newDst[0] = v[0];
    newDst[1] = 0;
    newDst[2] = 0;
    newDst[4] = 0;
    newDst[5] = v[1];
    newDst[6] = 0;
    newDst[8] = 0;
    newDst[9] = 0;
    newDst[10] = 1;
    return newDst;
  }
  function scale(m, v, dst) {
    const newDst = dst ?? new Ctor(12);
    const v0 = v[0];
    const v1 = v[1];
    newDst[0] = v0 * m[0 * 4 + 0];
    newDst[1] = v0 * m[0 * 4 + 1];
    newDst[2] = v0 * m[0 * 4 + 2];
    newDst[4] = v1 * m[1 * 4 + 0];
    newDst[5] = v1 * m[1 * 4 + 1];
    newDst[6] = v1 * m[1 * 4 + 2];
    if (m !== newDst) {
      newDst[8] = m[8];
      newDst[9] = m[9];
      newDst[10] = m[10];
    }
    return newDst;
  }
  function uniformScaling(s, dst) {
    const newDst = dst ?? new Ctor(12);
    newDst[0] = s;
    newDst[1] = 0;
    newDst[2] = 0;
    newDst[4] = 0;
    newDst[5] = s;
    newDst[6] = 0;
    newDst[8] = 0;
    newDst[9] = 0;
    newDst[10] = 1;
    return newDst;
  }
  function uniformScale(m, s, dst) {
    const newDst = dst ?? new Ctor(12);
    newDst[0] = s * m[0 * 4 + 0];
    newDst[1] = s * m[0 * 4 + 1];
    newDst[2] = s * m[0 * 4 + 2];
    newDst[4] = s * m[1 * 4 + 0];
    newDst[5] = s * m[1 * 4 + 1];
    newDst[6] = s * m[1 * 4 + 2];
    if (m !== newDst) {
      newDst[8] = m[8];
      newDst[9] = m[9];
      newDst[10] = m[10];
    }
    return newDst;
  }
  return {
    clone,
    create,
    set,
    fromMat4,
    fromQuat,
    negate,
    copy,
    equalsApproximately,
    equals,
    identity,
    transpose,
    inverse,
    invert,
    determinant,
    mul,
    multiply,
    setTranslation,
    getTranslation,
    getAxis,
    setAxis,
    getScaling,
    translation,
    translate,
    rotation,
    rotate,
    scaling,
    scale,
    uniformScaling,
    uniformScale
  };
}
var cache$42 = /* @__PURE__ */ new Map();
function getAPI$42(Ctor) {
  let api = cache$42.get(Ctor);
  if (!api) {
    api = getAPIImpl$42(Ctor);
    cache$42.set(Ctor, api);
  }
  return api;
}
function getAPIImpl$32(Ctor) {
  function create(x, y, z) {
    const newDst = new Ctor(3);
    if (x !== void 0) {
      newDst[0] = x;
      if (y !== void 0) {
        newDst[1] = y;
        if (z !== void 0) {
          newDst[2] = z;
        }
      }
    }
    return newDst;
  }
  const fromValues = create;
  function set(x, y, z, dst) {
    const newDst = dst ?? new Ctor(3);
    newDst[0] = x;
    newDst[1] = y;
    newDst[2] = z;
    return newDst;
  }
  function ceil(v, dst) {
    const newDst = dst ?? new Ctor(3);
    newDst[0] = Math.ceil(v[0]);
    newDst[1] = Math.ceil(v[1]);
    newDst[2] = Math.ceil(v[2]);
    return newDst;
  }
  function floor(v, dst) {
    const newDst = dst ?? new Ctor(3);
    newDst[0] = Math.floor(v[0]);
    newDst[1] = Math.floor(v[1]);
    newDst[2] = Math.floor(v[2]);
    return newDst;
  }
  function round(v, dst) {
    const newDst = dst ?? new Ctor(3);
    newDst[0] = Math.round(v[0]);
    newDst[1] = Math.round(v[1]);
    newDst[2] = Math.round(v[2]);
    return newDst;
  }
  function clamp(v, min2 = 0, max2 = 1, dst) {
    const newDst = dst ?? new Ctor(3);
    newDst[0] = Math.min(max2, Math.max(min2, v[0]));
    newDst[1] = Math.min(max2, Math.max(min2, v[1]));
    newDst[2] = Math.min(max2, Math.max(min2, v[2]));
    return newDst;
  }
  function add(a, b, dst) {
    const newDst = dst ?? new Ctor(3);
    newDst[0] = a[0] + b[0];
    newDst[1] = a[1] + b[1];
    newDst[2] = a[2] + b[2];
    return newDst;
  }
  function addScaled(a, b, scale2, dst) {
    const newDst = dst ?? new Ctor(3);
    newDst[0] = a[0] + b[0] * scale2;
    newDst[1] = a[1] + b[1] * scale2;
    newDst[2] = a[2] + b[2] * scale2;
    return newDst;
  }
  function angle(a, b) {
    const ax = a[0];
    const ay = a[1];
    const az = a[2];
    const bx = b[0];
    const by = b[1];
    const bz = b[2];
    const mag1 = Math.sqrt(ax * ax + ay * ay + az * az);
    const mag2 = Math.sqrt(bx * bx + by * by + bz * bz);
    const mag = mag1 * mag2;
    const cosine = mag && dot(a, b) / mag;
    return Math.acos(cosine);
  }
  function subtract(a, b, dst) {
    const newDst = dst ?? new Ctor(3);
    newDst[0] = a[0] - b[0];
    newDst[1] = a[1] - b[1];
    newDst[2] = a[2] - b[2];
    return newDst;
  }
  const sub = subtract;
  function equalsApproximately(a, b) {
    return Math.abs(a[0] - b[0]) < EPSILON2 && Math.abs(a[1] - b[1]) < EPSILON2 && Math.abs(a[2] - b[2]) < EPSILON2;
  }
  function equals(a, b) {
    return a[0] === b[0] && a[1] === b[1] && a[2] === b[2];
  }
  function lerp(a, b, t, dst) {
    const newDst = dst ?? new Ctor(3);
    newDst[0] = a[0] + t * (b[0] - a[0]);
    newDst[1] = a[1] + t * (b[1] - a[1]);
    newDst[2] = a[2] + t * (b[2] - a[2]);
    return newDst;
  }
  function lerpV(a, b, t, dst) {
    const newDst = dst ?? new Ctor(3);
    newDst[0] = a[0] + t[0] * (b[0] - a[0]);
    newDst[1] = a[1] + t[1] * (b[1] - a[1]);
    newDst[2] = a[2] + t[2] * (b[2] - a[2]);
    return newDst;
  }
  function max(a, b, dst) {
    const newDst = dst ?? new Ctor(3);
    newDst[0] = Math.max(a[0], b[0]);
    newDst[1] = Math.max(a[1], b[1]);
    newDst[2] = Math.max(a[2], b[2]);
    return newDst;
  }
  function min(a, b, dst) {
    const newDst = dst ?? new Ctor(3);
    newDst[0] = Math.min(a[0], b[0]);
    newDst[1] = Math.min(a[1], b[1]);
    newDst[2] = Math.min(a[2], b[2]);
    return newDst;
  }
  function mulScalar(v, k, dst) {
    const newDst = dst ?? new Ctor(3);
    newDst[0] = v[0] * k;
    newDst[1] = v[1] * k;
    newDst[2] = v[2] * k;
    return newDst;
  }
  const scale = mulScalar;
  function divScalar(v, k, dst) {
    const newDst = dst ?? new Ctor(3);
    newDst[0] = v[0] / k;
    newDst[1] = v[1] / k;
    newDst[2] = v[2] / k;
    return newDst;
  }
  function inverse(v, dst) {
    const newDst = dst ?? new Ctor(3);
    newDst[0] = 1 / v[0];
    newDst[1] = 1 / v[1];
    newDst[2] = 1 / v[2];
    return newDst;
  }
  const invert = inverse;
  function cross(a, b, dst) {
    const newDst = dst ?? new Ctor(3);
    const t1 = a[2] * b[0] - a[0] * b[2];
    const t2 = a[0] * b[1] - a[1] * b[0];
    newDst[0] = a[1] * b[2] - a[2] * b[1];
    newDst[1] = t1;
    newDst[2] = t2;
    return newDst;
  }
  function dot(a, b) {
    return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  }
  function length(v) {
    const v0 = v[0];
    const v1 = v[1];
    const v2 = v[2];
    return Math.sqrt(v0 * v0 + v1 * v1 + v2 * v2);
  }
  const len = length;
  function lengthSq(v) {
    const v0 = v[0];
    const v1 = v[1];
    const v2 = v[2];
    return v0 * v0 + v1 * v1 + v2 * v2;
  }
  const lenSq = lengthSq;
  function distance(a, b) {
    const dx = a[0] - b[0];
    const dy = a[1] - b[1];
    const dz = a[2] - b[2];
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }
  const dist = distance;
  function distanceSq(a, b) {
    const dx = a[0] - b[0];
    const dy = a[1] - b[1];
    const dz = a[2] - b[2];
    return dx * dx + dy * dy + dz * dz;
  }
  const distSq = distanceSq;
  function normalize(v, dst) {
    const newDst = dst ?? new Ctor(3);
    const v0 = v[0];
    const v1 = v[1];
    const v2 = v[2];
    const len2 = Math.sqrt(v0 * v0 + v1 * v1 + v2 * v2);
    if (len2 > 1e-5) {
      newDst[0] = v0 / len2;
      newDst[1] = v1 / len2;
      newDst[2] = v2 / len2;
    } else {
      newDst[0] = 0;
      newDst[1] = 0;
      newDst[2] = 0;
    }
    return newDst;
  }
  function negate(v, dst) {
    const newDst = dst ?? new Ctor(3);
    newDst[0] = -v[0];
    newDst[1] = -v[1];
    newDst[2] = -v[2];
    return newDst;
  }
  function copy(v, dst) {
    const newDst = dst ?? new Ctor(3);
    newDst[0] = v[0];
    newDst[1] = v[1];
    newDst[2] = v[2];
    return newDst;
  }
  const clone = copy;
  function multiply(a, b, dst) {
    const newDst = dst ?? new Ctor(3);
    newDst[0] = a[0] * b[0];
    newDst[1] = a[1] * b[1];
    newDst[2] = a[2] * b[2];
    return newDst;
  }
  const mul = multiply;
  function divide(a, b, dst) {
    const newDst = dst ?? new Ctor(3);
    newDst[0] = a[0] / b[0];
    newDst[1] = a[1] / b[1];
    newDst[2] = a[2] / b[2];
    return newDst;
  }
  const div = divide;
  function random(scale2 = 1, dst) {
    const newDst = dst ?? new Ctor(3);
    const angle2 = Math.random() * 2 * Math.PI;
    const z = Math.random() * 2 - 1;
    const zScale = Math.sqrt(1 - z * z) * scale2;
    newDst[0] = Math.cos(angle2) * zScale;
    newDst[1] = Math.sin(angle2) * zScale;
    newDst[2] = z * scale2;
    return newDst;
  }
  function zero(dst) {
    const newDst = dst ?? new Ctor(3);
    newDst[0] = 0;
    newDst[1] = 0;
    newDst[2] = 0;
    return newDst;
  }
  function transformMat4(v, m, dst) {
    const newDst = dst ?? new Ctor(3);
    const x = v[0];
    const y = v[1];
    const z = v[2];
    const w = m[3] * x + m[7] * y + m[11] * z + m[15] || 1;
    newDst[0] = (m[0] * x + m[4] * y + m[8] * z + m[12]) / w;
    newDst[1] = (m[1] * x + m[5] * y + m[9] * z + m[13]) / w;
    newDst[2] = (m[2] * x + m[6] * y + m[10] * z + m[14]) / w;
    return newDst;
  }
  function transformMat4Upper3x3(v, m, dst) {
    const newDst = dst ?? new Ctor(3);
    const v0 = v[0];
    const v1 = v[1];
    const v2 = v[2];
    newDst[0] = v0 * m[0 * 4 + 0] + v1 * m[1 * 4 + 0] + v2 * m[2 * 4 + 0];
    newDst[1] = v0 * m[0 * 4 + 1] + v1 * m[1 * 4 + 1] + v2 * m[2 * 4 + 1];
    newDst[2] = v0 * m[0 * 4 + 2] + v1 * m[1 * 4 + 2] + v2 * m[2 * 4 + 2];
    return newDst;
  }
  function transformMat3(v, m, dst) {
    const newDst = dst ?? new Ctor(3);
    const x = v[0];
    const y = v[1];
    const z = v[2];
    newDst[0] = x * m[0] + y * m[4] + z * m[8];
    newDst[1] = x * m[1] + y * m[5] + z * m[9];
    newDst[2] = x * m[2] + y * m[6] + z * m[10];
    return newDst;
  }
  function transformQuat(v, q, dst) {
    const newDst = dst ?? new Ctor(3);
    const qx = q[0];
    const qy = q[1];
    const qz = q[2];
    const w2 = q[3] * 2;
    const x = v[0];
    const y = v[1];
    const z = v[2];
    const uvX = qy * z - qz * y;
    const uvY = qz * x - qx * z;
    const uvZ = qx * y - qy * x;
    newDst[0] = x + uvX * w2 + (qy * uvZ - qz * uvY) * 2;
    newDst[1] = y + uvY * w2 + (qz * uvX - qx * uvZ) * 2;
    newDst[2] = z + uvZ * w2 + (qx * uvY - qy * uvX) * 2;
    return newDst;
  }
  function getTranslation(m, dst) {
    const newDst = dst ?? new Ctor(3);
    newDst[0] = m[12];
    newDst[1] = m[13];
    newDst[2] = m[14];
    return newDst;
  }
  function getAxis(m, axis, dst) {
    const newDst = dst ?? new Ctor(3);
    const off = axis * 4;
    newDst[0] = m[off + 0];
    newDst[1] = m[off + 1];
    newDst[2] = m[off + 2];
    return newDst;
  }
  function getScaling(m, dst) {
    const newDst = dst ?? new Ctor(3);
    const xx = m[0];
    const xy = m[1];
    const xz = m[2];
    const yx = m[4];
    const yy = m[5];
    const yz = m[6];
    const zx = m[8];
    const zy = m[9];
    const zz = m[10];
    newDst[0] = Math.sqrt(xx * xx + xy * xy + xz * xz);
    newDst[1] = Math.sqrt(yx * yx + yy * yy + yz * yz);
    newDst[2] = Math.sqrt(zx * zx + zy * zy + zz * zz);
    return newDst;
  }
  function rotateX(a, b, rad, dst) {
    const newDst = dst ?? new Ctor(3);
    const p = [];
    const r = [];
    p[0] = a[0] - b[0];
    p[1] = a[1] - b[1];
    p[2] = a[2] - b[2];
    r[0] = p[0];
    r[1] = p[1] * Math.cos(rad) - p[2] * Math.sin(rad);
    r[2] = p[1] * Math.sin(rad) + p[2] * Math.cos(rad);
    newDst[0] = r[0] + b[0];
    newDst[1] = r[1] + b[1];
    newDst[2] = r[2] + b[2];
    return newDst;
  }
  function rotateY(a, b, rad, dst) {
    const newDst = dst ?? new Ctor(3);
    const p = [];
    const r = [];
    p[0] = a[0] - b[0];
    p[1] = a[1] - b[1];
    p[2] = a[2] - b[2];
    r[0] = p[2] * Math.sin(rad) + p[0] * Math.cos(rad);
    r[1] = p[1];
    r[2] = p[2] * Math.cos(rad) - p[0] * Math.sin(rad);
    newDst[0] = r[0] + b[0];
    newDst[1] = r[1] + b[1];
    newDst[2] = r[2] + b[2];
    return newDst;
  }
  function rotateZ(a, b, rad, dst) {
    const newDst = dst ?? new Ctor(3);
    const p = [];
    const r = [];
    p[0] = a[0] - b[0];
    p[1] = a[1] - b[1];
    p[2] = a[2] - b[2];
    r[0] = p[0] * Math.cos(rad) - p[1] * Math.sin(rad);
    r[1] = p[0] * Math.sin(rad) + p[1] * Math.cos(rad);
    r[2] = p[2];
    newDst[0] = r[0] + b[0];
    newDst[1] = r[1] + b[1];
    newDst[2] = r[2] + b[2];
    return newDst;
  }
  function setLength(a, len2, dst) {
    const newDst = dst ?? new Ctor(3);
    normalize(a, newDst);
    return mulScalar(newDst, len2, newDst);
  }
  function truncate(a, maxLen, dst) {
    const newDst = dst ?? new Ctor(3);
    if (length(a) > maxLen) {
      return setLength(a, maxLen, newDst);
    }
    return copy(a, newDst);
  }
  function midpoint(a, b, dst) {
    const newDst = dst ?? new Ctor(3);
    return lerp(a, b, 0.5, newDst);
  }
  return {
    create,
    fromValues,
    set,
    ceil,
    floor,
    round,
    clamp,
    add,
    addScaled,
    angle,
    subtract,
    sub,
    equalsApproximately,
    equals,
    lerp,
    lerpV,
    max,
    min,
    mulScalar,
    scale,
    divScalar,
    inverse,
    invert,
    cross,
    dot,
    length,
    len,
    lengthSq,
    lenSq,
    distance,
    dist,
    distanceSq,
    distSq,
    normalize,
    negate,
    copy,
    clone,
    multiply,
    mul,
    divide,
    div,
    random,
    zero,
    transformMat4,
    transformMat4Upper3x3,
    transformMat3,
    transformQuat,
    getTranslation,
    getAxis,
    getScaling,
    rotateX,
    rotateY,
    rotateZ,
    setLength,
    truncate,
    midpoint
  };
}
var cache$32 = /* @__PURE__ */ new Map();
function getAPI$32(Ctor) {
  let api = cache$32.get(Ctor);
  if (!api) {
    api = getAPIImpl$32(Ctor);
    cache$32.set(Ctor, api);
  }
  return api;
}
function getAPIImpl$22(Ctor) {
  const vec33 = getAPI$32(Ctor);
  function create(v0, v1, v2, v3, v4, v5, v6, v7, v8, v9, v10, v11, v12, v13, v14, v15) {
    const newDst = new Ctor(16);
    if (v0 !== void 0) {
      newDst[0] = v0;
      if (v1 !== void 0) {
        newDst[1] = v1;
        if (v2 !== void 0) {
          newDst[2] = v2;
          if (v3 !== void 0) {
            newDst[3] = v3;
            if (v4 !== void 0) {
              newDst[4] = v4;
              if (v5 !== void 0) {
                newDst[5] = v5;
                if (v6 !== void 0) {
                  newDst[6] = v6;
                  if (v7 !== void 0) {
                    newDst[7] = v7;
                    if (v8 !== void 0) {
                      newDst[8] = v8;
                      if (v9 !== void 0) {
                        newDst[9] = v9;
                        if (v10 !== void 0) {
                          newDst[10] = v10;
                          if (v11 !== void 0) {
                            newDst[11] = v11;
                            if (v12 !== void 0) {
                              newDst[12] = v12;
                              if (v13 !== void 0) {
                                newDst[13] = v13;
                                if (v14 !== void 0) {
                                  newDst[14] = v14;
                                  if (v15 !== void 0) {
                                    newDst[15] = v15;
                                  }
                                }
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
    return newDst;
  }
  function set(v0, v1, v2, v3, v4, v5, v6, v7, v8, v9, v10, v11, v12, v13, v14, v15, dst) {
    const newDst = dst ?? new Ctor(16);
    newDst[0] = v0;
    newDst[1] = v1;
    newDst[2] = v2;
    newDst[3] = v3;
    newDst[4] = v4;
    newDst[5] = v5;
    newDst[6] = v6;
    newDst[7] = v7;
    newDst[8] = v8;
    newDst[9] = v9;
    newDst[10] = v10;
    newDst[11] = v11;
    newDst[12] = v12;
    newDst[13] = v13;
    newDst[14] = v14;
    newDst[15] = v15;
    return newDst;
  }
  function fromMat3(m3, dst) {
    const newDst = dst ?? new Ctor(16);
    newDst[0] = m3[0];
    newDst[1] = m3[1];
    newDst[2] = m3[2];
    newDst[3] = 0;
    newDst[4] = m3[4];
    newDst[5] = m3[5];
    newDst[6] = m3[6];
    newDst[7] = 0;
    newDst[8] = m3[8];
    newDst[9] = m3[9];
    newDst[10] = m3[10];
    newDst[11] = 0;
    newDst[12] = 0;
    newDst[13] = 0;
    newDst[14] = 0;
    newDst[15] = 1;
    return newDst;
  }
  function fromQuat(q, dst) {
    const newDst = dst ?? new Ctor(16);
    const x = q[0];
    const y = q[1];
    const z = q[2];
    const w = q[3];
    const x2 = x + x;
    const y2 = y + y;
    const z2 = z + z;
    const xx = x * x2;
    const yx = y * x2;
    const yy = y * y2;
    const zx = z * x2;
    const zy = z * y2;
    const zz = z * z2;
    const wx = w * x2;
    const wy = w * y2;
    const wz = w * z2;
    newDst[0] = 1 - yy - zz;
    newDst[1] = yx + wz;
    newDst[2] = zx - wy;
    newDst[3] = 0;
    newDst[4] = yx - wz;
    newDst[5] = 1 - xx - zz;
    newDst[6] = zy + wx;
    newDst[7] = 0;
    newDst[8] = zx + wy;
    newDst[9] = zy - wx;
    newDst[10] = 1 - xx - yy;
    newDst[11] = 0;
    newDst[12] = 0;
    newDst[13] = 0;
    newDst[14] = 0;
    newDst[15] = 1;
    return newDst;
  }
  function negate(m, dst) {
    const newDst = dst ?? new Ctor(16);
    newDst[0] = -m[0];
    newDst[1] = -m[1];
    newDst[2] = -m[2];
    newDst[3] = -m[3];
    newDst[4] = -m[4];
    newDst[5] = -m[5];
    newDst[6] = -m[6];
    newDst[7] = -m[7];
    newDst[8] = -m[8];
    newDst[9] = -m[9];
    newDst[10] = -m[10];
    newDst[11] = -m[11];
    newDst[12] = -m[12];
    newDst[13] = -m[13];
    newDst[14] = -m[14];
    newDst[15] = -m[15];
    return newDst;
  }
  function copy(m, dst) {
    const newDst = dst ?? new Ctor(16);
    newDst[0] = m[0];
    newDst[1] = m[1];
    newDst[2] = m[2];
    newDst[3] = m[3];
    newDst[4] = m[4];
    newDst[5] = m[5];
    newDst[6] = m[6];
    newDst[7] = m[7];
    newDst[8] = m[8];
    newDst[9] = m[9];
    newDst[10] = m[10];
    newDst[11] = m[11];
    newDst[12] = m[12];
    newDst[13] = m[13];
    newDst[14] = m[14];
    newDst[15] = m[15];
    return newDst;
  }
  const clone = copy;
  function equalsApproximately(a, b) {
    return Math.abs(a[0] - b[0]) < EPSILON2 && Math.abs(a[1] - b[1]) < EPSILON2 && Math.abs(a[2] - b[2]) < EPSILON2 && Math.abs(a[3] - b[3]) < EPSILON2 && Math.abs(a[4] - b[4]) < EPSILON2 && Math.abs(a[5] - b[5]) < EPSILON2 && Math.abs(a[6] - b[6]) < EPSILON2 && Math.abs(a[7] - b[7]) < EPSILON2 && Math.abs(a[8] - b[8]) < EPSILON2 && Math.abs(a[9] - b[9]) < EPSILON2 && Math.abs(a[10] - b[10]) < EPSILON2 && Math.abs(a[11] - b[11]) < EPSILON2 && Math.abs(a[12] - b[12]) < EPSILON2 && Math.abs(a[13] - b[13]) < EPSILON2 && Math.abs(a[14] - b[14]) < EPSILON2 && Math.abs(a[15] - b[15]) < EPSILON2;
  }
  function equals(a, b) {
    return a[0] === b[0] && a[1] === b[1] && a[2] === b[2] && a[3] === b[3] && a[4] === b[4] && a[5] === b[5] && a[6] === b[6] && a[7] === b[7] && a[8] === b[8] && a[9] === b[9] && a[10] === b[10] && a[11] === b[11] && a[12] === b[12] && a[13] === b[13] && a[14] === b[14] && a[15] === b[15];
  }
  function identity(dst) {
    const newDst = dst ?? new Ctor(16);
    newDst[0] = 1;
    newDst[1] = 0;
    newDst[2] = 0;
    newDst[3] = 0;
    newDst[4] = 0;
    newDst[5] = 1;
    newDst[6] = 0;
    newDst[7] = 0;
    newDst[8] = 0;
    newDst[9] = 0;
    newDst[10] = 1;
    newDst[11] = 0;
    newDst[12] = 0;
    newDst[13] = 0;
    newDst[14] = 0;
    newDst[15] = 1;
    return newDst;
  }
  function transpose(m, dst) {
    const newDst = dst ?? new Ctor(16);
    if (newDst === m) {
      let t;
      t = m[1];
      m[1] = m[4];
      m[4] = t;
      t = m[2];
      m[2] = m[8];
      m[8] = t;
      t = m[3];
      m[3] = m[12];
      m[12] = t;
      t = m[6];
      m[6] = m[9];
      m[9] = t;
      t = m[7];
      m[7] = m[13];
      m[13] = t;
      t = m[11];
      m[11] = m[14];
      m[14] = t;
      return newDst;
    }
    const m00 = m[0 * 4 + 0];
    const m01 = m[0 * 4 + 1];
    const m02 = m[0 * 4 + 2];
    const m03 = m[0 * 4 + 3];
    const m10 = m[1 * 4 + 0];
    const m11 = m[1 * 4 + 1];
    const m12 = m[1 * 4 + 2];
    const m13 = m[1 * 4 + 3];
    const m20 = m[2 * 4 + 0];
    const m21 = m[2 * 4 + 1];
    const m22 = m[2 * 4 + 2];
    const m23 = m[2 * 4 + 3];
    const m30 = m[3 * 4 + 0];
    const m31 = m[3 * 4 + 1];
    const m32 = m[3 * 4 + 2];
    const m33 = m[3 * 4 + 3];
    newDst[0] = m00;
    newDst[1] = m10;
    newDst[2] = m20;
    newDst[3] = m30;
    newDst[4] = m01;
    newDst[5] = m11;
    newDst[6] = m21;
    newDst[7] = m31;
    newDst[8] = m02;
    newDst[9] = m12;
    newDst[10] = m22;
    newDst[11] = m32;
    newDst[12] = m03;
    newDst[13] = m13;
    newDst[14] = m23;
    newDst[15] = m33;
    return newDst;
  }
  function inverse(m, dst) {
    const newDst = dst ?? new Ctor(16);
    const m00 = m[0 * 4 + 0];
    const m01 = m[0 * 4 + 1];
    const m02 = m[0 * 4 + 2];
    const m03 = m[0 * 4 + 3];
    const m10 = m[1 * 4 + 0];
    const m11 = m[1 * 4 + 1];
    const m12 = m[1 * 4 + 2];
    const m13 = m[1 * 4 + 3];
    const m20 = m[2 * 4 + 0];
    const m21 = m[2 * 4 + 1];
    const m22 = m[2 * 4 + 2];
    const m23 = m[2 * 4 + 3];
    const m30 = m[3 * 4 + 0];
    const m31 = m[3 * 4 + 1];
    const m32 = m[3 * 4 + 2];
    const m33 = m[3 * 4 + 3];
    const tmp0 = m22 * m33;
    const tmp1 = m32 * m23;
    const tmp2 = m12 * m33;
    const tmp3 = m32 * m13;
    const tmp4 = m12 * m23;
    const tmp5 = m22 * m13;
    const tmp6 = m02 * m33;
    const tmp7 = m32 * m03;
    const tmp8 = m02 * m23;
    const tmp9 = m22 * m03;
    const tmp10 = m02 * m13;
    const tmp11 = m12 * m03;
    const tmp12 = m20 * m31;
    const tmp13 = m30 * m21;
    const tmp14 = m10 * m31;
    const tmp15 = m30 * m11;
    const tmp16 = m10 * m21;
    const tmp17 = m20 * m11;
    const tmp18 = m00 * m31;
    const tmp19 = m30 * m01;
    const tmp20 = m00 * m21;
    const tmp21 = m20 * m01;
    const tmp22 = m00 * m11;
    const tmp23 = m10 * m01;
    const t0 = tmp0 * m11 + tmp3 * m21 + tmp4 * m31 - (tmp1 * m11 + tmp2 * m21 + tmp5 * m31);
    const t1 = tmp1 * m01 + tmp6 * m21 + tmp9 * m31 - (tmp0 * m01 + tmp7 * m21 + tmp8 * m31);
    const t2 = tmp2 * m01 + tmp7 * m11 + tmp10 * m31 - (tmp3 * m01 + tmp6 * m11 + tmp11 * m31);
    const t3 = tmp5 * m01 + tmp8 * m11 + tmp11 * m21 - (tmp4 * m01 + tmp9 * m11 + tmp10 * m21);
    const d = 1 / (m00 * t0 + m10 * t1 + m20 * t2 + m30 * t3);
    newDst[0] = d * t0;
    newDst[1] = d * t1;
    newDst[2] = d * t2;
    newDst[3] = d * t3;
    newDst[4] = d * (tmp1 * m10 + tmp2 * m20 + tmp5 * m30 - (tmp0 * m10 + tmp3 * m20 + tmp4 * m30));
    newDst[5] = d * (tmp0 * m00 + tmp7 * m20 + tmp8 * m30 - (tmp1 * m00 + tmp6 * m20 + tmp9 * m30));
    newDst[6] = d * (tmp3 * m00 + tmp6 * m10 + tmp11 * m30 - (tmp2 * m00 + tmp7 * m10 + tmp10 * m30));
    newDst[7] = d * (tmp4 * m00 + tmp9 * m10 + tmp10 * m20 - (tmp5 * m00 + tmp8 * m10 + tmp11 * m20));
    newDst[8] = d * (tmp12 * m13 + tmp15 * m23 + tmp16 * m33 - (tmp13 * m13 + tmp14 * m23 + tmp17 * m33));
    newDst[9] = d * (tmp13 * m03 + tmp18 * m23 + tmp21 * m33 - (tmp12 * m03 + tmp19 * m23 + tmp20 * m33));
    newDst[10] = d * (tmp14 * m03 + tmp19 * m13 + tmp22 * m33 - (tmp15 * m03 + tmp18 * m13 + tmp23 * m33));
    newDst[11] = d * (tmp17 * m03 + tmp20 * m13 + tmp23 * m23 - (tmp16 * m03 + tmp21 * m13 + tmp22 * m23));
    newDst[12] = d * (tmp14 * m22 + tmp17 * m32 + tmp13 * m12 - (tmp16 * m32 + tmp12 * m12 + tmp15 * m22));
    newDst[13] = d * (tmp20 * m32 + tmp12 * m02 + tmp19 * m22 - (tmp18 * m22 + tmp21 * m32 + tmp13 * m02));
    newDst[14] = d * (tmp18 * m12 + tmp23 * m32 + tmp15 * m02 - (tmp22 * m32 + tmp14 * m02 + tmp19 * m12));
    newDst[15] = d * (tmp22 * m22 + tmp16 * m02 + tmp21 * m12 - (tmp20 * m12 + tmp23 * m22 + tmp17 * m02));
    return newDst;
  }
  function determinant(m) {
    const m00 = m[0 * 4 + 0];
    const m01 = m[0 * 4 + 1];
    const m02 = m[0 * 4 + 2];
    const m03 = m[0 * 4 + 3];
    const m10 = m[1 * 4 + 0];
    const m11 = m[1 * 4 + 1];
    const m12 = m[1 * 4 + 2];
    const m13 = m[1 * 4 + 3];
    const m20 = m[2 * 4 + 0];
    const m21 = m[2 * 4 + 1];
    const m22 = m[2 * 4 + 2];
    const m23 = m[2 * 4 + 3];
    const m30 = m[3 * 4 + 0];
    const m31 = m[3 * 4 + 1];
    const m32 = m[3 * 4 + 2];
    const m33 = m[3 * 4 + 3];
    const tmp0 = m22 * m33;
    const tmp1 = m32 * m23;
    const tmp2 = m12 * m33;
    const tmp3 = m32 * m13;
    const tmp4 = m12 * m23;
    const tmp5 = m22 * m13;
    const tmp6 = m02 * m33;
    const tmp7 = m32 * m03;
    const tmp8 = m02 * m23;
    const tmp9 = m22 * m03;
    const tmp10 = m02 * m13;
    const tmp11 = m12 * m03;
    const t0 = tmp0 * m11 + tmp3 * m21 + tmp4 * m31 - (tmp1 * m11 + tmp2 * m21 + tmp5 * m31);
    const t1 = tmp1 * m01 + tmp6 * m21 + tmp9 * m31 - (tmp0 * m01 + tmp7 * m21 + tmp8 * m31);
    const t2 = tmp2 * m01 + tmp7 * m11 + tmp10 * m31 - (tmp3 * m01 + tmp6 * m11 + tmp11 * m31);
    const t3 = tmp5 * m01 + tmp8 * m11 + tmp11 * m21 - (tmp4 * m01 + tmp9 * m11 + tmp10 * m21);
    return m00 * t0 + m10 * t1 + m20 * t2 + m30 * t3;
  }
  const invert = inverse;
  function multiply(a, b, dst) {
    const newDst = dst ?? new Ctor(16);
    const a00 = a[0];
    const a01 = a[1];
    const a02 = a[2];
    const a03 = a[3];
    const a10 = a[4 + 0];
    const a11 = a[4 + 1];
    const a12 = a[4 + 2];
    const a13 = a[4 + 3];
    const a20 = a[8 + 0];
    const a21 = a[8 + 1];
    const a22 = a[8 + 2];
    const a23 = a[8 + 3];
    const a30 = a[12 + 0];
    const a31 = a[12 + 1];
    const a32 = a[12 + 2];
    const a33 = a[12 + 3];
    const b00 = b[0];
    const b01 = b[1];
    const b02 = b[2];
    const b03 = b[3];
    const b10 = b[4 + 0];
    const b11 = b[4 + 1];
    const b12 = b[4 + 2];
    const b13 = b[4 + 3];
    const b20 = b[8 + 0];
    const b21 = b[8 + 1];
    const b22 = b[8 + 2];
    const b23 = b[8 + 3];
    const b30 = b[12 + 0];
    const b31 = b[12 + 1];
    const b32 = b[12 + 2];
    const b33 = b[12 + 3];
    newDst[0] = a00 * b00 + a10 * b01 + a20 * b02 + a30 * b03;
    newDst[1] = a01 * b00 + a11 * b01 + a21 * b02 + a31 * b03;
    newDst[2] = a02 * b00 + a12 * b01 + a22 * b02 + a32 * b03;
    newDst[3] = a03 * b00 + a13 * b01 + a23 * b02 + a33 * b03;
    newDst[4] = a00 * b10 + a10 * b11 + a20 * b12 + a30 * b13;
    newDst[5] = a01 * b10 + a11 * b11 + a21 * b12 + a31 * b13;
    newDst[6] = a02 * b10 + a12 * b11 + a22 * b12 + a32 * b13;
    newDst[7] = a03 * b10 + a13 * b11 + a23 * b12 + a33 * b13;
    newDst[8] = a00 * b20 + a10 * b21 + a20 * b22 + a30 * b23;
    newDst[9] = a01 * b20 + a11 * b21 + a21 * b22 + a31 * b23;
    newDst[10] = a02 * b20 + a12 * b21 + a22 * b22 + a32 * b23;
    newDst[11] = a03 * b20 + a13 * b21 + a23 * b22 + a33 * b23;
    newDst[12] = a00 * b30 + a10 * b31 + a20 * b32 + a30 * b33;
    newDst[13] = a01 * b30 + a11 * b31 + a21 * b32 + a31 * b33;
    newDst[14] = a02 * b30 + a12 * b31 + a22 * b32 + a32 * b33;
    newDst[15] = a03 * b30 + a13 * b31 + a23 * b32 + a33 * b33;
    return newDst;
  }
  const mul = multiply;
  function setTranslation(a, v, dst) {
    const newDst = dst ?? identity();
    if (a !== newDst) {
      newDst[0] = a[0];
      newDst[1] = a[1];
      newDst[2] = a[2];
      newDst[3] = a[3];
      newDst[4] = a[4];
      newDst[5] = a[5];
      newDst[6] = a[6];
      newDst[7] = a[7];
      newDst[8] = a[8];
      newDst[9] = a[9];
      newDst[10] = a[10];
      newDst[11] = a[11];
    }
    newDst[12] = v[0];
    newDst[13] = v[1];
    newDst[14] = v[2];
    newDst[15] = 1;
    return newDst;
  }
  function getTranslation(m, dst) {
    const newDst = dst ?? vec33.create();
    newDst[0] = m[12];
    newDst[1] = m[13];
    newDst[2] = m[14];
    return newDst;
  }
  function getAxis(m, axis, dst) {
    const newDst = dst ?? vec33.create();
    const off = axis * 4;
    newDst[0] = m[off + 0];
    newDst[1] = m[off + 1];
    newDst[2] = m[off + 2];
    return newDst;
  }
  function setAxis(m, v, axis, dst) {
    const newDst = dst === m ? dst : copy(m, dst);
    const off = axis * 4;
    newDst[off + 0] = v[0];
    newDst[off + 1] = v[1];
    newDst[off + 2] = v[2];
    return newDst;
  }
  function getScaling(m, dst) {
    const newDst = dst ?? vec33.create();
    const xx = m[0];
    const xy = m[1];
    const xz = m[2];
    const yx = m[4];
    const yy = m[5];
    const yz = m[6];
    const zx = m[8];
    const zy = m[9];
    const zz = m[10];
    newDst[0] = Math.sqrt(xx * xx + xy * xy + xz * xz);
    newDst[1] = Math.sqrt(yx * yx + yy * yy + yz * yz);
    newDst[2] = Math.sqrt(zx * zx + zy * zy + zz * zz);
    return newDst;
  }
  function perspective(fieldOfViewYInRadians, aspect, zNear, zFar, dst) {
    const newDst = dst ?? new Ctor(16);
    const f = Math.tan(Math.PI * 0.5 - 0.5 * fieldOfViewYInRadians);
    newDst[0] = f / aspect;
    newDst[1] = 0;
    newDst[2] = 0;
    newDst[3] = 0;
    newDst[4] = 0;
    newDst[5] = f;
    newDst[6] = 0;
    newDst[7] = 0;
    newDst[8] = 0;
    newDst[9] = 0;
    newDst[11] = -1;
    newDst[12] = 0;
    newDst[13] = 0;
    newDst[15] = 0;
    if (Number.isFinite(zFar)) {
      const rangeInv = 1 / (zNear - zFar);
      newDst[10] = zFar * rangeInv;
      newDst[14] = zFar * zNear * rangeInv;
    } else {
      newDst[10] = -1;
      newDst[14] = -zNear;
    }
    return newDst;
  }
  function perspectiveReverseZ(fieldOfViewYInRadians, aspect, zNear, zFar = Infinity, dst) {
    const newDst = dst ?? new Ctor(16);
    const f = 1 / Math.tan(fieldOfViewYInRadians * 0.5);
    newDst[0] = f / aspect;
    newDst[1] = 0;
    newDst[2] = 0;
    newDst[3] = 0;
    newDst[4] = 0;
    newDst[5] = f;
    newDst[6] = 0;
    newDst[7] = 0;
    newDst[8] = 0;
    newDst[9] = 0;
    newDst[11] = -1;
    newDst[12] = 0;
    newDst[13] = 0;
    newDst[15] = 0;
    if (zFar === Infinity) {
      newDst[10] = 0;
      newDst[14] = zNear;
    } else {
      const rangeInv = 1 / (zFar - zNear);
      newDst[10] = zNear * rangeInv;
      newDst[14] = zFar * zNear * rangeInv;
    }
    return newDst;
  }
  function ortho(left, right, bottom, top, near, far, dst) {
    const newDst = dst ?? new Ctor(16);
    newDst[0] = 2 / (right - left);
    newDst[1] = 0;
    newDst[2] = 0;
    newDst[3] = 0;
    newDst[4] = 0;
    newDst[5] = 2 / (top - bottom);
    newDst[6] = 0;
    newDst[7] = 0;
    newDst[8] = 0;
    newDst[9] = 0;
    newDst[10] = 1 / (near - far);
    newDst[11] = 0;
    newDst[12] = (right + left) / (left - right);
    newDst[13] = (top + bottom) / (bottom - top);
    newDst[14] = near / (near - far);
    newDst[15] = 1;
    return newDst;
  }
  function frustum(left, right, bottom, top, near, far, dst) {
    const newDst = dst ?? new Ctor(16);
    const dx = right - left;
    const dy = top - bottom;
    const dz = near - far;
    newDst[0] = 2 * near / dx;
    newDst[1] = 0;
    newDst[2] = 0;
    newDst[3] = 0;
    newDst[4] = 0;
    newDst[5] = 2 * near / dy;
    newDst[6] = 0;
    newDst[7] = 0;
    newDst[8] = (left + right) / dx;
    newDst[9] = (top + bottom) / dy;
    newDst[10] = far / dz;
    newDst[11] = -1;
    newDst[12] = 0;
    newDst[13] = 0;
    newDst[14] = near * far / dz;
    newDst[15] = 0;
    return newDst;
  }
  function frustumReverseZ(left, right, bottom, top, near, far = Infinity, dst) {
    const newDst = dst ?? new Ctor(16);
    const dx = right - left;
    const dy = top - bottom;
    newDst[0] = 2 * near / dx;
    newDst[1] = 0;
    newDst[2] = 0;
    newDst[3] = 0;
    newDst[4] = 0;
    newDst[5] = 2 * near / dy;
    newDst[6] = 0;
    newDst[7] = 0;
    newDst[8] = (left + right) / dx;
    newDst[9] = (top + bottom) / dy;
    newDst[11] = -1;
    newDst[12] = 0;
    newDst[13] = 0;
    newDst[15] = 0;
    if (far === Infinity) {
      newDst[10] = 0;
      newDst[14] = near;
    } else {
      const rangeInv = 1 / (far - near);
      newDst[10] = near * rangeInv;
      newDst[14] = far * near * rangeInv;
    }
    return newDst;
  }
  const xAxis = vec33.create();
  const yAxis = vec33.create();
  const zAxis = vec33.create();
  function aim(position, target, up, dst) {
    const newDst = dst ?? new Ctor(16);
    vec33.normalize(vec33.subtract(target, position, zAxis), zAxis);
    vec33.normalize(vec33.cross(up, zAxis, xAxis), xAxis);
    vec33.normalize(vec33.cross(zAxis, xAxis, yAxis), yAxis);
    newDst[0] = xAxis[0];
    newDst[1] = xAxis[1];
    newDst[2] = xAxis[2];
    newDst[3] = 0;
    newDst[4] = yAxis[0];
    newDst[5] = yAxis[1];
    newDst[6] = yAxis[2];
    newDst[7] = 0;
    newDst[8] = zAxis[0];
    newDst[9] = zAxis[1];
    newDst[10] = zAxis[2];
    newDst[11] = 0;
    newDst[12] = position[0];
    newDst[13] = position[1];
    newDst[14] = position[2];
    newDst[15] = 1;
    return newDst;
  }
  function cameraAim(eye, target, up, dst) {
    const newDst = dst ?? new Ctor(16);
    vec33.normalize(vec33.subtract(eye, target, zAxis), zAxis);
    vec33.normalize(vec33.cross(up, zAxis, xAxis), xAxis);
    vec33.normalize(vec33.cross(zAxis, xAxis, yAxis), yAxis);
    newDst[0] = xAxis[0];
    newDst[1] = xAxis[1];
    newDst[2] = xAxis[2];
    newDst[3] = 0;
    newDst[4] = yAxis[0];
    newDst[5] = yAxis[1];
    newDst[6] = yAxis[2];
    newDst[7] = 0;
    newDst[8] = zAxis[0];
    newDst[9] = zAxis[1];
    newDst[10] = zAxis[2];
    newDst[11] = 0;
    newDst[12] = eye[0];
    newDst[13] = eye[1];
    newDst[14] = eye[2];
    newDst[15] = 1;
    return newDst;
  }
  function lookAt(eye, target, up, dst) {
    const newDst = dst ?? new Ctor(16);
    vec33.normalize(vec33.subtract(eye, target, zAxis), zAxis);
    vec33.normalize(vec33.cross(up, zAxis, xAxis), xAxis);
    vec33.normalize(vec33.cross(zAxis, xAxis, yAxis), yAxis);
    newDst[0] = xAxis[0];
    newDst[1] = yAxis[0];
    newDst[2] = zAxis[0];
    newDst[3] = 0;
    newDst[4] = xAxis[1];
    newDst[5] = yAxis[1];
    newDst[6] = zAxis[1];
    newDst[7] = 0;
    newDst[8] = xAxis[2];
    newDst[9] = yAxis[2];
    newDst[10] = zAxis[2];
    newDst[11] = 0;
    newDst[12] = -(xAxis[0] * eye[0] + xAxis[1] * eye[1] + xAxis[2] * eye[2]);
    newDst[13] = -(yAxis[0] * eye[0] + yAxis[1] * eye[1] + yAxis[2] * eye[2]);
    newDst[14] = -(zAxis[0] * eye[0] + zAxis[1] * eye[1] + zAxis[2] * eye[2]);
    newDst[15] = 1;
    return newDst;
  }
  function translation(v, dst) {
    const newDst = dst ?? new Ctor(16);
    newDst[0] = 1;
    newDst[1] = 0;
    newDst[2] = 0;
    newDst[3] = 0;
    newDst[4] = 0;
    newDst[5] = 1;
    newDst[6] = 0;
    newDst[7] = 0;
    newDst[8] = 0;
    newDst[9] = 0;
    newDst[10] = 1;
    newDst[11] = 0;
    newDst[12] = v[0];
    newDst[13] = v[1];
    newDst[14] = v[2];
    newDst[15] = 1;
    return newDst;
  }
  function translate(m, v, dst) {
    const newDst = dst ?? new Ctor(16);
    const v0 = v[0];
    const v1 = v[1];
    const v2 = v[2];
    const m00 = m[0];
    const m01 = m[1];
    const m02 = m[2];
    const m03 = m[3];
    const m10 = m[1 * 4 + 0];
    const m11 = m[1 * 4 + 1];
    const m12 = m[1 * 4 + 2];
    const m13 = m[1 * 4 + 3];
    const m20 = m[2 * 4 + 0];
    const m21 = m[2 * 4 + 1];
    const m22 = m[2 * 4 + 2];
    const m23 = m[2 * 4 + 3];
    const m30 = m[3 * 4 + 0];
    const m31 = m[3 * 4 + 1];
    const m32 = m[3 * 4 + 2];
    const m33 = m[3 * 4 + 3];
    if (m !== newDst) {
      newDst[0] = m00;
      newDst[1] = m01;
      newDst[2] = m02;
      newDst[3] = m03;
      newDst[4] = m10;
      newDst[5] = m11;
      newDst[6] = m12;
      newDst[7] = m13;
      newDst[8] = m20;
      newDst[9] = m21;
      newDst[10] = m22;
      newDst[11] = m23;
    }
    newDst[12] = m00 * v0 + m10 * v1 + m20 * v2 + m30;
    newDst[13] = m01 * v0 + m11 * v1 + m21 * v2 + m31;
    newDst[14] = m02 * v0 + m12 * v1 + m22 * v2 + m32;
    newDst[15] = m03 * v0 + m13 * v1 + m23 * v2 + m33;
    return newDst;
  }
  function rotationX(angleInRadians, dst) {
    const newDst = dst ?? new Ctor(16);
    const c = Math.cos(angleInRadians);
    const s = Math.sin(angleInRadians);
    newDst[0] = 1;
    newDst[1] = 0;
    newDst[2] = 0;
    newDst[3] = 0;
    newDst[4] = 0;
    newDst[5] = c;
    newDst[6] = s;
    newDst[7] = 0;
    newDst[8] = 0;
    newDst[9] = -s;
    newDst[10] = c;
    newDst[11] = 0;
    newDst[12] = 0;
    newDst[13] = 0;
    newDst[14] = 0;
    newDst[15] = 1;
    return newDst;
  }
  function rotateX(m, angleInRadians, dst) {
    const newDst = dst ?? new Ctor(16);
    const m10 = m[4];
    const m11 = m[5];
    const m12 = m[6];
    const m13 = m[7];
    const m20 = m[8];
    const m21 = m[9];
    const m22 = m[10];
    const m23 = m[11];
    const c = Math.cos(angleInRadians);
    const s = Math.sin(angleInRadians);
    newDst[4] = c * m10 + s * m20;
    newDst[5] = c * m11 + s * m21;
    newDst[6] = c * m12 + s * m22;
    newDst[7] = c * m13 + s * m23;
    newDst[8] = c * m20 - s * m10;
    newDst[9] = c * m21 - s * m11;
    newDst[10] = c * m22 - s * m12;
    newDst[11] = c * m23 - s * m13;
    if (m !== newDst) {
      newDst[0] = m[0];
      newDst[1] = m[1];
      newDst[2] = m[2];
      newDst[3] = m[3];
      newDst[12] = m[12];
      newDst[13] = m[13];
      newDst[14] = m[14];
      newDst[15] = m[15];
    }
    return newDst;
  }
  function rotationY(angleInRadians, dst) {
    const newDst = dst ?? new Ctor(16);
    const c = Math.cos(angleInRadians);
    const s = Math.sin(angleInRadians);
    newDst[0] = c;
    newDst[1] = 0;
    newDst[2] = -s;
    newDst[3] = 0;
    newDst[4] = 0;
    newDst[5] = 1;
    newDst[6] = 0;
    newDst[7] = 0;
    newDst[8] = s;
    newDst[9] = 0;
    newDst[10] = c;
    newDst[11] = 0;
    newDst[12] = 0;
    newDst[13] = 0;
    newDst[14] = 0;
    newDst[15] = 1;
    return newDst;
  }
  function rotateY(m, angleInRadians, dst) {
    const newDst = dst ?? new Ctor(16);
    const m00 = m[0 * 4 + 0];
    const m01 = m[0 * 4 + 1];
    const m02 = m[0 * 4 + 2];
    const m03 = m[0 * 4 + 3];
    const m20 = m[2 * 4 + 0];
    const m21 = m[2 * 4 + 1];
    const m22 = m[2 * 4 + 2];
    const m23 = m[2 * 4 + 3];
    const c = Math.cos(angleInRadians);
    const s = Math.sin(angleInRadians);
    newDst[0] = c * m00 - s * m20;
    newDst[1] = c * m01 - s * m21;
    newDst[2] = c * m02 - s * m22;
    newDst[3] = c * m03 - s * m23;
    newDst[8] = c * m20 + s * m00;
    newDst[9] = c * m21 + s * m01;
    newDst[10] = c * m22 + s * m02;
    newDst[11] = c * m23 + s * m03;
    if (m !== newDst) {
      newDst[4] = m[4];
      newDst[5] = m[5];
      newDst[6] = m[6];
      newDst[7] = m[7];
      newDst[12] = m[12];
      newDst[13] = m[13];
      newDst[14] = m[14];
      newDst[15] = m[15];
    }
    return newDst;
  }
  function rotationZ(angleInRadians, dst) {
    const newDst = dst ?? new Ctor(16);
    const c = Math.cos(angleInRadians);
    const s = Math.sin(angleInRadians);
    newDst[0] = c;
    newDst[1] = s;
    newDst[2] = 0;
    newDst[3] = 0;
    newDst[4] = -s;
    newDst[5] = c;
    newDst[6] = 0;
    newDst[7] = 0;
    newDst[8] = 0;
    newDst[9] = 0;
    newDst[10] = 1;
    newDst[11] = 0;
    newDst[12] = 0;
    newDst[13] = 0;
    newDst[14] = 0;
    newDst[15] = 1;
    return newDst;
  }
  function rotateZ(m, angleInRadians, dst) {
    const newDst = dst ?? new Ctor(16);
    const m00 = m[0 * 4 + 0];
    const m01 = m[0 * 4 + 1];
    const m02 = m[0 * 4 + 2];
    const m03 = m[0 * 4 + 3];
    const m10 = m[1 * 4 + 0];
    const m11 = m[1 * 4 + 1];
    const m12 = m[1 * 4 + 2];
    const m13 = m[1 * 4 + 3];
    const c = Math.cos(angleInRadians);
    const s = Math.sin(angleInRadians);
    newDst[0] = c * m00 + s * m10;
    newDst[1] = c * m01 + s * m11;
    newDst[2] = c * m02 + s * m12;
    newDst[3] = c * m03 + s * m13;
    newDst[4] = c * m10 - s * m00;
    newDst[5] = c * m11 - s * m01;
    newDst[6] = c * m12 - s * m02;
    newDst[7] = c * m13 - s * m03;
    if (m !== newDst) {
      newDst[8] = m[8];
      newDst[9] = m[9];
      newDst[10] = m[10];
      newDst[11] = m[11];
      newDst[12] = m[12];
      newDst[13] = m[13];
      newDst[14] = m[14];
      newDst[15] = m[15];
    }
    return newDst;
  }
  function axisRotation(axis, angleInRadians, dst) {
    const newDst = dst ?? new Ctor(16);
    let x = axis[0];
    let y = axis[1];
    let z = axis[2];
    const n = Math.sqrt(x * x + y * y + z * z);
    x /= n;
    y /= n;
    z /= n;
    const xx = x * x;
    const yy = y * y;
    const zz = z * z;
    const c = Math.cos(angleInRadians);
    const s = Math.sin(angleInRadians);
    const oneMinusCosine = 1 - c;
    newDst[0] = xx + (1 - xx) * c;
    newDst[1] = x * y * oneMinusCosine + z * s;
    newDst[2] = x * z * oneMinusCosine - y * s;
    newDst[3] = 0;
    newDst[4] = x * y * oneMinusCosine - z * s;
    newDst[5] = yy + (1 - yy) * c;
    newDst[6] = y * z * oneMinusCosine + x * s;
    newDst[7] = 0;
    newDst[8] = x * z * oneMinusCosine + y * s;
    newDst[9] = y * z * oneMinusCosine - x * s;
    newDst[10] = zz + (1 - zz) * c;
    newDst[11] = 0;
    newDst[12] = 0;
    newDst[13] = 0;
    newDst[14] = 0;
    newDst[15] = 1;
    return newDst;
  }
  const rotation = axisRotation;
  function axisRotate(m, axis, angleInRadians, dst) {
    const newDst = dst ?? new Ctor(16);
    let x = axis[0];
    let y = axis[1];
    let z = axis[2];
    const n = Math.sqrt(x * x + y * y + z * z);
    x /= n;
    y /= n;
    z /= n;
    const xx = x * x;
    const yy = y * y;
    const zz = z * z;
    const c = Math.cos(angleInRadians);
    const s = Math.sin(angleInRadians);
    const oneMinusCosine = 1 - c;
    const r00 = xx + (1 - xx) * c;
    const r01 = x * y * oneMinusCosine + z * s;
    const r02 = x * z * oneMinusCosine - y * s;
    const r10 = x * y * oneMinusCosine - z * s;
    const r11 = yy + (1 - yy) * c;
    const r12 = y * z * oneMinusCosine + x * s;
    const r20 = x * z * oneMinusCosine + y * s;
    const r21 = y * z * oneMinusCosine - x * s;
    const r22 = zz + (1 - zz) * c;
    const m00 = m[0];
    const m01 = m[1];
    const m02 = m[2];
    const m03 = m[3];
    const m10 = m[4];
    const m11 = m[5];
    const m12 = m[6];
    const m13 = m[7];
    const m20 = m[8];
    const m21 = m[9];
    const m22 = m[10];
    const m23 = m[11];
    newDst[0] = r00 * m00 + r01 * m10 + r02 * m20;
    newDst[1] = r00 * m01 + r01 * m11 + r02 * m21;
    newDst[2] = r00 * m02 + r01 * m12 + r02 * m22;
    newDst[3] = r00 * m03 + r01 * m13 + r02 * m23;
    newDst[4] = r10 * m00 + r11 * m10 + r12 * m20;
    newDst[5] = r10 * m01 + r11 * m11 + r12 * m21;
    newDst[6] = r10 * m02 + r11 * m12 + r12 * m22;
    newDst[7] = r10 * m03 + r11 * m13 + r12 * m23;
    newDst[8] = r20 * m00 + r21 * m10 + r22 * m20;
    newDst[9] = r20 * m01 + r21 * m11 + r22 * m21;
    newDst[10] = r20 * m02 + r21 * m12 + r22 * m22;
    newDst[11] = r20 * m03 + r21 * m13 + r22 * m23;
    if (m !== newDst) {
      newDst[12] = m[12];
      newDst[13] = m[13];
      newDst[14] = m[14];
      newDst[15] = m[15];
    }
    return newDst;
  }
  const rotate = axisRotate;
  function scaling(v, dst) {
    const newDst = dst ?? new Ctor(16);
    newDst[0] = v[0];
    newDst[1] = 0;
    newDst[2] = 0;
    newDst[3] = 0;
    newDst[4] = 0;
    newDst[5] = v[1];
    newDst[6] = 0;
    newDst[7] = 0;
    newDst[8] = 0;
    newDst[9] = 0;
    newDst[10] = v[2];
    newDst[11] = 0;
    newDst[12] = 0;
    newDst[13] = 0;
    newDst[14] = 0;
    newDst[15] = 1;
    return newDst;
  }
  function scale(m, v, dst) {
    const newDst = dst ?? new Ctor(16);
    const v0 = v[0];
    const v1 = v[1];
    const v2 = v[2];
    newDst[0] = v0 * m[0 * 4 + 0];
    newDst[1] = v0 * m[0 * 4 + 1];
    newDst[2] = v0 * m[0 * 4 + 2];
    newDst[3] = v0 * m[0 * 4 + 3];
    newDst[4] = v1 * m[1 * 4 + 0];
    newDst[5] = v1 * m[1 * 4 + 1];
    newDst[6] = v1 * m[1 * 4 + 2];
    newDst[7] = v1 * m[1 * 4 + 3];
    newDst[8] = v2 * m[2 * 4 + 0];
    newDst[9] = v2 * m[2 * 4 + 1];
    newDst[10] = v2 * m[2 * 4 + 2];
    newDst[11] = v2 * m[2 * 4 + 3];
    if (m !== newDst) {
      newDst[12] = m[12];
      newDst[13] = m[13];
      newDst[14] = m[14];
      newDst[15] = m[15];
    }
    return newDst;
  }
  function uniformScaling(s, dst) {
    const newDst = dst ?? new Ctor(16);
    newDst[0] = s;
    newDst[1] = 0;
    newDst[2] = 0;
    newDst[3] = 0;
    newDst[4] = 0;
    newDst[5] = s;
    newDst[6] = 0;
    newDst[7] = 0;
    newDst[8] = 0;
    newDst[9] = 0;
    newDst[10] = s;
    newDst[11] = 0;
    newDst[12] = 0;
    newDst[13] = 0;
    newDst[14] = 0;
    newDst[15] = 1;
    return newDst;
  }
  function uniformScale(m, s, dst) {
    const newDst = dst ?? new Ctor(16);
    newDst[0] = s * m[0 * 4 + 0];
    newDst[1] = s * m[0 * 4 + 1];
    newDst[2] = s * m[0 * 4 + 2];
    newDst[3] = s * m[0 * 4 + 3];
    newDst[4] = s * m[1 * 4 + 0];
    newDst[5] = s * m[1 * 4 + 1];
    newDst[6] = s * m[1 * 4 + 2];
    newDst[7] = s * m[1 * 4 + 3];
    newDst[8] = s * m[2 * 4 + 0];
    newDst[9] = s * m[2 * 4 + 1];
    newDst[10] = s * m[2 * 4 + 2];
    newDst[11] = s * m[2 * 4 + 3];
    if (m !== newDst) {
      newDst[12] = m[12];
      newDst[13] = m[13];
      newDst[14] = m[14];
      newDst[15] = m[15];
    }
    return newDst;
  }
  return {
    create,
    set,
    fromMat3,
    fromQuat,
    negate,
    copy,
    clone,
    equalsApproximately,
    equals,
    identity,
    transpose,
    inverse,
    determinant,
    invert,
    multiply,
    mul,
    setTranslation,
    getTranslation,
    getAxis,
    setAxis,
    getScaling,
    perspective,
    perspectiveReverseZ,
    ortho,
    frustum,
    frustumReverseZ,
    aim,
    cameraAim,
    lookAt,
    translation,
    translate,
    rotationX,
    rotateX,
    rotationY,
    rotateY,
    rotationZ,
    rotateZ,
    axisRotation,
    rotation,
    axisRotate,
    rotate,
    scaling,
    scale,
    uniformScaling,
    uniformScale
  };
}
var cache$22 = /* @__PURE__ */ new Map();
function getAPI$22(Ctor) {
  let api = cache$22.get(Ctor);
  if (!api) {
    api = getAPIImpl$22(Ctor);
    cache$22.set(Ctor, api);
  }
  return api;
}
function getAPIImpl$12(Ctor) {
  const vec33 = getAPI$32(Ctor);
  function create(x, y, z, w) {
    const newDst = new Ctor(4);
    if (x !== void 0) {
      newDst[0] = x;
      if (y !== void 0) {
        newDst[1] = y;
        if (z !== void 0) {
          newDst[2] = z;
          if (w !== void 0) {
            newDst[3] = w;
          }
        }
      }
    }
    return newDst;
  }
  const fromValues = create;
  function set(x, y, z, w, dst) {
    const newDst = dst ?? new Ctor(4);
    newDst[0] = x;
    newDst[1] = y;
    newDst[2] = z;
    newDst[3] = w;
    return newDst;
  }
  function fromAxisAngle(axis, angleInRadians, dst) {
    const newDst = dst ?? new Ctor(4);
    const halfAngle = angleInRadians * 0.5;
    const s = Math.sin(halfAngle);
    newDst[0] = s * axis[0];
    newDst[1] = s * axis[1];
    newDst[2] = s * axis[2];
    newDst[3] = Math.cos(halfAngle);
    return newDst;
  }
  function toAxisAngle(q, dst) {
    const newDst = dst ?? vec33.create(3);
    const angle2 = Math.acos(q[3]) * 2;
    const s = Math.sin(angle2 * 0.5);
    if (s > EPSILON2) {
      newDst[0] = q[0] / s;
      newDst[1] = q[1] / s;
      newDst[2] = q[2] / s;
    } else {
      newDst[0] = 1;
      newDst[1] = 0;
      newDst[2] = 0;
    }
    return { angle: angle2, axis: newDst };
  }
  function angle(a, b) {
    const d = dot(a, b);
    return Math.acos(2 * d * d - 1);
  }
  function multiply(a, b, dst) {
    const newDst = dst ?? new Ctor(4);
    const ax = a[0];
    const ay = a[1];
    const az = a[2];
    const aw = a[3];
    const bx = b[0];
    const by = b[1];
    const bz = b[2];
    const bw = b[3];
    newDst[0] = ax * bw + aw * bx + ay * bz - az * by;
    newDst[1] = ay * bw + aw * by + az * bx - ax * bz;
    newDst[2] = az * bw + aw * bz + ax * by - ay * bx;
    newDst[3] = aw * bw - ax * bx - ay * by - az * bz;
    return newDst;
  }
  const mul = multiply;
  function rotateX(q, angleInRadians, dst) {
    const newDst = dst ?? new Ctor(4);
    const halfAngle = angleInRadians * 0.5;
    const qx = q[0];
    const qy = q[1];
    const qz = q[2];
    const qw = q[3];
    const bx = Math.sin(halfAngle);
    const bw = Math.cos(halfAngle);
    newDst[0] = qx * bw + qw * bx;
    newDst[1] = qy * bw + qz * bx;
    newDst[2] = qz * bw - qy * bx;
    newDst[3] = qw * bw - qx * bx;
    return newDst;
  }
  function rotateY(q, angleInRadians, dst) {
    const newDst = dst ?? new Ctor(4);
    const halfAngle = angleInRadians * 0.5;
    const qx = q[0];
    const qy = q[1];
    const qz = q[2];
    const qw = q[3];
    const by = Math.sin(halfAngle);
    const bw = Math.cos(halfAngle);
    newDst[0] = qx * bw - qz * by;
    newDst[1] = qy * bw + qw * by;
    newDst[2] = qz * bw + qx * by;
    newDst[3] = qw * bw - qy * by;
    return newDst;
  }
  function rotateZ(q, angleInRadians, dst) {
    const newDst = dst ?? new Ctor(4);
    const halfAngle = angleInRadians * 0.5;
    const qx = q[0];
    const qy = q[1];
    const qz = q[2];
    const qw = q[3];
    const bz = Math.sin(halfAngle);
    const bw = Math.cos(halfAngle);
    newDst[0] = qx * bw + qy * bz;
    newDst[1] = qy * bw - qx * bz;
    newDst[2] = qz * bw + qw * bz;
    newDst[3] = qw * bw - qz * bz;
    return newDst;
  }
  function slerp(a, b, t, dst) {
    const newDst = dst ?? new Ctor(4);
    const ax = a[0];
    const ay = a[1];
    const az = a[2];
    const aw = a[3];
    let bx = b[0];
    let by = b[1];
    let bz = b[2];
    let bw = b[3];
    let cosOmega = ax * bx + ay * by + az * bz + aw * bw;
    if (cosOmega < 0) {
      cosOmega = -cosOmega;
      bx = -bx;
      by = -by;
      bz = -bz;
      bw = -bw;
    }
    let scale0;
    let scale1;
    if (1 - cosOmega > EPSILON2) {
      const omega = Math.acos(cosOmega);
      const sinOmega = Math.sin(omega);
      scale0 = Math.sin((1 - t) * omega) / sinOmega;
      scale1 = Math.sin(t * omega) / sinOmega;
    } else {
      scale0 = 1 - t;
      scale1 = t;
    }
    newDst[0] = scale0 * ax + scale1 * bx;
    newDst[1] = scale0 * ay + scale1 * by;
    newDst[2] = scale0 * az + scale1 * bz;
    newDst[3] = scale0 * aw + scale1 * bw;
    return newDst;
  }
  function inverse(q, dst) {
    const newDst = dst ?? new Ctor(4);
    const a0 = q[0];
    const a1 = q[1];
    const a2 = q[2];
    const a3 = q[3];
    const dot2 = a0 * a0 + a1 * a1 + a2 * a2 + a3 * a3;
    const invDot = dot2 ? 1 / dot2 : 0;
    newDst[0] = -a0 * invDot;
    newDst[1] = -a1 * invDot;
    newDst[2] = -a2 * invDot;
    newDst[3] = a3 * invDot;
    return newDst;
  }
  function conjugate(q, dst) {
    const newDst = dst ?? new Ctor(4);
    newDst[0] = -q[0];
    newDst[1] = -q[1];
    newDst[2] = -q[2];
    newDst[3] = q[3];
    return newDst;
  }
  function fromMat(m, dst) {
    const newDst = dst ?? new Ctor(4);
    const trace = m[0] + m[5] + m[10];
    if (trace > 0) {
      const root = Math.sqrt(trace + 1);
      newDst[3] = 0.5 * root;
      const invRoot = 0.5 / root;
      newDst[0] = (m[6] - m[9]) * invRoot;
      newDst[1] = (m[8] - m[2]) * invRoot;
      newDst[2] = (m[1] - m[4]) * invRoot;
    } else {
      let i = 0;
      if (m[5] > m[0]) {
        i = 1;
      }
      if (m[10] > m[i * 4 + i]) {
        i = 2;
      }
      const j = (i + 1) % 3;
      const k = (i + 2) % 3;
      const root = Math.sqrt(m[i * 4 + i] - m[j * 4 + j] - m[k * 4 + k] + 1);
      newDst[i] = 0.5 * root;
      const invRoot = 0.5 / root;
      newDst[3] = (m[j * 4 + k] - m[k * 4 + j]) * invRoot;
      newDst[j] = (m[j * 4 + i] + m[i * 4 + j]) * invRoot;
      newDst[k] = (m[k * 4 + i] + m[i * 4 + k]) * invRoot;
    }
    return newDst;
  }
  function fromEuler(xAngleInRadians, yAngleInRadians, zAngleInRadians, order, dst) {
    const newDst = dst ?? new Ctor(4);
    const xHalfAngle = xAngleInRadians * 0.5;
    const yHalfAngle = yAngleInRadians * 0.5;
    const zHalfAngle = zAngleInRadians * 0.5;
    const sx = Math.sin(xHalfAngle);
    const cx = Math.cos(xHalfAngle);
    const sy = Math.sin(yHalfAngle);
    const cy = Math.cos(yHalfAngle);
    const sz = Math.sin(zHalfAngle);
    const cz = Math.cos(zHalfAngle);
    switch (order) {
      case "xyz":
        newDst[0] = sx * cy * cz + cx * sy * sz;
        newDst[1] = cx * sy * cz - sx * cy * sz;
        newDst[2] = cx * cy * sz + sx * sy * cz;
        newDst[3] = cx * cy * cz - sx * sy * sz;
        break;
      case "xzy":
        newDst[0] = sx * cy * cz - cx * sy * sz;
        newDst[1] = cx * sy * cz - sx * cy * sz;
        newDst[2] = cx * cy * sz + sx * sy * cz;
        newDst[3] = cx * cy * cz + sx * sy * sz;
        break;
      case "yxz":
        newDst[0] = sx * cy * cz + cx * sy * sz;
        newDst[1] = cx * sy * cz - sx * cy * sz;
        newDst[2] = cx * cy * sz - sx * sy * cz;
        newDst[3] = cx * cy * cz + sx * sy * sz;
        break;
      case "yzx":
        newDst[0] = sx * cy * cz + cx * sy * sz;
        newDst[1] = cx * sy * cz + sx * cy * sz;
        newDst[2] = cx * cy * sz - sx * sy * cz;
        newDst[3] = cx * cy * cz - sx * sy * sz;
        break;
      case "zxy":
        newDst[0] = sx * cy * cz - cx * sy * sz;
        newDst[1] = cx * sy * cz + sx * cy * sz;
        newDst[2] = cx * cy * sz + sx * sy * cz;
        newDst[3] = cx * cy * cz - sx * sy * sz;
        break;
      case "zyx":
        newDst[0] = sx * cy * cz - cx * sy * sz;
        newDst[1] = cx * sy * cz + sx * cy * sz;
        newDst[2] = cx * cy * sz - sx * sy * cz;
        newDst[3] = cx * cy * cz + sx * sy * sz;
        break;
      default:
        throw new Error(`Unknown rotation order: ${order}`);
    }
    return newDst;
  }
  function copy(q, dst) {
    const newDst = dst ?? new Ctor(4);
    newDst[0] = q[0];
    newDst[1] = q[1];
    newDst[2] = q[2];
    newDst[3] = q[3];
    return newDst;
  }
  const clone = copy;
  function add(a, b, dst) {
    const newDst = dst ?? new Ctor(4);
    newDst[0] = a[0] + b[0];
    newDst[1] = a[1] + b[1];
    newDst[2] = a[2] + b[2];
    newDst[3] = a[3] + b[3];
    return newDst;
  }
  function subtract(a, b, dst) {
    const newDst = dst ?? new Ctor(4);
    newDst[0] = a[0] - b[0];
    newDst[1] = a[1] - b[1];
    newDst[2] = a[2] - b[2];
    newDst[3] = a[3] - b[3];
    return newDst;
  }
  const sub = subtract;
  function mulScalar(v, k, dst) {
    const newDst = dst ?? new Ctor(4);
    newDst[0] = v[0] * k;
    newDst[1] = v[1] * k;
    newDst[2] = v[2] * k;
    newDst[3] = v[3] * k;
    return newDst;
  }
  const scale = mulScalar;
  function divScalar(v, k, dst) {
    const newDst = dst ?? new Ctor(4);
    newDst[0] = v[0] / k;
    newDst[1] = v[1] / k;
    newDst[2] = v[2] / k;
    newDst[3] = v[3] / k;
    return newDst;
  }
  function dot(a, b) {
    return a[0] * b[0] + a[1] * b[1] + a[2] * b[2] + a[3] * b[3];
  }
  function lerp(a, b, t, dst) {
    const newDst = dst ?? new Ctor(4);
    newDst[0] = a[0] + t * (b[0] - a[0]);
    newDst[1] = a[1] + t * (b[1] - a[1]);
    newDst[2] = a[2] + t * (b[2] - a[2]);
    newDst[3] = a[3] + t * (b[3] - a[3]);
    return newDst;
  }
  function length(v) {
    const v0 = v[0];
    const v1 = v[1];
    const v2 = v[2];
    const v3 = v[3];
    return Math.sqrt(v0 * v0 + v1 * v1 + v2 * v2 + v3 * v3);
  }
  const len = length;
  function lengthSq(v) {
    const v0 = v[0];
    const v1 = v[1];
    const v2 = v[2];
    const v3 = v[3];
    return v0 * v0 + v1 * v1 + v2 * v2 + v3 * v3;
  }
  const lenSq = lengthSq;
  function normalize(v, dst) {
    const newDst = dst ?? new Ctor(4);
    const v0 = v[0];
    const v1 = v[1];
    const v2 = v[2];
    const v3 = v[3];
    const len2 = Math.sqrt(v0 * v0 + v1 * v1 + v2 * v2 + v3 * v3);
    if (len2 > 1e-5) {
      newDst[0] = v0 / len2;
      newDst[1] = v1 / len2;
      newDst[2] = v2 / len2;
      newDst[3] = v3 / len2;
    } else {
      newDst[0] = 0;
      newDst[1] = 0;
      newDst[2] = 0;
      newDst[3] = 1;
    }
    return newDst;
  }
  function equalsApproximately(a, b) {
    return Math.abs(a[0] - b[0]) < EPSILON2 && Math.abs(a[1] - b[1]) < EPSILON2 && Math.abs(a[2] - b[2]) < EPSILON2 && Math.abs(a[3] - b[3]) < EPSILON2;
  }
  function equals(a, b) {
    return a[0] === b[0] && a[1] === b[1] && a[2] === b[2] && a[3] === b[3];
  }
  function identity(dst) {
    const newDst = dst ?? new Ctor(4);
    newDst[0] = 0;
    newDst[1] = 0;
    newDst[2] = 0;
    newDst[3] = 1;
    return newDst;
  }
  const tempVec3 = vec33.create();
  const xUnitVec3 = vec33.create();
  const yUnitVec3 = vec33.create();
  function rotationTo(aUnit, bUnit, dst) {
    const newDst = dst ?? new Ctor(4);
    const dot2 = vec33.dot(aUnit, bUnit);
    if (dot2 < -0.999999) {
      vec33.cross(xUnitVec3, aUnit, tempVec3);
      if (vec33.len(tempVec3) < 1e-6) {
        vec33.cross(yUnitVec3, aUnit, tempVec3);
      }
      vec33.normalize(tempVec3, tempVec3);
      fromAxisAngle(tempVec3, Math.PI, newDst);
      return newDst;
    } else if (dot2 > 0.999999) {
      newDst[0] = 0;
      newDst[1] = 0;
      newDst[2] = 0;
      newDst[3] = 1;
      return newDst;
    } else {
      vec33.cross(aUnit, bUnit, tempVec3);
      newDst[0] = tempVec3[0];
      newDst[1] = tempVec3[1];
      newDst[2] = tempVec3[2];
      newDst[3] = 1 + dot2;
      return normalize(newDst, newDst);
    }
  }
  const tempQuat1 = new Ctor(4);
  const tempQuat2 = new Ctor(4);
  function sqlerp(a, b, c, d, t, dst) {
    const newDst = dst ?? new Ctor(4);
    slerp(a, d, t, tempQuat1);
    slerp(b, c, t, tempQuat2);
    slerp(tempQuat1, tempQuat2, 2 * t * (1 - t), newDst);
    return newDst;
  }
  return {
    create,
    fromValues,
    set,
    fromAxisAngle,
    toAxisAngle,
    angle,
    multiply,
    mul,
    rotateX,
    rotateY,
    rotateZ,
    slerp,
    inverse,
    conjugate,
    fromMat,
    fromEuler,
    copy,
    clone,
    add,
    subtract,
    sub,
    mulScalar,
    scale,
    divScalar,
    dot,
    lerp,
    length,
    len,
    lengthSq,
    lenSq,
    normalize,
    equalsApproximately,
    equals,
    identity,
    rotationTo,
    sqlerp
  };
}
var cache$12 = /* @__PURE__ */ new Map();
function getAPI$12(Ctor) {
  let api = cache$12.get(Ctor);
  if (!api) {
    api = getAPIImpl$12(Ctor);
    cache$12.set(Ctor, api);
  }
  return api;
}
function getAPIImpl2(Ctor) {
  function create(x, y, z, w) {
    const newDst = new Ctor(4);
    if (x !== void 0) {
      newDst[0] = x;
      if (y !== void 0) {
        newDst[1] = y;
        if (z !== void 0) {
          newDst[2] = z;
          if (w !== void 0) {
            newDst[3] = w;
          }
        }
      }
    }
    return newDst;
  }
  const fromValues = create;
  function set(x, y, z, w, dst) {
    const newDst = dst ?? new Ctor(4);
    newDst[0] = x;
    newDst[1] = y;
    newDst[2] = z;
    newDst[3] = w;
    return newDst;
  }
  function ceil(v, dst) {
    const newDst = dst ?? new Ctor(4);
    newDst[0] = Math.ceil(v[0]);
    newDst[1] = Math.ceil(v[1]);
    newDst[2] = Math.ceil(v[2]);
    newDst[3] = Math.ceil(v[3]);
    return newDst;
  }
  function floor(v, dst) {
    const newDst = dst ?? new Ctor(4);
    newDst[0] = Math.floor(v[0]);
    newDst[1] = Math.floor(v[1]);
    newDst[2] = Math.floor(v[2]);
    newDst[3] = Math.floor(v[3]);
    return newDst;
  }
  function round(v, dst) {
    const newDst = dst ?? new Ctor(4);
    newDst[0] = Math.round(v[0]);
    newDst[1] = Math.round(v[1]);
    newDst[2] = Math.round(v[2]);
    newDst[3] = Math.round(v[3]);
    return newDst;
  }
  function clamp(v, min2 = 0, max2 = 1, dst) {
    const newDst = dst ?? new Ctor(4);
    newDst[0] = Math.min(max2, Math.max(min2, v[0]));
    newDst[1] = Math.min(max2, Math.max(min2, v[1]));
    newDst[2] = Math.min(max2, Math.max(min2, v[2]));
    newDst[3] = Math.min(max2, Math.max(min2, v[3]));
    return newDst;
  }
  function add(a, b, dst) {
    const newDst = dst ?? new Ctor(4);
    newDst[0] = a[0] + b[0];
    newDst[1] = a[1] + b[1];
    newDst[2] = a[2] + b[2];
    newDst[3] = a[3] + b[3];
    return newDst;
  }
  function addScaled(a, b, scale2, dst) {
    const newDst = dst ?? new Ctor(4);
    newDst[0] = a[0] + b[0] * scale2;
    newDst[1] = a[1] + b[1] * scale2;
    newDst[2] = a[2] + b[2] * scale2;
    newDst[3] = a[3] + b[3] * scale2;
    return newDst;
  }
  function subtract(a, b, dst) {
    const newDst = dst ?? new Ctor(4);
    newDst[0] = a[0] - b[0];
    newDst[1] = a[1] - b[1];
    newDst[2] = a[2] - b[2];
    newDst[3] = a[3] - b[3];
    return newDst;
  }
  const sub = subtract;
  function equalsApproximately(a, b) {
    return Math.abs(a[0] - b[0]) < EPSILON2 && Math.abs(a[1] - b[1]) < EPSILON2 && Math.abs(a[2] - b[2]) < EPSILON2 && Math.abs(a[3] - b[3]) < EPSILON2;
  }
  function equals(a, b) {
    return a[0] === b[0] && a[1] === b[1] && a[2] === b[2] && a[3] === b[3];
  }
  function lerp(a, b, t, dst) {
    const newDst = dst ?? new Ctor(4);
    newDst[0] = a[0] + t * (b[0] - a[0]);
    newDst[1] = a[1] + t * (b[1] - a[1]);
    newDst[2] = a[2] + t * (b[2] - a[2]);
    newDst[3] = a[3] + t * (b[3] - a[3]);
    return newDst;
  }
  function lerpV(a, b, t, dst) {
    const newDst = dst ?? new Ctor(4);
    newDst[0] = a[0] + t[0] * (b[0] - a[0]);
    newDst[1] = a[1] + t[1] * (b[1] - a[1]);
    newDst[2] = a[2] + t[2] * (b[2] - a[2]);
    newDst[3] = a[3] + t[3] * (b[3] - a[3]);
    return newDst;
  }
  function max(a, b, dst) {
    const newDst = dst ?? new Ctor(4);
    newDst[0] = Math.max(a[0], b[0]);
    newDst[1] = Math.max(a[1], b[1]);
    newDst[2] = Math.max(a[2], b[2]);
    newDst[3] = Math.max(a[3], b[3]);
    return newDst;
  }
  function min(a, b, dst) {
    const newDst = dst ?? new Ctor(4);
    newDst[0] = Math.min(a[0], b[0]);
    newDst[1] = Math.min(a[1], b[1]);
    newDst[2] = Math.min(a[2], b[2]);
    newDst[3] = Math.min(a[3], b[3]);
    return newDst;
  }
  function mulScalar(v, k, dst) {
    const newDst = dst ?? new Ctor(4);
    newDst[0] = v[0] * k;
    newDst[1] = v[1] * k;
    newDst[2] = v[2] * k;
    newDst[3] = v[3] * k;
    return newDst;
  }
  const scale = mulScalar;
  function divScalar(v, k, dst) {
    const newDst = dst ?? new Ctor(4);
    newDst[0] = v[0] / k;
    newDst[1] = v[1] / k;
    newDst[2] = v[2] / k;
    newDst[3] = v[3] / k;
    return newDst;
  }
  function inverse(v, dst) {
    const newDst = dst ?? new Ctor(4);
    newDst[0] = 1 / v[0];
    newDst[1] = 1 / v[1];
    newDst[2] = 1 / v[2];
    newDst[3] = 1 / v[3];
    return newDst;
  }
  const invert = inverse;
  function dot(a, b) {
    return a[0] * b[0] + a[1] * b[1] + a[2] * b[2] + a[3] * b[3];
  }
  function length(v) {
    const v0 = v[0];
    const v1 = v[1];
    const v2 = v[2];
    const v3 = v[3];
    return Math.sqrt(v0 * v0 + v1 * v1 + v2 * v2 + v3 * v3);
  }
  const len = length;
  function lengthSq(v) {
    const v0 = v[0];
    const v1 = v[1];
    const v2 = v[2];
    const v3 = v[3];
    return v0 * v0 + v1 * v1 + v2 * v2 + v3 * v3;
  }
  const lenSq = lengthSq;
  function distance(a, b) {
    const dx = a[0] - b[0];
    const dy = a[1] - b[1];
    const dz = a[2] - b[2];
    const dw = a[3] - b[3];
    return Math.sqrt(dx * dx + dy * dy + dz * dz + dw * dw);
  }
  const dist = distance;
  function distanceSq(a, b) {
    const dx = a[0] - b[0];
    const dy = a[1] - b[1];
    const dz = a[2] - b[2];
    const dw = a[3] - b[3];
    return dx * dx + dy * dy + dz * dz + dw * dw;
  }
  const distSq = distanceSq;
  function normalize(v, dst) {
    const newDst = dst ?? new Ctor(4);
    const v0 = v[0];
    const v1 = v[1];
    const v2 = v[2];
    const v3 = v[3];
    const len2 = Math.sqrt(v0 * v0 + v1 * v1 + v2 * v2 + v3 * v3);
    if (len2 > 1e-5) {
      newDst[0] = v0 / len2;
      newDst[1] = v1 / len2;
      newDst[2] = v2 / len2;
      newDst[3] = v3 / len2;
    } else {
      newDst[0] = 0;
      newDst[1] = 0;
      newDst[2] = 0;
      newDst[3] = 0;
    }
    return newDst;
  }
  function negate(v, dst) {
    const newDst = dst ?? new Ctor(4);
    newDst[0] = -v[0];
    newDst[1] = -v[1];
    newDst[2] = -v[2];
    newDst[3] = -v[3];
    return newDst;
  }
  function copy(v, dst) {
    const newDst = dst ?? new Ctor(4);
    newDst[0] = v[0];
    newDst[1] = v[1];
    newDst[2] = v[2];
    newDst[3] = v[3];
    return newDst;
  }
  const clone = copy;
  function multiply(a, b, dst) {
    const newDst = dst ?? new Ctor(4);
    newDst[0] = a[0] * b[0];
    newDst[1] = a[1] * b[1];
    newDst[2] = a[2] * b[2];
    newDst[3] = a[3] * b[3];
    return newDst;
  }
  const mul = multiply;
  function divide(a, b, dst) {
    const newDst = dst ?? new Ctor(4);
    newDst[0] = a[0] / b[0];
    newDst[1] = a[1] / b[1];
    newDst[2] = a[2] / b[2];
    newDst[3] = a[3] / b[3];
    return newDst;
  }
  const div = divide;
  function zero(dst) {
    const newDst = dst ?? new Ctor(4);
    newDst[0] = 0;
    newDst[1] = 0;
    newDst[2] = 0;
    newDst[3] = 0;
    return newDst;
  }
  function transformMat4(v, m, dst) {
    const newDst = dst ?? new Ctor(4);
    const x = v[0];
    const y = v[1];
    const z = v[2];
    const w = v[3];
    newDst[0] = m[0] * x + m[4] * y + m[8] * z + m[12] * w;
    newDst[1] = m[1] * x + m[5] * y + m[9] * z + m[13] * w;
    newDst[2] = m[2] * x + m[6] * y + m[10] * z + m[14] * w;
    newDst[3] = m[3] * x + m[7] * y + m[11] * z + m[15] * w;
    return newDst;
  }
  function setLength(a, len2, dst) {
    const newDst = dst ?? new Ctor(4);
    normalize(a, newDst);
    return mulScalar(newDst, len2, newDst);
  }
  function truncate(a, maxLen, dst) {
    const newDst = dst ?? new Ctor(4);
    if (length(a) > maxLen) {
      return setLength(a, maxLen, newDst);
    }
    return copy(a, newDst);
  }
  function midpoint(a, b, dst) {
    const newDst = dst ?? new Ctor(4);
    return lerp(a, b, 0.5, newDst);
  }
  return {
    create,
    fromValues,
    set,
    ceil,
    floor,
    round,
    clamp,
    add,
    addScaled,
    subtract,
    sub,
    equalsApproximately,
    equals,
    lerp,
    lerpV,
    max,
    min,
    mulScalar,
    scale,
    divScalar,
    inverse,
    invert,
    dot,
    length,
    len,
    lengthSq,
    lenSq,
    distance,
    dist,
    distanceSq,
    distSq,
    normalize,
    negate,
    copy,
    clone,
    multiply,
    mul,
    divide,
    div,
    zero,
    transformMat4,
    setLength,
    truncate,
    midpoint
  };
}
var cache2 = /* @__PURE__ */ new Map();
function getAPI2(Ctor) {
  let api = cache2.get(Ctor);
  if (!api) {
    api = getAPIImpl2(Ctor);
    cache2.set(Ctor, api);
  }
  return api;
}
function wgpuMatrixAPI2(Mat3Ctor, Mat4Ctor, QuatCtor, Vec2Ctor, Vec3Ctor, Vec4Ctor) {
  return {
    /** @namespace mat4 */
    mat4: getAPI$22(Mat3Ctor),
    /** @namespace mat3 */
    mat3: getAPI$42(Mat4Ctor),
    /** @namespace quat */
    quat: getAPI$12(QuatCtor),
    /** @namespace vec2 */
    vec2: getAPI$52(Vec2Ctor),
    /** @namespace vec3 */
    vec3: getAPI$32(Vec3Ctor),
    /** @namespace vec4 */
    vec4: getAPI2(Vec4Ctor)
  };
}
var {
  /**
   * 4x4 Matrix functions that default to returning `Float32Array`
   * @namespace
   */
  mat4: mat42,
  /**
   * 3x3 Matrix functions that default to returning `Float32Array`
   * @namespace
   */
  mat3: mat32,
  /**
   * Quaternion functions that default to returning `Float32Array`
   * @namespace
   */
  quat: quat2,
  /**
   * Vec2 functions that default to returning `Float32Array`
   * @namespace
   */
  vec2: vec22,
  /**
   * Vec3 functions that default to returning `Float32Array`
   * @namespace
   */
  vec3: vec32,
  /**
   * Vec3 functions that default to returning `Float32Array`
   * @namespace
   */
  vec4: vec42
} = wgpuMatrixAPI2(Float32Array, Float32Array, Float32Array, Float32Array, Float32Array, Float32Array);
var {
  /**
   * 4x4 Matrix functions that default to returning `Float64Array`
   * @namespace
   */
  mat4: mat4d2,
  /**
   * 3x3 Matrix functions that default to returning `Float64Array`
   * @namespace
   */
  mat3: mat3d2,
  /**
   * Quaternion functions that default to returning `Float64Array`
   * @namespace
   */
  quat: quatd2,
  /**
   * Vec2 functions that default to returning `Float64Array`
   * @namespace
   */
  vec2: vec2d2,
  /**
   * Vec3 functions that default to returning `Float64Array`
   * @namespace
   */
  vec3: vec3d2,
  /**
   * Vec3 functions that default to returning `Float64Array`
   * @namespace
   */
  vec4: vec4d2
} = wgpuMatrixAPI2(Float64Array, Float64Array, Float64Array, Float64Array, Float64Array, Float64Array);
var {
  /**
   * 4x4 Matrix functions that default to returning `number[]`
   * @namespace
   */
  mat4: mat4n2,
  /**
   * 3x3 Matrix functions that default to returning `number[]`
   * @namespace
   */
  mat3: mat3n2,
  /**
   * Quaternion functions that default to returning `number[]`
   * @namespace
   */
  quat: quatn2,
  /**
   * Vec2 functions that default to returning `number[]`
   * @namespace
   */
  vec2: vec2n2,
  /**
   * Vec3 functions that default to returning `number[]`
   * @namespace
   */
  vec3: vec3n2,
  /**
   * Vec3 functions that default to returning `number[]`
   * @namespace
   */
  vec4: vec4n2
} = wgpuMatrixAPI2(ZeroArray2, Array, Array, Array, Array, Array);

// src/light/viewport.ts
var Viewport = class {
  vMatrix = mat42.create();
  canvasSize = { width: 1, height: 1 };
  center = [0, 0];
  zoom = 1;
  constructor(params) {
    this.setCanvasSize(params.canvasSize.width, params.canvasSize.height);
    const initialCenter = params.center ?? this.center;
    this.setCenter(...initialCenter);
    const initialZoom = params.zoom ?? 1;
    this.setZoom(initialZoom);
  }
  get viewMatrix() {
    return this.vMatrix;
  }
  get invertViewMatrix() {
    return mat42.inverse(this.vMatrix);
  }
  setCanvasSize(width, height) {
    this.canvasSize.width = width;
    this.canvasSize.height = height;
    this.updateViewMatrix();
  }
  setCenter(x, y) {
    this.center[0] = x;
    this.center[1] = y;
    this.updateViewMatrix();
  }
  setZoom(zoom) {
    this.zoom = zoom;
    this.updateViewMatrix();
  }
  viewportToWorld(position) {
    const result = vec42.transformMat4([...position, 0, 1], this.invertViewMatrix);
    return [
      result[0] / result[3],
      result[1] / result[3]
    ];
  }
  updateViewMatrix() {
    mat42.identity(this.vMatrix);
    mat42.scale(this.vMatrix, [this.zoom / this.canvasSize.width, this.zoom / this.canvasSize.height, 1], this.vMatrix);
    mat42.translate(this.vMatrix, [-this.center[0], -this.center[1], 0], this.vMatrix);
  }
};

// src/light/lights-buffer.ts
var LightsBuffer = class _LightsBuffer {
  static structs = {
    definition: `
struct Light {                //             align(16) size(48)
    color: vec3<f32>,         // offset(0)   align(16) size(12)
    size: f32,                // offset(12)  align(4)  size(4)
    position: vec2<f32>,      // offset(16)  align(8)  size(8)
    intensity: f32,           // offset(24)  align(4)  size(4)
    attenuationLinear: f32,   // offset(28)  align(4)  size(4)
    attenuationExp: f32,      // offset(32)  align(4)  size(4)
};

struct LightsBuffer {         //             align(16)
    count: u32,               // offset(0)   align(4)  size(4)
    // padding
    lights: array<Light>,     // offset(16)  align(16)
};
`,
    light: {
      size: { offset: 12 },
      position: { offset: 16 }
    },
    lightsBuffer: {
      lights: { offset: 16, stride: 48 }
    }
  };
  device;
  maxLightsCount;
  currentLightsCount = 0;
  buffer;
  get gpuBuffer() {
    return this.buffer.bufferGpu;
  }
  constructor(device, maxLightsCount) {
    this.device = device;
    this.maxLightsCount = maxLightsCount;
    const bufferCpu = new ArrayBuffer(_LightsBuffer.computeBufferBytesLength(maxLightsCount));
    const bufferGpu = device.createBuffer({
      label: "LightsBuffer buffer",
      size: bufferCpu.byteLength,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST | GPUBufferUsage.VERTEX
    });
    this.buffer = { bufferCpu, bufferGpu };
    this.setLights([]);
  }
  setLights(lights) {
    if (lights.length > this.maxLightsCount) {
      throw new Error(`Too many lights "${lights.length}", max is "${this.maxLightsCount}".`);
    }
    const newBufferLength = _LightsBuffer.computeBufferBytesLength(lights.length);
    new Uint32Array(this.buffer.bufferCpu, 0, 1).set([lights.length]);
    lights.forEach((light, index) => {
      new Float32Array(this.buffer.bufferCpu, _LightsBuffer.structs.lightsBuffer.lights.offset + _LightsBuffer.structs.lightsBuffer.lights.stride * index, 9).set([
        ...light.color,
        light.size,
        ...light.position,
        light.intensity,
        light.attenuationLinear,
        light.attenuationExp
      ]);
    });
    this.device.queue.writeBuffer(this.buffer.bufferGpu, 0, this.buffer.bufferCpu, 0, newBufferLength);
    this.currentLightsCount = lights.length;
  }
  get lightsCount() {
    return this.currentLightsCount;
  }
  static computeBufferBytesLength(lightsCount) {
    return _LightsBuffer.structs.lightsBuffer.lights.offset + _LightsBuffer.structs.lightsBuffer.lights.stride * lightsCount;
  }
};

// src/light/lights-renderer.ts
var LightsRenderer = class {
  device;
  targetTexture;
  renderPipeline;
  uniformsBufferGpu;
  bindgroup0;
  bindgroup1;
  renderBundle;
  lightsBuffer;
  constructor(params) {
    this.device = params.device;
    this.targetTexture = params.targetTexture;
    this.lightsBuffer = params.lightsBuffer;
    this.uniformsBufferGpu = params.device.createBuffer({
      label: "LightsRenderer uniforms buffer",
      size: 64,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
    });
    const shaderModule = params.device.createShaderModule({
      label: "LightsRenderer shader module",
      code: `
struct Uniforms {                  //           align(16) size(64)
    invertViewMatrix: mat4x4<f32>, // offset(0) align(16) size(64)
};

${LightsBuffer.structs.definition}

@group(0) @binding(0) var<uniform> uniforms: Uniforms;
@group(0) @binding(1) var<storage,read> lightsBuffer: LightsBuffer;
@group(1) @binding(0) var albedoTexture: texture_2d<f32>;
@group(1) @binding(1) var albedoSampler: sampler;

struct VertexIn {
    @builtin(vertex_index) vertexIndex: u32,
};

struct VertexOut {
    @builtin(position) position: vec4<f32>,
    @location(0) worldPosition: vec2<f32>,
    @location(1) uv: vec2<f32>,
};

@vertex
fn main_vertex(in: VertexIn) -> VertexOut {
    const corners = array<vec2<f32>, 4>(
        vec2<f32>(-1, -1),
        vec2<f32>(1, -1),
        vec2<f32>(-1, 1),
        vec2<f32>(1, 1),
    );
    let screenPosition = corners[in.vertexIndex];

    var out: VertexOut;
    out.position = vec4<f32>(screenPosition, 0.0, 1.0);
    out.worldPosition = (uniforms.invertViewMatrix * out.position).xy;
    out.uv = 0.5 + 0.5 * screenPosition * vec2<f32>(1.0, -1.0);
    return out;
}

struct FragmentOut {
    @location(0) color: vec4<f32>,
};

fn compute_lights(worldPosition: vec2<f32>) -> vec3<f32> {
    const ambiant = vec3<f32>(0.2);
    var color = vec3<f32>(ambiant);

    const maxUvDistance = 1.0;

    let lightsCount = lightsBuffer.count;
    for (var iLight = 0u; iLight < lightsCount; iLight++) {
        let light = lightsBuffer.lights[iLight];
        let lightSize = f32(${params.maxLightSize});
        let relativePosition = (worldPosition - light.position) / lightSize;
        if (max(abs(relativePosition.x), abs(relativePosition.y)) < maxUvDistance) {
            let lightIntensity = 1.0;
            color += lightIntensity * light.color;
        }
    }

    return color;
}

@fragment
fn main_fragment(in: VertexOut) -> FragmentOut {
    let light = compute_lights(in.worldPosition);
    let albedo = textureSample(albedoTexture, albedoSampler, in.uv);
    let color = albedo.rgb * light;

    var out: FragmentOut;
    out.color = vec4<f32>(color, 1.0);
    return out;
}
            `
    });
    this.renderPipeline = params.device.createRenderPipeline({
      label: "LightsRenderer renderpipeline",
      layout: "auto",
      vertex: {
        module: shaderModule,
        entryPoint: "main_vertex"
      },
      fragment: {
        module: shaderModule,
        entryPoint: "main_fragment",
        targets: [{
          format: this.targetTexture.format
        }]
      },
      primitive: {
        cullMode: "none",
        topology: "triangle-strip"
      }
    });
    const bindgroupLayout = this.renderPipeline.getBindGroupLayout(0);
    this.bindgroup0 = params.device.createBindGroup({
      label: "LightsRenderer bindgroup 0",
      layout: bindgroupLayout,
      entries: [
        {
          binding: 0,
          resource: { buffer: this.uniformsBufferGpu }
        },
        {
          binding: 1,
          resource: { buffer: this.lightsBuffer.gpuBuffer }
        }
      ]
    });
    this.bindgroup1 = this.buildBindgroup1(params.albedo);
    this.renderBundle = this.buildRenderBundle();
  }
  render(renderpassEncoder, viewMatrix) {
    const invertViewMatrix = mat42.inverse(viewMatrix);
    this.device.queue.writeBuffer(this.uniformsBufferGpu, 0, invertViewMatrix);
    renderpassEncoder.executeBundles([this.renderBundle]);
  }
  setAlbedo(albedo) {
    this.bindgroup1 = this.buildBindgroup1(albedo);
    this.renderBundle = this.buildRenderBundle();
  }
  buildBindgroup1(albedo) {
    return this.device.createBindGroup({
      label: "LightsRenderer bindgroup 1",
      layout: this.renderPipeline.getBindGroupLayout(1),
      entries: [
        {
          binding: 0,
          resource: albedo.view
        },
        {
          binding: 1,
          resource: albedo.sampler
        }
      ]
    });
  }
  buildRenderBundle() {
    const renderBundleEncoder = this.device.createRenderBundleEncoder({
      label: "LightsRenderer renderbundle encoder",
      colorFormats: [this.targetTexture.format]
    });
    renderBundleEncoder.setPipeline(this.renderPipeline);
    renderBundleEncoder.setBindGroup(0, this.bindgroup0);
    renderBundleEncoder.setBindGroup(1, this.bindgroup1);
    renderBundleEncoder.draw(4);
    return renderBundleEncoder.finish({ label: "LightsRenderer renderbundle" });
  }
};

// src/light/light.js
var light_default = {
  type: "cobalt:light",
  // the inputs and outputs to this node
  refs: [
    { name: "in", type: "textureView", format: "rgba16float", access: "read" },
    { name: "out", type: "textureView", format: "rgba16float", access: "write" }
  ],
  // cobalt event handling functions
  // @params Object cobalt renderer world object
  // @params Object options optional data passed when initing this node
  onInit: async function(cobalt, options = {}) {
    return init9(cobalt, options);
  },
  onRun: function(cobalt, node, webGpuCommandEncoder) {
    draw9(cobalt, node, webGpuCommandEncoder);
  },
  onDestroy: function(cobalt, node) {
    destroy7(node);
  },
  onResize: function(cobalt, node) {
    resize5(cobalt, node);
  },
  onViewportPosition: function(cobalt, node) {
    node.data.viewport.setCenter(...cobalt.viewport.position);
  },
  // optional
  customFunctions: {
    ...public_api_exports
  }
};
async function init9(cobalt, node) {
  const { device } = cobalt;
  const MAX_LIGHT_COUNT = 256;
  const MAX_LIGHT_SIZE = 256;
  const lightsBuffer = new LightsBuffer(device, MAX_LIGHT_COUNT);
  const viewport = new Viewport({
    canvasSize: {
      width: cobalt.viewport.width,
      height: cobalt.viewport.height
    },
    center: cobalt.viewport.position,
    zoom: cobalt.viewport.zoom
  });
  const lightsRenderer = new LightsRenderer({
    device,
    albedo: {
      view: node.refs.in.data.view,
      sampler: node.refs.in.data.sampler
    },
    targetTexture: node.refs.out.data.texture,
    lightsBuffer,
    maxLightSize: MAX_LIGHT_SIZE
  });
  return {
    lightsBuffer,
    lightsRenderer,
    viewport,
    lights: [{
      position: [0, 0],
      size: MAX_LIGHT_SIZE,
      color: [1, 0.5, 0.5],
      intensity: 1,
      attenuationLinear: 0,
      attenuationExp: 7
    }]
    // light config
  };
}
function draw9(cobalt, node, commandEncoder) {
  const renderpass = commandEncoder.beginRenderPass({
    colorAttachments: [
      {
        view: node.refs.out.data.view,
        clearValue: cobalt.clearValue,
        loadOp: "load",
        storeOp: "store"
      }
    ]
  });
  const lightsBuffer = node.data.lightsBuffer;
  lightsBuffer.setLights(node.data.lights);
  const viewMatrix = node.data.viewport.viewMatrix;
  const lightsRenderer = node.data.lightsRenderer;
  lightsRenderer.render(renderpass, viewMatrix);
  renderpass.end();
}
function destroy7(node) {
}
function resize5(cobalt, node) {
  node.data.lightsRenderer.setAlbedo({
    view: node.refs.in.data.view,
    sampler: node.refs.in.data.sampler
  });
  node.data.viewport.setCanvasSize(cobalt.viewport.width, cobalt.viewport.height);
}

// src/tile/tile.wgsl
var tile_default2 = "struct TransformData {\r\n    viewOffset: vec2<f32>,\r\n    viewportSize: vec2<f32>,\r\n    inverseAtlasTextureSize: vec2<f32>,\r\n    tileSize: f32,\r\n    inverseTileSize: f32,\r\n    //tileLayers: array<TileLayer, 32>,\r\n};\r\n\r\n\r\n//struct TileLayer {\r\n//    scrollScale: vec2<f32>,\r\n//    inverseTileTextureSize: vec2<f32>\r\n//};\r\n\r\n\r\nstruct TileScroll {\r\n    scrollScale: vec2<f32>\r\n};\r\n\r\n// fullscreen triangle position and uvs\r\nconst positions = array<vec2<f32>, 3>(\r\n    vec2<f32>(-1.0, -3.0),\r\n    vec2<f32>(3.0, 1.0),\r\n    vec2<f32>(-1.0, 1.0)\r\n);\r\n\r\nconst uvs = array<vec2<f32>, 3>(\r\n    vec2<f32>(0.0, 2.0),\r\n    vec2<f32>(2.0, 0.0),\r\n    vec2<f32>(0.0, 0.0)\r\n);\r\n\r\n\r\n// individual tile texture\r\n@binding(0) @group(0) var<uniform> myScroll: TileScroll;\r\n@binding(1) @group(0) var tileTexture: texture_2d<f32>;\r\n@binding(2) @group(0) var tileSampler: sampler;\r\n\r\n// common to all tile layers\r\n@binding(0) @group(1) var<uniform> transformUBO: TransformData;\r\n@binding(1) @group(1) var atlasTexture: texture_2d<f32>;\r\n@binding(2) @group(1) var atlasSampler: sampler;\r\n\r\n\r\nstruct Fragment {\r\n    @builtin(position) Position : vec4<f32>,\r\n    @location(0) TexCoord : vec2<f32>\r\n};\r\n\r\n\r\n@vertex\r\nfn vs_main (@builtin(instance_index) i_id : u32,\r\n            @builtin(vertex_index) VertexIndex : u32) -> Fragment  {\r\n\r\n    var vertexPosition = vec2<f32>(positions[VertexIndex]);\r\n    var vertexTexCoord = vec2<f32>(uvs[VertexIndex]);\r\n\r\n    var output : Fragment;\r\n\r\n    let inverseTileTextureSize = 1 / vec2<f32>(textureDimensions(tileTexture, 0));  // transformUBO.tileLayers[i_id].inverseTileTextureSize;\r\n\r\n    var scrollScale = myScroll.scrollScale; //transformUBO.tileLayers[i_id].scrollScale;\r\n\r\n    var viewOffset : vec2<f32> = transformUBO.viewOffset * scrollScale;\r\n\r\n    // from Brandon's webgl-tile shader\r\n    let PixelCoord = (vertexTexCoord * transformUBO.viewportSize) + viewOffset;\r\n\r\n    output.TexCoord = PixelCoord / transformUBO.tileSize;\r\n    output.Position = vec4<f32>(vertexPosition, 0.0, 1.0);\r\n    \r\n    return output;\r\n}\r\n\r\n\r\n// based off of a fantastic implementation by Gregg Tavares https://stackoverflow.com/a/53465085/1927767\r\n@fragment\r\nfn fs_main (@location(0) TexCoord: vec2<f32>) -> @location(0) vec4<f32> {\r\n\r\n    var tilemapCoord = floor(TexCoord);\r\n\r\n    var u_tilemapSize = vec2<f32>(textureDimensions(tileTexture, 0));\r\n    var tileFoo = fract((tilemapCoord + vec2<f32>(0.5, 0.5)) / u_tilemapSize);\r\n    var tile = floor(textureSample(tileTexture, tileSampler, tileFoo) * 255.0);\r\n\r\n    if (tile.x == 255 && tile.y == 255) {\r\n        discard;\r\n    }\r\n\r\n    var u_tilesetSize = vec2<f32>(textureDimensions(atlasTexture, 0)) / transformUBO.tileSize;\r\n\r\n    let u_tileUVMinBounds = vec2<f32>(0.5/transformUBO.tileSize, 0.5/transformUBO.tileSize);\r\n    let u_tileUVMaxBounds = vec2<f32>((transformUBO.tileSize - 0.5) / transformUBO.tileSize, (transformUBO.tileSize - 0.5) / transformUBO.tileSize);\r\n    var texcoord = clamp(fract(TexCoord), u_tileUVMinBounds, u_tileUVMaxBounds);\r\n\r\n    var tileCoord = (tile.xy + texcoord) / u_tilesetSize;\r\n\r\n    var color = textureSample(atlasTexture, atlasSampler, tileCoord);\r\n\r\n    if (color.a <= 0.1) {\r\n        discard;\r\n    }\r\n    return color;\r\n}\r\n";

// src/tile/atlas.js
var _buf = new Float32Array(8);
var atlas_default = {
  type: "cobalt:tileAtlas",
  refs: [],
  // @params Object cobalt renderer world object
  // @params Object options optional data passed when initing this node
  onInit: async function(cobalt, options = {}) {
    return init10(cobalt, options);
  },
  onRun: function(cobalt, node, webGpuCommandEncoder) {
  },
  onDestroy: function(cobalt, node) {
    destroy8(data);
  },
  onResize: function(cobalt, node) {
    _writeTileBuffer(cobalt, node);
  },
  onViewportPosition: function(cobalt, node) {
    _writeTileBuffer(cobalt, node);
  }
};
async function init10(cobalt, nodeData) {
  const { device } = cobalt;
  const atlasMaterial = await createTextureFromUrl(cobalt, "tile atlas", nodeData.options.textureUrl);
  const uniformBuffer = device.createBuffer({
    size: 32,
    //32 + (16 * 32), // in bytes.  32 for common data + (32 max tile layers * 16 bytes per tile layer)
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
  });
  const atlasBindGroupLayout = device.createBindGroupLayout({
    entries: [
      {
        binding: 0,
        visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
        buffer: {}
      },
      {
        binding: 1,
        visibility: GPUShaderStage.FRAGMENT,
        texture: {}
      },
      {
        binding: 2,
        visibility: GPUShaderStage.FRAGMENT,
        sampler: {}
      }
    ]
  });
  const atlasBindGroup = device.createBindGroup({
    layout: atlasBindGroupLayout,
    entries: [
      {
        binding: 0,
        resource: {
          buffer: uniformBuffer
        }
      },
      {
        binding: 1,
        resource: atlasMaterial.view
      },
      {
        binding: 2,
        resource: atlasMaterial.sampler
      }
    ]
  });
  const tileBindGroupLayout = device.createBindGroupLayout({
    entries: [
      {
        binding: 0,
        visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
        buffer: {}
      },
      {
        binding: 1,
        visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
        texture: {}
      },
      {
        binding: 2,
        visibility: GPUShaderStage.FRAGMENT,
        sampler: {}
      }
    ]
  });
  const pipelineLayout = device.createPipelineLayout({
    bindGroupLayouts: [tileBindGroupLayout, atlasBindGroupLayout]
  });
  const pipeline = device.createRenderPipeline({
    label: "tile",
    vertex: {
      module: device.createShaderModule({
        code: tile_default2
      }),
      entryPoint: "vs_main",
      buffers: []
    },
    fragment: {
      module: device.createShaderModule({
        code: tile_default2
      }),
      entryPoint: "fs_main",
      targets: [
        {
          format: "rgba16float",
          blend: {
            color: {
              srcFactor: "src-alpha",
              dstFactor: "one-minus-src-alpha"
            },
            alpha: {
              srcFactor: "zero",
              dstFactor: "one"
            }
          }
        }
      ]
    },
    primitive: {
      topology: "triangle-list"
    },
    layout: pipelineLayout
  });
  return {
    pipeline,
    uniformBuffer,
    atlasBindGroup,
    // tile atlas texture, transform UBO
    atlasMaterial,
    tileBindGroupLayout,
    tileSize: nodeData.options.tileSize,
    tileScale: nodeData.options.tileScale
  };
}
function destroy8(data2) {
  data2.atlasMaterial.texture.destroy();
  data2.atlasMaterial.texture = void 0;
}
function _writeTileBuffer(c, nodeData) {
  _buf[0] = c.viewport.position[0];
  _buf[1] = c.viewport.position[1];
  const tile = nodeData.data;
  const { tileScale, tileSize } = tile;
  const GAME_WIDTH = c.viewport.width / c.viewport.zoom;
  const GAME_HEIGHT = c.viewport.height / c.viewport.zoom;
  _buf[2] = GAME_WIDTH / tileScale;
  _buf[3] = GAME_HEIGHT / tileScale;
  _buf[4] = 1 / tile.atlasMaterial.texture.width;
  _buf[5] = 1 / tile.atlasMaterial.texture.height;
  _buf[6] = tileSize;
  _buf[7] = 1 / tileSize;
  c.device.queue.writeBuffer(tile.uniformBuffer, 0, _buf, 0, 8);
}

// src/sprite/read-spritesheet.js
function readSpriteSheet(spritesheetJson) {
  const spriteFloatCount = 5 * 6;
  const spriteCount = Object.keys(spritesheetJson.frames).length;
  const vertices = new Float32Array(spriteCount * spriteFloatCount);
  const locations = [];
  const spriteMeta = {};
  let i = 0;
  for (const frameName in spritesheetJson.frames) {
    const frame = spritesheetJson.frames[frameName];
    locations.push(frameName);
    spriteMeta[frameName] = frame.sourceSize;
    const minX = -0.5 + frame.spriteSourceSize.x / frame.sourceSize.w;
    const minY = -0.5 + frame.spriteSourceSize.y / frame.sourceSize.h;
    const maxX = -0.5 + (frame.spriteSourceSize.x + frame.spriteSourceSize.w) / frame.sourceSize.w;
    const maxY = -0.5 + (frame.spriteSourceSize.y + frame.spriteSourceSize.h) / frame.sourceSize.h;
    const p0 = [minX, minY, 0];
    const p1 = [minX, maxY, 0];
    const p2 = [maxX, maxY, 0];
    const p3 = [maxX, minY, 0];
    const minU = 0 + frame.frame.x / spritesheetJson.meta.size.w;
    const minV = 0 + frame.frame.y / spritesheetJson.meta.size.h;
    const maxU = 0 + (frame.frame.x + frame.frame.w) / spritesheetJson.meta.size.w;
    const maxV = 0 + (frame.frame.y + frame.frame.h) / spritesheetJson.meta.size.h;
    const uv0 = [minU, minV];
    const uv1 = [minU, maxV];
    const uv2 = [maxU, maxV];
    const uv3 = [maxU, minV];
    vertices.set(p0, i);
    vertices.set(uv0, i + 3);
    vertices.set(p1, i + 5);
    vertices.set(uv1, i + 8);
    vertices.set(p2, i + 10);
    vertices.set(uv2, i + 13);
    vertices.set(p0, i + 15);
    vertices.set(uv0, i + 18);
    vertices.set(p2, i + 20);
    vertices.set(uv2, i + 23);
    vertices.set(p3, i + 25);
    vertices.set(uv3, i + 28);
    i += spriteFloatCount;
  }
  return {
    /*spriteCount, */
    spriteMeta,
    locations,
    vertices
  };
}

// src/sprite/sprite.wgsl
var sprite_default2 = "struct TransformData {\r\n    view: mat4x4<f32>,\r\n    projection: mat4x4<f32>\r\n};\r\n\r\nstruct Sprite {\r\n    translate: vec2<f32>,\r\n    scale: vec2<f32>,\r\n    tint: vec4<f32>,\r\n    opacity: f32,\r\n    rotation: f32,\r\n    emissiveIntensity: f32,\r\n    sortValue: f32,\r\n};\r\n\r\nstruct SpritesBuffer {\r\n  models: array<Sprite>,\r\n};\r\n\r\n@binding(0) @group(0) var<uniform> transformUBO: TransformData;\r\n@binding(1) @group(0) var myTexture: texture_2d<f32>;\r\n@binding(2) @group(0) var mySampler: sampler;\r\n@binding(3) @group(0) var<storage, read> sprites : SpritesBuffer;\r\n@binding(4) @group(0) var emissiveTexture: texture_2d<f32>;\r\n\r\n\r\nstruct Fragment {\r\n    @builtin(position) Position : vec4<f32>,\r\n    @location(0) TexCoord : vec2<f32>,\r\n    @location(1) Tint : vec4<f32>,\r\n    @location(2) Opacity: f32,\r\n};\r\n\r\n// multiple render targets\r\nstruct GBufferOutput {\r\n  @location(0) color : vec4<f32>,\r\n  @location(1) emissive : vec4<f32>,\r\n}\r\n\r\n\r\n@vertex\r\nfn vs_main (@builtin(instance_index) i_id : u32, \r\n            @location(0) vertexPosition: vec3<f32>,\r\n            @location(1) vertexTexCoord: vec2<f32>) -> Fragment  {\r\n\r\n    var output : Fragment;\r\n\r\n    var sx: f32 = sprites.models[i_id].scale.x;\r\n    var sy: f32 = sprites.models[i_id].scale.y;\r\n    var sz: f32 = 1.0;\r\n\r\n    var rot: f32 = sprites.models[i_id].rotation;\r\n\r\n    var tx: f32 = sprites.models[i_id].translate.x;\r\n    var ty: f32 = sprites.models[i_id].translate.y;\r\n    var tz: f32 = 0;\r\n\r\n    var s = sin(rot);\r\n    var c = cos(rot);\r\n\r\n    // https://webglfundamentals.org/webgl/lessons/webgl-2d-matrices.html\r\n\r\n    var scaleM: mat4x4<f32> = mat4x4<f32>(sx, 0.0, 0.0, 0.0,\r\n                                         0.0,  sy, 0.0, 0.0,\r\n                                         0.0, 0.0, sz, 0.0,\r\n                                           0,   0,   0, 1.0);\r\n\r\n    // rotation and translation\r\n    var modelM: mat4x4<f32> = mat4x4<f32>(c,   s, 0.0, 0.0,\r\n                                         -s,   c, 0.0, 0.0,\r\n                                        0.0, 0.0, 1.0, 0.0,\r\n                                         tx,  ty,  tz, 1.0) * scaleM;\r\n\r\n    //output.Position = transformUBO.projection * transformUBO.view * sprites.models[i_id].modelMatrix * vec4<f32>(vertexPosition, 1.0);\r\n    output.Position = transformUBO.projection * transformUBO.view * modelM * vec4<f32>(vertexPosition, 1.0);\r\n\r\n    output.TexCoord = vertexTexCoord;\r\n    output.Tint = sprites.models[i_id].tint;\r\n    output.Opacity = sprites.models[i_id].opacity;\r\n    \r\n    return output;\r\n}\r\n\r\n@fragment\r\nfn fs_main (@location(0) TexCoord: vec2<f32>,\r\n            @location(1) Tint: vec4<f32>,\r\n            @location(2) Opacity: f32) -> GBufferOutput {\r\n    \r\n\r\n    var output : GBufferOutput;\r\n\r\n    var outColor: vec4<f32> = textureSample(myTexture, mySampler, TexCoord);\r\n    output.color = vec4<f32>(outColor.rgb * (1.0 - Tint.a) + (Tint.rgb * Tint.a), outColor.a * Opacity);\r\n\r\n    let emissive = textureSample(emissiveTexture, mySampler, TexCoord);\r\n\r\n    // the alpha channel in the emissive texture is used for emission strength\r\n    output.emissive = vec4(emissive.rgb, 1.0) * emissive.a;\r\n\r\n    //output.emissive = textureSample(emissiveTexture, mySampler, TexCoord) * EmissiveIntensity;\r\n\r\n    return output;\r\n}\r\n";

// src/sprite/spritesheet.js
var _tmpVec34 = vec3.create(0, 0, 0);
var spritesheet_default = {
  type: "cobalt:spritesheet",
  refs: [],
  // @params Object cobalt renderer world object
  // @params Object options optional data passed when initing this node
  onInit: async function(cobalt, options = {}) {
    return init11(cobalt, options);
  },
  onRun: function(cobalt, node, webGpuCommandEncoder) {
  },
  onDestroy: function(cobalt, node) {
    destroy9(node);
  },
  onResize: function(cobalt, node) {
    _writeSpriteBuffer(cobalt, node);
  },
  onViewportPosition: function(cobalt, node) {
    _writeSpriteBuffer(cobalt, node);
  }
};
async function init11(cobalt, node) {
  const { canvas, device } = cobalt;
  let spritesheet, colorTexture, emissiveTexture;
  if (canvas) {
    spritesheet = await fetchJson(node.options.spriteSheetJsonUrl);
    spritesheet = readSpriteSheet(spritesheet);
    colorTexture = await createTextureFromUrl(cobalt, "sprite", node.options.colorTextureUrl, "rgba8unorm");
    emissiveTexture = await createTextureFromUrl(cobalt, "emissive sprite", node.options.emissiveTextureUrl, "rgba8unorm");
    canvas.style.imageRendering = "pixelated";
  } else {
    spritesheet = readSpriteSheet(node.options.spriteSheetJson);
    colorTexture = await createTextureFromBuffer(cobalt, "sprite", node.options.colorTexture, "rgba8unorm");
    emissiveTexture = await createTextureFromBuffer(cobalt, "emissive sprite", node.options.emissiveTexture, "rgba8unorm");
  }
  const quads = createSpriteQuads(device, spritesheet);
  const uniformBuffer = device.createBuffer({
    size: 64 * 2,
    // 4x4 matrix with 4 bytes per float32, times 2 matrices (view, projection)
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
  });
  const bindGroupLayout = device.createBindGroupLayout({
    entries: [
      {
        binding: 0,
        visibility: GPUShaderStage.VERTEX,
        buffer: {}
      },
      {
        binding: 1,
        visibility: GPUShaderStage.FRAGMENT,
        texture: {}
      },
      {
        binding: 2,
        visibility: GPUShaderStage.FRAGMENT,
        sampler: {}
      },
      {
        binding: 3,
        visibility: GPUShaderStage.VERTEX,
        buffer: {
          type: "read-only-storage"
        }
      },
      {
        binding: 4,
        visibility: GPUShaderStage.FRAGMENT,
        texture: {}
      }
    ]
  });
  const pipelineLayout = device.createPipelineLayout({
    bindGroupLayouts: [bindGroupLayout]
  });
  const pipeline = device.createRenderPipeline({
    label: "sprite",
    vertex: {
      module: device.createShaderModule({
        code: sprite_default2
      }),
      entryPoint: "vs_main",
      buffers: [quads.bufferLayout]
    },
    fragment: {
      module: device.createShaderModule({
        code: sprite_default2
      }),
      entryPoint: "fs_main",
      targets: [
        // color
        {
          format: "rgba16float",
          blend: {
            color: {
              srcFactor: "src-alpha",
              dstFactor: "one-minus-src-alpha"
            },
            alpha: {
              srcFactor: "zero",
              dstFactor: "one"
            }
          }
        },
        // emissive
        {
          format: "rgba16float"
        }
      ]
    },
    primitive: {
      topology: "triangle-list"
    },
    layout: pipelineLayout
  });
  return {
    pipeline,
    uniformBuffer,
    // perspective and view matrices for the camera
    quads,
    colorTexture,
    emissiveTexture,
    bindGroupLayout,
    spritesheet
  };
}
function destroy9(node) {
  node.data.quads.buffer.destroy();
  node.data.colorTexture.buffer.destroy();
  node.data.uniformBuffer.destroy();
  node.data.emissiveTexture.texture.destroy();
}
async function fetchJson(url) {
  const raw = await fetch(url);
  return raw.json();
}
function _writeSpriteBuffer(cobalt, node) {
  const { device, viewport } = cobalt;
  const GAME_WIDTH = viewport.width / viewport.zoom;
  const GAME_HEIGHT = viewport.height / viewport.zoom;
  const projection = mat4.ortho(0, GAME_WIDTH, GAME_HEIGHT, 0, -10, 10);
  vec3.set(-viewport.position[0], -viewport.position[1], 0, _tmpVec34);
  const view = mat4.translation(_tmpVec34);
  device.queue.writeBuffer(node.data.uniformBuffer, 0, view.buffer);
  device.queue.writeBuffer(node.data.uniformBuffer, 64, projection.buffer);
}

// src/fb-texture/fb-texture.js
var fb_texture_default = {
  type: "fbTexture",
  refs: [],
  // @params Object cobalt renderer world object
  // @params Object options optional data passed when initing this node
  onInit: async function(cobalt, options = {}) {
    return init12(cobalt, options);
  },
  onRun: function(cobalt, node, webGpuCommandEncoder) {
  },
  onDestroy: function(cobalt, node) {
    destroy10(data);
  },
  onResize: function(cobalt, node) {
    resize6(cobalt, node);
  },
  onViewportPosition: function(cobalt, node) {
  }
};
async function init12(cobalt, node) {
  const { device } = cobalt;
  const { label, mip_count, format, usage, viewportScale } = node.options;
  return createTexture(device, label, cobalt.viewport.width * viewportScale, cobalt.viewport.height * viewportScale, mip_count, format, usage);
}
function destroy10(node) {
  node.data.texture.destroy();
}
function resize6(cobalt, node) {
  const { device } = cobalt;
  destroy10(node);
  const { width, height } = cobalt.viewport;
  const { options } = node;
  const scale = node.options.viewportScale;
  node.data = createTexture(device, options.label, width * scale, height * scale, options.mip_count, options.format, options.usage);
}

// src/cobalt.js
async function init13(ctx, viewportWidth, viewportHeight) {
  let device, gpu, context, canvas;
  if (ctx.sdlWindow && ctx.gpu) {
    gpu = ctx.gpu;
    const instance = gpu.create(["verbose=1"]);
    const adapter = await instance.requestAdapter();
    device = await adapter.requestDevice();
    context = gpu.renderGPUDeviceToWindow({ device, window: ctx.sdlWindow });
    global.GPUBufferUsage = gpu.GPUBufferUsage;
    global.GPUShaderStage = gpu.GPUShaderStage;
    global.GPUTextureUsage = gpu.GPUTextureUsage;
  } else {
    canvas = ctx;
    const adapter = await navigator.gpu?.requestAdapter({ powerPreference: "high-performance" });
    device = await adapter?.requestDevice();
    gpu = navigator.gpu;
    context = canvas.getContext("webgpu");
    context.configure({
      device,
      format: navigator.gpu?.getPreferredCanvasFormat(),
      // bgra8unorm
      alphaMode: "opaque"
    });
  }
  const nodeDefs = {
    // built in resource nodes
    "cobalt:tileAtlas": atlas_default,
    "cobalt:spritesheet": spritesheet_default,
    "cobalt:fbTexture": fb_texture_default,
    // builtin run nodes
    "cobalt:bloom": bloom_default2,
    "cobalt:composite": scene_composite_default2,
    "cobalt:sprite": sprite_default,
    "cobalt:tile": tile_default,
    "cobalt:displacement": displacement_default2,
    "cobalt:overlay": overlay_default2,
    "cobalt:fbBlit": fb_blit_default2,
    "cobalt:primitives": primitives_default2,
    "cobalt:light": light_default
  };
  return {
    nodeDefs,
    // runnable nodes. ordering dictates render order (first to last)
    nodes: [],
    // keeps references to all node refs that need to access the per-frame default texture view
    // these refs are updated on each invocation of Cobalt.draw(...)
    defaultTextureViewRefs: [],
    canvas,
    device,
    context,
    gpu,
    // used in the color attachments of renderpass
    clearValue: { r: 0, g: 0, b: 0, a: 1 },
    viewport: {
      width: viewportWidth,
      height: viewportHeight,
      zoom: 1,
      position: [0, 0]
      // top-left corner of the viewport
    }
  };
}
function defineNode(c, nodeDefinition) {
  if (!nodeDefinition?.type)
    throw new Error(`Can't define a new node missing a type.`);
  c.nodeDefs[nodeDefinition.type] = nodeDefinition;
}
async function initNode(c, nodeData) {
  const nodeDef = c.nodeDefs[nodeData?.type];
  if (!nodeDef)
    throw new Error(`Can't initialize a new node missing a type.`);
  const node = {
    type: nodeData.type,
    refs: nodeData.refs || {},
    options: nodeData.options || {},
    data: {},
    enabled: true
    // when disabled, the node won't be run
  };
  for (const refName in node.refs) {
    if (node.refs[refName] === "FRAME_TEXTURE_VIEW") {
      c.defaultTextureViewRefs.push({ node, refName });
      node.refs[refName] = getCurrentTextureView(c);
    }
  }
  node.data = await nodeDef.onInit(c, node);
  const customFunctions = nodeDef.customFunctions || {};
  for (const fnName in customFunctions) {
    node[fnName] = function(...args) {
      return customFunctions[fnName](c, node, ...args);
    };
  }
  c.nodes.push(node);
  return node;
}
function draw10(c) {
  const { device, context } = c;
  const commandEncoder = device.createCommandEncoder();
  const v = getCurrentTextureView(c);
  for (const r of c.defaultTextureViewRefs)
    r.node.refs[r.refName] = v;
  for (const node of c.nodes) {
    if (!node.enabled)
      continue;
    const nodeDef = c.nodeDefs[node.type];
    nodeDef.onRun(c, node, commandEncoder);
  }
  device.queue.submit([commandEncoder.finish()]);
  if (!c.canvas)
    c.context.swap();
}
function reset(c) {
  for (const n of c.nodes) {
    const nodeDef = c.nodeDefs[n.type];
    nodeDef.onDestroy(c, n);
  }
  c.nodes.length = 0;
  c.defaultTextureViewRefs.length = 0;
}
function setViewportDimensions(c, width, height) {
  c.viewport.width = width;
  c.viewport.height = height;
  for (const n of c.nodes) {
    const nodeDef = c.nodeDefs[n.type];
    nodeDef.onResize(c, n);
  }
}
function setViewportPosition(c, pos) {
  c.viewport.position[0] = pos[0] - c.viewport.width / 2 / c.viewport.zoom;
  c.viewport.position[1] = pos[1] - c.viewport.height / 2 / c.viewport.zoom;
  for (const n of c.nodes) {
    const nodeDef = c.nodeDefs[n.type];
    nodeDef.onViewportPosition(c, n);
  }
}
function getPreferredFormat(cobalt) {
  if (cobalt.canvas)
    return navigator.gpu.getPreferredCanvasFormat();
  else
    return cobalt.context.getPreferredFormat();
}
function getCurrentTextureView(cobalt) {
  if (cobalt.canvas)
    return cobalt.context.getCurrentTexture().createView();
  else {
    return cobalt.context.getCurrentTextureView();
  }
}
export {
  createTexture,
  createTextureFromBuffer,
  createTextureFromUrl,
  defineNode,
  draw10 as draw,
  getCurrentTextureView,
  getPreferredFormat,
  init13 as init,
  initNode,
  reset,
  setViewportDimensions,
  setViewportPosition
};
