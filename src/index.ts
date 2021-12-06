import { DiscordMinimal, INTENTS, DiscordUser, Snowflake, DiscordEmbed, DiscordReady, DiscordMessageReactionAdd, DiscordMessage, DiscordMessageCreate, DiscordInteraction, DiscordMessageDelete, DiscordMessageDeleteBulk } from 'discord-minimal';
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
import TwentyFortyEightGame from './2048';

const client = new DiscordMinimal([INTENTS.GUILD_MESSAGES, INTENTS.GUILD_MESSAGE_REACTIONS]);

const minesweeper = new MinesweeperGame();

type CommandObject = {
    [key: string]: () => GameBase;
}
const commandGameMap: CommandObject = {
    '!snake': () => new SnakeGame(),
    '!hangman': () => new HangmanGame(),
    '!connect4': () => new Connect4Game(),
    '!minesweeper': () => minesweeper,
    '!chess': () => new ChessGame(),
    '!tictactoe': () => new TicTacToeGame(),
    '!flood': () => new FloodGame(),
    '!2048': () => new TwentyFortyEightGame(),
};

const playerGameMap = new Map<Snowflake, Map<Snowflake, GameBase>>();

client.on('ready', (ready: DiscordReady) => {
    ready.user.setActivity('!gbhelp');
    console.log(`Logged in as ${ready.user?.username}!`);
});

client.on('messageCreate', (msg: DiscordMessage) => {
    const msgParts = msg.content.toLowerCase().split(' ');
    const command = msgParts[0];
    if (msg.guild_id === undefined)
        return;

    const guildId: Snowflake = msg.guild_id;
    const userId = msg.author.id;
    if (guildId) {
        if (Object.keys(commandGameMap).includes(command)) {
            const game = commandGameMap[command]();

            let player2: DiscordUser | undefined;
            if (msg.mentions != null && msg.mentions.length > 0) {
                if (!game.doesSupportMultiplayer()) {
                    msg.reply('Sorry that game is not a multiplayer game!');
                    return;
                }
                else
                    player2 = msg.mentions[0];
            }

            if (!playerGameMap.has(guildId))
                playerGameMap.set(guildId, new Map<Snowflake, GameBase>());

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
                });
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
            const embed = new DiscordEmbed()
                .setColor('#fc2eff')
                .setTitle('Help - Commands')
                .setDescription('!snake - Play Snake\n!hangman - Play Hangman\n!connect4 - Play Connect4\n!minesweeper - Play Minesweeper\n!chess - Play Chess\n!tictactoe - Play TicTacToe\n!flood - Play Flood\n!2048 - Play 2048')
                .setTimestamp();
            msg.sendInChannel({ embeds: [embed] }).catch(e => console.log(e));
        }
    }
});

client.on('interactionCreate', (interaction: DiscordInteraction) => {
    const userGame = getPlayersGame(interaction.guild_id as Snowflake, interaction.member?.user?.id as Snowflake);
    if (!userGame)
        return;

    userGame.onInteraction(interaction);
});

client.on('messageReactionAdd', (reaction: DiscordMessageReactionAdd) => {
    const userId = reaction.user_id;
    const userGame = getPlayersGame(reaction.guild_id ?? null, userId);
    if (!userGame)
        return;

    if (userGame.player1Turn && userId !== userGame.gameStarter.id)
        return;
    if (!userGame.player1Turn && userGame.player2 !== null && userId !== userGame.player2.id)
        return;
    if (!userGame.player1Turn && userGame.player2 === null && userId !== userGame.gameStarter.id)
        return;

    userGame.onReaction(reaction);
    reaction.remove();
});

client.on('messageDelete', (message: DiscordMessageDelete) => {
    handleMessageDelete(message.guild_id, message.id);
});

client.on('messageDeleteBulk', (messages: DiscordMessageDeleteBulk) => {
    messages.ids.forEach((id: Snowflake) => handleMessageDelete(messages.guild_id, id));
});

const handleMessageDelete = (guild_id: Snowflake | undefined, message_id: Snowflake) => {
    if (!guild_id)
        return;

    const guidGames = playerGameMap.get(guild_id);
    if (!guidGames)
        return;

    guidGames.forEach((game: GameBase, userId: Snowflake) => {
        if (game.getMessageId() === message_id)
            game.gameOver({ result: ResultType.DELETED });
    });
};

const getPlayersGame = (guildId: Snowflake | null, userId: Snowflake): GameBase | null => {
    if (!guildId)
        return null;

    const guidGames = playerGameMap.get(guildId);
    if (!guidGames)
        return null;

    const userGame = guidGames.get(userId);
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