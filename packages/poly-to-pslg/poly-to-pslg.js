import cleanPSLG from 'clean-pslg'

//Converts a polygon to a planar straight line graph
export default function polygonToPSLG (loops, options) {
  if(!Array.isArray(loops)) {
    throw new Error('poly-to-pslg: Error, invalid polygon')
  }
  if(loops.length === 0) {
    return {
      points: [],
      edges:  []
    }
  }

  options = options || {}

  var nested = true
  if('nested' in options) {
    nested = !!options.nested
  } else if(loops[0].length === 2 && typeof loops[0][0] === 'number') {
    //Hack:  If use doesn't pass in a loop, then try to guess if it is nested
    nested = false
  }
  if(!nested) {
    loops = [loops]
  }

  //First we just unroll all the points in the dumb/obvious way
  var points = []
  var edges = []
  for(var i=0; i<loops.length; ++i) {
    var loop = loops[i]
    var offset = points.length
    for(var j=0; j<loop.length; ++j) {
      points.push(loop[j])
      edges.push([ offset+j, offset+(j+1)%loop.length ])
    }
  }

  //Then we run snap rounding to clean up self intersections and duplicate verts
  var clean = 'clean' in options ? true : !!options.clean
  if(clean) {
    cleanPSLG(points, edges)
  }

  //Finally, we return the resulting PSLG
  return {
    points: points,
    edges:  edges
  }
}
