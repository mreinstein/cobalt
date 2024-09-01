/// <reference types="@webgpu/types"/>

import { type LightsBuffer } from "../lights-buffer";
import { LightsTextureInitializer } from "./lights-texture-initializer";

type ILightsTexture = {
    // readonly texture: GPUTexture;
    readonly gridSize: { readonly x: number, readonly y: number };
    readonly format: GPUTextureFormat;
    readonly sampleCount: number;
};

type LightsTextureProperties = {
    readonly resolutionPerLight: number;
    readonly maxLightSize: number;
    readonly antialiased: boolean;
    readonly filtering: GPUFilterMode;
};

class LightsTexture {
    private readonly lightsBuffer: LightsBuffer;

    public readonly texture: GPUTexture;
    public readonly gridSize: { readonly x: number, readonly y: number };

    private readonly textureMultisampled: GPUTexture | null = null;
    private readonly textureRenderpassDescriptor: GPURenderPassDescriptor;

    private readonly textureInitializer: LightsTextureInitializer;

    public constructor(device: GPUDevice, /*targetTextureFormat: GPUTextureFormat,*/ lightsBuffer: LightsBuffer, lightsTextureProperties: LightsTextureProperties) {
        this.lightsBuffer = lightsBuffer;

        const cellsCount = this.lightsBuffer.maxLightsCount / 4;
        const gridSize = {
            x: Math.ceil(Math.sqrt(cellsCount)),
            y: 0,
        };
        gridSize.y = Math.ceil(cellsCount / gridSize.x);
        this.gridSize = gridSize;

        const lightTextureSize = {
            width: gridSize.x * lightsTextureProperties.resolutionPerLight,
            height: gridSize.y * lightsTextureProperties.resolutionPerLight,
        };

        const format = "rgba8unorm";
        this.texture = device.createTexture({
            label: "LightsTextureMask texture",
            size: [lightTextureSize.width, lightTextureSize.height],
            format,
            usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.RENDER_ATTACHMENT,
        });
        // this.textureViewer = new TextureViewer(device, targetTextureFormat, this.texture);

        if (lightsTextureProperties.antialiased) {
            this.textureMultisampled = device.createTexture({
                label: "LightsTextureMask texture multisampled",
                size: [lightTextureSize.width, lightTextureSize.height],
                format,
                usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.RENDER_ATTACHMENT,
                sampleCount: 4,
            });
        }

        const textureToRenderTo = this.textureMultisampled ?? this.texture;

        const textureRenderpassColorAttachment: GPURenderPassColorAttachment = {
            view: textureToRenderTo.createView(),
            clearValue: [0, 0, 0, 1],
            loadOp: "load",
            storeOp: "store",
        };
        if (lightsTextureProperties.antialiased) {
            textureRenderpassColorAttachment.resolveTarget = this.texture.createView();
        }
        this.textureRenderpassDescriptor = {
            label: "lights-renderer render to texture renderpass",
            colorAttachments: [textureRenderpassColorAttachment],
        };

        const lightsTexture: ILightsTexture = {
            gridSize,
            format,
            sampleCount: this.textureMultisampled?.sampleCount ?? 1,
        };
        this.textureInitializer = new LightsTextureInitializer(device, lightsBuffer, lightsTexture, lightsTextureProperties.maxLightSize);
    }

    public update(commandEncoder: GPUCommandEncoder): void {
        const renderpassEncoder = commandEncoder.beginRenderPass(this.textureRenderpassDescriptor);
        const [textureWidth, textureHeight] = [this.texture.width, this.texture.height];
        renderpassEncoder.setViewport(0, 0, textureWidth, textureHeight, 0, 1);
        renderpassEncoder.setScissorRect(0, 0, textureWidth, textureHeight);
        renderpassEncoder.executeBundles([
            this.textureInitializer.getRenderBundle(),
        ]);
        renderpassEncoder.end();
    }
}

export {
    LightsTexture, type ILightsTexture, type LightsTextureProperties
};

