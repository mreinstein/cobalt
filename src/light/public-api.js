import uuid     from '../uuid.js'
import { vec2 } from '../deps.js'


// public API to interact with a lighting/shadows node.

/**
 * TODO: design the actual functions:
 * 
 * add light
 * remove light
 * update light property
 * 
 * add occluders
 * clear occluders
 */

export function addLight (cobalt, node, position) {
	node.data.lights.push({
		id: uuid(),
		position: vec2.clone(position),
		size: 50,
		color: [1, 0.5, 0.5],
		intensity: 1,
		attenuationLinear: 0,
		attenuationExp: 7,
	})
}


export function removeLight (cobalt, node, lightId) {
	const light = node.data.lights.find((L) => L.id === lightId)
	const lightIdx = node.data.lights.indexOf(light)

	if (lightIdx < 0)
		return

	node.data.lights.removeItem(lightIdx)
}

export function addOccluders(cobalt, node, obstaclesList) {
	node.data.lightsRenderer.setObstacles(obstaclesList);
}

export function clearOccluders(cobalt, node) {
	node.data.lightsRenderer.setObstacles([]);
}