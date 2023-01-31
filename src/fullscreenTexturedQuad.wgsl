
struct BloomComposite {
  bloom_intensity: f32,
  bloom_combine_constant: f32,
}

@group(0) @binding(0) var mySampler : sampler;
@group(0) @binding(1) var colorTexture : texture_2d<f32>;
@group(0) @binding(2) var emissiveTexture : texture_2d<f32>;
@group(0) @binding(3) var<uniform> composite_parameter: BloomComposite;

struct VertexOutput {
  @builtin(position) Position : vec4<f32>,
  @location(0) fragUV : vec2<f32>,
}


@vertex
fn vert_main(@builtin(vertex_index) VertexIndex : u32) -> VertexOutput {
  const pos = array(
    vec2( 1.0,  1.0),
    vec2( 1.0, -1.0),
    vec2(-1.0, -1.0),
    vec2( 1.0,  1.0),
    vec2(-1.0, -1.0),
    vec2(-1.0,  1.0),
  );

  const uv = array(
    vec2(1.0, 0.0),
    vec2(1.0, 1.0),
    vec2(0.0, 1.0),
    vec2(1.0, 0.0),
    vec2(0.0, 1.0),
    vec2(0.0, 0.0),
  );

  var output : VertexOutput;
  output.Position = vec4(pos[VertexIndex], 0.0, 1.0);
  output.fragUV = uv[VertexIndex];
  return output;
}


// can be optimized into lut (compute can gen it)
fn GTTonemap_point(x: f32) -> f32{
  let m: f32 = 0.22; // linear section start
  let a: f32 = 1.0;  // contrast
  let c: f32 = 1.33; // black brightness
  let P: f32 = 1.0;  // maximum brightness
  let l: f32 = 0.4;  // linear section length
  let l0: f32 = ((P-m)*l) / a; // 0.312
  let S0: f32 = m + l0; // 0.532
  let S1: f32 = m + a * l0; // 0.532
  let C2: f32 = (a*P) / (P - S1); // 2.13675213675
  let L: f32 = m + a * (x - m);
  let T: f32 = m * pow(x/m, c);
  let S: f32 = P - (P - S1) * exp(-C2*(x - S0)/P);
  let w0: f32 = 1.0 - smoothstep(0.0, m, x);
  var w2: f32 = 1.0;
  if (x < m+l) {
    w2 = 0.0;
  }
  let w1: f32 = 1.0 - w0 - w2;
  return f32(T * w0 + L * w1 + S * w2);
}

// this costs about 0.2-0.3ms more than aces, as-is
fn GTTonemap(x: vec3<f32>) -> vec3<f32>{
  return vec3<f32>(GTTonemap_point(x.r), GTTonemap_point(x.g), GTTonemap_point(x.b));
}


fn aces(x: vec3<f32>) -> vec3<f32> {
  let a: f32 = 2.51;
  let b: f32 = 0.03;
  let c: f32 = 2.43;
  let d: f32 = 0.59;
  let e: f32 = 0.14;
  return clamp((x * (a * x + b)) / (x * (c * x + d) + e), vec3<f32>(0.0), vec3<f32>(1.0));
}


@fragment
fn frag_main(@location(0) fragUV : vec2<f32>) -> @location(0) vec4<f32> {

  let hdr_color = textureSample(colorTexture, mySampler, fragUV);
  let bloom_color = textureSample(emissiveTexture, mySampler, fragUV);
  
  let combined_color = ((bloom_color * composite_parameter.bloom_intensity) * composite_parameter.bloom_combine_constant);

  let mapped_color = GTTonemap(combined_color.rgb);
  //let mapped_color = aces(combined_color.rgb);
  let gamma_corrected_color = pow(mapped_color, vec3<f32>(1.0 / 2.2));

  return vec4<f32>(gamma_corrected_color + hdr_color.rgb, 1.0);
  
}
