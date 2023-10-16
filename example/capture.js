/* eslint-disable @typescript-eslint/ban-types */
const origFnsByClass = new Map();
const isPromise = (p) => typeof p === 'object' && typeof p.then === 'function';
const mapClassToCreationFunctionNames = new Map();
// eslint-disable-next-line @typescript-eslint/no-unused-vars
let getUnwrappedDevice = (_) => undefined;
// eslint-disable-next-line @typescript-eslint/no-unused-vars
let setUnwrappedDevice = (wrapped, unwrapped) => { };
if (typeof GPUDevice !== 'undefined') {
    if (!GPUDevice.prototype.createBuffer.toString().includes('native')) {
        throw new Error('This must run before the context is wrapped!');
    }
    const webGPUClasses = [
        HTMLCanvasElement,
        GPU,
        GPUAdapter,
        GPUBuffer,
        GPUCommandEncoder,
        GPUCanvasContext,
        GPUDevice,
        GPUQuerySet,
        GPUQueue,
        GPURenderPassEncoder,
        GPURenderPipeline,
        GPUTexture,
    ];
    for (const Class of webGPUClasses) {
        const origFns = {};
        const proto = Class.prototype;
        for (const name in proto) {
            const props = Object.getOwnPropertyDescriptor(proto, name);
            if (!props?.writable || typeof proto[name] !== 'function') {
                continue;
            }
            origFns[name] = proto[name];
        }
        origFnsByClass.set(Class, origFns);
    }
    const cfn = [
        [GPU, ['requestAdapter']],
        [GPUAdapter, ['requestDevice']],
        [
            GPUDevice,
            [
                'createBuffer',
                'createTexture',
                'createSampler',
                'importExternalTexture',
                'createBindGroupLayout',
                'createPipelineLayout',
                'createBindGroup',
                'createShaderModule',
                'createComputePipeline',
                'createRenderPipeline',
                'createComputePipelineAsync',
                'createRenderPipelineAsync',
                'createCommandEncoder',
                'createRenderBundleEncoder',
                'createQuerySet',
            ],
        ],
        [GPUCommandEncoder, ['beginRenderPass', 'beginComputePass', 'finish']],
        [GPUCanvasContext, ['getCurrentTexture']],
        [GPUTexture, ['createView']],
    ];
    const classToCreationFunctionNames = (() => cfn.map(([Class, names]) => [Class, new Set(names)]))();
    classToCreationFunctionNames.forEach(pair => mapClassToCreationFunctionNames.set(...pair));
    const unwrappedDevices = new WeakMap();
    getUnwrappedDevice = (wrapped) => unwrappedDevices.get(wrapped);
    setUnwrappedDevice = (wrapped, unwrapped) => unwrappedDevices.set(wrapped, unwrapped);
}
/**
 * The prototype to this object may have been altered so we
 * put properties on the object itself with the original functions.
 *
 * @param result The result of a function call
 * @returns result with original methods added as properties
 */
function addOriginalFunctionsToResult(result) {
    if (typeof result !== 'object') {
        return result;
    }
    const Class = Object.getPrototypeOf(result).constructor;
    const origFns = origFnsByClass.get(Class);
    if (!origFns) {
        return result;
    }
    const createFns = mapClassToCreationFunctionNames.get(Class);
    for (const [fnName, origFn] of Object.entries(origFns)) {
        if (createFns && createFns.has(fnName)) {
            result[fnName] = function (...args) {
                const result = origFn.call(this, ...args);
                if (isPromise(result)) {
                    return result.then(addOriginalFunctionsToResult);
                }
                return addOriginalFunctionsToResult(result);
            };
        }
        else {
            result[fnName] = origFn;
        }
    }
    // Special case for device.queue
    if (result.queue && result.queue instanceof GPUQueue) {
        addOriginalFunctionsToResult(result.queue);
    }
    return result;
}
function callUnwrappedGPUFn(Class, obj, fnName, ...args) {
    const origFns = origFnsByClass.get(Class);
    const origFn = origFns[fnName];
    const result = origFn.call(obj, ...args);
    if (isPromise(result)) {
        return result.then(addOriginalFunctionsToResult);
    }
    return addOriginalFunctionsToResult(result);
}
function requestUnwrappedAdapter(options) {
    return callUnwrappedGPUFn(GPU, navigator.gpu, 'requestAdapter', options);
}
function getUnwrappedGPUCanvasContext(canvas, ...args) {
    return callUnwrappedGPUFn(HTMLCanvasElement, canvas, 'getContext', 'webgpu', ...args);
}
function getUnwrappedGPUDeviceFromWrapped(wrapped) {
    const unwrappedDevice = getUnwrappedDevice(wrapped);
    if (unwrappedDevice) {
        return unwrappedDevice;
    }
    const wrappedT = wrapped;
    const origFns = origFnsByClass.get(GPUDevice);
    const obj = {};
    for (const name in wrappedT) {
        const props = Object.getOwnPropertyDescriptor(wrappedT, name);
        if (!props?.writable || typeof wrappedT[name] !== 'function') {
            obj[name] = wrappedT[name];
        }
        else {
            const origFn = origFns[name];
            obj[name] = function (...args) {
                const result = origFn.call(this, ...args);
                if (isPromise(result)) {
                    return result.then(addOriginalFunctionsToResult);
                }
                return addOriginalFunctionsToResult(result);
            };
        }
    }
    setUnwrappedDevice(wrapped, obj);
    return obj;
}

const valueOr1 = (v) => (v === undefined ? 1 : v);
// TODO: fix
const isSequence = (v) => Symbol.iterator in Object(v);
function dimensionsFromGPUExtent3D(extent) {
    if (isSequence(extent)) {
        const iter = extent;
        return [1, 1, 1].map((_, ndx) => valueOr1(iter[ndx]));
    }
    else {
        const dict = extent;
        return [dict.width, dict.height, dict.depthOrArrayLayers].map(valueOr1);
    }
}
function gpuExtent3DDictFullFromGPUExtent3D(extent) {
    const [width, height, depthOrArrayLayers] = dimensionsFromGPUExtent3D(extent);
    return { width, height, depthOrArrayLayers };
}

/* eslint-disable @typescript-eslint/ban-types */
class ObjectRegistry {
    iterating;
    currentTraceSerial;
    dataMap;
    objects;
    constructor() {
        this.dataMap = new WeakMap();
        this.objects = [];
        this.currentTraceSerial = 0;
        this.iterating = false;
    }
    add(obj, data) {
        if (this.iterating) {
            throw new Error('Mutating Registry while iterating it.');
        }
        this.dataMap.set(obj, data);
        this.objects.push(new WeakRef(obj));
        data.webgpuObject = obj;
        data.traceSerial = this.currentTraceSerial;
        this.currentTraceSerial++;
    }
    has(obj) {
        return this.dataMap.has(obj);
    }
    get(obj) {
        return this.dataMap.get(obj);
    }
    prune() {
        if (this.iterating) {
            throw new Error('Mutating Registry while iterating it.');
        }
        this.objects = this.objects.filter(ref => ref.deref() !== undefined);
    }
    [Symbol.iterator]() {
        let i = 0;
        this.iterating = true;
        return {
            next: () => {
                while (i < this.objects.length) {
                    const obj = this.objects[i++].deref();
                    if (obj === undefined) {
                        continue;
                    }
                    return { value: this.get(obj), done: false };
                }
                this.iterating = false;
                return { done: true, value: null }; // TODO: Fix once I understand typescript
            },
        };
    }
}
class WebGPUDebugger {
    tracing = false;
    dataSerial = 0;
    inReentrantWebGPUOperations = false;
    adapters = new ObjectRegistry();
    bindGroups = new ObjectRegistry();
    bindGroupLayouts = new ObjectRegistry();
    buffers = new ObjectRegistry();
    commandBuffers = new ObjectRegistry();
    commandEncoders = new ObjectRegistry();
    canvasContexts = new ObjectRegistry();
    devices = new ObjectRegistry();
    pipelineLayouts = new ObjectRegistry();
    querySets = new ObjectRegistry();
    queues = new ObjectRegistry();
    renderPassEncoders = new ObjectRegistry();
    renderPipelines = new ObjectRegistry();
    samplers = new ObjectRegistry();
    shaderModules = new ObjectRegistry();
    textures = new ObjectRegistry();
    textureViews = new ObjectRegistry();
    adapterProto;
    bufferProto;
    commandEncoderProto;
    canvasContextProto;
    deviceProto;
    querySetProto;
    queueProto;
    renderPassEncoderProto;
    renderPipelineProto;
    textureProto;
    canvasGetContext;
    gpuRequestAdapter;
    trace;
    pendingTraceOperations = [];
    wrappers;
    constructor() {
        function replacePrototypeOf(c, registry) {
            const originalProto = {};
            for (const name in c.prototype) {
                const props = Object.getOwnPropertyDescriptor(c.prototype, name);
                if (!props?.writable || typeof c.prototype[name] !== 'function') {
                    continue;
                }
                const originalMethod = c.prototype[name];
                originalProto[name] = originalMethod;
                c.prototype[name] = function (...args) {
                    if (tracer.inReentrantWebGPUOperations) {
                        return originalMethod.apply(this, args);
                    }
                    const self = registry.get(this);
                    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                    // @ts-ignore
                    const fn = self[name];
                    if (!fn) {
                        console.assert(false, `Doesn't have "${name}"`);
                    }
                    return fn.call(self, ...args);
                };
            }
            return originalProto;
        }
        this.adapterProto = replacePrototypeOf(GPUAdapter, this.adapters);
        // GPUBindGroup doesn't have methods except the label setter?
        // GPUBindGroupLayout doesn't have methods except the label setter?
        this.bufferProto = replacePrototypeOf(GPUBuffer, this.buffers);
        // GPUCommandBuffer doesn't have methods except the label setter?
        this.commandEncoderProto = replacePrototypeOf(GPUCommandEncoder, this.commandEncoders);
        this.canvasContextProto = replacePrototypeOf(GPUCanvasContext, this.canvasContexts);
        this.deviceProto = replacePrototypeOf(GPUDevice, this.devices);
        // GPUPipelineLayout doesn't have methods except the label setter?
        this.querySetProto = replacePrototypeOf(GPUQuerySet, this.querySets);
        this.queueProto = replacePrototypeOf(GPUQueue, this.queues);
        this.renderPassEncoderProto = replacePrototypeOf(GPURenderPassEncoder, this.renderPassEncoders);
        this.renderPipelineProto = replacePrototypeOf(GPURenderPipeline, this.renderPipelines);
        // GPUSampler doesn't have methods except the label setter?
        // TODO shader module prototype
        this.textureProto = replacePrototypeOf(GPUTexture, this.textures);
        // GPUTextureView doesn't have methods except the label setter?
        // Special case replacements
        this.canvasGetContext = HTMLCanvasElement.prototype.getContext;
        HTMLCanvasElement.prototype.getContext = function (type, ...args) {
            const context = tracer.canvasGetContext.call(this, type, ...args);
            if (type === 'webgpu') {
                tracer.registerObjectIn('canvasContexts', context, new CanvasContextState(this));
            }
            return context;
        };
        this.gpuRequestAdapter = GPU.prototype.requestAdapter;
        GPU.prototype.requestAdapter = async function (options, ...args) {
            const adapter = await tracer.gpuRequestAdapter.call(this, options, ...args);
            tracer.registerObjectIn('adapters', adapter, new AdapterState(options)); // TODO deep copy options
            return adapter;
        };
        // Save everything we wrapped for re-wrapping
        this.wrappers = {
            classes: [
                { Class: GPUAdapter, proto: this.adapterProto, wrappers: {} },
                { Class: GPUBuffer, proto: this.bufferProto, wrappers: {} },
                { Class: GPUCommandEncoder, proto: this.commandEncoderProto, wrappers: {} },
                { Class: GPUCanvasContext, proto: this.canvasContextProto, wrappers: {} },
                { Class: GPUDevice, proto: this.deviceProto, wrappers: {} },
                { Class: GPUQuerySet, proto: this.querySetProto, wrappers: {} },
                { Class: GPUQueue, proto: this.queueProto, wrappers: {} },
                { Class: GPURenderPassEncoder, proto: this.renderPassEncoderProto, wrappers: {} },
                { Class: GPURenderPipeline, proto: this.renderPipelineProto, wrappers: {} },
                { Class: GPUTexture, proto: this.textureProto, wrappers: {} },
            ],
            getContextWrapper: HTMLCanvasElement.prototype.getContext,
            requestAdaptorWrapper: GPU.prototype.requestAdapter,
        };
        const saveEntryPoints = ({ Class, proto, wrappers }) => {
            for (const name in proto) {
                wrappers[name] = Class.prototype[name];
            }
        };
        this.wrappers.classes.forEach(saveEntryPoints);
    }
    wrapEntryPoints() {
        const setEntryPointsToWrappers = ({ Class, proto, wrappers }) => {
            for (const name in proto) {
                Class.prototype[name] = wrappers[name];
            }
        };
        this.wrappers.classes.forEach(setEntryPointsToWrappers);
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        HTMLCanvasElement.prototype.getContext = this.wrappers.getContextWrapper;
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        GPU.prototype.requestAdaptor = this.wrappers.requestAdaptorWrapper;
    }
    // For now we don't support all entrypoints, which breaks the replay, here's a method to put regular entrypoints back.
    revertEntryPoints() {
        const revertEntryPoints = ({ Class, proto }) => {
            for (const name in proto) {
                Class.prototype[name] = proto[name];
            }
        };
        this.wrappers.classes.forEach(revertEntryPoints);
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        HTMLCanvasElement.prototype.getContext = this.canvasGetContext;
        GPU.prototype.requestAdapter = this.gpuRequestAdapter;
    }
    /**
     * Do not call this function outside of this file.
     * If you want to use webgpu without your calls being inspected call one or more
     * of
     *
     * * requestUnwrappedAdapter (instead of navigator.gpu.requestAdapter)
     * * getUnwrappedGPUCanvasContext (instead of someCanvas.getContext('webgpu'))
     * * getUnwrappedGPUDeviceFromWrapped (if you have a wrapped device)
     *
     * Note: The device attached to `ReplayDevice` is already unwrapped and is
     * safe to call.
     *
     * @param f
     */
    doWebGPUOp(f) {
        this.inReentrantWebGPUOperations = true;
        f();
        this.inReentrantWebGPUOperations = false;
    }
    // TODO add support for prune all.
    // TODO make something to trace easily instead of start stop trace.
    startTracing() {
        function serializeAllObjects(registry) {
            const result = {};
            for (const obj of registry) {
                const serializedObj = obj.serialize();
                if (obj.label) {
                    serializedObj.label = obj.label;
                }
                result[obj.traceSerial] = serializedObj;
            }
            return result;
        }
        // Yuck
        function serializeAsyncAllObjects(registry, pendingPromises) {
            const result = {};
            // TODO have some context where objects can ask for a device?
            for (const obj of registry) {
                pendingPromises.push(obj.serializeAsync().then(serializedObj => {
                    if (obj.label) {
                        serializedObj.label = obj.label;
                    }
                    result[obj.traceSerial] = serializedObj;
                }));
            }
            return result;
        }
        this.tracing = true;
        this.pendingTraceOperations = [];
        this.trace = {
            objects: {
                adapters: serializeAllObjects(this.adapters),
                bindGroups: serializeAllObjects(this.bindGroups),
                bindGroupLayouts: serializeAllObjects(this.bindGroupLayouts),
                buffers: serializeAsyncAllObjects(this.buffers, this.pendingTraceOperations),
                commandBuffers: serializeAllObjects(this.commandBuffers),
                commandEncoders: {},
                canvasContexts: {},
                devices: serializeAllObjects(this.devices),
                pipelineLayouts: serializeAllObjects(this.pipelineLayouts),
                querySets: serializeAllObjects(this.querySets),
                queues: serializeAllObjects(this.queues),
                samplers: serializeAllObjects(this.samplers),
                renderPassEncoders: {},
                renderPipelines: serializeAllObjects(this.renderPipelines),
                shaderModules: serializeAllObjects(this.shaderModules),
                textures: serializeAsyncAllObjects(this.textures, this.pendingTraceOperations),
                textureViews: serializeAllObjects(this.textureViews),
            },
            commands: [],
            data: {},
        };
    }
    async endTracing() {
        // No more commands are recorded except presents
        this.tracing = false;
        // TODO deep copy what we currently have? We risk changing state with future operations.
        await Promise.all(this.pendingTraceOperations);
        return this.trace;
    }
    recordingTrace() {
        return this.tracing;
    }
    addPendingTraceOperation(promise) {
        console.assert(this.tracing || this.pendingTraceOperations.length > 0);
        this.pendingTraceOperations.push(promise);
    }
    traceCommand(command) {
        console.assert(this.tracing || this.pendingTraceOperations.length > 0);
        this.trace.commands.push(command);
    }
    traceData(buffer, offset, size) {
        console.assert(this.tracing || this.pendingTraceOperations.length > 0);
        offset ??= 0;
        size ??= buffer.byteLength - offset;
        const byteArray = new Uint8Array(buffer, offset, size);
        // Worst serialization ever!
        this.trace.data[this.dataSerial] = Array.from(byteArray);
        const dataRef = {
            size,
            serial: this.dataSerial,
        };
        this.dataSerial++;
        return dataRef;
    }
    registerObjectIn(typePlural, webgpuObject, state) {
        // TODO: fixing these 2 lines to be typescript happy seems like a bunch of
        // work. You'd probably have to put both the first collections and the second
        // in some map/record of named collections
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        this[typePlural].add(webgpuObject, state);
        if (this.tracing) {
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            this.trace.objects[typePlural][state.traceSerial] = state.serialize();
        }
    }
    async traceFrame() {
        this.startTracing();
        await new Promise(resolve => {
            requestAnimationFrame(() => {
                setTimeout(() => {
                    resolve();
                }, 0);
            });
        });
        return await this.endTracing();
    }
}
const tracer = new WebGPUDebugger();
class BaseState {
    webgpuObject;
    traceSerial;
    label;
    constructor(desc) {
        // TODO what about the setter for labels?
        if (desc && desc.label) {
            this.label = desc.label;
        }
        this.webgpuObject = null;
        this.traceSerial = -1;
    }
}
class AdapterState extends BaseState {
    // TODO: do we need the adaptor options?
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    constructor(options) {
        super({});
    }
    serialize() {
        return {};
    }
    async requestDevice(desc) {
        const device = await tracer.adapterProto.requestDevice.call(this.webgpuObject, desc);
        tracer.registerObjectIn('devices', device, new DeviceState(this, desc ?? {}));
        tracer.registerObjectIn('queues', device.queue, new QueueState(tracer.devices.get(device), {} /*TODO desc*/));
        return device;
    }
    destroy() {
        // TODO: handle this
    }
}
class BindGroupState extends BaseState {
    device;
    layout;
    entries;
    constructor(device, desc) {
        super(desc);
        this.device = device;
        this.layout = tracer.bindGroupLayouts.get(desc.layout);
        this.entries = desc.entries.map(e => {
            const entry = { binding: e.binding };
            const textureViewState = tracer.textureViews.get(e.resource);
            if (textureViewState) {
                entry.textureView = textureViewState;
            }
            else {
                const samplerState = tracer.samplers.get(e.resource);
                if (samplerState) {
                    entry.sampler = samplerState;
                }
                else {
                    const bufferBinding = e.resource;
                    if (bufferBinding.buffer !== undefined) {
                        const bufferState = tracer.buffers.get(bufferBinding.buffer);
                        entry.buffer = bufferState;
                        entry.offset = bufferBinding.offset ?? 0;
                        entry.size = bufferBinding.size ?? Math.max(0, bufferState.size - entry.offset);
                    }
                    else {
                        console.assert(false, 'Unhandled binding type.');
                    }
                }
            }
            return entry;
        });
    }
    serialize() {
        return {
            deviceSerial: this.device.traceSerial,
            layoutSerial: this.layout.traceSerial,
            entries: this.entries.map(e => {
                const entry = { binding: e.binding };
                if (e.textureView !== undefined) {
                    entry.textureViewSerial = e.textureView.traceSerial;
                }
                if (e.sampler !== undefined) {
                    entry.samplerSerial = e.sampler.traceSerial;
                }
                if (e.buffer !== undefined) {
                    entry.bufferSerial = e.buffer.traceSerial;
                    entry.offset = e.offset;
                    entry.size = e.size;
                }
                return entry;
            }),
        };
    }
}
class BindGroupLayoutState extends BaseState {
    device;
    implicit;
    entries;
    parentRenderPipeline;
    pipelineGroupIndex;
    constructor(device, desc) {
        const implicitDesc = desc;
        const explicitDesc = desc;
        super(implicitDesc.implicit ? undefined : explicitDesc);
        this.device = device;
        // TODO: this is confusing. Sometimes this is called with a GPUBindGroupLayoutDescriptor
        // and sometimes it's called from RenderPipelineState.getBindGroupLayout with entirely
        // different parameters. Should this be refactored?
        this.implicit = implicitDesc.implicit;
        if (this.implicit) {
            this.parentRenderPipeline = implicitDesc.renderPipeline;
            this.pipelineGroupIndex = implicitDesc.groupIndex;
            return;
        }
        this.entries = explicitDesc.entries.map(e => {
            const entry = { binding: e.binding, visibility: e.visibility };
            if (e.buffer) {
                entry.buffer = {
                    type: e.buffer.type ?? 'uniform',
                    hasDynamicOffset: e.buffer.hasDynamicOffset ?? false,
                    minBindingSize: e.buffer.minBindingSize ?? 0,
                };
            }
            if (e.sampler) {
                entry.sampler = {
                    type: e.sampler.type ?? 'filtering',
                };
            }
            if (e.texture) {
                entry.texture = {
                    sampleType: e.texture.sampleType ?? 'float',
                    viewDimension: e.texture.viewDimension ?? '2d',
                    multisampled: e.texture.multisampled ?? false,
                };
            }
            if (e.storageTexture) {
                entry.storageTexture = {
                    access: e.storageTexture.access ?? 'write-only',
                    format: e.storageTexture.format,
                    viewDimension: e.storageTexture.viewDimension ?? '2d',
                };
            }
            if (e.externalTexture) {
                entry.externalTexture = {};
            }
            return entry;
        });
    }
    serialize() {
        if (this.implicit) {
            const b = {
                deviceSerial: this.device.traceSerial,
                renderPipelineSerial: this.parentRenderPipeline.traceSerial,
                groupIndex: this.pipelineGroupIndex,
            };
            return b;
        }
        else {
            const b = {
                deviceSerial: this.device.traceSerial,
                entries: this.entries, // TODO deep copy?
            };
            return b;
        }
    }
}
class BufferState extends BaseState {
    device;
    usage;
    size;
    state;
    mappedRanges;
    constructor(device, desc) {
        super(desc);
        this.device = device;
        this.usage = desc.usage;
        this.size = desc.size;
        this.state = desc.mappedAtCreation ? 'mapped-at-creation' : 'unmapped';
        this.mappedRanges = [];
    }
    async serializeAsync() {
        // Always serialize the creation parameters and add the initial data if possible.
        const result = this.serialize();
        // TODO handle mappable buffers.
        if ((this.usage & (GPUBufferUsage.MAP_READ | GPUBufferUsage.MAP_WRITE)) !== 0) {
            return result;
        }
        // Immediately copy the buffer contents to save its initial data to the side.
        let initialDataBuffer;
        let mapPromise = null;
        tracer.doWebGPUOp(() => {
            initialDataBuffer = this.device.webgpuObject?.createBuffer({
                size: this.size,
                usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ,
            });
            // TODO pool encoders?
            const encoder = this.device.webgpuObject.createCommandEncoder();
            encoder.copyBufferToBuffer(this.webgpuObject, 0, initialDataBuffer, 0, this.size);
            this.device.webgpuObject.queue.submit([encoder.finish()]);
            mapPromise = initialDataBuffer.mapAsync(GPUMapMode.READ);
        });
        await mapPromise;
        tracer.doWebGPUOp(() => {
            const data = initialDataBuffer.getMappedRange();
            result.initialData = tracer.traceData(data, 0, this.size);
            initialDataBuffer.destroy();
        });
        return result;
    }
    serialize() {
        // Still called on creation during the trace
        return {
            deviceSerial: this.device.traceSerial,
            usage: this.usage,
            size: this.size,
            state: this.state,
        };
    }
    mapAsync(mode, offset, size) {
        offset ??= 0;
        size ??= Math.max(this.size - offset);
        const promise = tracer.bufferProto.mapAsync.call(this.webgpuObject, mode, offset, size);
        return promise;
    }
    getMappedRange(offset, size) {
        offset ??= 0;
        size ??= Math.max(this.size - offset);
        const arrayBuf = tracer.bufferProto.getMappedRange.call(this.webgpuObject, offset, size);
        this.mappedRanges.push({ arrayBuf, offset, size });
        return arrayBuf;
    }
    unmap() {
        if (tracer.recordingTrace()) {
            tracer.traceCommand({
                name: 'bufferUpdateData',
                deviceSerial: this.device.traceSerial,
                bufferSerial: this.traceSerial,
                updates: this.mappedRanges.map(({ arrayBuf, offset, size }) => {
                    return {
                        data: tracer.traceData(arrayBuf, 0, size),
                        offset,
                        size,
                    };
                }),
            });
            tracer.traceCommand({
                name: 'bufferUnmap',
                bufferSerial: this.traceSerial,
            });
        }
        tracer.bufferProto.unmap.call(this.webgpuObject);
        this.mappedRanges = [];
    }
    destroy() {
        tracer.bufferProto.destroy.call(this.webgpuObject);
        this.mappedRanges = [];
    }
}
class CommandBufferState extends BaseState {
    device;
    commands;
    constructor(encoder, desc) {
        super(desc);
        this.device = encoder.device;
        this.commands = encoder.commands;
        // TODO get commands?
    }
    serialize() {
        return { commands: this.commands, deviceSerial: this.device.traceSerial };
    }
}
class CommandEncoderState extends BaseState {
    device;
    commands;
    referencedObjects;
    constructor(device, desc) {
        super(desc);
        this.device = device;
        this.commands = [];
        this.referencedObjects = new Set();
    }
    serialize() {
        return {};
    }
    reference(object) {
        this.referencedObjects.add(object);
    }
    addCommand(command) {
        this.commands.push(command);
    }
    beginRenderPass(desc) {
        const pass = tracer.commandEncoderProto.beginRenderPass.call(this.webgpuObject, desc);
        tracer.registerObjectIn('renderPassEncoders', pass, new RenderPassEncoderState(this, desc));
        return pass;
    }
    copyTextureToTexture(source, destination, copySize) {
        tracer.commandEncoderProto.copyTextureToTexture.call(this.webgpuObject, source, destination, copySize);
        this.addCommand({
            name: 'copyTextureToTexture',
            args: {
                source: {
                    textureSerial: tracer.textures.get(source.texture).traceSerial,
                    mipLevel: source.mipLevel ?? 0,
                    origin: source.origin ?? {},
                    aspect: source.aspect ?? 'all',
                },
                destination: {
                    textureSerial: tracer.textures.get(destination.texture).traceSerial,
                    mipLevel: destination.mipLevel ?? 0,
                    origin: destination.origin ?? {},
                    aspect: destination.aspect ?? 'all',
                },
                copySize, // TODO copy
            },
        });
        this.reference(source.texture);
        this.reference(destination.texture);
    }
    copyBufferToTexture(source, destination, copySize) {
        tracer.commandEncoderProto.copyBufferToTexture.call(this.webgpuObject, source, destination, copySize);
        this.addCommand({
            name: 'copyBufferToTexture',
            args: {
                source: {
                    bufferSerial: tracer.buffers.get(source.buffer).traceSerial,
                    offset: source.offset ?? 0,
                    bytesPerRow: source.bytesPerRow,
                    rowsPerImage: source.rowsPerImage,
                },
                destination: {
                    textureSerial: tracer.textures.get(destination.texture).traceSerial,
                    mipLevel: destination.mipLevel ?? 0,
                    origin: destination.origin ?? {},
                    aspect: destination.aspect ?? 'all',
                },
                copySize, // TODO copy
            },
        });
        this.reference(source.buffer);
        this.reference(destination.texture);
    }
    copyBufferToBuffer(source, sourceOffset, destination, destinationOffset, size) {
        tracer.commandEncoderProto.copyBufferToBuffer.call(this.webgpuObject, source, sourceOffset, destination, destinationOffset, size);
        this.addCommand({
            name: 'copyBufferToBuffer',
            args: {
                sourceSerial: tracer.buffers.get(source).traceSerial,
                sourceOffset,
                destinationSerial: tracer.buffers.get(destination).traceSerial,
                destinationOffset,
                size,
            },
        });
        this.reference(source);
        this.reference(destination);
    }
    copyTextureToBuffer(source, destination, copySize) {
        tracer.commandEncoderProto.copyTextureToBuffer.call(this.webgpuObject, source, destination, copySize);
        this.addCommand({
            name: 'copyTextureToBuffer',
            args: {
                source: {
                    textureSerial: tracer.textures.get(source.texture).traceSerial,
                    mipLevel: source.mipLevel ?? 0,
                    origin: source.origin ?? {},
                    aspect: source.aspect ?? 'all',
                },
                destination: {
                    bufferSerial: tracer.buffers.get(destination.buffer).traceSerial,
                    offset: destination.offset ?? 0,
                    bytesPerRow: destination.bytesPerRow,
                    rowsPerImage: destination.rowsPerImage,
                },
                copySize, // TODO copy
            },
        });
        this.reference(source.texture);
        this.reference(destination.buffer);
    }
    finish(desc) {
        const commandBuffer = tracer.commandEncoderProto.finish.call(this.webgpuObject, desc);
        tracer.registerObjectIn('commandBuffers', commandBuffer, new CommandBufferState(this, desc ?? {}));
        return commandBuffer;
    }
    popDebugGroup() {
        tracer.commandEncoderProto.popDebugGroup.call(this.webgpuObject);
        this.addCommand({ name: 'popDebugGroup' });
    }
    pushDebugGroup(groupLabel) {
        tracer.commandEncoderProto.pushDebugGroup.call(this.webgpuObject, groupLabel);
        this.addCommand({
            name: 'pushDebugGroup',
            args: {
                groupLabel,
            },
        });
    }
}
class CanvasContextState extends BaseState {
    canvas;
    getCurrentTextureCount;
    device;
    format = 'rgba8unorm';
    usage = 0;
    viewFormats = [];
    colorSpace = '';
    alphaMode = '';
    constructor(canvas) {
        super({});
        this.canvas = canvas;
        this.getCurrentTextureCount = 0;
    }
    configure(config) {
        this.device = tracer.devices.get(config.device);
        this.format = config.format;
        this.usage = config.usage ?? GPUTextureUsage.RENDER_ATTACHMENT;
        // TODO: remove
        this.usage |= GPUTextureUsage.TEXTURE_BINDING;
        this.viewFormats = config.viewFormats ?? []; // TODO clone the inside
        this.colorSpace = config.colorSpace ?? 'srgb';
        this.alphaMode = config.alphaMode ?? 'opaque';
        tracer.canvasContextProto.configure.call(this.webgpuObject, {
            device: this.device.webgpuObject,
            format: this.format,
            usage: this.usage | GPUTextureUsage.COPY_SRC | GPUTextureUsage.COPY_DST | GPUTextureUsage.TEXTURE_BINDING,
            viewFormats: this.viewFormats,
            colorSpace: this.colorSpace,
            alphaMode: this.alphaMode,
        });
    }
    unconfigure() {
        tracer.canvasContextProto.unconfigure.call(this.webgpuObject);
    }
    getCurrentTexture() {
        const texture = tracer.canvasContextProto.getCurrentTexture.call(this.webgpuObject);
        const textureState = new TextureState(this.device, {
            format: this.format,
            size: { width: this.canvas.width, height: this.canvas.height, depthOrArrayLayers: 1 },
            usage: this.usage,
            viewFormats: this.viewFormats,
        }, 
        /* swapChainId */ `gct: ${this.canvas.id || '*'}-${this.getCurrentTextureCount++}`);
        tracer.registerObjectIn('textures', texture, textureState);
        // Mark the texture as presented right after the animation frame.
        const recordingThePresent = tracer.recordingTrace();
        const presentPromise = new Promise(resolve => {
            requestAnimationFrame(() => {
                setTimeout(() => {
                    if (recordingThePresent) {
                        tracer.traceCommand({
                            name: 'present',
                            args: { canvasContextSerial: this.traceSerial, textureSerial: textureState.traceSerial },
                        });
                    }
                    textureState.onPresent();
                    resolve();
                }, 0);
            });
        });
        if (recordingThePresent) {
            tracer.addPendingTraceOperation(presentPromise);
        }
        return texture;
    }
}
class DeviceState extends BaseState {
    adapter;
    constructor(adapter, desc) {
        super(desc);
        this.adapter = adapter;
    }
    serialize() {
        return { adapterSerial: this.adapter.traceSerial };
    }
    createBindGroup(desc) {
        const bg = tracer.deviceProto.createBindGroup.call(this.webgpuObject, desc);
        tracer.registerObjectIn('bindGroups', bg, new BindGroupState(this, desc));
        return bg;
    }
    createBindGroupLayout(desc) {
        const bgl = tracer.deviceProto.createBindGroupLayout.call(this.webgpuObject, desc);
        tracer.registerObjectIn('bindGroupLayouts', bgl, new BindGroupLayoutState(this, desc));
        return bgl;
    }
    createBuffer(desc) {
        let newUsage = desc.usage;
        if ((desc.usage & (GPUBufferUsage.MAP_READ | GPUBufferUsage.MAP_WRITE)) === 0) {
            newUsage = desc.usage | GPUBufferUsage.COPY_SRC | GPUBufferUsage.COPY_DST;
        }
        const buffer = tracer.deviceProto.createBuffer.call(this.webgpuObject, {
            ...desc,
            usage: newUsage,
        });
        tracer.registerObjectIn('buffers', buffer, new BufferState(this, desc));
        return buffer;
    }
    createCommandEncoder(desc) {
        const encoder = tracer.deviceProto.createCommandEncoder.call(this.webgpuObject, desc);
        tracer.registerObjectIn('commandEncoders', encoder, new CommandEncoderState(this, desc ?? {}));
        return encoder;
    }
    createPipelineLayout(desc) {
        const layout = tracer.deviceProto.createPipelineLayout.call(this.webgpuObject, desc);
        tracer.registerObjectIn('pipelineLayouts', layout, new PipelineLayoutState(this, desc));
        return layout;
    }
    createQuerySet(desc) {
        // TODO modify the desc for non-mappable buffers, see what to do for mappable.
        const querySet = tracer.deviceProto.createQuerySet.call(this.webgpuObject, desc);
        tracer.registerObjectIn('querySets', querySet, new QuerySetState(this, desc));
        return querySet;
    }
    createRenderPipeline(desc) {
        const pipeline = tracer.deviceProto.createRenderPipeline.call(this.webgpuObject, desc);
        tracer.registerObjectIn('renderPipelines', pipeline, new RenderPipelineState(this, desc));
        return pipeline;
    }
    createSampler(desc) {
        const module = tracer.deviceProto.createSampler.call(this.webgpuObject, desc);
        tracer.registerObjectIn('samplers', module, new SamplerState(this, desc ?? {}));
        return module;
    }
    createShaderModule(desc) {
        const module = tracer.deviceProto.createShaderModule.call(this.webgpuObject, desc);
        tracer.registerObjectIn('shaderModules', module, new ShaderModuleState(this, desc));
        return module;
    }
    createTexture(desc) {
        const texture = tracer.deviceProto.createTexture.call(this.webgpuObject, {
            ...desc,
            usage: desc.usage | GPUTextureUsage.COPY_SRC | GPUTextureUsage.COPY_DST | GPUTextureUsage.TEXTURE_BINDING,
        });
        tracer.registerObjectIn('textures', texture, new TextureState(this, desc, /*swapChainId*/ ''));
        return texture;
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    pushErrorScope(_filter) {
        // TODO: implement
    }
    popErrorScope() {
        // TODO: implement
        return Promise.resolve(null);
    }
    destroy() {
        // TODO: implement
    }
}
class PipelineLayoutState extends BaseState {
    device;
    bindGroupLayouts;
    constructor(device, desc) {
        super(desc);
        this.device = device;
        this.bindGroupLayouts = desc.bindGroupLayouts.map(bgl => {
            return tracer.bindGroupLayouts.get(bgl);
        });
    }
    serialize() {
        return {
            deviceSerial: this.device.traceSerial,
            bindGroupLayoutsSerial: this.bindGroupLayouts.map(bgl => bgl.traceSerial),
        };
    }
}
class QuerySetState extends BaseState {
    device;
    type;
    count;
    state;
    constructor(device, desc) {
        super(desc);
        this.device = device;
        this.type = desc.type;
        this.count = desc.count;
        this.state = 'valid';
    }
    serialize() {
        return {
            deviceSerial: this.device.traceSerial,
            type: this.type,
            count: this.count,
            state: this.state,
            // TODO what about the data it contains ????
        };
    }
}
class QueueState extends BaseState {
    device;
    constructor(device, desc) {
        super(desc);
        this.device = device;
    }
    serialize() {
        return { deviceSerial: this.device.traceSerial };
    }
    serializeWriteData(data, offset, size) {
        offset ??= 0;
        if (data instanceof ArrayBuffer) {
            size = size ?? data.byteLength - offset;
            return tracer.traceData(data, offset, size);
        }
        else {
            const typedData = data;
            size = size ?? typedData.length - offset;
            return tracer.traceData(data.buffer, offset * typedData.BYTES_PER_ELEMENT, size * typedData.BYTES_PER_ELEMENT);
        }
    }
    writeBuffer(buffer, bufferOffset, data, dataOffset, size) {
        tracer.queueProto.writeBuffer.call(this.webgpuObject, buffer, bufferOffset, data, dataOffset, size);
        if (!tracer.recordingTrace()) {
            return;
        }
        const serializedData = this.serializeWriteData(data, dataOffset, size);
        tracer.traceCommand({
            name: 'queueWriteBuffer',
            queueSerial: this.traceSerial,
            args: {
                bufferSerial: tracer.buffers.get(buffer).traceSerial,
                bufferOffset,
                data: serializedData,
            },
        });
    }
    writeTexture(destination, data, dataLayout, size) {
        tracer.queueProto.writeTexture.call(this.webgpuObject, destination, data, dataLayout, size);
        if (!tracer.recordingTrace()) {
            return;
        }
        const serializedData = this.serializeWriteData(data, dataLayout.offset || 0, undefined /*TODO guess the correct size based on the format / size??*/);
        tracer.traceCommand({
            name: 'queueWriteTexture',
            queueSerial: this.traceSerial,
            args: {
                destination: {
                    textureSerial: tracer.textures.get(destination.texture).traceSerial,
                    mipLevel: destination.mipLevel ?? 0,
                    origin: destination.origin ?? {},
                    aspect: destination.aspect ?? 'all',
                },
                data: serializedData,
                dataLayout: {
                    offset: 0,
                    bytesPerRow: dataLayout.bytesPerRow,
                    rowsPerImage: dataLayout.rowsPerImage,
                },
                size, // TODO copy
            },
        });
    }
    copyExternalImageToTexture(source, destination, copySize) {
        tracer.queueProto.copyExternalImageToTexture.call(this.webgpuObject, source, destination, copySize);
        if (!tracer.recordingTrace()) {
            return;
        }
        // TODO implement me!
        console.assert(false);
    }
    onSubmittedWorkDone() {
        // TODO: do we need anything here?
        const promise = tracer.queueProto.onSubmittedWorkDone.call(this.webgpuObject);
        return promise;
    }
    submit(commandBuffers) {
        tracer.queueProto.submit.call(this.webgpuObject, commandBuffers);
        if (!tracer.recordingTrace()) {
            return;
        }
        tracer.traceCommand({
            name: 'queueSubmit',
            queueSerial: this.traceSerial,
            args: { commandBufferSerials: commandBuffers.map(c => tracer.commandBuffers.get(c).traceSerial) },
        });
    }
}
class RenderPassEncoderState extends BaseState {
    encoder;
    constructor(encoder, desc) {
        super(desc);
        this.encoder = encoder;
        const serializeDesc = {
            colorAttachments: desc.colorAttachments.map(a => {
                this.encoder.reference(a.view);
                this.encoder.reference(a.resolveTarget);
                return {
                    viewSerial: tracer.textureViews.get(a.view).traceSerial,
                    resolveTargetSerial: a.resolveTarget
                        ? tracer.textureViews.get(a.resolveTarget).traceSerial
                        : undefined,
                    clearValue: (a.clearValue ?? { r: 0, g: 0, b: 0, a: 0 }),
                    loadOp: a.loadOp,
                    storeOp: a.storeOp,
                };
            }),
            timestampWrites: (desc.timestampWrites ?? []).map(w => {
                this.encoder.reference(w.querySet);
                return {
                    querySetSerial: tracer.querySets.get(w.querySet).traceSerial,
                    queryIndex: w.queryIndex,
                    location: w.location,
                };
            }),
            occlusionQuerySetSerial: desc.occlusionQuerySet
                ? tracer.querySets.get(desc.occlusionQuerySet).traceSerial
                : undefined,
            maxDrawCount: desc.maxDrawCount ?? 50000000, // Yes that's the spec default.
        };
        this.encoder.reference(desc.occlusionQuerySet);
        const ds = desc.depthStencilAttachment;
        if (ds !== undefined) {
            this.encoder.reference(ds.view);
            serializeDesc.depthStencilAttachment = {
                viewSerial: tracer.textureViews.get(ds.view).traceSerial,
                depthClearValue: ds.depthClearValue ?? 0,
                depthLoadOp: ds.depthLoadOp,
                depthStoreOp: ds.depthStoreOp,
                depthReadOnly: ds.depthReadOnly ?? false,
                stencilClearValue: ds.stencilClearValue ?? 0,
                stencilLoadOp: ds.stencilLoadOp,
                stencilStoreOp: ds.stencilStoreOp,
                stencilReadOnly: ds.stencilReadOnly ?? false,
            };
        }
        this.encoder.addCommand({
            name: 'beginRenderPass',
            args: serializeDesc,
        });
    }
    serialize() {
        return {};
    }
    draw(vertexCount, instanceCount, firstVertex, firstInstance) {
        tracer.renderPassEncoderProto.draw.call(this.webgpuObject, vertexCount, instanceCount, firstVertex, firstInstance);
        this.encoder.addCommand({
            name: 'draw',
            args: {
                vertexCount,
                instanceCount: instanceCount ?? 1,
                firstVertex: firstVertex ?? 0,
                firstInstance: firstInstance ?? 0,
            },
        });
    }
    drawIndexed(indexCount, instanceCount, firstIndex, baseVertex, firstInstance) {
        tracer.renderPassEncoderProto.drawIndexed.call(this.webgpuObject, indexCount, instanceCount, firstIndex, baseVertex, firstInstance);
        this.encoder.addCommand({
            name: 'drawIndexed',
            args: {
                indexCount,
                instanceCount: instanceCount ?? 1,
                firstIndex: firstIndex ?? 0,
                baseVertex: baseVertex ?? 0,
                firstInstance: firstInstance ?? 0,
            },
        });
    }
    popDebugGroup() {
        tracer.renderPassEncoderProto.popDebugGroup.call(this.webgpuObject);
        this.encoder.addCommand({ name: 'popDebugGroup' });
    }
    pushDebugGroup(groupLabel) {
        tracer.renderPassEncoderProto.pushDebugGroup.call(this.webgpuObject, groupLabel);
        this.encoder.addCommand({
            name: 'pushDebugGroup',
            args: {
                groupLabel,
            },
        });
    }
    setBindGroup(index, bindGroup, dynamicOffsets) {
        if (dynamicOffsets !== undefined) {
            console.assert(false, "Don't know how to handle dynamic bindgroups yet.");
        }
        tracer.renderPassEncoderProto.setBindGroup.call(this.webgpuObject, index, bindGroup);
        this.encoder.reference(bindGroup);
        this.encoder.addCommand({
            name: 'setBindGroup',
            args: {
                index,
                bindGroupSerial: tracer.bindGroups.get(bindGroup).traceSerial,
                dynamicOffsets: window.structuredClone(dynamicOffsets),
            },
        });
    }
    setIndexBuffer(buffer, indexFormat, offset, size) {
        tracer.renderPassEncoderProto.setIndexBuffer.call(this.webgpuObject, buffer, indexFormat, offset, size);
        this.encoder.reference(buffer);
        const bufferState = tracer.buffers.get(buffer);
        offset = offset ?? 0;
        size = size ?? Math.max(0, bufferState.size - offset);
        this.encoder.addCommand({
            name: 'setIndexBuffer',
            args: {
                bufferSerial: bufferState.traceSerial,
                indexFormat,
                offset,
                size,
            },
        });
    }
    setPipeline(pipeline) {
        tracer.renderPassEncoderProto.setPipeline.call(this.webgpuObject, pipeline);
        this.encoder.reference(pipeline);
        this.encoder.addCommand({
            name: 'setPipeline',
            args: {
                pipelineSerial: tracer.renderPipelines.get(pipeline).traceSerial,
            },
        });
    }
    setVertexBuffer(slot, buffer, offset, size) {
        tracer.renderPassEncoderProto.setVertexBuffer.call(this.webgpuObject, slot, buffer, offset, size);
        this.encoder.reference(buffer);
        const bufferState = tracer.buffers.get(buffer);
        offset = offset ?? 0;
        size = size ?? Math.max(0, bufferState.size - offset);
        this.encoder.addCommand({
            name: 'setVertexBuffer',
            args: {
                slot,
                bufferSerial: bufferState.traceSerial,
                offset,
                size,
            },
        });
    }
    setScissorRect(x, y, width, height) {
        tracer.renderPassEncoderProto.setScissorRect.call(this.webgpuObject, x, y, width, height);
        this.encoder.addCommand({
            name: 'setScissorRect',
            args: { x, y, width, height },
        });
    }
    setViewport(x, y, width, height, minDepth, maxDepth) {
        tracer.renderPassEncoderProto.setViewport.call(this.webgpuObject, x, y, width, height, minDepth, maxDepth);
        this.encoder.addCommand({
            name: 'setViewport',
            args: { x, y, width, height, minDepth, maxDepth },
        });
    }
    end() {
        tracer.renderPassEncoderProto.end.call(this.webgpuObject);
        this.encoder.addCommand({ name: 'endPass' });
    }
}
/*
interface Attribute {
    format: string;
    offset: number;
    shaderLocation: number;
}

interface VertexBuffer {
    arrayStride: number;
    stepMode: string;
    attributes: Attribute[];
}
*/
class RenderPipelineState extends BaseState {
    device;
    layout;
    vertex;
    primitive;
    depthStencil;
    multisample;
    fragment;
    constructor(device, desc) {
        super(desc);
        this.device = device;
        this.layout = desc.layout;
        const v = desc.vertex;
        this.vertex = {
            module: tracer.shaderModules.get(v.module),
            entryPoint: v.entryPoint,
            constants: { ...v.constants },
            buffers: (v.buffers ?? []).map(b => {
                return {
                    arrayStride: b.arrayStride,
                    stepMode: b.stepMode ?? 'vertex',
                    attributes: b.attributes.map(a => {
                        return {
                            format: a.format,
                            offset: a.offset,
                            shaderLocation: a.shaderLocation,
                        };
                    }),
                };
            }),
        };
        const p = desc.primitive ?? {};
        this.primitive = {
            topology: p.topology ?? 'triangle-list',
            stripIndexFormat: p.stripIndexFormat,
            frontFace: p.frontFace ?? 'ccw',
            cullMode: p.cullMode ?? 'none',
            unclippedDepth: p.unclippedDepth,
        };
        const ds = desc.depthStencil;
        if (ds !== undefined) {
            const stencilFront = ds.stencilFront ?? {};
            const stencilBack = ds.stencilBack ?? {};
            this.depthStencil = {
                format: ds.format,
                depthWriteEnabled: ds.depthWriteEnabled ?? false,
                depthCompare: ds.depthCompare ?? 'always',
                stencilFront: {
                    compare: stencilFront.compare ?? 'always',
                    failOp: stencilFront.failOp ?? 'keep',
                    depthFailOp: stencilFront.depthFailOp ?? 'keep',
                    passOp: stencilFront.passOp ?? 'keep',
                },
                stencilBack: {
                    compare: stencilBack.compare ?? 'always',
                    failOp: stencilBack.failOp ?? 'keep',
                    depthFailOp: stencilBack.depthFailOp ?? 'keep',
                    passOp: stencilBack.passOp ?? 'keep',
                },
                stencilReadMask: ds.stencilReadMask ?? 0xffffffff,
                stencilWriteMask: ds.stencilWriteMask ?? 0xffffffff,
                depthBias: ds.depthBias ?? 0,
                depthBiasSlopeScale: ds.depthBiasSlopeScale ?? 0,
                depthBiasClamp: ds.depthBiasClamp ?? 0,
            };
        }
        const m = desc.multisample ?? {};
        this.multisample = {
            count: m.count ?? 1,
            mask: m.mask ?? 0xffffffff,
            alphaToCoverageEnabled: m.alphaToCoverageEnabled ?? false,
        };
        const f = desc.fragment;
        if (f !== undefined) {
            this.fragment = {
                module: tracer.shaderModules.get(f.module),
                entryPoint: f.entryPoint,
                constants: { ...f.constants },
                targets: f.targets.map(t => {
                    const target = {
                        format: t.format,
                        writeMask: t.writeMask ?? GPUColorWrite.ALL,
                    };
                    const b = t.blend;
                    if (b !== undefined) {
                        target.blend = {
                            color: {
                                operation: b.color.operation ?? 'add',
                                srcFactor: b.color.srcFactor ?? 'one',
                                dstFactor: b.color.dstFactor ?? 'zero',
                            },
                            alpha: {
                                operation: b.alpha.operation ?? 'add',
                                srcFactor: b.alpha.srcFactor ?? 'one',
                                dstFactor: b.alpha.dstFactor ?? 'zero',
                            },
                        };
                    }
                    return target;
                }),
            };
        }
    }
    serialize() {
        const { vertex, layout, primitive, multisample, depthStencil, fragment } = this;
        const result = {
            deviceSerial: this.device.traceSerial,
            vertex: {
                moduleSerial: vertex.module.traceSerial,
                entryPoint: vertex.entryPoint,
                constants: vertex.constants,
                buffers: vertex.buffers,
            },
            primitive,
            multisample,
            depthStencil,
            //fragment: { ...this.fragment },
        };
        if (layout === 'auto') {
            result.layout = 'auto';
        }
        else {
            result.layoutSerial = tracer.pipelineLayouts.get(layout).traceSerial;
        }
        if (fragment !== undefined) {
            result.fragment = {
                moduleSerial: fragment.module.traceSerial,
                entryPoint: fragment.entryPoint,
                constants: fragment.constants,
                targets: fragment.targets,
            };
        }
        return result;
    }
    getBindGroupLayout(groupIndex) {
        const bgl = tracer.renderPipelineProto.getBindGroupLayout.call(this.webgpuObject, groupIndex);
        tracer.registerObjectIn('bindGroupLayouts', bgl, new BindGroupLayoutState(this.device, {
            implicit: true,
            renderPipeline: this,
            groupIndex,
        }));
        return bgl;
    }
}
class SamplerState extends BaseState {
    device;
    desc;
    constructor(device, desc) {
        super(desc);
        this.device = device;
        this.desc = {
            addressModeU: desc.addressModeU ?? 'clamp-to-edge',
            addressModeV: desc.addressModeV ?? 'clamp-to-edge',
            addressModeW: desc.addressModeW ?? 'clamp-to-edge',
            magFilter: desc.magFilter ?? 'nearest',
            minFilter: desc.minFilter ?? 'nearest',
            mipmapFilter: desc.mipmapFilter ?? 'nearest',
            lodMinClamp: desc.lodMinClamp ?? 0,
            lodMaxClamp: desc.lodMaxClamp ?? 32,
            compare: desc.compare,
            maxAnisotropy: desc.maxAnisotropy ?? 1,
        };
    }
    serialize() {
        return {
            deviceSerial: this.device.traceSerial,
            ...this.desc,
        };
    }
}
class ShaderModuleState extends BaseState {
    device;
    code;
    constructor(device, desc) {
        super(desc);
        this.device = device;
        this.code = desc.code;
    }
    serialize() {
        return { deviceSerial: this.device.traceSerial, code: this.code };
    }
}
const c111 = { type: 'color', blockWidth: 1, blockHeight: 1, blockByteSize: 1 };
const c112 = { type: 'color', blockWidth: 1, blockHeight: 1, blockByteSize: 2 };
const c114 = { type: 'color', blockWidth: 1, blockHeight: 1, blockByteSize: 4 };
const c118 = { type: 'color', blockWidth: 1, blockHeight: 1, blockByteSize: 8 };
const c1116 = { type: 'color', blockWidth: 1, blockHeight: 1, blockByteSize: 16 };
const c448 = { type: 'color', blockWidth: 4, blockHeight: 4, blockByteSize: 8 };
const c4416 = { type: 'color', blockWidth: 4, blockHeight: 4, blockByteSize: 16 };
const c5416 = { type: 'color', blockWidth: 5, blockHeight: 4, blockByteSize: 16 };
const c5516 = { type: 'color', blockWidth: 5, blockHeight: 5, blockByteSize: 16 };
const c6516 = { type: 'color', blockWidth: 6, blockHeight: 5, blockByteSize: 16 };
const c6616 = { type: 'color', blockWidth: 6, blockHeight: 6, blockByteSize: 16 };
const c8516 = { type: 'color', blockWidth: 8, blockHeight: 5, blockByteSize: 16 };
const c8616 = { type: 'color', blockWidth: 8, blockHeight: 6, blockByteSize: 16 };
const c8816 = { type: 'color', blockWidth: 8, blockHeight: 8, blockByteSize: 16 };
const c10516 = { type: 'color', blockWidth: 10, blockHeight: 5, blockByteSize: 16 };
const c10616 = { type: 'color', blockWidth: 10, blockHeight: 6, blockByteSize: 16 };
const c10816 = { type: 'color', blockWidth: 10, blockHeight: 8, blockByteSize: 16 };
const c101016 = { type: 'color', blockWidth: 10, blockHeight: 10, blockByteSize: 16 };
const c121016 = { type: 'color', blockWidth: 12, blockHeight: 10, blockByteSize: 16 };
const c121216 = { type: 'color', blockWidth: 12, blockHeight: 12, blockByteSize: 16 };
const kTextureFormatInfo = {
    r8unorm: c111,
    r8snorm: c111,
    r8uint: c111,
    r8sint: c111,
    rg8unorm: c112,
    rg8snorm: c112,
    rg8uint: c112,
    rg8sint: c112,
    rgba8unorm: c114,
    'rgba8unorm-srgb': c114,
    rgba8snorm: c114,
    rgba8uint: c114,
    rgba8sint: c114,
    bgra8unorm: c114,
    'bgra8unorm-srgb': c114,
    r16uint: c112,
    r16sint: c112,
    r16float: c112,
    rg16uint: c114,
    rg16sint: c114,
    rg16float: c114,
    rgba16uint: c118,
    rgba16sint: c118,
    rgba16float: c118,
    r32uint: c114,
    r32sint: c114,
    r32float: c114,
    rg32uint: c118,
    rg32sint: c118,
    rg32float: c118,
    rgba32uint: c1116,
    rgba32sint: c1116,
    rgba32float: c1116,
    rgb10a2unorm: c114,
    rg11b10ufloat: c114,
    rgb9e5ufloat: c114,
    stencil8: { type: 'stencil', blockByteSize: 1 },
    depth16unorm: { type: 'depth', blockWidth: 1, blockHeight: 1, blockByteSize: 2 },
    depth32float: { type: 'depth', blockWidth: 1, blockHeight: 1, blockByteSize: 4 },
    'depth24plus-stencil8': { type: 'depth-stencil' },
    depth24plus: { type: 'depth', blockWidth: 1, blockHeight: 1, blockByteSize: 4 },
    'depth32float-stencil8': { type: 'depth-stencil' },
    'bc1-rgba-unorm': c448,
    'bc1-rgba-unorm-srgb': c448,
    'bc2-rgba-unorm': c4416,
    'bc2-rgba-unorm-srgb': c4416,
    'bc3-rgba-unorm': c4416,
    'bc3-rgba-unorm-srgb': c4416,
    'bc4-r-unorm': c448,
    'bc4-r-snorm': c448,
    'bc5-rg-unorm': c4416,
    'bc5-rg-snorm': c4416,
    'bc6h-rgb-ufloat': c4416,
    'bc6h-rgb-float': c4416,
    'bc7-rgba-unorm': c4416,
    'bc7-rgba-unorm-srgb': c4416,
    'etc2-rgb8unorm': c448,
    'etc2-rgb8unorm-srgb': c448,
    'etc2-rgb8a1unorm': c448,
    'etc2-rgb8a1unorm-srgb': c448,
    'etc2-rgba8unorm': c4416,
    'etc2-rgba8unorm-srgb': c4416,
    'eac-r11unorm': c448,
    'eac-r11snorm': c448,
    'eac-rg11unorm': c4416,
    'eac-rg11snorm': c4416,
    'astc-4x4-unorm': c4416,
    'astc-4x4-unorm-srgb': c4416,
    'astc-5x4-unorm': c5416,
    'astc-5x4-unorm-srgb': c5416,
    'astc-5x5-unorm': c5516,
    'astc-5x5-unorm-srgb': c5516,
    'astc-6x5-unorm': c6516,
    'astc-6x5-unorm-srgb': c6516,
    'astc-6x6-unorm': c6616,
    'astc-6x6-unorm-srgb': c6616,
    'astc-8x5-unorm': c8516,
    'astc-8x5-unorm-srgb': c8516,
    'astc-8x6-unorm': c8616,
    'astc-8x6-unorm-srgb': c8616,
    'astc-8x8-unorm': c8816,
    'astc-8x8-unorm-srgb': c8816,
    'astc-10x5-unorm': c10516,
    'astc-10x5-unorm-srgb': c10516,
    'astc-10x6-unorm': c10616,
    'astc-10x6-unorm-srgb': c10616,
    'astc-10x8-unorm': c10816,
    'astc-10x8-unorm-srgb': c10816,
    'astc-10x10-unorm': c101016,
    'astc-10x10-unorm-srgb': c101016,
    'astc-12x10-unorm': c121016,
    'astc-12x10-unorm-srgb': c121016,
    'astc-12x12-unorm': c121216,
    'astc-12x12-unorm-srgb': c121216,
};
const kBytesPerRowAlignment = 256;
function align(n, alignment) {
    return Math.ceil(n / alignment) * alignment;
}
class TextureState extends BaseState {
    device;
    swapChainId;
    state;
    format;
    usage;
    size;
    dimension;
    mipLevelCount;
    sampleCount;
    viewFormats;
    constructor(device, desc, swapChainId) {
        super(desc);
        this.swapChainId = swapChainId; // a string if texture is from `getCurrentTexture`
        this.state = 'available';
        this.device = device;
        this.format = desc.format;
        this.usage = desc.usage;
        this.size = gpuExtent3DDictFullFromGPUExtent3D(desc.size);
        this.dimension = desc.dimension ?? '2d';
        this.mipLevelCount = desc.mipLevelCount ?? 1;
        this.sampleCount = desc.sampleCount ?? 1;
        this.viewFormats = [...(desc.viewFormats ?? [])]; // deep copy
    }
    async serializeAsync() {
        // Always serialize the creation parameters and add the initial data if possible.
        const result = this.serialize();
        // No need to gather initial data since this texture is already destroyed.
        if (this.state === 'destroyed') {
            return result;
        }
        if (this.swapChainId) {
            // TODO: We should be able to make this work but it's hard to track exactly when these textures are destroyed.
            console.warn('No support for swapChain texture initial data.');
            return result;
        }
        if (this.sampleCount !== 1) {
            console.warn('No support for sampleCount > 1 texture initial data.');
            return result;
        }
        if (this.dimension !== '2d') {
            console.warn("No support for dimension != '2d' texture initial data.");
            return result;
        }
        if (kTextureFormatInfo[this.format].type !== 'color') {
            console.warn('No support for non-color texture initial data.');
            return result;
        }
        // TODO check for compressed textures as well.
        const { blockByteSize } = kTextureFormatInfo[this.format];
        const readbacks = [];
        let mapPromises = [];
        tracer.doWebGPUOp(() => {
            // TODO pool encoders?
            const encoder = this.device.webgpuObject.createCommandEncoder();
            for (let mip = 0; mip < this.mipLevelCount; mip++) {
                const width = Math.max(1, this.size.width >> mip);
                const height = Math.max(1, this.size.height >> mip);
                const depthOrArrayLayers = this.size.depthOrArrayLayers; // TODO support 3D.
                const bytesPerRow = align(width * blockByteSize, kBytesPerRowAlignment);
                const bufferSize = bytesPerRow * height * depthOrArrayLayers;
                const readbackBuffer = this.device.webgpuObject.createBuffer({
                    size: bufferSize,
                    usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ,
                });
                encoder.copyTextureToBuffer({ texture: this.webgpuObject, mipLevel: mip }, { buffer: readbackBuffer, bytesPerRow, rowsPerImage: height }, { width, height, depthOrArrayLayers });
                readbacks.push({ buffer: readbackBuffer, bytesPerRow, mipLevel: mip });
            }
            this.device.webgpuObject.queue.submit([encoder.finish()]);
            mapPromises = readbacks.map(r => r.buffer.mapAsync(GPUMapMode.READ));
        });
        await Promise.all(mapPromises);
        const initialData = [];
        tracer.doWebGPUOp(() => {
            for (const { buffer, bytesPerRow, mipLevel } of readbacks) {
                initialData.push({
                    data: tracer.traceData(buffer.getMappedRange()),
                    mipLevel,
                    bytesPerRow,
                });
                buffer.destroy();
            }
        });
        result.initialData = initialData;
        return result;
    }
    serialize() {
        return {
            deviceSerial: this.device.traceSerial,
            state: this.state,
            format: this.format,
            usage: this.usage,
            size: this.size,
            dimension: this.dimension,
            mipLevelCount: this.mipLevelCount,
            sampleCount: this.sampleCount,
            viewFormats: this.viewFormats,
            swapChainId: this.swapChainId,
        };
    }
    createView(viewDesc) {
        const view = tracer.textureProto.createView.call(this.webgpuObject, viewDesc);
        tracer.registerObjectIn('textureViews', view, new TextureViewState(this, viewDesc ?? {}));
        return view;
    }
    onPresent() {
        this.state = 'destroyed';
    }
    destroy() {
        tracer.textureProto.destroy.call(this.webgpuObject);
        this.state = 'destroyed';
        if (!tracer.recordingTrace()) {
            return;
        }
        tracer.traceCommand({
            name: 'textureDestroy',
            textureSerial: this.traceSerial,
        });
    }
}
class TextureViewState extends BaseState {
    texture;
    format;
    dimension;
    aspect;
    baseMipLevel;
    mipLevelCount;
    baseArrayLayer;
    arrayLayerCount;
    constructor(texture, desc) {
        super(desc);
        this.texture = texture;
        this.format = desc.format ?? texture.format;
        this.dimension = desc.dimension ?? '2d'; // TODO not actually correct
        this.aspect = desc.aspect ?? 'all';
        this.baseMipLevel = desc.baseMipLevel ?? 0;
        this.mipLevelCount = desc.mipLevelCount; // TODO default;
        this.baseArrayLayer = desc.baseArrayLayer ?? 0;
        this.arrayLayerCount = desc.arrayLayerCount; // TODO default;
    }
    serialize() {
        return {
            textureSerial: this.texture.traceSerial,
            format: this.format,
            dimension: this.dimension,
            aspect: this.aspect,
            baseMipLevel: this.baseMipLevel,
            mipLevelCount: this.mipLevelCount,
            baseArrayLayer: this.baseArrayLayer,
            arrayLayerCount: this.arrayLayerCount,
        };
    }
}
// TODO full WebIDL and exceptions on bad type? Can we automate from TS webidl definition for WebGPU??

export { WebGPUDebugger, getUnwrappedGPUCanvasContext, getUnwrappedGPUDeviceFromWrapped, kTextureFormatInfo, requestUnwrappedAdapter, tracer };
//# sourceMappingURL=capture.js.map
