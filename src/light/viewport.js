import * as wgpuMatrix from "wgpu-matrix";

class Viewport {
    invViewProjectionMatrix = wgpuMatrix.mat4.identity();
    viewportSize = { width: 1, height: 1 };
    topLeft = [0, 0];
    zoom = 1;
    constructor(params) {
        this.setViewportSize(params.viewportSize.width, params.viewportSize.height);
        const initialTopLeft = params.center ?? this.topLeft;
        this.setTopLeft(...initialTopLeft);
        const initialZoom = params.zoom ?? 1;
        this.setZoom(initialZoom);
    }
    get invertViewProjectionMatrix() {
        return this.invViewProjectionMatrix;
    }
    setViewportSize(width, height) {
        this.viewportSize.width = width;
        this.viewportSize.height = height;
        this.updateMatrices();
    }
    setTopLeft(x, y) {
        this.topLeft[0] = x;
        this.topLeft[1] = y;
        this.updateMatrices();
    }
    setZoom(zoom) {
        this.zoom = zoom;
        this.updateMatrices();
    }
    updateMatrices() {
        wgpuMatrix.mat4.identity(this.invViewProjectionMatrix);
        wgpuMatrix.mat4.multiply(wgpuMatrix.mat4.scaling([1, -1, 0]), this.invViewProjectionMatrix, this.invViewProjectionMatrix);
        wgpuMatrix.mat4.multiply(wgpuMatrix.mat4.translation([1, 1, 0]), this.invViewProjectionMatrix, this.invViewProjectionMatrix);
        wgpuMatrix.mat4.multiply(wgpuMatrix.mat4.scaling([0.5 * this.viewportSize.width / this.zoom, 0.5 * this.viewportSize.height / this.zoom, 0]), this.invViewProjectionMatrix, this.invViewProjectionMatrix);
        wgpuMatrix.mat4.multiply(wgpuMatrix.mat4.translation([this.topLeft[0], this.topLeft[1], 0]), this.invViewProjectionMatrix, this.invViewProjectionMatrix);
    }
}
export { Viewport };
