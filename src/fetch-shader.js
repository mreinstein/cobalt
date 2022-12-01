export default async function fetchShader (url) {
    const raw = await fetch(url)
    return raw.text()
}
