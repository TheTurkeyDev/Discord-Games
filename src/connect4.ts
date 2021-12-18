import GameResult, { ResultType } from './game-result';
import GameBase from './game-base';
import { GameContent } from './game-content';
import { DiscordMessage, DiscordUser, DiscordEmbed, DiscordMessageReactionAdd, DiscordInteraction, DiscordMessageActionRow, DiscordMessageButton, DiscordButtonStyle } from 'discord-minimal';

const WIDTH = 7;
const HEIGHT = 7;

export default class Connect4Game extends GameBase {
    private gameBoard: string[];

    constructor() {
        super('connect4', true);
        this.gameBoard = [];
    }

    private gameBoardToString(): string {
        let str = '';
        if (!this.player2 == null)
            str += 'Note there is no AI for this game, so you are just playing against yourself';
        str += '\n| . 1 | . 2 | 3 | . 4 | . 5 | 6 | . 7 |\n';
        for (let y = 0; y < HEIGHT; y++) {
            for (let x = 0; x < WIDTH; x++)
                str += '|' + this.gameBoard[y * WIDTH + x];
            str += '|\n';
        }
        return str;
    }

    public newGame(msg: DiscordMessage, player2: DiscordUser | null, onGameEnd: (result: GameResult) => void): void {
        if (super.isInGame())
            return;

        for (let y = 0; y < HEIGHT; y++)
            for (let x = 0; x < WIDTH; x++)
                this.gameBoard[y * WIDTH + x] = '⚪';

        super.newGame(msg, player2, onGameEnd);
    }

    protected getContent(): GameContent {
        const row1 = super.createMessageActionRowButton([['1', '1️⃣'], ['2', '2️⃣'], ['3', '3️⃣'], ['4', '4️⃣']]);
        const row2 = super.createMessageActionRowButton([['5', '5️⃣'], ['6', '6️⃣'], ['7', '7️⃣']]);

        return {
            embeds: [new DiscordEmbed()
                .setColor('#000b9e')
                .setTitle('Connect-4')
                .setAuthor('Made By: TurkeyDev', 'https://site.theturkey.dev/images/turkey_avatar.png', 'https://www.youtube.com/watch?v=Sl1ZnvlNalI')
                .setDescription(this.gameBoardToString())
                .addField('Turn:', this.getUserDisplay())
                .setFooter(`Currently Playing: ${this.gameStarter.username}`)
                .setTimestamp()],
            components: [row1, row2]
        };
    }

    protected getGameOverContent(result: GameResult): GameContent {
        return {
            embeds: [new DiscordEmbed()
                .setColor('#000b9e')
                .setTitle('Connect-4')
                .setAuthor('Made By: TurkeyDev', 'https://site.theturkey.dev/images/turkey_avatar.png', 'https://www.youtube.com/watch?v=Sl1ZnvlNalI')
                .setDescription(`**GAME OVER! ${this.getWinnerText(result)}**\n\n${this.gameBoardToString()}`)
                .setTimestamp()],
            components: []
        };
    }

    protected step(): void {
        this.player1Turn = !this.player1Turn;
        super.step(false);
    }

    public onReaction(reaction: DiscordMessageReactionAdd): void { }
    public onInteraction(interaction: DiscordInteraction): void {
        const customId = interaction.data?.custom_id;
        if (!customId) {
            this.step();
            return;
        }

        let column = parseInt(customId);

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
            this.gameOver({ result: ResultType.WINNER, name: this.getUserDisplay(), score: this.getScore() }, interaction);
        }
        else if (this.isBoardFull()) {
            this.gameOver({ result: ResultType.TIE, score: this.getScore() }, interaction);
        }
        else {
            this.step();
            interaction.update(this.getContent());
        }
    }

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