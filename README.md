# Cobalt

![A chunk of cobalt](cobaltx2.png)

A 2D Web GPU renderer.


TODO:

* cleanup resources in destroy function
* reduce garbage collection in draw
* improve 02-sprites example to support real time property editing (rotation scale, etc.)
* fix scaling
* copy cobalt:sprite2 -> cobalt:HDRsprite
* rename cobalt:sprite2 -> cobalt:sprite
* remove unneeded spritesheet node stuff
* cleanup/simplify overlay node
* update usage docs, changelog
* publish new version 0.7.0


## Goals

* pure WebGpu: no fallbacks to WebGl or canvas
* minimal abstractions: provide very light abstractions over what webgpu provides
* gl-matrix/wgpu-matrix compatible: use primitives compatible with how webgpu and webgl store rendering data (float32 arrays)
* works in both browsers and node+SDL
* GC friendly: does not thrash the garbage collector. uses API design that won't allocate memory all over the place
* back-to-front z-indexing


## install

```bash
npm install @footgun/cobalt
```

Runnable demos are available in `examples/`.
