import { vec2 } from './deps.js'


// given a transform component, get it's position in absolute world coordinates
//
// (transforms may be relative to another entity, and these may chain)
// e.g., text characters are relativeTo textEntity, textEntity is relativeTo npcEntity
//
// @param String componentName which component on the entity to use for it's position  transform | interpolated
export default function transformToWorldPosition (out, transform, componentName='transform') {
	vec2.set(out, 0, 0)

	let t = transform
	while (t) {
		vec2.add(out, out, t.position)
		t = t.relativeTo?.[componentName]
	}
	return out		
}
