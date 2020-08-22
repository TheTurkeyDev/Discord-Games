const Discord = require('discord.js');
const config = require('./config');
const SnakeGame = require('./snake-game');
const HangmanGame = require('./hangman-game');

const client = new Discord.Client(["MANAGE_MESSAGES"]);

const snakeGame = new SnakeGame(client);
const hangman = new HangmanGame(client);

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
    }
});

client.login(config.token);