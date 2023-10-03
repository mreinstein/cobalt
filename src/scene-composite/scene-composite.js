import sceneCompositeWGSL from './scene-composite.wgsl'


export default {
    type: 'bloom',
    refs: [
        { name: 'hdr',      type: 'webGpuTextureView', format: 'rgba16', access: 'read' },
        { name: 'bloom',    type: 'webGpuTextureView', format: 'rgba16', access: 'read' },
        { name: 'combined', type: 'webGpuTextureFrameView', format: 'rgba8unorm', access: 'write' },
    ],
    // @params Object cobalt renderer world object
    // @params Object options optional data passed when initing this node
    onInit: async function (cobalt, options={}) {
        return init(cobalt, options)
    },

    onRun: function (cobalt, nodeData, webGpuCommandEncoder) {
        // do whatever you need for this node. webgpu renderpasses, etc.
        draw(cobalt, nodeData, webGpuCommandEncoder)
    },

    onDestroy: function (data) {
        // any cleanup for your node should go here (releasing textures, etc.)
        //destroy(data)
    },

    onResize: function (cobalt, data) {
        // do whatever you need when the dimensions of the renderer change (resize textures, etc.)
        resize(cobalt, data)
    },

    onViewportPosition: function (cobalt, data) {

    },
}


function init (cobalt, options) {
    const { device } = cobalt
    const format = navigator.gpu.getPreferredCanvasFormat() // bgra8unorm

    const bloom_intensity = 40.0
    const bloom_combine_constant = 0.68
    const dat = new Float32Array([ bloom_intensity, bloom_combine_constant ])
    const params_buf = device.createBuffer({
        label: 'scene composite params buffer',
        size: dat.byteLength, // vec4<f32> and f32 and u32 with 4 bytes per float32 and 4 bytes per u32
        mappedAtCreation: true,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
    })

    new Float32Array(params_buf.getMappedRange()).set(dat)

    params_buf.unmap()

    const pipeline = device.createRenderPipeline({
        layout: 'auto',
        vertex: {
          module: device.createShaderModule({
            code: sceneCompositeWGSL,
          }),
          entryPoint: 'vert_main',
        },
        fragment: {
          module: device.createShaderModule({
            code: sceneCompositeWGSL,
          }),
          entryPoint: 'frag_main',
          targets: [
            {
              format,
            },
          ],
        },
        primitive: {
          topology: 'triangle-list',
        },
    })

    const bindGroup = device.createBindGroup({
        layout: pipeline.getBindGroupLayout(0),
        entries: [
          {
            binding: 0,
            resource: cobalt.resources.hdr.data.value.sampler, //bloom_mat.hdr_sampler,
          },
          // color
          {
            binding: 1,
            resource: cobalt.resources.hdr.data.value.view, //bloom_mat.hdr_texture.view,
          },
          // emissive
          {
            binding: 2,
            resource: cobalt.resources.bloom.data.value.mip_view[0], //bloom_mat.bind_groups_textures[2].mip_view[0],
          },
          {
            binding: 3,
            resource: {
                buffer: params_buf,
            },
          },
        ],
    })

    return {
        bindGroup,
        pipeline,
        params_buf,
    }
}


// combine bloom and color textures and draw to a fullscreen quad
function draw (cobalt, nodeData, commandEncoder) {
  
    const passEncoder = commandEncoder.beginRenderPass({
      colorAttachments: [
        {
          view: nodeData.refs.combined, //renderer.context.getCurrentTexture().createView(),
          clearValue: { r: 0.0, g: 0.0, b: 0.0, a: 1.0 },
          loadOp: 'clear',
          storeOp: 'store',
        },
      ],
    })

    const { pipeline, bindGroup } = nodeData.data

    passEncoder.setPipeline(pipeline)
    passEncoder.setBindGroup(0, bindGroup)
    passEncoder.draw(6, 1, 0, 0)
    passEncoder.end()
}


function resize (cobalt, nodeData) {
    const { bindGroup, pipeline, params_buf } = nodeData.data
    const { device } = cobalt

    nodeData.data.bindGroup = device.createBindGroup({
        layout: pipeline.getBindGroupLayout(0),
        entries: [
          {
            binding: 0,
            resource: cobalt.resources.hdr.data.value.sampler, //bloom_mat.hdr_sampler,
          },
          // color
          {
            binding: 1,
            resource: cobalt.resources.hdr.data.value.view, //bloom_mat.hdr_texture.view,
          },
          // emissive
          {
            binding: 2,
            resource: cobalt.resources.bloom.data.value.mip_view[0], //bloom_mat.bind_groups_textures[2].mip_view[0],
          },
          {
            binding: 3,
            resource: {
                buffer: params_buf,
            },
          },
        ],
    })
}

