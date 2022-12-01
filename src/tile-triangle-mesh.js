export default function createTileTriangleMesh (device) {

    const vertices = new Float32Array([
       //x   y  u  v  
        -1, -1, 0, 1,
         1, -1, 1, 1,
         1,  1, 1, 0,

       // triangle 2 (2nd half of quad)
        -1, -1, 0, 1,
         1,  1, 1, 0,
        -1,  1, 0, 0
    ])

    const usage = GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST

    const descriptor = {
        size: vertices.byteLength,
        usage,
        // make this memory space accessible from the CPU (host visible)
        mappedAtCreation: true
    }

    const buffer = device.createBuffer(descriptor)
    new Float32Array(buffer.getMappedRange()).set(vertices)
    buffer.unmap()

    const bufferLayout = {
        arrayStride: 16,
        attributes: [
            {
                shaderLocation: 0,
                format: 'float32x2',
                offset: 0
            },
            {
                shaderLocation: 1,
                format: 'float32x2',
                offset: 8
            }
        ]
    }

    return {
        buffer,
        bufferLayout,
    }
}
