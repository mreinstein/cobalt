import { vec2 } from '../deps.js'


function line (cobalt, node, start, end, color, lineWidth=1) {
    
    const delta = vec2.sub(end, start)

    const unitBasis = vec2.normalize(delta)
    const perp = perpendicularComponent(unitBasis)

    const halfLineWidth = lineWidth / 2
    
    let i = node.data.vertexCount * 6 // 2 floats position + 4 floats color per vertex

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


// return component of vector perpendicular to a unit basis vector
// (IMPORTANT NOTE: assumes "basis" has unit magnitude (length==1))
function perpendicularComponent (inp) {
    return [ -inp[1], inp[0] ]
}


export default {
    line,

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
            node.data.vertices[vi + 0] = x
            node.data.vertices[vi + 1] = y

            // color
            node.data.vertices[vi + 2] = color[0]
            node.data.vertices[vi + 3] = color[1]
            node.data.vertices[vi + 4] = color[2]
            node.data.vertices[vi + 5] = color[3]
            

            // Second triangle vertex (current point on ellipse)
        
            // position
            node.data.vertices[vi + 6] = currX
            node.data.vertices[vi + 7] = currY

            // color
            node.data.vertices[vi + 8] = color[0]
            node.data.vertices[vi + 9] = color[1]
            node.data.vertices[vi + 10] = color[2]
            node.data.vertices[vi + 11] = color[3]

            
            // Third triangle vertex (next point on ellipse)
            // position
            node.data.vertices[vi + 12] = nextX
            node.data.vertices[vi + 13] = nextY

            // color
            node.data.vertices[vi + 14] = color[0]
            node.data.vertices[vi + 15] = color[1]
            node.data.vertices[vi + 16] = color[2]
            node.data.vertices[vi + 17] = color[3]
        }

        node.data.vertexCount += (3 * numSegments)

        node.data.dirty = true
    },

    // @param Number angle rotation (radians)
    box: function (cobalt, node, center, width, height, color, angle=0, lineWidth=1) {
        const [ x, y ] = center
        
        const halfWidth = width / 2
        const halfHeight = height / 2

        const topLeft = [ x - halfWidth, y - halfHeight ]
        const topRight = [ x + halfWidth, y - halfHeight ]
        const bottomLeft = [ x - halfWidth, y + halfHeight ]
        const bottomRight = [ x + halfWidth, y + halfHeight ]

        if (angle !== 0) {
            // rotate the point by <angle> rads around origin
            //      point    origin   rads     out 
            _rotate(topLeft, center, angle, topLeft)
            _rotate(topRight, center, angle, topRight)
            _rotate(bottomLeft, center, angle, bottomLeft)
            _rotate(bottomRight, center, angle, bottomRight)
        }

        line(cobalt, node, topLeft, topRight, color, lineWidth)
        line(cobalt, node, bottomLeft, bottomRight, color, lineWidth)
        line(cobalt, node, topLeft, bottomLeft, color, lineWidth)
        line(cobalt, node, topRight, bottomRight, color, lineWidth)
    },

    

    // @param Number angle rotation (radians)
    filledBox: function (cobalt, node, center, width, height, color, angle=0) {
        const [ x, y ] = center
        
        const halfWidth = width / 2
        const halfHeight = height / 2

        const topLeft = [ x - halfWidth, y - halfHeight ];
        const topRight = [ x + halfWidth, y - halfHeight ];
        const bottomLeft = [ x - halfWidth, y + halfHeight ];
        const bottomRight = [ x + halfWidth, y + halfHeight ];

        if (angle !== 0) {
            // rotate the point by <angle> rads around origin
            //      point    origin   rads     out 
            _rotate(topLeft, center, angle, topLeft)
            _rotate(topRight, center, angle, topRight)
            _rotate(bottomLeft, center, angle, bottomLeft)
            _rotate(bottomRight, center, angle, bottomRight)
        }

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
        node.data.dirty = true
    },
}


function _rotate (a, b, rad, out) {
    //Translate point to the origin
    let p0 = a[0] - b[0],
        p1 = a[1] - b[1],
        sinC = Math.sin(rad),
        cosC = Math.cos(rad);

    //perform rotation and translate to correct position
    out[0] = p0 * cosC - p1 * sinC + b[0];
    out[1] = p0 * sinC + p1 * cosC + b[1];
    return out;
}

