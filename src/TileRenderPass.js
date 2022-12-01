
// this corresponds to a WebGPU render pass.  It may handle 1 or more tile layers.
export function create (renderer, layers, minLayer, maxLayer, tileData) {

	const tileLayers = [ ]

	// put the bind group for each tile layer between minLayer and maxLayer
	for (let i=minLayer; i <= maxLayer; i++) {
		const layer = Object.values(layers).find((s) => s.zIndex === i)

		if (renderer.tile.tileBindGroups[layer.layer]) {
			tileLayers.push({
				imageData: renderer.tile.tileMaterials[layer.layer].imageData,
				instanceIndex: renderer.tile.instanceCount,
				bindGroup: renderer.tile.tileBindGroups[layer.layer],
				scrollScale: tileData.layers[layer.layer].scrollScale,
			})

			renderer.tile.instanceCount += 1
		}
	}

	return {
		type: 'tile',

		// layer range this render pass is responsible for drawing.
        minLayer,
        maxLayer,

        // each one of these corresponds to a draw call
        layers: tileLayers,
	}
}
