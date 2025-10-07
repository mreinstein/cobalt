struct ViewParams {
	view : mat4x4<f32>,
	proj : mat4x4<f32>
};

@group(0) @binding(0) var<uniform> uView : ViewParams;
@group(0) @binding(1) var uSampler : sampler;
@group(0) @binding(2) var uTex : texture_2d<f32>;


struct SpriteDesc {
	uvOrigin : vec2<f32>,
	uvSpan : vec2<f32>,
	frameSize : vec2<f32>, // pixels
	centerOffset : vec2<f32>, // pixels
};

@group(0) @binding(3) var<storage, read> Sprites : array<SpriteDesc>;

@group(0) @binding(4) var emissiveTexture: texture_2d<f32>;

struct VSOut {
	@builtin(position) pos : vec4<f32>,
	@location(0) uv : vec2<f32>,
	@location(1) tint : vec4<f32>,
	@location(2) opacity : f32,
};

// corners for a unit-centered quad in strip order
const corners = array<vec2<f32>, 4>(
	vec2<f32>(-0.5, -0.5),
	vec2<f32>( 0.5, -0.5),
	vec2<f32>(-0.5, 0.5),
	vec2<f32>( 0.5, 0.5),
);
const uvBase = array<vec2<f32>, 4>(
	vec2<f32>(0.0, 0.0),
	vec2<f32>(1.0, 0.0),
	vec2<f32>(0.0, 1.0),
	vec2<f32>(1.0, 1.0),
);

// multiple render targets
struct GBufferOutput {
  @location(0) color : vec4<f32>,
  @location(1) emissive : vec4<f32>,
}


@vertex
fn vs_main(@builtin(vertex_index) vid : u32,
			// per-instance attributes (locations 0..4)
			@location(0) i_pos : vec2<f32>,
			@location(1) i_size : vec2<f32>, // scales descriptor frame size (1,1 means use descriptor size)
			@location(2) i_scale : vec2<f32>, // per-axis scale
			@location(3) i_tint : vec4<f32>,
			@location(4) i_spriteId : u32,
			@location(5) i_opacity : f32,
			@location(6) i_rotation : f32
			) -> VSOut {

	let rot = i_rotation;
	let c = cos(rot);
	let s = sin(rot);

	let d = Sprites[i_spriteId];
	let corner = corners[vid];

	let sizePx = d.frameSize * i_size * i_scale; // per-axis scale applied on trimmed frame
  var local = corner * sizePx;
  local += d.centerOffset * i_scale; // compensate trimming // compensate trimming (so rotation is around original center)


	let rotated = vec2<f32>(local.x * c - local.y * s, local.x * s + local.y * c);
	let world = vec4<f32>(rotated + i_pos, 0.0, 1.0);

	var out : VSOut;
	out.pos = uView.proj * uView.view * world;
	out.uv = d.uvOrigin + d.uvSpan * uvBase[vid];
	out.tint = i_tint;
  out.opacity = i_opacity;

	return out;
}


@fragment
fn fs_main(in : VSOut) -> GBufferOutput {
    
    var output : GBufferOutput;

	let texel = textureSample(uTex, uSampler, in.uv);
	output.color = vec4<f32>(texel.rgb * (1.0 - in.tint.a) + (in.tint.rgb * in.tint.a), texel.a * in.opacity);

	let emissive = textureSample(emissiveTexture, uSampler, in.uv);

    // the alpha channel in the emissive texture is used for emission strength
    output.emissive = vec4(emissive.rgb, 1.0) * emissive.a;

	return output;
}
