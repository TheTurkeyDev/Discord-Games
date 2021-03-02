import GameBase from './game-base';
import Discord, { Message, MessageEmbed, MessageReaction, User } from 'discord.js';
import GameResult, { ResultType } from './game-result';
import Position from './position';

const reactions = new Map([
    ["1️⃣", 0],
    ["2️⃣", 1],
    ["3️⃣", 2],
    ["4️⃣", 3],
    ["5️⃣", 4],
    ["6️⃣", 5],
    ["7️⃣", 6],
    ["8️⃣", 7],
    ["🇦", 10],
    ["🇧", 11],
    ["🇨", 12],
    ["🇩", 13],
    ["🇪", 14],
    ["🇫", 15],
    ["🇬", 16],
    ["🇭", 17],
    ["✔️", 20],
    ["🔙", 21]
]);

export default class ChessGame extends GameBase {

    private gameBoard: number[] = [];
    private aiMoveStack: Move[] = [];

    private selectedMove: Move = { fx: -1, fy: -1, tx: -1, ty: -1, replaced: -1 };
    private selecting = true;
    private message = "\u200b";

    constructor() {
        super('chess', true);
    }

    public initGame(): GameBase {
        return new ChessGame();
    }

    private getGameDesc(): string {
        return "**Welcome to Chess!**\n"
            + "- To play simply use the reactions provided to first select your piece you want to move\n"
            + "- Next hit the check reaction\n"
            + "- Now select where you want that peice to be moved!\n"
            + "- To go back to the piece selection hit the back reaction!\n"
            + "- Hit the check reaction to confirm your movement!\n"
            + "- If the piece dose not move check below to possibly see why!\n"
            + "- You do play against an AI, however the AI is not particularly very smart!\n"
            + "- There is no castling and you must actually take the king to win!\n";
    }

    public newGame(msg: Message, player2: User | null, onGameEnd: () => void): void {
        if (super.isInGame())
            return;

        this.gameBoard = [2, 3, 4, 6, 5, 4, 3, 2,
            1, 1, 1, 1, 1, 1, 1, 1,
            0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0,
            11, 11, 11, 11, 11, 11, 11, 11,
            12, 13, 14, 15, 16, 14, 13, 12];

        this.player1Turn = true;
        this.selectedMove = { fx: -1, fy: -1, tx: -1, ty: -1, replaced: -1 };
        this.selecting = true;
        this.message = "\u200b";

        super.newGame(msg, player2, onGameEnd, Array.from(reactions.keys()));
    }

    protected getEmbed(): MessageEmbed {
        return new Discord.MessageEmbed()
            .setColor('#08b9bf')
            .setTitle('Chess')
            .setAuthor("Made By: TurkeyDev", "https://site.theturkey.dev/images/turkey_avatar.png", "https://twitter.com/turkeydev")
            .setDescription(this.getGameDesc())
            .addField('Turn:', this.getDisplayForTurn())
            .addField('State:', this.selecting ? "Selecting Piece" : "Moving Piece")
            .addField('Message:', this.message)
            .setImage(`https://api.theturkey.dev/discordgames/genchessboard?gb=${this.gameBoard.join(",")}&s1=${this.selectedMove.fx},${this.selectedMove.fy}&s2=${this.selectedMove.tx},${this.selectedMove.ty}`)
            .setFooter(`Currently Playing: ${this.gameStarter.username}`)
            .setTimestamp();
    }

    protected getGameOverEmbed(result: GameResult): MessageEmbed {
        return new Discord.MessageEmbed()
            .setColor('#08b9bf')
            .setTitle('Chess')
            .setAuthor("Made By: TurkeyDev", "https://site.theturkey.dev/images/turkey_avatar.png", "https://twitter.com/turkeydev")
            .setDescription("GAME OVER! " + this.getWinnerText(result))
            .setImage(`https://api.theturkey.dev/discordgames/genchessboard?gb=${this.gameBoard.join(",")}&s1=${this.selectedMove.fx},${this.selectedMove.fy}&s2=${this.selectedMove.tx},${this.selectedMove.ty}`)
            .setTimestamp();
    }

    private endTurn(): void {
        let blackKing = false;
        let whiteKing = false;

        this.gameBoard.forEach(p => {
            if (p == 6)
                blackKing = true;
            else if (p == 16)
                whiteKing = true;
        });

        if (!blackKing || !whiteKing) {
            this.gameOver({ result: ResultType.WINNER, name: this.getDisplayForTurn() });
        }

        this.player1Turn = !this.player1Turn;

        if (!this.player1Turn && this.player2 == null && this.isInGame()) {
            this.makeBestMove();
            this.endTurn();
        }
    }

    protected onReaction(reaction: MessageReaction): void {
        const index = reactions.get(reaction.emoji.name);
        if (index === undefined)
            return;

        let progress = false;
        this.message = "-";

        if (index == 20) {
            progress = true;
        }
        else if (index == 21 && !this.selecting) {
            this.selecting = true;
            this.selectedMove.tx = -1;
            this.selectedMove.ty = -1;
        }
        else if (index >= 10) {
            if (this.selecting)
                this.selectedMove.fx = index % 10;
            else
                this.selectedMove.tx = index % 10;
        }
        else {
            if (this.selecting)
                this.selectedMove.fy = index;
            else
                this.selectedMove.ty = index;
        }

        const currX = this.selecting ? this.selectedMove.fx : this.selectedMove.tx;
        const currY = this.selecting ? this.selectedMove.fy : this.selectedMove.ty;

        reaction.users.remove(reaction.users.cache.filter(user => user.id !== this.gameEmbed.author.id).first()?.id);
        if (progress && currY != -1 && currX != -1) {
            const index = (this.selectedMove.fy * 8) + this.selectedMove.fx;
            if (this.selecting) {
                const piece = this.gameBoard[index];
                if (piece >= 10 && this.player1Turn) {
                    this.message = "\u200b";
                    this.selecting = false;
                    this.selectedMove.tx = this.selectedMove.fx;
                    this.selectedMove.ty = this.selectedMove.fy;
                }
                else if (piece > 0 && piece < 10 && !this.player1Turn) {
                    this.message = "\u200b";
                    this.selecting = false;
                    this.selectedMove.tx = this.selectedMove.fx;
                    this.selectedMove.ty = this.selectedMove.fy;
                }
                else if (piece == 0) {
                    this.message = "There is no piece at that location!";
                }
                else {
                    this.message = "You cannot move that piece!";
                }
            }
            else {
                const piece = this.gameBoard[index];
                const moveInfo = this.canPieceMoveTo(piece, this.selectedMove);
                if (moveInfo.valid) {
                    this.gameBoard[index] = 0;
                    this.gameBoard[(this.selectedMove.ty * 8) + this.selectedMove.tx] = piece;
                    this.selectedMove = { fx: -1, fy: -1, tx: -1, ty: -1, replaced: -1 };
                    this.selecting = true;
                    this.endTurn();
                }
                else {
                    this.message = moveInfo.msg;
                }
            }
        }
        this.step();
    }

    private getWinnerText(result: GameResult) {
        if (result.result === ResultType.TIE)
            return 'It was a tie!';
        else if (result.result === ResultType.TIMEOUT)
            return 'The game went unfinished :(';
        else if (result.result === ResultType.FORCE_END)
            return 'The game was ended';
        else if (result.result === ResultType.ERROR)
            return 'ERROR: ' + result.error;
        else
            return result.name + ' has won!';
    }

    private canPieceMoveTo(piece: number, selectedMove: Move): MoveCheck {
        const blackPiece = piece < 10;

        switch (piece % 10) {
            case 1:
                return this.checkPawnMove(blackPiece, selectedMove);
            case 2:
                return this.checkRookMove(blackPiece, selectedMove);
            case 3:
                return this.checkKnightMove(blackPiece, selectedMove);
            case 4:
                return this.checkBishopMove(blackPiece, selectedMove);
            case 5:
                const rookMove = this.checkRookMove(blackPiece, selectedMove);
                if (rookMove.valid)
                    return this.checkBishopMove(blackPiece, selectedMove);
                return rookMove;
            case 6:
                return this.checkKingMove(blackPiece, selectedMove);
        }
        return { valid: false, msg: "Invalid Piece!" };
    }

    private checkPawnMove(blackPiece: boolean, selectedMove: Move): MoveCheck {
        const xDiff = selectedMove.fx - selectedMove.tx;
        const yDiff = selectedMove.fy - selectedMove.ty;
        const pieceAt = this.gameBoard[(selectedMove.ty * 8) + selectedMove.tx];
        if (pieceAt != 0 && ((blackPiece && pieceAt < 10) || (!blackPiece && pieceAt > 10)))
            return { valid: false, msg: "You already have a piece there!" };

        const pieceAtDiff = pieceAt != 0 && ((blackPiece && pieceAt > 10) || (!blackPiece && pieceAt < 10));

        if (Math.abs(xDiff) > 1) {
            return { valid: false, msg: "A Pawn cannot move like that!" };
        }
        else if (xDiff == 0) {
            if (yDiff > 0 && !blackPiece) {
                const checkJump = this.checkJumps([{ x: selectedMove.fx, y: selectedMove.fy - 1 }]);
                if (checkJump.valid) {
                    if ((yDiff == 2 && selectedMove.fy == 6) || (yDiff == 1 && !pieceAtDiff))
                        return { valid: true, msg: "A Pawn cannot top that position!" };
                    return { valid: false, msg: "" };
                }
                else {
                    return checkJump;
                }
            }
            else if (yDiff < 0 && blackPiece) {
                const checkJump = this.checkJumps([{ x: selectedMove.fx, y: selectedMove.fy + 1 }]);
                if (checkJump.valid) {
                    if ((yDiff == -2 && selectedMove.fy == 1) || (yDiff == -1 && !pieceAtDiff))
                        return { valid: true, msg: "A Pawn cannot top that position!" };
                    return { valid: false, msg: "" };
                }
                else {
                    return checkJump;
                }
            }
            else {
                return { valid: false, msg: "A Pawn cannot top that position!" };
            }
        }
        else {
            if (Math.abs(yDiff) == 1 && pieceAtDiff)
                return { valid: true, msg: "" };
            return { valid: false, msg: "You cannot take that piece!" };
        }
    }

    private checkRookMove(blackPiece: boolean, selectedMove: Move): MoveCheck {
        const xDiff = selectedMove.fx - selectedMove.tx;
        const yDiff = selectedMove.fy - selectedMove.ty;
        const pieceAt = this.gameBoard[(selectedMove.ty * 8) + selectedMove.tx];
        const pieceAtDiff = pieceAt == 0 || ((blackPiece && pieceAt > 10) || (!blackPiece && pieceAt < 10));

        if (xDiff != 0 && yDiff == 0 && pieceAtDiff) {
            const betweenPos = [];
            const inc = -(xDiff / Math.abs(xDiff));
            for (let i = selectedMove.fx + inc; i != selectedMove.tx; i += inc)
                betweenPos.push({ x: i, y: selectedMove.fy });
            return this.checkJumps(betweenPos);
        }
        else if (yDiff != 0 && xDiff == 0 && pieceAtDiff) {
            const betweenPos = [];
            const inc = -(yDiff / Math.abs(yDiff));
            for (let i = selectedMove.fy + inc; i != selectedMove.ty; i += inc)
                betweenPos.push({ x: selectedMove.fx, y: i });
            return this.checkJumps(betweenPos);
        }
        return { valid: false, msg: "A Rook cannot move like that" };
    }

    private checkKnightMove(blackPiece: boolean, selectedMove: Move): MoveCheck {
        const xDiff = selectedMove.fx - selectedMove.tx;
        const yDiff = selectedMove.fy - selectedMove.ty;
        const pieceAt = this.gameBoard[(selectedMove.ty * 8) + selectedMove.tx];
        const pieceAtDiff = pieceAt == 0 || ((blackPiece && pieceAt > 10) || (!blackPiece && pieceAt < 10));
        if (Math.abs(xDiff) == 2 && Math.abs(yDiff) == 1 && pieceAtDiff)
            return { valid: true, msg: "" };
        else if (Math.abs(xDiff) == 1 && Math.abs(yDiff) == 2 && pieceAtDiff)
            return { valid: true, msg: "" };
        return { valid: false, msg: "A Knight cannot move like that" };
    }

    private checkBishopMove(blackPiece: boolean, selectedMove: Move): MoveCheck {
        const xDiff = selectedMove.fx - selectedMove.tx;
        const yDiff = selectedMove.fy - selectedMove.ty;
        const pieceAt = this.gameBoard[(selectedMove.ty * 8) + selectedMove.tx];
        const pieceAtDiff = pieceAt == 0 || ((blackPiece && pieceAt > 10) || (!blackPiece && pieceAt < 10));

        if (Math.abs(xDiff) == Math.abs(yDiff) && pieceAtDiff) {
            const betweenPos = [];
            const incx = -(xDiff / Math.abs(xDiff));
            const incy = -(yDiff / Math.abs(yDiff));
            let j = selectedMove.fy + incy;
            for (let i = selectedMove.fx + incx; i != selectedMove.tx; i += incx) {
                betweenPos.push({ x: i, y: j });
                j += incy;
            }
            return this.checkJumps(betweenPos);
        }
        return { valid: false, msg: "A Bishop cannot move like that" };
    }

    private checkKingMove(blackPiece: boolean, selectedMove: Move): MoveCheck {
        const xDiff = selectedMove.fx - selectedMove.tx;
        const yDiff = selectedMove.fy - selectedMove.ty;
        const pieceAt = this.gameBoard[(selectedMove.ty * 8) + selectedMove.tx];
        const pieceAtDiff = pieceAt == 0 || ((blackPiece && pieceAt > 10) || (!blackPiece && pieceAt < 10));

        if (Math.abs(xDiff) <= 1 && Math.abs(yDiff) <= 1 && pieceAtDiff) {
            return { valid: true, msg: "" };
        }
        return { valid: false, msg: "A King cannot move like that" };
    }

    private checkJumps(positions: Position[]): MoveCheck {
        for (let i = 0; i < positions.length; i++)
            if (this.gameBoard[(positions[i].y * 8) + positions[i].x] != 0)
                return { valid: false, msg: "Cannot jump over piece at " + positions[i].x + ", " + positions[i].y };
        return { valid: true, msg: "" };
    }


    /**
     * This AI below is reworked from https://github.com/lhartikk/simple-chess-ai and is not my own original work
     */

    private makeBestMove(): void {
        const depth: number = 4;
        const bestMove: Move = this.minimaxRoot(depth, true);
        this.gameBoard[bestMove.ty * 8 + bestMove.tx] = this.gameBoard[bestMove.fy * 8 + bestMove.fx];
        this.gameBoard[bestMove.fy * 8 + bestMove.fx] = 0;
    }

    private minimaxRoot(depth: number, isMaximisingPlayer: boolean): Move {
        const newGameMoves: Move[] = this.getValidMoves();
        let bestMove: number = -9999;
        let bestMoveFound!: Move;

        newGameMoves.forEach(gameMove => {
            this.makeTempMove(gameMove);
            const value: number = this.minimax(depth - 1, -10000, 10000, !isMaximisingPlayer);
            this.undoTempMove();
            if (value >= bestMove) {
                bestMove = value;
                bestMoveFound = gameMove;
            }
        })
        return bestMoveFound;
    }

    private minimax(depth: number, alpha: number, beta: number, isMaximisingPlayer: boolean): number {
        if (depth === 0)
            return -this.evaluateBoard();

        const newGameMoves: Move[] = this.getValidMoves();

        let bestMove: number = isMaximisingPlayer ? -9999 : 9999;
        newGameMoves.forEach(gameMove => {
            this.makeTempMove(gameMove);

            if (isMaximisingPlayer) {
                bestMove = Math.max(bestMove, this.minimax(depth - 1, alpha, beta, !isMaximisingPlayer));
                this.undoTempMove();
                alpha = Math.max(alpha, bestMove);
            } else {
                bestMove = Math.min(bestMove, this.minimax(depth - 1, alpha, beta, !isMaximisingPlayer));
                this.undoTempMove();
                beta = Math.min(beta, bestMove);
            }

            if (beta <= alpha)
                return bestMove;
        });
        return bestMove;
    }

    private evaluateBoard(): number {
        let totalEvaluation = 0;
        for (let x = 0; x < 8; x++)
            for (let y = 0; y < 8; y++)
                totalEvaluation = totalEvaluation + this.getPieceValue(this.gameBoard[y * 8 + x], x, y);
        return totalEvaluation;
    }

    private getPieceValue(piece: number, x: number, y: number): number {
        if (piece == 0)
            return 0;

        const absoluteValue = this.getAbsoluteValue(piece, piece < 10, x, y);
        return piece < 10 ? absoluteValue : -absoluteValue;
    }

    private getAbsoluteValue(piece: number, isWhite: boolean, x: number, y: number): number {
        switch (piece % 10) {
            case 1:
                return 10 + (isWhite ? pawnEvalWhite[y][x] : pawnEvalBlack[y][x]);
            case 2:
                return 50 + (isWhite ? rookEvalWhite[y][x] : rookEvalBlack[y][x]);
            case 3:
                return 30 + knightEval[y][x];
            case 4:
                return 30 + (isWhite ? bishopEvalWhite[y][x] : bishopEvalBlack[y][x]);
            case 5:
                return 90 + evalQueen[y][x];
            case 6:
                return 900 + (isWhite ? kingEvalWhite[y][x] : kingEvalBlack[y][x]);
            default:
                throw "Unknown piece type: " + piece;
        }
    };

    private getValidMoves(): Move[] {
        const validMoves: Move[] = [];
        for (let x = 0; x < 8; x++) {
            for (let y = 0; y < 8; y++) {
                const piece = this.gameBoard[y * 8 + x];
                if (piece != 0 && piece < 10) {
                    for (let tx = 0; tx < 8; tx++) {
                        for (let ty = 0; ty < 8; ty++) {
                            const move: Move = { fx: x, fy: y, tx: tx, ty: ty, replaced: -1 };
                            if (this.canPieceMoveTo(piece, move).valid) {
                                validMoves.push(move);
                            }
                        }
                    }
                }
            }
        }
        return validMoves;
    }

    private makeTempMove(move: Move): void {
        move.replaced = this.gameBoard[move.ty * 8 + move.tx];
        this.aiMoveStack.push(move);
        const piece = this.gameBoard[move.fy * 8 + move.fx];
        this.gameBoard[move.fy * 8 + move.fx] = 0;
        this.gameBoard[move.ty * 8 + move.tx] = piece;
    }

    private undoTempMove(): void {
        const move = this.aiMoveStack.pop();
        if (move !== undefined) {
            this.gameBoard[move.fy * 8 + move.fx] = this.gameBoard[move.ty * 8 + move.tx];
            this.gameBoard[move.ty * 8 + move.tx] = move.replaced;
        }
    }

    private getDisplayForTurn(): string {
        return this.player1Turn ? this.gameStarter.username : (this.isMultiplayerGame ? this.player2!.username : "CPU");
    }
}

const pawnEvalWhite: number[][] =
    [
        [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0],
        [5.0, 5.0, 5.0, 5.0, 5.0, 5.0, 5.0, 5.0],
        [1.0, 1.0, 2.0, 3.0, 3.0, 2.0, 1.0, 1.0],
        [0.5, 0.5, 1.0, 2.5, 2.5, 1.0, 0.5, 0.5],
        [0.0, 0.0, 0.0, 2.0, 2.0, 0.0, 0.0, 0.0],
        [0.5, -0.5, -1.0, 0.0, 0.0, -1.0, -0.5, 0.5],
        [0.5, 1.0, 1.0, -2.0, -2.0, 1.0, 1.0, 0.5],
        [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0]
    ];

const pawnEvalBlack: number[][] = pawnEvalWhite.slice().reverse();

const knightEval: number[][] =
    [
        [-5.0, -4.0, -3.0, -3.0, -3.0, -3.0, -4.0, -5.0],
        [-4.0, -2.0, 0.0, 0.0, 0.0, 0.0, -2.0, -4.0],
        [-3.0, 0.0, 1.0, 1.5, 1.5, 1.0, 0.0, -3.0],
        [-3.0, 0.5, 1.5, 2.0, 2.0, 1.5, 0.5, -3.0],
        [-3.0, 0.0, 1.5, 2.0, 2.0, 1.5, 0.0, -3.0],
        [-3.0, 0.5, 1.0, 1.5, 1.5, 1.0, 0.5, -3.0],
        [-4.0, -2.0, 0.0, 0.5, 0.5, 0.0, -2.0, -4.0],
        [-5.0, -4.0, -3.0, -3.0, -3.0, -3.0, -4.0, -5.0]
    ];

const bishopEvalWhite: number[][] = [
    [-2.0, -1.0, -1.0, -1.0, -1.0, -1.0, -1.0, -2.0],
    [-1.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, -1.0],
    [-1.0, 0.0, 0.5, 1.0, 1.0, 0.5, 0.0, -1.0],
    [-1.0, 0.5, 0.5, 1.0, 1.0, 0.5, 0.5, -1.0],
    [-1.0, 0.0, 1.0, 1.0, 1.0, 1.0, 0.0, -1.0],
    [-1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, -1.0],
    [-1.0, 0.5, 0.0, 0.0, 0.0, 0.0, 0.5, -1.0],
    [-2.0, -1.0, -1.0, -1.0, -1.0, -1.0, -1.0, -2.0]
];

const bishopEvalBlack: number[][] = bishopEvalWhite.slice().reverse();

const rookEvalWhite: number[][] = [
    [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0],
    [0.5, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 0.5],
    [-0.5, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, -0.5],
    [-0.5, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, -0.5],
    [-0.5, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, -0.5],
    [-0.5, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, -0.5],
    [-0.5, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, -0.5],
    [0.0, 0.0, 0.0, 0.5, 0.5, 0.0, 0.0, 0.0]
];

const rookEvalBlack: number[][] = rookEvalWhite.slice().reverse();

const evalQueen: number[][] = [
    [-2.0, -1.0, -1.0, -0.5, -0.5, -1.0, -1.0, -2.0],
    [-1.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, -1.0],
    [-1.0, 0.0, 0.5, 0.5, 0.5, 0.5, 0.0, -1.0],
    [-0.5, 0.0, 0.5, 0.5, 0.5, 0.5, 0.0, -0.5],
    [0.0, 0.0, 0.5, 0.5, 0.5, 0.5, 0.0, -0.5],
    [-1.0, 0.5, 0.5, 0.5, 0.5, 0.5, 0.0, -1.0],
    [-1.0, 0.0, 0.5, 0.0, 0.0, 0.0, 0.0, -1.0],
    [-2.0, -1.0, -1.0, -0.5, -0.5, -1.0, -1.0, -2.0]
];

const kingEvalWhite: number[][] = [

    [-3.0, -4.0, -4.0, -5.0, -5.0, -4.0, -4.0, -3.0],
    [-3.0, -4.0, -4.0, -5.0, -5.0, -4.0, -4.0, -3.0],
    [-3.0, -4.0, -4.0, -5.0, -5.0, -4.0, -4.0, -3.0],
    [-3.0, -4.0, -4.0, -5.0, -5.0, -4.0, -4.0, -3.0],
    [-2.0, -3.0, -3.0, -4.0, -4.0, -3.0, -3.0, -2.0],
    [-1.0, -2.0, -2.0, -2.0, -2.0, -2.0, -2.0, -1.0],
    [2.0, 2.0, 0.0, 0.0, 0.0, 0.0, 2.0, 2.0],
    [2.0, 3.0, 1.0, 0.0, 0.0, 1.0, 3.0, 2.0]
];

const kingEvalBlack: number[][] = kingEvalWhite.slice().reverse();

interface Move {
    fx: number;
    fy: number;
    tx: number;
    ty: number;
    replaced: number;
}

interface MoveCheck {
    valid: boolean;
    msg: string;
}