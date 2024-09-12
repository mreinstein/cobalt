// adapted from
// https://github.com/pixijs/pixijs/blob/dev/packages/filter-displacement/src/displacement.frag


struct TransformData {
    mvpMatrix: mat4x4<f32>,
};

struct displacement_param {
    offset: vec2<f32>,
    scale: f32,
    noop: f32,
};

@binding(0) @group(0) var<uniform> transformUBO: TransformData;
@binding(1) @group(0) var myTexture: texture_2d<f32>;
@binding(2) @group(0) var mySampler: sampler;
@binding(3) @group(0) var mapTexture: texture_2d<f32>;
@binding(4) @group(0) var<uniform> param: displacement_param;

struct Fragment {
    @builtin(position) Position : vec4<f32>,
    @location(0) TexCoord : vec2<f32>
};

@vertex
fn vs_main (@location(0) vertexPosition: vec2<f32>) -> Fragment  {

    var output: Fragment;

    output.Position = transformUBO.mvpMatrix * vec4<f32>(vertexPosition, 0.0, 1.0);

    // convert screen space (-1 -> 1) to texture space (0 -> 1)
    output.TexCoord = vec2<f32>((output.Position.xy + 1.0) / 2.0);
    output.TexCoord.y = 1.0 - output.TexCoord.y; // invert the Y because in texture space, y is positive up
    
    return output;
}


@fragment
fn fs_main (@location(0) TexCoord: vec2<f32>) -> @location(0) vec4<f32> {

    let dims = vec2<f32>(textureDimensions(mapTexture, 0));
    let inv = param.offset / dims;

    var map: vec4<f32> = textureSample(mapTexture, mySampler, TexCoord + inv);

    let scale = param.scale;

    map -= 0.5; // convert map value from (0 -> 1) to (-0.5 -> 0.5)

    
    let invTexSize = 1 / dims;

    map.x = scale * invTexSize.x * map.x;
    map.y = scale * invTexSize.y * map.y;

    var clamped:vec2<f32> = vec2<f32>(TexCoord.x + map.x, TexCoord.y + map.y);

    // keep the coordinates within the texture so we're not sampling outside of that 
    // this is undefined behavior for webgl. maybe it's fine for webgpu? *shrugs*
    clamped = clamp(clamped, vec2<f32>(0,0), vec2<f32>(1, 1));

    let outColor: vec4<f32> = textureSample(myTexture, mySampler, clamped);

    return outColor;
}
