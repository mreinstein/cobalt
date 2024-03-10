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
var bloom_default = "const BLOOM_MIP_COUNT:i32=7;const MODE_PREFILTER:u32=0u;const MODE_DOWNSAMPLE:u32=1u;const MODE_UPSAMPLE_FIRST:u32=2u;const MODE_UPSAMPLE:u32=3u;const EPSILON:f32=1.0e-4;struct bloom_param{parameters:vec4<f32>,combine_constant:f32,doop:u32,ferp:u32,}struct mode_lod_param{mode_lod:u32,}@group(0)@binding(0)var output_texture:texture_storage_2d<rgba16float,write>;@group(0)@binding(1)var input_texture:texture_2d<f32>;@group(0)@binding(2)var bloom_texture:texture_2d<f32>;@group(0)@binding(3)var samp:sampler;@group(0)@binding(4)var<uniform> param:bloom_param;@group(0)@binding(5)var<uniform> pc:mode_lod_param;fn QuadraticThreshold(color:vec4<f32>,threshold:f32,curve:vec3<f32>)->vec4<f32>{let brightness=max(max(color.r,color.g),color.b);var rq:f32=clamp(brightness-curve.x,0.0,curve.y);rq=curve.z*(rq*rq);let ret_color=color*max(rq,brightness-threshold)/max(brightness,EPSILON);return ret_color;}fn Prefilter(color:vec4<f32>,uv:vec2<f32>)->vec4<f32>{let clamp_value=20.0;var c=min(vec4<f32>(clamp_value),color);c=QuadraticThreshold(color,param.parameters.x,param.parameters.yzw);return c;}fn DownsampleBox13(tex:texture_2d<f32>,lod:f32,uv:vec2<f32>,tex_size:vec2<f32>)->vec3<f32>{let A=textureSampleLevel(tex,samp,uv,lod).rgb;let texel_size=tex_size*0.5;let B=textureSampleLevel(tex,samp,uv+texel_size*vec2<f32>(-1.0,-1.0),lod).rgb;let C=textureSampleLevel(tex,samp,uv+texel_size*vec2<f32>(-1.0,1.0),lod).rgb;let D=textureSampleLevel(tex,samp,uv+texel_size*vec2<f32>(1.0,1.0),lod).rgb;let E=textureSampleLevel(tex,samp,uv+texel_size*vec2<f32>(1.0,-1.0),lod).rgb;let F=textureSampleLevel(tex,samp,uv+texel_size*vec2<f32>(-2.0,-2.0),lod).rgb;let G=textureSampleLevel(tex,samp,uv+texel_size*vec2<f32>(-2.0,0.0),lod).rgb;let H=textureSampleLevel(tex,samp,uv+texel_size*vec2<f32>(0.0,2.0),lod).rgb;let I=textureSampleLevel(tex,samp,uv+texel_size*vec2<f32>(2.0,2.0),lod).rgb;let J=textureSampleLevel(tex,samp,uv+texel_size*vec2<f32>(2.0,2.0),lod).rgb;let K=textureSampleLevel(tex,samp,uv+texel_size*vec2<f32>(2.0,0.0),lod).rgb;let L=textureSampleLevel(tex,samp,uv+texel_size*vec2<f32>(-2.0,-2.0),lod).rgb;let M=textureSampleLevel(tex,samp,uv+texel_size*vec2<f32>(0.0,-2.0),lod).rgb;var result:vec3<f32>=vec3<f32>(0.0);result=result+(B+C+D+E)*0.5;result=result+(F+G+A+M)*0.125;result=result+(G+H+I+A)*0.125;result=result+(A+I+J+K)*0.125;result=result+(M+A+K+L)*0.125;result=result*0.25;return result;}fn UpsampleTent9(tex:texture_2d<f32>,lod:f32,uv:vec2<f32>,texel_size:vec2<f32>,radius:f32)->vec3<f32>{let offset=texel_size.xyxy*vec4<f32>(1.0,1.0,-1.0,0.0)*radius;var result:vec3<f32>=textureSampleLevel(tex,samp,uv,lod).rgb*4.0;result=result+textureSampleLevel(tex,samp,uv-offset.xy,lod).rgb;result=result+textureSampleLevel(tex,samp,uv-offset.wy,lod).rgb*2.0;result=result+textureSampleLevel(tex,samp,uv-offset.zy,lod).rgb;result=result+textureSampleLevel(tex,samp,uv+offset.zw,lod).rgb*2.0;result=result+textureSampleLevel(tex,samp,uv+offset.xw,lod).rgb*2.0;result=result+textureSampleLevel(tex,samp,uv+offset.zy,lod).rgb;result=result+textureSampleLevel(tex,samp,uv+offset.wy,lod).rgb*2.0;result=result+textureSampleLevel(tex,samp,uv+offset.xy,lod).rgb;return result*(1.0/16.0);}fn combine(ex_color:vec3<f32>,color_to_add:vec3<f32>,combine_constant:f32)->vec3<f32>{let existing_color=ex_color+(-color_to_add);let blended_color=(combine_constant*existing_color)+color_to_add;return blended_color;}@compute @workgroup_size(8,4,1)fn cs_main(@builtin(global_invocation_id)global_invocation_id:vec3<u32>){let mode=pc.mode_lod>>16u;let lod=pc.mode_lod&65535u;let imgSize=textureDimensions(output_texture);if(global_invocation_id.x<=u32(imgSize.x)&&global_invocation_id.y<=u32(imgSize.y)){var texCoords:vec2<f32>=vec2<f32>(f32(global_invocation_id.x)/f32(imgSize.x),f32(global_invocation_id.y)/f32(imgSize.y));texCoords=texCoords+(1.0/vec2<f32>(imgSize))*0.5;let texSize=vec2<f32>(textureDimensions(input_texture,i32(lod)));var color:vec4<f32>=vec4<f32>(1.0);if(mode==MODE_PREFILTER){color=vec4<f32>(DownsampleBox13(input_texture,f32(lod),texCoords,1.0/texSize),1.0);color=Prefilter(color,texCoords);}else if(mode==MODE_DOWNSAMPLE){color=vec4<f32>(DownsampleBox13(input_texture,f32(lod),texCoords,1.0/texSize),1.0);}else if(mode==MODE_UPSAMPLE_FIRST){let bloomTexSize=textureDimensions(input_texture,i32(lod)+1);let sampleScale=1.0;let upsampledTexture=UpsampleTent9(input_texture,f32(lod)+1.0,texCoords,1.0/vec2<f32>(bloomTexSize),sampleScale);let existing=textureSampleLevel(input_texture,samp,texCoords,f32(lod)).rgb;color=vec4<f32>(combine(existing,upsampledTexture,param.combine_constant),1.0);}else if(mode==MODE_UPSAMPLE){let bloomTexSize=textureDimensions(bloom_texture,i32(lod)+1);let sampleScale=1.0;let upsampledTexture=UpsampleTent9(bloom_texture,f32(lod)+1.0,texCoords,1.0/vec2<f32>(bloomTexSize),sampleScale);let existing=textureSampleLevel(input_texture,samp,texCoords,f32(lod)).rgb;color=vec4<f32>(combine(existing,upsampledTexture,param.combine_constant),1.0);}textureStore(output_texture,vec2<i32>(global_invocation_id.xy),color);}}";

// src/bloom/bloom.js
var BLOOM_MIP_COUNT = 7;
var MODE_PREFILTER = 0;
var MODE_DOWNSAMPLE = 1;
var MODE_UPSAMPLE_FIRST = 2;
var MODE_UPSAMPLE = 3;
var bloom_default2 = {
  type: "bloom",
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
var scene_composite_default = "struct BloomComposite{bloom_intensity:f32,bloom_combine_constant:f32,}@group(0)@binding(0)var mySampler:sampler;@group(0)@binding(1)var colorTexture:texture_2d<f32>;@group(0)@binding(2)var emissiveTexture:texture_2d<f32>;@group(0)@binding(3)var<uniform> composite_parameter:BloomComposite;struct VertexOutput{@builtin(position)Position:vec4<f32>,@location(0)fragUV:vec2<f32>,}@vertex fn vert_main(@builtin(vertex_index)VertexIndex:u32)->VertexOutput{const pos=array(vec2(1.0,1.0),vec2(1.0,-1.0),vec2(-1.0,-1.0),vec2(1.0,1.0),vec2(-1.0,-1.0),vec2(-1.0,1.0),);const uv=array(vec2(1.0,0.0),vec2(1.0,1.0),vec2(0.0,1.0),vec2(1.0,0.0),vec2(0.0,1.0),vec2(0.0,0.0),);var output:VertexOutput;output.Position=vec4(pos[VertexIndex],0.0,1.0);output.fragUV=uv[VertexIndex];return output;}fn GTTonemap_point(x:f32)->f32{let m:f32=0.22;let a:f32=1.0;let c:f32=1.33;let P:f32=1.0;let l:f32=0.4;let l0:f32=((P-m)*l)/a;let S0:f32=m+l0;let S1:f32=m+a*l0;let C2:f32=(a*P)/(P-S1);let L:f32=m+a*(x-m);let T:f32=m*pow(x/m,c);let S:f32=P-(P-S1)*exp(-C2*(x-S0)/P);let w0:f32=1.0-smoothstep(0.0,m,x);var w2:f32=1.0;if(x<m+l){w2=0.0;}let w1:f32=1.0-w0-w2;return f32(T*w0+L*w1+S*w2);}fn GTTonemap(x:vec3<f32>)->vec3<f32>{return vec3<f32>(GTTonemap_point(x.r),GTTonemap_point(x.g),GTTonemap_point(x.b));}fn aces(x:vec3<f32>)->vec3<f32>{let a:f32=2.51;let b:f32=0.03;let c:f32=2.43;let d:f32=0.59;let e:f32=0.14;return clamp((x*(a*x+b))/(x*(c*x+d)+e),vec3<f32>(0.0),vec3<f32>(1.0));}@fragment fn frag_main(@location(0)fragUV:vec2<f32>)->@location(0)vec4<f32>{let hdr_color=textureSample(colorTexture,mySampler,fragUV);let bloom_color=textureSample(emissiveTexture,mySampler,fragUV);let combined_color=((bloom_color*composite_parameter.bloom_intensity)*composite_parameter.bloom_combine_constant);let mapped_color=GTTonemap(combined_color.rgb);let gamma_corrected_color=pow(mapped_color,vec3<f32>(1.0/2.2));return vec4<f32>(gamma_corrected_color+hdr_color.rgb,1.0);}";

// src/scene-composite/scene-composite.js
var scene_composite_default2 = {
  type: "bloom",
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
  passEncoder.draw(6, 1, 0, 0);
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

// src/sprite/SpriteRenderPass.js
var SpriteRenderPass_exports = {};
__export(SpriteRenderPass_exports, {
  addSprite: () => addSprite,
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

// src/sprite/SpriteRenderPass.js
function addSprite(cobalt, renderPass, name, position, scale2, tint, opacity, rotation2, zIndex) {
  const spritesheet = renderPass.refs.spritesheet.data.spritesheet;
  renderPass = renderPass.data;
  const spriteType = spritesheet.locations.indexOf(name);
  const insertIdx = sortedBinaryInsert(zIndex, spriteType, renderPass);
  const offset = (insertIdx + 1) * FLOAT32S_PER_SPRITE;
  renderPass.spriteData.set(
    renderPass.spriteData.subarray(insertIdx * FLOAT32S_PER_SPRITE, renderPass.spriteCount * FLOAT32S_PER_SPRITE),
    offset
  );
  copySpriteDataToBuffer(renderPass, spritesheet, insertIdx, name, position, scale2, tint, opacity, rotation2, zIndex);
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
function setSpriteName(cobalt, renderPass, spriteId, name, scale2) {
  const spritesheet = renderPass.refs.spritesheet.data.spritesheet;
  renderPass = renderPass.data;
  const spriteType = spritesheet.locations.indexOf(name);
  const SPRITE_WIDTH = spritesheet.spriteMeta[name].w;
  const SPRITE_HEIGHT = spritesheet.spriteMeta[name].h;
  const spriteIdx = renderPass.spriteIndices.get(spriteId);
  const offset = spriteIdx * FLOAT32S_PER_SPRITE;
  renderPass.spriteData[offset + 2] = SPRITE_WIDTH * scale2[0];
  renderPass.spriteData[offset + 3] = SPRITE_HEIGHT * scale2[1];
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
function setSpriteRotation(cobalt, renderPass, spriteId, rotation2) {
  renderPass = renderPass.data;
  const spriteIdx = renderPass.spriteIndices.get(spriteId);
  const offset = spriteIdx * FLOAT32S_PER_SPRITE;
  renderPass.spriteData[offset + 9] = rotation2;
  renderPass.dirty = true;
}
function setSprite(cobalt, renderPass, spriteId, name, position, scale2, tint, opacity, rotation2, zIndex) {
  const spritesheet = renderPass.refs.spritesheet.data.spritesheet;
  renderPass = renderPass.data;
  const spriteIdx = renderPass.spriteIndices.get(spriteId);
  copySpriteDataToBuffer(renderPass, spritesheet, spriteIdx, name, position, scale2, tint, opacity, rotation2, zIndex);
  renderPass.dirty = true;
}
function copySpriteDataToBuffer(renderPass, spritesheet, insertIdx, name, position, scale2, tint, opacity, rotation2, zIndex) {
  if (!spritesheet.spriteMeta[name])
    throw new Error(`Sprite name ${name} could not be found in the spritesheet metaData`);
  const offset = insertIdx * FLOAT32S_PER_SPRITE;
  const SPRITE_WIDTH = spritesheet.spriteMeta[name].w;
  const SPRITE_HEIGHT = spritesheet.spriteMeta[name].h;
  const spriteType = spritesheet.locations.indexOf(name);
  const sortValue = zIndex << 16 & 16711680 | spriteType & 65535;
  renderPass.spriteData[offset] = position[0];
  renderPass.spriteData[offset + 1] = position[1];
  renderPass.spriteData[offset + 2] = SPRITE_WIDTH * scale2[0];
  renderPass.spriteData[offset + 3] = SPRITE_HEIGHT * scale2[1];
  renderPass.spriteData[offset + 4] = tint[0];
  renderPass.spriteData[offset + 5] = tint[1];
  renderPass.spriteData[offset + 6] = tint[2];
  renderPass.spriteData[offset + 7] = tint[3];
  renderPass.spriteData[offset + 8] = opacity;
  renderPass.spriteData[offset + 9] = rotation2;
  renderPass.spriteData[offset + 11] = sortValue;
}

// src/sprite/sprite.js
var sprite_default = {
  type: "sprite",
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
    ...SpriteRenderPass_exports
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
  type: "tile",
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
  renderpass.setVertexBuffer(0, tileAtlas.quad.buffer);
  renderpass.setBindGroup(0, nodeData.data.bindGroup);
  renderpass.setBindGroup(1, tileAtlas.atlasBindGroup);
  renderpass.draw(6, 1, 0, 0);
  renderpass.end();
}
function destroy3(nodeData) {
  nodeData.data.material.texture.destroy();
  nodeData.data.material.texture = void 0;
}

// src/displacement/displacement.wgsl
var displacement_default = "struct TransformData{view:mat4x4<f32>,projection:mat4x4<f32>};struct displacement_param{offset:vec2<f32>,scale:f32,noop:f32};@binding(0)@group(0)var<uniform> transformUBO:TransformData;@binding(1)@group(0)var myTexture:texture_2d<f32>;@binding(2)@group(0)var mySampler:sampler;@binding(3)@group(0)var mapTexture:texture_2d<f32>;@binding(4)@group(0)var<uniform> param:displacement_param;struct Fragment{@builtin(position)Position:vec4<f32>,@location(0)TexCoord:vec2<f32>};const sx:f32=1.0;const sy:f32=1.0;const sz:f32=1.0;const tx:f32=1.0;const ty:f32=1.0;const tz:f32=0;const rot:f32=0.0;const s=sin(rot);const c=cos(rot);const scaleM:mat4x4<f32>=mat4x4<f32>(sx,0.0,0.0,0.0,0.0,sy,0.0,0.0,0.0,0.0,sz,0.0,0,0,0,1.0);const modelM:mat4x4<f32>=mat4x4<f32>(c,s,0.0,0.0,-s,c,0.0,0.0,0.0,0.0,1.0,0.0,tx,ty,tz,1.0)*scaleM;@vertex fn vs_main(@location(0)vertexPosition:vec2<f32>)->Fragment{var output:Fragment;output.Position=transformUBO.projection*transformUBO.view*modelM*vec4<f32>(vertexPosition,0.0,1.0);output.TexCoord=vec2<f32>((output.Position.xy+1.0)/2.0);output.TexCoord.y=1.0-output.TexCoord.y;return output;}@fragment fn fs_main(@location(0)TexCoord:vec2<f32>)->@location(0)vec4<f32>{let dims=vec2<f32>(textureDimensions(mapTexture,0));let inv=param.offset/dims;var map:vec4<f32>=textureSample(mapTexture,mySampler,TexCoord+inv);let scale=param.scale;map-=0.5;let invTexSize=1/dims;map.x=scale*invTexSize.x*map.x;map.y=scale*invTexSize.y*map.y;var clamped:vec2<f32>=vec2<f32>(TexCoord.x+map.x,TexCoord.y+map.y);clamped=clamp(clamped,vec2<f32>(0,0),vec2<f32>(1,1));let outColor:vec4<f32>=textureSample(myTexture,mySampler,clamped);return outColor;}";

// http-url:https://wgpu-matrix.org/dist/2.x/wgpu-matrix.module.js
var EPSILON = 1e-6;
var VecType$2 = Float32Array;
function setDefaultType$6(ctor) {
  const oldType = VecType$2;
  VecType$2 = ctor;
  return oldType;
}
function create$5(x = 0, y = 0) {
  const dst = new VecType$2(2);
  if (x !== void 0) {
    dst[0] = x;
    if (y !== void 0) {
      dst[1] = y;
    }
  }
  return dst;
}
var VecType$1 = Float32Array;
function setDefaultType$5(ctor) {
  const oldType = VecType$1;
  VecType$1 = ctor;
  return oldType;
}
function create$4(x, y, z) {
  const dst = new VecType$1(3);
  if (x !== void 0) {
    dst[0] = x;
    if (y !== void 0) {
      dst[1] = y;
      if (z !== void 0) {
        dst[2] = z;
      }
    }
  }
  return dst;
}
var fromValues$3 = create$5;
function set$5(x, y, dst) {
  dst = dst || new VecType$2(2);
  dst[0] = x;
  dst[1] = y;
  return dst;
}
function ceil$2(v, dst) {
  dst = dst || new VecType$2(2);
  dst[0] = Math.ceil(v[0]);
  dst[1] = Math.ceil(v[1]);
  return dst;
}
function floor$2(v, dst) {
  dst = dst || new VecType$2(2);
  dst[0] = Math.floor(v[0]);
  dst[1] = Math.floor(v[1]);
  return dst;
}
function round$2(v, dst) {
  dst = dst || new VecType$2(2);
  dst[0] = Math.round(v[0]);
  dst[1] = Math.round(v[1]);
  return dst;
}
function clamp$2(v, min2 = 0, max2 = 1, dst) {
  dst = dst || new VecType$2(2);
  dst[0] = Math.min(max2, Math.max(min2, v[0]));
  dst[1] = Math.min(max2, Math.max(min2, v[1]));
  return dst;
}
function add$3(a, b, dst) {
  dst = dst || new VecType$2(2);
  dst[0] = a[0] + b[0];
  dst[1] = a[1] + b[1];
  return dst;
}
function addScaled$2(a, b, scale2, dst) {
  dst = dst || new VecType$2(2);
  dst[0] = a[0] + b[0] * scale2;
  dst[1] = a[1] + b[1] * scale2;
  return dst;
}
function angle$2(a, b) {
  const ax = a[0];
  const ay = a[1];
  const bx = a[0];
  const by = a[1];
  const mag1 = Math.sqrt(ax * ax + ay * ay);
  const mag2 = Math.sqrt(bx * bx + by * by);
  const mag = mag1 * mag2;
  const cosine = mag && dot$3(a, b) / mag;
  return Math.acos(cosine);
}
function subtract$3(a, b, dst) {
  dst = dst || new VecType$2(2);
  dst[0] = a[0] - b[0];
  dst[1] = a[1] - b[1];
  return dst;
}
var sub$3 = subtract$3;
function equalsApproximately$5(a, b) {
  return Math.abs(a[0] - b[0]) < EPSILON && Math.abs(a[1] - b[1]) < EPSILON;
}
function equals$5(a, b) {
  return a[0] === b[0] && a[1] === b[1];
}
function lerp$3(a, b, t, dst) {
  dst = dst || new VecType$2(2);
  dst[0] = a[0] + t * (b[0] - a[0]);
  dst[1] = a[1] + t * (b[1] - a[1]);
  return dst;
}
function lerpV$2(a, b, t, dst) {
  dst = dst || new VecType$2(2);
  dst[0] = a[0] + t[0] * (b[0] - a[0]);
  dst[1] = a[1] + t[1] * (b[1] - a[1]);
  return dst;
}
function max$2(a, b, dst) {
  dst = dst || new VecType$2(2);
  dst[0] = Math.max(a[0], b[0]);
  dst[1] = Math.max(a[1], b[1]);
  return dst;
}
function min$2(a, b, dst) {
  dst = dst || new VecType$2(2);
  dst[0] = Math.min(a[0], b[0]);
  dst[1] = Math.min(a[1], b[1]);
  return dst;
}
function mulScalar$3(v, k, dst) {
  dst = dst || new VecType$2(2);
  dst[0] = v[0] * k;
  dst[1] = v[1] * k;
  return dst;
}
var scale$5 = mulScalar$3;
function divScalar$3(v, k, dst) {
  dst = dst || new VecType$2(2);
  dst[0] = v[0] / k;
  dst[1] = v[1] / k;
  return dst;
}
function inverse$5(v, dst) {
  dst = dst || new VecType$2(2);
  dst[0] = 1 / v[0];
  dst[1] = 1 / v[1];
  return dst;
}
var invert$4 = inverse$5;
function cross$1(a, b, dst) {
  dst = dst || new VecType$1(3);
  const z = a[0] * b[1] - a[1] * b[0];
  dst[0] = 0;
  dst[1] = 0;
  dst[2] = z;
  return dst;
}
function dot$3(a, b) {
  return a[0] * b[0] + a[1] * b[1];
}
function length$3(v) {
  const v0 = v[0];
  const v1 = v[1];
  return Math.sqrt(v0 * v0 + v1 * v1);
}
var len$3 = length$3;
function lengthSq$3(v) {
  const v0 = v[0];
  const v1 = v[1];
  return v0 * v0 + v1 * v1;
}
var lenSq$3 = lengthSq$3;
function distance$2(a, b) {
  const dx = a[0] - b[0];
  const dy = a[1] - b[1];
  return Math.sqrt(dx * dx + dy * dy);
}
var dist$2 = distance$2;
function distanceSq$2(a, b) {
  const dx = a[0] - b[0];
  const dy = a[1] - b[1];
  return dx * dx + dy * dy;
}
var distSq$2 = distanceSq$2;
function normalize$3(v, dst) {
  dst = dst || new VecType$2(2);
  const v0 = v[0];
  const v1 = v[1];
  const len2 = Math.sqrt(v0 * v0 + v1 * v1);
  if (len2 > 1e-5) {
    dst[0] = v0 / len2;
    dst[1] = v1 / len2;
  } else {
    dst[0] = 0;
    dst[1] = 0;
  }
  return dst;
}
function negate$4(v, dst) {
  dst = dst || new VecType$2(2);
  dst[0] = -v[0];
  dst[1] = -v[1];
  return dst;
}
function copy$5(v, dst) {
  dst = dst || new VecType$2(2);
  dst[0] = v[0];
  dst[1] = v[1];
  return dst;
}
var clone$5 = copy$5;
function multiply$5(a, b, dst) {
  dst = dst || new VecType$2(2);
  dst[0] = a[0] * b[0];
  dst[1] = a[1] * b[1];
  return dst;
}
var mul$5 = multiply$5;
function divide$2(a, b, dst) {
  dst = dst || new VecType$2(2);
  dst[0] = a[0] / b[0];
  dst[1] = a[1] / b[1];
  return dst;
}
var div$2 = divide$2;
function random$1(scale2 = 1, dst) {
  dst = dst || new VecType$2(2);
  const angle = Math.random() * 2 * Math.PI;
  dst[0] = Math.cos(angle) * scale2;
  dst[1] = Math.sin(angle) * scale2;
  return dst;
}
function zero$2(dst) {
  dst = dst || new VecType$2(2);
  dst[0] = 0;
  dst[1] = 0;
  return dst;
}
function transformMat4$2(v, m, dst) {
  dst = dst || new VecType$2(2);
  const x = v[0];
  const y = v[1];
  dst[0] = x * m[0] + y * m[4] + m[12];
  dst[1] = x * m[1] + y * m[5] + m[13];
  return dst;
}
function transformMat3$1(v, m, dst) {
  dst = dst || new VecType$2(2);
  const x = v[0];
  const y = v[1];
  dst[0] = m[0] * x + m[4] * y + m[8];
  dst[1] = m[1] * x + m[5] * y + m[9];
  return dst;
}
var vec2Impl = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  create: create$5,
  setDefaultType: setDefaultType$6,
  fromValues: fromValues$3,
  set: set$5,
  ceil: ceil$2,
  floor: floor$2,
  round: round$2,
  clamp: clamp$2,
  add: add$3,
  addScaled: addScaled$2,
  angle: angle$2,
  subtract: subtract$3,
  sub: sub$3,
  equalsApproximately: equalsApproximately$5,
  equals: equals$5,
  lerp: lerp$3,
  lerpV: lerpV$2,
  max: max$2,
  min: min$2,
  mulScalar: mulScalar$3,
  scale: scale$5,
  divScalar: divScalar$3,
  inverse: inverse$5,
  invert: invert$4,
  cross: cross$1,
  dot: dot$3,
  length: length$3,
  len: len$3,
  lengthSq: lengthSq$3,
  lenSq: lenSq$3,
  distance: distance$2,
  dist: dist$2,
  distanceSq: distanceSq$2,
  distSq: distSq$2,
  normalize: normalize$3,
  negate: negate$4,
  copy: copy$5,
  clone: clone$5,
  multiply: multiply$5,
  mul: mul$5,
  divide: divide$2,
  div: div$2,
  random: random$1,
  zero: zero$2,
  transformMat4: transformMat4$2,
  transformMat3: transformMat3$1
});
var ctorMap = /* @__PURE__ */ new Map([
  [Float32Array, () => new Float32Array(12)],
  [Float64Array, () => new Float64Array(12)],
  [Array, () => new Array(12).fill(0)]
]);
var newMat3 = ctorMap.get(Float32Array);
var fromValues$2 = create$4;
function set$3(x, y, z, dst) {
  dst = dst || new VecType$1(3);
  dst[0] = x;
  dst[1] = y;
  dst[2] = z;
  return dst;
}
function ceil$1(v, dst) {
  dst = dst || new VecType$1(3);
  dst[0] = Math.ceil(v[0]);
  dst[1] = Math.ceil(v[1]);
  dst[2] = Math.ceil(v[2]);
  return dst;
}
function floor$1(v, dst) {
  dst = dst || new VecType$1(3);
  dst[0] = Math.floor(v[0]);
  dst[1] = Math.floor(v[1]);
  dst[2] = Math.floor(v[2]);
  return dst;
}
function round$1(v, dst) {
  dst = dst || new VecType$1(3);
  dst[0] = Math.round(v[0]);
  dst[1] = Math.round(v[1]);
  dst[2] = Math.round(v[2]);
  return dst;
}
function clamp$1(v, min2 = 0, max2 = 1, dst) {
  dst = dst || new VecType$1(3);
  dst[0] = Math.min(max2, Math.max(min2, v[0]));
  dst[1] = Math.min(max2, Math.max(min2, v[1]));
  dst[2] = Math.min(max2, Math.max(min2, v[2]));
  return dst;
}
function add$2(a, b, dst) {
  dst = dst || new VecType$1(3);
  dst[0] = a[0] + b[0];
  dst[1] = a[1] + b[1];
  dst[2] = a[2] + b[2];
  return dst;
}
function addScaled$1(a, b, scale2, dst) {
  dst = dst || new VecType$1(3);
  dst[0] = a[0] + b[0] * scale2;
  dst[1] = a[1] + b[1] * scale2;
  dst[2] = a[2] + b[2] * scale2;
  return dst;
}
function angle$1(a, b) {
  const ax = a[0];
  const ay = a[1];
  const az = a[2];
  const bx = a[0];
  const by = a[1];
  const bz = a[2];
  const mag1 = Math.sqrt(ax * ax + ay * ay + az * az);
  const mag2 = Math.sqrt(bx * bx + by * by + bz * bz);
  const mag = mag1 * mag2;
  const cosine = mag && dot$2(a, b) / mag;
  return Math.acos(cosine);
}
function subtract$2(a, b, dst) {
  dst = dst || new VecType$1(3);
  dst[0] = a[0] - b[0];
  dst[1] = a[1] - b[1];
  dst[2] = a[2] - b[2];
  return dst;
}
var sub$2 = subtract$2;
function equalsApproximately$3(a, b) {
  return Math.abs(a[0] - b[0]) < EPSILON && Math.abs(a[1] - b[1]) < EPSILON && Math.abs(a[2] - b[2]) < EPSILON;
}
function equals$3(a, b) {
  return a[0] === b[0] && a[1] === b[1] && a[2] === b[2];
}
function lerp$2(a, b, t, dst) {
  dst = dst || new VecType$1(3);
  dst[0] = a[0] + t * (b[0] - a[0]);
  dst[1] = a[1] + t * (b[1] - a[1]);
  dst[2] = a[2] + t * (b[2] - a[2]);
  return dst;
}
function lerpV$1(a, b, t, dst) {
  dst = dst || new VecType$1(3);
  dst[0] = a[0] + t[0] * (b[0] - a[0]);
  dst[1] = a[1] + t[1] * (b[1] - a[1]);
  dst[2] = a[2] + t[2] * (b[2] - a[2]);
  return dst;
}
function max$1(a, b, dst) {
  dst = dst || new VecType$1(3);
  dst[0] = Math.max(a[0], b[0]);
  dst[1] = Math.max(a[1], b[1]);
  dst[2] = Math.max(a[2], b[2]);
  return dst;
}
function min$1(a, b, dst) {
  dst = dst || new VecType$1(3);
  dst[0] = Math.min(a[0], b[0]);
  dst[1] = Math.min(a[1], b[1]);
  dst[2] = Math.min(a[2], b[2]);
  return dst;
}
function mulScalar$2(v, k, dst) {
  dst = dst || new VecType$1(3);
  dst[0] = v[0] * k;
  dst[1] = v[1] * k;
  dst[2] = v[2] * k;
  return dst;
}
var scale$3 = mulScalar$2;
function divScalar$2(v, k, dst) {
  dst = dst || new VecType$1(3);
  dst[0] = v[0] / k;
  dst[1] = v[1] / k;
  dst[2] = v[2] / k;
  return dst;
}
function inverse$3(v, dst) {
  dst = dst || new VecType$1(3);
  dst[0] = 1 / v[0];
  dst[1] = 1 / v[1];
  dst[2] = 1 / v[2];
  return dst;
}
var invert$2 = inverse$3;
function cross(a, b, dst) {
  dst = dst || new VecType$1(3);
  const t1 = a[2] * b[0] - a[0] * b[2];
  const t2 = a[0] * b[1] - a[1] * b[0];
  dst[0] = a[1] * b[2] - a[2] * b[1];
  dst[1] = t1;
  dst[2] = t2;
  return dst;
}
function dot$2(a, b) {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}
function length$2(v) {
  const v0 = v[0];
  const v1 = v[1];
  const v2 = v[2];
  return Math.sqrt(v0 * v0 + v1 * v1 + v2 * v2);
}
var len$2 = length$2;
function lengthSq$2(v) {
  const v0 = v[0];
  const v1 = v[1];
  const v2 = v[2];
  return v0 * v0 + v1 * v1 + v2 * v2;
}
var lenSq$2 = lengthSq$2;
function distance$1(a, b) {
  const dx = a[0] - b[0];
  const dy = a[1] - b[1];
  const dz = a[2] - b[2];
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}
var dist$1 = distance$1;
function distanceSq$1(a, b) {
  const dx = a[0] - b[0];
  const dy = a[1] - b[1];
  const dz = a[2] - b[2];
  return dx * dx + dy * dy + dz * dz;
}
var distSq$1 = distanceSq$1;
function normalize$2(v, dst) {
  dst = dst || new VecType$1(3);
  const v0 = v[0];
  const v1 = v[1];
  const v2 = v[2];
  const len2 = Math.sqrt(v0 * v0 + v1 * v1 + v2 * v2);
  if (len2 > 1e-5) {
    dst[0] = v0 / len2;
    dst[1] = v1 / len2;
    dst[2] = v2 / len2;
  } else {
    dst[0] = 0;
    dst[1] = 0;
    dst[2] = 0;
  }
  return dst;
}
function negate$2(v, dst) {
  dst = dst || new VecType$1(3);
  dst[0] = -v[0];
  dst[1] = -v[1];
  dst[2] = -v[2];
  return dst;
}
function copy$3(v, dst) {
  dst = dst || new VecType$1(3);
  dst[0] = v[0];
  dst[1] = v[1];
  dst[2] = v[2];
  return dst;
}
var clone$3 = copy$3;
function multiply$3(a, b, dst) {
  dst = dst || new VecType$1(3);
  dst[0] = a[0] * b[0];
  dst[1] = a[1] * b[1];
  dst[2] = a[2] * b[2];
  return dst;
}
var mul$3 = multiply$3;
function divide$1(a, b, dst) {
  dst = dst || new VecType$1(3);
  dst[0] = a[0] / b[0];
  dst[1] = a[1] / b[1];
  dst[2] = a[2] / b[2];
  return dst;
}
var div$1 = divide$1;
function random(scale2 = 1, dst) {
  dst = dst || new VecType$1(3);
  const angle = Math.random() * 2 * Math.PI;
  const z = Math.random() * 2 - 1;
  const zScale = Math.sqrt(1 - z * z) * scale2;
  dst[0] = Math.cos(angle) * zScale;
  dst[1] = Math.sin(angle) * zScale;
  dst[2] = z * scale2;
  return dst;
}
function zero$1(dst) {
  dst = dst || new VecType$1(3);
  dst[0] = 0;
  dst[1] = 0;
  dst[2] = 0;
  return dst;
}
function transformMat4$1(v, m, dst) {
  dst = dst || new VecType$1(3);
  const x = v[0];
  const y = v[1];
  const z = v[2];
  const w = m[3] * x + m[7] * y + m[11] * z + m[15] || 1;
  dst[0] = (m[0] * x + m[4] * y + m[8] * z + m[12]) / w;
  dst[1] = (m[1] * x + m[5] * y + m[9] * z + m[13]) / w;
  dst[2] = (m[2] * x + m[6] * y + m[10] * z + m[14]) / w;
  return dst;
}
function transformMat4Upper3x3(v, m, dst) {
  dst = dst || new VecType$1(3);
  const v0 = v[0];
  const v1 = v[1];
  const v2 = v[2];
  dst[0] = v0 * m[0 * 4 + 0] + v1 * m[1 * 4 + 0] + v2 * m[2 * 4 + 0];
  dst[1] = v0 * m[0 * 4 + 1] + v1 * m[1 * 4 + 1] + v2 * m[2 * 4 + 1];
  dst[2] = v0 * m[0 * 4 + 2] + v1 * m[1 * 4 + 2] + v2 * m[2 * 4 + 2];
  return dst;
}
function transformMat3(v, m, dst) {
  dst = dst || new VecType$1(3);
  const x = v[0];
  const y = v[1];
  const z = v[2];
  dst[0] = x * m[0] + y * m[4] + z * m[8];
  dst[1] = x * m[1] + y * m[5] + z * m[9];
  dst[2] = x * m[2] + y * m[6] + z * m[10];
  return dst;
}
function transformQuat(v, q, dst) {
  dst = dst || new VecType$1(3);
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
  dst[0] = x + uvX * w2 + (qy * uvZ - qz * uvY) * 2;
  dst[1] = y + uvY * w2 + (qz * uvX - qx * uvZ) * 2;
  dst[2] = z + uvZ * w2 + (qx * uvY - qy * uvX) * 2;
  return dst;
}
function getTranslation$1(m, dst) {
  dst = dst || new VecType$1(3);
  dst[0] = m[12];
  dst[1] = m[13];
  dst[2] = m[14];
  return dst;
}
function getAxis$1(m, axis, dst) {
  dst = dst || new VecType$1(3);
  const off = axis * 4;
  dst[0] = m[off + 0];
  dst[1] = m[off + 1];
  dst[2] = m[off + 2];
  return dst;
}
function getScaling$1(m, dst) {
  dst = dst || new VecType$1(3);
  const xx = m[0];
  const xy = m[1];
  const xz = m[2];
  const yx = m[4];
  const yy = m[5];
  const yz = m[6];
  const zx = m[8];
  const zy = m[9];
  const zz = m[10];
  dst[0] = Math.sqrt(xx * xx + xy * xy + xz * xz);
  dst[1] = Math.sqrt(yx * yx + yy * yy + yz * yz);
  dst[2] = Math.sqrt(zx * zx + zy * zy + zz * zz);
  return dst;
}
var vec3Impl = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  create: create$4,
  setDefaultType: setDefaultType$5,
  fromValues: fromValues$2,
  set: set$3,
  ceil: ceil$1,
  floor: floor$1,
  round: round$1,
  clamp: clamp$1,
  add: add$2,
  addScaled: addScaled$1,
  angle: angle$1,
  subtract: subtract$2,
  sub: sub$2,
  equalsApproximately: equalsApproximately$3,
  equals: equals$3,
  lerp: lerp$2,
  lerpV: lerpV$1,
  max: max$1,
  min: min$1,
  mulScalar: mulScalar$2,
  scale: scale$3,
  divScalar: divScalar$2,
  inverse: inverse$3,
  invert: invert$2,
  cross,
  dot: dot$2,
  length: length$2,
  len: len$2,
  lengthSq: lengthSq$2,
  lenSq: lenSq$2,
  distance: distance$1,
  dist: dist$1,
  distanceSq: distanceSq$1,
  distSq: distSq$1,
  normalize: normalize$2,
  negate: negate$2,
  copy: copy$3,
  clone: clone$3,
  multiply: multiply$3,
  mul: mul$3,
  divide: divide$1,
  div: div$1,
  random,
  zero: zero$1,
  transformMat4: transformMat4$1,
  transformMat4Upper3x3,
  transformMat3,
  transformQuat,
  getTranslation: getTranslation$1,
  getAxis: getAxis$1,
  getScaling: getScaling$1
});
var MatType = Float32Array;
function setDefaultType$3(ctor) {
  const oldType = MatType;
  MatType = ctor;
  return oldType;
}
function create$2(v0, v1, v2, v3, v4, v5, v6, v7, v8, v9, v10, v11, v12, v13, v14, v15) {
  const dst = new MatType(16);
  if (v0 !== void 0) {
    dst[0] = v0;
    if (v1 !== void 0) {
      dst[1] = v1;
      if (v2 !== void 0) {
        dst[2] = v2;
        if (v3 !== void 0) {
          dst[3] = v3;
          if (v4 !== void 0) {
            dst[4] = v4;
            if (v5 !== void 0) {
              dst[5] = v5;
              if (v6 !== void 0) {
                dst[6] = v6;
                if (v7 !== void 0) {
                  dst[7] = v7;
                  if (v8 !== void 0) {
                    dst[8] = v8;
                    if (v9 !== void 0) {
                      dst[9] = v9;
                      if (v10 !== void 0) {
                        dst[10] = v10;
                        if (v11 !== void 0) {
                          dst[11] = v11;
                          if (v12 !== void 0) {
                            dst[12] = v12;
                            if (v13 !== void 0) {
                              dst[13] = v13;
                              if (v14 !== void 0) {
                                dst[14] = v14;
                                if (v15 !== void 0) {
                                  dst[15] = v15;
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
  return dst;
}
function set$2(v0, v1, v2, v3, v4, v5, v6, v7, v8, v9, v10, v11, v12, v13, v14, v15, dst) {
  dst = dst || new MatType(16);
  dst[0] = v0;
  dst[1] = v1;
  dst[2] = v2;
  dst[3] = v3;
  dst[4] = v4;
  dst[5] = v5;
  dst[6] = v6;
  dst[7] = v7;
  dst[8] = v8;
  dst[9] = v9;
  dst[10] = v10;
  dst[11] = v11;
  dst[12] = v12;
  dst[13] = v13;
  dst[14] = v14;
  dst[15] = v15;
  return dst;
}
function fromMat3(m3, dst) {
  dst = dst || new MatType(16);
  dst[0] = m3[0];
  dst[1] = m3[1];
  dst[2] = m3[2];
  dst[3] = 0;
  dst[4] = m3[4];
  dst[5] = m3[5];
  dst[6] = m3[6];
  dst[7] = 0;
  dst[8] = m3[8];
  dst[9] = m3[9];
  dst[10] = m3[10];
  dst[11] = 0;
  dst[12] = 0;
  dst[13] = 0;
  dst[14] = 0;
  dst[15] = 1;
  return dst;
}
function fromQuat(q, dst) {
  dst = dst || new MatType(16);
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
  dst[0] = 1 - yy - zz;
  dst[1] = yx + wz;
  dst[2] = zx - wy;
  dst[3] = 0;
  dst[4] = yx - wz;
  dst[5] = 1 - xx - zz;
  dst[6] = zy + wx;
  dst[7] = 0;
  dst[8] = zx + wy;
  dst[9] = zy - wx;
  dst[10] = 1 - xx - yy;
  dst[11] = 0;
  dst[12] = 0;
  dst[13] = 0;
  dst[14] = 0;
  dst[15] = 1;
  return dst;
}
function negate$1(m, dst) {
  dst = dst || new MatType(16);
  dst[0] = -m[0];
  dst[1] = -m[1];
  dst[2] = -m[2];
  dst[3] = -m[3];
  dst[4] = -m[4];
  dst[5] = -m[5];
  dst[6] = -m[6];
  dst[7] = -m[7];
  dst[8] = -m[8];
  dst[9] = -m[9];
  dst[10] = -m[10];
  dst[11] = -m[11];
  dst[12] = -m[12];
  dst[13] = -m[13];
  dst[14] = -m[14];
  dst[15] = -m[15];
  return dst;
}
function copy$2(m, dst) {
  dst = dst || new MatType(16);
  dst[0] = m[0];
  dst[1] = m[1];
  dst[2] = m[2];
  dst[3] = m[3];
  dst[4] = m[4];
  dst[5] = m[5];
  dst[6] = m[6];
  dst[7] = m[7];
  dst[8] = m[8];
  dst[9] = m[9];
  dst[10] = m[10];
  dst[11] = m[11];
  dst[12] = m[12];
  dst[13] = m[13];
  dst[14] = m[14];
  dst[15] = m[15];
  return dst;
}
var clone$2 = copy$2;
function equalsApproximately$2(a, b) {
  return Math.abs(a[0] - b[0]) < EPSILON && Math.abs(a[1] - b[1]) < EPSILON && Math.abs(a[2] - b[2]) < EPSILON && Math.abs(a[3] - b[3]) < EPSILON && Math.abs(a[4] - b[4]) < EPSILON && Math.abs(a[5] - b[5]) < EPSILON && Math.abs(a[6] - b[6]) < EPSILON && Math.abs(a[7] - b[7]) < EPSILON && Math.abs(a[8] - b[8]) < EPSILON && Math.abs(a[9] - b[9]) < EPSILON && Math.abs(a[10] - b[10]) < EPSILON && Math.abs(a[11] - b[11]) < EPSILON && Math.abs(a[12] - b[12]) < EPSILON && Math.abs(a[13] - b[13]) < EPSILON && Math.abs(a[14] - b[14]) < EPSILON && Math.abs(a[15] - b[15]) < EPSILON;
}
function equals$2(a, b) {
  return a[0] === b[0] && a[1] === b[1] && a[2] === b[2] && a[3] === b[3] && a[4] === b[4] && a[5] === b[5] && a[6] === b[6] && a[7] === b[7] && a[8] === b[8] && a[9] === b[9] && a[10] === b[10] && a[11] === b[11] && a[12] === b[12] && a[13] === b[13] && a[14] === b[14] && a[15] === b[15];
}
function identity$1(dst) {
  dst = dst || new MatType(16);
  dst[0] = 1;
  dst[1] = 0;
  dst[2] = 0;
  dst[3] = 0;
  dst[4] = 0;
  dst[5] = 1;
  dst[6] = 0;
  dst[7] = 0;
  dst[8] = 0;
  dst[9] = 0;
  dst[10] = 1;
  dst[11] = 0;
  dst[12] = 0;
  dst[13] = 0;
  dst[14] = 0;
  dst[15] = 1;
  return dst;
}
function transpose(m, dst) {
  dst = dst || new MatType(16);
  if (dst === m) {
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
    return dst;
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
  dst[0] = m00;
  dst[1] = m10;
  dst[2] = m20;
  dst[3] = m30;
  dst[4] = m01;
  dst[5] = m11;
  dst[6] = m21;
  dst[7] = m31;
  dst[8] = m02;
  dst[9] = m12;
  dst[10] = m22;
  dst[11] = m32;
  dst[12] = m03;
  dst[13] = m13;
  dst[14] = m23;
  dst[15] = m33;
  return dst;
}
function inverse$2(m, dst) {
  dst = dst || new MatType(16);
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
  dst[0] = d * t0;
  dst[1] = d * t1;
  dst[2] = d * t2;
  dst[3] = d * t3;
  dst[4] = d * (tmp1 * m10 + tmp2 * m20 + tmp5 * m30 - (tmp0 * m10 + tmp3 * m20 + tmp4 * m30));
  dst[5] = d * (tmp0 * m00 + tmp7 * m20 + tmp8 * m30 - (tmp1 * m00 + tmp6 * m20 + tmp9 * m30));
  dst[6] = d * (tmp3 * m00 + tmp6 * m10 + tmp11 * m30 - (tmp2 * m00 + tmp7 * m10 + tmp10 * m30));
  dst[7] = d * (tmp4 * m00 + tmp9 * m10 + tmp10 * m20 - (tmp5 * m00 + tmp8 * m10 + tmp11 * m20));
  dst[8] = d * (tmp12 * m13 + tmp15 * m23 + tmp16 * m33 - (tmp13 * m13 + tmp14 * m23 + tmp17 * m33));
  dst[9] = d * (tmp13 * m03 + tmp18 * m23 + tmp21 * m33 - (tmp12 * m03 + tmp19 * m23 + tmp20 * m33));
  dst[10] = d * (tmp14 * m03 + tmp19 * m13 + tmp22 * m33 - (tmp15 * m03 + tmp18 * m13 + tmp23 * m33));
  dst[11] = d * (tmp17 * m03 + tmp20 * m13 + tmp23 * m23 - (tmp16 * m03 + tmp21 * m13 + tmp22 * m23));
  dst[12] = d * (tmp14 * m22 + tmp17 * m32 + tmp13 * m12 - (tmp16 * m32 + tmp12 * m12 + tmp15 * m22));
  dst[13] = d * (tmp20 * m32 + tmp12 * m02 + tmp19 * m22 - (tmp18 * m22 + tmp21 * m32 + tmp13 * m02));
  dst[14] = d * (tmp18 * m12 + tmp23 * m32 + tmp15 * m02 - (tmp22 * m32 + tmp14 * m02 + tmp19 * m12));
  dst[15] = d * (tmp22 * m22 + tmp16 * m02 + tmp21 * m12 - (tmp20 * m12 + tmp23 * m22 + tmp17 * m02));
  return dst;
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
var invert$1 = inverse$2;
function multiply$2(a, b, dst) {
  dst = dst || new MatType(16);
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
  dst[0] = a00 * b00 + a10 * b01 + a20 * b02 + a30 * b03;
  dst[1] = a01 * b00 + a11 * b01 + a21 * b02 + a31 * b03;
  dst[2] = a02 * b00 + a12 * b01 + a22 * b02 + a32 * b03;
  dst[3] = a03 * b00 + a13 * b01 + a23 * b02 + a33 * b03;
  dst[4] = a00 * b10 + a10 * b11 + a20 * b12 + a30 * b13;
  dst[5] = a01 * b10 + a11 * b11 + a21 * b12 + a31 * b13;
  dst[6] = a02 * b10 + a12 * b11 + a22 * b12 + a32 * b13;
  dst[7] = a03 * b10 + a13 * b11 + a23 * b12 + a33 * b13;
  dst[8] = a00 * b20 + a10 * b21 + a20 * b22 + a30 * b23;
  dst[9] = a01 * b20 + a11 * b21 + a21 * b22 + a31 * b23;
  dst[10] = a02 * b20 + a12 * b21 + a22 * b22 + a32 * b23;
  dst[11] = a03 * b20 + a13 * b21 + a23 * b22 + a33 * b23;
  dst[12] = a00 * b30 + a10 * b31 + a20 * b32 + a30 * b33;
  dst[13] = a01 * b30 + a11 * b31 + a21 * b32 + a31 * b33;
  dst[14] = a02 * b30 + a12 * b31 + a22 * b32 + a32 * b33;
  dst[15] = a03 * b30 + a13 * b31 + a23 * b32 + a33 * b33;
  return dst;
}
var mul$2 = multiply$2;
function setTranslation(a, v, dst) {
  dst = dst || identity$1();
  if (a !== dst) {
    dst[0] = a[0];
    dst[1] = a[1];
    dst[2] = a[2];
    dst[3] = a[3];
    dst[4] = a[4];
    dst[5] = a[5];
    dst[6] = a[6];
    dst[7] = a[7];
    dst[8] = a[8];
    dst[9] = a[9];
    dst[10] = a[10];
    dst[11] = a[11];
  }
  dst[12] = v[0];
  dst[13] = v[1];
  dst[14] = v[2];
  dst[15] = 1;
  return dst;
}
function getTranslation(m, dst) {
  dst = dst || create$4();
  dst[0] = m[12];
  dst[1] = m[13];
  dst[2] = m[14];
  return dst;
}
function getAxis(m, axis, dst) {
  dst = dst || create$4();
  const off = axis * 4;
  dst[0] = m[off + 0];
  dst[1] = m[off + 1];
  dst[2] = m[off + 2];
  return dst;
}
function setAxis(a, v, axis, dst) {
  if (dst !== a) {
    dst = copy$2(a, dst);
  }
  const off = axis * 4;
  dst[off + 0] = v[0];
  dst[off + 1] = v[1];
  dst[off + 2] = v[2];
  return dst;
}
function getScaling(m, dst) {
  dst = dst || create$4();
  const xx = m[0];
  const xy = m[1];
  const xz = m[2];
  const yx = m[4];
  const yy = m[5];
  const yz = m[6];
  const zx = m[8];
  const zy = m[9];
  const zz = m[10];
  dst[0] = Math.sqrt(xx * xx + xy * xy + xz * xz);
  dst[1] = Math.sqrt(yx * yx + yy * yy + yz * yz);
  dst[2] = Math.sqrt(zx * zx + zy * zy + zz * zz);
  return dst;
}
function perspective(fieldOfViewYInRadians, aspect, zNear, zFar, dst) {
  dst = dst || new MatType(16);
  const f = Math.tan(Math.PI * 0.5 - 0.5 * fieldOfViewYInRadians);
  dst[0] = f / aspect;
  dst[1] = 0;
  dst[2] = 0;
  dst[3] = 0;
  dst[4] = 0;
  dst[5] = f;
  dst[6] = 0;
  dst[7] = 0;
  dst[8] = 0;
  dst[9] = 0;
  dst[11] = -1;
  dst[12] = 0;
  dst[13] = 0;
  dst[15] = 0;
  if (zFar === Infinity) {
    dst[10] = -1;
    dst[14] = -zNear;
  } else {
    const rangeInv = 1 / (zNear - zFar);
    dst[10] = zFar * rangeInv;
    dst[14] = zFar * zNear * rangeInv;
  }
  return dst;
}
function ortho(left, right, bottom, top, near, far, dst) {
  dst = dst || new MatType(16);
  dst[0] = 2 / (right - left);
  dst[1] = 0;
  dst[2] = 0;
  dst[3] = 0;
  dst[4] = 0;
  dst[5] = 2 / (top - bottom);
  dst[6] = 0;
  dst[7] = 0;
  dst[8] = 0;
  dst[9] = 0;
  dst[10] = 1 / (near - far);
  dst[11] = 0;
  dst[12] = (right + left) / (left - right);
  dst[13] = (top + bottom) / (bottom - top);
  dst[14] = near / (near - far);
  dst[15] = 1;
  return dst;
}
function frustum(left, right, bottom, top, near, far, dst) {
  dst = dst || new MatType(16);
  const dx = right - left;
  const dy = top - bottom;
  const dz = near - far;
  dst[0] = 2 * near / dx;
  dst[1] = 0;
  dst[2] = 0;
  dst[3] = 0;
  dst[4] = 0;
  dst[5] = 2 * near / dy;
  dst[6] = 0;
  dst[7] = 0;
  dst[8] = (left + right) / dx;
  dst[9] = (top + bottom) / dy;
  dst[10] = far / dz;
  dst[11] = -1;
  dst[12] = 0;
  dst[13] = 0;
  dst[14] = near * far / dz;
  dst[15] = 0;
  return dst;
}
var xAxis;
var yAxis;
var zAxis;
function aim(position, target, up, dst) {
  dst = dst || new MatType(16);
  xAxis = xAxis || create$4();
  yAxis = yAxis || create$4();
  zAxis = zAxis || create$4();
  normalize$2(subtract$2(target, position, zAxis), zAxis);
  normalize$2(cross(up, zAxis, xAxis), xAxis);
  normalize$2(cross(zAxis, xAxis, yAxis), yAxis);
  dst[0] = xAxis[0];
  dst[1] = xAxis[1];
  dst[2] = xAxis[2];
  dst[3] = 0;
  dst[4] = yAxis[0];
  dst[5] = yAxis[1];
  dst[6] = yAxis[2];
  dst[7] = 0;
  dst[8] = zAxis[0];
  dst[9] = zAxis[1];
  dst[10] = zAxis[2];
  dst[11] = 0;
  dst[12] = position[0];
  dst[13] = position[1];
  dst[14] = position[2];
  dst[15] = 1;
  return dst;
}
function cameraAim(eye, target, up, dst) {
  dst = dst || new MatType(16);
  xAxis = xAxis || create$4();
  yAxis = yAxis || create$4();
  zAxis = zAxis || create$4();
  normalize$2(subtract$2(eye, target, zAxis), zAxis);
  normalize$2(cross(up, zAxis, xAxis), xAxis);
  normalize$2(cross(zAxis, xAxis, yAxis), yAxis);
  dst[0] = xAxis[0];
  dst[1] = xAxis[1];
  dst[2] = xAxis[2];
  dst[3] = 0;
  dst[4] = yAxis[0];
  dst[5] = yAxis[1];
  dst[6] = yAxis[2];
  dst[7] = 0;
  dst[8] = zAxis[0];
  dst[9] = zAxis[1];
  dst[10] = zAxis[2];
  dst[11] = 0;
  dst[12] = eye[0];
  dst[13] = eye[1];
  dst[14] = eye[2];
  dst[15] = 1;
  return dst;
}
function lookAt(eye, target, up, dst) {
  dst = dst || new MatType(16);
  xAxis = xAxis || create$4();
  yAxis = yAxis || create$4();
  zAxis = zAxis || create$4();
  normalize$2(subtract$2(eye, target, zAxis), zAxis);
  normalize$2(cross(up, zAxis, xAxis), xAxis);
  normalize$2(cross(zAxis, xAxis, yAxis), yAxis);
  dst[0] = xAxis[0];
  dst[1] = yAxis[0];
  dst[2] = zAxis[0];
  dst[3] = 0;
  dst[4] = xAxis[1];
  dst[5] = yAxis[1];
  dst[6] = zAxis[1];
  dst[7] = 0;
  dst[8] = xAxis[2];
  dst[9] = yAxis[2];
  dst[10] = zAxis[2];
  dst[11] = 0;
  dst[12] = -(xAxis[0] * eye[0] + xAxis[1] * eye[1] + xAxis[2] * eye[2]);
  dst[13] = -(yAxis[0] * eye[0] + yAxis[1] * eye[1] + yAxis[2] * eye[2]);
  dst[14] = -(zAxis[0] * eye[0] + zAxis[1] * eye[1] + zAxis[2] * eye[2]);
  dst[15] = 1;
  return dst;
}
function translation(v, dst) {
  dst = dst || new MatType(16);
  dst[0] = 1;
  dst[1] = 0;
  dst[2] = 0;
  dst[3] = 0;
  dst[4] = 0;
  dst[5] = 1;
  dst[6] = 0;
  dst[7] = 0;
  dst[8] = 0;
  dst[9] = 0;
  dst[10] = 1;
  dst[11] = 0;
  dst[12] = v[0];
  dst[13] = v[1];
  dst[14] = v[2];
  dst[15] = 1;
  return dst;
}
function translate(m, v, dst) {
  dst = dst || new MatType(16);
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
  if (m !== dst) {
    dst[0] = m00;
    dst[1] = m01;
    dst[2] = m02;
    dst[3] = m03;
    dst[4] = m10;
    dst[5] = m11;
    dst[6] = m12;
    dst[7] = m13;
    dst[8] = m20;
    dst[9] = m21;
    dst[10] = m22;
    dst[11] = m23;
  }
  dst[12] = m00 * v0 + m10 * v1 + m20 * v2 + m30;
  dst[13] = m01 * v0 + m11 * v1 + m21 * v2 + m31;
  dst[14] = m02 * v0 + m12 * v1 + m22 * v2 + m32;
  dst[15] = m03 * v0 + m13 * v1 + m23 * v2 + m33;
  return dst;
}
function rotationX(angleInRadians, dst) {
  dst = dst || new MatType(16);
  const c = Math.cos(angleInRadians);
  const s = Math.sin(angleInRadians);
  dst[0] = 1;
  dst[1] = 0;
  dst[2] = 0;
  dst[3] = 0;
  dst[4] = 0;
  dst[5] = c;
  dst[6] = s;
  dst[7] = 0;
  dst[8] = 0;
  dst[9] = -s;
  dst[10] = c;
  dst[11] = 0;
  dst[12] = 0;
  dst[13] = 0;
  dst[14] = 0;
  dst[15] = 1;
  return dst;
}
function rotateX$1(m, angleInRadians, dst) {
  dst = dst || new MatType(16);
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
  dst[4] = c * m10 + s * m20;
  dst[5] = c * m11 + s * m21;
  dst[6] = c * m12 + s * m22;
  dst[7] = c * m13 + s * m23;
  dst[8] = c * m20 - s * m10;
  dst[9] = c * m21 - s * m11;
  dst[10] = c * m22 - s * m12;
  dst[11] = c * m23 - s * m13;
  if (m !== dst) {
    dst[0] = m[0];
    dst[1] = m[1];
    dst[2] = m[2];
    dst[3] = m[3];
    dst[12] = m[12];
    dst[13] = m[13];
    dst[14] = m[14];
    dst[15] = m[15];
  }
  return dst;
}
function rotationY(angleInRadians, dst) {
  dst = dst || new MatType(16);
  const c = Math.cos(angleInRadians);
  const s = Math.sin(angleInRadians);
  dst[0] = c;
  dst[1] = 0;
  dst[2] = -s;
  dst[3] = 0;
  dst[4] = 0;
  dst[5] = 1;
  dst[6] = 0;
  dst[7] = 0;
  dst[8] = s;
  dst[9] = 0;
  dst[10] = c;
  dst[11] = 0;
  dst[12] = 0;
  dst[13] = 0;
  dst[14] = 0;
  dst[15] = 1;
  return dst;
}
function rotateY$1(m, angleInRadians, dst) {
  dst = dst || new MatType(16);
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
  dst[0] = c * m00 - s * m20;
  dst[1] = c * m01 - s * m21;
  dst[2] = c * m02 - s * m22;
  dst[3] = c * m03 - s * m23;
  dst[8] = c * m20 + s * m00;
  dst[9] = c * m21 + s * m01;
  dst[10] = c * m22 + s * m02;
  dst[11] = c * m23 + s * m03;
  if (m !== dst) {
    dst[4] = m[4];
    dst[5] = m[5];
    dst[6] = m[6];
    dst[7] = m[7];
    dst[12] = m[12];
    dst[13] = m[13];
    dst[14] = m[14];
    dst[15] = m[15];
  }
  return dst;
}
function rotationZ(angleInRadians, dst) {
  dst = dst || new MatType(16);
  const c = Math.cos(angleInRadians);
  const s = Math.sin(angleInRadians);
  dst[0] = c;
  dst[1] = s;
  dst[2] = 0;
  dst[3] = 0;
  dst[4] = -s;
  dst[5] = c;
  dst[6] = 0;
  dst[7] = 0;
  dst[8] = 0;
  dst[9] = 0;
  dst[10] = 1;
  dst[11] = 0;
  dst[12] = 0;
  dst[13] = 0;
  dst[14] = 0;
  dst[15] = 1;
  return dst;
}
function rotateZ$1(m, angleInRadians, dst) {
  dst = dst || new MatType(16);
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
  dst[0] = c * m00 + s * m10;
  dst[1] = c * m01 + s * m11;
  dst[2] = c * m02 + s * m12;
  dst[3] = c * m03 + s * m13;
  dst[4] = c * m10 - s * m00;
  dst[5] = c * m11 - s * m01;
  dst[6] = c * m12 - s * m02;
  dst[7] = c * m13 - s * m03;
  if (m !== dst) {
    dst[8] = m[8];
    dst[9] = m[9];
    dst[10] = m[10];
    dst[11] = m[11];
    dst[12] = m[12];
    dst[13] = m[13];
    dst[14] = m[14];
    dst[15] = m[15];
  }
  return dst;
}
function axisRotation(axis, angleInRadians, dst) {
  dst = dst || new MatType(16);
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
  dst[0] = xx + (1 - xx) * c;
  dst[1] = x * y * oneMinusCosine + z * s;
  dst[2] = x * z * oneMinusCosine - y * s;
  dst[3] = 0;
  dst[4] = x * y * oneMinusCosine - z * s;
  dst[5] = yy + (1 - yy) * c;
  dst[6] = y * z * oneMinusCosine + x * s;
  dst[7] = 0;
  dst[8] = x * z * oneMinusCosine + y * s;
  dst[9] = y * z * oneMinusCosine - x * s;
  dst[10] = zz + (1 - zz) * c;
  dst[11] = 0;
  dst[12] = 0;
  dst[13] = 0;
  dst[14] = 0;
  dst[15] = 1;
  return dst;
}
var rotation = axisRotation;
function axisRotate(m, axis, angleInRadians, dst) {
  dst = dst || new MatType(16);
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
  dst[0] = r00 * m00 + r01 * m10 + r02 * m20;
  dst[1] = r00 * m01 + r01 * m11 + r02 * m21;
  dst[2] = r00 * m02 + r01 * m12 + r02 * m22;
  dst[3] = r00 * m03 + r01 * m13 + r02 * m23;
  dst[4] = r10 * m00 + r11 * m10 + r12 * m20;
  dst[5] = r10 * m01 + r11 * m11 + r12 * m21;
  dst[6] = r10 * m02 + r11 * m12 + r12 * m22;
  dst[7] = r10 * m03 + r11 * m13 + r12 * m23;
  dst[8] = r20 * m00 + r21 * m10 + r22 * m20;
  dst[9] = r20 * m01 + r21 * m11 + r22 * m21;
  dst[10] = r20 * m02 + r21 * m12 + r22 * m22;
  dst[11] = r20 * m03 + r21 * m13 + r22 * m23;
  if (m !== dst) {
    dst[12] = m[12];
    dst[13] = m[13];
    dst[14] = m[14];
    dst[15] = m[15];
  }
  return dst;
}
var rotate = axisRotate;
function scaling(v, dst) {
  dst = dst || new MatType(16);
  dst[0] = v[0];
  dst[1] = 0;
  dst[2] = 0;
  dst[3] = 0;
  dst[4] = 0;
  dst[5] = v[1];
  dst[6] = 0;
  dst[7] = 0;
  dst[8] = 0;
  dst[9] = 0;
  dst[10] = v[2];
  dst[11] = 0;
  dst[12] = 0;
  dst[13] = 0;
  dst[14] = 0;
  dst[15] = 1;
  return dst;
}
function scale$2(m, v, dst) {
  dst = dst || new MatType(16);
  const v0 = v[0];
  const v1 = v[1];
  const v2 = v[2];
  dst[0] = v0 * m[0 * 4 + 0];
  dst[1] = v0 * m[0 * 4 + 1];
  dst[2] = v0 * m[0 * 4 + 2];
  dst[3] = v0 * m[0 * 4 + 3];
  dst[4] = v1 * m[1 * 4 + 0];
  dst[5] = v1 * m[1 * 4 + 1];
  dst[6] = v1 * m[1 * 4 + 2];
  dst[7] = v1 * m[1 * 4 + 3];
  dst[8] = v2 * m[2 * 4 + 0];
  dst[9] = v2 * m[2 * 4 + 1];
  dst[10] = v2 * m[2 * 4 + 2];
  dst[11] = v2 * m[2 * 4 + 3];
  if (m !== dst) {
    dst[12] = m[12];
    dst[13] = m[13];
    dst[14] = m[14];
    dst[15] = m[15];
  }
  return dst;
}
function uniformScaling(s, dst) {
  dst = dst || new MatType(16);
  dst[0] = s;
  dst[1] = 0;
  dst[2] = 0;
  dst[3] = 0;
  dst[4] = 0;
  dst[5] = s;
  dst[6] = 0;
  dst[7] = 0;
  dst[8] = 0;
  dst[9] = 0;
  dst[10] = s;
  dst[11] = 0;
  dst[12] = 0;
  dst[13] = 0;
  dst[14] = 0;
  dst[15] = 1;
  return dst;
}
function uniformScale(m, s, dst) {
  dst = dst || new MatType(16);
  dst[0] = s * m[0 * 4 + 0];
  dst[1] = s * m[0 * 4 + 1];
  dst[2] = s * m[0 * 4 + 2];
  dst[3] = s * m[0 * 4 + 3];
  dst[4] = s * m[1 * 4 + 0];
  dst[5] = s * m[1 * 4 + 1];
  dst[6] = s * m[1 * 4 + 2];
  dst[7] = s * m[1 * 4 + 3];
  dst[8] = s * m[2 * 4 + 0];
  dst[9] = s * m[2 * 4 + 1];
  dst[10] = s * m[2 * 4 + 2];
  dst[11] = s * m[2 * 4 + 3];
  if (m !== dst) {
    dst[12] = m[12];
    dst[13] = m[13];
    dst[14] = m[14];
    dst[15] = m[15];
  }
  return dst;
}
var mat4Impl = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  setDefaultType: setDefaultType$3,
  create: create$2,
  set: set$2,
  fromMat3,
  fromQuat,
  negate: negate$1,
  copy: copy$2,
  clone: clone$2,
  equalsApproximately: equalsApproximately$2,
  equals: equals$2,
  identity: identity$1,
  transpose,
  inverse: inverse$2,
  determinant,
  invert: invert$1,
  multiply: multiply$2,
  mul: mul$2,
  setTranslation,
  getTranslation,
  getAxis,
  setAxis,
  getScaling,
  perspective,
  ortho,
  frustum,
  aim,
  cameraAim,
  lookAt,
  translation,
  translate,
  rotationX,
  rotateX: rotateX$1,
  rotationY,
  rotateY: rotateY$1,
  rotationZ,
  rotateZ: rotateZ$1,
  axisRotation,
  rotation,
  axisRotate,
  rotate,
  scaling,
  scale: scale$2,
  uniformScaling,
  uniformScale
});
var VecType = Float32Array;
function setDefaultType$1(ctor) {
  const oldType = VecType;
  VecType = ctor;
  return oldType;
}
function create(x, y, z, w) {
  const dst = new VecType(4);
  if (x !== void 0) {
    dst[0] = x;
    if (y !== void 0) {
      dst[1] = y;
      if (z !== void 0) {
        dst[2] = z;
        if (w !== void 0) {
          dst[3] = w;
        }
      }
    }
  }
  return dst;
}
var fromValues = create;
function set(x, y, z, w, dst) {
  dst = dst || new VecType(4);
  dst[0] = x;
  dst[1] = y;
  dst[2] = z;
  dst[3] = w;
  return dst;
}
function ceil(v, dst) {
  dst = dst || new VecType(4);
  dst[0] = Math.ceil(v[0]);
  dst[1] = Math.ceil(v[1]);
  dst[2] = Math.ceil(v[2]);
  dst[3] = Math.ceil(v[3]);
  return dst;
}
function floor(v, dst) {
  dst = dst || new VecType(4);
  dst[0] = Math.floor(v[0]);
  dst[1] = Math.floor(v[1]);
  dst[2] = Math.floor(v[2]);
  dst[3] = Math.floor(v[3]);
  return dst;
}
function round(v, dst) {
  dst = dst || new VecType(4);
  dst[0] = Math.round(v[0]);
  dst[1] = Math.round(v[1]);
  dst[2] = Math.round(v[2]);
  dst[3] = Math.round(v[3]);
  return dst;
}
function clamp(v, min2 = 0, max2 = 1, dst) {
  dst = dst || new VecType(4);
  dst[0] = Math.min(max2, Math.max(min2, v[0]));
  dst[1] = Math.min(max2, Math.max(min2, v[1]));
  dst[2] = Math.min(max2, Math.max(min2, v[2]));
  dst[3] = Math.min(max2, Math.max(min2, v[3]));
  return dst;
}
function add(a, b, dst) {
  dst = dst || new VecType(4);
  dst[0] = a[0] + b[0];
  dst[1] = a[1] + b[1];
  dst[2] = a[2] + b[2];
  dst[3] = a[3] + b[3];
  return dst;
}
function addScaled(a, b, scale2, dst) {
  dst = dst || new VecType(4);
  dst[0] = a[0] + b[0] * scale2;
  dst[1] = a[1] + b[1] * scale2;
  dst[2] = a[2] + b[2] * scale2;
  dst[3] = a[3] + b[3] * scale2;
  return dst;
}
function subtract(a, b, dst) {
  dst = dst || new VecType(4);
  dst[0] = a[0] - b[0];
  dst[1] = a[1] - b[1];
  dst[2] = a[2] - b[2];
  dst[3] = a[3] - b[3];
  return dst;
}
var sub = subtract;
function equalsApproximately(a, b) {
  return Math.abs(a[0] - b[0]) < EPSILON && Math.abs(a[1] - b[1]) < EPSILON && Math.abs(a[2] - b[2]) < EPSILON && Math.abs(a[3] - b[3]) < EPSILON;
}
function equals(a, b) {
  return a[0] === b[0] && a[1] === b[1] && a[2] === b[2] && a[3] === b[3];
}
function lerp(a, b, t, dst) {
  dst = dst || new VecType(4);
  dst[0] = a[0] + t * (b[0] - a[0]);
  dst[1] = a[1] + t * (b[1] - a[1]);
  dst[2] = a[2] + t * (b[2] - a[2]);
  dst[3] = a[3] + t * (b[3] - a[3]);
  return dst;
}
function lerpV(a, b, t, dst) {
  dst = dst || new VecType(4);
  dst[0] = a[0] + t[0] * (b[0] - a[0]);
  dst[1] = a[1] + t[1] * (b[1] - a[1]);
  dst[2] = a[2] + t[2] * (b[2] - a[2]);
  dst[3] = a[3] + t[3] * (b[3] - a[3]);
  return dst;
}
function max(a, b, dst) {
  dst = dst || new VecType(4);
  dst[0] = Math.max(a[0], b[0]);
  dst[1] = Math.max(a[1], b[1]);
  dst[2] = Math.max(a[2], b[2]);
  dst[3] = Math.max(a[3], b[3]);
  return dst;
}
function min(a, b, dst) {
  dst = dst || new VecType(4);
  dst[0] = Math.min(a[0], b[0]);
  dst[1] = Math.min(a[1], b[1]);
  dst[2] = Math.min(a[2], b[2]);
  dst[3] = Math.min(a[3], b[3]);
  return dst;
}
function mulScalar(v, k, dst) {
  dst = dst || new VecType(4);
  dst[0] = v[0] * k;
  dst[1] = v[1] * k;
  dst[2] = v[2] * k;
  dst[3] = v[3] * k;
  return dst;
}
var scale = mulScalar;
function divScalar(v, k, dst) {
  dst = dst || new VecType(4);
  dst[0] = v[0] / k;
  dst[1] = v[1] / k;
  dst[2] = v[2] / k;
  dst[3] = v[3] / k;
  return dst;
}
function inverse(v, dst) {
  dst = dst || new VecType(4);
  dst[0] = 1 / v[0];
  dst[1] = 1 / v[1];
  dst[2] = 1 / v[2];
  dst[3] = 1 / v[3];
  return dst;
}
var invert = inverse;
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
var len = length;
function lengthSq(v) {
  const v0 = v[0];
  const v1 = v[1];
  const v2 = v[2];
  const v3 = v[3];
  return v0 * v0 + v1 * v1 + v2 * v2 + v3 * v3;
}
var lenSq = lengthSq;
function distance(a, b) {
  const dx = a[0] - b[0];
  const dy = a[1] - b[1];
  const dz = a[2] - b[2];
  const dw = a[3] - b[3];
  return Math.sqrt(dx * dx + dy * dy + dz * dz + dw * dw);
}
var dist = distance;
function distanceSq(a, b) {
  const dx = a[0] - b[0];
  const dy = a[1] - b[1];
  const dz = a[2] - b[2];
  const dw = a[3] - b[3];
  return dx * dx + dy * dy + dz * dz + dw * dw;
}
var distSq = distanceSq;
function normalize(v, dst) {
  dst = dst || new VecType(4);
  const v0 = v[0];
  const v1 = v[1];
  const v2 = v[2];
  const v3 = v[3];
  const len2 = Math.sqrt(v0 * v0 + v1 * v1 + v2 * v2 + v3 * v3);
  if (len2 > 1e-5) {
    dst[0] = v0 / len2;
    dst[1] = v1 / len2;
    dst[2] = v2 / len2;
    dst[3] = v3 / len2;
  } else {
    dst[0] = 0;
    dst[1] = 0;
    dst[2] = 0;
    dst[3] = 0;
  }
  return dst;
}
function negate(v, dst) {
  dst = dst || new VecType(4);
  dst[0] = -v[0];
  dst[1] = -v[1];
  dst[2] = -v[2];
  dst[3] = -v[3];
  return dst;
}
function copy(v, dst) {
  dst = dst || new VecType(4);
  dst[0] = v[0];
  dst[1] = v[1];
  dst[2] = v[2];
  dst[3] = v[3];
  return dst;
}
var clone = copy;
function multiply(a, b, dst) {
  dst = dst || new VecType(4);
  dst[0] = a[0] * b[0];
  dst[1] = a[1] * b[1];
  dst[2] = a[2] * b[2];
  dst[3] = a[3] * b[3];
  return dst;
}
var mul = multiply;
function divide(a, b, dst) {
  dst = dst || new VecType(4);
  dst[0] = a[0] / b[0];
  dst[1] = a[1] / b[1];
  dst[2] = a[2] / b[2];
  dst[3] = a[3] / b[3];
  return dst;
}
var div = divide;
function zero(dst) {
  dst = dst || new VecType(4);
  dst[0] = 0;
  dst[1] = 0;
  dst[2] = 0;
  dst[3] = 0;
  return dst;
}
function transformMat4(v, m, dst) {
  dst = dst || new VecType(4);
  const x = v[0];
  const y = v[1];
  const z = v[2];
  const w = v[3];
  dst[0] = m[0] * x + m[4] * y + m[8] * z + m[12] * w;
  dst[1] = m[1] * x + m[5] * y + m[9] * z + m[13] * w;
  dst[2] = m[2] * x + m[6] * y + m[10] * z + m[14] * w;
  dst[3] = m[3] * x + m[7] * y + m[11] * z + m[15] * w;
  return dst;
}
var vec4Impl = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  create,
  setDefaultType: setDefaultType$1,
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
  transformMat4
});

// src/displacement/displacement.js
var _tmpVec3 = vec3Impl.create(0, 0, 0);
var FLOAT32S_PER_SPRITE2 = 6;
var displacement_default2 = {
  type: "displacement",
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
  const len2 = FLOAT32S_PER_SPRITE2 * node.data.spriteCount * Float32Array.BYTES_PER_ELEMENT;
  device.queue.writeBuffer(node.data.buffer, 0, node.data.spriteData.buffer, 0, len2);
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
  const projection = mat4Impl.ortho(0, GAME_WIDTH, GAME_HEIGHT, 0, -10, 10);
  vec3Impl.set(-cobalt.viewport.position[0], -cobalt.viewport.position[1], 0, _tmpVec3);
  const view = mat4Impl.translation(_tmpVec3);
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
var overlay_default = "struct TransformData{view:mat4x4<f32>,projection:mat4x4<f32>};struct Sprite{translate:vec2<f32>,scale:vec2<f32>,tint:vec4<f32>,opacity:f32,rotation:f32,};struct SpritesBuffer{models:array<Sprite>,};@binding(0)@group(0)var<uniform> transformUBO:TransformData;@binding(1)@group(0)var myTexture:texture_2d<f32>;@binding(2)@group(0)var mySampler:sampler;@binding(3)@group(0)var<storage,read>sprites:SpritesBuffer;struct Fragment{@builtin(position)Position:vec4<f32>,@location(0)TexCoord:vec2<f32>,@location(1)Tint:vec4<f32>,@location(2)Opacity:f32,};@vertex fn vs_main(@builtin(instance_index)i_id:u32,@location(0)vertexPosition:vec3<f32>,@location(1)vertexTexCoord:vec2<f32>)->Fragment{var output:Fragment;var sx:f32=sprites.models[i_id].scale.x;var sy:f32=sprites.models[i_id].scale.y;var sz:f32=1.0;var rot:f32=sprites.models[i_id].rotation;var tx:f32=sprites.models[i_id].translate.x;var ty:f32=sprites.models[i_id].translate.y;var tz:f32=0;var s=sin(rot);var c=cos(rot);var scaleM:mat4x4<f32>=mat4x4<f32>(sx,0.0,0.0,0.0,0.0,sy,0.0,0.0,0.0,0.0,sz,0.0,0,0,0,1.0);var modelM:mat4x4<f32>=mat4x4<f32>(c,s,0.0,0.0,-s,c,0.0,0.0,0.0,0.0,1.0,0.0,tx,ty,tz,1.0)*scaleM;output.Position=transformUBO.projection*transformUBO.view*modelM*vec4<f32>(vertexPosition,1.0);output.TexCoord=vertexTexCoord;output.Tint=sprites.models[i_id].tint;output.Opacity=sprites.models[i_id].opacity;return output;}@fragment fn fs_main(@location(0)TexCoord:vec2<f32>,@location(1)Tint:vec4<f32>,@location(2)Opacity:f32)->@location(0)vec4<f32>{var outColor:vec4<f32>=textureSample(myTexture,mySampler,TexCoord);var output=vec4<f32>(outColor.rgb*(1.0-Tint.a)+(Tint.rgb*Tint.a),outColor.a*Opacity);return output;}";

// src/overlay/constants.js
var FLOAT32S_PER_SPRITE3 = 12;

// src/overlay/overlay.js
var _tmpVec4 = vec4Impl.create();
var _tmpVec32 = vec3Impl.create();
var overlay_default2 = {
  type: "overlay",
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
  customFunctions: { ...SpriteRenderPass_exports }
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
  const projection = mat4Impl.ortho(0, GAME_WIDTH, GAME_HEIGHT, 0, -10, 10);
  vec3Impl.set(0, 0, 0, _tmpVec32);
  const view = mat4Impl.translation(_tmpVec32);
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
var fb_blit_default = "@binding(0)@group(0)var tileTexture:texture_2d<f32>;@binding(1)@group(0)var tileSampler:sampler;struct Fragment{@builtin(position)Position:vec4<f32>,@location(0)TexCoord:vec2<f32>};const pos=array(vec2(1.0,1.0),vec2(1.0,-1.0),vec2(-1.0,-1.0),vec2(1.0,1.0),vec2(-1.0,-1.0),vec2(-1.0,1.0),);const uv=array(vec2(1.0,0.0),vec2(1.0,1.0),vec2(0.0,1.0),vec2(1.0,0.0),vec2(0.0,1.0),vec2(0.0,0.0),);@vertex fn vs_main(@builtin(vertex_index)VertexIndex:u32)->Fragment{var output:Fragment;output.Position=vec4(pos[VertexIndex],0.0,1.0);output.TexCoord=uv[VertexIndex];return output;}@fragment fn fs_main(@location(0)TexCoord:vec2<f32>)->@location(0)vec4<f32>{var col=textureSample(tileTexture,tileSampler,TexCoord);return vec4<f32>(col.rgb,1.0);}";

// src/fb-blit/fb-blit.js
var fb_blit_default2 = {
  type: "fbBlit",
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
  renderpass.draw(6, 1, 0, 0);
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
var primitives_default = "struct TransformData{view:mat4x4<f32>,projection:mat4x4<f32>};@binding(0)@group(0)var<uniform> transformUBO:TransformData;struct Fragment{@builtin(position)Position:vec4<f32>,@location(0)Color:vec4<f32>,};@vertex fn vs_main(@location(0)vertexPosition:vec2<f32>,@location(1)vertexColor:vec4<f32>)->Fragment{var sx:f32=1.0;var sy:f32=1.0;var sz:f32=1.0;var rot:f32=0.0;var tx:f32=1.0;var ty:f32=1.0;var tz:f32=0;var s=sin(rot);var c=cos(rot);var scaleM:mat4x4<f32>=mat4x4<f32>(sx,0.0,0.0,0.0,0.0,sy,0.0,0.0,0.0,0.0,sz,0.0,0,0,0,1.0);var modelM:mat4x4<f32>=mat4x4<f32>(c,s,0.0,0.0,-s,c,0.0,0.0,0.0,0.0,1.0,0.0,tx,ty,tz,1.0)*scaleM;var output:Fragment;output.Position=transformUBO.projection*transformUBO.view*modelM*vec4<f32>(vertexPosition,0.0,1.0);output.Color=vertexColor;return output;}@fragment fn fs_main(@location(0)Color:vec4<f32>)->@location(0)vec4<f32>{return Color;}";

// src/primitives/api.js
function line(cobalt, node, start, end, color, lineWidth = 1) {
  const delta = vec2Impl.sub(end, start);
  const unitBasis = vec2Impl.normalize(delta);
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
  box: function(cobalt, node, center, width, height, color, lineWidth = 1) {
    const [x, y] = center;
    const halfWidth = width / 2;
    const halfHeight = height / 2;
    const topLeft = [x - halfWidth, y - halfHeight];
    const topRight = [x + halfWidth, y - halfHeight];
    const bottomLeft = [x - halfWidth, y + halfHeight];
    const bottomRight = [x + halfWidth, y + halfHeight];
    line(cobalt, node, topLeft, topRight, color, lineWidth);
    line(cobalt, node, bottomLeft, bottomRight, color, lineWidth);
    line(cobalt, node, topLeft, bottomLeft, color, lineWidth);
    line(cobalt, node, topRight, bottomRight, color, lineWidth);
  },
  // TODO: angledBox? would take in rotation in rads 
  filledBox: function(cobalt, node, center, width, height, color) {
    const [x, y] = center;
    const halfWidth = width / 2;
    const halfHeight = height / 2;
    const topLeft = { x: x - halfWidth, y: y - halfHeight };
    const topRight = { x: x + halfWidth, y: y - halfHeight };
    const bottomLeft = { x: x - halfWidth, y: y + halfHeight };
    const bottomRight = { x: x + halfWidth, y: y + halfHeight };
    let i = node.data.vertexCount * 6;
    node.data.vertices[i + 0] = topLeft.x;
    node.data.vertices[i + 1] = topLeft.y;
    node.data.vertices[i + 2] = color[0];
    node.data.vertices[i + 3] = color[1];
    node.data.vertices[i + 4] = color[2];
    node.data.vertices[i + 5] = color[3];
    node.data.vertices[i + 6] = bottomLeft.x;
    node.data.vertices[i + 7] = bottomLeft.y;
    node.data.vertices[i + 8] = color[0];
    node.data.vertices[i + 9] = color[1];
    node.data.vertices[i + 10] = color[2];
    node.data.vertices[i + 11] = color[3];
    node.data.vertices[i + 12] = topRight.x;
    node.data.vertices[i + 13] = topRight.y;
    node.data.vertices[i + 14] = color[0];
    node.data.vertices[i + 15] = color[1];
    node.data.vertices[i + 16] = color[2];
    node.data.vertices[i + 17] = color[3];
    node.data.vertices[i + 18] = bottomLeft.x;
    node.data.vertices[i + 19] = bottomLeft.y;
    node.data.vertices[i + 20] = color[0];
    node.data.vertices[i + 21] = color[1];
    node.data.vertices[i + 22] = color[2];
    node.data.vertices[i + 23] = color[3];
    node.data.vertices[i + 24] = bottomRight.x;
    node.data.vertices[i + 25] = bottomRight.y;
    node.data.vertices[i + 26] = color[0];
    node.data.vertices[i + 27] = color[1];
    node.data.vertices[i + 28] = color[2];
    node.data.vertices[i + 29] = color[3];
    node.data.vertices[i + 30] = topRight.x;
    node.data.vertices[i + 31] = topRight.y;
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

// src/primitives/primitives.js
var _tmpVec33 = vec3Impl.create(0, 0, 0);
var primitives_default2 = {
  type: "primitives",
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
  const projection = mat4Impl.ortho(0, GAME_WIDTH, GAME_HEIGHT, 0, -10, 10);
  vec3Impl.set(-cobalt.viewport.position[0], -cobalt.viewport.position[1], 0, _tmpVec33);
  const view = mat4Impl.translation(_tmpVec33);
  device.queue.writeBuffer(node.data.uniformBuffer, 0, view.buffer);
  device.queue.writeBuffer(node.data.uniformBuffer, 64, projection.buffer);
}

// src/create-fullscreen-quad.js
function createTileQuad(device) {
  const vertices = new Float32Array([
    //x   y  u  v  
    -1,
    -1,
    0,
    1,
    1,
    -1,
    1,
    1,
    1,
    1,
    1,
    0,
    // triangle 2 (2nd half of quad)
    -1,
    -1,
    0,
    1,
    1,
    1,
    1,
    0,
    -1,
    1,
    0,
    0
  ]);
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
    arrayStride: 16,
    attributes: [
      {
        shaderLocation: 0,
        format: "float32x2",
        offset: 0
      },
      {
        shaderLocation: 1,
        format: "float32x2",
        offset: 8
      }
    ]
  };
  return {
    buffer,
    bufferLayout
  };
}

// src/tile/tile.wgsl
var tile_default2 = "struct TransformData{viewOffset:vec2<f32>,viewportSize:vec2<f32>,inverseAtlasTextureSize:vec2<f32>,tileSize:f32,inverseTileSize:f32,};struct TileScroll{scrollScale:vec2<f32>};@binding(0)@group(0)var<uniform> myScroll:TileScroll;@binding(1)@group(0)var tileTexture:texture_2d<f32>;@binding(2)@group(0)var tileSampler:sampler;@binding(0)@group(1)var<uniform> transformUBO:TransformData;@binding(1)@group(1)var atlasTexture:texture_2d<f32>;@binding(2)@group(1)var atlasSampler:sampler;struct Fragment{@builtin(position)Position:vec4<f32>,@location(0)TexCoord:vec2<f32>};@vertex fn vs_main(@builtin(instance_index)i_id:u32,@location(0)vertexPosition:vec2<f32>,@location(1)vertexTexCoord:vec2<f32>)->Fragment{var output:Fragment;let inverseTileTextureSize=1/vec2<f32>(textureDimensions(tileTexture,0));var scrollScale=myScroll.scrollScale;var viewOffset:vec2<f32>=transformUBO.viewOffset*scrollScale;let PixelCoord=(vertexTexCoord*transformUBO.viewportSize)+viewOffset;output.TexCoord=PixelCoord/transformUBO.tileSize;output.Position=vec4<f32>(vertexPosition,0.0,1.0);return output;}@fragment fn fs_main(@location(0)TexCoord:vec2<f32>)->@location(0)vec4<f32>{var tilemapCoord=floor(TexCoord);var u_tilemapSize=vec2<f32>(textureDimensions(tileTexture,0));var tileFoo=fract((tilemapCoord+vec2<f32>(0.5,0.5))/u_tilemapSize);var tile=floor(textureSample(tileTexture,tileSampler,tileFoo)*255.0);if(tile.x==255&&tile.y==255){discard;}var u_tilesetSize=vec2<f32>(textureDimensions(atlasTexture,0))/transformUBO.tileSize;let u_tileUVMinBounds=vec2<f32>(0.5/transformUBO.tileSize,0.5/transformUBO.tileSize);let u_tileUVMaxBounds=vec2<f32>((transformUBO.tileSize-0.5)/transformUBO.tileSize,(transformUBO.tileSize-0.5)/transformUBO.tileSize);var texcoord=clamp(fract(TexCoord),u_tileUVMinBounds,u_tileUVMaxBounds);var tileCoord=(tile.xy+texcoord)/u_tilesetSize;var color=textureSample(atlasTexture,atlasSampler,tileCoord);if(color.a<=0.1){discard;}return color;}";

// src/tile/atlas.js
var _buf = new Float32Array(8);
var atlas_default = {
  type: "tileAtlas",
  refs: [],
  // @params Object cobalt renderer world object
  // @params Object options optional data passed when initing this node
  onInit: async function(cobalt, options = {}) {
    return init9(cobalt, options);
  },
  onRun: function(cobalt, node, webGpuCommandEncoder) {
  },
  onDestroy: function(cobalt, node) {
    destroy7(data);
  },
  onResize: function(cobalt, node) {
    _writeTileBuffer(cobalt, node);
  },
  onViewportPosition: function(cobalt, node) {
    _writeTileBuffer(cobalt, node);
  }
};
async function init9(cobalt, nodeData) {
  const { device } = cobalt;
  const quad = createTileQuad(device);
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
      buffers: [quad.bufferLayout]
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
    quad,
    tileSize: nodeData.options.tileSize,
    tileScale: nodeData.options.tileScale
  };
}
function destroy7(data2) {
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
var sprite_default2 = "struct TransformData{view:mat4x4<f32>,projection:mat4x4<f32>};struct Sprite{translate:vec2<f32>,scale:vec2<f32>,tint:vec4<f32>,opacity:f32,rotation:f32,emissiveIntensity:f32,sortValue:f32,};struct SpritesBuffer{models:array<Sprite>,};@binding(0)@group(0)var<uniform> transformUBO:TransformData;@binding(1)@group(0)var myTexture:texture_2d<f32>;@binding(2)@group(0)var mySampler:sampler;@binding(3)@group(0)var<storage,read>sprites:SpritesBuffer;@binding(4)@group(0)var emissiveTexture:texture_2d<f32>;struct Fragment{@builtin(position)Position:vec4<f32>,@location(0)TexCoord:vec2<f32>,@location(1)Tint:vec4<f32>,@location(2)Opacity:f32,};struct GBufferOutput{@location(0)color:vec4<f32>,@location(1)emissive:vec4<f32>,}@vertex fn vs_main(@builtin(instance_index)i_id:u32,@location(0)vertexPosition:vec3<f32>,@location(1)vertexTexCoord:vec2<f32>)->Fragment{var output:Fragment;var sx:f32=sprites.models[i_id].scale.x;var sy:f32=sprites.models[i_id].scale.y;var sz:f32=1.0;var rot:f32=sprites.models[i_id].rotation;var tx:f32=sprites.models[i_id].translate.x;var ty:f32=sprites.models[i_id].translate.y;var tz:f32=0;var s=sin(rot);var c=cos(rot);var scaleM:mat4x4<f32>=mat4x4<f32>(sx,0.0,0.0,0.0,0.0,sy,0.0,0.0,0.0,0.0,sz,0.0,0,0,0,1.0);var modelM:mat4x4<f32>=mat4x4<f32>(c,s,0.0,0.0,-s,c,0.0,0.0,0.0,0.0,1.0,0.0,tx,ty,tz,1.0)*scaleM;output.Position=transformUBO.projection*transformUBO.view*modelM*vec4<f32>(vertexPosition,1.0);output.TexCoord=vertexTexCoord;output.Tint=sprites.models[i_id].tint;output.Opacity=sprites.models[i_id].opacity;return output;}@fragment fn fs_main(@location(0)TexCoord:vec2<f32>,@location(1)Tint:vec4<f32>,@location(2)Opacity:f32)->GBufferOutput{var output:GBufferOutput;var outColor:vec4<f32>=textureSample(myTexture,mySampler,TexCoord);output.color=vec4<f32>(outColor.rgb*(1.0-Tint.a)+(Tint.rgb*Tint.a),outColor.a*Opacity);let emissive=textureSample(emissiveTexture,mySampler,TexCoord);output.emissive=vec4(emissive.rgb,1.0)*emissive.a;return output;}";

// src/sprite/spritesheet.js
var _tmpVec34 = vec3Impl.create(0, 0, 0);
var spritesheet_default = {
  type: "spritesheet",
  refs: [],
  // @params Object cobalt renderer world object
  // @params Object options optional data passed when initing this node
  onInit: async function(cobalt, options = {}) {
    return init10(cobalt, options);
  },
  onRun: function(cobalt, node, webGpuCommandEncoder) {
  },
  onDestroy: function(cobalt, node) {
    destroy8(node);
  },
  onResize: function(cobalt, node) {
    _writeSpriteBuffer(cobalt, node);
  },
  onViewportPosition: function(cobalt, node) {
    _writeSpriteBuffer(cobalt, node);
  }
};
async function init10(cobalt, node) {
  const { canvas, device } = cobalt;
  let spritesheet, colorTexture, emissiveTexture;
  if (canvas) {
    spritesheet = await fetchJson(node.options.spriteSheetJsonUrl);
    spritesheet = readSpriteSheet(spritesheet);
    colorTexture = await createTextureFromUrl(cobalt, "sprite", node.options.colorTextureUrl, "rgba8unorm");
    emissiveTexture = await createTextureFromUrl(cobalt, "emissive sprite", node.options.emissiveTextureUrl, "rgba8unorm");
  } else {
    spritesheet = readSpriteSheet(node.options.spriteSheetJson);
    colorTexture = await createTextureFromBuffer(cobalt, "sprite", node.options.colorTexture, "rgba8unorm");
    emissiveTexture = await createTextureFromBuffer(cobalt, "emissive sprite", node.options.emissiveTexture, "rgba8unorm");
  }
  const quads = createSpriteQuads(device, spritesheet);
  if (canvas) {
    canvas.style.imageRendering = "pixelated";
  }
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
function destroy8(node) {
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
  const projection = mat4Impl.ortho(0, GAME_WIDTH, GAME_HEIGHT, 0, -10, 10);
  vec3Impl.set(-viewport.position[0], -viewport.position[1], 0, _tmpVec34);
  const view = mat4Impl.translation(_tmpVec34);
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
    return init11(cobalt, options);
  },
  onRun: function(cobalt, node, webGpuCommandEncoder) {
  },
  onDestroy: function(cobalt, node) {
    destroy9(data);
  },
  onResize: function(cobalt, node) {
    resize5(cobalt, node);
  },
  onViewportPosition: function(cobalt, node) {
  }
};
async function init11(cobalt, node) {
  const { device } = cobalt;
  const { label, mip_count, format, usage, viewportScale } = node.options;
  return createTexture(device, label, cobalt.viewport.width * viewportScale, cobalt.viewport.height * viewportScale, mip_count, format, usage);
}
function destroy9(node) {
  node.data.texture.destroy();
}
function resize5(cobalt, node) {
  const { device } = cobalt;
  destroy9(node);
  const { width, height } = cobalt.viewport;
  const { options } = node;
  const scale2 = node.options.viewportScale;
  node.data = createTexture(device, options.label, width * scale2, height * scale2, options.mip_count, options.format, options.usage);
}

// src/cobalt.js
async function init12(ctx, viewportWidth, viewportHeight) {
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
    // TODO: namespace the builtins?  e.g., builtin_bloom or cobalt_bloom, etc.
    //
    // built in resource nodes
    tileAtlas: atlas_default,
    spritesheet: spritesheet_default,
    fbTexture: fb_texture_default,
    // builtin run nodes
    bloom: bloom_default2,
    composite: scene_composite_default2,
    sprite: sprite_default,
    tile: tile_default,
    displacement: displacement_default2,
    overlay: overlay_default2,
    fbBlit: fb_blit_default2,
    primitives: primitives_default2
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
      // [ top, left ] visible point
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
function draw9(c) {
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
  createTextureFromUrl,
  defineNode,
  draw9 as draw,
  getCurrentTextureView,
  getPreferredFormat,
  init12 as init,
  initNode,
  reset,
  setViewportDimensions,
  setViewportPosition
};
