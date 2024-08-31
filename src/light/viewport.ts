import * as wgpuMatrix from "wgpu-matrix";
import { type Point } from "./types";

type Parameters = {
    readonly canvasSize: {
        width: number;
        height: number;
    };
    readonly center?: Point;
    readonly zoom?: number;
};

class Viewport {
    private readonly vMatrix: wgpuMatrix.Mat4Arg = wgpuMatrix.mat4.create();

    private readonly center: Point = [0, 0];
    private zoom: number = 1;
    private aspectRatio: number = 1;

    public constructor(params: Parameters) {
        this.setCanvasSize(params.canvasSize.width, params.canvasSize.height);

        const initialCenter = params.center ?? this.center;
        this.setCenter(...initialCenter);

        const initialZoom = params.zoom ?? 1;
        this.setZoom(initialZoom);
    }

    public get viewMatrix(): wgpuMatrix.Mat4Arg {
        return this.vMatrix;
    }

    public get invertViewMatrix(): wgpuMatrix.Mat4Arg {
        return wgpuMatrix.mat4.inverse(this.vMatrix);
    }

    public setCanvasSize(width: number, height: number): void {
        this.aspectRatio = width / height;
        this.updateViewMatrix();
    }

    public setCenter(x: number, y: number): void {
        this.center[0] = x;
        this.center[1] = y;
        this.updateViewMatrix();
    }

    public setZoom(zoom: number): void {
        this.zoom = zoom;
        this.updateViewMatrix();
    }

    public viewportToWorld(position: Readonly<Point>): Point {
        const result = wgpuMatrix.vec4.transformMat4([...position, 0, 1], this.invertViewMatrix);
        return [
            result[0]! / result[3]!,
            result[1]! / result[3]!,
        ];
    }

    private updateViewMatrix(): void {
        wgpuMatrix.mat4.identity(this.vMatrix);
        wgpuMatrix.mat4.scale(this.vMatrix, [this.zoom / this.aspectRatio, this.zoom, 1], this.vMatrix);
        wgpuMatrix.mat4.translate(this.vMatrix, [-this.center[0], -this.center[1], 0], this.vMatrix);
    }
}

export {
    Viewport
};

