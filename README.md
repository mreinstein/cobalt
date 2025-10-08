# Cobalt

![A chunk of cobalt](cobaltx2.png)

A 2D Web GPU renderer.


TODO:
* write changelog
* sprite-hdr: reduce garbage collection in draw function
* make cobalt:sprite from HDR sprite
* spritesheet: remove unneeded variables/state
* update usage docs
* publish 0.7.0


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
