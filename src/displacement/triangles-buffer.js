import uuid from '../uuid.js';

class TrianglesBuffer {
    device;
    floatsPerSprite = 6; // vec2(translate) + vec2(scale) + rotation + opacity 
    bufferGpu;
    bufferNeedsUpdate = false;
    sprites = new Map();
    get spriteCount() {
        return this.sprites.size;
    }
    constructor(params) {
        this.device = params.device;
        this.bufferGpu = this.device.createBuffer({
            size: params.maxSpriteCount * this.floatsPerSprite * Float32Array.BYTES_PER_ELEMENT,
            usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
        });
    }
    destroy() {
        this.bufferGpu.destroy;
    }
    update() {
        if (this.bufferNeedsUpdate) {
            const bufferData = [];
            for (const sprite of this.sprites.values()) {
                bufferData.push(...sprite);
            }
            ;
            const buffer = new Float32Array(bufferData);
            this.device.queue.writeBuffer(this.bufferGpu, 0, buffer);
        }
    }
    addTriangle(triangleVertices) {
        const triangleId = uuid();
        if (this.sprites.has(triangleId)) {
            throw new Error(`Duplicate triangle "${triangleId}".`);
        }
        const triangleData = this.buildTriangleData(triangleVertices);
        this.sprites.set(triangleId, triangleData);
        this.bufferNeedsUpdate = true;
        return triangleId;
    }
    removeTriangle(triangleId) {
        if (!this.sprites.has(triangleId)) {
            throw new Error(`Unknown triangle "${triangleId}".`);
        }
        this.sprites.delete(triangleId);
        this.bufferNeedsUpdate = true;
    }
    setTriangle(triangleId, triangleVertices) {
        if (!this.sprites.has(triangleId)) {
            throw new Error(`Unknown triangle "${triangleId}".`);
        }
        const triangleData = this.buildTriangleData(triangleVertices);
        this.sprites.set(triangleId, triangleData);
        this.bufferNeedsUpdate = true;
    }
    buildTriangleData(triangleVertices) {
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
export { TrianglesBuffer };
