import { DiscordMessage, DiscordUser, DiscordEmbed, DiscordInteraction, DiscordMessageReactionAdd, DiscordMessageActionRow, DiscordMessageButton, DiscordButtonStyle } from 'discord-minimal';
import GameBase from './game-base';
import Position from './position';
import GameResult, { ResultType } from './game-result';
import { GameContent } from './game-content';

const WIDTH = 15;
const HEIGHT = 10;

export default class SnakeGame extends GameBase {
    private gameBoard: string[] = [];
    private apple: Position = { x: 1, y: 1 };
    private snake: Position[] = [];
    private snakeLength: number;
    private score: number;

    constructor() {
        super('snake', false);
        this.snake.push({ x: 5, y: 5 });
        this.snakeLength = 1;
        this.score = 0;
        for (let y = 0; y < HEIGHT; y++)
            for (let x = 0; x < WIDTH; x++)
                this.gameBoard[y * WIDTH + x] = '🟦';
    }

    protected getGameboard(): string {
        let str = '';
        for (let y = 0; y < HEIGHT; y++) {
            for (let x = 0; x < WIDTH; x++) {
                if (x == this.apple.x && y == this.apple.y) {
                    str += '🍎';
                    continue;
                }

                let flag = true;
                for (let s = 0; s < this.snake.length; s++) {
                    if (x === this.snake[s].x && y === this.snake[s].y) {
                        if (s === 0) {
                            if (this.inGame)
                                str += '🐍';
                            else
                                str += '☠️';
                        }
                        else {
                            str += '🟩';
                        }
                        flag = false;
                    }
                }

                if (flag)
                    str += this.gameBoard[y * WIDTH + x];
            }
            str += '\n';
        }
        return str;
    }

    private isLocInSnake(pos: Position): boolean {
        return this.snake.find(sPos => sPos.x == pos.x && sPos.y == pos.y) !== undefined;
    }

    private newAppleLoc(): void {
        let newApplePos = { x: 0, y: 0 };
        do {
            newApplePos = { x: Math.floor(Math.random() * WIDTH), y: Math.floor(Math.random() * HEIGHT) };
        } while (this.isLocInSnake(newApplePos));

        this.apple.x = newApplePos.x;
        this.apple.y = newApplePos.y;
    }

    public newGame(interaction: DiscordInteraction, player2: DiscordUser | null, onGameEnd: (result: GameResult) => void): void {
        if (super.isInGame())
            return;
        this.score = 0;
        this.snakeLength = 1;
        this.snake = [{ x: 5, y: 5 }];
        this.newAppleLoc();
        super.newGame(interaction, player2, onGameEnd);
    }

    protected getContent(): GameContent {
        const row = super.createMessageActionRowButton([['left', '⬅️'], ['up', '⬆️'], ['right', '➡️'], ['down', '⬇️']]);

        return {
            embeds: [new DiscordEmbed()
                .setColor('#03ad03')
                .setTitle('Snake Game')
                .setAuthor('Made By: TurkeyDev', 'https://site.theturkey.dev/images/turkey_avatar.png', 'https://www.youtube.com/watch?v=tk5c0t72Up4')
                .setDescription(this.getGameboard())
                .setFooter(`Currently Playing: ${this.gameStarter.username}`)
                .setTimestamp()],
            components: [row]
        };
    }

    protected getGameOverContent(result: GameResult): GameContent {
        return {
            embeds: [new DiscordEmbed()
                .setColor('#03ad03')
                .setTitle('Snake Game')
                .setAuthor('Made By: TurkeyDev', 'https://site.theturkey.dev/images/turkey_avatar.png', 'https://www.youtube.com/watch?v=tk5c0t72Up4')
                .setDescription(`**GAME OVER!**\nScore: ${this.score}\n\n${this.getGameboard()}`)
                .setTimestamp()],
            components: []
        };
    }

    protected step(): void {
        if (this.apple.x == this.snake[0].x && this.apple.y == this.snake[0].y) {
            this.score += 1;
            this.snakeLength++;
            this.newAppleLoc();
        }
        super.step(false);
    }

    public onReaction(reaction: DiscordMessageReactionAdd): void { }

    public onInteraction(interaction: DiscordInteraction): void {
        const snakeHead = this.snake[0];
        const nextPos = { x: snakeHead.x, y: snakeHead.y };
        let nextX;
        let nextY;
        switch (interaction.data?.custom_id) {
            case 'left':
                nextX = snakeHead.x - 1;
                if (nextX < 0) {
                    this.gameOver({ result: ResultType.LOSER, score: this.score.toString() }, interaction);
                    return;
                }
                nextPos.x = nextX;
                break;
            case 'up':
                nextY = snakeHead.y - 1;
                if (nextY < 0) {
                    this.gameOver({ result: ResultType.LOSER, score: this.score.toString() }, interaction);
                    return;
                }
                nextPos.y = nextY;
                break;
            case 'down':
                nextY = snakeHead.y + 1;
                if (nextY >= HEIGHT) {
                    this.gameOver({ result: ResultType.LOSER, score: this.score.toString() }, interaction);
                    return;
                }
                nextPos.y = nextY;
                break;
            case 'right':
                nextX = snakeHead.x + 1;
                if (nextX >= WIDTH) {
                    this.gameOver({ result: ResultType.LOSER, score: this.score.toString() }, interaction);
                    return;
                }
                nextPos.x = nextX;
                break;
        }

        if (this.isLocInSnake(nextPos)) {
            this.gameOver({ result: ResultType.LOSER, score: this.score.toString() }, interaction);
        }
        else {
            this.snake.unshift(nextPos);
            if (this.snake.length > this.snakeLength)
                this.snake.pop();
            this.step();
            interaction.update(this.getContent()).catch(e => super.handleError(e, 'update interaction'));
        }
    }
}