const Discord = require('discord.js');

const gameBoard = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];

const reactions = { "1️⃣": 1, "2️⃣": 2, "3️⃣": 3, "4️⃣": 4, "5️⃣": 5, "6️⃣": 6, "7️⃣": 7, "8️⃣": 8, "9️⃣": 9 }

const NO_MOVE = 0;
const PLAYER_1 = 1;
const PLAYER_2 = 2;

const cpu_mistake_chance = 5;

module.exports = class TicTacToeGame {
    constructor() {
        this.gameEmbed = null;
        this.inGame = false;
        this.xTurn = true;
        this.message = "";
        this.computersMove = { x: 0, y: 0 };
        this.winningPoints = { p1: -1, p2: -1 };
    }

    getGameDesc() {
        return this.message;
    }

    getGameboardStr() {
        let str = ""
        for (let y = 0; y < 3; y++) {
            for (let x = 0; x < 3; x++) {
                str += gameBoard[x][y];
            }
        }
        return str;
    }

    newGame(msg, onGameEnd) {
        if (this.inGame)
            return;

        this.gameStarter = msg.author;
        this.onGameEnd = onGameEnd;

        for (let y = 0; y < 3; y++) {
            for (let x = 0; x < 3; x++) {
                gameBoard[x][y] = NO_MOVE;
            }
        }

        this.inGame = true;
        this.winningPoints = { p1: -1, p2: -1 };

        msg.channel.send(this.getEmbed()).then(emsg => {
            this.gameEmbed = emsg;
            Object.keys(reactions).forEach(reaction => {
                this.gameEmbed.react(reaction);
            });

            this.waitForReaction();
        });
    }

    getEmbed() {
        return new Discord.MessageEmbed()
            .setColor('#ab0e0e')
            .setTitle('Tic-Tac-Toe')
            .setDescription(this.getGameDesc())
            .addField('Turn:', this.getTurn())
            .setImage(`https://api.theturkey.dev/discordgames/gentictactoeboard?gb=${this.getGameboardStr()}&p1=-1&p2=-1`)
            .setAuthor("Made By: TurkeyDev", "https://site.theturkey.dev/images/turkey_avatar.png", "https://twitter.com/turkeydev")
            .setFooter(`Currently Playing: ${this.gameStarter.username}`)
            .setTimestamp();
    }

    step() {
        this.gameEmbed.edit(this.getEmbed());

        this.waitForReaction();
    }

    gameOver(result) {
        if (result.result !== 'force_end')
            this.onGameEnd();

        this.inGame = false;
        const editEmbed = new Discord.MessageEmbed()
            .setColor('#ab0e0e')
            .setTitle('Tic-Tac-Toe')
            .setDescription("GAME OVER! " + this.getWinnerText(result))
            .setImage(`https://api.theturkey.dev/discordgames/gentictactoeboard?gb=${this.getGameboardStr()}&p1=${this.winningPoints.p1}&p2=${this.winningPoints.p2}`)
            .setAuthor("Made By: TurkeyDev", "https://site.theturkey.dev/images/turkey_avatar.png", "https://twitter.com/turkeydev")
            .setTimestamp();
        this.gameEmbed.edit(editEmbed);
        this.gameEmbed.reactions.removeAll();
    }

    filter(reaction, user) {
        return Object.keys(reactions).includes(reaction.emoji.name) && user.id === this.gameStarter.id;
    }

    waitForReaction() {
        this.gameEmbed.awaitReactions((reaction, user) => this.filter(reaction, user), { max: 1, time: 300000, errors: ['time'] })
            .then(collected => {
                const reaction = collected.first();
                this.gameEmbed.reactions.cache.get(reaction.emoji.name).remove();

                const index = reactions[reaction.emoji.name] - 1;
                const x = index % 3;
                const y = Math.floor(index / 3);
                if (gameBoard[x][y] !== 0) {
                    this.step();
                    return;
                }

                this.placeMove(x, y, PLAYER_1);


                if (!this.isGameOver()) {
                    //Make CPU Move
                    this.minimax(0, PLAYER_2);
                    let cpuIndex = (this.computersMove.y * 3) + this.computersMove.x + 1;
                    Object.keys(reactions).forEach(k => {
                        if (reactions[k] == cpuIndex && this.gameEmbed.reactions.cache.has(k))
                            this.gameEmbed.reactions.cache.get(k).remove();
                    });
                    this.placeMove(this.computersMove.x, this.computersMove.y, PLAYER_2);
                }

                if (this.isGameOver()) {
                    if (this.hasWon(PLAYER_2))
                        this.gameOver({ result: "winner", name: "The Computer" });
                    else if (this.hasWon(PLAYER_1))
                        this.gameOver({ result: "winner", name: "The Player" });
                    else
                        this.gameOver({ result: "tie" });
                }
                else {
                    this.step();
                }
            })
            .catch(error => {
                this.gameOver({ result: 'error', error: error });
            });
    }

    getTurn() {
        return this.xTurn ? 'X' : 'O';
    }

    getWinnerText(result) {
        if (result.result === 'tie')
            return 'It was a tie!';
        else if (result.result === 'timeout')
            return 'The game went unfinished :(';
        else if (result.result === 'force_end')
            return 'The game was ended';
        else if (result.result === 'error')
            return `Error: ${result.error}`;
        else
            return result.name + ' has won!';
    }

    isGameOver() {
        if (this.hasWon(PLAYER_1) || this.hasWon(PLAYER_2))
            return true;

        if (this.getAvailableStates().length == 0) {
            this.winningPoints = { p1: -1, p2: -1 };
            return true;
        }
        return false;
    }

    hasWon(player) {
        if (gameBoard[0][0] == gameBoard[1][1] && gameBoard[0][0] == gameBoard[2][2] && gameBoard[0][0] == player) {
            this.winningPoints = { p1: 0, p2: 8 };
            return true;
        }
        if (gameBoard[0][2] == gameBoard[1][1] && gameBoard[0][2] == gameBoard[2][0] && gameBoard[0][2] == player) {
            this.winningPoints = { p1: 6, p2: 2 };
            return true;
        }
        for (let i = 0; i < 3; ++i) {
            if (gameBoard[i][0] == gameBoard[i][1] && gameBoard[i][0] == gameBoard[i][2] && gameBoard[i][0] == player) {
                this.winningPoints = { p1: i, p2: i + 6 };
                return true;
            }

            if (gameBoard[0][i] == gameBoard[1][i] && gameBoard[0][i] == gameBoard[2][i] && gameBoard[0][i] == player) {
                this.winningPoints = { p1: i * 3, p2: (i * 3) + 2 };
                return true;
            }
        }
        return false;
    }

    getAvailableStates() {
        const availablePoints = [];
        for (let i = 0; i < 3; ++i)
            for (let j = 0; j < 3; ++j)
                if (gameBoard[i][j] == NO_MOVE)
                    availablePoints.push({ x: i, y: j });
        return availablePoints;
    }

    placeMove(x, y, player) {
        gameBoard[x][y] = player;
    }

    minimax(depth, turn) {
        //Game status...
        if (this.hasWon(PLAYER_2))
            return +1;
        if (this.hasWon(PLAYER_1))
            return -1;

        const pointsAvailable = this.getAvailableStates();
        if (pointsAvailable.length === 0)
            return 0;

        if (depth == 0 && Math.floor(Math.random() * Math.floor(cpu_mistake_chance)) == 2) {
            this.computersMove = pointsAvailable[Math.floor(Math.random() * Math.floor(pointsAvailable.length))];
            return 0;
        }


        let min = Number.MAX_SAFE_INTEGER;
        let max = Number.MIN_SAFE_INTEGER;
        for (let i = 0; i < pointsAvailable.length; ++i) {
            const point = pointsAvailable[i];
            if (turn == PLAYER_2) {
                this.placeMove(point.x, point.y, PLAYER_2);
                const currentScore = this.minimax(depth + 1, PLAYER_1);
                max = Math.max(currentScore, max);

                if (currentScore >= 0 && depth == 0)
                    this.computersMove = point;

                if (currentScore == 1) {
                    gameBoard[point.x][point.y] = 0;
                    break;
                }

                if (i == pointsAvailable.length - 1 && max < 0 && depth == 0)
                    this.computersMove = point;
            }
            else if (turn == PLAYER_1) {
                this.placeMove(point.x, point.y, PLAYER_1);
                const currentScore = this.minimax(depth + 1, PLAYER_2);
                min = Math.min(currentScore, min);
                if (min == -1) {
                    gameBoard[point.x][point.y] = 0;
                    break;
                }
            }
            gameBoard[point.x][point.y] = 0;
        }
        return turn == PLAYER_2 ? max : min;
    }
}
