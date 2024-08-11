
@binding(0) @group(0) var tileTexture: texture_2d<f32>;
@binding(1) @group(0) var tileSampler: sampler;


struct Fragment {
    @builtin(position) Position : vec4<f32>,
    @location(0) TexCoord : vec2<f32>
};


const positions = array<vec2<f32>, 3>(
    vec2<f32>(-1.0, -3.0),
    vec2<f32>(3.0, 1.0),
    vec2<f32>(-1.0, 1.0)
);

const uvs = array<vec2<f32>, 3>(
    vec2<f32>(0.0, 2.0),
    vec2<f32>(2.0, 0.0),
    vec2<f32>(0.0, 0.0)
);

@vertex
fn vs_main (@builtin(vertex_index) VertexIndex : u32) -> Fragment  {

    var output : Fragment;

    output.Position = vec4<f32>(positions[VertexIndex], 0.0, 1.0);
    output.TexCoord = vec2<f32>(uvs[VertexIndex]);

    return output;
}


@fragment
fn fs_main (@location(0) TexCoord: vec2<f32>) -> @location(0) vec4<f32> {
    var col = textureSample(tileTexture, tileSampler, TexCoord);
    return vec4<f32>(col.rgb, 1.0);
}
