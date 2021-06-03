export default interface GameResult {
    result: ResultType;
    error?: string;
    name?: string;
    score?: string;
}

export enum ResultType {
    TIMEOUT = "timeout",
    FORCE_END = "force_end",
    WINNER = "winner",
    LOSER = "loser",
    TIE = "tie",
    ERROR = "error",
    DELETED = "deleted",
}