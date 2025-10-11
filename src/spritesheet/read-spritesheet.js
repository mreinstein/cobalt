/**
 *  ------------------------------ TexturePacker (no rotation) ------------------------------
 * Accepts the "Hash" JSON format from TexturePacker. Assumes rotated=false.
 * 
 * texturepacker frame structure:
   "f2.png":
    {
        "frame": {"x":15,"y":1,"w":10,"h":15},
        "rotated": false,
        "trimmed": true,
        "spriteSourceSize": {"x":22,"y":17,"w":10,"h":15},
        "sourceSize": {"w":32,"h":32}
    },
*/
export default function buildSpriteTableFromTexturePacker(doc) {
    const atlasW = doc.meta.size.w
    const atlasH = doc.meta.size.h
    const names = Object.keys(doc.frames).sort()
    const descs = new Array(names.length)

    for (let i = 0; i < names.length; i++) {
        const fr = doc.frames[names[i]]

        const fx = fr.frame.x,
            fy = fr.frame.y,
            fw = fr.frame.w,
            fh = fr.frame.h
        const offX = fx / atlasW,
            offY = fy / atlasH
        const spanX = fw / atlasW,
            spanY = fh / atlasH
        const sw = fr.sourceSize.w,
            sh = fr.sourceSize.h
        const ox = fr.spriteSourceSize.x,
            oy = fr.spriteSourceSize.y
        const cx = ox + fw * 0.5 - sw * 0.5
        const cy = oy + fh * 0.5 - sh * 0.5
        descs[i] = {
            UvOrigin: [offX, offY],
            UvSpan: [spanX, spanY],
            FrameSize: [fw, fh],
            CenterOffset: [cx, cy],
        }
    }
    return { descs, names }
}
