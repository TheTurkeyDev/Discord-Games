interface Position {
    x: number;
    y: number;
}

export const up = (pos: Position): Position => ({ x: pos.x, y: pos.y - 1 });
export const down = (pos: Position): Position => ({ x: pos.x, y: pos.y + 1 });
export const left = (pos: Position): Position => ({ x: pos.x - 1, y: pos.y });
export const right = (pos: Position): Position => ({ x: pos.x + 1, y: pos.y });

export default Position;