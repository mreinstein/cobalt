import compositionWGSL from "./composition.wgsl";

class DisplacementComposition {
    device;
    targetFormat;
    renderPipeline;
    colorSampler;
    noiseSampler;
    displacementParametersBuffer;
    renderBundle = null;
    colorTextureView;
    noiseMapTextureView;
    displacementTextureView;
    constructor(params) {
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
    getRenderBundle() {
        if (!this.renderBundle) {
            this.renderBundle = this.buildRenderBundle();
        }
        return this.renderBundle;
    }
    destroy() {
        // nothing to do
    }
    setColorTextureView(textureView) {
        this.colorTextureView = textureView;
        this.renderBundle = null;
    }
    setNoiseMapTextureView(textureView) {
        this.noiseMapTextureView = textureView;
        this.renderBundle = null;
    }
    setDisplacementTextureView(textureView) {
        this.displacementTextureView = textureView;
        this.renderBundle = null;
    }
    buildRenderBundle() {
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
export { DisplacementComposition };
