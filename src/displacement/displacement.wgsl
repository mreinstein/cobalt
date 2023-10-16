// adapted from
// https://github.com/pixijs/pixijs/blob/dev/packages/filter-displacement/src/displacement.frag


struct TransformData {
    view: mat4x4<f32>,
    projection: mat4x4<f32>
};

@binding(0) @group(0) var<uniform> transformUBO: TransformData;
@binding(1) @group(0) var myTexture: texture_2d<f32>;
@binding(2) @group(0) var mySampler: sampler;
@binding(3) @group(0) var mapTexture: texture_2d<f32>;

struct Fragment {
    @builtin(position) Position : vec4<f32>,
    @location(0) TexCoord : vec2<f32>
};

// scale x, y, x
const sx: f32 = 1.0;
const sy: f32 = 1.0;
const sz: f32 = 1.0;

// translate x, y, z
const tx: f32 = 1.0;
const ty: f32 = 1.0;
const tz: f32 = 0;

// rotation
const rot: f32 = 0.0;
const s = sin(rot);
const c = cos(rot);

// https://webglfundamentals.org/webgl/lessons/webgl-2d-matrices.html

const scaleM: mat4x4<f32> = mat4x4<f32>(sx, 0.0, 0.0, 0.0,
                                     0.0,  sy, 0.0, 0.0,
                                     0.0, 0.0, sz, 0.0,
                                       0,   0,   0, 1.0);

// rotation and translation
const modelM: mat4x4<f32> = mat4x4<f32>(c,   s, 0.0, 0.0,
                                     -s,   c, 0.0, 0.0,
                                    0.0, 0.0, 1.0, 0.0,
                                     tx,  ty,  tz, 1.0) * scaleM;



@vertex
fn vs_main (@location(0) vertexPosition: vec2<f32>) -> Fragment  {

    var output: Fragment;

    output.Position = transformUBO.projection * transformUBO.view * modelM * vec4<f32>(vertexPosition, 0.0, 1.0);

    // convert screen space (-1 -> 1) to texture space (0 -> 1)
    output.TexCoord = vec2<f32>((output.Position.xy + 1.0) / 2.0);
    
    return output;
}


@fragment
fn fs_main (@location(0) TexCoord: vec2<f32>) -> @location(0) vec4<f32> {

    var map: vec4<f32> = textureSample(mapTexture, mySampler, TexCoord);

    let scale = 32.0;

    map -= 0.5; // convert map value from (0 -> 1) to (-0.5 -> 0.5)

    //let inverseTileTextureSize = 1 / vec2<f32>(textureDimensions(tileTexture, 0));

    let invTexSize = 1 / vec2<f32>(textureDimensions(mapTexture, 0));

    map.x = scale * invTexSize.x * map.x;
    map.y = scale * invTexSize.y * map.y;

    var clamped:vec2<f32> = vec2<f32>(TexCoord.x + map.x, TexCoord.y + map.y);

    // keep the coordinates within the texture so we're not sampling outside of that 
    // this is undefined behavior for webgl. maybe it's fine for webgpu? *shrugs*
    clamped = clamp(clamped, vec2<f32>(0,0), vec2<f32>(1, 1));

    let outColor: vec4<f32> = textureSample(myTexture, mySampler, clamped);

    //return outColor;
    return vec4<f32>(0.0, 1.0, 0.0, 1.0);
}
