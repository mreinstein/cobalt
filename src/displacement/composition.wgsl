struct DisplacementParameters {  //            align(16) size(16)
    offset: vec2<f32>,           // offset(0)  align(8)  size(8)
    scale: f32,                  // offset(8)  align(4)  size(4)
};

@group(0) @binding(0) var<uniform> uniforms: DisplacementParameters;
@group(0) @binding(1) var colorTexture: texture_2d<f32>;
@group(0) @binding(2) var colorSampler: sampler;
@group(0) @binding(3) var noiseTexture: texture_2d<f32>;
@group(0) @binding(4) var noiseSampler: sampler;
@group(0) @binding(5) var displacementTexture: texture_2d<f32>;

struct VertexIn {
    @builtin(vertex_index) vertexIndex: u32,
};

struct VertexOut {
    @builtin(position) position: vec4<f32>,
    @location(0) uv: vec2<f32>,
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
    out.position = vec4<f32>(screenPosition, 0, 1);
    out.uv = (0.5 + 0.5 * screenPosition * vec2<f32>(1, -1));
    return out;
}

struct FragmentOut {
    @location(0) color: vec4<f32>,
};

@fragment
fn main_fragment(in: VertexOut) -> FragmentOut {
    let noiseTextureDimensions = vec2<f32>(textureDimensions(noiseTexture, 0));
    let noiseUv = in.uv + uniforms.offset / noiseTextureDimensions;
    var noise = textureSample(noiseTexture, noiseSampler, noiseUv).rg;
    noise -= 0.5;
    noise *= uniforms.scale / noiseTextureDimensions;

    let displacement = textureSample(displacementTexture, colorSampler, in.uv).r;
    noise *= displacement;

    let colorUv = in.uv + noise;

    var out: FragmentOut;
    out.color = textureSample(colorTexture, colorSampler, colorUv);
    return out;
}
