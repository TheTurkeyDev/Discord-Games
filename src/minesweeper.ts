import { DiscordMessage, DiscordUser, DiscordEmbed, DiscordInteraction, DiscordMessageReactionAdd, DiscordMessageActionRow, DiscordMessageButton, DiscordButtonStyle } from 'discord-minimal';
import GameBase from './game-base';
import GameResult, { ResultType } from './game-result';
import { GameContent } from './game-content';

const WIDTH = 9;
const HEIGHT = 8;
const charMap = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i'];

export default class MinesweeperGame extends GameBase {

    private flagging = false;
    private gameBoard: string[] = [];
    private bombLocs: boolean[] = [];

    constructor() {
        super('minesweeper', false);
    }

    private gameBoardToString(links = true): string {
        let str = '';
        for (let y = 0; y < HEIGHT; y++) {
            for (let x = 0; x < WIDTH; x++) {
                const index = y * WIDTH + x;
                if (this.gameBoard[index] === '⬜' || this.gameBoard[index] === '🚩') {
                    if (links)
                        str += '[' + this.gameBoard[index] + '](http://theturkey.dev/' + charMap[x] + charMap[y] + (x == 2 && y == 2 ? '2' : '') + ')';
                    else
                        str += this.gameBoard[index];
                } else {
                    str += this.gameBoard[index];
                }
            }
            str += '\n';
        }
        return str;
    }

    public newGame(interaction: DiscordInteraction, player2: DiscordUser | null, onGameEnd: (result: GameResult) => void): void {
        if (this.inGame)
            return;

        for (let y = 0; y < HEIGHT; y++) {
            for (let x = 0; x < WIDTH; x++) {
                this.gameBoard[y * WIDTH + x] = '⬜';
                this.bombLocs[y * WIDTH + x] = false;
            }
        }

        for (let i = 0; i < 7; i++) {
            const x = this.getRandomInt(WIDTH);
            const y = this.getRandomInt(HEIGHT);

            const index = y * WIDTH + x;

            if (!this.bombLocs[index])
                this.bombLocs[index] = true;
            else
                i--;
        }

        this.flagging = false;
        super.newGame(interaction, player2, onGameEnd);
    }

    protected getContent(): GameContent {
        const row = super.createMessageActionRowButton([['uncover', '👆'], ['flag', '🚩']]);
        return {
            embeds: [new DiscordEmbed()
                .setColor('#c7c7c7')
                .setTitle('Minesweeper')
                .setAuthor('Made By: TurkeyDev', 'https://site.theturkey.dev/images/turkey_avatar.png', 'https://www.youtube.com/watch?v=j2ylF1AX1RY')
                .setDescription(this.gameBoardToString())
                .addField(this.flagging ? 'Flagging' : 'Clicking', this.flagging ? '🚩' : '👆', false)
                .addField('How To Play:', 'Click on a square above and visit the url to reveal, or flag the tile!', false)
                .setFooter(`Currently Playing: ${this.gameStarter.username}`)
                .setTimestamp()],
            components: [row]
        };
    }

    protected getGameOverContent(result: GameResult): GameContent {
        return {
            embeds: [new DiscordEmbed()
                .setColor('#c7c7c7')
                .setTitle('Minesweeper')
                .setAuthor('Made By: TurkeyDev', 'https://site.theturkey.dev/images/turkey_avatar.png', 'https://www.youtube.com/watch?v=j2ylF1AX1RY')
                .setDescription(`**GAME OVER!**\n${this.getWinnerText(result)}\n\n${this.gameBoardToString(false)}`)
                .setTimestamp()],
            components: []
        };
    }

    protected step(edit: boolean): void {
        let lose = false;
        let win = true;
        for (let y = 0; y < HEIGHT; y++) {
            for (let x = 0; x < WIDTH; x++) {
                const index = y * WIDTH + x;
                if (this.gameBoard[index] === '⬜' && !this.bombLocs[index])
                    win = false;
                if (this.gameBoard[index] === '💣')
                    lose = true;
                if (this.gameBoard[index] === '🚩' && !this.bombLocs[index])
                    win = false;
            }
        }

        if (win) {
            this.gameOver({ result: ResultType.WINNER, name: this.gameStarter.username, score: '' });
        }
        else if (lose) {
            this.showBombs();
            this.gameOver({ result: ResultType.LOSER, name: this.gameStarter.username, score: '' });
        }
        else {
            super.step(edit);
        }
    }

    public onReaction(reaction: DiscordMessageReactionAdd): void { }
    public onInteraction(interaction: DiscordInteraction): void {
        switch (interaction.data?.custom_id) {
            case 'uncover':
                this.flagging = false;
                break;
            case 'flag':
                this.flagging = true;
                break;
        }

        this.step(false);
        interaction.update(this.getContent()).catch(e => super.handleError(e, 'update interaction'));
    }

    private showBombs(): void {
        for (let y = 0; y < HEIGHT; y++)
            for (let x = 0; x < WIDTH; x++)
                if (this.bombLocs[y * WIDTH + x])
                    this.gameBoard[y * WIDTH + x] = '💣';
    }

    private uncover(col: number, row: number) {
        const index = row * WIDTH + col;
        if (this.bombLocs[index]) {
            this.gameBoard[index] = '💣';
        }
        else {
            let bombsArround = 0;
            for (let y = -1; y < 2; y++) {
                for (let x = -1; x < 2; x++) {
                    if (col + x < 0 || col + x >= WIDTH || row + y < 0 || row + y >= HEIGHT)
                        continue;
                    if (x === 0 && y === 0)
                        continue;
                    const i2 = (row + y) * WIDTH + (col + x);
                    if (this.bombLocs[i2])
                        bombsArround++;
                }
            }
            if (bombsArround == 0) {
                this.gameBoard[index] = '⬛';
                for (let y = -1; y < 2; y++) {
                    for (let x = -1; x < 2; x++) {
                        if (col + x < 0 || col + x >= WIDTH || row + y < 0 || row + y >= HEIGHT)
                            continue;
                        if (x === 0 && y === 0)
                            continue;
                        const i2 = (row + y) * WIDTH + (col + x);
                        if (this.gameBoard[i2] === '⬜')
                            this.uncover(col + x, row + y);
                    }
                }
            }
            else if (bombsArround == 1) {
                this.gameBoard[index] = '1️⃣';
            }
            else if (bombsArround == 2) {
                this.gameBoard[index] = '2️⃣';
            }
            else if (bombsArround == 3) {
                this.gameBoard[index] = '3️⃣';
            }
            else if (bombsArround == 4) {
                this.gameBoard[index] = '4️⃣';
            }
            else if (bombsArround == 5) {
                this.gameBoard[index] = '5️⃣';
            }
            else if (bombsArround == 6) {
                this.gameBoard[index] = '6️⃣';
            }
            else if (bombsArround == 7) {
                this.gameBoard[index] = '7️⃣';
            }
            else if (bombsArround == 8) {
                this.gameBoard[index] = '8️⃣';
            }
        }
    }

    public makeMove(col: number, row: number): void {
        const index = row * WIDTH + col;
        if (this.gameBoard[index] === '⬜') {
            if (this.flagging)
                this.gameBoard[index] = '🚩';
            else
                this.uncover(col, row);

            this.step(true);
        }
        else if (this.gameBoard[index] === '🚩' && this.flagging) {
            this.gameBoard[index] = '⬜';
        }
    }

    private getRandomInt(max: number): number {
        return Math.floor(Math.random() * Math.floor(max));
    }
}