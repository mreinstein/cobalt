
@binding(0) @group(0) var tileTexture: texture_2d<f32>;
@binding(1) @group(0) var tileSampler: sampler;


struct Fragment {
    @builtin(position) Position : vec4<f32>,
    @location(0) TexCoord : vec2<f32>
};


@vertex
fn vs_main (@builtin(vertex_index) VertexIndex : u32,
            @location(0) vertexPosition: vec2<f32>,
            @location(1) vertexTexCoord: vec2<f32>) -> Fragment  {

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


  var output : Fragment;
  output.Position = vec4(pos[VertexIndex], 0.0, 1.0);
  output.TexCoord = uv[VertexIndex];
  return output;

//    var output : Fragment;

  //  output.TexCoord = vertexTexCoord;
  //  output.Position = vec4<f32>(vertexPosition, 0.0, 1.0);
    
  //  return output;
}


@fragment
fn fs_main (@location(0) TexCoord: vec2<f32>) -> @location(0) vec4<f32> {
    var col = textureSample(tileTexture, tileSampler, TexCoord);
    //var col = vec4<f32>(1.0, 0.0, 1.0, 1.0);
    //return col;

    return vec4<f32>(col.rgb, 1.0);
}
