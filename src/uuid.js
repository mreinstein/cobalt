export default function _uuid () {
    return Math.ceil(Math.random() * (Number.MAX_SAFE_INTEGER-10)) // super ghetto UUID
}
