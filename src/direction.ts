export enum Direction {
    UP,
    DOWN,
    LEFT,
    RIGHT
}

export const oppositeDir = (dir: Direction): Direction => {
    switch (dir) {
        case Direction.UP:
            return Direction.DOWN;
        case Direction.DOWN:
            return Direction.UP;
        case Direction.LEFT:
            return Direction.RIGHT;
        case Direction.RIGHT:
            return Direction.LEFT;
    }
};