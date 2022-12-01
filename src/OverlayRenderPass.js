

// this corresponds to a WebGPU render pass.  It may handle 1 or more overlay layers.
export function create (renderer, minLayer, maxLayer) {
	// TODO

	return {
		type: 'overlay',

		// layer range this render pass is responsible for drawing.
        minLayer,
        maxLayer,
 
	}
}
