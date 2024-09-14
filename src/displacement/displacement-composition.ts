/// <reference types="@webgpu/types"/>

import { DisplacementParametersBuffer } from "./displacement-parameters-buffer";
import compositionWGSL from "./composition.wgsl"

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
            code: compositionWGSL,
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

