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

const snake = new SnakeGame();
const hangman = new HangmanGame();
const minesweeper = new MinesweeperGame();
const connect4 = new Connect4Game();
const chess = new ChessGame();
const ticTacToe = new TicTacToeGame();

const commandGameMap = {
    '!snake': snake,
    '!hangman': hangman,
    '!connect4': connect4,
    '!minesweeper': minesweeper,
    '!chess': chess,
    '!tictactoe': ticTacToe
};
const playerGameMap = {};

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
});

client.on('message', msg => {
    const msgParts = msg.content.toLowerCase().split(' ');
    if (msg.channel.name && msg.channel.name.includes("hidden")) {
        if (commandGameMap.hasOwnProperty(msgParts[0])) {
            const game = commandGameMap[msgParts[0]].initGame();
            if (!game.inGame) {
                if (!playerGameMap.hasOwnProperty(msg.guild.id))
                    playerGameMap[msg.guild.id] = {};

                if (playerGameMap[msg.guild.id].hasOwnProperty(msg.author.id)) {
                    msg.reply("You must either finish or end your current game (!end) before you can play another!");
                }
                else {
                    game.newGame(msg, () => {
                        delete playerGameMap[msg.guild.id][msg.author.id];
                    });
                    playerGameMap[msg.guild.id][msg.author.id] = game;
                }
            }
            else {
                msg.reply("Sorry, there can only be 1 instance of a game at a time!");
            }
        }
        else if (msgParts[0] === '!end' || msgParts[0] === '!stop') {
            const userId = msg.author.id;
            const guildID = msg.guild.id;
            if (playerGameMap.hasOwnProperty(guildID) && playerGameMap[guildID].hasOwnProperty(userId)) {
                const game = playerGameMap[guildID][userId];
                game.gameOver({ result: 'force_end' });
                delete playerGameMap[guildID][userId];
            }
        }
        else if (msgParts[0] === '!help') {
            const embed = new Discord.MessageEmbed()
                .setColor('#fc2eff')
                .setTitle('Help - Commands')
                .setDescription("!snake - Play Snake\n!hangman - Play Hangman\n!connect4 - Play Connect4\n!minesweeper - Play Minesweeper\n!chess - Play Chess\n!tictactoe - Play TicTacToe")
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