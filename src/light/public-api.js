import { setMaskObstacles } from './texture/lights-texture-mask.js'

// public API to interact with a lighting/shadows node.

export function setLights(cobalt, node, lights) {
    node.data.lights = lights
    node.data.lightsBufferNeedsUpdate = true
}

export function setAmbientLight(cobalt, node, color) {
    node.data.ambientLight = [...color]
}

export function setOccluders(cobalt, node, segmentsList) {
    setMaskObstacles(cobalt.device, node.data, segmentsList)
    node.data.lightsTextureNeedsUpdate = true
}
