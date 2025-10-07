import * as publicAPI from "./public-api.js";
import spriteWGSL     from "./sprite.wgsl";


// --- Instance buffer (growable) ---
const INSTANCE_STRIDE = 48;

// Offsets inside one instance (bytes)
const OFF_POS = 0; // float32x2 (8B)
const OFF_SIZE = 8; // float32x2 (8B)
const OFF_SCALEROT = 16; // float32x2 (8B)
const OFF_SPRITEID = 24; // uint32 (4B)
const OFF_OPACITY = 28; // float32 (4B)
const OFF_TINT = 32; // float32x4 (16B)


export default {
    type: "cobalt:sprite2",
    refs: [
        { name: "spritesheet", type: "customResource", access: "read" },
        {
            name: "hdr",
            type: "textureView",
            format: "rgba16float",
            access: "write",
        },
        {
            name: "emissive",
            type: "textureView",
            format: "rgba16float",
            access: "write",
        },
    ],

    // cobalt event handling functions

    // @params Object cobalt renderer world object
    // @params Object options optional data passed when initing this node
    onInit: async function (cobalt, options = {}) {
        return init(cobalt, options);
    },

    onRun: function (cobalt, node, webGpuCommandEncoder) {
        // do whatever you need for this node. webgpu renderpasses, etc.
        draw(cobalt, node, webGpuCommandEncoder);
    },

    onDestroy: function (cobalt, node) {
        // TODO
    },

    onResize: function (cobalt, node) {},

    onViewportPosition: function (cobalt, node) {},

    // optional
    customFunctions: {
        ...publicAPI,
    },
};

async function init(cobalt, nodeData) {
    const { device } = cobalt;

    const { descs, names } = buildSpriteTableFromTP(nodeData.refs.spritesheet.data.spritesheet.rawJson);

    // Pack into std430-like struct (4*float*? + vec2 + vec2 → 32 bytes). We'll just write tightly as 8 floats.
    const BYTES_PER_DESC = 8 * 4; // 8 float32s
    const buf = new ArrayBuffer(BYTES_PER_DESC * descs.length);
    const f32 = new Float32Array(buf);
    for (let i=0;i<descs.length;i++){
        const d = descs[i];
        const base = i * 8;
        f32[base+0] = d.UvOrigin[0];
        f32[base+1] = d.UvOrigin[1];
        f32[base+2] = d.UvSpan[0];
        f32[base+3] = d.UvSpan[1];
        f32[base+4] = d.FrameSize[0];
        f32[base+5] = d.FrameSize[1];
        f32[base+6] = d.CenterOffset[0];
        f32[base+7] = d.CenterOffset[1];
    }

    // Recreate buffer and bind group
    const spriteBuf = device.createBuffer({
        label: "sprite2 desc table",
        size: Math.max(16, buf.byteLength),
        usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
    });

    device.queue.writeBuffer(spriteBuf, 0, buf);


    // Map name → ID
    const idByName = new Map(names.map((n,i)=>[n,i]));

    // --- Uniform buffer (view + proj) ---
    const uniformBuf = nodeData.refs.spritesheet.data.uniformBuffer

    // --- Instance buffer (growable) ---
    const instanceCap = 1024;
    const instanceBuf = device.createBuffer({
        label: "sprite2 instances",
        size: INSTANCE_STRIDE * instanceCap,
        usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
    });
    const instanceStaging = new ArrayBuffer(INSTANCE_STRIDE * instanceCap);
    const instanceView = new DataView(instanceStaging);

    // --- Pipeline ---
    const shader = device.createShaderModule({ code: spriteWGSL });
    const bgl = device.createBindGroupLayout({
        entries: [
            {
                binding: 0,
                visibility: GPUShaderStage.VERTEX,
                buffer: { type: "uniform" },
            },
            {
                binding: 1,
                visibility: GPUShaderStage.FRAGMENT,
                sampler: { type: "filtering" },
            },
            {
                binding: 2,
                visibility: GPUShaderStage.FRAGMENT,
                texture: { sampleType: "float" },
            },
            {
                binding: 3,
                visibility: GPUShaderStage.VERTEX,
                buffer: { type: "read-only-storage" },
            },
            {
                binding: 4,
                visibility: GPUShaderStage.FRAGMENT,
                texture: { sampleType: "float" },
            },

        ],
    });
    const pipelineLayout = device.createPipelineLayout({
        bindGroupLayouts: [bgl],
    });

    const instLayout = {
        arrayStride: INSTANCE_STRIDE,
        stepMode: "instance",
        attributes: [
            { shaderLocation: 0, offset: OFF_POS, format: "float32x2" },
            { shaderLocation: 1, offset: OFF_SIZE, format: "float32x2" },
            { shaderLocation: 2, offset: OFF_SCALEROT, format: "float32x2" },
            { shaderLocation: 3, offset: OFF_TINT, format: "float32x4" },
            { shaderLocation: 4, offset: OFF_SPRITEID, format: "uint32" },
            { shaderLocation: 5, offset: OFF_OPACITY, format: "float32" },
        ],
    };


    const pipeline = device.createRenderPipeline({
        layout: pipelineLayout,
        vertex: {
            module: shader,
            entryPoint: "vs_main",
            buffers: [instLayout],
        },
        fragment: {
            module: shader,
            entryPoint: "fs_main",
            targets: [
                // color
                {
                    format: 'rgba16float',
                    blend: {
                        color: {
                            srcFactor: 'src-alpha',
                            dstFactor: 'one-minus-src-alpha',
                        },
                        alpha: {
                            srcFactor: 'zero',
                            dstFactor: 'one'
                        }
                    }
                },

                // emissive
                {
                    format: 'rgba16float',
                }

            ],
        },
        primitive: { topology: "triangle-strip", cullMode: "none" },
        multisample: { count: 1 },
    });

    const bindGroupLayout = bgl;

    const bindGroup = device.createBindGroup({
        layout: bgl,
        entries: [
            { binding: 0, resource: { buffer: uniformBuf } },
            { binding: 1, resource: nodeData.refs.spritesheet.data.colorTexture.sampler },
            { binding: 2, resource: nodeData.refs.spritesheet.data.colorTexture.view },
            { binding: 3, resource: { buffer: spriteBuf } },
            { binding: 4, resource: nodeData.refs.spritesheet.data.emissiveTexture.view },
        ],
    });


    return {
        sprites: [ ],
        spriteBuf,
        spriteDescs: descs,

        instanceCap,
        instanceView,
        instanceBuf,
        instanceStaging,

        pipeline,
        bindGroup,

        idByName,
    }
}


function ensureCapacity (cobalt, node, nInstances) {

    const { instanceCap } = node.data

    if (nInstances <= instanceCap)
        return;

    let newCap = instanceCap
    if (newCap === 0)
        newCap = 1024;

    while (newCap < nInstances)
        newCap *= 2;

    node.data.instanceBuf.destroy();
    node.data.instanceBuf = cobalt.device.createBuffer({
        size: INSTANCE_STRIDE * newCap,
        usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
    });

    node.data.instanceStaging = new ArrayBuffer(INSTANCE_STRIDE * newCap);
    node.data.instanceView = new DataView(node.data.instanceStaging);
    node.data.instanceCap = newCap;
}


function draw (cobalt, node, commandEncoder) {

    const { device, context } = cobalt;

    const { instanceView, instanceBuf, instanceStaging, pipeline, bindGroup } = node.data

    // TODO: don't generate all this garbage each frame. pre-allocate viewRect, visible.

    const viewRect = {
        x: cobalt.viewport.position[0],
        y: cobalt.viewport.position[1],
        w: cobalt.viewport.width,
        h: cobalt.viewport.height,
    }

    const visible = [ ]
    for (const s of node.data.sprites) {
        const d = node.data.spriteDescs[s.spriteID];
        if (!d)
            continue;
        const sc = s.scale ?? 1;
        const sx = (d.FrameSize[0] * (s.sizeX ?? 1) * sc) * 0.5;
        const sy = (d.FrameSize[1] * (s.sizeY ?? 1) * sc) * 0.5;
        const rad = Math.hypot(sx, sy);
        const x = s.position[0], y = s.position[1];
        if (x + rad < viewRect.x || x - rad > viewRect.x + viewRect.w || y + rad < viewRect.y || y - rad > viewRect.y + viewRect.h) {
            continue
        }

        visible.push(s)
    }
    

    ensureCapacity(cobalt, node, visible.length)

    // Pack instances into staging buffer
    for (let i=0;i<visible.length;i++){
        const base = i * INSTANCE_STRIDE;
        const s = visible[i];
        const tint = s.tint || [1,1,1,1];
        const sizeX = s.sizeX, sizeY = s.sizeY;
        const scale = s.scale, rot = s.rotation;
        // pos
        instanceView.setFloat32(base + OFF_POS + 0, s.position[0], true);
        instanceView.setFloat32(base + OFF_POS + 4, s.position[1], true);
        
        instanceView.setFloat32(base + OFF_SIZE + 0, sizeX, true);
        instanceView.setFloat32(base + OFF_SIZE + 4, sizeY, true);
        // scale+rot
        instanceView.setFloat32(base + OFF_SCALEROT + 0, scale, true);
        instanceView.setFloat32(base + OFF_SCALEROT + 4, rot, true);
        
        instanceView.setFloat32(base + OFF_TINT + 0, tint[0], true);
        instanceView.setFloat32(base + OFF_TINT + 4, tint[1], true);
        instanceView.setFloat32(base + OFF_TINT + 8, tint[2], true);
        instanceView.setFloat32(base + OFF_TINT + 12, tint[3], true);
       
        instanceView.setUint32(base + OFF_SPRITEID, s.spriteID >>> 0, true);
    
        instanceView.setFloat32(base + OFF_OPACITY, s.opacity, true);
    }

    device.queue.writeBuffer(instanceBuf, 0, instanceStaging, 0, visible.length * INSTANCE_STRIDE);

    const loadOp = node.options.loadOp || 'load'

    const pass = commandEncoder.beginRenderPass({
        label: "sprite2 renderpass",
        colorAttachments: [
            // color
            {
                view: node.refs.hdr.data.view,
                clearValue: cobalt.clearValue,
                loadOp: loadOp,
                storeOp: 'store',
            },

            // emissive
            {
                view: node.refs.emissive.data.view,
                clearValue: cobalt.clearValue,
                loadOp: 'clear',
                storeOp: 'store'
            }

        ],
    });

    pass.setPipeline(pipeline);
    pass.setBindGroup(0, bindGroup);
    pass.setVertexBuffer(0, instanceBuf);
    pass.draw(4, visible.length, 0, 0); // triangle strip, 4 verts per instance
    pass.end();
}


// ------------------------------ TexturePacker (no rotation) ------------------------------
// Accepts the "Hash" JSON format from TexturePacker. Assumes rotated=false.
function buildSpriteTableFromTP (doc) {
    const atlasW = doc.meta.size.w;
    const atlasH = doc.meta.size.h;
    const names = Object.keys(doc.frames).sort();
    const descs = new Array(names.length);
    for (let i=0;i<names.length;i++){
        const fr = doc.frames[names[i]];
        const fx = fr.frame.x, fy = fr.frame.y, fw = fr.frame.w, fh = fr.frame.h;
        const offX = fx / atlasW, offY = fy / atlasH;
        const spanX = fw / atlasW, spanY = fh / atlasH;
        const sw = fr.sourceSize.w, sh = fr.sourceSize.h;
        const ox = fr.spriteSourceSize.x, oy = fr.spriteSourceSize.y;
        const cx = (ox + fw*0.5) - (sw*0.5);
        const cy = (oy + fh*0.5) - (sh*0.5);
        descs[i] = {
            UvOrigin: [offX, offY],
            UvSpan: [spanX, spanY],
            FrameSize:[fw, fh],
            CenterOffset:[cx, cy],
        };
    }
    return { descs, names };
}
