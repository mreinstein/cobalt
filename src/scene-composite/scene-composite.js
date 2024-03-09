import * as Cobalt        from '../cobalt.js'
import sceneCompositeWGSL from './scene-composite.wgsl'


export default {
    type: 'bloom',
    refs: [
        { name: 'hdr',      type: 'textureView', format: 'rgba16', access: 'read' },
        { name: 'bloom',    type: 'textureView', format: 'rgba16', access: 'read' },
        { name: 'combined', type: 'textureView', format: 'rgba8unorm', access: 'write' },
    ],
    // @params Object cobalt renderer world object
    // @params Object options optional data passed when initing this node
    onInit: async function (cobalt, options={}) {
        return init(cobalt, options)
    },

    onRun: function (cobalt, node, webGpuCommandEncoder) {
        // do whatever you need for this node. webgpu renderpasses, etc.
        draw(cobalt, node, webGpuCommandEncoder)
    },

    onDestroy: function (cobalt, node) {
        // any cleanup for your node should go here (releasing textures, etc.)
        //destroy(node)
    },

    onResize: function (cobalt, node) {
        // do whatever you need when the dimensions of the renderer change (resize textures, etc.)
        resize(cobalt, node)
    },

    onViewportPosition: function (cobalt, node) { },
}


function init (cobalt, node) {
  const { options, refs } = node

    const { device } = cobalt
    const format = Cobalt.getPreferredFormat(cobalt) // bgra8unorm

    const bloom_intensity = options.bloom_intensity ?? 40.0
    const bloom_combine_constant = options.bloom_combine_constant ?? 0.68
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
            resource: refs.hdr.data.sampler,
          },
          // color
          {
            binding: 1,
            resource: refs.hdr.data.view,
          },
          // emissive
          {
            binding: 2,
            resource: refs.bloom.data.mip_view[0],
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
function draw (cobalt, node, commandEncoder) {

    const passEncoder = commandEncoder.beginRenderPass({
      colorAttachments: [
        {
          view: node.refs.combined.data.view, //getCurrentTextureView(cobalt)
          clearValue: { r: 0.0, g: 0.0, b: 0.0, a: 1.0 },
          loadOp: 'clear',
          storeOp: 'store',
        },
      ],
    })

    const { pipeline, bindGroup } = node.data

    passEncoder.setPipeline(pipeline)
    passEncoder.setBindGroup(0, bindGroup)
    passEncoder.draw(6, 1, 0, 0)
    passEncoder.end()
}


function resize (cobalt, node) {
    const { pipeline, params_buf } = node.data
    const { device } = cobalt

    node.data.bindGroup = device.createBindGroup({
        layout: pipeline.getBindGroupLayout(0),
        entries: [
          {
            binding: 0,
            resource: node.refs.hdr.data.sampler,
          },
          // color
          {
            binding: 1,
            resource: node.refs.hdr.data.view,
          },
          // emissive
          {
            binding: 2,
            resource: node.refs.bloom.data.mip_view[0], //bloom_mat.bind_groups_textures[2].mip_view[0],
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

