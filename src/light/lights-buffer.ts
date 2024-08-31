import { type Light } from "./types";

class LightsBuffer {
    public static readonly structs = {
        definition: `
struct Light {                //             align(16) size(48)
    color: vec3<f32>,         // offset(0)   align(16) size(12)
    size: f32,                // offset(12)  align(4)  size(4)
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
            size: { offset: 12 },
            position: { offset: 16 },
        },
        lightsBuffer: {
            lights: { offset: 16, stride: 48 },
        },
    };

    private readonly device: GPUDevice;

    public readonly maxLightsCount: number;
    private currentLightsCount: number = 0;

    private readonly buffer: {
        readonly bufferCpu: ArrayBuffer;
        readonly bufferGpu: GPUBuffer;
    };
    public get gpuBuffer(): GPUBuffer {
        return this.buffer.bufferGpu;
    }

    public constructor(device: GPUDevice, maxLightsCount: number) {
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

    public setLights(lights: ReadonlyArray<Light>): void {
        if (lights.length > this.maxLightsCount) {
            throw new Error(`Too many lights "${lights.length}", max is "${this.maxLightsCount}".`);
        }

        const newBufferLength = LightsBuffer.computeBufferBytesLength(lights.length);
        new Uint32Array(this.buffer.bufferCpu, 0, 1).set([lights.length]);

        lights.forEach((light: Light, index: number) => {
            new Float32Array(this.buffer.bufferCpu, LightsBuffer.structs.lightsBuffer.lights.offset + LightsBuffer.structs.lightsBuffer.lights.stride * index, 9).set([
                ...light.color,
                light.size,
                ...light.position,
                light.intensity,
                light.attenuationLinear,
                light.attenuationExp
            ]);
        });

        this.device.queue.writeBuffer(this.buffer.bufferGpu, 0, this.buffer.bufferCpu, 0, newBufferLength);
        this.currentLightsCount = lights.length;
    }

    public get lightsCount(): number {
        return this.currentLightsCount;
    }

    private static computeBufferBytesLength(lightsCount: number): number {
        return LightsBuffer.structs.lightsBuffer.lights.offset + LightsBuffer.structs.lightsBuffer.lights.stride * lightsCount;
    }
}

export {
    LightsBuffer
};
