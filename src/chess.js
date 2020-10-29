const reactions = {
    "1️⃣": 0, "2️⃣": 1, "3️⃣": 2, "4️⃣": 3, "5️⃣": 4, "6️⃣": 5, "7️⃣": 6, "8️⃣": 7,
    "🇦": 10, "🇧": 11, "🇨": 12, "🇩": 13, "🇪": 14, "🇫": 15, "🇬": 16, "🇭": 17,
    "✔️": 20, "🔙": 21
}

var gameBoard = [];
var aiMoveStack = [];

class Chess {
    constructor() {
        this.gameMessage = null;
        this.inGame = false;
        this.blackTurn = true;
        this.selected1X = -1;
        this.selected1Y = -1;
        this.selected2X = -1;
        this.selected2Y = -1;
        this.selecting = true;
        this.message = "";
    }

    gameBoardDisplay() {
        return "https://api.theturkey.dev/discordchess/genboard?gb=" + gameBoard.join(",") + "&s1=" + this.selected1X + "," + this.selected1Y + "&s2=" + this.selected2X + "," + this.selected2Y + "\n"
            + "```\n"
            + "Welcome to Chess!\n"
            + "Ignore the above link! That is simply our hack to generate the game board below!\n"
            + "To play simply use the reactions provided to first select your piece you want to move\n"
            + "Next hit the check reaction\n"
            + "Now select where you want that peice to be moved!\n"
            + "To go back to the piece selection hit the back reaction!\n"
            + "Hit the check reaction to confirm your movement!\n"
            + "If the piece dose not move check below to possibly see why!\n"
            + "You do play against an AI, however the AI is not particularly very smart!\n"
            + "There is no castling and you must actually take the king to win!\n"
            + "INFO:\n"
            + "\tTurn: " + (this.blackTurn ? "CPU" : "Player") + "\n"
            + "\tState: " + (this.selecting ? "Selecting Piece" : "Moving Piece") + "\n\n"
            + (this.message !== "" ? this.message : "") + "\n"
            + "```";
    }

    newGame(msg) {
        if (this.inGame)
            return;

        gameBoard = [2, 3, 4, 6, 5, 4, 3, 2,
            1, 1, 1, 1, 1, 1, 1, 1,
            0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0,
            11, 11, 11, 11, 11, 11, 11, 11,
            12, 13, 14, 15, 16, 14, 13, 12];

        this.inGame = true;
        this.blackTurn = false;
        this.selected1X = -1;
        this.selected1Y = -1;
        this.selected2X = -1;
        this.selected2Y = -1;
        this.selecting = true;
        this.message = "";

        msg.channel.send(this.gameBoardDisplay()).then(emsg => {
            this.gameMessage = emsg;
            Object.keys(reactions).forEach(reaction => {
                this.gameMessage.react(reaction);
            });

            this.waitForReaction();
        });
    }

    step() {
        if (this.inGame) {
            this.gameMessage.edit(this.gameBoardDisplay());
            this.waitForReaction();
        }
    }

    endTurn() {
        let blackKing = false;
        let whiteKing = false;

        gameBoard.forEach(p => {
            if (p == 6)
                blackKing = true;
            else if (p == 16)
                whiteKing = true;
        });

        if (blackKing && whiteKing) {
            this.blackTurn = true;
            this.gameMessage.edit(this.gameBoardDisplay());
            this.makeBestMove();
            this.blackTurn = false;
        }
        else {
            this.gameOver("Player");
            return;
        }

        blackKing = false;
        whiteKing = false;

        gameBoard.forEach(p => {
            if (p == 6)
                blackKing = true;
            else if (p == 16)
                whiteKing = true;
        });

        if (!blackKing || !whiteKing) {
            this.gameOver("Computer");
        }
    }

    gameOver(winner) {
        this.inGame = false;
        this.gameMessage.edit("GAME OVER! " + this.getWinnerText(winner));
        this.gameMessage.reactions.removeAll();
    }

    filter(reaction, user) {
        return Object.keys(reactions).includes(reaction.emoji.name) && user.id !== this.gameMessage.author.id;
    }

    waitForReaction() {
        this.gameMessage.awaitReactions((reaction, user) => this.filter(reaction, user), { max: 1, time: 300000, errors: ['time'] })
            .then(collected => {
                const reaction = collected.first();
                const index = reactions[reaction.emoji.name];
                let progress = false;
                this.message = "";

                if (index == 20) {
                    progress = true;
                }
                else if (index == 21 && !this.selecting) {
                    this.selecting = true;
                    this.selected2X = -1;
                    this.selected2Y = -1;
                }
                else if (index >= 10) {
                    if (this.selecting)
                        this.selected1X = index % 10;
                    else
                        this.selected2X = index % 10;
                }
                else {
                    if (this.selecting)
                        this.selected1Y = index;
                    else
                        this.selected2Y = index;
                }

                const currX = this.selecting ? this.selected1X : this.selected2X;
                const currY = this.selecting ? this.selected1Y : this.selected2Y;

                reaction.users.remove(reaction.users.cache.filter(user => user.id !== this.gameMessage.author.id).first().id);
                if (progress && currY != -1 && currX != -1) {
                    const index = (this.selected1Y * 8) + this.selected1X;
                    if (this.selecting) {

                        const piece = gameBoard[index];
                        if (piece >= 10) {
                            this.message = "";
                            this.selecting = false;
                        }
                        else if (piece == 0) {
                            this.message = "There is no piece at that location!";
                        }
                        else {
                            this.message = "You cannot move that piece!";
                        }
                    }
                    else {
                        const piece = gameBoard[index];
                        const moveInfo = this.canPieceMoveTo(piece, this.selected1X, this.selected1Y, this.selected2X, this.selected2Y);
                        if (moveInfo.valid) {
                            gameBoard[index] = 0;
                            gameBoard[(this.selected2Y * 8) + this.selected2X] = piece;
                            this.selected1X = -1;
                            this.selected1Y = -1;
                            this.selected2X = -1;
                            this.selected2Y = -1;
                            this.selecting = true;
                            this.endTurn();

                        }
                        else {
                            this.message = moveInfo.msg;
                        }
                    }
                }
                this.step();
            })
            .catch(collected => {
                if (typeof collected === 'string')
                    this.gameOver(collected);
                else
                    this.gameOver("The game was not finished!");
            });
    }

    getWinnerText(winner) {
        if (winner === "Player" || winner === "Computer")
            return "The " + winner + " has won!";
        else if (winner == "tie")
            return "It was a tie!";
        else
            return winner;
    }

    canPieceMoveTo(piece, fx, fy, tx, ty) {
        const blackPiece = piece < 10;

        switch (piece % 10) {
            case 1:
                return this.checkPawnMove(blackPiece, fx, fy, tx, ty);
            case 2:
                return this.checkRookMove(blackPiece, fx, fy, tx, ty);
            case 3:
                return this.checkKnightMove(blackPiece, fx, fy, tx, ty);
            case 4:
                return this.checkBishopMove(blackPiece, fx, fy, tx, ty);
            case 5:
                const rookMove = this.checkRookMove(blackPiece, fx, fy, tx, ty);
                if (rookMove.valid)
                    return this.checkBishopMove(blackPiece, fx, fy, tx, ty);
                return rookMove;
            case 6:
                return this.checkKingMove(blackPiece, fx, fy, tx, ty);
        }
    }

    checkPawnMove(blackPiece, fx, fy, tx, ty) {
        const xDiff = fx - tx;
        const yDiff = fy - ty;
        const pieceAt = gameBoard[(ty * 8) + tx];
        if (pieceAt != 0 && ((blackPiece && pieceAt < 10) || (!blackPiece && pieceAt > 10)))
            return { valid: false, msg: "You already have a piece there!" };

        const pieceAtDiff = pieceAt != 0 && ((blackPiece && pieceAt > 10) || (!blackPiece && pieceAt < 10));

        if (Math.abs(xDiff) > 1) {
            return { valid: false, msg: "A Pawn cannot move like that!" };
        }
        else if (xDiff == 0) {
            if (yDiff > 0 && !blackPiece) {
                const checkJump = this.checkJumps([{ x: fx, y: fy - 1 }]);
                if (checkJump.valid) {
                    if ((yDiff == 2 && fy == 6) || (yDiff == 1 && !pieceAtDiff))
                        return { valid: true, msg: "A Pawn cannot top that position!" };
                    return { valid: false, msg: "" };
                }
                else {
                    return checkJump;
                }
            }
            else if (yDiff < 0 && blackPiece) {
                const checkJump = this.checkJumps([{ x: fx, y: fy + 1 }]);
                if (checkJump.valid) {
                    if ((yDiff == -2 && fy == 1) || (yDiff == -1 && !pieceAtDiff))
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

    checkRookMove(blackPiece, fx, fy, tx, ty) {
        const xDiff = fx - tx;
        const yDiff = fy - ty;
        const pieceAt = gameBoard[(ty * 8) + tx];
        const pieceAtDiff = pieceAt == 0 || ((blackPiece && pieceAt > 10) || (!blackPiece && pieceAt < 10));

        if (xDiff != 0 && yDiff == 0 && pieceAtDiff) {
            const betweenPos = [];
            const inc = -(xDiff / Math.abs(xDiff));
            for (let i = fx + inc; i != tx; i += inc)
                betweenPos.push({ x: i, y: fy });
            return this.checkJumps(betweenPos);
        }
        else if (yDiff != 0 && xDiff == 0 && pieceAtDiff) {
            const betweenPos = [];
            const inc = -(yDiff / Math.abs(yDiff));
            for (let i = fy + inc; i != ty; i += inc)
                betweenPos.push({ x: fx, y: i });
            return this.checkJumps(betweenPos);
        }
        return { valid: false, msg: "A Rook cannot move like that" };
    }

    checkKnightMove(blackPiece, fx, fy, tx, ty) {
        const xDiff = fx - tx;
        const yDiff = fy - ty;
        const pieceAt = gameBoard[(ty * 8) + tx];
        const pieceAtDiff = pieceAt == 0 || ((blackPiece && pieceAt > 10) || (!blackPiece && pieceAt < 10));
        if (Math.abs(xDiff) == 2 && Math.abs(yDiff) == 1 && pieceAtDiff)
            return { valid: true, msg: "" };
        else if (Math.abs(xDiff) == 1 && Math.abs(yDiff) == 2 && pieceAtDiff)
            return { valid: true, msg: "" };
        return { valid: false, msg: "A Knight cannot move like that" };
    }

    checkBishopMove(blackPiece, fx, fy, tx, ty) {
        const xDiff = fx - tx;
        const yDiff = fy - ty;
        const pieceAt = gameBoard[(ty * 8) + tx];
        const pieceAtDiff = pieceAt == 0 || ((blackPiece && pieceAt > 10) || (!blackPiece && pieceAt < 10));

        if (Math.abs(xDiff) == Math.abs(yDiff) && pieceAtDiff) {
            const betweenPos = [];
            const incx = -(xDiff / Math.abs(xDiff));
            const incy = -(yDiff / Math.abs(yDiff));
            let j = fy + incy;
            for (let i = fx + incx; i != tx; i += incx) {
                betweenPos.push({ x: i, y: j });
                j += incy;
            }
            return this.checkJumps(betweenPos);
        }
        return { valid: false, msg: "A Bishop cannot move like that" };
    }

    checkKingMove(blackPiece, fx, fy, tx, ty) {
        const xDiff = fx - tx;
        const yDiff = fy - ty;
        const pieceAt = gameBoard[(ty * 8) + tx];
        const pieceAtDiff = pieceAt == 0 || ((blackPiece && pieceAt > 10) || (!blackPiece && pieceAt < 10));

        if (Math.abs(xDiff) <= 1 && Math.abs(yDiff) <= 1 && pieceAtDiff) {
            return { valid: true, msg: "" };
        }
        return { valid: false, msg: "A King cannot move like that" };
    }

    checkJumps(positions) {
        for (let i = 0; i < positions.length; i++)
            if (gameBoard[(positions[i].y * 8) + positions[i].x] != 0)
                return { valid: false, msg: "Cannot jump over piece at " + positions[i].x + ", " + positions[i].y };
        return { valid: true, msg: "" };
    }


    /**
     * This AI below is reworked from https://github.com/lhartikk/simple-chess-ai and is not my own original work
     */

    makeBestMove() {
        const depth = 4;
        const bestMove = this.minimaxRoot(depth, true);
        gameBoard[bestMove.ty * 8 + bestMove.tx] = gameBoard[bestMove.fy * 8 + bestMove.fx];
        gameBoard[bestMove.fy * 8 + bestMove.fx] = 0;
    }

    minimaxRoot(depth, isMaximisingPlayer) {
        const newGameMoves = this.getValidMoves();
        let bestMove = -9999;
        let bestMoveFound;

        newGameMoves.forEach(gameMove => {
            this.makeTempMove(gameMove);
            const value = this.minimax(depth - 1, -10000, 10000, !isMaximisingPlayer);
            this.undoTempMove();
            if (value >= bestMove) {
                bestMove = value;
                bestMoveFound = gameMove;
            }
        })
        return bestMoveFound;
    }

    minimax(depth, alpha, beta, isMaximisingPlayer) {
        if (depth === 0)
            return -this.evaluateBoard();

        const newGameMoves = this.getValidMoves();

        let bestMove = isMaximisingPlayer ? -9999 : 9999;
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

    evaluateBoard() {
        let totalEvaluation = 0;
        for (let x = 0; x < 8; x++)
            for (let y = 0; y < 8; y++)
                totalEvaluation = totalEvaluation + this.getPieceValue(gameBoard[y * 8 + x], x, y);
        return totalEvaluation;
    }

    getPieceValue(piece, x, y) {
        if (piece == 0)
            return 0;

        const absoluteValue = this.getAbsoluteValue(piece, piece < 10, x, y);
        return piece < 10 ? absoluteValue : -absoluteValue;
    }

    getAbsoluteValue(piece, isWhite, x, y) {
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
                throw "Unknown piece type: " + piece.type;
        }
    };

    getValidMoves() {
        const validMoves = [];
        for (let x = 0; x < 8; x++) {
            for (let y = 0; y < 8; y++) {
                const piece = gameBoard[y * 8 + x];
                if (piece != 0 && piece < 10) {
                    for (let tx = 0; tx < 8; tx++) {
                        for (let ty = 0; ty < 8; ty++) {
                            if (this.canPieceMoveTo(piece, x, y, tx, ty).valid) {
                                validMoves.push({ fx: x, fy: y, tx: tx, ty: ty });
                            }
                        }
                    }
                }
            }
        }
        return validMoves;
    }

    makeTempMove(move) {
        move.replaced = gameBoard[move.ty * 8 + move.tx];
        aiMoveStack.push(move);
        const piece = gameBoard[move.fy * 8 + move.fx];
        gameBoard[move.fy * 8 + move.fx] = 0;
        gameBoard[move.ty * 8 + move.tx] = piece;
    }

    undoTempMove() {
        const move = aiMoveStack.pop();
        gameBoard[move.fy * 8 + move.fx] = gameBoard[move.ty * 8 + move.tx];
        gameBoard[move.ty * 8 + move.tx] = move.replaced;
    }
}

module.exports = Chess;

const pawnEvalWhite =
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

const pawnEvalBlack = pawnEvalWhite.slice().reverse();

const knightEval =
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

const bishopEvalWhite = [
    [-2.0, -1.0, -1.0, -1.0, -1.0, -1.0, -1.0, -2.0],
    [-1.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, -1.0],
    [-1.0, 0.0, 0.5, 1.0, 1.0, 0.5, 0.0, -1.0],
    [-1.0, 0.5, 0.5, 1.0, 1.0, 0.5, 0.5, -1.0],
    [-1.0, 0.0, 1.0, 1.0, 1.0, 1.0, 0.0, -1.0],
    [-1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, -1.0],
    [-1.0, 0.5, 0.0, 0.0, 0.0, 0.0, 0.5, -1.0],
    [-2.0, -1.0, -1.0, -1.0, -1.0, -1.0, -1.0, -2.0]
];

const bishopEvalBlack = bishopEvalWhite.slice().reverse();

const rookEvalWhite = [
    [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0],
    [0.5, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 0.5],
    [-0.5, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, -0.5],
    [-0.5, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, -0.5],
    [-0.5, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, -0.5],
    [-0.5, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, -0.5],
    [-0.5, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, -0.5],
    [0.0, 0.0, 0.0, 0.5, 0.5, 0.0, 0.0, 0.0]
];

const rookEvalBlack = rookEvalWhite.slice().reverse();

const evalQueen = [
    [-2.0, -1.0, -1.0, -0.5, -0.5, -1.0, -1.0, -2.0],
    [-1.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, -1.0],
    [-1.0, 0.0, 0.5, 0.5, 0.5, 0.5, 0.0, -1.0],
    [-0.5, 0.0, 0.5, 0.5, 0.5, 0.5, 0.0, -0.5],
    [0.0, 0.0, 0.5, 0.5, 0.5, 0.5, 0.0, -0.5],
    [-1.0, 0.5, 0.5, 0.5, 0.5, 0.5, 0.0, -1.0],
    [-1.0, 0.0, 0.5, 0.0, 0.0, 0.0, 0.0, -1.0],
    [-2.0, -1.0, -1.0, -0.5, -0.5, -1.0, -1.0, -2.0]
];

const kingEvalWhite = [

    [-3.0, -4.0, -4.0, -5.0, -5.0, -4.0, -4.0, -3.0],
    [-3.0, -4.0, -4.0, -5.0, -5.0, -4.0, -4.0, -3.0],
    [-3.0, -4.0, -4.0, -5.0, -5.0, -4.0, -4.0, -3.0],
    [-3.0, -4.0, -4.0, -5.0, -5.0, -4.0, -4.0, -3.0],
    [-2.0, -3.0, -3.0, -4.0, -4.0, -3.0, -3.0, -2.0],
    [-1.0, -2.0, -2.0, -2.0, -2.0, -2.0, -2.0, -1.0],
    [2.0, 2.0, 0.0, 0.0, 0.0, 0.0, 2.0, 2.0],
    [2.0, 3.0, 1.0, 0.0, 0.0, 1.0, 3.0, 2.0]
];

const kingEvalBlack = kingEvalWhite.slice().reverse();