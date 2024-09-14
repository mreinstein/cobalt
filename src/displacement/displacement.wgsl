struct TransformData {      //           align(16) size(64)
    mvpMatrix: mat4x4<f32>, // offset(0) align(16) size(64)
};

@group(0) @binding(0) var<uniform> transformUBO: TransformData;

struct VertexIn {
    @location(0) position: vec2<f32>,
};

struct VertexOut {
    @builtin(position) position: vec4<f32>,
};

@vertex
fn main_vertex (in: VertexIn) -> VertexOut  {
    var output: VertexOut;
    output.position = transformUBO.mvpMatrix * vec4<f32>(in.position, 0.0, 1.0);
    return output;
}

struct FragmentOut {
    @location(0) color: vec4<f32>,
};

@fragment
fn main_fragment () -> FragmentOut {
    var out: FragmentOut;
    out.color = vec4<f32>(1.0, 1.0, 1.0, 1.0);
    return out;
}
