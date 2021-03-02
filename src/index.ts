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

    const guildId = msg.guild!.id;
    const userId = msg.author.id;
    if (msg.channel instanceof TextChannel && msg.channel.name && msg.channel.name.includes("hidden")) {
        if (commandGameMap.has(command)) {
            const game = commandGameMap.get(command)!.initGame();

            let player2: User | null = null;
            if (msg.mentions.members != null && msg.mentions.members?.size > 0) {
                if (!game.doesSupportMultiplayer()) {
                    msg.reply("Sorry that game is not a multiplayer game!");
                    return;
                }
                else
                    player2 = msg.mentions.members.first()!.user;
            }

            if (!playerGameMap.has(guildId))
                playerGameMap.set(guildId, new Map<string, GameBase>());

            const foundGame = Array.from(playerGameMap.get(guildId)!.values()).find(g => g.getGameId() === game.getGameId());
            if (foundGame !== undefined && foundGame.isInGame()) {
                msg.reply("Sorry, there can only be 1 instance of a game at a time!");
                return;
            }

            if (playerGameMap.get(guildId)!.has(userId)) {
                msg.reply("You must either finish or end your current game (!end) before you can play another!");
            }
            else {
                game.newGame(msg, player2, () => {
                    playerGameMap.get(guildId)!.delete(userId);
                }, []);
                playerGameMap.get(guildId)!.set(userId, game);
            }
        }
        else if (command === '!end' || command === '!stop') {
            if (playerGameMap.has(guildId) && playerGameMap.get(guildId)!.has(userId)) {
                const game = playerGameMap.get(guildId)!.get(userId)!;
                game.gameOver({ result: ResultType.FORCE_END });
                playerGameMap.get(guildId)?.delete(userId);
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