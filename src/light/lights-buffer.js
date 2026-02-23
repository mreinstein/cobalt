export const LIGHTS_STRUCT_DEFINITION = `
struct Light {                //             align(16) size(48)
    color: vec3<f32>,         // offset(0)   align(16) size(12)
    radius: f32,              // offset(12)  align(4)  size(4)
    position: vec2<f32>,      // offset(16)  align(8)  size(8)
    intensity: f32,           // offset(24)  align(4)  size(4)
    attenuationLinear: f32,   // offset(28)  align(4)  size(4)
    attenuationExp: f32,      // offset(32)  align(4)  size(4)
};

struct LightsBuffer {         //             align(16)
    count: u32,               // offset(0)   align(4)  size(4)
    // padding
    lights: array<Light>,     // offset(16)  align(16)
};
`

export const LIGHTS_BUFFER_STRUCTS = {
    light: {
        radius: { offset: 12 },
        position: { offset: 16 },
    },
    lightsBuffer: {
        lights: { offset: 16, stride: 48 },
    },
}

export function computeLightsBufferByteLength(lightsCount) {
    return (
        LIGHTS_BUFFER_STRUCTS.lightsBuffer.lights.offset +
        LIGHTS_BUFFER_STRUCTS.lightsBuffer.lights.stride * lightsCount
    )
}

export function createLightsBuffer(device, maxLightsCount) {
    const lightsBufferCpu = new ArrayBuffer(computeLightsBufferByteLength(maxLightsCount))
    const lightsBufferGpu = device.createBuffer({
        label: 'LightsBuffer buffer',
        size: lightsBufferCpu.byteLength,
        usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST | GPUBufferUsage.VERTEX,
    })
    const data = { lightsBufferCpu, lightsBufferGpu, maxLightsCount, lightsCount: 0 }
    writeLightsBuffer(device, data, [])
    return data
}

export function writeLightsBuffer(device, data, lights) {
    if (lights.length > data.maxLightsCount) {
        throw new Error(`Too many lights "${lights.length}", max is "${data.maxLightsCount}".`)
    }
    const { lightsBufferCpu, lightsBufferGpu } = data
    const { offset, stride } = LIGHTS_BUFFER_STRUCTS.lightsBuffer.lights
    new Uint32Array(lightsBufferCpu, 0, 1).set([lights.length])
    lights.forEach((light, index) => {
        new Float32Array(lightsBufferCpu, offset + stride * index, 9).set([
            ...light.color,
            light.radius,
            ...light.position,
            light.intensity,
            light.attenuationLinear,
            light.attenuationExp,
        ])
    })
    const newBufferLength = computeLightsBufferByteLength(lights.length)
    device.queue.writeBuffer(lightsBufferGpu, 0, lightsBufferCpu, 0, newBufferLength)
    data.lightsCount = lights.length
}

export function destroyLightsBuffer(data) {
    data.lightsBufferGpu.destroy()
}
