import { DiscordMessageActionRow, DiscordMessageButton, DiscordEmbed, DiscordButtonStyle, DiscordInteraction, DiscordMessageReactionAdd } from 'discord-minimal';

import { Direction, oppositeDir } from './direction';
import GameBase from './game-base';
import { GameContent } from './game-content';
import GameResult, { ResultType } from './game-result';
import Position, { isInside, move, posEqual } from './position';

const WIDTH = 4;
const HEIGHT = 4;

export default class TwentyFortyEightGame extends GameBase {
    gameBoard: number[];
    mergedPos: Position[];
    score: number;

    constructor() {
        super('2048', false);
        this.gameBoard = [];
        this.mergedPos = [];
        for (let y = 0; y < HEIGHT; y++)
            for (let x = 0; x < WIDTH; x++)
                this.gameBoard[y * WIDTH + x] = 0;
        this.placeRandomNewTile();
        this.score = 0;
    }

    protected getContent(): GameContent {
        const row = super.createMessageActionRowButton([['left', '⬅️'], ['up', '⬆️'], ['right', '➡️'], ['down', '⬇️']]);

        const embed = new DiscordEmbed()
            .setColor('#f2e641')
            .setTitle('2048')
            .setAuthor('Made By: TurkeyDev', 'https://site.theturkey.dev/images/turkey_avatar.png', 'https://www.youtube.com/watch?v=zHyKnlUWnp8')
            .setImage(`https://api.theturkey.dev/discordgames/gen2048?gb=${this.gameBoard.join(',')}`)
            .addField('Score:', this.score.toString())
            .setFooter(`Currently Playing: ${this.gameStarter.username}`)
            .setTimestamp();

        return {
            embeds: [embed],
            components: [row]
        };
    }

    protected getGameOverContent(result: GameResult): GameContent {
        return {
            embeds: [new DiscordEmbed()
                .setColor('#f2e641')
                .setTitle('2048')
                .setAuthor('Made By: TurkeyDev', 'https://site.theturkey.dev/images/turkey_avatar.png', 'https://www.youtube.com/watch?v=zHyKnlUWnp8')
                .setImage(`https://api.theturkey.dev/discordgames/gen2048?gb=${this.gameBoard.join(',')}`)
                .setDescription(`GAME OVER!\nScore: ${this.score}`)
                .setTimestamp()
                .setFooter(`Player: ${this.gameStarter.username}`)],
            components: []
        };
    }

    private placeRandomNewTile() {
        let newPos = { x: 0, y: 0 };
        do {
            newPos = { x: Math.floor(Math.random() * WIDTH), y: Math.floor(Math.random() * HEIGHT) };
        } while (this.gameBoard[newPos.y * WIDTH + newPos.x] != 0);

        this.gameBoard[newPos.y * WIDTH + newPos.x] = (Math.random() * 100) < 25 ? 2 : 1;
    }

    private shiftLeft(): boolean {
        let moved = false;
        for (let y = 0; y < HEIGHT; y++)
            for (let x = 1; x < WIDTH; x++)
                moved = this.shift({ x, y }, Direction.LEFT) || moved;
        return moved;
    }

    private shiftRight(): boolean {
        let moved = false;
        for (let y = 0; y < HEIGHT; y++)
            for (let x = WIDTH - 2; x >= 0; x--)
                moved = this.shift({ x, y }, Direction.RIGHT) || moved;
        return moved;
    }

    private shiftUp(): boolean {
        let moved = false;
        for (let x = 0; x < WIDTH; x++)
            for (let y = 1; y < HEIGHT; y++)
                moved = this.shift({ x, y }, Direction.UP) || moved;
        return moved;
    }

    private shiftDown(): boolean {
        let moved = false;
        for (let x = 0; x < WIDTH; x++)
            for (let y = HEIGHT - 2; y >= 0; y--)
                moved = this.shift({ x, y }, Direction.DOWN) || moved;
        return moved;
    }

    private shift(pos: Position, dir: Direction): boolean {
        let moved = false;
        const movingNum = this.gameBoard[pos.y * WIDTH + pos.x];
        if (movingNum === 0)
            return false;

        let moveTo = pos;
        let set = false;
        while (!set) {
            moveTo = move(moveTo, dir);
            const moveToNum = this.gameBoard[moveTo.y * WIDTH + moveTo.x];
            if (!isInside(moveTo, WIDTH, HEIGHT) || (moveToNum != 0 && moveToNum !== movingNum) || !!this.mergedPos.find(p => p.x === moveTo.x && p.y === moveTo.y)) {
                const oppDir = oppositeDir(dir);
                const moveBack = move(moveTo, oppDir);
                if (!posEqual(moveBack, pos)) {
                    this.gameBoard[pos.y * WIDTH + pos.x] = 0;
                    this.gameBoard[moveBack.y * WIDTH + moveBack.x] = movingNum;
                    moved = true;
                }
                set = true;
            }
            else if (moveToNum === movingNum) {
                moved = true;
                this.gameBoard[moveTo.y * WIDTH + moveTo.x] += 1;
                this.score += Math.floor(Math.pow(this.gameBoard[moveTo.y * WIDTH + moveTo.x], 2));
                this.gameBoard[pos.y * WIDTH + pos.x] = 0;
                set = true;
                this.mergedPos.push(moveTo);
            }
        }
        return moved;
    }


    private isBoardFull(): boolean {
        for (let y = 0; y < HEIGHT; y++)
            for (let x = 0; x < WIDTH; x++)
                if (this.gameBoard[y * WIDTH + x] === 0)
                    return false;
        return true;
    }

    private numMovesPossible(): number {
        let numMoves = 0;
        for (let y = 0; y < HEIGHT; y++) {
            for (let x = 0; x < WIDTH; x++) {
                const pos = { x, y };
                const posNum = this.gameBoard[pos.y * WIDTH + pos.x];
                [Direction.DOWN, Direction.LEFT, Direction.RIGHT, Direction.UP].forEach(dir => {
                    const newPos = move(pos, dir);
                    if (isInside(newPos, WIDTH, HEIGHT) && (this.gameBoard[newPos.y * WIDTH + newPos.x] === 0 || this.gameBoard[newPos.y * WIDTH + newPos.x] === posNum))
                        numMoves++;
                });
            }
        }
        return numMoves;
    }

    public onInteraction(interaction: DiscordInteraction): void {
        if (!interaction.isButton())
            return;

        let moved = false;
        this.mergedPos = [];
        switch (interaction.data?.custom_id) {
            case 'left':
                moved = this.shiftLeft();
                break;
            case 'up':
                moved = this.shiftUp();
                break;
            case 'right':
                moved = this.shiftRight();
                break;
            case 'down':
                moved = this.shiftDown();
                break;
        }

        if (moved)
            this.placeRandomNewTile();

        super.step(false);

        if (this.isBoardFull() && this.numMovesPossible() == 0)
            this.gameOver({ result: ResultType.LOSER, name: this.gameStarter.username, score: `${this.score}` }, interaction);
        else
            interaction.update(this.getContent()).catch(e => super.handleError(e, 'update interaction'));


    }
    public onReaction(reaction: DiscordMessageReactionAdd): void { }
}