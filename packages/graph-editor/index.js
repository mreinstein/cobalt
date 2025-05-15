import html     from 'https://cdn.skypack.dev/snabby'
import { Pane } from 'https://cdn.jsdelivr.net/npm/tweakpane@4.0.5/dist/tweakpane.min.js'


/**
 * Inspiration
 *      https://tsl-editor.vercel.app
 *      https://github.com/bhushan6/tsl-editor
 *      https://codesandbox.io/p/sandbox/baklavajs-v2-example-zpfkec
 *      https://github.com/cocopon/tweakpane
*/


const model = {

    // VDOM
	currentVnode: document.querySelector('div#viewport'),

    // pan/zoom
	scale: 1,
    translateX: -4300, // (viewport.clientWidth - contentSize * scale) / 2
    translateY: -4250,
    contentSize: 10000,

    // panning
    lastX: 0,
    lastY: 0,
    isPanning: false,

    // node dragging
    nodeDragging: {
        id: null,  // id of the node being dragged
        offset: [ 0, 0 ], // offset from the top left node corner where dragging started
    },

    nodeConnecting: {
        id: null, // id of the source node
        portIdx: -1, // index of the output port on the source node
        endPos: [ 0, 0 ], // point on the svg where the mouse cursor last was
    },

    // node graph
    nodes: [
        {
            id: 'uuid1',
            type: 'test node 1',
            name: 'some light name here',
            position: [4573, 4442],
            isSelected: true,
            ref: null, // the DOM element containing the node attributes
            params: {
                level: 0,
                name: 'Sketch',
                active: true,
            },
            ports: {
                input: [
                    { name: 'a', type: 'any', isSelected: false, ref: null },
                    { name: 'b', type: 'any', isSelected: false, ref: null },
                ],
                output: [
                    { name: 'value', type: 'any', isSelected: false, ref: null },
                ],
            }
        },
        {
            id: 'uuid2',
            type: 'test node 2',
            name: `here's to another`,
            position: [4980, 4496],
            isSelected: false,
            ref: null, // the DOM element containing the node attributes
            params: {
                active: false,
                offset: { x: 50, y: 25 },
                a: 'ay',
                b: 'bee',
                c: 'ceee',
                d: 'deeeeeEE',
                f: 'ffffff',
            },
            ports: {
                input: [
                    { name: 'a', type: 'any', isSelected: false, ref: null },
                    { name: 'b', type: 'any', isSelected: false, ref: null },
                ],
                output: [
                    { name: 'value', type: 'any', isSelected: false, ref: null },
                    { name: 'valueTWO', type: 'any', isSelected: true, ref: null },
                ],
            }
        },
         {
            id: 'uuid3',
            type: 'test node 3',
            name: `wow this is fun!`,
            position: [4580, 4756],
            isSelected: false,
            ref: null, // the DOM element containing the node attributes
            params: {
                active: false,
                offset: { x: 50, y: 25 },
                a: 'ay',
                b: 'bee',
                c: 'ceee',
                d: 'deeeeeEE',
                f: 'ffffff',
            },
            ports: {
                input: [
                    { name: 'a', type: 'any', isSelected: false, ref: null },
                    { name: 'b', type: 'any', isSelected: false, ref: null },
                ],
                output: [
                    { name: 'value', type: 'any', isSelected: false, ref: null },
                    { name: 'valueTWO', type: 'any', isSelected: true, ref: null },
                ],
            }
        },
    ],

    // edges are connections between nodes via ports
    edges: [
        {
            from: { id: 'uuid1', portIdx: 0 },
            to:   { id: 'uuid2', portIdx: 1 },
            isHighlighted: true,
        },
        {
            from: { id: 'uuid3', portIdx: 1 },
            to:   { id: 'uuid2', portIdx: 1 },
            isHighlighted: false,
        },
    ],
}


function updateTransform (viewport, model) {
    const { contentSize, scale, translateX, translateY } = model

    const scaledWidth = contentSize * scale
    const scaledHeight = contentSize * scale
    const viewportWidth = viewport.clientWidth
    const viewportHeight = viewport.clientHeight

    // Clamp so we don't go beyond the edges
    const minTranslateX = Math.min(0, viewportWidth-scaledWidth)
    const maxTranslateX = 0

    const minTranslateY = Math.min(0, viewportHeight - scaledHeight)
    const maxTranslateY = 0

    model.translateX = clamp(translateX, minTranslateX, maxTranslateX)
    model.translateY = clamp(translateY, minTranslateY, maxTranslateY)
}


function clamp(val, min, max) {
	return Math.max(min, Math.min(max, val))
}


function update () {
	const newVnode = view(model, update)
	model.currentVnode = html.update(model.currentVnode, newVnode)
}


function view (model, update) {

    const _onWheel = function (ev) {
        ev.preventDefault()
        const viewport = ev.currentTarget

        const oldScale = model.scale
        const delta = -ev.deltaY * 0.001
        const scale = clamp(model.scale + delta, 0.4, 1.5)
        model.scale = scale

        // Zoom around cursor position
        const rect = viewport.getBoundingClientRect()
        const mouseX = ev.clientX - rect.left
        const mouseY = ev.clientY - rect.top

        const worldX = (mouseX - model.translateX) / oldScale
        const worldY = (mouseY - model.translateY) / oldScale

        model.translateX = mouseX - worldX * scale
        model.translateY = mouseY - worldY * scale

        updateTransform(viewport, model)
        update()
    }

    const _mouseDown = function (ev) {
        // only start panning if we clicked on the background svg
        if (!ev.target.classList.contains('connections'))
            return

        //dialogRef.current.contains(ev.target)
        model.isPanning = true
        model.lastX = ev.clientX
        model.lastY = ev.clientY

        update()
    }

    const _mouseMove = function (ev) {

        if (model.nodeDragging.id) {
            const worldPos = toWorldPosition(ev, model)
            const node = model.nodes.find((n) => n.id === model.nodeDragging.id)
            node.position[0] = worldPos[0] - model.nodeDragging.offset[0]
            node.position[1] = worldPos[1] - model.nodeDragging.offset[1]
        }

        if (model.isPanning) {
            const viewport = ev.currentTarget
            const dx = ev.clientX - model.lastX
            const dy = ev.clientY - model.lastY

            model.translateX += dx
            model.translateY += dy
            model.lastX = ev.clientX
            model.lastY = ev.clientY

            updateTransform(viewport, model)
        }

        if (model.nodeConnecting.id) {
            model.nodeConnecting.endPos = toWorldPosition(ev, model)
        }

        if (model.nodeDragging.id || model.isPanning || model.nodeConnecting.id)
            update()
    }

    const _mouseUp = function (ev) {
        const viewport = ev.currentTarget

        model.isPanning = false

        model.nodeDragging.id = null

        model.nodeConnecting.id = null
        model.nodeConnecting.portIdx = -1

        update()
    }

    const _onMouseLeave = function (ev) {
        model.nodeDragging.id = null

        //if (ev.button === 2) {
            model.isPanning = false
            update()
        //}
    }

    const _onBlur = function () {
        model.isPanning = false
        model.nodeDragging.id = null
        update()
    }

    const nodeElms = model.nodes.map((n) => nodeView(model, n, update))

    const plugs = []

    const connectionPaths = model.edges.map(function (e) {
        
        const fromNode = model.nodes.find((n) => e.from.id === n.id)
        const fromPort = fromNode.ports.output[e.from.portIdx]
        const toNode = model.nodes.find((n) => e.to.id === n.id)
        const toPort = toNode.ports.input[e.to.portIdx]

        if (!fromNode.ref || !toNode.ref)
            return ''

        // get the position of each port relative to it's parent node.
        const fromPos = [
            fromNode.position[0] + fromPort.ref.offsetLeft + fromPort.ref.clientWidth / 2,
            fromNode.position[1] + fromPort.ref.offsetTop + fromPort.ref.clientHeight / 2,
        ]

        const toPos = [
            toNode.position[0] + toPort.ref.offsetLeft + toPort.ref.clientWidth/2,
            toNode.position[1] + toPort.ref.offsetTop + toPort.ref.clientHeight/2,
        ]

        const stroke = e.isHighlighted ? 'rgb(30, 98, 255)' : 'rgb(66, 71, 99)'

        plugs.push(html`<path d="M${fromPos[0]+39},${fromPos[1]},${fromPos[0]+41},${fromPos[1]}" fill="none" stroke=${stroke} stroke-width="8" />`)
        plugs.push(html`<path d="M${toPos[0]-54},${toPos[1]},${toPos[0]-52},${toPos[1]}" fill="none" stroke=${stroke} stroke-width="8" />`)

        return html`<path d="${quadraticCurvePath(fromPos, toPos)}" stroke=${stroke} fill="none" stroke-width="2" />`
    })

    // draw the in-progress edge
    if (model.nodeConnecting.id) {
        const fromNode = model.nodes.find((n) => model.nodeConnecting.id === n.id)
        const fromPort = fromNode.ports.output[model.nodeConnecting.portIdx]
        const fromPos = [
            fromNode.position[0] + fromPort.ref.offsetLeft + fromPort.ref.clientWidth / 2,
            fromNode.position[1] + fromPort.ref.offsetTop + fromPort.ref.clientHeight / 2,
        ]
        const stroke = 'rgb(30, 98, 255)'
        connectionPaths.push(html`<path d="${quadraticCurvePath(fromPos, model.nodeConnecting.endPos)}" stroke=${stroke} fill="none" stroke-width="2" />`)
    }

	return html`
		<div id="viewport"
             @on:wheel=${_onWheel}
             @on:mousedown=${_mouseDown}
             @on:mousemove=${_mouseMove}
             @on:mouseup=${_mouseUp}
             @on:mouseleave=${_onMouseLeave}
             @on:blur=${_onBlur}>
        	<div id="content"
                 @style:transform=${`translate(${model.translateX}px, ${model.translateY}px) scale(${model.scale})`}>
        		
                ${nodeElms}

    			<svg class="connections" @class:dragging=${model.isPanning} width="100%" height="100%">
                    ${connectionPaths}
                    ${plugs}
    			</svg>
        	</div>
      	</div>`
}


function nodeView (model, node, update) {
    const _insertHook = function (vnode) {
        node.ref = vnode.elm
        const p = new Pane({ container: vnode.elm })
        for (const pName in node.params)
            p.addBinding(node.params, pName)
    }

    const inputPorts = node.ports.input.map((p, portIdx) => {
        const bgColor = p.isSelected ? '#1e62ff' : 'rgba(255, 255, 255, 0.1)'
        const _insertHook = function (vnode) {
            p.ref = vnode.elm
        }

        const _clearPort = function (ev) {
            // find the edges associated with this port and remove them
            for (let i=model.edges.length-1; i >= 0; i--) {
                const edge = model.edges[i]
                const matchesFrom = edge.from.id === node.id && edge.from.portIdx === portIdx
                const matchesTo = edge.to.id === node.id && edge.to.portIdx === portIdx
                if (matchesFrom || matchesTo) {
                    model.edges.splice(i, 1)
                }
            }
            update()
        }

        const _mouseUp = function (ev) {
            if (!model.nodeConnecting.id)
                return

            // check if the node already exists
            const e = model.edges.find((e) => {
                const matchesFrom = e.from.id === model.nodeConnecting.id && e.from.portIdx === model.nodeConnecting.portIdx
                const matchesTo = e.to.id === node.id && e.to.portIdx === portIdx

                if (matchesFrom && matchesTo)
                    return
            })
            
            model.edges.push({
                from: { id: model.nodeConnecting.id, portIdx: model.nodeConnecting.portIdx },
                to: { id: node.id, portIdx },
                sHighlighted: false
            })
            
            model.nodeConnecting.id = null
            model.nodeConnecting.portIdx = -1
        }

        return html`<div class="port" style="color: #fff;" key=${portIdx} @hook:insert=${_insertHook}>
            <button @on:click=${_clearPort}
                    @on:mouseup=${_mouseUp}
                    style="background-color: ${bgColor}; border: none; padding: 4px;">=</button>
            <span style="text-transform: uppercase;"> ${p.name} </span>
        </div>`
    })

    const outputPorts = node.ports.output.map((p, portIdx) => {
        const bgColor = p.isSelected ? '#1e62ff' : 'rgba(255, 255, 255, 0.1)'
        const _insertHook = function (vnode) {
            p.ref = vnode.elm
            setTimeout(function () {
                update()
            }, 0)
        }

        const _clearPort = function (ev) {
            // find the edges associated with this port and remove them
            for (let i=model.edges.length-1; i >= 0; i--) {
                const edge = model.edges[i]
                const matchesFrom = edge.from.id === node.id && edge.from.portIdx === portIdx
                const matchesTo = edge.to.id === node.id && edge.to.portIdx === portIdx
                if (matchesFrom || matchesTo) {
                    model.edges.splice(i, 1)
                }
            }
            update()
        }

        const _mouseDown = function (ev) {
            model.nodeConnecting.id = node.id
            model.nodeConnecting.portIdx = portIdx
        }

        return html`<div class="port" style="color: #fff;" key=${portIdx} @hook:insert=${_insertHook}>
            <span style="text-transform: uppercase;"> ${p.name} </span>
            <button @on:click=${_clearPort} @on:mousedown=${_mouseDown}
                    style="background-color: ${bgColor}; border: none; padding: 4px;">=</button>
        </div>`
    })

    const _mouseDown = function (ev) {
        model.nodeDragging.id = node.id
        model.nodeDragging.offset[0] = ev.offsetX
        model.nodeDragging.offset[1] = ev.offsetY
        update()
    }

    return html`<div class="node"
                    key=${node.id}
                    @class:selected=${node.isSelected}
                    @style:transform="translate(${node.position[0]}px, ${node.position[1]}px)"
                    @style:width="${node.width}px">

                    <div class="handle"
                         @class:dragging=${model.nodeDragging.id === node.id}
                         @on:mousedown=${_mouseDown}>
                        <span style="line-height: 1.4">
                            ${node.type}
                            <br>
                            <span style="color:#7b7e8c">${node.name}</span>
                        </span>
                    </div>

                    <div class="params"  @hook:insert=${_insertHook}> </div>

                    <div class="linkage">
                        <!-- input ports (left column) -->
                        <div style="min-width: 80px; display: flex; flex-direction: column;">
                            <div class="css-8cmzyf">
                                ${inputPorts}
                            </div>
                        </div>

                        <!-- output ports (right column) -->
                        <div style="min-width: 80px; display: flex; flex-direction: row-reverse;">
                            <div class="css-v6bg7t">
                                ${outputPorts}
                            </div>
                        </div>

                    </div>
                </div>`
}


/**
 *  convert to absolute coordinate in the content area
 */
function toWorldPosition (ev, model) {
    const viewport = ev.currentTarget
    const rect = viewport.getBoundingClientRect()
    const mouseX = ev.clientX - rect.left
    const mouseY = ev.clientY - rect.top

    return [
        (mouseX - model.translateX) / model.scale,
        (mouseY - model.translateY) / model.scale
    ]
}


/**
 * generate a quadratic curve path string between 2 points, usable in an SVG element
 * 
 * from https://github.com/emilwidlund/nodl/blob/main/packages/react/src/components/Connection/Connection.utils.ts 
 */
function quadraticCurvePath (start, end) {
    const x1 = start[0]
    const y1 = start[1]
    const x4 = end[0]
    const y4 = end[1]
    const min_diff = 20
    let offset

    if (Math.abs(y4 - y1) < min_diff * 2)
        offset = Math.abs(y4 - y1) / 2
    else
        offset = min_diff

    let offsetX = offset
    let offsetY = offset

    offsetY = Math.min(Math.max((y4 - y1) / 2, -offset), offset)
    offsetX = Math.min(Math.max((x4 - x1) / 2, -offset), offset)

    const midX = (x4 - x1) / 2 + x1

    return `
        M${x1},${y1} 
        L${midX - offsetX},${y1} 
        Q${midX},${y1} ${midX},${y1 + offsetY} 
        L${midX},${y4 - offsetY}
        Q${midX},${y4} ${midX + offsetX},${y4}
        L${x4},${y4}`
}


update()
