import GameBase from './game-base';
import Discord, { Interaction, Message, MessageActionRow, MessageButton, MessageEmbed, MessageReaction, User } from 'discord.js';
import GameResult, { ResultType } from './game-result';
import { GameContent } from './game-content';
import Position, { up, down, left, right } from './position';

const WIDTH = 13;
const HEIGHT = 13;

const SQUARES = { 'red_sqaure': '🟥', 'blue_sqaure': '🟦', 'orange_sqaure': '🟧', 'purple_sqaure': '🟪', 'green_sqaure': '🟩' };

export default class FloodGame extends GameBase {
    gameBoard: string[];
    turn: number;

    constructor() {
        super('flood', false, false);
        this.gameBoard = [];
        this.turn = 1;
    }

    public initGame(): GameBase {
        const game = new FloodGame();
        for (let y = 0; y < HEIGHT; y++)
            for (let x = 0; x < WIDTH; x++)
                game.gameBoard[y * WIDTH + x] = Object.values(SQUARES)[Math.floor(Math.random() * Object.keys(SQUARES).length)];

        return game;
    }

    private gameBoardToString(): string {
        let str = '';
        for (let y = 0; y < HEIGHT; y++) {
            for (let x = 0; x < WIDTH; x++) {
                str += this.gameBoard[y * WIDTH + x];
            }
            str += '\n';
        }
        return str;
    }

    protected getContent(): GameContent {
        const row = new MessageActionRow()
            .addComponents(
                Object.entries(SQUARES).map(([k, v]) => new MessageButton()
                    .setCustomId(k)
                    .setLabel(v)
                    .setStyle('SECONDARY'))
            );

        const embed = new Discord.MessageEmbed()
            .setColor('#08b9bf')
            .setTitle('Flood')
            .setAuthor('Made By: TurkeyDev', 'https://site.theturkey.dev/images/turkey_avatar.png', 'https://www.youtube.com/watch?v=0G3gD4KJ59U')
            .setDescription(this.gameBoardToString())
            .addField('Turn:', this.turn.toString())
            .setFooter(`Currently Playing: ${this.gameStarter.username}`)
            .setTimestamp();

        return {
            embeds: [embed],
            components: [row]
        };
    }

    protected getGameOverContent(result: GameResult): GameContent {
        const turnResp = result.result == ResultType.WINNER ? `Game beat in ${this.turn - 1} turns!` : '';
        return {
            embeds: [new Discord.MessageEmbed()
                .setColor('#08b9bf')
                .setTitle('Flood')
                .setAuthor('Made By: TurkeyDev', 'https://site.theturkey.dev/images/turkey_avatar.png', 'https://www.youtube.com/watch?v=yMg9tVZBSPw')
                .setDescription(`GAME OVER!\n${turnResp}`)
                .setTimestamp()],
            components: []
        };
    }

    public update(selected: string): void {
        this.turn += 1;
        const current = this.gameBoard[0];
        const queue: Position[] = [{ x: 0, y: 0 }];
        const visited: Position[] = [];

        while (queue.length > 0) {
            const pos: Position | undefined = queue.shift();
            if (!pos || visited.includes(pos))
                continue;

            visited.push(pos);
            if (this.gameBoard[pos.y * WIDTH + pos.x] === current) {
                this.gameBoard[pos.y * WIDTH + pos.x] = selected;

                const upPos = up(pos);
                if (!visited.includes(upPos) && upPos.y >= 0)
                    queue.push(upPos);

                const downPos = down(pos);
                if (!visited.includes(downPos) && downPos.y < HEIGHT)
                    queue.push(downPos);

                const leftPos = left(pos);
                if (!visited.includes(leftPos) && leftPos.x >= 0)
                    queue.push(leftPos);

                const rightPos = right(pos);
                if (!visited.includes(rightPos) && rightPos.x < WIDTH)
                    queue.push(rightPos);
            }
        }

        let gameOver = true;
        for (let y = 0; y < HEIGHT; y++)
            for (let x = 0; x < WIDTH; x++)
                if (this.gameBoard[y * WIDTH + x] !== selected)
                    gameOver = false;

        if (gameOver)
            this.gameOver({ result: ResultType.WINNER, score: (this.turn - 1).toString() });
        else
            super.step();
    }

    public onInteraction(interaction: Interaction): void {
        if (!interaction.isButton())
            return;
        const selected = Object.entries(SQUARES).find(([k, v]) => k === interaction.customId);

        if (selected)
            this.update(selected[1]);

        if (this.isInGame())
            interaction.update(this.getContent());
        else
            interaction.update(this.getGameOverContent(this.result ?? { result: ResultType.ERROR }));
    }
    public onReaction(reaction: MessageReaction): void { }
}