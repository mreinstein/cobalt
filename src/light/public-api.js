import { vec2 } from 'wgpu-matrix'
import uuid from '../uuid.js'

// public API to interact with a lighting/shadows node.

export function setLights(cobalt, node, lights) {
    node.data.lights = lights
    node.data.lightsBufferNeedsUpdate = true
}

export function setAmbientLight(cobalt, node, color) {
    node.data.lightsRenderer.setAmbientLight(color)
}

export function setOccluders(cobalt, node, segmentsList) {
    node.data.lightsRenderer.setObstacles(segmentsList)
    node.data.lightsTextureNeedsUpdate = true
}
