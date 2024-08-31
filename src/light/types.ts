type Point = [number, number];

type Light = {
    readonly position: Point;
    readonly size: number;
    readonly color: [number, number, number];
    readonly intensity: number;
    readonly attenuationLinear: number;
    readonly attenuationExp: number;
};

export {
    type Light,
    type Point,
};