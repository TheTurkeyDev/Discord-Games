const Discord = require('discord.js');
const config = require('./config');
const SnakeGame = require('./snake');
const HangmanGame = require('./hangman');
const MinesweeperGame = require('./minesweeper');
const Connect4Game = require('./connect4');
const ChessGame = require('./chess');
const TicTacToeGame = require('./tic-tac-toe');
const express = require('express');

const client = new Discord.Client(["MANAGE_MESSAGES"]);

const snake = new SnakeGame(client);
const hangman = new HangmanGame(client);
const minesweeper = new MinesweeperGame(client);
const connect4 = new Connect4Game(client);
const chess = new ChessGame(client);
const ticTacToe = new TicTacToeGame(client);

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
});

client.on('message', msg => {
    if (msg.channel.name && msg.channel.name.includes("bot_land")) {
        if (msg.content.toLowerCase() === '!snake') {
            snake.newGame(msg);
        }
        else if (msg.content.toLowerCase() === '!hangman') {
            hangman.newGame(msg);
        }
        else if (msg.content.toLowerCase() === '!connect4') {
            connect4.newGame(msg);
        }
        else if (msg.content.toLowerCase() === '!minesweeper') {
            minesweeper.newGame(msg);
        }
        else if (msg.content.toLowerCase() === '!chess') {
            chess.newGame(msg);
        }
        else if (msg.content.toLowerCase() === '!tictactoe') {
            ticTacToe.newGame(msg);
        }
        else if (msg.content.toLowerCase() === '!help') {
            const embed = new Discord.MessageEmbed()
                .setColor('#fc2eff')
                .setTitle('Help - Commands')
                .setDescription("!snake - Play Snake\n!hangman - Play Hangman\n!connect4 - Play Connect4\n!minesweeper - Play Minesweeper\n!chess - Play Chess")
                .setTimestamp();
            msg.channel.send(embed);
        }
    }
});

client.login(config.token);

const app = express()
const port = 3030

app.get('/', (req, res) => {
    res.send('<script>window.close();</script>');
    if (req.query.col && req.query.row) {
        minesweeper.makeMove(parseInt(req.query.col), parseInt(req.query.row));
    }
})

app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`);
})