import * as wgpuMatrix from "wgpu-matrix";
import { type Point } from "./types";

type Parameters = {
    readonly viewportSize: {
        width: number;
        height: number;
    };
    readonly center?: Point;
    readonly zoom?: number;
};

class Viewport {
    private readonly invViewProjectionMatrix: wgpuMatrix.Mat4Arg = wgpuMatrix.mat4.identity();

    private readonly viewportSize = { width: 1, height: 1 };
    private readonly topLeft: Point = [0, 0];
    private zoom: number = 1;

    public constructor(params: Parameters) {
        this.setViewportSize(params.viewportSize.width, params.viewportSize.height);

        const initialTopLeft = params.center ?? this.topLeft;
        this.setTopLeft(...initialTopLeft);

        const initialZoom = params.zoom ?? 1;
        this.setZoom(initialZoom);
    }

    public get invertViewProjectionMatrix(): wgpuMatrix.Mat4Arg {
        return this.invViewProjectionMatrix;
    }

    public setViewportSize(width: number, height: number): void {
        this.viewportSize.width = width;
        this.viewportSize.height = height;
        this.updateMatrices();
    }

    public setTopLeft(x: number, y: number): void {
        this.topLeft[0] = x;
        this.topLeft[1] = y;
        this.updateMatrices();
    }

    public setZoom(zoom: number): void {
        this.zoom = zoom;
        this.updateMatrices();
    }

    private updateMatrices(): void {
        wgpuMatrix.mat4.identity(this.invViewProjectionMatrix);
        wgpuMatrix.mat4.multiply(wgpuMatrix.mat4.scaling([1, -1, 0]), this.invViewProjectionMatrix, this.invViewProjectionMatrix);
        wgpuMatrix.mat4.multiply(wgpuMatrix.mat4.translation([1, 1, 0]), this.invViewProjectionMatrix, this.invViewProjectionMatrix);
        wgpuMatrix.mat4.multiply(wgpuMatrix.mat4.scaling([0.5 * this.viewportSize.width / this.zoom, 0.5 * this.viewportSize.height / this.zoom, 0]), this.invViewProjectionMatrix, this.invViewProjectionMatrix);
        wgpuMatrix.mat4.multiply(wgpuMatrix.mat4.translation([this.topLeft[0], this.topLeft[1], 0]), this.invViewProjectionMatrix, this.invViewProjectionMatrix);
    }
}

export {
    Viewport
};

