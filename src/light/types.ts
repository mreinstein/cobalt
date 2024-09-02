type Point = [number, number];

type Light = {
    readonly position: Point;                 // center of the light
    readonly radius: number;                  // radius of the light
    readonly color: [number, number, number]; // color (normalized)
    readonly intensity: number;               // intensity at the center
    readonly attenuationLinear: number;       // describes how the intensity declines with distance
    readonly attenuationExp: number;          // describes how the intensity declines with distance
};
/* The light intensity is computed as follow:
                     intensity
----------------------------------------------------- * cos(x * pi/2)
1 + attenuationLinear * x + attenuationExp * (x * x)

where "x" is the normalized distance to the light position
*/


export {
    type Light,
    type Point,
};