type Point = [number, number];

type Light = {
    readonly position: Point;
    readonly size: number;
    readonly color: [number, number, number];
    readonly intensity: number;
    readonly attenuationLinear: number;
    readonly attenuationExp: number;
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