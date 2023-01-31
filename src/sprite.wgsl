struct TransformData {
	view: mat4x4<f32>,
	projection: mat4x4<f32>
};

struct Sprite {
	translate: vec2<f32>,
	scale: vec2<f32>,
	tint: vec4<f32>,
	opacity: vec4<f32>,  // opacity[0] is opacity,  opacity[1] is rotation, opacity[2] is emissive intensity
};

struct SpritesBuffer {
  models: array<Sprite>,
};

@binding(0) @group(0) var<uniform> transformUBO: TransformData;
@binding(1) @group(0) var myTexture: texture_2d<f32>;
@binding(2) @group(0) var mySampler: sampler;
@binding(3) @group(0) var<storage, read> sprites : SpritesBuffer;
@binding(4) @group(0) var emissiveTexture: texture_2d<f32>;


struct Fragment {
	@builtin(position) Position : vec4<f32>,
	@location(0) TexCoord : vec2<f32>,
	@location(1) Tint : vec4<f32>,
	@location(2) Opacity: f32,
	@location(3) EmissiveIntensity: f32,
};

// multiple render targets
struct GBufferOutput {
  @location(0) color : vec4<f32>,
  @location(1) emissive : vec4<f32>,
}


@vertex
fn vs_main (@builtin(instance_index) i_id : u32, 
            @location(0) vertexPosition: vec3<f32>,
			      @location(1) vertexTexCoord: vec2<f32>) -> Fragment  {

	var output : Fragment;

	var sx: f32 = sprites.models[i_id].scale.x;
	var sy: f32 = sprites.models[i_id].scale.y;
	var sz: f32 = 1.0;

	var rot: f32 = sprites.models[i_id].opacity[1];

	var tx: f32 = sprites.models[i_id].translate.x;
	var ty: f32 = sprites.models[i_id].translate.y;
	var tz: f32 = 0;

	var s = sin(rot);
  var c = cos(rot);

	// https://webglfundamentals.org/webgl/lessons/webgl-2d-matrices.html

	var scaleM: mat4x4<f32> = mat4x4<f32>(sx, 0.0, 0.0, 0.0,
	                                     0.0,  sy, 0.0, 0.0,
									     0.0, 0.0, sz, 0.0,
    								       0,   0,   0, 1.0);

	// rotation and translation
	var modelM: mat4x4<f32> = mat4x4<f32>(c,   s, 0.0, 0.0,
	                                     -s,   c, 0.0, 0.0,
									    0.0, 0.0, 1.0, 0.0,
    								     tx,  ty,  tz, 1.0) * scaleM;

	//output.Position = transformUBO.projection * transformUBO.view * sprites.models[i_id].modelMatrix * vec4<f32>(vertexPosition, 1.0);
	output.Position = transformUBO.projection * transformUBO.view * modelM * vec4<f32>(vertexPosition, 1.0);

	output.TexCoord = vertexTexCoord;
	output.Tint = sprites.models[i_id].tint;
	output.Opacity = sprites.models[i_id].opacity[0];
	output.EmissiveIntensity = sprites.models[i_id].opacity[2];
	//output.Opacity = 1.0;
	return output;
}

@fragment
fn fs_main (@location(0) TexCoord: vec2<f32>,
            @location(1) Tint: vec4<f32>,
			      @location(2) Opacity: f32,
			      @location(3) EmissiveIntensity: f32) -> GBufferOutput {
	

	var output : GBufferOutput;

	var outColor: vec4<f32> = textureSample(myTexture, mySampler, TexCoord);
	output.color = vec4<f32>(outColor.rgb * (1.0 - Tint.a) + (Tint.rgb * Tint.a), outColor.a * Opacity);

	output.emissive = textureSample(emissiveTexture, mySampler, TexCoord) * EmissiveIntensity;

	return output;
}
