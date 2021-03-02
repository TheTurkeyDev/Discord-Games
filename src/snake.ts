import GameBase from './game-base';
import Discord, { Message, MessageEmbed, MessageReaction, User } from 'discord.js';
import Position from './position';
import GameResult, { ResultType } from './game-result';

const WIDTH: number = 15;
const HEIGHT: number = 10;
const gameBoard: string[] = [];
const apple: Position = { x: 1, y: 1 };

export default class SnakeGame extends GameBase {
    private snake: Position[] = [];
    private snakeLength: number;
    private score: number;

    constructor() {
        super('snake', false);
        this.snake.push({ x: 5, y: 5 });
        this.snakeLength = 1;
        this.score = 0;
        for (let y = 0; y < HEIGHT; y++) {
            for (let x = 0; x < WIDTH; x++) {
                gameBoard[y * WIDTH + x] = "🟦";
            }
        }
    }

    public initGame(): GameBase {
        return new SnakeGame();
    }

    protected getGameboard(): string {
        let str = ""
        for (let y = 0; y < HEIGHT; y++) {
            for (let x = 0; x < WIDTH; x++) {
                if (x == apple.x && y == apple.y) {
                    str += "🍎";
                    continue;
                }

                let flag = true;
                for (let s = 0; s < this.snake.length; s++) {
                    if (x === this.snake[s].x && y === this.snake[s].y) {
                        if (s === 0) {
                            if (this.inGame)
                                str += "🐍";
                            else
                                str += "☠️";
                        }
                        else {
                            str += "🟩";
                        }
                        flag = false;
                    }
                }

                if (flag)
                    str += gameBoard[y * WIDTH + x];
            }
            str += "\n";
        }
        return str;
    }

    private isLocInSnake(pos: Position): boolean {
        return this.snake.find(sPos => sPos.x == pos.x && sPos.y == pos.y) !== undefined;
    };

    private newAppleLoc(): void {
        let newApplePos = { x: 0, y: 0 };
        do {
            newApplePos = { x: Math.floor(Math.random() * WIDTH), y: Math.floor(Math.random() * HEIGHT) };
        } while (this.isLocInSnake(newApplePos))

        apple.x = newApplePos.x;
        apple.y = newApplePos.y;
    }

    public newGame(msg: Message, player2: User | null, onGameEnd: () => void): void {
        if (super.isInGame())
            return;
        this.score = 0;
        this.snakeLength = 1;
        this.snake = [{ x: 5, y: 5 }];
        this.newAppleLoc();
        super.newGame(msg, player2, onGameEnd, ['⬅️', '⬆️', '⬇️', '➡️']);
    }

    protected getEmbed(): MessageEmbed {
        return new Discord.MessageEmbed()
            .setColor('#03ad03')
            .setTitle('Snake Game')
            .setAuthor("Made By: TurkeyDev", "https://site.theturkey.dev/images/turkey_avatar.png", "https://twitter.com/turkeydev")
            .setDescription(this.getGameboard())
            .setFooter(`Currently Playing: ${this.gameStarter.username}`)
            .setTimestamp();
    }

    protected getGameOverEmbed(result: GameResult): MessageEmbed {
        return new Discord.MessageEmbed()
            .setColor('#03ad03')
            .setTitle('Snake Game')
            .setAuthor("Made By: TurkeyDev", "https://site.theturkey.dev/images/turkey_avatar.png", "https://twitter.com/turkeydev")
            .setDescription(`**GAME OVER!**\nScore: ${this.score}\n\n${this.getGameboard()}`)
            .setTimestamp();
    }

    protected step(): void {
        if (apple.x == this.snake[0].x && apple.y == this.snake[0].y) {
            this.score += 1;
            this.snakeLength++;
            this.newAppleLoc();
        }
        super.step();
    }

    protected onReaction(reaction: MessageReaction): void {
        const snakeHead = this.snake[0];
        const nextPos = { x: snakeHead.x, y: snakeHead.y };
        if (reaction.emoji.name === '⬅️') {
            let nextX = snakeHead.x - 1;
            if (nextX < 0) {
                this.gameOver({ result: ResultType.WINNER });
                return;
            }
            nextPos.x = nextX;
        }
        else if (reaction.emoji.name === '⬆️') {
            let nextY = snakeHead.y - 1;
            if (nextY < 0) {
                this.gameOver({ result: ResultType.WINNER });
                return;
            }
            nextPos.y = nextY;
        }
        else if (reaction.emoji.name === '⬇️') {
            let nextY = snakeHead.y + 1;
            if (nextY >= HEIGHT) {
                this.gameOver({ result: ResultType.WINNER });
                return;
            }
            nextPos.y = nextY;
        }
        else if (reaction.emoji.name === '➡️') {
            let nextX = snakeHead.x + 1;
            if (nextX >= WIDTH) {
                this.gameOver({ result: ResultType.WINNER });
                return;
            }
            nextPos.x = nextX;
        }

        reaction.users.remove(reaction.users.cache.filter(user => user.id !== this.gameEmbed.author.id).first()?.id).then(() => {
            if (this.isLocInSnake(nextPos)) {
                this.gameOver({ result: ResultType.WINNER });
            }
            else {
                this.snake.unshift(nextPos);
                if (this.snake.length > this.snakeLength)
                    this.snake.pop();
                this.step();
            }
        });
    }
}