class LightsBuffer {
    static structs = {
        definition: `
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
`,
        light: {
            radius: { offset: 12 },
            position: { offset: 16 },
        },
        lightsBuffer: {
            lights: { offset: 16, stride: 48 },
        },
    };
    device;
    maxLightsCount;
    currentLightsCount = 0;
    buffer;
    get gpuBuffer() {
        return this.buffer.bufferGpu;
    }
    constructor(device, maxLightsCount) {
        this.device = device;
        this.maxLightsCount = maxLightsCount;
        const bufferCpu = new ArrayBuffer(LightsBuffer.computeBufferBytesLength(maxLightsCount));
        const bufferGpu = device.createBuffer({
            label: "LightsBuffer buffer",
            size: bufferCpu.byteLength,
            usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST | GPUBufferUsage.VERTEX,
        });
        this.buffer = { bufferCpu, bufferGpu };
        this.setLights([]);
    }
    setLights(lights) {
        if (lights.length > this.maxLightsCount) {
            throw new Error(`Too many lights "${lights.length}", max is "${this.maxLightsCount}".`);
        }
        const newBufferLength = LightsBuffer.computeBufferBytesLength(lights.length);
        new Uint32Array(this.buffer.bufferCpu, 0, 1).set([lights.length]);
        lights.forEach((light, index) => {
            new Float32Array(this.buffer.bufferCpu, LightsBuffer.structs.lightsBuffer.lights.offset + LightsBuffer.structs.lightsBuffer.lights.stride * index, 9).set([
                ...light.color,
                light.radius,
                ...light.position,
                light.intensity,
                light.attenuationLinear,
                light.attenuationExp
            ]);
        });
        this.device.queue.writeBuffer(this.buffer.bufferGpu, 0, this.buffer.bufferCpu, 0, newBufferLength);
        this.currentLightsCount = lights.length;
    }
    get lightsCount() {
        return this.currentLightsCount;
    }
    destroy() {
        this.buffer.bufferGpu.destroy();
    }
    static computeBufferBytesLength(lightsCount) {
        return LightsBuffer.structs.lightsBuffer.lights.offset + LightsBuffer.structs.lightsBuffer.lights.stride * lightsCount;
    }
}
export { LightsBuffer };
