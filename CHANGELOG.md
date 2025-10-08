# 0.7.0

This release has several breaking changes:

* builtin nodes `cobalt:sprite` and `cobalt:tile` are renamed to `cobalt:spriteHDR` and `cobalt:tileHDR` to
  reflect the fact that they work with high dynamic range rendering pipelines.
* a new builtin node was created, `cobalt:sprite` which is meant to work with non-HDR rendering pipelines. If you're
  not using bloom this is probably a better node because it's simpler and doesn't require as complicated a node graph.
* sprite nodes are completely re-written
  * simpler and also run 2X faster
  * now cull sprites that are outside the viewport.
  * no longer support z-index. If you want specific layering, add more nodes and order them as you wish
* the overlay node is removed. You can now do overlays by passing ` isScreenSpace: true` to a sprite node's options to
  achieve the same thing. (see examples/04-overlay for a working example)


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
