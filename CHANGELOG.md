# 0.6.15
* handle destroyed texture case in tile nodes

# 0.6.14
* re-enable viewport position rounding 

# 0.6.13
* cleanup device buffers in bloom 


# 0.6.12
* fix mistype in tile node


# 0.6.11
* make tile, tileAtlas, spriteSheet nodes default to input textures with rgba8unorm


# 0.6.10
* bugfix in tile node setTexture function

# 0.6.9
* bugfix in tile atlas setTexture function


# 0.6.8 - 0.6.5
* add sdl + webgpu support for tile node


# 0.6.4
* add parameters for @kmamal/gpu v0.2.1


# 0.6.3
* add labels to all renderpass nodes


# 0.6.2
* use preferred canvas format in more places


# 0.6.1
* use preferred canvas format in more places


# 0.6.0
* use preferred canvas format in various places instead of hardcoding to bgra8unorm, which doesn't seem to work on linux
  because that defaults to bgra8unorm-srgb


# 0.5.1
* add labels to all render pipelines

# 0.5.0
* resize the primitives vertexBuffer to use memory more conservatively


# 0.4.0
* use `embed `poly-to-pslg` and other deps via npm workspaces and stop using http imports in the bundle step


# 0.3.2
* tweak primitive positioning when setting viewport zoom to non 1.0 value


# 0.3.1
* remove exterior edges from filled paths


# 0.3.0
* use `poly-to-pslg` to clean up primitive polyons


# 0.2.0
* refactor primitives node: support transforms, stroked and filled paths
* added CHANGELOG
