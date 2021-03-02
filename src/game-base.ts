import Discord, { Message, MessageEmbed, MessageReaction, User } from 'discord.js';
import GameResult, { ResultType } from './game-result';

export default abstract class GameBase {
    protected gameId: string;
    protected isMultiplayerGame: boolean;
    protected inGame: boolean = false;
    protected gameStarter!: User;
    protected player2: User | null = null;
    protected player1Turn = true;
    protected onGameEnd: () => void = () => { };

    protected gameEmbed!: Message;
    protected reactions: string[] = [];

    public abstract initGame(): GameBase;
    protected abstract getEmbed(): MessageEmbed;
    protected abstract getGameOverEmbed(result: GameResult): MessageEmbed;
    protected abstract onReaction(reaction: MessageReaction): void;

    constructor(gameId: string, isMultiplayerGame: boolean) {
        this.gameId = gameId;
        this.isMultiplayerGame = isMultiplayerGame;
    }

    public newGame(msg: Message, player2: User | null, onGameEnd: () => void, reactions: string[], showReactions = true): void {
        this.gameStarter = msg.author;
        this.player2 = player2;
        this.onGameEnd = onGameEnd;
        this.inGame = true;
        this.reactions = reactions;

        msg.channel.send(this.getEmbed()).then(emsg => {
            this.gameEmbed = emsg;
            if (showReactions)
                reactions.forEach(reaction => this.gameEmbed.react(reaction))
            this.waitForReaction();
        });
    }

    protected step(): void {
        this.gameEmbed.edit(this.getEmbed());
        this.waitForReaction();
    }

    private filter(reaction: MessageReaction, user: User): boolean {
        if (this.reactions.includes(reaction.emoji.name)) {
            if (this.player1Turn && user.id === this.gameStarter.id)
                return true;
            if (!this.player1Turn && this.player2 != null && user.id === this.player2.id)
                return true;
            if (!this.player1Turn && this.player2 === null && user.id === this.gameStarter.id)
                return true;
        }
        return false;
    }

    private waitForReaction(): void {
        this.gameEmbed.awaitReactions((reaction: MessageReaction, user: User) => this.filter(reaction, user), { max: 1, time: 60000, errors: ['time'] })
            .then(collected => {
                const reaction = collected.first();
                if (reaction !== undefined)
                    this.onReaction(reaction);
            })
            .catch(collected => {
                if (typeof collected === 'string')
                    this.gameOver({ result: ResultType.ERROR, error: collected });
                else
                    this.gameOver({ result: ResultType.TIMEOUT });
            });
    }

    public gameOver(result: GameResult) {
        if (result.result !== ResultType.FORCE_END)
            this.onGameEnd();

        this.inGame = false;
        this.gameEmbed.edit(this.getGameOverEmbed(result));
        this.gameEmbed.reactions.removeAll();
    }

    public getGameId(): string {
        return this.gameId;
    }

    public isInGame(): boolean {
        return this.inGame;
    }

    public doesSupportMultiplayer(): boolean {
        return this.isMultiplayerGame;
    }
}