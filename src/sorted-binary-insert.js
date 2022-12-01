// return the index into the spriteEntities array where the new sprite should be inserted
export default function sortedBinaryInsert (spriteEntity, sprites, spriteCount) {

    if (spriteCount === 0)
        return 0

    let low = 0
    let high = spriteCount - 1

    // order is used to sort the sprite by layer, then sprite type
    //   layer       can be a value up to 255 (8 bits)
    //   spriteType  can be a value up to 65,535 (16 bits)
    const order = (spriteEntity.sprite.layer << 16 & 0xFF0000) | (spriteEntity.sprite.spriteType & 0xFFFF)

    // binary search through sprites[] since it's already sorted low to high
    while (low <= high) {
        
        const lowOrder = (sprites[low].sprite.layer << 16 & 0xFF0000) | (sprites[low].sprite.spriteType & 0xFFFF)
        if (order <= lowOrder)
            return low

        const highOrder = (sprites[high].sprite.layer << 16 & 0xFF0000) | (sprites[high].sprite.spriteType & 0xFFFF)
        if (order >= highOrder)
            return high + 1

        const mid = Math.floor((low + high) / 2)

        const midOrder = (sprites[mid].sprite.layer << 16 & 0xFF0000) | (sprites[mid].sprite.spriteType & 0xFFFF)

        if(order === midOrder)
            return mid + 1
       
        if (order > midOrder)
            low = mid + 1
        else
            high = mid - 1
    }

    return low
}
