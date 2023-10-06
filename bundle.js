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
    { name: "emissive", type: "webGpuTextureView", format: "rgba16", access: "read" },
    { name: "hdr", type: "webGpuTextureView", format: "rgba16", access: "read" },
    { name: "bloom", type: "webGpuTextureView", format: "rgba16", access: "readwrite" }
  ],
  // @params Object cobalt renderer world object
  // @params Object options optional data passed when initing this node
  onInit: async function(cobalt, options = {}) {
    return init(cobalt, options);
  },
  onRun: function(cobalt, nodeData2, webGpuCommandEncoder) {
    draw(cobalt, nodeData2.data, webGpuCommandEncoder);
  },
  onDestroy: function(cobalt, data) {
    destroy(data);
  },
  onResize: function(cobalt, data) {
    resize(cobalt, data);
  },
  onViewportPosition: function(cobalt, data) {
  }
};
function init(cobalt, options) {
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
  bloom_mat.bind_groups_textures.push(options.refs.bloom.data);
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
  set_all_bind_group(cobalt, bloom_mat, options.refs);
  bloom_mat.compute_pipeline = compute_pipeline;
  return bloom_mat;
}
function set_all_bind_group(cobalt, bloom_mat, refs = {}) {
  const { device } = cobalt;
  const bloom_threshold = 0.1;
  const bloom_knee = 0.2;
  const combine_constant = 0.68;
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
function resize(cobalt, nodeData2) {
  const { device } = cobalt;
  const bloom_mat = nodeData2.data;
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
  bloom_mat.bind_groups_textures.push(nodeData2.refs.bloom.data);
  set_all_bind_group(cobalt, bloom_mat, nodeData2.refs);
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
    { name: "hdr", type: "webGpuTextureView", format: "rgba16", access: "read" },
    { name: "bloom", type: "webGpuTextureView", format: "rgba16", access: "read" },
    { name: "combined", type: "webGpuTextureFrameView", format: "rgba8unorm", access: "write" }
  ],
  // @params Object cobalt renderer world object
  // @params Object options optional data passed when initing this node
  onInit: async function(cobalt, options = {}) {
    return init2(cobalt, options);
  },
  onRun: function(cobalt, nodeData2, webGpuCommandEncoder) {
    draw2(cobalt, nodeData2, webGpuCommandEncoder);
  },
  onDestroy: function(cobalt, data) {
  },
  onResize: function(cobalt, data) {
    resize2(cobalt, data);
  },
  onViewportPosition: function(cobalt, data) {
  }
};
function init2(cobalt, options) {
  const { device } = cobalt;
  const format = navigator.gpu.getPreferredCanvasFormat();
  const bloom_intensity = 40;
  const bloom_combine_constant = 0.68;
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
        resource: options.refs.hdr.data.sampler
      },
      // color
      {
        binding: 1,
        resource: options.refs.hdr.data.view
      },
      // emissive
      {
        binding: 2,
        resource: options.refs.bloom.data.mip_view[0]
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
function draw2(cobalt, nodeData2, commandEncoder) {
  const passEncoder = commandEncoder.beginRenderPass({
    colorAttachments: [
      {
        view: nodeData2.refs.combined,
        //renderer.context.getCurrentTexture().createView(),
        clearValue: { r: 0, g: 0, b: 0, a: 1 },
        loadOp: "clear",
        storeOp: "store"
      }
    ]
  });
  const { pipeline, bindGroup } = nodeData2.data;
  passEncoder.setPipeline(pipeline);
  passEncoder.setBindGroup(0, bindGroup);
  passEncoder.draw(6, 1, 0, 0);
  passEncoder.end();
}
function resize2(cobalt, nodeData2) {
  const { bindGroup, pipeline, params_buf } = nodeData2.data;
  const { device } = cobalt;
  nodeData2.data.bindGroup = device.createBindGroup({
    layout: pipeline.getBindGroupLayout(0),
    entries: [
      {
        binding: 0,
        resource: nodeData2.refs.hdr.data.sampler
      },
      // color
      {
        binding: 1,
        resource: nodeData2.refs.hdr.data.view
      },
      // emissive
      {
        binding: 2,
        resource: nodeData2.refs.bloom.data.mip_view[0]
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
  type: "sprite",
  refs: [
    { name: "spritesheet", type: "customResource", access: "read" },
    { name: "hdr", type: "webGpuTextureView", format: "rgba16float", access: "write" },
    { name: "emissive", type: "webGpuTextureView", format: "rgba16float", access: "write" }
  ],
  // cobalt event handling functions
  // @params Object cobalt renderer world object
  // @params Object options optional data passed when initing this node
  onInit: async function(cobalt, options = {}) {
    return init3(cobalt, options);
  },
  onRun: function(cobalt, nodeData2, webGpuCommandEncoder, runCount) {
    draw3(cobalt, nodeData2, webGpuCommandEncoder, runCount);
  },
  onDestroy: function(cobalt, data) {
    destroy2(data);
  },
  onResize: function(cobalt, data) {
  },
  onViewportPosition: function(cobalt, data) {
  },
  // optional
  customFunctions: {
    ...SpriteRenderPass_exports
  }
};
async function init3(cobalt, nodeData2) {
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
  const spritesheet = nodeData2.refs.spritesheet.data;
  const bindGroup = device.createBindGroup({
    layout: nodeData2.refs.spritesheet.data.bindGroupLayout,
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
function draw3(cobalt, nodeData2, commandEncoder, runCount) {
  const { device } = cobalt;
  const loadOp = runCount === 0 ? "clear" : "load";
  if (nodeData2.data.dirty) {
    _rebuildSpriteDrawCalls(nodeData2.data);
    nodeData2.data.dirty = false;
  }
  device.queue.writeBuffer(nodeData2.data.spriteBuffer, 0, nodeData2.data.spriteData.buffer);
  const renderpass = commandEncoder.beginRenderPass({
    colorAttachments: [
      // color
      {
        view: nodeData2.refs.hdr.data.view,
        clearValue: cobalt.clearValue,
        loadOp,
        storeOp: "store"
      },
      // emissive
      {
        view: nodeData2.refs.emissive.data.view,
        clearValue: cobalt.clearValue,
        // TODO: why less than 2?? what crazy ass magic number is this??
        loadOp: "clear",
        //(actualSpriteRenderCount < 2) ? 'clear' : 'load',
        storeOp: "store"
      }
    ]
  });
  renderpass.setPipeline(nodeData2.refs.spritesheet.data.pipeline);
  renderpass.setBindGroup(0, nodeData2.data.bindGroup);
  renderpass.setVertexBuffer(0, nodeData2.refs.spritesheet.data.quads.buffer);
  const vertexCount = 6;
  let baseInstanceIdx = 0;
  for (let i = 0; i < nodeData2.data.instancedDrawCallCount; i++) {
    const baseVertexIdx = nodeData2.data.instancedDrawCalls[i * 2] * vertexCount;
    const instanceCount = nodeData2.data.instancedDrawCalls[i * 2 + 1];
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
function destroy2(nodeData2) {
  nodeData2.data.instancedDrawCalls = null;
  nodeData2.data.bindGroup = null;
  nodeData2.data.spriteBuffer.destroy();
  nodeData2.data.spriteBuffer = null;
  nodeData2.data.spriteData = null;
  nodeData2.data.spriteIndices.clear();
  nodeData2.data.spriteIndices = null;
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

// src/tile/tile.js
var tile_default = {
  type: "tile",
  refs: [
    { name: "tileAtlas", type: "webGpuTextureView", format: "rgba8unorm", access: "write" }
  ],
  // @params Object cobalt renderer world object
  // @params Object options optional data passed when initing this node
  onInit: async function(cobalt, options = {}) {
    return init4(cobalt, options);
  },
  onRun: function(cobalt, nodeData2, webGpuCommandEncoder) {
    draw4(cobalt, nodeData2, webGpuCommandEncoder);
  },
  onDestroy: function(cobalt, data) {
  },
  onResize: function(cobalt, data) {
  },
  onViewportPosition: function(cobalt, data) {
  }
};
async function init4(cobalt, nodeData2) {
  const { device } = cobalt;
  const material = await createTextureFromUrl(cobalt, "tile map", nodeData2.options.textureUrl);
  const dat = new Float32Array([nodeData2.options.scrollScale, nodeData2.options.scrollScale]);
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
    layout: nodeData2.refs.tileAtlas.data.tileBindGroupLayout,
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
    scrollScale: nodeData2.options.scrollScale
  };
}
function draw4(cobalt, nodeData2, commandEncoder, runCount) {
  const { device } = cobalt;
  const loadOp = runCount === 0 ? "clear" : "load";
  const renderpass = commandEncoder.beginRenderPass({
    colorAttachments: [
      {
        view: nodeData2.refs.hdr.data.view,
        clearValue: cobalt.clearValue,
        loadOp,
        storeOp: "store"
      }
    ]
  });
  const tileAtlas = nodeData2.refs.tileAtlas.data;
  renderpass.setPipeline(tileAtlas.pipeline);
  renderpass.setVertexBuffer(0, tileAtlas.quad.buffer);
  renderpass.setBindGroup(0, nodeData2.data.bindGroup);
  renderpass.setBindGroup(1, tileAtlas.atlasBindGroup);
  renderpass.draw(6, 1, 0, 0);
  renderpass.end();
}

// src/tile/create-tile-quad.js
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
    return init5(cobalt, options);
  },
  onRun: function(cobalt, nodeData2, webGpuCommandEncoder) {
  },
  onDestroy: function(cobalt, data) {
    destroy3(data);
  },
  onResize: function(cobalt, nodeData2) {
    _writeTileBuffer(cobalt, nodeData2);
  },
  onViewportPosition: function(cobalt, nodeData2) {
    _writeTileBuffer(cobalt, nodeData2);
  }
};
async function init5(cobalt, nodeData2) {
  const { device } = cobalt;
  const quad = createTileQuad(device);
  const atlasMaterial = await createTextureFromUrl(cobalt, "tile atlas", nodeData2.options.textureUrl);
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
    tileSize: nodeData2.options.tileSize,
    tileScale: nodeData2.options.tileScale
  };
}
function destroy3(data) {
  data.atlasMaterial.texture.destroy();
  data.atlasMaterial.texture = void 0;
}
function _writeTileBuffer(c, nodeData2) {
  _buf[0] = c.viewport.position[0];
  _buf[1] = c.viewport.position[1];
  const tile = nodeData2.data;
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

// src/deps.js
import { default as default2 } from "https://cdn.jsdelivr.net/gh/mreinstein/remove-array-items/src/remove-array-items.js";
import { default as default3 } from "https://cdn.skypack.dev/pin/round-half-up-symmetric@v2.0.0-pfMZ4UGGs9FcqO8UiEHO/mode=imports,min/optimized/round-half-up-symmetric.js";
import { mat4, vec2, vec3, vec4 } from "https://wgpu-matrix.org/dist/2.x/wgpu-matrix.module.js";

// src/sprite/spritesheet.js
var _tmpVec3 = vec3.create(0, 0, 0);
var spritesheet_default = {
  type: "spritesheet",
  refs: [],
  // @params Object cobalt renderer world object
  // @params Object options optional data passed when initing this node
  onInit: async function(cobalt, options = {}) {
    return init6(cobalt, options);
  },
  onRun: function(cobalt, nodeData2, webGpuCommandEncoder) {
  },
  onDestroy: function(cobalt, data) {
    destroy4(data);
  },
  onResize: function(cobalt, data) {
    _writeSpriteBuffer(cobalt, data);
  },
  onViewportPosition: function(cobalt, data) {
    _writeSpriteBuffer(cobalt, data);
  }
};
async function init6(cobalt, nodeData2) {
  const { canvas, device } = cobalt;
  let spritesheet = await fetchJson(nodeData2.options.spriteSheetJsonUrl);
  spritesheet = readSpriteSheet(spritesheet);
  const quads = createSpriteQuads(device, spritesheet);
  const [colorTexture, emissiveTexture] = await Promise.all([
    createTextureFromUrl(cobalt, "sprite", nodeData2.options.colorTextureUrl, "rgba8unorm"),
    createTextureFromUrl(cobalt, "emissive sprite", nodeData2.options.emissiveTextureUrl, "rgba8unorm")
  ]);
  canvas.style.imageRendering = "pixelated";
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
    renderPassLookup: /* @__PURE__ */ new Map(),
    // key is spriteId, value is the cobalt.renderPasses[] entry containing this sprite
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
function destroy4(nodeData2) {
  nodeData2.data.renderPassLookup.clear();
  nodeData2.data.quads.buffer.destroy();
  nodeData2.data.colorTexture.buffer.destroy();
  nodeData2.data.uniformBuffer.destroy();
  nodeData2.data.emissiveTexture.texture.destroy();
}
async function fetchJson(url) {
  const raw = await fetch(url);
  return raw.json();
}
function _writeSpriteBuffer(cobalt, nodeData2) {
  const { device } = cobalt;
  const GAME_WIDTH = cobalt.viewport.width / cobalt.viewport.zoom;
  const GAME_HEIGHT = cobalt.viewport.height / cobalt.viewport.zoom;
  const projection = mat4.ortho(0, GAME_WIDTH, GAME_HEIGHT, 0, -10, 10);
  vec3.set(-cobalt.viewport.position[0], -cobalt.viewport.position[1], 0, _tmpVec3);
  const view = mat4.translation(_tmpVec3);
  device.queue.writeBuffer(nodeData2.data.uniformBuffer, 0, view.buffer);
  device.queue.writeBuffer(nodeData2.data.uniformBuffer, 64, projection.buffer);
}

// src/fb-texture/fb-texture.js
var fb_texture_default = {
  type: "fbTexture",
  refs: [],
  // @params Object cobalt renderer world object
  // @params Object options optional data passed when initing this node
  onInit: async function(cobalt, options = {}) {
    return init7(cobalt, options);
  },
  onRun: function(cobalt, nodeData2, webGpuCommandEncoder) {
  },
  onDestroy: function(cobalt, data) {
    destroy5(data);
  },
  onResize: function(cobalt, data) {
    resize3(cobalt, data);
  },
  onViewportPosition: function(cobalt, data) {
  }
};
async function init7(cobalt, nodeData2) {
  const { device } = cobalt;
  const { label, mip_count, format, usage, viewportScale } = nodeData2.options;
  return createTexture(device, label, cobalt.viewport.width * viewportScale, cobalt.viewport.height * viewportScale, mip_count, format, usage);
}
function destroy5(cobalt, nodeData2) {
  nodeData2.data.texture.destroy();
}
function resize3(cobalt, nodeData2) {
  const { device } = cobalt;
  destroy5(cobalt, nodeData2);
  const { width, height } = cobalt.viewport;
  const { options } = nodeData2;
  const scale = nodeData2.options.viewportScale;
  nodeData2.data = createTexture(device, options.label, width * scale, height * scale, options.mip_count, options.format, options.usage);
}

// src/overlay/overlay.wgsl
var overlay_default = "struct TransformData{view:mat4x4<f32>,projection:mat4x4<f32>};struct Sprite{translate:vec2<f32>,scale:vec2<f32>,tint:vec4<f32>,opacity:f32,rotation:f32,};struct SpritesBuffer{models:array<Sprite>,};@binding(0)@group(0)var<uniform> transformUBO:TransformData;@binding(1)@group(0)var myTexture:texture_2d<f32>;@binding(2)@group(0)var mySampler:sampler;@binding(3)@group(0)var<storage,read>sprites:SpritesBuffer;struct Fragment{@builtin(position)Position:vec4<f32>,@location(0)TexCoord:vec2<f32>,@location(1)Tint:vec4<f32>,@location(2)Opacity:f32,};@vertex fn vs_main(@builtin(instance_index)i_id:u32,@location(0)vertexPosition:vec3<f32>,@location(1)vertexTexCoord:vec2<f32>)->Fragment{var output:Fragment;var sx:f32=sprites.models[i_id].scale.x;var sy:f32=sprites.models[i_id].scale.y;var sz:f32=1.0;var rot:f32=sprites.models[i_id].rotation;var tx:f32=sprites.models[i_id].translate.x;var ty:f32=sprites.models[i_id].translate.y;var tz:f32=0;var s=sin(rot);var c=cos(rot);var scaleM:mat4x4<f32>=mat4x4<f32>(sx,0.0,0.0,0.0,0.0,sy,0.0,0.0,0.0,0.0,sz,0.0,0,0,0,1.0);var modelM:mat4x4<f32>=mat4x4<f32>(c,s,0.0,0.0,-s,c,0.0,0.0,0.0,0.0,1.0,0.0,tx,ty,tz,1.0)*scaleM;output.Position=transformUBO.projection*transformUBO.view*modelM*vec4<f32>(vertexPosition,1.0);output.TexCoord=vertexTexCoord;output.Tint=sprites.models[i_id].tint;output.Opacity=sprites.models[i_id].opacity;return output;}@fragment fn fs_main(@location(0)TexCoord:vec2<f32>,@location(1)Tint:vec4<f32>,@location(2)Opacity:f32)->@location(0)vec4<f32>{var outColor:vec4<f32>=textureSample(myTexture,mySampler,TexCoord);var output=vec4<f32>(outColor.rgb*(1.0-Tint.a)+(Tint.rgb*Tint.a),outColor.a*Opacity);return output;}";

// src/overlay/constants.js
var FLOAT32S_PER_SPRITE2 = 12;

// src/overlay/overlay.js
var _tmpVec4 = vec4.create();
var _tmpVec32 = vec3.create();
var overlay_default2 = {
  type: "overlay",
  refs: [
    { name: "spritesheet", type: "customResource", access: "read" },
    { name: "color", type: "webGpuTextureFrameView", format: "rgba16float", access: "write" }
  ],
  // cobalt event handling functions
  // @params Object cobalt renderer world object
  // @params Object options optional data passed when initing this node
  onInit: async function(cobalt, options = {}) {
    return init8(cobalt, options);
  },
  onRun: function(cobalt, nodeData2, webGpuCommandEncoder, runCount) {
    draw5(cobalt, nodeData2, webGpuCommandEncoder, runCount);
  },
  onDestroy: function(cobalt, data) {
    destroy6(data);
  },
  onResize: function(cobalt, data) {
    _writeOverlayBuffer(cobalt, data);
  },
  onViewportPosition: function(cobalt, data) {
    _writeOverlayBuffer(cobalt, data);
  },
  // optional
  customFunctions: { ...SpriteRenderPass_exports }
};
async function init8(cobalt, nodeData2) {
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
        resource: nodeData2.refs.spritesheet.data.colorTexture.view
      },
      {
        binding: 2,
        resource: nodeData2.refs.spritesheet.data.colorTexture.sampler
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
      buffers: [nodeData2.refs.spritesheet.data.quads.bufferLayout]
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
    spriteData: new Float32Array(MAX_SPRITE_COUNT * FLOAT32S_PER_SPRITE2),
    spriteCount: 0,
    spriteIndices: /* @__PURE__ */ new Map(),
    // key is spriteId, value is insert index of the sprite. e.g., 0 means 1st sprite , 1 means 2nd sprite, etc.
    // when a sprite is changed the renderpass is dirty, and should have it's instance data copied to the gpu
    dirty: false
  };
}
function draw5(cobalt, nodeData2, commandEncoder, runCount) {
  const { device } = cobalt;
  const loadOp = runCount === 0 ? "clear" : "load";
  if (nodeData2.data.dirty) {
    _rebuildSpriteDrawCalls2(nodeData2.data);
    nodeData2.data.dirty = false;
  }
  device.queue.writeBuffer(nodeData2.data.spriteBuffer, 0, nodeData2.data.spriteData.buffer);
  const renderpass = commandEncoder.beginRenderPass({
    colorAttachments: [
      // color
      {
        view: nodeData2.refs.color,
        clearValue: cobalt.clearValue,
        loadOp: "load",
        storeOp: "store"
      }
    ]
  });
  renderpass.setPipeline(nodeData2.data.pipeline);
  renderpass.setBindGroup(0, nodeData2.data.bindGroup);
  renderpass.setVertexBuffer(0, nodeData2.refs.spritesheet.data.quads.buffer);
  const vertexCount = 6;
  let baseInstanceIdx = 0;
  for (let i = 0; i < nodeData2.data.instancedDrawCallCount; i++) {
    const baseVertexIdx = nodeData2.data.instancedDrawCalls[i * 2] * vertexCount;
    const instanceCount = nodeData2.data.instancedDrawCalls[i * 2 + 1];
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
    const spriteType = renderPass.spriteData[i * FLOAT32S_PER_SPRITE2 + 11] & 65535;
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
function _writeOverlayBuffer(cobalt, nodeData2) {
  const zoom = 1;
  const GAME_WIDTH = Math.round(cobalt.viewport.width / zoom);
  const GAME_HEIGHT = Math.round(cobalt.viewport.height / zoom);
  const projection = mat4.ortho(0, GAME_WIDTH, GAME_HEIGHT, 0, -10, 10);
  vec3.set(0, 0, 0, _tmpVec32);
  const view = mat4.translation(_tmpVec32);
  cobalt.device.queue.writeBuffer(nodeData2.data.uniformBuffer, 0, view.buffer);
  cobalt.device.queue.writeBuffer(nodeData2.data.uniformBuffer, 64, projection.buffer);
}
function destroy6(nodeData2) {
  nodeData2.data.instancedDrawCalls = null;
  nodeData2.data.bindGroup = null;
  nodeData2.data.spriteBuffer.destroy();
  nodeData2.data.spriteBuffer = null;
  nodeData2.data.uniformBuffer.destroy();
  nodeData2.data.uniformBuffer = null;
  nodeData2.data.spriteData = null;
  nodeData2.data.spriteIndices.clear();
  nodeData2.data.spriteIndices = null;
}

// src/cobalt.js
async function init9(canvas, viewportWidth, viewportHeight) {
  const adapter = await navigator.gpu?.requestAdapter({ powerPreference: "high-performance" });
  const device = await adapter?.requestDevice();
  const context = canvas.getContext("webgpu");
  const format = navigator.gpu.getPreferredCanvasFormat();
  context.configure({
    device,
    format,
    alphaMode: "opaque"
  });
  const nodeDefs = {
    // TODO: namespace the builtins  e.g., builtin_bloom or cobalt_bloom, etc.
    //
    // builtin node types
    bloom: bloom_default2,
    composite: scene_composite_default2,
    sprite: sprite_default,
    tile: tile_default,
    tileAtlas: atlas_default,
    spritesheet: spritesheet_default,
    fbTexture: fb_texture_default,
    overlay: overlay_default2
  };
  return {
    nodeDefs,
    // runnable nodes. ordering dictates render order (first to last)
    nodes: [],
    // named resources shard/referenced across run nodes
    resources: {},
    canvas,
    device,
    context,
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
  if (!c.nodeDefs[nodeData?.type])
    throw new Error(`Can't initialize a new node missing a type.`);
  c.nodeDefs[nodeDefinition.type] = nodeDefinition;
}
async function addResourceNode(c, nodeData2) {
  if (!nodeData2.name)
    throw new Error(`Can't create a resource node without a name property.`);
  c.resources[nodeData2.name] = await initNode(c, nodeData2);
  return c.resources[nodeData2.name];
}
async function initNode(c, nodeData2) {
  const nodeDef = c.nodeDefs[nodeData2?.type];
  if (!nodeDef)
    throw new Error(`Can't initialize a new node missing a type.`);
  const data = await nodeDef.onInit(c, nodeData2);
  const node = {
    type: nodeData2.type,
    refs: nodeData2.refs || {},
    options: nodeData2.options || {},
    data: data || {}
  };
  const customFunctions = nodeDef.customFunctions || {};
  for (const fnName in customFunctions) {
    node[fnName] = function(...args) {
      return customFunctions[fnName](c, node, ...args);
    };
  }
  c.nodes.push(node);
  return node;
}
function draw6(c) {
  const { device, context } = c;
  const commandEncoder = device.createCommandEncoder();
  const v = c.context.getCurrentTexture().createView();
  let runCount = 0;
  for (const n of c.nodes) {
    const nodeDef = c.nodeDefs[n.type];
    for (const arg of nodeDef.refs)
      if (arg.type === "webGpuTextureFrameView")
        n.refs[arg.name] = v;
    nodeDef.onRun(c, n, commandEncoder, runCount);
    runCount++;
  }
  device.queue.submit([commandEncoder.finish()]);
}
function reset(c) {
  for (const name in c.resources) {
    const res = c.resources[name];
    const nodeDef = c.nodeDefs[res.type];
    nodeDef.onDestroy(c, res);
  }
  c.resources = {};
  for (const n of c.nodes) {
    const nodeDef = c.nodeDefs[n.type];
    nodeDef.onDestroy(c, n);
  }
  c.nodes.length = 0;
}
function setViewportDimensions(c, width, height) {
  c.viewport.width = width;
  c.viewport.height = height;
  for (const resName in c.resources) {
    const res = c.resources[resName];
    const nodeDef = c.nodeDefs[res.type];
    nodeDef.onResize(c, res);
  }
  for (const n of c.nodes) {
    const nodeDef = c.nodeDefs[n.type];
    nodeDef.onResize(c, n);
  }
}
function setViewportPosition(c, pos) {
  c.viewport.position[0] = pos[0] - c.viewport.width / 2 / c.viewport.zoom;
  c.viewport.position[1] = pos[1] - c.viewport.height / 2 / c.viewport.zoom;
  for (const resName in c.resources) {
    const res = c.resources[resName];
    const nodeDef = c.nodeDefs[res.type];
    nodeDef.onViewportPosition(c, res);
  }
  for (const n of c.nodes) {
    const nodeDef = c.nodeDefs[n.type];
    nodeDef.onViewportPosition(c, n);
  }
}
export {
  addResourceNode,
  createTexture,
  defineNode,
  draw6 as draw,
  init9 as init,
  initNode,
  reset,
  setViewportDimensions,
  setViewportPosition
};
