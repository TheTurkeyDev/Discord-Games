import { DiscordMessage, DiscordUser, DiscordEmbed, DiscordInteraction, DiscordMessageReactionAdd, DiscordMessageActionRow, DiscordMessageButton, DiscordButtonStyle, DiscordSelectMenu, DiscordSelectOption } from 'discord-minimal';
import GameBase from './game-base';
import GameResult, { ResultType } from './game-result';
import { GameContent } from './game-content';
import Position from './position';

const WIDTH = 9;
const HEIGHT = 8;

export default class MinesweeperGame extends GameBase {

    private gameBoard: string[] = [];
    private bombLocs: boolean[] = [];
    private hoverLoc: Position = { x: 0, y: 0 };

    constructor() {
        super('minesweeper', false);
    }


    private gameBoardToString(links = true): string {
        let str = '';
        for (let y = 0; y < HEIGHT; y++) {
            for (let x = 0; x < WIDTH; x++) {
                str += this.gameBoard[y * WIDTH + x];
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

        this.gameBoard[0] = '🟪';
        this.hoverLoc = { x: 0, y: 0 };

        for (let i = 0; i < 7; i++) {
            const x = this.getRandomInt(WIDTH);
            const y = this.getRandomInt(HEIGHT);

            const index = y * WIDTH + x;

            if (!this.bombLocs[index])
                this.bombLocs[index] = true;
            else
                i--;
        }

        super.newGame(interaction, player2, onGameEnd);
    }

    protected getContent(): GameContent {
        const row1 = new DiscordMessageActionRow().addComponents(
            new DiscordSelectMenu()
                .setCustomId('column')
                .addOptions(
                    new DiscordSelectOption('A', '0').setDefault(this.hoverLoc.x === 0),
                    new DiscordSelectOption('B', '1').setDefault(this.hoverLoc.x === 1),
                    new DiscordSelectOption('C', '2').setDefault(this.hoverLoc.x === 2),
                    new DiscordSelectOption('D', '3').setDefault(this.hoverLoc.x === 3),
                    new DiscordSelectOption('E', '4').setDefault(this.hoverLoc.x === 4),
                    new DiscordSelectOption('F', '5').setDefault(this.hoverLoc.x === 5),
                    new DiscordSelectOption('G', '6').setDefault(this.hoverLoc.x === 6),
                    new DiscordSelectOption('H', '7').setDefault(this.hoverLoc.x === 7),
                    new DiscordSelectOption('I', '8').setDefault(this.hoverLoc.x === 8)
                )
        );
        const row2 = new DiscordMessageActionRow().addComponents(
            new DiscordSelectMenu()
                .setCustomId('row')
                .addOptions(
                    new DiscordSelectOption('1', '0').setDefault(this.hoverLoc.y === 0),
                    new DiscordSelectOption('2', '1').setDefault(this.hoverLoc.y === 1),
                    new DiscordSelectOption('3', '2').setDefault(this.hoverLoc.y === 2),
                    new DiscordSelectOption('4', '3').setDefault(this.hoverLoc.y === 3),
                    new DiscordSelectOption('5', '4').setDefault(this.hoverLoc.y === 4),
                    new DiscordSelectOption('6', '5').setDefault(this.hoverLoc.y === 5),
                    new DiscordSelectOption('7', '6').setDefault(this.hoverLoc.y === 6),
                    new DiscordSelectOption('8', '7').setDefault(this.hoverLoc.y === 7)
                )
        );
        const row3 = super.createMessageActionRowButton([['uncover', '👆'], ['flag', '🚩']]);
        return {
            embeds: [new DiscordEmbed()
                .setColor('#c7c7c7')
                .setTitle('Minesweeper')
                .setAuthor('Made By: TurkeyDev', 'https://site.theturkey.dev/images/turkey_avatar.png', 'https://www.youtube.com/watch?v=j2ylF1AX1RY')
                .setDescription(this.gameBoardToString())
                .addField('How To Play:', 'Click on a square above and visit the url to reveal, or flag the tile!', false)
                .setFooter(`Currently Playing: ${this.gameStarter.username}`)
                .setTimestamp()],
            components: [row1, row2, row3]
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

    public gameOver(result: GameResult, interaction: DiscordInteraction | undefined = undefined): void {
        this.resetPosState(this.hoverLoc.y * WIDTH + this.hoverLoc.x);
        super.gameOver(result, interaction);
    }

    protected step(edit: boolean): void {
        let lose = false;
        let win = true;
        for (let y = 0; y < HEIGHT; y++) {
            for (let x = 0; x < WIDTH; x++) {
                const index = y * WIDTH + x;
                if ((this.gameBoard[index] === '⬜' || this.gameBoard[index] === '🟪') && !this.bombLocs[index])
                    win = false;
                if (this.gameBoard[index] === '💣')
                    lose = true;
                if ((this.gameBoard[index] === '🚩') && !this.bombLocs[index])
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
        let currIndex = this.hoverLoc.y * WIDTH + this.hoverLoc.x;
        switch (interaction.data?.custom_id) {
            case 'uncover':
                this.makeMove(this.hoverLoc.x, this.hoverLoc.y, true);
                break;
            case 'flag':
                this.makeMove(this.hoverLoc.x, this.hoverLoc.y, false);
                break;
            case 'row':
                this.resetPosState(currIndex);
                this.hoverLoc.y = parseInt(interaction.data.values[0]);
                currIndex = this.hoverLoc.y * WIDTH + this.hoverLoc.x;
                this.updatePosState(currIndex);
                break;
            case 'column':
                this.resetPosState(currIndex);
                this.hoverLoc.x = parseInt(interaction.data.values[0]);
                currIndex = this.hoverLoc.y * WIDTH + this.hoverLoc.x;
                this.updatePosState(currIndex);
                break;
        }

        this.step(false);
        interaction.update(this.getContent()).catch(e => super.handleError(e, 'update interaction'));
    }

    public resetPosState(index: number): void {
        if (this.gameBoard[index] === '🟪')
            this.gameBoard[index] = '⬜';
        else if (this.gameBoard[index] === '🔳')
            this.gameBoard[index] = '⬛';
    }

    public updatePosState(index: number): void {
        if (this.gameBoard[index] === '⬜')
            this.gameBoard[index] = '🟪';
        else if (this.gameBoard[index] === '⬛')
            this.gameBoard[index] = '🔳';
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
                if (col === this.hoverLoc.x && row === this.hoverLoc.y)
                    this.gameBoard[index] = '🔳';
                else
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

    public makeMove(col: number, row: number, uncover: boolean): void {
        const index = row * WIDTH + col;
        if (this.gameBoard[index] === '🟪') {
            if (uncover)
                this.uncover(col, row);
            else
                this.gameBoard[index] = '🚩';

            this.step(true);
        }
        else if (this.gameBoard[index] === '🚩' && !uncover) {
            this.gameBoard[index] = '🟪';
        }
    }

    private getRandomInt(max: number): number {
        return Math.floor(Math.random() * Math.floor(max));
    }
}