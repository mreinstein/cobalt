import { FLOAT32S_PER_SPRITE } from './constants.js'


// return the index into the renderPass. array where the new sprite should be inserted
export default function sortedBinaryInsert (spriteZIndex, spriteType, renderPass) {

    if (renderPass.spriteCount === 0)
        return 0

    let low = 0
    let high = renderPass.spriteCount - 1

    // order is used to sort the sprite by layer, then sprite type
    //   zIndex      0-255    (8 bits)
    //   spriteType  0-65,535 (16 bits)
    const order = (spriteZIndex << 16 & 0xFF0000) | (spriteType & 0xFFFF)

    // binary search through spriteData since it's already sorted low to high
    while (low <= high) {
        
        // the 12th float of each sprite stores the sortValue

        const lowOrder = renderPass.spriteData[low * FLOAT32S_PER_SPRITE + 11]
        if (order <= lowOrder)
            return low

        const highOrder = renderPass.spriteData[high * FLOAT32S_PER_SPRITE + 11]
        if (order >= highOrder)
            return high + 1

        const mid = Math.floor((low + high) / 2)

        const midOrder = renderPass.spriteData[mid * FLOAT32S_PER_SPRITE + 11]

        if(order === midOrder)
            return mid + 1
       
        if (order > midOrder)
            low = mid + 1
        else
            high = mid - 1
    }

    return low
}
