export default interface GameResult {
    result: ResultType;
    error?: string;
    name?: string;
}

export enum ResultType {
    TIMEOUT,
    FORCE_END,
    WINNER,
    TIE,
    ERROR,
}