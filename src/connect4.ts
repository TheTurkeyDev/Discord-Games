import GameResult, { ResultType } from './game-result';
import GameBase from './game-base';
import { DiscordUser, DiscordEmbed, DiscordMessageReactionAdd, DiscordInteraction, DiscordInteractionResponseMessageData } from 'discord-minimal';

const WIDTH = 7;
const HEIGHT = 7;

export default class Connect4Game extends GameBase {
    private gameBoard: string[];

    constructor() {
        super('connect4', true);
        this.gameBoard = Array.from({ length: WIDTH * HEIGHT }, () => '⚪');
    }

    private gameBoardToString(): string {
        let str = '';
        if (!this.player2)
            str += 'Note there is no AI for this game, so you are just playing against yourself';
        str += '\n|1️⃣|2️⃣|3️⃣|4️⃣|5️⃣|6️⃣|7️⃣|\n';
        for (let y = 0; y < HEIGHT; y++) {
            for (let x = 0; x < WIDTH; x++)
                str += '|' + this.gameBoard[y * WIDTH + x];
            str += '|\n';
        }
        return str;
    }

    public newGame(interaction: DiscordInteraction, player2: DiscordUser | null, onGameEnd: (result: GameResult) => void): void {
        if (super.isInGame())
            return;

        this.gameBoard = Array.from({ length: WIDTH * HEIGHT }, () => '⚪');
        super.newGame(interaction, player2, onGameEnd);
    }

    private getBaseEmbed(): DiscordEmbed {
        return new DiscordEmbed()
            .setColor('#000b9e')
            .setTitle('Connect-4')
            .setAuthor('Made By: TurkeyDev', 'https://site.theturkey.dev/images/turkey_avatar.png', 'https://www.youtube.com/watch?v=Sl1ZnvlNalI')
            .setTimestamp();
    }

    protected getContent(): DiscordInteractionResponseMessageData {
        const row1 = super.createMessageActionRowButton([['1', '1️⃣'], ['2', '2️⃣'], ['3', '3️⃣'], ['4', '4️⃣']]);
        const row2 = super.createMessageActionRowButton([['5', '5️⃣'], ['6', '6️⃣'], ['7', '7️⃣']]);

        const resp = new DiscordInteractionResponseMessageData();
        resp.embeds = [this.getBaseEmbed()
            .setDescription(this.gameBoardToString())
            .addField('Turn:', this.getUserDisplay())
            .setFooter(`Currently Playing: ${this.gameStarter.username}`)];
        resp.components = [row1, row2];
        return resp;

    }

    protected getGameOverContent(result: GameResult): DiscordInteractionResponseMessageData {
        const resp = new DiscordInteractionResponseMessageData();
        resp.embeds = [this.getBaseEmbed().setDescription(`**GAME OVER! ${this.getWinnerText(result)}**\n\n${this.gameBoardToString()}`)];
        return resp;
    }

    protected step(): void {
        this.player1Turn = !this.player1Turn;
        super.step(false);
    }

    public onReaction(reaction: DiscordMessageReactionAdd): void { }
    public onInteraction(interaction: DiscordInteraction): void {
        const sender = interaction.member?.user?.id;
        const turnPlayerId = this.player1Turn ? this.gameStarter.id : (this.player2 ? this.player2.id : this.gameStarter.id);
        if (sender !== turnPlayerId) {
            interaction.deferUpdate().catch(e => super.handleError(e, 'defer interaction'));
            return;
        }

        const customId = interaction.data?.custom_id;
        if (!customId) {
            this.step();
            interaction.deferUpdate().catch(e => super.handleError(e, 'defer interaction'));
            return;
        }

        let column = parseInt(customId);

        if (column === undefined) {
            interaction.deferUpdate().catch(e => super.handleError(e, 'defer interaction'));
            return;
        }

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
            interaction.update(this.getContent()).catch(e => super.handleError(e, 'update interaction'));
        }
    }

    private getScore(): string {
        return this.gameBoard.map(chip => chip === '⚪' ? '0' : (chip === '🔴' ? '1' : '2')).join('');
    }

    private getUserDisplay(): string {
        if (this.isMultiplayerGame && this.player2)
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
        for (let i = Math.max(0, placedX - 3); i <= Math.min(placedX, WIDTH - 1); i++) {
            const adj = i + y;
            if (i + 3 < WIDTH) {
                if (this.gameBoard[adj] === chip && this.gameBoard[adj + 1] === chip && this.gameBoard[adj + 2] === chip && this.gameBoard[adj + 3] === chip)
                    return true;
            }
        }

        //Vertical Check
        for (let i = Math.max(0, placedY - 3); i <= Math.min(placedY, HEIGHT - 1); i++) {
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
            if(adjX < 0 || adjY < 0)
                continue;
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
            if(adjX < 0 || adjY < 0)
                continue;
            const adj = adjX + (adjY * WIDTH);
            if (adjX + 3 < WIDTH && adjY - 3 >= 0) {
                if (this.gameBoard[adj] === chip && this.gameBoard[adj - WIDTH + 1] === chip && this.gameBoard[adj - (2 * WIDTH) + 2] === chip && this.gameBoard[adj - (3 * WIDTH) + 3] === chip)
                    return true;
            }
        }

        return false;
    }

    private isBoardFull(): boolean {
        return !this.gameBoard.includes('⚪');
    }
}