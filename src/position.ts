import { Direction } from './direction';

interface Position {
    x: number;
    y: number;
}

export const up = (pos: Position): Position => ({ x: pos.x, y: pos.y - 1 });
export const down = (pos: Position): Position => ({ x: pos.x, y: pos.y + 1 });
export const left = (pos: Position): Position => ({ x: pos.x - 1, y: pos.y });
export const right = (pos: Position): Position => ({ x: pos.x + 1, y: pos.y });

export const move = (pos: Position, dir: Direction): Position => {
    switch (dir) {
        case Direction.UP:
            return up(pos);
        case Direction.DOWN:
            return down(pos);
        case Direction.LEFT:
            return left(pos);
        case Direction.RIGHT:
            return right(pos);
    }
};

export const posEqual = (pos1: Position, pos2: Position): boolean => {
    return pos1.x === pos2.x && pos1.y === pos2.y;
};

export const isInside = (pos: Position, width: number, height: number): boolean => {
    return pos.x >= 0 && pos.y >= 0 && pos.x < width && pos.y < height;
};

export default Position;