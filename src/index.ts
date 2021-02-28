import Discord, { Client, TextChannel, User } from 'discord.js';
import { token } from './config';
import SnakeGame from './snake';
import HangmanGame from './hangman';
import MinesweeperGame from './minesweeper';
import Connect4Game from './connect4';
import ChessGame from './chess';
import TicTacToeGame from './tic-tac-toe';
import express from 'express';
import GameBase from './game-base';
import { ResultType } from './game-result';

const client = new Client();

const snake = new SnakeGame();
const hangman = new HangmanGame();
const minesweeper = new MinesweeperGame();
const connect4 = new Connect4Game();
const chess = new ChessGame();
const ticTacToe = new TicTacToeGame();

const commandGameMap = new Map<string, GameBase>([
    ['!snake', snake],
    ['!hangman', hangman],
    ['!connect4', connect4],
    ['!minesweeper', minesweeper],
    ['!chess', chess],
    ['!tictactoe', ticTacToe]
]);

const playerGameMap = new Map<string, Map<string, GameBase>>();

client.on('ready', () => {
    console.log(`Logged in as ${client.user?.tag}!`);
});

client.on('message', msg => {
    const msgParts = msg.content.toLowerCase().split(' ');
    const command = msgParts[0];
    if (msg.guild === undefined)
        return;

    const guildID = msg.guild!.id;
    if (msg.channel instanceof TextChannel && msg.channel.name && msg.channel.name.includes("bot_land")) {
        if (commandGameMap.has(command)) {
            const game = commandGameMap.get(command)!.initGame();
            if (!game.isInGame()) {
                if (!playerGameMap.has(guildID))
                    playerGameMap.set(guildID, new Map<string, GameBase>());

                if (playerGameMap.get(guildID)!.has(msg.author.id)) {
                    msg.reply("You must either finish or end your current game (!end) before you can play another!");
                }
                else {
                    game.newGame(msg, () => {
                        playerGameMap.get(guildID)!.delete(msg.author.id);
                    }, []);
                    playerGameMap.get(guildID)!.set(msg.author.id, game);
                }
            }
            else {
                msg.reply("Sorry, there can only be 1 instance of a game at a time!");
            }
        }
        else if (command === '!end' || command === '!stop') {
            const userId = msg.author.id;
            if (playerGameMap.has(guildID) && playerGameMap.get(guildID)!.has(userId)) {
                const game = playerGameMap.get(guildID)!.get(userId)!;
                game.gameOver({ result: ResultType.FORCE_END });
                playerGameMap.get(guildID)?.delete(userId);
            }
        }
        else if (command === '!help') {
            const embed = new Discord.MessageEmbed()
                .setColor('#fc2eff')
                .setTitle('Help - Commands')
                .setDescription("!snake - Play Snake\n!hangman - Play Hangman\n!connect4 - Play Connect4\n!minesweeper - Play Minesweeper\n!chess - Play Chess\n!tictactoe - Play TicTacToe")
                .setTimestamp();
            msg.channel.send(embed);
        }
    }
});

client.login(token);

const app = express()
const port = 3030

app.get('/', (req, res) => {
    res.send('<script>window.close();</script>');
    if (typeof req.query.col === "string" && typeof req.query.row === "string") {
        minesweeper.makeMove(parseInt(req.query.col), parseInt(req.query.row));
    }
})

app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`);
})