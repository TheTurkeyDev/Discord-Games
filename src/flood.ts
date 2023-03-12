import GameBase from './game-base';
import GameResult, { ResultType } from './game-result';
import { GameContent } from './game-content';
import Position, { up, down, left, right, isInside } from './position';
import { DiscordMessageActionRow, DiscordMessageButton, DiscordButtonStyle, DiscordEmbed, DiscordInteraction, DiscordMessageReactionAdd } from 'discord-minimal';

const WIDTH = 13;
const HEIGHT = 13;

const SQUARES = { 'red_square': '🟥', 'blue_square': '🟦', 'orange_square': '🟧', 'purple_square': '🟪', 'green_square': '🟩' };

export default class FloodGame extends GameBase {
    gameBoard: string[];
    turn: number;

    constructor() {
        super('flood', false);
        this.gameBoard = [];
        for (let y = 0; y < HEIGHT; y++)
            for (let x = 0; x < WIDTH; x++)
                this.gameBoard[y * WIDTH + x] = Object.values(SQUARES)[Math.floor(Math.random() * Object.keys(SQUARES).length)];
        this.turn = 1;
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
        const row = new DiscordMessageActionRow()
            .addComponents(
                ...Object.entries(SQUARES).map(([k, v]) => new DiscordMessageButton(DiscordButtonStyle.SECONDARY)
                    .setCustomId(k)
                    .setLabel(v))
            );

        const embed = new DiscordEmbed()
            .setColor('#08b9bf')
            .setTitle('Flood')
            .setAuthor('Made By: TurkeyDev', 'https://site.theturkey.dev/images/turkey_avatar.png', 'https://www.youtube.com/watch?v=BCKoXy94PM4')
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
            embeds: [new DiscordEmbed()
                .setColor('#08b9bf')
                .setTitle('Flood')
                .setAuthor('Made By: TurkeyDev', 'https://site.theturkey.dev/images/turkey_avatar.png', 'https://www.youtube.com/watch?v=BCKoXy94PM4')
                .setDescription(`GAME OVER!\n${turnResp}`)
                .setTimestamp()
                .setFooter(`Currently Playing: ${this.gameStarter.username}`)],
            components: []
        };
    }

    public onInteraction(interaction: DiscordInteraction): void {
        if (!interaction.isButton())
            return;

        const selected = Object.entries(SQUARES).find(([k, v]) => k === interaction.data?.custom_id);
        const current = this.gameBoard[0];

        if (selected && selected[1] !== current) {
            this.turn += 1;
            const queue: Position[] = [{ x: 0, y: 0 }];
            const visited: Position[] = [];

            while (queue.length > 0) {
                const pos: Position | undefined = queue.shift();
                if (!pos || visited.some(p => p.x === pos.x && p.y === pos.y))
                    continue;

                visited.push(pos);
                if (this.gameBoard[pos.y * WIDTH + pos.x] === current) {
                    this.gameBoard[pos.y * WIDTH + pos.x] = selected[1];

                    [up(pos), down(pos), left(pos), right(pos)].forEach(checkPos => {
                        if (!visited.some(p => p.x === checkPos.x && p.y === checkPos.y) && isInside(checkPos, WIDTH, HEIGHT))
                            queue.push(checkPos);
                    });
                }
            }

            let gameOver = true;
            for (let y = 0; y < HEIGHT; y++)
                for (let x = 0; x < WIDTH; x++)
                    if (this.gameBoard[y * WIDTH + x] !== selected[1])
                        gameOver = false;

            if (gameOver)
                this.gameOver({ result: ResultType.WINNER, score: (this.turn - 1).toString() }, interaction);
            else
                super.step(false);
        }

        if (this.isInGame())
            interaction.update(this.getContent()).catch(e => super.handleError(e, 'update interaction'));
        else if (!this.result)
            this.gameOver({ result: ResultType.ERROR }, interaction);
    }
    public onReaction(reaction: DiscordMessageReactionAdd): void { }
}
