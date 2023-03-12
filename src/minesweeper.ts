import { DiscordUser, DiscordEmbed, DiscordInteraction, DiscordMessageReactionAdd, DiscordMessageActionRow, DiscordSelectMenu, DiscordSelectOption, DiscordInteractionResponseMessageData } from 'discord-minimal';
import GameBase from './game-base';
import GameResult, { ResultType } from './game-result';
import Position from './position';

const WIDTH = 9;
const HEIGHT = 8;
const numberEmotes = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣'];

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


        this.gameBoard = Array.from({ length: WIDTH * HEIGHT }, () => '⬜');
        this.bombLocs = Array.from({ length: WIDTH * HEIGHT }, () => false);

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

    private getBaseEmbed(): DiscordEmbed {
        return new DiscordEmbed()
            .setColor('#c7c7c7')
            .setTitle('Minesweeper')
            .setAuthor('Made By: TurkeyDev', 'https://site.theturkey.dev/images/turkey_avatar.png', 'https://www.youtube.com/watch?v=j2ylF1AX1RY')
            .setTimestamp();
    }

    protected getContent(): DiscordInteractionResponseMessageData {
        const row1 = new DiscordMessageActionRow().addComponents(
            new DiscordSelectMenu('column')
                .addOptions(...[0, 1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                    new DiscordSelectOption(String.fromCharCode(65 + i), `${i}`).setDefault(this.hoverLoc.x === i)
                )))
        );
        const row2 = new DiscordMessageActionRow().addComponents(
            new DiscordSelectMenu('row')
                .addOptions(...[0, 1, 2, 3, 4, 5, 6, 7].map(i => (
                    new DiscordSelectOption(`${i + 1}`, `${i}`).setDefault(this.hoverLoc.y === i)
                )))
        );
        const row3 = super.createMessageActionRowButton([['uncover', '👆'], ['flag', '🚩']]);

        const resp = new DiscordInteractionResponseMessageData();
        resp.embeds = [this.getBaseEmbed()
            .setDescription(this.gameBoardToString())
            .addField('How To Play:', 'Use the below select menus to choose a tile, then click the finger to reveal the tile, or the flag to flag the tile!', false)
            .setFooter(`Currently Playing: ${this.gameStarter.username}`)];
        resp.components = [row1, row2, row3];
        return resp;
    }

    protected getGameOverContent(result: GameResult): DiscordInteractionResponseMessageData {
        const resp = new DiscordInteractionResponseMessageData();
        resp.embeds = [this.getBaseEmbed().setDescription(`**GAME OVER!**\n${this.getWinnerText(result)}\n\n${this.gameBoardToString(false)}`)];
        return resp;
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
        this.gameBoard = this.gameBoard.map((v, i) => this.bombLocs[i] ? '💣' : v);
    }

    private uncover(col: number, row: number) {
        const index = row * WIDTH + col;
        if (this.bombLocs[index]) {
            this.gameBoard[index] = '💣';
        }
        else {
            let bombsAround = 0;
            for (let y = -1; y < 2; y++) {
                for (let x = -1; x < 2; x++) {
                    if (col + x < 0 || col + x >= WIDTH || row + y < 0 || row + y >= HEIGHT)
                        continue;
                    if (x === 0 && y === 0)
                        continue;
                    const i2 = (row + y) * WIDTH + (col + x);
                    if (this.bombLocs[i2])
                        bombsAround++;
                }
            }
            if (bombsAround == 0) {
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
            else {
                this.gameBoard[index] = numberEmotes[bombsAround - 1];
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