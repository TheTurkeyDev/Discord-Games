const Discord = require('discord.js');

const WIDTH = 8;
const HEIGHT = 8;
const gameBoard = [];

class MinesweeperGame {
    constructor() {
        this.gameEmbed = null;
        this.inGame = false;
        for (let y = 0; y < HEIGHT; y++) {
            for (let x = 0; x < WIDTH; x++) {
                gameBoard[y * WIDTH + x] = "🟦";
            }
        }
    }

    gameBoardToString() {
        let str = ""
        for (let y = 0; y < HEIGHT; y++) {
            for (let x = 0; x < WIDTH; x++) {                  
                    str += "[" + gameBoard[y * WIDTH + x] + "](http://d12.io/a1)";
            }
            str += "\n";
        }
        return str;
    }

    newGame(msg) {
        if (this.inGame)
            return;

        this.inGame = true;
        const embed = new Discord.MessageEmbed()
            .setColor('#0099ff')
            .setTitle('Minesweeper')
            .setDescription(this.gameBoardToString())
            .setTimestamp();

        msg.channel.send(embed).then(emsg => {
            this.gameEmbed = emsg;
            this.waitForReaction();
        });
    }

    step() {
        const editEmbed = new Discord.MessageEmbed()
            .setColor('#0099ff')
            .setTitle('Minesweeper')
            .setDescription(this.gameBoardToString())
            .setTimestamp();
        this.gameEmbed.edit(editEmbed);

        this.waitForReaction();
    }

    gameOver() {
        this.inGame = false;
        const editEmbed = new Discord.MessageEmbed()
            .setColor('#0099ff')
            .setTitle('Minesweeper')
            .setDescription("GAME OVER!")
            .setTimestamp();
        this.gameEmbed.edit(editEmbed);
    }

    filter(reaction, user) {
        return ['⬅️', '⬆️', '⬇️', '➡️'].includes(reaction.emoji.name) && user.id !== this.gameEmbed.author.id;
    }

    waitForReaction() {
        this.gameEmbed.awaitReactions((reaction, user) => this.filter(reaction, user), { max: 1, time: 60000, errors: ['time'] })
            .then(collected => {
                const reaction = collected.first();

                const snakeHead = this.snake[0];
                const nextPos = { x: snakeHead.x, y: snakeHead.y };
                if (reaction.emoji.name === '⬅️') {
                    let nextX = snakeHead.x - 1;
                    if (nextX < 0)
                        nextX = WIDTH - 1;
                    nextPos.x = nextX;
                }
                else if (reaction.emoji.name === '⬆️') {
                    let nextY = snakeHead.y - 1;
                    if (nextY < 0)
                        nextY = HEIGHT - 1;
                    nextPos.y = nextY;
                }
                else if (reaction.emoji.name === '⬇️') {
                    let nextY = snakeHead.y + 1;
                    if (nextY >= HEIGHT)
                        nextY = 0;
                    nextPos.y = nextY;
                }
                else if (reaction.emoji.name === '➡️') {
                    let nextX = snakeHead.x + 1;
                    if (nextX >= WIDTH)
                        nextX = 0;
                    nextPos.x = nextX;
                }

                reaction.users.remove(reaction.users.cache.filter(user => user.id !== this.gameEmbed.author.id).first().id).then(() => {
                    if (this.isLocInSnake(nextPos)) {
                        this.gameOver();
                    }
                    else {
                        this.snake.unshift(nextPos);
                        if (this.snake.length > this.snakeLength)
                            this.snake.pop();

                        this.step();
                    }
                });
            })
            .catch(collected => {
                this.gameOver();
            });
    }
}

module.exports = MinesweeperGame;