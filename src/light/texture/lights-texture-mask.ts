/// <reference types="@webgpu/types"/>

import { LightsBuffer } from "../lights-buffer";
import { type ILightsTexture } from "./lights-texture";

type LineObstacleSegment = {
    readonly p1: [number, number];
    readonly p2: [number, number];
};

type LightObstacle = {
    readonly borderSegments: ReadonlyArray<LineObstacleSegment>;
};

class LightsTextureMask {
    private readonly device: GPUDevice;

    private readonly renderPipeline: GPURenderPipeline;

    private readonly renderBundleEncoderDescriptor: GPURenderBundleEncoderDescriptor;
    private renderBundle: GPURenderBundle;

    private readonly lightsBuffer: LightsBuffer;

    private readonly indirectDrawing: {
        readonly bufferCpu: ArrayBuffer;
        readonly bufferGpu: GPUBuffer;
    };

    private obstacles: {
        readonly positionsBufferGpu: GPUBuffer;
        readonly indexBufferGpu: GPUBuffer;
    } | null = null;

    public constructor(device: GPUDevice, lightsBuffer: LightsBuffer, lightsTexture: ILightsTexture, uniformLightSize: number) {
        this.device = device;
        this.lightsBuffer = lightsBuffer;

        const shaderModule = device.createShaderModule({
            label: "LightsTextureMask shader module",
            code: `
struct VertexIn {
    @builtin(instance_index) lightIndex: u32,
    @location(0) position: vec3<f32>,
    @location(1) lightSize: f32,
    @location(2) lightPosition: vec2<f32>,
};

struct VertexOut {
    @builtin(position) position: vec4<f32>,
    @location(0) color: vec4<f32>,
    @location(1) localPosition: vec2<f32>,
};

const cellsGridSizeU = vec2<u32>(${lightsTexture.gridSize.x}, ${lightsTexture.gridSize.y});
const cellsGridSizeF = vec2<f32>(${lightsTexture.gridSize.x}, ${lightsTexture.gridSize.y});

@vertex
fn main_vertex(in: VertexIn) -> VertexOut {
    let worldPosition = in.lightPosition + (in.position.xy - in.lightPosition) * (1.0 + 10000.0 * in.position.z);

    let scaling = f32(${uniformLightSize});

    let cellIndex = in.lightIndex / 4u;
    let indexInCell = in.lightIndex % 4u;

    let cellIdU = vec2<u32>(
        cellIndex % cellsGridSizeU.x,
        cellIndex / cellsGridSizeU.x,
    );
    let cellIdF = vec2<f32>(cellIdU);

    var out: VertexOut;
    out.localPosition = (worldPosition - in.lightPosition) / scaling;
    out.position = vec4<f32>(
        (out.localPosition - (cellsGridSizeF - 1.0) + 2.0 * cellIdF) / cellsGridSizeF,
        0.0,
        1.0,
    );
    out.color = vec4<f32>(
        vec4<u32>(indexInCell) != vec4<u32>(0u, 1u, 2u, 3u),
    );
    return out;
}

struct FragmentOut {
    @location(0) color: vec4<f32>,
};

@fragment
fn main_fragment(in: VertexOut) -> FragmentOut {
    if (in.localPosition.x < -1.0 || in.localPosition.x > 1.0 || in.localPosition.y <= -1.0 || in.localPosition.y > 1.0) {
        discard;
    }
    var out: FragmentOut;
    out.color = in.color;
    return out;
}
            `,
        });

        this.renderPipeline = device.createRenderPipeline({
            label: "LightsTextureMask renderpipeline",
            layout: "auto",
            vertex: {
                module: shaderModule,
                entryPoint: "main_vertex",
                buffers: [
                    {
                        attributes: [
                            {
                                shaderLocation: 0,
                                offset: 0,
                                format: "float32x3",
                            },
                        ],
                        arrayStride: 3 * Float32Array.BYTES_PER_ELEMENT,
                        stepMode: "vertex",
                    },
                    {
                        attributes: [
                            {
                                shaderLocation: 1,
                                offset: LightsBuffer.structs.light.size.offset,
                                format: "float32",
                            },
                            {
                                shaderLocation: 2,
                                offset: LightsBuffer.structs.light.position.offset,
                                format: "float32x2",
                            },
                        ],
                        arrayStride: LightsBuffer.structs.lightsBuffer.lights.stride,
                        stepMode: "instance",
                    },
                ],
            },
            fragment: {
                module: shaderModule,
                entryPoint: "main_fragment",
                targets: [{
                    format: lightsTexture.format,
                    blend: {
                        color: {
                            operation: "min",
                            srcFactor: "one",
                            dstFactor: "one",
                        },
                        alpha: {
                            operation: "min",
                            srcFactor: "one",
                            dstFactor: "one",
                        },
                    }
                }],
            },
            primitive: {
                cullMode: "back",
                topology: "triangle-list",
            },
            multisample: {
                count: lightsTexture.sampleCount,
            },
        });

        this.indirectDrawing = {
            bufferCpu: new ArrayBuffer(20),
            bufferGpu: device.createBuffer({
                label: "LightsTextureMask indirect buffer",
                size: 20,
                usage: GPUBufferUsage.INDIRECT | GPUBufferUsage.COPY_DST,
            }),
        };
        this.uploadIndirectDrawingBuffer();

        this.renderBundleEncoderDescriptor = {
            label: "LightsTextureMask renderbundle encoder",
            colorFormats: [lightsTexture.format],
            sampleCount: lightsTexture.sampleCount,
        };
        this.renderBundle = this.buildRenderBundle();
    }

    public getRenderBundle(): GPURenderBundle {
        return this.renderBundle;
    }

    public setObstacles(obstacles: ReadonlyArray<LightObstacle>): void {
        const positions: number[] = [];
        const indices: number[] = [];
        for (const obstacle of obstacles) {
            for (const segment of obstacle.borderSegments) {
                const firstQuadIndex = positions.length / 3;

                positions.push(
                    ...segment.p1, 0,
                    ...segment.p2, 0,
                    ...segment.p1, 1,
                    ...segment.p2, 1,
                );

                indices.push(
                    firstQuadIndex + 0, firstQuadIndex + 1, firstQuadIndex + 3,
                    firstQuadIndex + 0, firstQuadIndex + 3, firstQuadIndex + 2,
                );
            }
        }

        let gpuBuffersChanged = false;

        const positionsArray = new Float32Array(positions);
        let positionsBufferGpu = this.obstacles?.positionsBufferGpu;
        if (!positionsBufferGpu || positionsBufferGpu.size < positionsArray.byteLength) {
            positionsBufferGpu?.destroy();
            positionsBufferGpu = this.device.createBuffer({
                label: "LightsTextureMask positions buffer",
                size: positionsArray.byteLength,
                usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
            });
            gpuBuffersChanged = true;
        }
        this.device.queue.writeBuffer(positionsBufferGpu, 0, positionsArray);

        const indicesArray = new Uint16Array(indices);
        let indexBufferGpu = this.obstacles?.indexBufferGpu;
        if (!indexBufferGpu || indexBufferGpu.size < indicesArray.byteLength) {
            indexBufferGpu?.destroy();
            indexBufferGpu = this.device.createBuffer({
                label: "LightsTextureMask index buffer",
                size: indicesArray.byteLength,
                usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST,
            });
            gpuBuffersChanged = true;
        }
        this.device.queue.writeBuffer(indexBufferGpu, 0, indicesArray);

        this.obstacles = { positionsBufferGpu, indexBufferGpu };

        this.setIndirectIndexCount(indices.length);

        if (gpuBuffersChanged) {
            this.renderBundle = this.buildRenderBundle();
        }
    }

    public setLightsCount(count: number): void {
        this.setIndirectInstanceCount(count);
    }

    private setIndirectIndexCount(indexCount: number): void {
        const drawIndexedIndirectParameters = new Uint32Array(this.indirectDrawing.bufferCpu);
        if (drawIndexedIndirectParameters[0] !== indexCount) {
            drawIndexedIndirectParameters[0] = indexCount;
            this.uploadIndirectDrawingBuffer();
        }
    }

    private setIndirectInstanceCount(instanceCount: number): void {
        const drawIndexedIndirectParameters = new Uint32Array(this.indirectDrawing.bufferCpu);
        if (drawIndexedIndirectParameters[1] !== instanceCount) {
            drawIndexedIndirectParameters[1] = instanceCount;
            this.uploadIndirectDrawingBuffer();
        }
    }

    private buildRenderBundle(): GPURenderBundle {
        const renderBundleEncoder = this.device.createRenderBundleEncoder(this.renderBundleEncoderDescriptor);
        if (this.obstacles) {
            renderBundleEncoder.setPipeline(this.renderPipeline);
            renderBundleEncoder.setVertexBuffer(0, this.obstacles.positionsBufferGpu);
            renderBundleEncoder.setVertexBuffer(1, this.lightsBuffer.gpuBuffer, LightsBuffer.structs.lightsBuffer.lights.offset);
            renderBundleEncoder.setIndexBuffer(this.obstacles.indexBufferGpu, "uint16");
            renderBundleEncoder.drawIndexedIndirect(this.indirectDrawing.bufferGpu, 0);
        }
        return renderBundleEncoder.finish({ label: "LightsTextureMask renderbundle" });
    }

    private uploadIndirectDrawingBuffer(): void {
        this.device.queue.writeBuffer(this.indirectDrawing.bufferGpu, 0, this.indirectDrawing.bufferCpu);
    }
}

export {
    LightsTextureMask, type LightObstacle, type LineObstacleSegment
};

