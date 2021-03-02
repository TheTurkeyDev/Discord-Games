import GameResult, { ResultType } from "./game-result";
import Discord, { Message, MessageEmbed, MessageReaction, User } from 'discord.js';
import GameBase from "./game-base";

const WIDTH = 7;
const HEIGHT = 7;
const gameBoard: string[] = [];

const reactions = new Map([
    ["1️⃣", 1],
    ["2️⃣", 2],
    ["3️⃣", 3],
    ["4️⃣", 4],
    ["5️⃣", 5],
    ["6️⃣", 6],
    ["7️⃣", 7]
])

export default class Connect4Game extends GameBase {

    constructor() {
        super('connect4', true);
    }

    public initGame(): GameBase {
        return new Connect4Game();
    }

    private gameBoardToString(): string {
        let str = '';
        if (!this.player2 == null)
            str += 'Note there is no AI for this game, so you are just playing against yourself';
        str += "\n| . 1 | . 2 | 3 | . 4 | . 5 | 6 | . 7 |\n"
        for (let y = 0; y < HEIGHT; y++) {
            for (let x = 0; x < WIDTH; x++) {
                str += "|" + gameBoard[y * WIDTH + x];
            }
            str += "|\n";
        }
        return str;
    }

    public newGame(msg: Message, player2: User | null, onGameEnd: () => void): void {
        if (super.isInGame())
            return;

        for (let y = 0; y < HEIGHT; y++) {
            for (let x = 0; x < WIDTH; x++) {
                gameBoard[y * WIDTH + x] = "⚪";
            }
        }
        super.newGame(msg, player2, onGameEnd, Array.from(reactions.keys()));
    }

    protected getEmbed(): MessageEmbed {
        return new Discord.MessageEmbed()
            .setColor('#000b9e')
            .setTitle('Connect-4')
            .setAuthor("Made By: TurkeyDev", "https://site.theturkey.dev/images/turkey_avatar.png", "https://twitter.com/turkeydev")
            .setDescription(this.gameBoardToString())
            .addField('Turn:', this.getUserDisplay())
            .setFooter(`Currently Playing: ${this.gameStarter.username}`)
            .setTimestamp();
    }

    protected getGameOverEmbed(result: GameResult): MessageEmbed {
        return new Discord.MessageEmbed()
            .setColor('#000b9e')
            .setTitle('Connect-4')
            .setAuthor("Made By: TurkeyDev", "https://site.theturkey.dev/images/turkey_avatar.png", "https://twitter.com/turkeydev")
            .setDescription(`**GAME OVER! ${this.getWinnerText(result)}**\n\n${this.gameBoardToString()}`)
            .setTimestamp();
    }

    protected step() {
        this.player1Turn = !this.player1Turn;
        super.step();
    }

    protected onReaction(reaction: MessageReaction): void {
        let column = reactions.get(reaction.emoji.name);
        if (column === undefined)
            return;

        column -= 1;
        let placedX = -1;
        let placedY = -1;

        for (let y = HEIGHT - 1; y >= 0; y--) {
            const chip = gameBoard[column + (y * WIDTH)];
            if (chip === "⚪") {
                gameBoard[column + (y * WIDTH)] = this.getChipFromTurn();
                placedX = column;
                placedY = y;
                break;
            }
        }

        reaction.users.remove(reaction.users.cache.filter(user => user.id !== this.gameEmbed.author.id).first()?.id).then(() => {
            if (placedY == 0)
                this.gameEmbed.reactions.cache.get(reaction.emoji.name)?.remove();

            if (this.hasWon(placedX, placedY)) {
                this.gameOver({ result: ResultType.WINNER, name: this.getUserDisplay() });
            }
            else if (this.isBoardFull()) {
                this.gameOver({ result: ResultType.TIE });
            }
            else {
                this.step();
            }
        });
    }

    private getUserDisplay(): string {
        if (this.isMultiplayerGame && this.player2 !== null)
            return this.player1Turn ? '🔴 ' + this.gameStarter.username : '🟡 ' + this.player2!.username;
        return this.getChipFromTurn();
    }

    private getChipFromTurn(): string {
        return this.player1Turn ? '🔴' : '🟡';
    }

    private hasWon(placedX: number, placedY: number): boolean {
        const chip = this.getChipFromTurn();

        //Horizontal Check
        const y = placedY * WIDTH;
        for (var i = Math.max(0, placedX - 3); i <= placedX; i++) {
            var adj = i + y;
            if (i + 3 < WIDTH) {
                if (gameBoard[adj] === chip && gameBoard[adj + 1] === chip && gameBoard[adj + 2] === chip && gameBoard[adj + 3] === chip)
                    return true;
            }
        }

        //Verticle Check
        for (var i = Math.max(0, placedY - 3); i <= placedY; i++) {
            var adj = placedX + (i * WIDTH);
            if (i + 3 < HEIGHT) {
                if (gameBoard[adj] === chip && gameBoard[adj + WIDTH] === chip && gameBoard[adj + (2 * WIDTH)] === chip && gameBoard[adj + (3 * WIDTH)] === chip)
                    return true;
            }
        }

        //Ascending Diag
        for (var i = -3; i <= 0; i++) {
            var adjX = placedX + i;
            var adjY = placedY + i;
            var adj = adjX + (adjY * WIDTH);
            if (adjX + 3 < WIDTH && adjY + 3 < HEIGHT) {
                if (gameBoard[adj] === chip && gameBoard[adj + WIDTH + 1] === chip && gameBoard[adj + (2 * WIDTH) + 2] === chip && gameBoard[adj + (3 * WIDTH) + 3] === chip)
                    return true;
            }
        }

        //Descending Diag
        for (var i = -3; i <= 0; i++) {
            var adjX = placedX + i;
            var adjY = placedY - i;
            var adj = adjX + (adjY * WIDTH);
            if (adjX + 3 < WIDTH && adjY - 3 >= 0) {
                if (gameBoard[adj] === chip && gameBoard[adj - WIDTH + 1] === chip && gameBoard[adj - (2 * WIDTH) + 2] === chip && gameBoard[adj - (3 * WIDTH) + 3] === chip)
                    return true;
            }
        }

        return false;
    }

    private isBoardFull(): boolean {
        for (let y = 0; y < HEIGHT; y++)
            for (let x = 0; x < WIDTH; x++)
                if (gameBoard[y * WIDTH + x] === "⚪")
                    return false;
        return true;
    }

    private getWinnerText(result: GameResult): string {
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
}