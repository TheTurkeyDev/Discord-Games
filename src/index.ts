import Discord, { Client, Intents, Interaction, Options, Snowflake, TextChannel, User } from 'discord.js';
import { token } from './config';
import SnakeGame from './snake';
import HangmanGame from './hangman';
import MinesweeperGame from './minesweeper';
import Connect4Game from './connect4';
import ChessGame from './chess';
import TicTacToeGame from './tic-tac-toe';
import express from 'express';
import GameBase from './game-base';
import GameResult, { ResultType } from './game-result';
import FloodGame from './flood';

const client = new Client({
    makeCache: Options.cacheWithLimits({
        MessageManager: 50,
        PresenceManager: 0,
    }),
    messageCacheLifetime: 300,
    messageSweepInterval: 60,
    intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILD_MESSAGE_REACTIONS]
});

const minesweeper = new MinesweeperGame();

const commandGameMap = new Map<string, GameBase>([
    ['!snake', new SnakeGame()],
    ['!hangman', new HangmanGame()],
    ['!connect4', new Connect4Game()],
    ['!minesweeper', minesweeper],
    ['!chess', new ChessGame()],
    ['!tictactoe', new TicTacToeGame()],
    ['!flood', new FloodGame()]
]);

const playerGameMap = new Map<string, Map<string, GameBase>>();

client.on('ready', () => {
    client.user?.setActivity('!gbhelp');
    console.log(`Logged in as ${client.user?.tag}!`);
});

client.on('messageCreate', msg => {
    const msgParts = msg.content.toLowerCase().split(' ');
    const command = msgParts[0];
    if (msg.guild === undefined)
        return;

    const guildId = msg.guild?.id;
    const userId = msg.author.id;
    if (msg.channel instanceof TextChannel && msg.channel.name && !!guildId) {
        const commandGame = commandGameMap.get(command);
        if (commandGame) {
            const game = commandGame.initGame();

            let player2: User | undefined;
            if (msg.mentions.members != null && msg.mentions.members?.size > 0) {
                if (!game.doesSupportMultiplayer()) {
                    msg.reply('Sorry that game is not a multiplayer game!');
                    return;
                }
                else
                    player2 = msg.mentions.members.first()?.user;
            }

            if (!playerGameMap.has(guildId))
                playerGameMap.set(guildId, new Map<string, GameBase>());

            const foundGame = Array.from(playerGameMap.get(guildId)?.values() ?? []).find(g => g.getGameId() === game.getGameId());
            if (foundGame !== undefined && foundGame.isInGame()) {
                msg.reply('Sorry, there can only be 1 instance of a game at a time!');
                return;
            }

            if (playerGameMap.get(guildId)?.has(userId)) {
                msg.reply('You must either finish or end your current game (!end) before you can play another!');
            }
            else if (player2 && playerGameMap.get(guildId)?.has(player2.id)) {
                msg.reply('The person you are trying to play against is already in a game!');
            }
            else {
                game.newGame(msg, player2 ?? null, (result: GameResult) => {
                    playerGameMap.get(guildId)?.delete(userId);
                    if (player2)
                        playerGameMap.get(guildId)?.delete(player2.id);
                }, []);
                playerGameMap.get(guildId)?.set(userId, game);
                if (player2)
                    playerGameMap.get(guildId)?.set(player2.id, game);
            }
        }
        else if (command === '!end' || command === '!stop') {
            const playerGame = playerGameMap.get(guildId);
            if (!!playerGame && playerGame.has(userId)) {
                const game = playerGame.get(userId);
                if (game) {
                    game.gameOver({ result: ResultType.FORCE_END });
                    playerGame.delete(game.gameStarter.id);
                    if (game?.player2)
                        playerGame.delete(game.player2.id);
                }
                else {
                    playerGame.delete(userId);
                }
            }
        }
        else if (command === '!gbhelp') {
            const embed = new Discord.MessageEmbed()
                .setColor('#fc2eff')
                .setTitle('Help - Commands')
                .setDescription('!snake - Play Snake\n!hangman - Play Hangman\n!connect4 - Play Connect4\n!minesweeper - Play Minesweeper\n!chess - Play Chess\n!tictactoe - Play TicTacToe\n!flood - Play Flood')
                .setTimestamp();
            msg.channel.send({ embeds: [embed] });
        }
    }
});

client.on('interactionCreate', interaction => {
    const userGame = getPlayersGame(interaction.guildId, interaction.user);
    if (!userGame)
        return;

    userGame.onInteraction(interaction);
});

client.on('messageReactionAdd', (reaction, user) => {
    if (reaction.partial || user.partial)
        return;

    const userGame = getPlayersGame(reaction.message.guild?.id ?? null, user);
    if (!userGame)
        return;

    const reactName = reaction.emoji.name;
    if (!reactName || !userGame.reactions.includes(reactName))
        return;
    if (userGame.player1Turn && user.id !== userGame.gameStarter.id)
        return;
    if (!userGame.player1Turn && userGame.player2 !== null && user.id !== userGame.player2.id)
        return;
    if (!userGame.player1Turn && userGame.player2 === null && user.id !== userGame.gameStarter.id)
        return;

    userGame.onReaction(reaction);
    reaction.users.remove(user);
});

const getPlayersGame = (guildId: Snowflake | null, user: User): GameBase | null => {
    if (!guildId)
        return null;

    const guidGames = playerGameMap.get(guildId);
    if (!guidGames)
        return null;

    const userGame = guidGames.get(user.id);
    if (!userGame)
        return null;

    return userGame;
};

client.login(token);

const app = express();
const port = 3030;

app.get('/', (req, res) => {
    res.send('<script>window.close();</script>');
    if (typeof req.query.col === 'string' && typeof req.query.row === 'string') {
        minesweeper.makeMove(parseInt(req.query.col), parseInt(req.query.row));
    }
});

app.listen(port, () => {
    console.log(`Minesweeper game listening at http://localhost:${port}`);
});