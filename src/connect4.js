const Discord = require('discord.js');

const WIDTH = 7;
const HEIGHT = 7;
const gameBoard = [];

const reactions = { "1️⃣": 1, "2️⃣": 2, "3️⃣": 3, "4️⃣": 4, "5️⃣": 5, "6️⃣": 6, "7️⃣": 7 }

module.exports = class Connect4Game {
    constructor() {
        this.gameEmbed = null;
        this.inGame = false;
        this.redTurn = true;
    }

    gameBoardToString() {
        let str = "| . 1 | . 2 | 3 | . 4 | . 5 | 6 | . 7 |\n"
        for (let y = 0; y < HEIGHT; y++) {
            for (let x = 0; x < WIDTH; x++) {
                str += "|" + gameBoard[y * WIDTH + x];
            }
            str += "|\n";
        }
        return str;
    }

    newGame(msg, onGameEnd) {
        if (this.inGame)
            return;

        this.gameStarter = msg.author;
        this.onGameEnd = onGameEnd;

        for (let y = 0; y < HEIGHT; y++) {
            for (let x = 0; x < WIDTH; x++) {
                gameBoard[y * WIDTH + x] = "⚪";
            }
        }

        this.inGame = true;

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
            .setColor('#000b9e')
            .setTitle('Connect-4')
            .setAuthor("Made By: TurkeyDev", "https://site.theturkey.dev/images/turkey_avatar.png", "https://twitter.com/turkeydev")
            .setDescription(this.gameBoardToString())
            .addField('Turn:', this.getChipFromTurn())
            .setFooter(`Currently Playing: ${this.gameStarter.username}`)
            .setTimestamp();
    }

    step() {
        this.redTurn = !this.redTurn;
        this.gameEmbed.edit(this.getEmbed());

        this.waitForReaction();
    }

    gameOver(result) {
        if (result.result !== 'force_end')
            this.onGameEnd();

        this.inGame = false;
        const editEmbed = new Discord.MessageEmbed()
            .setColor('#000b9e')
            .setTitle('Connect-4')
            .setAuthor("Made By: TurkeyDev", "https://site.theturkey.dev/images/turkey_avatar.png", "https://twitter.com/turkeydev")
            .setDescription(`**GAME OVER! ${this.getWinnerText(result)}**\n\n${this.gameBoardToString()}`)
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
                const column = reactions[reaction.emoji.name] - 1;
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

                reaction.users.remove(reaction.users.cache.filter(user => user.id !== this.gameEmbed.author.id).first().id).then(() => {
                    if (placedY == 0)
                        this.gameEmbed.reactions.cache.get(reaction.emoji.name).remove();

                    if (this.hasWon(placedX, placedY)) {
                        this.gameOver({ result: 'winner', name: this.getChipFromTurn() });
                    }
                    else if (this.isBoardFull()) {
                        this.gameOver({ result: 'tie' });
                    }
                    else {
                        this.step();
                    }
                });
            })
            .catch(collected => {
                this.gameOver({ result: 'timeout' });
            });
    }

    getChipFromTurn() {
        return this.redTurn ? "🔴" : "🟡";
    }

    hasWon(placedX, placedY) {
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

    isBoardFull() {
        for (let y = 0; y < HEIGHT; y++)
            for (let x = 0; x < WIDTH; x++)
                if (gameBoard[y * WIDTH + x] === "⚪")
                    return false;
        return true;
    }

    getWinnerText(result) {
        if (result.result === 'tie')
            return 'It was a tie!';
        else if (result.result === 'timeout')
            return 'The game went unfinished :(';
        else if (result.result === 'force_end')
            return 'The game was ended';
        else if (result.result === 'error')
            return 'ERROR: ' + result.error;
        else
            return result.name + ' has won!';
    }
}