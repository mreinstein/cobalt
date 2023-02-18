import { vec3 } from './deps.js'


export default function componentTransform (obj) {
    return {
        position: obj.position || vec3.create(),
        rotation: obj.rotation || 0,

        // if set, this means the position is relative to another transform
        // rather than being in world space
        relativeTo: obj.relativeTo,
    }
}
