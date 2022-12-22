export default function createSpriteQuads (device, spritesheet) {

    // u,v coordinates specify top left as 0,0  bottom right as 1,1
    
    /*
    const vertices = new Float32Array([
    //      position         tex     
    //    x     y    z     u     v 
        -0.5, -0.5, 0.0,  0.0, 0.0,
        -0.5,  0.5, 0.0,  0.0, 1.0,
         0.5,  0.5, 0.0,  1.0, 1.0,

        // triangle 2 (2nd half of quad)
        -0.5, -0.5, 0.0,  0.0, 0.0,
         0.5,  0.5, 0.0,  1.0, 1.0,
         0.5, -0.5, 0.0,  1.0, 0.0,
    ])
    */

    const vertices = spritesheet.vertices

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
        arrayStride: 20,
        stepMode: 'vertex',
        attributes: [
            // position
            {
                shaderLocation: 0,
                format: 'float32x3',
                offset: 0
            },
            // uv
            {
                shaderLocation: 1,
                format: 'float32x2',
                offset: 12
            }
        ]
    }

    return {
        buffer,
        bufferLayout,
    }
}
