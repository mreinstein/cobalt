// so far this seems to be 'bgra8unorm' on macos/windows, 'bgra8unorm-srgb' on linux
export default function getPreferredFormat (cobalt) {
    if (cobalt.canvas)
        return navigator.gpu?.getPreferredCanvasFormat()
    else
        return cobalt.context.getPreferredFormat()
}
