const Discord = require('discord.js');

const client = new Discord.Client(["MANAGE_MESSAGES"]);

const WIDTH = 15;
const HEGIHT = 10;
const gameBoard = [];
var snake = [{ x: 5, y: 5 }];
var snakeLength = 1;
const apple = { x: 1, y: 1 };
var score = 0;

var gameEmbed = null;

for (let y = 0; y < HEGIHT; y++) {
    for (let x = 0; x < WIDTH; x++) {
        gameBoard[y * WIDTH + x] = "🟦";
    }
}

const gameBoardToString = () => {
    let str = ""
    for (let y = 0; y < HEGIHT; y++) {
        for (let x = 0; x < WIDTH; x++) {
            if (x == apple.x && y == apple.y) {
                str += "🍎";
                continue;
            }

            let flag = true;
            for (let s = 0; s < snake.length; s++) {
                if (x == snake[s].x && y == snake[s].y) {
                    str += "🟩";
                    flag = false;
                }
            }

            if (flag)
                str += gameBoard[y * WIDTH + x];
        }
        str += "\n";
    }
    return str;
}

const isLocInSnake = (pos) => {
    return snake.find(sPos => sPos.x == pos.x && sPos.y == pos.y);
};

const newAppleLoc = () => {
    let newApplePos = { x: 0, y: 0 };
    do {
        newApplePos = { x: parseInt(Math.random() * WIDTH), y: parseInt(Math.random() * HEGIHT) };
    } while (isLocInSnake(newApplePos))

    apple.x = newApplePos.x;
    apple.y = newApplePos.y;
}

const newGame = (msg) => {
    score = 0;
    snakeLength = 1;
    snake = [{ x: 5, y: 5 }];
    newAppleLoc();
    embed = new Discord.MessageEmbed()
        .setColor('#0099ff')
        .setTitle('Snake Game')
        .setDescription(gameBoardToString())
        .setTimestamp();

    msg.channel.send(embed).then(emsg => {
        gameEmbed = emsg;
        gameEmbed.react('⬅️');
        gameEmbed.react('⬆️');
        gameEmbed.react('⬇️');
        gameEmbed.react('➡️');

        waitForReaction();
    });
};

const step = () => {
    if (apple.x == snake[0].x && apple.y == snake[0].y) {
        score += 1;
        snakeLength++;
        newAppleLoc();
    }

    const editEmbed = new Discord.MessageEmbed()
        .setColor('#0099ff')
        .setTitle('Snake Game')
        .setDescription(gameBoardToString())
        .setTimestamp();
    gameEmbed.edit(editEmbed);

    waitForReaction();
};

const gameOver = () => {
    const editEmbed = new Discord.MessageEmbed()
        .setColor('#0099ff')
        .setTitle('Snake Game')
        .setDescription("GAME OVER!\nSCORE: " + score)
        .setTimestamp();
    gameEmbed.edit(editEmbed);

    gameEmbed.reactions.removeAll()
};

const filter = (reaction, user) => {
    return ['⬅️', '⬆️', '⬇️', '➡️'].includes(reaction.emoji.name) && user.id !== gameEmbed.author.id;
};

const waitForReaction = () => {
    gameEmbed.awaitReactions(filter, { max: 1, time: 60000, errors: ['time'] })
        .then(collected => {
            const reaction = collected.first();

            const snakeHead = snake[0];
            const nextPos = { x: snake[0].x, y: snake[0].y };
            if (reaction.emoji.name === '⬅️') {
                let nextX = snakeHead.x - 1;
                if (nextX < 0)
                    nextX = WIDTH - 1;
                nextPos.x = nextX;
            }
            else if (reaction.emoji.name === '⬆️') {
                let nextY = snakeHead.y - 1;
                if (nextY < 0)
                    nextY = HEGIHT - 1;
                nextPos.y = nextY;
            }
            else if (reaction.emoji.name === '⬇️') {
                let nextY = snakeHead.y + 1;
                if (nextY >= HEGIHT)
                    nextY = 0;
                nextPos.y = nextY;
            }
            else if (reaction.emoji.name === '➡️') {
                let nextX = snakeHead.x + 1;
                if (nextX >= WIDTH)
                    nextX = 0;
                nextPos.x = nextX;
            }

            reaction.users.remove(reaction.users.cache.filter(user => user.id !== gameEmbed.author.id).first().id).then(() => {
                if (isLocInSnake(nextPos)) {
                    gameOver();
                }
                else {
                    snake.unshift(nextPos);
                    if (snake.length > snakeLength)
                        snake.pop();

                    step();
                }
            });
        })
        .catch(collected => {
            gameOver();
        });
}

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
});

client.on('message', msg => {
    if (msg.channel.name.includes("bot_land")) {
        if (msg.content === '!newgame') {
            newGame(msg);
        }
    }
});

client.login("<Token Go Here>");