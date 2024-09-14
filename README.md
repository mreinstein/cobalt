# Cobalt

![A chunk of cobalt](cobalt2.jpeg)

An opinionated 2D node graph based on WebGpu, minimizing CPU usage and maximizing frame rate.


## Goals

* pure WebGpu: no fallbacks to WebGl or canvas
* minimal abstractions: provide very light abstractions over what webgpu provides
* gl-matrix/wgpu-matrix compatible: use primitives compatible with how webgpu and webgl store rendering data (float32 arrays)
* works in both browsers and node+SDL
* GC friendly: does not thrash the garbage collector. uses API design that won't allocate memory all over the place
* back-to-front z-indexing


See the `examples/` folder for runnable demonstrations.
