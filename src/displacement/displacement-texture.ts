/// <reference types="@webgpu/types"/>

import * as wgpuMatrix from "wgpu-matrix";
import { TrianglesBuffer } from "./triangles-buffer";

type Viewport = {
    readonly width: number;
    readonly height: number;
    readonly zoom: number;
    readonly position: [number, number];
};

type Parameters = {
    readonly device: GPUDevice;

    readonly width: number;
    readonly height: number;

    readonly trianglesBuffer: TrianglesBuffer;
};

class DisplacementTexture {
    private readonly device: GPUDevice;
    private readonly format: GPUTextureFormat = "r8unorm";

    private texture: GPUTexture;
    private textureView: GPUTextureView | null = null;

    private readonly renderPipeline: GPURenderPipeline;
    private readonly bindgroup: GPUBindGroup;
    private readonly uniformsBuffer: GPUBuffer;

    private readonly trianglesBuffer: TrianglesBuffer;

    public constructor(params: Parameters) {
        this.device = params.device;
        this.texture = this.createTexture(params.width, params.height);

        this.trianglesBuffer = params.trianglesBuffer;

        const shaderModule = this.device.createShaderModule({
            label: "DisplacementTexture shader module",
            code: `
struct TransformData {      //           align(16) size(64)
    mvpMatrix: mat4x4<f32>, // offset(0) align(16) size(64)
};

@group(0) @binding(0) var<uniform> transformUBO: TransformData;

struct VertexIn {
    @location(0) position: vec2<f32>,
};

struct VertexOut {
    @builtin(position) position: vec4<f32>,
};

@vertex
fn main_vertex (in: VertexIn) -> VertexOut  {
    var output: VertexOut;
    output.position = transformUBO.mvpMatrix * vec4<f32>(in.position, 0.0, 1.0);
    return output;
}

struct FragmentOut {
    @location(0) color: vec4<f32>,
};

@fragment
fn main_fragment () -> FragmentOut {
    var out: FragmentOut;
    out.color = vec4<f32>(1.0, 1.0, 1.0, 1.0);
    return out;
}`,

        });

        this.renderPipeline = this.device.createRenderPipeline({
            label: "DisplacementTexture renderpipeline",
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
                                format: "float32x2",
                            },
                        ],
                        arrayStride: 2 * Float32Array.BYTES_PER_ELEMENT,
                        stepMode: "vertex",
                    },
                ],
            },
            fragment: {
                module: shaderModule,
                entryPoint: "main_fragment",
                targets: [{
                    format: this.format,
                }],
            },
            primitive: {
                cullMode: "none",
                topology: "triangle-list",
            },
        });

        this.uniformsBuffer = this.device.createBuffer({
            label: "DisplacementTexture uniforms buffer",
            size: 64,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        });

        this.bindgroup = this.device.createBindGroup({
            label: "DisplacementTexture bindgroup",
            layout: this.renderPipeline.getBindGroupLayout(0),
            entries: [
                {
                    binding: 0,
                    resource: { buffer: this.uniformsBuffer },
                },
            ],
        });
    }

    public update(commandEncoder: GPUCommandEncoder): void {
        const renderpassEncoder = commandEncoder.beginRenderPass({
            label: "lights-renderer render to texture renderpass",
            colorAttachments: [{
                view: this.getView(),
                clearValue: [0, 0, 0, 1],
                loadOp: "load",
                storeOp: "store",

            }],
        });

        const [textureWidth, textureHeight] = [this.texture.width, this.texture.height];
        renderpassEncoder.setViewport(0, 0, textureWidth, textureHeight, 0, 1);
        renderpassEncoder.setScissorRect(0, 0, textureWidth, textureHeight);
        renderpassEncoder.setPipeline(this.renderPipeline);
        renderpassEncoder.setBindGroup(0, this.bindgroup);
        renderpassEncoder.setVertexBuffer(0, this.trianglesBuffer.bufferGpu);
        renderpassEncoder.draw(3 * this.trianglesBuffer.spriteCount);
        renderpassEncoder.end();
    };

    public resize(width: number, height: number): void {
        this.texture.destroy();
        this.texture = this.createTexture(width, height);
    }

    public setViewport(viewport: Viewport): void {
        const scaling = [1, 1, 1];
        const rotation = 0;
        const translation = [1, 1, 0];

        const modelMatrix = wgpuMatrix.mat4.identity();
        wgpuMatrix.mat4.multiply(wgpuMatrix.mat4.scaling(scaling), modelMatrix, modelMatrix);
        wgpuMatrix.mat4.multiply(wgpuMatrix.mat4.rotationZ(rotation), modelMatrix, modelMatrix);
        wgpuMatrix.mat4.multiply(wgpuMatrix.mat4.translation(translation), modelMatrix, modelMatrix);

        const viewMatrix = wgpuMatrix.mat4.translation([-viewport.position[0], -viewport.position[1], 0]);

        const gameWidth = viewport.width / viewport.zoom
        const gameHeight = viewport.height / viewport.zoom
        //                         left          right    bottom        top     near     far
        const projectionMatrix = wgpuMatrix.mat4.ortho(0, gameWidth, gameHeight, 0, -10.0, 10.0)

        const mvpMatrix = wgpuMatrix.mat4.identity();
        wgpuMatrix.mat4.multiply(viewMatrix, modelMatrix, mvpMatrix);
        wgpuMatrix.mat4.multiply(projectionMatrix, mvpMatrix, mvpMatrix);

        this.device.queue.writeBuffer(this.uniformsBuffer, 0, mvpMatrix);
    }

    public getView(): GPUTextureView {
        if (!this.textureView) {
            this.textureView = this.texture.createView({ label: "DisplacementTexture view" });
        }
        return this.textureView;
    }

    public destroy(): void {
        this.texture.destroy();
        this.uniformsBuffer.destroy();
    }

    private createTexture(width: number, height: number): GPUTexture {
        this.textureView = null;
        return this.device.createTexture({
            label: "DisplacementTexture texture",
            size: [width, height],
            format: this.format,
            usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.RENDER_ATTACHMENT,
        });
    }
}

export {
    DisplacementTexture,
};
