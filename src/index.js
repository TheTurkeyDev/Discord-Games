const Discord = require('discord.js');
const config = require('./config');
const SnakeGame = require('./snake-game');
const HangmanGame = require('./hangman-game');
const MinesweeperGame = require('./minesweeper');
const Connect4 = require('./connect4');
const express = require('express')

const client = new Discord.Client(["MANAGE_MESSAGES"]);

const snakeGame = new SnakeGame(client);
const hangman = new HangmanGame(client);
const minesweeper = new MinesweeperGame(client);
const connect4 = new Connect4(client);

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
});

client.on('message', msg => {
    if (msg.channel.name.includes("bot_land")) {
        if (msg.content.toLowerCase() === '!snake') {
            snakeGame.newGame(msg);
        }
        else if (msg.content.toLowerCase() === '!hangman') {
            hangman.newGame(msg);
        }
        else if (msg.content.toLowerCase() === '!connect4') {
            connect4.newGame(msg);
        }
        else if (msg.content.toLowerCase() === '!minesweeper') {
            minesweeper.newGame(msg);
        } else if (msg.content.toLowerCase() === '!help') {
            const embed = new Discord.MessageEmbed()
                .setColor('#fc2eff')
                .setTitle('Help - Commands')
                .setDescription("!snake - Play Snake\n!hangman - Play Hangman\n!connect4 - Play Connect4\n!minesweeper - Play Minesweeper")
                .setTimestamp();
            msg.channel.send(embed);
        }
    }
});

client.login(config.token);

const app = express()
const port = 3030

app.get('/', (req, res) => {
    res.send('Hello World!');
    if (req.query.col && req.query.row) {
        minesweeper.makeMove(parseInt(req.query.col), parseInt(req.query.row));
    }
})

app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`);
})