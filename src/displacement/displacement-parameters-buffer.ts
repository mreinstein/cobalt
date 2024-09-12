/// <reference types="@webgpu/types"/>

type DisplacementParameters = {
    readonly offsetX: number;
    readonly offsetY: number;
    readonly scale: number;
};

type Parameters = {
    readonly device: GPUDevice;
    readonly initialParameters: DisplacementParameters;
};

class DisplacementParametersBuffer {
    private readonly device: GPUDevice;

    public readonly bufferGpu: GPUBuffer;
    private needsUpdate: boolean = true;

    public constructor(params: Parameters) {
        this.device = params.device;

        this.bufferGpu = this.device.createBuffer({
            label: "DisplacementParametersBuffer buffer",
            size: 16,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        });

        this.setParameters(params.initialParameters);
    }

    public setParameters(params: DisplacementParameters): void {
        this.device.queue.writeBuffer(this.bufferGpu, 0, new Float32Array([params.offsetX, params.offsetY, params.scale]));
    }

    public destroy(): void {
        this.bufferGpu.destroy();
    }
}

export {
    DisplacementParametersBuffer
};

