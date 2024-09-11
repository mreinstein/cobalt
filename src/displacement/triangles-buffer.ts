/// <reference types="@webgpu/types"/>

import uuid from '../uuid.js'

type Parameters = {
    readonly device: GPUDevice;
    readonly maxSpriteCount: number;
};

type Point = [number, number];
type TriangleVertices = [Point, Point, Point];
type TriangleData = [number, number, number, number, number, number];

class TrianglesBuffer {
    private readonly device: GPUDevice;

    private readonly floatsPerSprite = 6;  // vec2(translate) + vec2(scale) + rotation + opacity 
    public readonly bufferGpu: GPUBuffer;
    private bufferNeedsUpdate: boolean = false;

    private readonly sprites: Map<number, TriangleData> = new Map();
    public get spriteCount(): number {
        return this.sprites.size;
    }

    public constructor(params: Parameters) {
        this.device = params.device;

        this.bufferGpu = this.device.createBuffer({
            size: params.maxSpriteCount * this.floatsPerSprite * Float32Array.BYTES_PER_ELEMENT,
            usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
        });
    }

    public destroy(): void {
        this.bufferGpu.destroy;
    }

    public update(): void {
        if (this.bufferNeedsUpdate) {
            const bufferData: number[] = [];
            for (const sprite of this.sprites.values()) {
                bufferData.push(...sprite);
            };
            const buffer = new Float32Array(bufferData);
            this.device.queue.writeBuffer(this.bufferGpu, 0, buffer);
        }
    }

    public addTriangle(triangleVertices: TriangleVertices): number {
        const triangleId = uuid();
        if (this.sprites.has(triangleId)) {
            throw new Error(`Duplicate triangle "${triangleId}".`);
        }

        const triangleData = this.buildTriangleData(triangleVertices);
        this.sprites.set(triangleId, triangleData);
        this.bufferNeedsUpdate = true;

        return triangleId;
    }

    public removeTriangle(triangleId: number): void {
        if (!this.sprites.has(triangleId)) {
            throw new Error(`Unknown triangle "${triangleId}".`);
        }
        this.sprites.delete(triangleId);
        this.bufferNeedsUpdate = true;
    }

    public setTriangle(triangleId: number, triangleVertices: TriangleVertices): void {
        if (!this.sprites.has(triangleId)) {
            throw new Error(`Unknown triangle "${triangleId}".`);
        }
        const triangleData = this.buildTriangleData(triangleVertices);
        this.sprites.set(triangleId, triangleData);
        this.bufferNeedsUpdate = true;
    }

    private buildTriangleData(triangleVertices: TriangleVertices): TriangleData {
        return [
            triangleVertices[0][0],
            triangleVertices[0][1],
            triangleVertices[1][0],
            triangleVertices[1][1],
            triangleVertices[2][0],
            triangleVertices[2][1],
        ];
    }
}

export {
    TrianglesBuffer
};

