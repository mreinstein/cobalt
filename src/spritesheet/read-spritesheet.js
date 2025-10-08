// take a texturepacker json hash export and convert it into a Float32Array
// copied into the renderer's vertex buffer
//
// @return Float32Array vertices (interleaved positions and uvs)
export default function readSpriteSheet (spritesheetJson) {

    // a sprite is a quad (2 triangles) so it has 6 vertices
    // each vertex has 4 float32 (interleaved vec2 position, vec2 uv)
    const spriteFloatCount = 4 * 6

    // each key in the spritesheet is a unique sprite type
    const spriteCount = Object.keys(spritesheetJson.frames).length
    
    const vertices = new Float32Array(spriteCount * spriteFloatCount)

    /*
    stores mapping between sprite name and first vertex index. e.g.,
        [
            'hero_run-0',      // 1st vertex index is at 0
            'bullet_travel-0'  // 1st vertex index is at 6
            'bob_idle-1'       // 1st vertex index is at 12
        ]
    these will alway be multiples of 6, because there are 6 vertices per sprite
    */
    const locations = [ ]

    const spriteMeta = { }

    let i = 0

    for (const frameName in spritesheetJson.frames) {
        const frame = spritesheetJson.frames[frameName]

        locations.push(frameName)

        spriteMeta[frameName] = frame.sourceSize

        // iterate over each sprite and fill it's position and u,v coords in the output

        // calculate normalized vertex coordinates, accounting for trimmed space
        const minX = -0.5 + (frame.spriteSourceSize.x / frame.sourceSize.w)
        const minY = -0.5 + (frame.spriteSourceSize.y / frame.sourceSize.h)

        const maxX = -0.5 + ((frame.spriteSourceSize.x + frame.spriteSourceSize.w) / frame.sourceSize.w)
        const maxY = -0.5 + ((frame.spriteSourceSize.y + frame.spriteSourceSize.h) / frame.sourceSize.h)

        const p0 = [ minX, minY ]
        const p1 = [ minX, maxY ]
        const p2 = [ maxX, maxY ]
        const p3 = [ maxX, minY ]


        // calculate uvs
        // u,v coordinates specify top left as 0,0  bottom right as 1,1
        const minU = 0.0 + (frame.frame.x / spritesheetJson.meta.size.w)
        const minV = 0.0 + (frame.frame.y / spritesheetJson.meta.size.h)
        const maxU = 0.0 + ((frame.frame.x + frame.frame.w) / spritesheetJson.meta.size.w)
        const maxV = 0.0 + ((frame.frame.y + frame.frame.h) / spritesheetJson.meta.size.h)

        const uv0 = [ minU, minV ]
        const uv1 = [ minU, maxV ]
        const uv2 = [ maxU, maxV ]
        const uv3 = [ maxU, minV ]


        // quad triangles are  [ p0, p1, p2 ]  ,  [ p0, p2, p3 ]
        // vertex data is interleaved; a single vertex has a vec2 position followed immediately by vec2 uv
        vertices.set(p0, i)
        vertices.set(uv0, i + 2)

        vertices.set(p1, i + 4)
        vertices.set(uv1, i + 6)

        vertices.set(p2, i + 8)
        vertices.set(uv2, i + 10)

        vertices.set(p0, i + 12)
        vertices.set(uv0, i + 14)

        vertices.set(p2, i + 16)
        vertices.set(uv2, i + 18)

        vertices.set(p3, i + 20)
        vertices.set(uv3, i + 22)        

        i += spriteFloatCount
    }

    const { descs, names } = buildSpriteTableFromTexturePacker(spritesheetJson);

    return { spriteMeta, locations, vertices, descs, names }
}


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
function buildSpriteTableFromTexturePacker (doc) {
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


/*
texturepacker frame structure:
    "f2.png":
    {
        "frame": {"x":15,"y":1,"w":10,"h":15},
        "rotated": false,
        "trimmed": true,
        "spriteSourceSize": {"x":22,"y":17,"w":10,"h":15},
        "sourceSize": {"w":32,"h":32}
    },
*/
