import GameResult, { ResultType } from './game-result';
import Discord, { Interaction, Message, MessageReaction, User } from 'discord.js';
import GameBase from './game-base';
import { GameContent } from './game-content';

const WIDTH = 7;
const HEIGHT = 7;

const reactions = new Map([
    ['1️⃣', 1],
    ['2️⃣', 2],
    ['3️⃣', 3],
    ['4️⃣', 4],
    ['5️⃣', 5],
    ['6️⃣', 6],
    ['7️⃣', 7]
]);

export default class Connect4Game extends GameBase {
    private gameBoard: string[];

    constructor() {
        super('connect4', true, true);
        this.gameBoard = [];
    }

    public initGame(): GameBase {
        return new Connect4Game();
    }

    private gameBoardToString(): string {
        let str = '';
        if (!this.player2 == null)
            str += 'Note there is no AI for this game, so you are just playing against yourself';
        str += '\n| . 1 | . 2 | 3 | . 4 | . 5 | 6 | . 7 |\n';
        for (let y = 0; y < HEIGHT; y++) {
            for (let x = 0; x < WIDTH; x++) {
                str += '|' + this.gameBoard[y * WIDTH + x];
            }
            str += '|\n';
        }
        return str;
    }

    public newGame(msg: Message, player2: User | null, onGameEnd: (result: GameResult) => void): void {
        if (super.isInGame())
            return;

        for (let y = 0; y < HEIGHT; y++) {
            for (let x = 0; x < WIDTH; x++) {
                this.gameBoard[y * WIDTH + x] = '⚪';
            }
        }
        super.newGame(msg, player2, onGameEnd, Array.from(reactions.keys()));
    }

    protected getContent(): GameContent {
        return {
            embeds: [new Discord.MessageEmbed()
                .setColor('#000b9e')
                .setTitle('Connect-4')
                .setAuthor('Made By: TurkeyDev', 'https://site.theturkey.dev/images/turkey_avatar.png', 'https://www.youtube.com/watch?v=Sl1ZnvlNalI')
                .setDescription(this.gameBoardToString())
                .addField('Turn:', this.getUserDisplay())
                .setFooter(`Currently Playing: ${this.gameStarter.username}`)
                .setTimestamp()]
        };
    }

    protected getGameOverContent(result: GameResult): GameContent {
        return {
            embeds: [new Discord.MessageEmbed()
                .setColor('#000b9e')
                .setTitle('Connect-4')
                .setAuthor('Made By: TurkeyDev', 'https://site.theturkey.dev/images/turkey_avatar.png', 'https://www.youtube.com/watch?v=Sl1ZnvlNalI')
                .setDescription(`**GAME OVER! ${this.getWinnerText(result)}**\n\n${this.gameBoardToString()}`)
                .setTimestamp()]
        };
    }

    protected step(): void {
        this.player1Turn = !this.player1Turn;
        super.step();
    }

    public onReaction(reaction: MessageReaction): void {
        const reactName = reaction.emoji.name;
        if (!reactName) {
            this.step();
            return;
        }
        let column = reactions.get(reactName);
        if (column === undefined)
            return;

        column -= 1;
        let placedX = -1;
        let placedY = -1;

        for (let y = HEIGHT - 1; y >= 0; y--) {
            const chip = this.gameBoard[column + (y * WIDTH)];
            if (chip === '⚪') {
                this.gameBoard[column + (y * WIDTH)] = this.getChipFromTurn();
                placedX = column;
                placedY = y;
                break;
            }
        }

        if (this.hasWon(placedX, placedY)) {
            this.gameOver({ result: ResultType.WINNER, name: this.getUserDisplay(), score: this.getScore() });
        }
        else if (this.isBoardFull()) {
            this.gameOver({ result: ResultType.TIE, score: this.getScore() });
        }
        else {
            this.step();
        }
    }
    public onInteraction(interaction: Interaction): void { }

    private getScore(): string {
        let str = '';
        for (let y = 0; y < HEIGHT; y++) {
            for (let x = 0; x < WIDTH; x++) {
                const chip = this.gameBoard[y * WIDTH + x];
                if (chip === '⚪')
                    str += '0';
                else if (chip === '🔴')
                    str += '1';
                else if (chip === '🟡')
                    str += '2';
            }
        }
        return str;
    }

    private getUserDisplay(): string {
        if (this.isMultiplayerGame && this.player2 !== null)
            return this.player1Turn ? '🔴 ' + this.gameStarter.username : '🟡 ' + this.player2?.username ?? 'ERR';
        return this.getChipFromTurn();
    }

    private getChipFromTurn(): string {
        return this.player1Turn ? '🔴' : '🟡';
    }

    private hasWon(placedX: number, placedY: number): boolean {
        const chip = this.getChipFromTurn();

        //Horizontal Check
        const y = placedY * WIDTH;
        for (let i = Math.max(0, placedX - 3); i <= placedX; i++) {
            const adj = i + y;
            if (i + 3 < WIDTH) {
                if (this.gameBoard[adj] === chip && this.gameBoard[adj + 1] === chip && this.gameBoard[adj + 2] === chip && this.gameBoard[adj + 3] === chip)
                    return true;
            }
        }

        //Verticle Check
        for (let i = Math.max(0, placedY - 3); i <= placedY; i++) {
            const adj = placedX + (i * WIDTH);
            if (i + 3 < HEIGHT) {
                if (this.gameBoard[adj] === chip && this.gameBoard[adj + WIDTH] === chip && this.gameBoard[adj + (2 * WIDTH)] === chip && this.gameBoard[adj + (3 * WIDTH)] === chip)
                    return true;
            }
        }

        //Ascending Diag
        for (let i = -3; i <= 0; i++) {
            const adjX = placedX + i;
            const adjY = placedY + i;
            const adj = adjX + (adjY * WIDTH);
            if (adjX + 3 < WIDTH && adjY + 3 < HEIGHT) {
                if (this.gameBoard[adj] === chip && this.gameBoard[adj + WIDTH + 1] === chip && this.gameBoard[adj + (2 * WIDTH) + 2] === chip && this.gameBoard[adj + (3 * WIDTH) + 3] === chip)
                    return true;
            }
        }

        //Descending Diag
        for (let i = -3; i <= 0; i++) {
            const adjX = placedX + i;
            const adjY = placedY - i;
            const adj = adjX + (adjY * WIDTH);
            if (adjX + 3 < WIDTH && adjY - 3 >= 0) {
                if (this.gameBoard[adj] === chip && this.gameBoard[adj - WIDTH + 1] === chip && this.gameBoard[adj - (2 * WIDTH) + 2] === chip && this.gameBoard[adj - (3 * WIDTH) + 3] === chip)
                    return true;
            }
        }

        return false;
    }

    private isBoardFull(): boolean {
        for (let y = 0; y < HEIGHT; y++)
            for (let x = 0; x < WIDTH; x++)
                if (this.gameBoard[y * WIDTH + x] === '⚪')
                    return false;
        return true;
    }
}