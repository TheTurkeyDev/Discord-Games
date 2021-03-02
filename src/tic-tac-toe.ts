import GameBase from './game-base';
import Discord, { Message, MessageEmbed, MessageReaction, User } from 'discord.js';
import GameResult, { ResultType } from './game-result';
import Position from './position';

const gameBoard = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];

const reactions = new Map([
    ["1️⃣", 1],
    ["2️⃣", 2],
    ["3️⃣", 3],
    ["4️⃣", 4],
    ["5️⃣", 5],
    ["6️⃣", 6],
    ["7️⃣", 7],
    ["8️⃣", 8],
    ["9️⃣", 9],
]);

const NO_MOVE = 0;
const PLAYER_1 = 1;
const PLAYER_2 = 2;

const cpu_mistake_chance = 5;

export default class TicTacToeGame extends GameBase {

    private message = "";
    private computersMove: Position = { x: 0, y: 0 };
    private winningPoints: Position = { x: -1, y: -1 };

    constructor() {
        super('tictactoe', true);
    }

    public initGame(): GameBase {
        return new TicTacToeGame();
    }

    private getGameboardStr(): string {
        let str = ""
        for (let y = 0; y < 3; y++) {
            for (let x = 0; x < 3; x++) {
                str += gameBoard[x][y];
            }
        }
        return str;
    }

    public newGame(msg: Message, player2: User | null, onGameEnd: () => void): void {
        if (this.inGame)
            return;

        for (let y = 0; y < 3; y++) {
            for (let x = 0; x < 3; x++) {
                gameBoard[x][y] = NO_MOVE;
            }
        }

        this.winningPoints = { x: -1, y: -1 };

        super.newGame(msg, player2, onGameEnd, Array.from(reactions.keys()));
    }

    protected getEmbed(): MessageEmbed {
        return new Discord.MessageEmbed()
            .setColor('#ab0e0e')
            .setTitle('Tic-Tac-Toe')
            .setDescription(this.message)
            .addField('Turn:', this.getTurn())
            .setImage(`https://api.theturkey.dev/discordgames/gentictactoeboard?gb=${this.getGameboardStr()}&p1=-1&p2=-1`)
            .setAuthor("Made By: TurkeyDev", "https://site.theturkey.dev/images/turkey_avatar.png", "https://twitter.com/turkeydev")
            .setFooter(`Currently Playing: ${this.gameStarter.username}`)
            .setTimestamp();
    }

    protected getGameOverEmbed(result: GameResult): MessageEmbed {

        return new Discord.MessageEmbed()
            .setColor('#ab0e0e')
            .setTitle('Tic-Tac-Toe')
            .setDescription("GAME OVER! " + this.getWinnerText(result))
            .setImage(`https://api.theturkey.dev/discordgames/gentictactoeboard?gb=${this.getGameboardStr()}&p1=${this.winningPoints.x}&p2=${this.winningPoints.y}`)
            .setAuthor("Made By: TurkeyDev", "https://site.theturkey.dev/images/turkey_avatar.png", "https://twitter.com/turkeydev")
            .setTimestamp();
    }

    protected onReaction(reaction: MessageReaction): void {
        this.gameEmbed.reactions.cache.get(reaction.emoji.name)?.remove();

        let index = reactions.get(reaction.emoji.name);
        if (index === undefined)
            return;

        index -= 1;
        const x = index % 3;
        const y = Math.floor(index / 3);
        if (gameBoard[x][y] !== 0) {
            this.step();
            return;
        }

        this.placeMove(x, y, this.player1Turn ? PLAYER_1 : PLAYER_2);
        this.player1Turn = !this.player1Turn;

        if (!this.isGameOver() && this.player2 == null && !this.player1Turn) {
            //Make CPU Move
            this.minimax(0, PLAYER_2);
            let cpuIndex = (this.computersMove.y * 3) + this.computersMove.x + 1;
            Object.keys(reactions).forEach(k => {
                if (reactions.get(k) == cpuIndex && this.gameEmbed.reactions.cache.has(k))
                    this.gameEmbed.reactions.cache.get(k)?.remove();
            });
            this.placeMove(this.computersMove.x, this.computersMove.y, PLAYER_2);
            this.player1Turn = true;
        }

        if (this.isGameOver()) {
            //Flip the turn back to the last player to place a piece
            this.player1Turn = !this.player1Turn;
            if (this.hasWon(PLAYER_2) || this.hasWon(PLAYER_1))
                this.gameOver({ result: ResultType.WINNER, name: this.getTurn() });
            else
                this.gameOver({ result: ResultType.TIE });
        }
        else {
            this.step();
        }
    }

    private getTurn(): string {
        return this.player1Turn ? this.gameStarter.username : (this.isMultiplayerGame ? this.player2!.username : 'CPU');
    }

    private getWinnerText(result: GameResult): string {
        if (result.result === ResultType.TIE)
            return 'It was a tie!';
        else if (result.result === ResultType.TIMEOUT)
            return 'The game went unfinished :(';
        else if (result.result === ResultType.FORCE_END)
            return 'The game was ended';
        else if (result.result === ResultType.ERROR)
            return `Error: ${result.error}`;
        else
            return result.name + ' has won!';
    }

    private isGameOver(): boolean {
        if (this.hasWon(PLAYER_1) || this.hasWon(PLAYER_2))
            return true;

        if (this.getAvailableStates().length == 0) {
            this.winningPoints = { x: -1, y: -1 };
            return true;
        }
        return false;
    }

    private hasWon(player: number): boolean {
        if (gameBoard[0][0] == gameBoard[1][1] && gameBoard[0][0] == gameBoard[2][2] && gameBoard[0][0] == player) {
            this.winningPoints = { x: 0, y: 8 };
            return true;
        }
        if (gameBoard[0][2] == gameBoard[1][1] && gameBoard[0][2] == gameBoard[2][0] && gameBoard[0][2] == player) {
            this.winningPoints = { x: 6, y: 2 };
            return true;
        }
        for (let i = 0; i < 3; ++i) {
            if (gameBoard[i][0] == gameBoard[i][1] && gameBoard[i][0] == gameBoard[i][2] && gameBoard[i][0] == player) {
                this.winningPoints = { x: i, y: i + 6 };
                return true;
            }

            if (gameBoard[0][i] == gameBoard[1][i] && gameBoard[0][i] == gameBoard[2][i] && gameBoard[0][i] == player) {
                this.winningPoints = { x: i * 3, y: (i * 3) + 2 };
                return true;
            }
        }
        return false;
    }

    private getAvailableStates(): Position[] {
        const availablePoints: Position[] = [];
        for (let i = 0; i < 3; ++i)
            for (let j = 0; j < 3; ++j)
                if (gameBoard[i][j] == NO_MOVE)
                    availablePoints.push({ x: i, y: j });
        return availablePoints;
    }

    private placeMove(x: number, y: number, player: number): void {
        gameBoard[x][y] = player;
    }

    private minimax(depth: number, turn: number): number {
        //Game status...
        if (this.hasWon(PLAYER_2))
            return +1;
        if (this.hasWon(PLAYER_1))
            return -1;

        const pointsAvailable = this.getAvailableStates();
        if (pointsAvailable.length === 0)
            return 0;

        if (depth == 0 && Math.floor(Math.random() * Math.floor(cpu_mistake_chance)) == 2) {
            this.computersMove = pointsAvailable[Math.floor(Math.random() * Math.floor(pointsAvailable.length))];
            return 0;
        }


        let min = Number.MAX_SAFE_INTEGER;
        let max = Number.MIN_SAFE_INTEGER;
        for (let i = 0; i < pointsAvailable.length; ++i) {
            const point = pointsAvailable[i];
            if (turn == PLAYER_2) {
                this.placeMove(point.x, point.y, PLAYER_2);
                const currentScore = this.minimax(depth + 1, PLAYER_1);
                max = Math.max(currentScore, max);

                if (currentScore >= 0 && depth == 0)
                    this.computersMove = point;

                if (currentScore == 1) {
                    gameBoard[point.x][point.y] = 0;
                    break;
                }

                if (i == pointsAvailable.length - 1 && max < 0 && depth == 0)
                    this.computersMove = point;
            }
            else if (turn == PLAYER_1) {
                this.placeMove(point.x, point.y, PLAYER_1);
                const currentScore = this.minimax(depth + 1, PLAYER_2);
                min = Math.min(currentScore, min);
                if (min == -1) {
                    gameBoard[point.x][point.y] = 0;
                    break;
                }
            }
            gameBoard[point.x][point.y] = 0;
        }
        return turn == PLAYER_2 ? max : min;
    }
}
