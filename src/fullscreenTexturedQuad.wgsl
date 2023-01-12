@group(0) @binding(0) var mySampler : sampler;
@group(0) @binding(1) var colorTexture : texture_2d<f32>;
@group(0) @binding(2) var emissiveTexture : texture_2d<f32>;

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


@fragment
fn frag_main(@location(0) fragUV : vec2<f32>) -> @location(0) vec4<f32> {

  // super crappy pixelation effect
  /*
  let pixelation = 4.0;
  let size = vec2<f32>(pixelation/480.0, pixelation / 270.0);
  let coord = floor( fragUV / size ) * size;
  return textureSample(colorTexture, mySampler, coord);
  */


  // super crappy bloom effect
  
  let intensity = 1.5;
  let blurSize = 4.0 / 512.0;
  var sum = vec4<f32>(0,0,0,0);

  // take nine samples, with the distance blurSize between them
  sum += textureSample(emissiveTexture, mySampler, vec2<f32>(fragUV.x - 4.0*blurSize, fragUV.y)) * 0.05;
  sum += textureSample(emissiveTexture, mySampler, vec2<f32>(fragUV.x - 3.0*blurSize, fragUV.y)) * 0.09;
  sum += textureSample(emissiveTexture, mySampler, vec2<f32>(fragUV.x - 2.0*blurSize, fragUV.y)) * 0.12;
  sum += textureSample(emissiveTexture, mySampler, vec2<f32>(fragUV.x - blurSize, fragUV.y)) * 0.15;
  sum += textureSample(emissiveTexture, mySampler, vec2<f32>(fragUV.x, fragUV.y)) * 0.16;
  sum += textureSample(emissiveTexture, mySampler, vec2<f32>(fragUV.x + blurSize, fragUV.y)) * 0.15;
  sum += textureSample(emissiveTexture, mySampler, vec2<f32>(fragUV.x + 2.0*blurSize, fragUV.y)) * 0.12;
  sum += textureSample(emissiveTexture, mySampler, vec2<f32>(fragUV.x + 3.0*blurSize, fragUV.y)) * 0.09;
  sum += textureSample(emissiveTexture, mySampler, vec2<f32>(fragUV.x + 4.0*blurSize, fragUV.y)) * 0.05;

  // take nine samples, with the distance blurSize between them
  sum += textureSample(emissiveTexture, mySampler, vec2<f32>(fragUV.x, fragUV.y - 4.0*blurSize)) * 0.05;
  sum += textureSample(emissiveTexture, mySampler, vec2<f32>(fragUV.x, fragUV.y - 3.0*blurSize)) * 0.09;
  sum += textureSample(emissiveTexture, mySampler, vec2<f32>(fragUV.x, fragUV.y - 2.0*blurSize)) * 0.12;
  sum += textureSample(emissiveTexture, mySampler, vec2<f32>(fragUV.x, fragUV.y - blurSize)) * 0.15;
  sum += textureSample(emissiveTexture, mySampler, vec2<f32>(fragUV.x, fragUV.y)) * 0.16;
  sum += textureSample(emissiveTexture, mySampler, vec2<f32>(fragUV.x, fragUV.y + blurSize)) * 0.15;
  sum += textureSample(emissiveTexture, mySampler, vec2<f32>(fragUV.x, fragUV.y + 2.0*blurSize)) * 0.12;
  sum += textureSample(emissiveTexture, mySampler, vec2<f32>(fragUV.x, fragUV.y + 3.0*blurSize)) * 0.09;
  sum += textureSample(emissiveTexture, mySampler, vec2<f32>(fragUV.x, fragUV.y + 4.0*blurSize)) * 0.05;

  // increase blur with intensity
  return (sum * intensity + textureSample(emissiveTexture, mySampler, fragUV)) + textureSample(colorTexture, mySampler, fragUV);
  //return sum * intensity + textureSample(emissiveTexture, mySampler, fragUV);
  

  // additive blend the emissive glow with the original color
  //return textureSample(emissiveTexture, mySampler, fragUV) + textureSample(colorTexture, mySampler, fragUV);
}
