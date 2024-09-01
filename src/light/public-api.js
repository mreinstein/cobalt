import uuid     from '../uuid.js'
import { vec2 } from '../deps.js'


// public API to interact with a lighting/shadows node.

export function setLights(cobalt, node, lights) {
	node.data.lights = lights;
	node.data.lightsBufferNeedsUpdate = true;
}

export function setAmbientLight(cobalt, node, color) {
	node.data.lightsRenderer.setAmbientLight(color);
}

export function setOccluders(cobalt, node, obstaclesList) {
	node.data.lightsRenderer.setObstacles(obstaclesList);
	node.data.lightsTextureNeedsUpdate = true;
}

