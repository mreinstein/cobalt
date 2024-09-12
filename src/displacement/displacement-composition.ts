/// <reference types="@webgpu/types"/>

import { DisplacementParametersBuffer } from "./displacement-parameters-buffer";

type Parameters = {
    readonly device: GPUDevice;
    readonly targetFormat: GPUTextureFormat;

    readonly colorTextureView: GPUTextureView;
    readonly noiseMapTextureView: GPUTextureView;
    readonly displacementTextureView: GPUTextureView;

    readonly displacementParametersBuffer: DisplacementParametersBuffer;
};

class DisplacementComposition {
    private readonly device: GPUDevice;
    private readonly targetFormat: GPUTextureFormat;
    private readonly renderPipeline: GPURenderPipeline;

    private readonly colorSampler: GPUSampler;
    private readonly noiseSampler: GPUSampler;

    private readonly displacementParametersBuffer: DisplacementParametersBuffer;

    private renderBundle: GPURenderBundle | null = null;

    private colorTextureView: GPUTextureView;
    private noiseMapTextureView: GPUTextureView;
    private displacementTextureView: GPUTextureView;

    public constructor(params: Parameters) {
        this.device = params.device;

        this.targetFormat = params.targetFormat;
        this.colorTextureView = params.colorTextureView;
        this.noiseMapTextureView = params.noiseMapTextureView;
        this.displacementTextureView = params.displacementTextureView;

        this.displacementParametersBuffer = params.displacementParametersBuffer;

        const shaderModule = this.device.createShaderModule({
            label: "DisplacementComposition shader module",
            code: `
struct DisplacementParameters {  //            align(16) size(16)
    offset: vec2<f32>,           // offset(0)  align(8)  size(8)
    scale: f32,                  // offset(8)  align(4)  size(4)
};

@group(0) @binding(0) var<uniform> uniforms: DisplacementParameters;
@group(0) @binding(1) var colorTexture: texture_2d<f32>;
@group(0) @binding(2) var colorSampler: sampler;
@group(0) @binding(3) var noiseTexture: texture_2d<f32>;
@group(0) @binding(4) var noiseSampler: sampler;
@group(0) @binding(5) var displacementTexture: texture_2d<f32>;

struct VertexIn {
    @builtin(vertex_index) vertexIndex: u32,
};

struct VertexOut {
    @builtin(position) position: vec4<f32>,
    @location(0) uv: vec2<f32>,
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
    out.position = vec4<f32>(screenPosition, 0, 1);
    out.uv = (0.5 + 0.5 * screenPosition * vec2<f32>(1, -1));
    return out;
}

struct FragmentOut {
    @location(0) color: vec4<f32>,
};

@fragment
fn main_fragment(in: VertexOut) -> FragmentOut {
    let noiseTextureDimensions = vec2<f32>(textureDimensions(noiseTexture, 0));
    let noiseUv = in.uv + uniforms.offset / noiseTextureDimensions;
    var noise = textureSample(noiseTexture, noiseSampler, noiseUv).rg;
    noise -= 0.5;
    noise *= uniforms.scale / noiseTextureDimensions;

    let displacement = textureSample(displacementTexture, colorSampler, in.uv).r;
    noise *= displacement;

    let colorUv = in.uv + noise;

    var out: FragmentOut;
    out.color = textureSample(colorTexture, colorSampler, colorUv);
    return out;
}
            `,
        });

        this.renderPipeline = this.device.createRenderPipeline({
            label: "DisplacementComposition renderpipeline",
            layout: "auto",
            vertex: {
                module: shaderModule,
                entryPoint: "main_vertex",
            },
            fragment: {
                module: shaderModule,
                entryPoint: "main_fragment",
                targets: [{
                    format: params.targetFormat,
                }],
            },
            primitive: {
                cullMode: "none",
                topology: "triangle-strip",
            },
        });

        this.noiseSampler = this.device.createSampler({
            label: "DisplacementComposition noisesampler",
            addressModeU: "repeat",
            addressModeV: "repeat",
            addressModeW: "repeat",
            magFilter: "linear",
            minFilter: "linear",
            mipmapFilter: "linear",
        });

        this.colorSampler = this.device.createSampler({
            label: "DisplacementComposition colorSampler",
            addressModeU: "clamp-to-edge",
            addressModeV: "clamp-to-edge",
            addressModeW: "clamp-to-edge",
            magFilter: "linear",
            minFilter: "linear",
            mipmapFilter: "linear",
        });
    }

    public getRenderBundle(): GPURenderBundle {
        if (!this.renderBundle) {
            this.renderBundle = this.buildRenderBundle();
        }
        return this.renderBundle;
    }

    public destroy(): void {
        // nothing to do
    }

    public setColorTextureView(textureView: GPUTextureView): void {
        this.colorTextureView = textureView;
        this.renderBundle = null;
    }

    public setNoiseMapTextureView(textureView: GPUTextureView): void {
        this.noiseMapTextureView = textureView;
        this.renderBundle = null;
    }

    public setDisplacementTextureView(textureView: GPUTextureView): void {
        this.displacementTextureView = textureView;
        this.renderBundle = null;
    }

    private buildRenderBundle(): GPURenderBundle {
        const bindgroup = this.device.createBindGroup({
            label: "DisplacementComposition bindgroup 0",
            layout: this.renderPipeline.getBindGroupLayout(0),
            entries: [
                {
                    binding: 0,
                    resource: { buffer: this.displacementParametersBuffer.bufferGpu },
                },
                {
                    binding: 1,
                    resource: this.colorTextureView,
                },
                {
                    binding: 2,
                    resource: this.colorSampler,
                },
                {
                    binding: 3,
                    resource: this.noiseMapTextureView,
                },
                {
                    binding: 4,
                    resource: this.noiseSampler,
                },
                {
                    binding: 5,
                    resource: this.displacementTextureView,
                },
            ],
        });

        const renderBundleEncoder = this.device.createRenderBundleEncoder({
            label: "DisplacementComposition renderbundle encoder",
            colorFormats: [this.targetFormat],
        });
        renderBundleEncoder.setPipeline(this.renderPipeline);
        renderBundleEncoder.setBindGroup(0, bindgroup);
        renderBundleEncoder.draw(4);
        return renderBundleEncoder.finish({ label: "DisplacementComposition renderbundle" });
    }
}

export {
    DisplacementComposition
};

