var de=Object.defineProperty;var me=(t,e)=>{for(var r in e)de(t,r,{get:e[r],enumerable:!0})};function x(t,e,r,o,i,n,a){let u=t.createTexture({label:e,size:{width:r,height:o},format:n,usage:a,mipLevelCount:i,sampleCount:1,dimension:"2d"}),s=u.createView(),c=[];for(let p=0;p<i;p++)c.push(u.createView({label:e,format:n,dimension:"2d",aspect:"all",baseMipLevel:p,mipLevelCount:1,baseArrayLayer:0,arrayLayerCount:1}));let l=t.createSampler({label:`${e} sampler`,addressModeU:"clamp-to-edge",addressModeV:"clamp-to-edge",addressModeW:"clamp-to-edge",magFilter:"linear",minFilter:"linear",mipmapFilter:"linear"});return{size:{width:r,height:o},texture:u,view:s,mip_view:c,sampler:l}}var q="const BLOOM_MIP_COUNT:i32=7;const MODE_PREFILTER:u32=0u;const MODE_DOWNSAMPLE:u32=1u;const MODE_UPSAMPLE_FIRST:u32=2u;const MODE_UPSAMPLE:u32=3u;const EPSILON:f32=1.0e-4;struct bloom_param{parameters:vec4<f32>,combine_constant:f32,doop:u32,ferp:u32,}struct mode_lod_param{mode_lod:u32,}@group(0)@binding(0)var output_texture:texture_storage_2d<rgba16float,write>;@group(0)@binding(1)var input_texture:texture_2d<f32>;@group(0)@binding(2)var bloom_texture:texture_2d<f32>;@group(0)@binding(3)var samp:sampler;@group(0)@binding(4)var<uniform> param:bloom_param;@group(0)@binding(5)var<uniform> pc:mode_lod_param;fn QuadraticThreshold(color:vec4<f32>,threshold:f32,curve:vec3<f32>)->vec4<f32>{let brightness=max(max(color.r,color.g),color.b);var rq:f32=clamp(brightness-curve.x,0.0,curve.y);rq=curve.z*(rq*rq);let ret_color=color*max(rq,brightness-threshold)/max(brightness,EPSILON);return ret_color;}fn Prefilter(color:vec4<f32>,uv:vec2<f32>)->vec4<f32>{let clamp_value=20.0;var c=min(vec4<f32>(clamp_value),color);c=QuadraticThreshold(color,param.parameters.x,param.parameters.yzw);return c;}fn DownsampleBox13(tex:texture_2d<f32>,lod:f32,uv:vec2<f32>,tex_size:vec2<f32>)->vec3<f32>{let A=textureSampleLevel(tex,samp,uv,lod).rgb;let texel_size=tex_size*0.5;let B=textureSampleLevel(tex,samp,uv+texel_size*vec2<f32>(-1.0,-1.0),lod).rgb;let C=textureSampleLevel(tex,samp,uv+texel_size*vec2<f32>(-1.0,1.0),lod).rgb;let D=textureSampleLevel(tex,samp,uv+texel_size*vec2<f32>(1.0,1.0),lod).rgb;let E=textureSampleLevel(tex,samp,uv+texel_size*vec2<f32>(1.0,-1.0),lod).rgb;let F=textureSampleLevel(tex,samp,uv+texel_size*vec2<f32>(-2.0,-2.0),lod).rgb;let G=textureSampleLevel(tex,samp,uv+texel_size*vec2<f32>(-2.0,0.0),lod).rgb;let H=textureSampleLevel(tex,samp,uv+texel_size*vec2<f32>(0.0,2.0),lod).rgb;let I=textureSampleLevel(tex,samp,uv+texel_size*vec2<f32>(2.0,2.0),lod).rgb;let J=textureSampleLevel(tex,samp,uv+texel_size*vec2<f32>(2.0,2.0),lod).rgb;let K=textureSampleLevel(tex,samp,uv+texel_size*vec2<f32>(2.0,0.0),lod).rgb;let L=textureSampleLevel(tex,samp,uv+texel_size*vec2<f32>(-2.0,-2.0),lod).rgb;let M=textureSampleLevel(tex,samp,uv+texel_size*vec2<f32>(0.0,-2.0),lod).rgb;var result:vec3<f32>=vec3<f32>(0.0);result=result+(B+C+D+E)*0.5;result=result+(F+G+A+M)*0.125;result=result+(G+H+I+A)*0.125;result=result+(A+I+J+K)*0.125;result=result+(M+A+K+L)*0.125;result=result*0.25;return result;}fn UpsampleTent9(tex:texture_2d<f32>,lod:f32,uv:vec2<f32>,texel_size:vec2<f32>,radius:f32)->vec3<f32>{let offset=texel_size.xyxy*vec4<f32>(1.0,1.0,-1.0,0.0)*radius;var result:vec3<f32>=textureSampleLevel(tex,samp,uv,lod).rgb*4.0;result=result+textureSampleLevel(tex,samp,uv-offset.xy,lod).rgb;result=result+textureSampleLevel(tex,samp,uv-offset.wy,lod).rgb*2.0;result=result+textureSampleLevel(tex,samp,uv-offset.zy,lod).rgb;result=result+textureSampleLevel(tex,samp,uv+offset.zw,lod).rgb*2.0;result=result+textureSampleLevel(tex,samp,uv+offset.xw,lod).rgb*2.0;result=result+textureSampleLevel(tex,samp,uv+offset.zy,lod).rgb;result=result+textureSampleLevel(tex,samp,uv+offset.wy,lod).rgb*2.0;result=result+textureSampleLevel(tex,samp,uv+offset.xy,lod).rgb;return result*(1.0/16.0);}fn combine(ex_color:vec3<f32>,color_to_add:vec3<f32>,combine_constant:f32)->vec3<f32>{let existing_color=ex_color+(-color_to_add);let blended_color=(combine_constant*existing_color)+color_to_add;return blended_color;}@compute @workgroup_size(8,4,1)fn cs_main(@builtin(global_invocation_id)global_invocation_id:vec3<u32>){let mode=pc.mode_lod>>16u;let lod=pc.mode_lod&65535u;let imgSize=textureDimensions(output_texture);if(global_invocation_id.x<=u32(imgSize.x)&&global_invocation_id.y<=u32(imgSize.y)){var texCoords:vec2<f32>=vec2<f32>(f32(global_invocation_id.x)/f32(imgSize.x),f32(global_invocation_id.y)/f32(imgSize.y));texCoords=texCoords+(1.0/vec2<f32>(imgSize))*0.5;let texSize=vec2<f32>(textureDimensions(input_texture,i32(lod)));var color:vec4<f32>=vec4<f32>(1.0);if(mode==MODE_PREFILTER){color=vec4<f32>(DownsampleBox13(input_texture,f32(lod),texCoords,1.0/texSize),1.0);color=Prefilter(color,texCoords);}else if(mode==MODE_DOWNSAMPLE){color=vec4<f32>(DownsampleBox13(input_texture,f32(lod),texCoords,1.0/texSize),1.0);}else if(mode==MODE_UPSAMPLE_FIRST){let bloomTexSize=textureDimensions(input_texture,i32(lod)+1);let sampleScale=1.0;let upsampledTexture=UpsampleTent9(input_texture,f32(lod)+1.0,texCoords,1.0/vec2<f32>(bloomTexSize),sampleScale);let existing=textureSampleLevel(input_texture,samp,texCoords,f32(lod)).rgb;color=vec4<f32>(combine(existing,upsampledTexture,param.combine_constant),1.0);}else if(mode==MODE_UPSAMPLE){let bloomTexSize=textureDimensions(bloom_texture,i32(lod)+1);let sampleScale=1.0;let upsampledTexture=UpsampleTent9(bloom_texture,f32(lod)+1.0,texCoords,1.0/vec2<f32>(bloomTexSize),sampleScale);let existing=textureSampleLevel(input_texture,samp,texCoords,f32(lod)).rgb;color=vec4<f32>(combine(existing,upsampledTexture,param.combine_constant),1.0);}textureStore(output_texture,vec2<i32>(global_invocation_id.xy),color);}}";var b=7,xe=0,Y=1,ge=2,W=3,X={type:"bloom",refs:[{name:"emissive",type:"webGpuTextureView",format:"rgba16",access:"read"},{name:"hdr",type:"webGpuTextureView",format:"rgba16",access:"read"},{name:"bloom",type:"webGpuTextureView",format:"rgba16",access:"readwrite"}],onInit:async function(t,e={}){return be(t,e)},onRun:function(t,e,r){_e(t,e.data,r)},onDestroy:function(t,e){j(e)},onResize:function(t,e){ye(t,e)},onViewportPosition:function(t,e){}};function be(t,e){let{device:r}=t,o=t.viewport.width,i=t.viewport.height,n={compute_pipeline:null,bind_group:[],bind_group_layout:[],bind_groups_textures:[]},a=r.createBindGroupLayout({entries:[{binding:0,visibility:GPUShaderStage.COMPUTE,storageTexture:{access:"write-only",format:"rgba16float",viewDimension:"2d"}},{binding:1,visibility:GPUShaderStage.COMPUTE,texture:{sampleType:"float",viewDimension:"2d",multisampled:!1}},{binding:2,visibility:GPUShaderStage.COMPUTE,texture:{sampleType:"float",viewDimension:"2d",multisampled:!1}},{binding:3,visibility:GPUShaderStage.COMPUTE,sampler:{}},{binding:4,visibility:GPUShaderStage.COMPUTE,buffer:{type:"uniform"}},{binding:5,visibility:GPUShaderStage.COMPUTE,buffer:{type:"uniform"}}]});n.bind_group_layout.push(a),n.bind_groups_textures.push(x(r,"bloom downsampler image 0",o/2,i/2,b,"rgba16float",GPUTextureUsage.STORAGE_BINDING|GPUTextureUsage.TEXTURE_BINDING)),n.bind_groups_textures.push(x(r,"bloom downsampler image 1",o/2,i/2,b,"rgba16float",GPUTextureUsage.STORAGE_BINDING|GPUTextureUsage.TEXTURE_BINDING)),n.bind_groups_textures.push(e.refs.bloom.data);let u=r.createPipelineLayout({bindGroupLayouts:n.bind_group_layout}),s=r.createComputePipeline({layout:u,compute:{module:r.createShaderModule({code:q}),entryPoint:"cs_main"}});return H(t,n,e.refs),n.compute_pipeline=s,n}function H(t,e,r={}){let{device:o}=t,i=.1,n=.2,a=.68,u=new Float32Array([i,i-n,n*2,.25/n,a,0,0,0]),s=o.createBuffer({label:"bloom static parameters buffer",size:u.byteLength,mappedAtCreation:!0,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST});new Float32Array(s.getMappedRange()).set(u),s.unmap(),e.bind_group.length=0,e.params_buf=s,e.bind_group.push(w(o,e,e.bind_groups_textures[0].mip_view[0],r.emissive.data.view,r.hdr.data.view,r.hdr.data.sampler,s,xe<<16|0));for(let l=1;l<b;l++)e.bind_group.push(w(o,e,e.bind_groups_textures[1].mip_view[l],e.bind_groups_textures[0].view,r.hdr.data.view,r.hdr.data.sampler,s,Y<<16|l-1)),e.bind_group.push(w(o,e,e.bind_groups_textures[0].mip_view[l],e.bind_groups_textures[1].view,r.hdr.data.view,r.hdr.data.sampler,s,Y<<16|l));e.bind_group.push(w(o,e,e.bind_groups_textures[2].mip_view[b-1],e.bind_groups_textures[0].view,r.hdr.data.view,r.hdr.data.sampler,s,ge<<16|b-2));let c=!0;for(let l=b-2;l>=0;l--)c?(e.bind_group.push(w(o,e,e.bind_groups_textures[1].mip_view[l],e.bind_groups_textures[0].view,e.bind_groups_textures[2].view,r.hdr.data.sampler,s,W<<16|l)),c=!1):(e.bind_group.push(w(o,e,e.bind_groups_textures[2].mip_view[l],e.bind_groups_textures[0].view,e.bind_groups_textures[1].view,r.hdr.data.sampler,s,W<<16|l)),c=!0)}function w(t,e,r,o,i,n,a,u){let s=new Uint32Array([u]),c=t.createBuffer({label:"bloom static mode_lod buffer",size:s.byteLength,mappedAtCreation:!0,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST});return new Uint32Array(c.getMappedRange()).set(s),c.unmap(),t.createBindGroup({label:"bloom bind group layout",layout:e.bind_group_layout[0],entries:[{binding:0,resource:r},{binding:1,resource:o},{binding:2,resource:i},{binding:3,resource:n},{binding:4,resource:{buffer:a}},{binding:5,resource:{buffer:c}}]})}function _e(t,e,r){let u=0,s=r.beginComputePass({label:"bloom Compute Pass"});s.setPipeline(e.compute_pipeline),s.setBindGroup(0,e.bind_group[u]),u+=1;let c=C(0,e.bind_groups_textures[0]);s.dispatchWorkgroups(c.width/8+1,c.height/4+1,1);for(let l=1;l<b;l++)c=C(l,e.bind_groups_textures[0]),s.setBindGroup(0,e.bind_group[u]),u+=1,s.dispatchWorkgroups(c.width/8+1,c.height/4+1,1),s.setBindGroup(0,e.bind_group[u]),u+=1,s.dispatchWorkgroups(c.width/8+1,c.height/4+1,1);s.setBindGroup(0,e.bind_group[u]),u+=1,c=C(b-1,e.bind_groups_textures[2]),s.dispatchWorkgroups(c.width/8+1,c.height/4+1,1);for(let l=b-2;l>=0;l--)c=C(l,e.bind_groups_textures[2]),s.setBindGroup(0,e.bind_group[u]),u+=1,s.dispatchWorkgroups(c.width/8+1,c.height/4+1,1);s.end()}function C(t,e){let r=e.size.width,o=e.size.height;for(let i=0;i<t;i++)r/=2,o/=2;return{width:r,height:o,depthOrArrayLayers:1}}function ye(t,e){let{device:r}=t,o=e.data;j(o),o.bind_groups_textures.push(x(r,"bloom downsampler image 0",t.viewport.width/2,t.viewport.height/2,b,"rgba16float",GPUTextureUsage.STORAGE_BINDING|GPUTextureUsage.TEXTURE_BINDING)),o.bind_groups_textures.push(x(r,"bloom downsampler image 1",t.viewport.width/2,t.viewport.height/2,b,"rgba16float",GPUTextureUsage.STORAGE_BINDING|GPUTextureUsage.TEXTURE_BINDING)),o.bind_groups_textures.push(e.refs.bloom.data),H(t,o,e.refs)}function j(t){for(let e of t.bind_groups_textures)e.texture.destroy();t.bind_groups_textures.length=0}var B="struct BloomComposite{bloom_intensity:f32,bloom_combine_constant:f32,}@group(0)@binding(0)var mySampler:sampler;@group(0)@binding(1)var colorTexture:texture_2d<f32>;@group(0)@binding(2)var emissiveTexture:texture_2d<f32>;@group(0)@binding(3)var<uniform> composite_parameter:BloomComposite;struct VertexOutput{@builtin(position)Position:vec4<f32>,@location(0)fragUV:vec2<f32>,}@vertex fn vert_main(@builtin(vertex_index)VertexIndex:u32)->VertexOutput{const pos=array(vec2(1.0,1.0),vec2(1.0,-1.0),vec2(-1.0,-1.0),vec2(1.0,1.0),vec2(-1.0,-1.0),vec2(-1.0,1.0),);const uv=array(vec2(1.0,0.0),vec2(1.0,1.0),vec2(0.0,1.0),vec2(1.0,0.0),vec2(0.0,1.0),vec2(0.0,0.0),);var output:VertexOutput;output.Position=vec4(pos[VertexIndex],0.0,1.0);output.fragUV=uv[VertexIndex];return output;}fn GTTonemap_point(x:f32)->f32{let m:f32=0.22;let a:f32=1.0;let c:f32=1.33;let P:f32=1.0;let l:f32=0.4;let l0:f32=((P-m)*l)/a;let S0:f32=m+l0;let S1:f32=m+a*l0;let C2:f32=(a*P)/(P-S1);let L:f32=m+a*(x-m);let T:f32=m*pow(x/m,c);let S:f32=P-(P-S1)*exp(-C2*(x-S0)/P);let w0:f32=1.0-smoothstep(0.0,m,x);var w2:f32=1.0;if(x<m+l){w2=0.0;}let w1:f32=1.0-w0-w2;return f32(T*w0+L*w1+S*w2);}fn GTTonemap(x:vec3<f32>)->vec3<f32>{return vec3<f32>(GTTonemap_point(x.r),GTTonemap_point(x.g),GTTonemap_point(x.b));}fn aces(x:vec3<f32>)->vec3<f32>{let a:f32=2.51;let b:f32=0.03;let c:f32=2.43;let d:f32=0.59;let e:f32=0.14;return clamp((x*(a*x+b))/(x*(c*x+d)+e),vec3<f32>(0.0),vec3<f32>(1.0));}@fragment fn frag_main(@location(0)fragUV:vec2<f32>)->@location(0)vec4<f32>{let hdr_color=textureSample(colorTexture,mySampler,fragUV);let bloom_color=textureSample(emissiveTexture,mySampler,fragUV);let combined_color=((bloom_color*composite_parameter.bloom_intensity)*composite_parameter.bloom_combine_constant);let mapped_color=GTTonemap(combined_color.rgb);let gamma_corrected_color=pow(mapped_color,vec3<f32>(1.0/2.2));return vec4<f32>(gamma_corrected_color+hdr_color.rgb,1.0);}";var k={type:"bloom",refs:[{name:"hdr",type:"webGpuTextureView",format:"rgba16",access:"read"},{name:"bloom",type:"webGpuTextureView",format:"rgba16",access:"read"},{name:"combined",type:"webGpuTextureFrameView",format:"rgba8unorm",access:"write"}],onInit:async function(t,e={}){return Se(t,e)},onRun:function(t,e,r){Te(t,e,r)},onDestroy:function(t,e){},onResize:function(t,e){he(t,e)},onViewportPosition:function(t,e){}};function Se(t,e){let{device:r}=t,o=navigator.gpu.getPreferredCanvasFormat(),i=40,n=.68,a=new Float32Array([i,n]),u=r.createBuffer({label:"scene composite params buffer",size:a.byteLength,mappedAtCreation:!0,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST});new Float32Array(u.getMappedRange()).set(a),u.unmap();let s=r.createRenderPipeline({layout:"auto",vertex:{module:r.createShaderModule({code:B}),entryPoint:"vert_main"},fragment:{module:r.createShaderModule({code:B}),entryPoint:"frag_main",targets:[{format:o}]},primitive:{topology:"triangle-list"}});return{bindGroup:r.createBindGroup({layout:s.getBindGroupLayout(0),entries:[{binding:0,resource:e.refs.hdr.data.sampler},{binding:1,resource:e.refs.hdr.data.view},{binding:2,resource:e.refs.bloom.data.mip_view[0]},{binding:3,resource:{buffer:u}}]}),pipeline:s,params_buf:u}}function Te(t,e,r){let o=r.beginRenderPass({colorAttachments:[{view:e.refs.combined,clearValue:{r:0,g:0,b:0,a:1},loadOp:"clear",storeOp:"store"}]}),{pipeline:i,bindGroup:n}=e.data;o.setPipeline(i),o.setBindGroup(0,n),o.draw(6,1,0,0),o.end()}function he(t,e){let{bindGroup:r,pipeline:o,params_buf:i}=e.data,{device:n}=t;e.data.bindGroup=n.createBindGroup({layout:o.getBindGroupLayout(0),entries:[{binding:0,resource:e.refs.hdr.data.sampler},{binding:1,resource:e.refs.hdr.data.view},{binding:2,resource:e.refs.bloom.data.mip_view[0]},{binding:3,resource:{buffer:i}}]})}var h={};me(h,{addSprite:()=>Ge,removeSprite:()=>Ee,setSprite:()=>Me,setSpriteName:()=>Ce,setSpriteOpacity:()=>Fe,setSpritePosition:()=>Ue,setSpriteRotation:()=>ze,setSpriteTint:()=>Be});function F(t,e,r){if(r.spriteCount===0)return 0;let o=0,i=r.spriteCount-1,n=t<<16&16711680|e&65535;for(;o<=i;){let a=r.spriteData[o*12+11];if(n<=a)return o;let u=r.spriteData[i*12+11];if(n>=u)return i+1;let s=Math.floor((o+i)/2),c=r.spriteData[s*12+11];if(n===c)return s+1;n>c?o=s+1:i=s-1}return o}function z(){return Math.ceil(Math.random()*(Number.MAX_SAFE_INTEGER-10))}function Ge(t,e,r,o,i,n,a,u,s){let c=e.refs.spritesheet.data.spritesheet;e=e.data;let l=c.locations.indexOf(r),p=F(s,l,e),v=(p+1)*12;e.spriteData.set(e.spriteData.subarray(p*12,e.spriteCount*12),v),Q(e,c,p,r,o,i,n,a,u,s);for(let[m,g]of e.spriteIndices)g>=p&&e.spriteIndices.set(m,g+1);let d=z();return e.spriteIndices.set(d,p),e.spriteCount++,e.dirty=!0,d}function Ee(t,e,r){e=e.data;let o=e.spriteIndices.get(r);for(let[n,a]of e.spriteIndices)a>o&&e.spriteIndices.set(n,a-1);let i=o*12;e.spriteData.set(e.spriteData.subarray((o+1)*12,e.spriteCount*12),i),e.spriteIndices.delete(r),e.spriteCount--,e.dirty=!0}function Ce(t,e,r,o,i){let n=e.refs.spritesheet.data.spritesheet;e=e.data;let a=n.locations.indexOf(o),u=n.spriteMeta[o].w,s=n.spriteMeta[o].h,l=e.spriteIndices.get(r)*12;e.spriteData[l+2]=u*i[0],e.spriteData[l+3]=s*i[1];let v=(e.spriteData[l+11]>>16&255)<<16&16711680|a&65535;e.spriteData[l+11]=v,e.dirty=!0}function Ue(t,e,r,o){e=e.data;let n=e.spriteIndices.get(r)*12;e.spriteData[n]=o[0],e.spriteData[n+1]=o[1],e.dirty=!0}function Be(t,e,r,o){e=e.data;let n=e.spriteIndices.get(r)*12;e.spriteData[n+4]=o[0],e.spriteData[n+5]=o[1],e.spriteData[n+6]=o[2],e.spriteData[n+7]=o[3],e.dirty=!0}function Fe(t,e,r,o){e=e.data;let n=e.spriteIndices.get(r)*12;e.spriteData[n+8]=o,e.dirty=!0}function ze(t,e,r,o){e=e.data;let n=e.spriteIndices.get(r)*12;e.spriteData[n+9]=o,e.dirty=!0}function Me(t,e,r,o,i,n,a,u,s,c){let l=e.refs.spritesheet.data.spritesheet;e=e.data;let p=e.spriteIndices.get(r);Q(e,l,p,o,i,n,a,u,s,c),e.dirty=!0}function Q(t,e,r,o,i,n,a,u,s,c){if(!e.spriteMeta[o])throw new Error(`Sprite name ${o} could not be found in the spritesheet metaData`);let l=r*12,p=e.spriteMeta[o].w,v=e.spriteMeta[o].h,d=e.locations.indexOf(o),m=c<<16&16711680|d&65535;t.spriteData[l]=i[0],t.spriteData[l+1]=i[1],t.spriteData[l+2]=p*n[0],t.spriteData[l+3]=v*n[1],t.spriteData[l+4]=a[0],t.spriteData[l+5]=a[1],t.spriteData[l+6]=a[2],t.spriteData[l+7]=a[3],t.spriteData[l+8]=u,t.spriteData[l+9]=s,t.spriteData[l+11]=m}var K={type:"sprite",refs:[{name:"spritesheet",type:"customResource",access:"read"},{name:"hdr",type:"webGpuTextureView",format:"rgba16float",access:"write"},{name:"emissive",type:"webGpuTextureView",format:"rgba16float",access:"write"}],onInit:async function(t,e={}){return Ie(t,e)},onRun:function(t,e,r,o){Oe(t,e,r,o)},onDestroy:function(t,e){Le(e)},onResize:function(t,e){},onViewportPosition:function(t,e){},customFunctions:{...h}};async function Ie(t,e){let{device:r}=t,o=16192,i=o,n=2,a=Float32Array.BYTES_PER_ELEMENT*n,u=2,s=Float32Array.BYTES_PER_ELEMENT*u,c=4,l=Float32Array.BYTES_PER_ELEMENT*c,p=4,v=Float32Array.BYTES_PER_ELEMENT*p,d=r.createBuffer({size:(a+s+l+v)*i,usage:GPUBufferUsage.VERTEX|GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST}),m=e.refs.spritesheet.data,g=r.createBindGroup({layout:e.refs.spritesheet.data.bindGroupLayout,entries:[{binding:0,resource:{buffer:m.uniformBuffer}},{binding:1,resource:m.colorTexture.view},{binding:2,resource:m.colorTexture.sampler},{binding:3,resource:{buffer:d}},{binding:4,resource:m.emissiveTexture.view}]});return{instancedDrawCalls:new Uint32Array(o*2),instancedDrawCallCount:0,bindGroup:g,spriteBuffer:d,spriteData:new Float32Array(o*12),spriteCount:0,spriteIndices:new Map,dirty:!1}}function Oe(t,e,r,o){let{device:i}=t,n=o===0?"clear":"load";e.data.dirty&&(Re(e.data),e.data.dirty=!1),i.queue.writeBuffer(e.data.spriteBuffer,0,e.data.spriteData.buffer);let a=r.beginRenderPass({colorAttachments:[{view:e.refs.hdr.data.view,clearValue:t.clearValue,loadOp:n,storeOp:"store"},{view:e.refs.emissive.data.view,clearValue:t.clearValue,loadOp:"clear",storeOp:"store"}]});a.setPipeline(e.refs.spritesheet.data.pipeline),a.setBindGroup(0,e.data.bindGroup),a.setVertexBuffer(0,e.refs.spritesheet.data.quads.buffer);let u=6,s=0;for(let c=0;c<e.data.instancedDrawCallCount;c++){let l=e.data.instancedDrawCalls[c*2]*u,p=e.data.instancedDrawCalls[c*2+1];a.draw(u,p,l,s),s+=p}a.end()}function Re(t){let e=-1,r=0;t.instancedDrawCallCount=0;for(let o=0;o<t.spriteCount;o++){let i=t.spriteData[o*12+11]&65535;i!==e&&(r>0&&(t.instancedDrawCalls[t.instancedDrawCallCount*2]=e,t.instancedDrawCalls[t.instancedDrawCallCount*2+1]=r,t.instancedDrawCallCount++),e=i,r=0),r++}r>0&&(t.instancedDrawCalls[t.instancedDrawCallCount*2]=e,t.instancedDrawCalls[t.instancedDrawCallCount*2+1]=r,t.instancedDrawCallCount++)}function Le(t){t.data.instancedDrawCalls=null,t.data.bindGroup=null,t.data.spriteBuffer.destroy(),t.data.spriteBuffer=null,t.data.spriteData=null,t.data.spriteIndices.clear(),t.data.spriteIndices=null}async function _(t,e,r,o="rgba8unorm"){let n=await(await fetch(r)).blob(),a=await createImageBitmap(n),u=GPUTextureUsage.TEXTURE_BINDING|GPUTextureUsage.COPY_DST|GPUTextureUsage.RENDER_ATTACHMENT,s=1,c=x(t.device,e,a.width,a.height,s,o,u);t.device.queue.copyExternalImageToTexture({source:a},{texture:c.texture},{width:a.width,height:a.height});let l={addressModeU:"repeat",addressModeV:"repeat",magFilter:"nearest",minFilter:"nearest",mipmapFilter:"nearest",maxAnisotropy:1};return c.sampler=t.device.createSampler(l),c}var J={type:"tile",refs:[{name:"tileAtlas",type:"webGpuTextureView",format:"rgba8unorm",access:"write"}],onInit:async function(t,e={}){return Pe(t,e)},onRun:function(t,e,r){De(t,e,r)},onDestroy:function(t,e){$(e)},onResize:function(t,e){},onViewportPosition:function(t,e){},customFunctions:{setTexture:async function(t,e,r){let{device:o}=t;$(e),e.options.textureUrl=r;let i=await _(t,"tile map",e.options.textureUrl),n=o.createBindGroup({layout:e.refs.tileAtlas.data.tileBindGroupLayout,entries:[{binding:0,resource:{buffer:e.data.uniformBuffer}},{binding:1,resource:i.view},{binding:2,resource:i.sampler}]});e.data.bindGroup=n,e.data.material=i}}};async function Pe(t,e){let{device:r}=t,o=await _(t,"tile map",e.options.textureUrl),i=new Float32Array([e.options.scrollScale,e.options.scrollScale]),n=GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST,a={size:i.byteLength,usage:n,mappedAtCreation:!0},u=r.createBuffer(a);return new Float32Array(u.getMappedRange()).set(i),u.unmap(),{bindGroup:r.createBindGroup({layout:e.refs.tileAtlas.data.tileBindGroupLayout,entries:[{binding:0,resource:{buffer:u}},{binding:1,resource:o.view},{binding:2,resource:o.sampler}]}),material:o,uniformBuffer:u,scrollScale:e.options.scrollScale}}function De(t,e,r,o){let{device:i}=t,n=o===0?"clear":"load",a=r.beginRenderPass({colorAttachments:[{view:e.refs.hdr.data.view,clearValue:t.clearValue,loadOp:n,storeOp:"store"}]}),u=e.refs.tileAtlas.data;a.setPipeline(u.pipeline),a.setVertexBuffer(0,u.quad.buffer),a.setBindGroup(0,e.data.bindGroup),a.setBindGroup(1,u.atlasBindGroup),a.draw(6,1,0,0),a.end()}function $(t){t.data.material.texture.destroy(),t.data.material.texture=void 0}function M(t){let e=new Float32Array([-1,-1,0,1,1,-1,1,1,1,1,1,0,-1,-1,0,1,1,1,1,0,-1,1,0,0]),r=GPUBufferUsage.VERTEX|GPUBufferUsage.COPY_DST,o={size:e.byteLength,usage:r,mappedAtCreation:!0},i=t.createBuffer(o);return new Float32Array(i.getMappedRange()).set(e),i.unmap(),{buffer:i,bufferLayout:{arrayStride:16,attributes:[{shaderLocation:0,format:"float32x2",offset:0},{shaderLocation:1,format:"float32x2",offset:8}]}}}var I="struct TransformData{viewOffset:vec2<f32>,viewportSize:vec2<f32>,inverseAtlasTextureSize:vec2<f32>,tileSize:f32,inverseTileSize:f32,};struct TileScroll{scrollScale:vec2<f32>};@binding(0)@group(0)var<uniform> myScroll:TileScroll;@binding(1)@group(0)var tileTexture:texture_2d<f32>;@binding(2)@group(0)var tileSampler:sampler;@binding(0)@group(1)var<uniform> transformUBO:TransformData;@binding(1)@group(1)var atlasTexture:texture_2d<f32>;@binding(2)@group(1)var atlasSampler:sampler;struct Fragment{@builtin(position)Position:vec4<f32>,@location(0)TexCoord:vec2<f32>};@vertex fn vs_main(@builtin(instance_index)i_id:u32,@location(0)vertexPosition:vec2<f32>,@location(1)vertexTexCoord:vec2<f32>)->Fragment{var output:Fragment;let inverseTileTextureSize=1/vec2<f32>(textureDimensions(tileTexture,0));var scrollScale=myScroll.scrollScale;var viewOffset:vec2<f32>=transformUBO.viewOffset*scrollScale;let PixelCoord=(vertexTexCoord*transformUBO.viewportSize)+viewOffset;output.TexCoord=PixelCoord/transformUBO.tileSize;output.Position=vec4<f32>(vertexPosition,0.0,1.0);return output;}@fragment fn fs_main(@location(0)TexCoord:vec2<f32>)->@location(0)vec4<f32>{var tilemapCoord=floor(TexCoord);var u_tilemapSize=vec2<f32>(textureDimensions(tileTexture,0));var tileFoo=fract((tilemapCoord+vec2<f32>(0.5,0.5))/u_tilemapSize);var tile=floor(textureSample(tileTexture,tileSampler,tileFoo)*255.0);if(tile.x==255&&tile.y==255){discard;}var u_tilesetSize=vec2<f32>(textureDimensions(atlasTexture,0))/transformUBO.tileSize;let u_tileUVMinBounds=vec2<f32>(0.5/transformUBO.tileSize,0.5/transformUBO.tileSize);let u_tileUVMaxBounds=vec2<f32>((transformUBO.tileSize-0.5)/transformUBO.tileSize,(transformUBO.tileSize-0.5)/transformUBO.tileSize);var texcoord=clamp(fract(TexCoord),u_tileUVMinBounds,u_tileUVMaxBounds);var tileCoord=(tile.xy+texcoord)/u_tilesetSize;var color=textureSample(atlasTexture,atlasSampler,tileCoord);if(color.a<=0.1){discard;}return color;}";var y=new Float32Array(8),ee={type:"tileAtlas",refs:[],onInit:async function(t,e={}){return Ve(t,e)},onRun:function(t,e,r){},onDestroy:function(t,e){Ne(e)},onResize:function(t,e){Z(t,e)},onViewportPosition:function(t,e){Z(t,e)}};async function Ve(t,e){let{device:r}=t,o=M(r),i=await _(t,"tile atlas",e.options.textureUrl),n=r.createBuffer({size:32,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),a=r.createBindGroupLayout({entries:[{binding:0,visibility:GPUShaderStage.VERTEX|GPUShaderStage.FRAGMENT,buffer:{}},{binding:1,visibility:GPUShaderStage.FRAGMENT,texture:{}},{binding:2,visibility:GPUShaderStage.FRAGMENT,sampler:{}}]}),u=r.createBindGroup({layout:a,entries:[{binding:0,resource:{buffer:n}},{binding:1,resource:i.view},{binding:2,resource:i.sampler}]}),s=r.createBindGroupLayout({entries:[{binding:0,visibility:GPUShaderStage.VERTEX|GPUShaderStage.FRAGMENT,buffer:{}},{binding:1,visibility:GPUShaderStage.VERTEX|GPUShaderStage.FRAGMENT,texture:{}},{binding:2,visibility:GPUShaderStage.FRAGMENT,sampler:{}}]}),c=r.createPipelineLayout({bindGroupLayouts:[s,a]});return{pipeline:r.createRenderPipeline({label:"tile",vertex:{module:r.createShaderModule({code:I}),entryPoint:"vs_main",buffers:[o.bufferLayout]},fragment:{module:r.createShaderModule({code:I}),entryPoint:"fs_main",targets:[{format:"rgba16float",blend:{color:{srcFactor:"src-alpha",dstFactor:"one-minus-src-alpha"},alpha:{srcFactor:"zero",dstFactor:"one"}}}]},primitive:{topology:"triangle-list"},layout:c}),uniformBuffer:n,atlasBindGroup:u,atlasMaterial:i,tileBindGroupLayout:s,quad:o,tileSize:e.options.tileSize,tileScale:e.options.tileScale}}function Ne(t){t.atlasMaterial.texture.destroy(),t.atlasMaterial.texture=void 0}function Z(t,e){y[0]=t.viewport.position[0],y[1]=t.viewport.position[1];let r=e.data,{tileScale:o,tileSize:i}=r,n=t.viewport.width/t.viewport.zoom,a=t.viewport.height/t.viewport.zoom;y[2]=n/o,y[3]=a/o,y[4]=1/r.atlasMaterial.texture.width,y[5]=1/r.atlasMaterial.texture.height,y[6]=i,y[7]=1/i,t.device.queue.writeBuffer(r.uniformBuffer,0,y,0,8)}function O(t,e){let r=e.vertices,o=GPUBufferUsage.VERTEX|GPUBufferUsage.COPY_DST,i={size:r.byteLength,usage:o,mappedAtCreation:!0},n=t.createBuffer(i);return new Float32Array(n.getMappedRange()).set(r),n.unmap(),{buffer:n,bufferLayout:{arrayStride:20,stepMode:"vertex",attributes:[{shaderLocation:0,format:"float32x3",offset:0},{shaderLocation:1,format:"float32x2",offset:12}]}}}function R(t){let r=Object.keys(t.frames).length,o=new Float32Array(r*30),i=[],n={},a=0;for(let u in t.frames){let s=t.frames[u];i.push(u),n[u]=s.sourceSize;let c=-.5+s.spriteSourceSize.x/s.sourceSize.w,l=-.5+s.spriteSourceSize.y/s.sourceSize.h,p=-.5+(s.spriteSourceSize.x+s.spriteSourceSize.w)/s.sourceSize.w,v=-.5+(s.spriteSourceSize.y+s.spriteSourceSize.h)/s.sourceSize.h,d=[c,l,0],m=[c,v,0],g=[p,v,0],U=[p,l,0],G=0+s.frame.x/t.meta.size.w,E=0+s.frame.y/t.meta.size.h,D=0+(s.frame.x+s.frame.w)/t.meta.size.w,A=0+(s.frame.y+s.frame.h)/t.meta.size.h,V=[G,E],pe=[G,A],N=[D,A],fe=[D,E];o.set(d,a),o.set(V,a+3),o.set(m,a+5),o.set(pe,a+8),o.set(g,a+10),o.set(N,a+13),o.set(d,a+15),o.set(V,a+18),o.set(g,a+20),o.set(N,a+23),o.set(U,a+25),o.set(fe,a+28),a+=30}return{spriteMeta:n,locations:i,vertices:o}}var L="struct TransformData{view:mat4x4<f32>,projection:mat4x4<f32>};struct Sprite{translate:vec2<f32>,scale:vec2<f32>,tint:vec4<f32>,opacity:f32,rotation:f32,emissiveIntensity:f32,sortValue:f32,};struct SpritesBuffer{models:array<Sprite>,};@binding(0)@group(0)var<uniform> transformUBO:TransformData;@binding(1)@group(0)var myTexture:texture_2d<f32>;@binding(2)@group(0)var mySampler:sampler;@binding(3)@group(0)var<storage,read>sprites:SpritesBuffer;@binding(4)@group(0)var emissiveTexture:texture_2d<f32>;struct Fragment{@builtin(position)Position:vec4<f32>,@location(0)TexCoord:vec2<f32>,@location(1)Tint:vec4<f32>,@location(2)Opacity:f32,};struct GBufferOutput{@location(0)color:vec4<f32>,@location(1)emissive:vec4<f32>,}@vertex fn vs_main(@builtin(instance_index)i_id:u32,@location(0)vertexPosition:vec3<f32>,@location(1)vertexTexCoord:vec2<f32>)->Fragment{var output:Fragment;var sx:f32=sprites.models[i_id].scale.x;var sy:f32=sprites.models[i_id].scale.y;var sz:f32=1.0;var rot:f32=sprites.models[i_id].rotation;var tx:f32=sprites.models[i_id].translate.x;var ty:f32=sprites.models[i_id].translate.y;var tz:f32=0;var s=sin(rot);var c=cos(rot);var scaleM:mat4x4<f32>=mat4x4<f32>(sx,0.0,0.0,0.0,0.0,sy,0.0,0.0,0.0,0.0,sz,0.0,0,0,0,1.0);var modelM:mat4x4<f32>=mat4x4<f32>(c,s,0.0,0.0,-s,c,0.0,0.0,0.0,0.0,1.0,0.0,tx,ty,tz,1.0)*scaleM;output.Position=transformUBO.projection*transformUBO.view*modelM*vec4<f32>(vertexPosition,1.0);output.TexCoord=vertexTexCoord;output.Tint=sprites.models[i_id].tint;output.Opacity=sprites.models[i_id].opacity;return output;}@fragment fn fs_main(@location(0)TexCoord:vec2<f32>,@location(1)Tint:vec4<f32>,@location(2)Opacity:f32)->GBufferOutput{var output:GBufferOutput;var outColor:vec4<f32>=textureSample(myTexture,mySampler,TexCoord);output.color=vec4<f32>(outColor.rgb*(1.0-Tint.a)+(Tint.rgb*Tint.a),outColor.a*Opacity);let emissive=textureSample(emissiveTexture,mySampler,TexCoord);output.emissive=vec4(emissive.rgb,1.0)*emissive.a;return output;}";import{default as It}from"https://cdn.jsdelivr.net/gh/mreinstein/remove-array-items/src/remove-array-items.js";import{default as Rt}from"https://cdn.skypack.dev/pin/round-half-up-symmetric@v2.0.0-pfMZ4UGGs9FcqO8UiEHO/mode=imports,min/optimized/round-half-up-symmetric.js";import{mat4 as S,vec2 as Pt,vec3 as T,vec4 as te}from"https://wgpu-matrix.org/dist/2.x/wgpu-matrix.module.js";var re=T.create(0,0,0),ie={type:"spritesheet",refs:[],onInit:async function(t,e={}){return Ye(t,e)},onRun:function(t,e,r){},onDestroy:function(t,e){We(e)},onResize:function(t,e){oe(t,e)},onViewportPosition:function(t,e){oe(t,e)}};async function Ye(t,e){let{canvas:r,device:o}=t,i=await Xe(e.options.spriteSheetJsonUrl);i=R(i);let n=O(o,i),[a,u]=await Promise.all([_(t,"sprite",e.options.colorTextureUrl,"rgba8unorm"),_(t,"emissive sprite",e.options.emissiveTextureUrl,"rgba8unorm")]);r.style.imageRendering="pixelated";let s=o.createBuffer({size:64*2,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),c=o.createBindGroupLayout({entries:[{binding:0,visibility:GPUShaderStage.VERTEX,buffer:{}},{binding:1,visibility:GPUShaderStage.FRAGMENT,texture:{}},{binding:2,visibility:GPUShaderStage.FRAGMENT,sampler:{}},{binding:3,visibility:GPUShaderStage.VERTEX,buffer:{type:"read-only-storage"}},{binding:4,visibility:GPUShaderStage.FRAGMENT,texture:{}}]}),l=o.createPipelineLayout({bindGroupLayouts:[c]}),p=o.createRenderPipeline({label:"sprite",vertex:{module:o.createShaderModule({code:L}),entryPoint:"vs_main",buffers:[n.bufferLayout]},fragment:{module:o.createShaderModule({code:L}),entryPoint:"fs_main",targets:[{format:"rgba16float",blend:{color:{srcFactor:"src-alpha",dstFactor:"one-minus-src-alpha"},alpha:{srcFactor:"zero",dstFactor:"one"}}},{format:"rgba16float"}]},primitive:{topology:"triangle-list"},layout:l});return{renderPassLookup:new Map,pipeline:p,uniformBuffer:s,quads:n,colorTexture:a,emissiveTexture:u,bindGroupLayout:c,spritesheet:i}}function We(t){t.data.renderPassLookup.clear(),t.data.quads.buffer.destroy(),t.data.colorTexture.buffer.destroy(),t.data.uniformBuffer.destroy(),t.data.emissiveTexture.texture.destroy()}async function Xe(t){return(await fetch(t)).json()}function oe(t,e){let{device:r}=t,o=t.viewport.width/t.viewport.zoom,i=t.viewport.height/t.viewport.zoom,n=S.ortho(0,o,i,0,-10,10);T.set(-t.viewport.position[0],-t.viewport.position[1],0,re);let a=S.translation(re);r.queue.writeBuffer(e.data.uniformBuffer,0,a.buffer),r.queue.writeBuffer(e.data.uniformBuffer,64,n.buffer)}var ne={type:"fbTexture",refs:[],onInit:async function(t,e={}){return He(t,e)},onRun:function(t,e,r){},onDestroy:function(t,e){ae(e)},onResize:function(t,e){je(t,e)},onViewportPosition:function(t,e){}};async function He(t,e){let{device:r}=t,{label:o,mip_count:i,format:n,usage:a,viewportScale:u}=e.options;return x(r,o,t.viewport.width*u,t.viewport.height*u,i,n,a)}function ae(t,e){e.data.texture.destroy()}function je(t,e){let{device:r}=t;ae(t,e);let{width:o,height:i}=t.viewport,{options:n}=e,a=e.options.viewportScale;e.data=x(r,n.label,o*a,i*a,n.mip_count,n.format,n.usage)}var P="struct TransformData{view:mat4x4<f32>,projection:mat4x4<f32>};struct Sprite{translate:vec2<f32>,scale:vec2<f32>,tint:vec4<f32>,opacity:f32,rotation:f32,};struct SpritesBuffer{models:array<Sprite>,};@binding(0)@group(0)var<uniform> transformUBO:TransformData;@binding(1)@group(0)var myTexture:texture_2d<f32>;@binding(2)@group(0)var mySampler:sampler;@binding(3)@group(0)var<storage,read>sprites:SpritesBuffer;struct Fragment{@builtin(position)Position:vec4<f32>,@location(0)TexCoord:vec2<f32>,@location(1)Tint:vec4<f32>,@location(2)Opacity:f32,};@vertex fn vs_main(@builtin(instance_index)i_id:u32,@location(0)vertexPosition:vec3<f32>,@location(1)vertexTexCoord:vec2<f32>)->Fragment{var output:Fragment;var sx:f32=sprites.models[i_id].scale.x;var sy:f32=sprites.models[i_id].scale.y;var sz:f32=1.0;var rot:f32=sprites.models[i_id].rotation;var tx:f32=sprites.models[i_id].translate.x;var ty:f32=sprites.models[i_id].translate.y;var tz:f32=0;var s=sin(rot);var c=cos(rot);var scaleM:mat4x4<f32>=mat4x4<f32>(sx,0.0,0.0,0.0,0.0,sy,0.0,0.0,0.0,0.0,sz,0.0,0,0,0,1.0);var modelM:mat4x4<f32>=mat4x4<f32>(c,s,0.0,0.0,-s,c,0.0,0.0,0.0,0.0,1.0,0.0,tx,ty,tz,1.0)*scaleM;output.Position=transformUBO.projection*transformUBO.view*modelM*vec4<f32>(vertexPosition,1.0);output.TexCoord=vertexTexCoord;output.Tint=sprites.models[i_id].tint;output.Opacity=sprites.models[i_id].opacity;return output;}@fragment fn fs_main(@location(0)TexCoord:vec2<f32>,@location(1)Tint:vec4<f32>,@location(2)Opacity:f32)->@location(0)vec4<f32>{var outColor:vec4<f32>=textureSample(myTexture,mySampler,TexCoord);var output=vec4<f32>(outColor.rgb*(1.0-Tint.a)+(Tint.rgb*Tint.a),outColor.a*Opacity);return output;}";var or=te.create(),se=T.create(),le={type:"overlay",refs:[{name:"spritesheet",type:"customResource",access:"read"},{name:"color",type:"webGpuTextureFrameView",format:"rgba16float",access:"write"}],onInit:async function(t,e={}){return Qe(t,e)},onRun:function(t,e,r,o){Ke(t,e,r,o)},onDestroy:function(t,e){Je(e)},onResize:function(t,e){ue(t,e)},onViewportPosition:function(t,e){ue(t,e)},customFunctions:{...h}};async function Qe(t,e){let{device:r}=t,o=16192,i=o,n=2,a=Float32Array.BYTES_PER_ELEMENT*n,u=2,s=Float32Array.BYTES_PER_ELEMENT*u,c=4,l=Float32Array.BYTES_PER_ELEMENT*c,p=4,v=Float32Array.BYTES_PER_ELEMENT*p,d=r.createBuffer({size:(a+s+l+v)*i,usage:GPUBufferUsage.VERTEX|GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST}),m=r.createBuffer({size:64*2,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),g=r.createBindGroupLayout({entries:[{binding:0,visibility:GPUShaderStage.VERTEX,buffer:{}},{binding:1,visibility:GPUShaderStage.FRAGMENT,texture:{}},{binding:2,visibility:GPUShaderStage.FRAGMENT,sampler:{}},{binding:3,visibility:GPUShaderStage.VERTEX,buffer:{type:"read-only-storage"}}]}),U=r.createBindGroup({layout:g,entries:[{binding:0,resource:{buffer:m}},{binding:1,resource:e.refs.spritesheet.data.colorTexture.view},{binding:2,resource:e.refs.spritesheet.data.colorTexture.sampler},{binding:3,resource:{buffer:d}}]}),G=r.createPipelineLayout({bindGroupLayouts:[g]}),E=r.createRenderPipeline({label:"overlay",vertex:{module:r.createShaderModule({code:P}),entryPoint:"vs_main",buffers:[e.refs.spritesheet.data.quads.bufferLayout]},fragment:{module:r.createShaderModule({code:P}),entryPoint:"fs_main",targets:[{format:"bgra8unorm",blend:{color:{srcFactor:"src-alpha",dstFactor:"one-minus-src-alpha"},alpha:{srcFactor:"zero",dstFactor:"one"}}}]},primitive:{topology:"triangle-list"},layout:G});return{instancedDrawCalls:new Uint32Array(o*2),instancedDrawCallCount:0,spriteBuffer:d,uniformBuffer:m,pipeline:E,bindGroupLayout:g,bindGroup:U,spriteData:new Float32Array(o*12),spriteCount:0,spriteIndices:new Map,dirty:!1}}function Ke(t,e,r,o){let{device:i}=t,n=o===0?"clear":"load";e.data.dirty&&($e(e.data),e.data.dirty=!1),i.queue.writeBuffer(e.data.spriteBuffer,0,e.data.spriteData.buffer);let a=r.beginRenderPass({colorAttachments:[{view:e.refs.color,clearValue:t.clearValue,loadOp:"load",storeOp:"store"}]});a.setPipeline(e.data.pipeline),a.setBindGroup(0,e.data.bindGroup),a.setVertexBuffer(0,e.refs.spritesheet.data.quads.buffer);let u=6,s=0;for(let c=0;c<e.data.instancedDrawCallCount;c++){let l=e.data.instancedDrawCalls[c*2]*u,p=e.data.instancedDrawCalls[c*2+1];a.draw(u,p,l,s),s+=p}a.end()}function $e(t){let e=-1,r=0;t.instancedDrawCallCount=0;for(let o=0;o<t.spriteCount;o++){let i=t.spriteData[o*12+11]&65535;i!==e&&(r>0&&(t.instancedDrawCalls[t.instancedDrawCallCount*2]=e,t.instancedDrawCalls[t.instancedDrawCallCount*2+1]=r,t.instancedDrawCallCount++),e=i,r=0),r++}r>0&&(t.instancedDrawCalls[t.instancedDrawCallCount*2]=e,t.instancedDrawCalls[t.instancedDrawCallCount*2+1]=r,t.instancedDrawCallCount++)}function ue(t,e){let o=Math.round(t.viewport.width/1),i=Math.round(t.viewport.height/1),n=S.ortho(0,o,i,0,-10,10);T.set(0,0,0,se);let a=S.translation(se);t.device.queue.writeBuffer(e.data.uniformBuffer,0,a.buffer),t.device.queue.writeBuffer(e.data.uniformBuffer,64,n.buffer)}function Je(t){t.data.instancedDrawCalls=null,t.data.bindGroup=null,t.data.spriteBuffer.destroy(),t.data.spriteBuffer=null,t.data.uniformBuffer.destroy(),t.data.uniformBuffer=null,t.data.spriteData=null,t.data.spriteIndices.clear(),t.data.spriteIndices=null}async function dr(t,e,r){let i=await(await navigator.gpu?.requestAdapter({powerPreference:"high-performance"}))?.requestDevice(),n=t.getContext("webgpu"),a=navigator.gpu.getPreferredCanvasFormat();return n.configure({device:i,format:a,alphaMode:"opaque"}),{nodeDefs:{bloom:X,composite:k,sprite:K,tile:J,tileAtlas:ee,spritesheet:ie,fbTexture:ne,overlay:le},nodes:[],resources:{},canvas:t,device:i,context:n,clearValue:{r:0,g:0,b:0,a:1},viewport:{width:e,height:r,zoom:1,position:[0,0]}}}function mr(t,e){if(!t.nodeDefs[e?.type])throw new Error("Can't define a new node missing a type.");t.nodeDefs[e.type]=e}async function vr(t,e){if(!e.name)throw new Error("Can't create a resource node without a name property.");return t.resources[e.name]=await Ze(t,e),t.resources[e.name]}async function Ze(t,e){let r=t.nodeDefs[e?.type];if(!r)throw new Error("Can't initialize a new node missing a type.");let o=await r.onInit(t,e),i={type:e.type,refs:e.refs||{},options:e.options||{},data:o||{},enabled:!0},n=r.customFunctions||{};for(let a in n)i[a]=function(...u){return n[a](t,i,...u)};return t.nodes.push(i),i}function xr(t){let{device:e,context:r}=t,o=e.createCommandEncoder(),i=t.context.getCurrentTexture().createView(),n=0;for(let a of t.nodes){let u=t.nodeDefs[a.type];for(let s of u.refs)s.type==="webGpuTextureFrameView"&&(a.refs[s.name]=i);a.enabled&&(u.onRun(t,a,o,n),n++)}e.queue.submit([o.finish()])}function gr(t){for(let e in t.resources){let r=t.resources[e];t.nodeDefs[r.type].onDestroy(t,r)}t.resources={};for(let e of t.nodes)t.nodeDefs[e.type].onDestroy(t,e);t.nodes.length=0}function br(t,e,r){t.viewport.width=e,t.viewport.height=r;for(let o in t.resources){let i=t.resources[o];t.nodeDefs[i.type].onResize(t,i)}for(let o of t.nodes)t.nodeDefs[o.type].onResize(t,o)}function _r(t,e){t.viewport.position[0]=e[0]-t.viewport.width/2/t.viewport.zoom,t.viewport.position[1]=e[1]-t.viewport.height/2/t.viewport.zoom;for(let r in t.resources){let o=t.resources[r];t.nodeDefs[o.type].onViewportPosition(t,o)}for(let r of t.nodes)t.nodeDefs[r.type].onViewportPosition(t,r)}export{vr as addResourceNode,x as createTexture,mr as defineNode,xr as draw,dr as init,Ze as initNode,gr as reset,br as setViewportDimensions,_r as setViewportPosition};
