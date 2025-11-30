import { LightsTextureInitializer } from "./lights-texture-initializer.js";
import { LightsTextureMask } from "./lights-texture-mask.js";

class LightsTexture {
    lightsBuffer;
    texture;
    gridSize;
    textureMultisampled = null;
    textureRenderpassDescriptor;
    textureInitializer;
    textureMask;
    constructor(device, lightsBuffer, lightsTextureProperties) {
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
        const format = lightsTextureProperties.textureFormat;
        this.texture = device.createTexture({
            label: "LightsTextureMask texture",
            size: [lightTextureSize.width, lightTextureSize.height],
            format,
            usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.RENDER_ATTACHMENT,
        });
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
        const textureRenderpassColorAttachment = {
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
        const lightsTexture = {
            gridSize,
            format,
            sampleCount: this.textureMultisampled?.sampleCount ?? 1,
        };
        this.textureInitializer = new LightsTextureInitializer(device, lightsBuffer, lightsTexture, lightsTextureProperties.maxLightSize);
        this.textureMask = new LightsTextureMask(device, lightsBuffer, lightsTexture, lightsTextureProperties.maxLightSize);
    }
    update(commandEncoder) {
        this.textureMask.setLightsCount(this.lightsBuffer.lightsCount);
        const renderpassEncoder = commandEncoder.beginRenderPass(this.textureRenderpassDescriptor);
        const [textureWidth, textureHeight] = [this.texture.width, this.texture.height];
        renderpassEncoder.setViewport(0, 0, textureWidth, textureHeight, 0, 1);
        renderpassEncoder.setScissorRect(0, 0, textureWidth, textureHeight);
        renderpassEncoder.executeBundles([
            this.textureInitializer.getRenderBundle(),
            this.textureMask.getRenderBundle(),
        ]);
        renderpassEncoder.end();
    }
    setObstacles(segments) {
        this.textureMask.setObstacles(segments);
    }
    destroy() {
        this.texture.destroy();
        this.textureMultisampled?.destroy();
        this.textureInitializer.destroy();
        this.textureMask.destroy();
    }
}
export { LightsTexture };
