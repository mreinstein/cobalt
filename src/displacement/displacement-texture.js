import displacementWGSL from './displacement.wgsl';
import * as wgpuMatrix from "wgpu-matrix";

class DisplacementTexture {
    device;
    format = "r8unorm";
    downsizeFactor;
    multisample;
    textureSimple;
    textureMultisampled = null;
    renderPipeline;
    bindgroup;
    uniformsBuffer;
    trianglesBuffer;
    constructor(params) {
        this.device = params.device;
        this.downsizeFactor = params.blurFactor;
        this.multisample = this.downsizeFactor > 1 ? 4 : 1;
        [this.textureSimple, this.textureMultisampled] = this.createTextures(params.width, params.height);
        this.trianglesBuffer = params.trianglesBuffer;
        const shaderModule = this.device.createShaderModule({
            label: "DisplacementTexture shader module",
            code: displacementWGSL,
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
            multisample: {
                count: this.multisample,
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
    update(commandEncoder) {
        const targetTexture = this.textureMultisampled ?? this.textureSimple;
        const textureRenderpassColorAttachment = {
            view: targetTexture.view,
            clearValue: [0, 0, 0, 1],
            loadOp: "clear",
            storeOp: "store",
        };
        if (this.textureMultisampled) {
            textureRenderpassColorAttachment.resolveTarget = this.textureSimple.view;
        }
        const renderpassEncoder = commandEncoder.beginRenderPass({
            label: "DisplacementTexture render to texture renderpass",
            colorAttachments: [textureRenderpassColorAttachment],
        });
        const [textureWidth, textureHeight] = [targetTexture.texture.width, targetTexture.texture.height];
        renderpassEncoder.setViewport(0, 0, textureWidth, textureHeight, 0, 1);
        renderpassEncoder.setScissorRect(0, 0, textureWidth, textureHeight);
        renderpassEncoder.setPipeline(this.renderPipeline);
        renderpassEncoder.setBindGroup(0, this.bindgroup);
        renderpassEncoder.setVertexBuffer(0, this.trianglesBuffer.bufferGpu);
        renderpassEncoder.draw(3 * this.trianglesBuffer.spriteCount);
        renderpassEncoder.end();
    }
    ;
    resize(width, height) {
        this.textureSimple.texture.destroy();
        this.textureMultisampled?.texture.destroy();
        [this.textureSimple, this.textureMultisampled] = this.createTextures(width, height);
    }
    setViewport(viewport) {
        const scaling = [1, 1, 1];
        const rotation = 0;
        const translation = [1, 1, 0];
        const modelMatrix = wgpuMatrix.mat4.identity();
        wgpuMatrix.mat4.multiply(wgpuMatrix.mat4.scaling(scaling), modelMatrix, modelMatrix);
        wgpuMatrix.mat4.multiply(wgpuMatrix.mat4.rotationZ(rotation), modelMatrix, modelMatrix);
        wgpuMatrix.mat4.multiply(wgpuMatrix.mat4.translation(translation), modelMatrix, modelMatrix);
        const viewMatrix = wgpuMatrix.mat4.translation([-viewport.position[0], -viewport.position[1], 0]);
        const gameWidth = viewport.width / viewport.zoom;
        const gameHeight = viewport.height / viewport.zoom;
        //                         left          right    bottom        top     near     far
        const projectionMatrix = wgpuMatrix.mat4.ortho(0, gameWidth, gameHeight, 0, -10.0, 10.0);
        const mvpMatrix = wgpuMatrix.mat4.identity();
        wgpuMatrix.mat4.multiply(viewMatrix, modelMatrix, mvpMatrix);
        wgpuMatrix.mat4.multiply(projectionMatrix, mvpMatrix, mvpMatrix);
        this.device.queue.writeBuffer(this.uniformsBuffer, 0, mvpMatrix);
    }
    getView() {
        return this.textureSimple.view;
    }
    destroy() {
        this.textureSimple.texture.destroy();
        this.textureMultisampled?.texture.destroy();
        this.uniformsBuffer.destroy();
    }
    createTextures(width, height) {
        const texture = this.device.createTexture({
            label: "DisplacementTexture texture",
            size: [
                Math.ceil(width / this.downsizeFactor),
                Math.ceil(height / this.downsizeFactor),
            ],
            format: this.format,
            usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.RENDER_ATTACHMENT,
        });
        const textureSimple = {
            texture,
            view: texture.createView({ label: "DisplacementTexture texture view" }),
        };
        let textureMultisampled = null;
        if (this.multisample > 1) {
            const textureMulti = this.device.createTexture({
                label: "DisplacementTexture texture multisampled",
                size: [texture.width, texture.height],
                format: texture.format,
                usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.RENDER_ATTACHMENT,
                sampleCount: this.multisample,
            });
            textureMultisampled = {
                texture: textureMulti,
                view: textureMulti.createView({ label: "DisplacementTexture texture multisampled view" }),
            };
        }
        return [textureSimple, textureMultisampled];
    }
}
export { DisplacementTexture };
