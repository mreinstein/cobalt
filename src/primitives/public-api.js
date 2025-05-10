import cdt2d          from 'cdt2d'
import poly2pslg      from 'poly-to-pslg'
import { mat3, vec2 } from 'wgpu-matrix'


// works similarly to the HTML Canvas transforms:
// https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Transformations
export default {
    line,

    save: function (cobalt, node) {
        node.data.transforms.push(mat3.clone(node.data.transforms.at(-1)))
    },

    restore: function (cobalt, node) {
        if (node.data.transforms.length > 1) // don't remove the identity matrix
            node.data.transforms.pop()
    },

    translate: function (cobalt, node, translation) {
        const m = node.data.transforms.at(-1)
        mat3.translate(m, translation, m)
    },

    rotate: function (cobalt, node, radians) {
        const m = node.data.transforms.at(-1)
        mat3.rotate(m, radians, m)
    },

    scale: function (cobalt, node, scale) {
        const m = node.data.transforms.at(-1)
        mat3.scale(m, scale, m)
    },

    strokePath: function (cobalt, node, segments, color, lineWidth=1) {
        for (const s of segments)
            line(cobalt, node, s[0], s[1], color, lineWidth)
    },

    filledPath: function (cobalt, node, points, color) {

        const pslg = poly2pslg(points)
        // The flag { exterior: false } tells it to remove exterior faces
        const triangles = cdt2d(pslg.points, pslg.edges, { exterior: false })

        const m = node.data.transforms.at(-1)

        let i = node.data.vertexCount * 6 // 2 floats position + 4 floats color per vertex


        const currentElementCount = node.data.vertexCount * 6
        const floatsToAdd = triangles.length * 3 * 6
        node.data.vertices = handleArrayResize(Float32Array, node.data.vertices, currentElementCount, floatsToAdd)


        const pos = vec2.create()

        for (const tri of triangles) {

            // pt 1
            vec2.transformMat3(points[tri[0]], m, pos)
            node.data.vertices[i + 0] = pos[0]
            node.data.vertices[i + 1] = pos[1]

            // pt1 color
            node.data.vertices[i + 2] = color[0]
            node.data.vertices[i + 3] = color[1]
            node.data.vertices[i + 4] = color[2]
            node.data.vertices[i + 5] = color[3]

            // pt 2
            vec2.transformMat3(points[tri[1]], m, pos)
            node.data.vertices[i + 6] = pos[0]
            node.data.vertices[i + 7] = pos[1]

            // pt2 color
            node.data.vertices[i + 8] = color[0]
            node.data.vertices[i + 9] = color[1]
            node.data.vertices[i + 10] = color[2]
            node.data.vertices[i + 11] = color[3]

            // pt 3
            vec2.transformMat3(points[tri[2]], m, pos)
            node.data.vertices[i + 12] = pos[0]
            node.data.vertices[i + 13] = pos[1]

            // pt3 color
            node.data.vertices[i + 14] = color[0]
            node.data.vertices[i + 15] = color[1]
            node.data.vertices[i + 16] = color[2]
            node.data.vertices[i + 17] = color[3]

            i += 18
        }

        node.data.vertexCount += (3 * triangles.length)

        node.data.dirty = true
    },


    ellipse: function (cobalt, node, center, halfWidth, halfHeight, numSegments, color, lineWidth=1) {

        const [ x, y ] = center

        // angle between each segment
        const deltaAngle = 2 * Math.PI / numSegments

        // Generate points for the ellipsoid
        for (let i = 0; i < numSegments; i++) {
            // Angle for this and the next segment
            const angle = i * deltaAngle
            const nextAngle = (i + 1) * deltaAngle

            // Calculate x and y for the current and next points on the ellipse
            const currX = x + halfWidth * Math.cos(angle)
            const currY = y + halfHeight * Math.sin(angle)
            const nextX = x + halfWidth * Math.cos(nextAngle)
            const nextY = y + halfHeight * Math.sin(nextAngle)

            line(cobalt, node, [ currX, currY ], [nextX, nextY ], color, lineWidth)
        }
    },

    filledEllipse: function (cobalt, node, center, halfWidth, halfHeight, numSegments, color) {

        const [ x, y ] = center

        // angle between each segment
        const deltaAngle = 2 * Math.PI / numSegments

        const currentElementCount = node.data.vertexCount * 6
        const floatsToAdd = numSegments * 3 * 6
        node.data.vertices = handleArrayResize(Float32Array, node.data.vertices, currentElementCount, floatsToAdd)


        const m = node.data.transforms.at(-1)

        // Generate points for the ellipsoid
        for (let i = 0; i < numSegments; i++) {
            // Angle for this and the next segment
            const angle = i * deltaAngle
            const nextAngle = (i + 1) * deltaAngle

            // Calculate x and y for the current and next points on the ellipse
            const currX = x + halfWidth * Math.cos(angle)
            const currY = y + halfHeight * Math.sin(angle)
            const nextX = x + halfWidth * Math.cos(nextAngle)
            const nextY = y + halfHeight * Math.sin(nextAngle)

            // Add vertices for the triangles (first point is always the center)
            // First triangle vertex (center of ellipse)

            const stride = 18 // 2 floats position + 4 floats color per vertex * 3 vertices
            const vi = (node.data.vertexCount * 6) + (i * stride)

            // position
            const pos = vec2.transformMat3([ x, y ], m)
            node.data.vertices[vi + 0] = pos[0]
            node.data.vertices[vi + 1] = pos[1]

            // color
            node.data.vertices[vi + 2] = color[0]
            node.data.vertices[vi + 3] = color[1]
            node.data.vertices[vi + 4] = color[2]
            node.data.vertices[vi + 5] = color[3]
            

            // Second triangle vertex (current point on ellipse)
        
            // position
            vec2.transformMat3([ currX, currY ], m, pos)
            node.data.vertices[vi + 6] = pos[0]
            node.data.vertices[vi + 7] = pos[1]

            // color
            node.data.vertices[vi + 8] = color[0]
            node.data.vertices[vi + 9] = color[1]
            node.data.vertices[vi + 10] = color[2]
            node.data.vertices[vi + 11] = color[3]

            
            // Third triangle vertex (next point on ellipse)
            // position
            vec2.transformMat3([ nextX, nextY ], m, pos)
            node.data.vertices[vi + 12] = pos[0]
            node.data.vertices[vi + 13] = pos[1]

            // color
            node.data.vertices[vi + 14] = color[0]
            node.data.vertices[vi + 15] = color[1]
            node.data.vertices[vi + 16] = color[2]
            node.data.vertices[vi + 17] = color[3]
        }

        node.data.vertexCount += (3 * numSegments)

        node.data.dirty = true
    },

    box: function (cobalt, node, center, width, height, color, lineWidth=1) {
        const [ x, y ] = center
        
        const halfWidth = width / 2
        const halfHeight = height / 2

        const topLeft = [ x - halfWidth, y - halfHeight ]
        const topRight = [ x + halfWidth, y - halfHeight ]
        const bottomLeft = [ x - halfWidth, y + halfHeight ]
        const bottomRight = [ x + halfWidth, y + halfHeight ]

        line(cobalt, node, topLeft, topRight, color, lineWidth)
        line(cobalt, node, bottomLeft, bottomRight, color, lineWidth)
        line(cobalt, node, topLeft, bottomLeft, color, lineWidth)
        line(cobalt, node, topRight, bottomRight, color, lineWidth)
    },

    filledBox: function (cobalt, node, center, width, height, color) {
        
        const [ x, y ] = center
        
        const halfWidth = width / 2
        const halfHeight = height / 2

        const m = node.data.transforms.at(-1)

        const topLeft = vec2.transformMat3([ x - halfWidth, y - halfHeight ], m)
        const topRight = vec2.transformMat3([ x + halfWidth, y - halfHeight ], m)
        const bottomLeft = vec2.transformMat3([ x - halfWidth, y + halfHeight ], m)
        const bottomRight = vec2.transformMat3([ x + halfWidth, y + halfHeight ], m)


        const currentElementCount = node.data.vertexCount * 6
        const floatsToAdd = 6 * 6
        node.data.vertices = handleArrayResize(Float32Array, node.data.vertices, currentElementCount, floatsToAdd)


        let i = node.data.vertexCount * 6 // 2 floats position + 4 floats color per vertex


        // triangle 1
        // pt 1
        node.data.vertices[i + 0] = topLeft[0]
        node.data.vertices[i + 1] = topLeft[1]

        // pt1 color
        node.data.vertices[i + 2] = color[0]
        node.data.vertices[i + 3] = color[1]
        node.data.vertices[i + 4] = color[2]
        node.data.vertices[i + 5] = color[3]

        // pt 2
        node.data.vertices[i + 6] = bottomLeft[0]
        node.data.vertices[i + 7] = bottomLeft[1]

        // pt2 color
        node.data.vertices[i + 8] = color[0]
        node.data.vertices[i + 9] = color[1]
        node.data.vertices[i + 10] = color[2]
        node.data.vertices[i + 11] = color[3]

        // pt 3
        node.data.vertices[i + 12] = topRight[0]
        node.data.vertices[i + 13] = topRight[1]

        // pt3 color
        node.data.vertices[i + 14] = color[0]
        node.data.vertices[i + 15] = color[1]
        node.data.vertices[i + 16] = color[2]
        node.data.vertices[i + 17] = color[3]
        

        // triangle 2
        // pt 2
        node.data.vertices[i + 18] = bottomLeft[0]
        node.data.vertices[i + 19] = bottomLeft[1]

        // pt2 color
        node.data.vertices[i + 20] = color[0]
        node.data.vertices[i + 21] = color[1]
        node.data.vertices[i + 22] = color[2]
        node.data.vertices[i + 23] = color[3]
        
        // pt 3
        node.data.vertices[i + 24] = bottomRight[0]
        node.data.vertices[i + 25] = bottomRight[1]

        // pt3 color
        node.data.vertices[i + 26] = color[0]
        node.data.vertices[i + 27] = color[1]
        node.data.vertices[i + 28] = color[2]
        node.data.vertices[i + 29] = color[3]

        // pt 4
        node.data.vertices[i + 30] = topRight[0]
        node.data.vertices[i + 31] = topRight[1]

        // pt4 color
        node.data.vertices[i + 32] = color[0]
        node.data.vertices[i + 33] = color[1]
        node.data.vertices[i + 34] = color[2]
        node.data.vertices[i + 35] = color[3]


        node.data.vertexCount += 6 // 2 triangles in a box, baby

        node.data.dirty = true
    },

    clear: function (cobalt, node) {
        node.data.vertexCount = 0
        node.data.transforms.length = 1 // remove all transform matrices except the first one
        mat3.identity(node.data.transforms[0])
        node.data.dirty = true
    },
}


function line (cobalt, node, start, end, color, lineWidth=1) {
    
    const m = node.data.transforms.at(-1)
    start = vec2.transformMat3(start, m)
    end = vec2.transformMat3(end, m)

    const delta = vec2.sub(end, start)

    const unitBasis = vec2.normalize(delta)
    const perp = perpendicularComponent(unitBasis)

    const halfLineWidth = lineWidth / 2
    
    let i = node.data.vertexCount * 6 // 2 floats position + 4 floats color per vertex


    const currentElementCount = node.data.vertexCount * 6
    const floatsToAdd = 6 * 6
    node.data.vertices = handleArrayResize(Float32Array, node.data.vertices, currentElementCount, floatsToAdd)

    // triangle 1
    // pt 1
    node.data.vertices[i + 0] = start[0] + perp[0] * halfLineWidth
    node.data.vertices[i + 1] = start[1] + perp[1] * halfLineWidth

    // pt1 color
    node.data.vertices[i + 2] = color[0]
    node.data.vertices[i + 3] = color[1]
    node.data.vertices[i + 4] = color[2]
    node.data.vertices[i + 5] = color[3]

    // pt 2
    node.data.vertices[i + 6] = start[0] - perp[0] * halfLineWidth
    node.data.vertices[i + 7] = start[1] - perp[1] * halfLineWidth

    // pt2 color
    node.data.vertices[i + 8] = color[0]
    node.data.vertices[i + 9] = color[1]
    node.data.vertices[i + 10] = color[2]
    node.data.vertices[i + 11] = color[3]

    // pt 3
    node.data.vertices[i + 12] = end[0] + perp[0] * halfLineWidth
    node.data.vertices[i + 13] = end[1] + perp[1] * halfLineWidth

    // pt3 color
    node.data.vertices[i + 14] = color[0]
    node.data.vertices[i + 15] = color[1]
    node.data.vertices[i + 16] = color[2]
    node.data.vertices[i + 17] = color[3]
    

    // triangle 2
    // pt 2
    node.data.vertices[i + 18] = start[0] - perp[0] * halfLineWidth
    node.data.vertices[i + 19] = start[1] - perp[1] * halfLineWidth

    // pt2 color
    node.data.vertices[i + 20] = color[0]
    node.data.vertices[i + 21] = color[1]
    node.data.vertices[i + 22] = color[2]
    node.data.vertices[i + 23] = color[3]
    
    // pt 3
    node.data.vertices[i + 24] = end[0] + perp[0] * halfLineWidth
    node.data.vertices[i + 25] = end[1] + perp[1] * halfLineWidth

    // pt3 color
    node.data.vertices[i + 26] = color[0]
    node.data.vertices[i + 27] = color[1]
    node.data.vertices[i + 28] = color[2]
    node.data.vertices[i + 29] = color[3]

    // pt 4
    node.data.vertices[i + 30] = end[0] - perp[0] * halfLineWidth
    node.data.vertices[i + 31] = end[1] - perp[1] * halfLineWidth

    // pt4 color
    node.data.vertices[i + 32] = color[0]
    node.data.vertices[i + 33] = color[1]
    node.data.vertices[i + 34] = color[2]
    node.data.vertices[i + 35] = color[3]


    node.data.vertexCount += 6
    node.data.dirty = true
}


// if the new elements won't fit in the existing vertices array, resize it
// @param ArrayType ArrayType  one of the TypedArray types (Float32Array, Uint8Array, etc.)
// @param TypedArray arr
function handleArrayResize (ArrayType, arr, currentElementCount, elementsToAdd) {
    // if the new vertices fit in the existing vertices array bail
    if ((currentElementCount + elementsToAdd) <= arr.length)
        return arr

    // attempt to double the existing array size when we need more capacity
    const newSize = arr.length * 2

    const MAX_LENGTH = 16 * 1024 * 1024 / arr.BYTES_PER_ELEMENT

    if (newSize > MAX_LENGTH)
        throw new Error('vertices exceed max array size')

    const newArray = new ArrayType(newSize)
    newArray.set(arr)
    return newArray
}


// return component of vector perpendicular to a unit basis vector
// (IMPORTANT NOTE: assumes "basis" has unit magnitude (length==1))
function perpendicularComponent (inp) {
    return [ -inp[1], inp[0] ]
}
