// all of the game's globals are consolidated here
export default {
    renderer: undefined,     // webgpu globals
    spritesheet: undefined,  // texture/animation
    
    layers: undefined,       // tile/sprite/overlay layer definitions

    // timekeeping (in milliseconds)
    lastFrameTime: 0,        // local time the last frame ran
}
