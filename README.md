# Cobalt

![A chunk of cobalt](cobalt2.jpeg)

An opinionated 2D node graph based on WebGpu, minimizing CPU usage and maximizing frame rate.


## Goals

* pure WebGpu: no fallbacks to WebGl or canvas
* minimal abstractions: provide very light abstractions over what webgpu provides
* gl-matrix compatible: use primitives compatible with how webgpu and webgl store rendering data (float32 arrays)
* GC friendly: does not thrash the garbage collector. uses API design that won't allocate memory all over the place
* back-to-front z-indexing


## Non-goals
This library is intentionally very low level. It provides a way to define nodes, and link them together via refs.
It is _NOT_ a high level abstraction that enables you to forget about how webgpu works.

This library is geared torwards people building their own renderers that want to leverage WebGpu, but want a minimal
node graph implementation that simplifies the linking of textures and other assets between render/compute passes.

See the `examples/` folder for runnable demonstrations.

