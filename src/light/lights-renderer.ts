/// <reference types="@webgpu/types"/>

import * as wgpuMatrix from "wgpu-matrix";
import { LightsBuffer } from "./lights-buffer";

type TextureSamplable = {
    readonly view: GPUTextureView;
    readonly sampler: GPUSampler;
};

type TextureRenderable = {
    readonly format: GPUTextureFormat;
};

type Parameters = {
    readonly device: GPUDevice;
    readonly albedo: TextureSamplable;
    readonly targetTexture: TextureRenderable;
    readonly lightsBuffer: LightsBuffer;
    readonly maxLightSize: number;
};

class LightsRenderer {
    private readonly device: GPUDevice;

    private readonly targetTexture: TextureRenderable;

    private readonly renderPipeline: GPURenderPipeline;
    private readonly uniformsBufferGpu: GPUBuffer;
    private readonly bindgroup0: GPUBindGroup;
    private bindgroup1: GPUBindGroup;
    private renderBundle: GPURenderBundle;

    private readonly lightsBuffer: LightsBuffer;

    public constructor(params: Parameters) {
        this.device = params.device;

        this.targetTexture = params.targetTexture;
        this.lightsBuffer = params.lightsBuffer;

        this.uniformsBufferGpu = params.device.createBuffer({
            label: "LightsRenderer uniforms buffer",
            size: 64,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        });

        const shaderModule = params.device.createShaderModule({
            label: "LightsRenderer shader module",
            code: `
struct Uniforms {                  //           align(16) size(64)
    invertViewMatrix: mat4x4<f32>, // offset(0) align(16) size(64)
};

${LightsBuffer.structs.definition}

@group(0) @binding(0) var<uniform> uniforms: Uniforms;
@group(0) @binding(1) var<storage,read> lightsBuffer: LightsBuffer;
@group(1) @binding(0) var albedoTexture: texture_2d<f32>;
@group(1) @binding(1) var albedoSampler: sampler;

struct VertexIn {
    @builtin(vertex_index) vertexIndex: u32,
};

struct VertexOut {
    @builtin(position) position: vec4<f32>,
    @location(0) worldPosition: vec2<f32>,
    @location(1) uv: vec2<f32>,
};

@vertex
fn main_vertex(in: VertexIn) -> VertexOut {
    const corners = array<vec2<f32>, 4>(
        vec2<f32>(-1, -1),
        vec2<f32>(1, -1),
        vec2<f32>(-1, 1),
        vec2<f32>(1, 1),
    );
    let screenPosition = corners[in.vertexIndex];

    var out: VertexOut;
    out.position = vec4<f32>(screenPosition, 0.0, 1.0);
    out.worldPosition = (uniforms.invertViewMatrix * out.position).xy;
    out.uv = 0.5 + 0.5 * screenPosition * vec2<f32>(1.0, -1.0);
    return out;
}

struct FragmentOut {
    @location(0) color: vec4<f32>,
};

fn compute_lights(worldPosition: vec2<f32>) -> vec3<f32> {
    const ambiant = vec3<f32>(0.2);
    var color = vec3<f32>(ambiant);

    const maxUvDistance = 1.0;

    let lightsCount = lightsBuffer.count;
    for (var iLight = 0u; iLight < lightsCount; iLight++) {
        let light = lightsBuffer.lights[iLight];
        let lightSize = f32(${params.maxLightSize});
        let relativePosition = (worldPosition - light.position) / lightSize;
        if (max(abs(relativePosition.x), abs(relativePosition.y)) < maxUvDistance) {
            let lightIntensity = 1.0;
            color += lightIntensity * light.color;
        }
    }

    return color;
}

@fragment
fn main_fragment(in: VertexOut) -> FragmentOut {
    let light = compute_lights(in.worldPosition);
    let albedo = textureSample(albedoTexture, albedoSampler, in.uv);
    let color = albedo.rgb * light;

    var out: FragmentOut;
    out.color = vec4<f32>(color, 1.0);
    return out;
}
            `,
        });

        this.renderPipeline = params.device.createRenderPipeline({
            label: "LightsRenderer renderpipeline",
            layout: "auto",
            vertex: {
                module: shaderModule,
                entryPoint: "main_vertex",
            },
            fragment: {
                module: shaderModule,
                entryPoint: "main_fragment",
                targets: [{
                    format: this.targetTexture.format,
                }],
            },
            primitive: {
                cullMode: "none",
                topology: "triangle-strip",
            },
        });

        const bindgroupLayout = this.renderPipeline.getBindGroupLayout(0);

        this.bindgroup0 = params.device.createBindGroup({
            label: "LightsRenderer bindgroup 0",
            layout: bindgroupLayout,
            entries: [
                {
                    binding: 0,
                    resource: { buffer: this.uniformsBufferGpu },
                },
                {
                    binding: 1,
                    resource: { buffer: this.lightsBuffer.gpuBuffer },
                },
            ]
        });

        this.bindgroup1 = this.buildBindgroup1(params.albedo);
        this.renderBundle = this.buildRenderBundle();
    }

    public render(renderpassEncoder: GPURenderPassEncoder, viewMatrix: wgpuMatrix.Mat4Arg): void {
        const invertViewMatrix = wgpuMatrix.mat4.inverse(viewMatrix);
        this.device.queue.writeBuffer(this.uniformsBufferGpu, 0, invertViewMatrix);

        renderpassEncoder.executeBundles([this.renderBundle]);
    }

    public setAlbedo(albedo: TextureSamplable): void {
        this.bindgroup1 = this.buildBindgroup1(albedo);
        this.renderBundle = this.buildRenderBundle();
    }

    private buildBindgroup1(albedo: TextureSamplable): GPUBindGroup {
        return this.device.createBindGroup({
            label: "LightsRenderer bindgroup 1",
            layout: this.renderPipeline.getBindGroupLayout(1),
            entries: [
                {
                    binding: 0,
                    resource: albedo.view,
                },
                {
                    binding: 1,
                    resource: albedo.sampler,
                },
            ]
        });
    }

    private buildRenderBundle(): GPURenderBundle {
        const renderBundleEncoder = this.device.createRenderBundleEncoder({
            label: "LightsRenderer renderbundle encoder",
            colorFormats: [this.targetTexture.format],
        });
        renderBundleEncoder.setPipeline(this.renderPipeline);
        renderBundleEncoder.setBindGroup(0, this.bindgroup0);
        renderBundleEncoder.setBindGroup(1, this.bindgroup1);
        renderBundleEncoder.draw(4);
        return renderBundleEncoder.finish({ label: "LightsRenderer renderbundle" });
    }
}

export {
    LightsRenderer
};

