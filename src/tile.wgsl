struct TransformData {
	viewOffset: vec2<f32>,
	viewportSize: vec2<f32>,
	inverseSpriteTextureSize: vec2<f32>,
	tileSize: f32,
	inverseTileSize: f32,
	tileLayers: array<TileLayer, 32>,
};

struct TileLayer {
	scrollScale: vec2<f32>,
	inverseTileTextureSize: vec2<f32>
};

struct TileLayersBuffer {
  models: array<TileLayer>,
};

// individual tile texture
@binding(0) @group(0) var tileTexture: texture_2d<f32>;
@binding(1) @group(0) var tileSampler: sampler;

// common to all tile layers
@binding(0) @group(1) var<uniform> transformUBO: TransformData;
@binding(1) @group(1) var spriteTexture: texture_2d<f32>;
@binding(2) @group(1) var spriteSampler: sampler;


struct Fragment {
	@builtin(position) Position : vec4<f32>,
	@location(0) TexCoord : vec2<f32>,
	@location(1) PixelCoord : vec2<f32>
};


@vertex
fn vs_main (@builtin(instance_index) i_id : u32, 
	        @location(0) vertexPosition: vec2<f32>,
			@location(1) vertexTexCoord: vec2<f32>) -> Fragment  {

	var output : Fragment;

	var inverseTileTextureSize = transformUBO.tileLayers[i_id].inverseTileTextureSize;
	var scrollScale = transformUBO.tileLayers[i_id].scrollScale;

	var viewOffset : vec2<f32> = transformUBO.viewOffset * scrollScale;

	// from Brandon's webgl-tile shader
	output.PixelCoord = (vertexTexCoord * transformUBO.viewportSize) + viewOffset;
	output.TexCoord = output.PixelCoord * inverseTileTextureSize * transformUBO.inverseTileSize;
    output.Position = vec4<f32>(vertexPosition, 0.0, 1.0);

	return output;
}


@fragment
fn fs_main (@location(0) TexCoord: vec2<f32>, @location(1) PixelCoord: vec2<f32>) -> @location(0) vec4<f32> {
	// from Brandon's webgl-tile shader
	var tile: vec4<f32> = textureSample(tileTexture, tileSampler, TexCoord);

	if (tile.x == 1.0 && tile.y == 1.0) {
		discard;
	}

	// add extruded tile space to the sprite offset. assumes 1 px extruded around each tile
	var extrudeOffset : vec2<f32>;
	extrudeOffset[0] = floor(tile.x * 256.0) * 2 + 1;
	extrudeOffset[1] = floor(tile.y * 256.0) * 2 + 1;

    var spriteOffset : vec2<f32> = floor(tile.xy * 256.0) * transformUBO.tileSize;
	var spriteCoord : vec2<f32> = PixelCoord % transformUBO.tileSize;
	return textureSample(spriteTexture, spriteSampler, (extrudeOffset + spriteOffset + spriteCoord) * transformUBO.inverseSpriteTextureSize);
}
