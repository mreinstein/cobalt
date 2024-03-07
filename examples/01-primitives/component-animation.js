export default function componentAnimation (obj) {
    return {
        name: obj.name || '',
        frame: obj.frame || 0,
        accumulator: obj.accumulator || 0,
        done: false,
    }
}
