struct TransformData {
    viewOffset: vec2<f32>,
    viewportSize: vec2<f32>,
    inverseAtlasTextureSize: vec2<f32>,
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
@binding(1) @group(1) var atlasTexture: texture_2d<f32>;
@binding(2) @group(1) var atlasSampler: sampler;


struct Fragment {
    @builtin(position) Position : vec4<f32>,
    @location(0) TexCoord : vec2<f32>
};


@vertex
fn vs_main (@builtin(instance_index) i_id : u32, 
            @location(0) vertexPosition: vec2<f32>,
            @location(1) vertexTexCoord: vec2<f32>) -> Fragment  {

    var output : Fragment;

    let inverseTileTextureSize = 1 / vec2<f32>(textureDimensions(tileTexture, 0));  // transformUBO.tileLayers[i_id].inverseTileTextureSize;

    var scrollScale = transformUBO.tileLayers[i_id].scrollScale;

    var viewOffset : vec2<f32> = transformUBO.viewOffset * scrollScale;

    // from Brandon's webgl-tile shader
    let PixelCoord = (vertexTexCoord * transformUBO.viewportSize) + viewOffset;

    output.TexCoord = PixelCoord / transformUBO.tileSize;
    output.Position = vec4<f32>(vertexPosition, 0.0, 1.0);
    
    return output;
}


// based off of a fantastic implementation by Gregg Tavares https://stackoverflow.com/a/53465085/1927767
@fragment
fn fs_main (@location(0) TexCoord: vec2<f32>) -> @location(0) vec4<f32> {

    var tilemapCoord = floor(TexCoord);

    var u_tilemapSize = vec2<f32>(textureDimensions(tileTexture, 0));
    var tileFoo = fract((tilemapCoord + vec2<f32>(0.5, 0.5)) / u_tilemapSize);
    var tile = floor(textureSample(tileTexture, tileSampler, tileFoo) * 255.0);

    var u_tilesetSize = vec2<f32>(textureDimensions(atlasTexture, 0)) / transformUBO.tileSize;

    let u_tileUVMinBounds = vec2<f32>(0.5/transformUBO.tileSize, 0.5/transformUBO.tileSize);
    let u_tileUVMaxBounds = vec2<f32>((transformUBO.tileSize - 0.5) / transformUBO.tileSize, (transformUBO.tileSize - 0.5) / transformUBO.tileSize);
    var texcoord = clamp(fract(TexCoord), u_tileUVMinBounds, u_tileUVMaxBounds);

    var tileCoord = (tile.xy + texcoord) / u_tilesetSize;

    var color = textureSample(atlasTexture, atlasSampler, tileCoord);

    if (color.a <= 0.1) {
        discard;
    }
    return color;
}
