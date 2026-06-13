import { vec3 } from 'wgpu-matrix'


export default function componentTransform (obj) {
    return {
        position: obj.position || vec3.create(0, 0, 0),
        rotation: obj.rotation || 0,

        // if set, this means the position is relative to another transform
        // rather than being in world space
        relativeTo: obj.relativeTo,
    }
}
