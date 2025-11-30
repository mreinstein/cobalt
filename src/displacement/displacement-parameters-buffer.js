class DisplacementParametersBuffer {
    device;
    bufferGpu;
    needsUpdate = true;
    constructor(params) {
        this.device = params.device;
        this.bufferGpu = this.device.createBuffer({
            label: "DisplacementParametersBuffer buffer",
            size: 16,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        });
        this.setParameters(params.initialParameters);
    }
    setParameters(params) {
        this.device.queue.writeBuffer(this.bufferGpu, 0, new Float32Array([params.offsetX, params.offsetY, params.scale]));
    }
    destroy() {
        this.bufferGpu.destroy();
    }
}
export { DisplacementParametersBuffer };
