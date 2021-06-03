import Discord, { Collection, DiscordAPIError, Message, MessageEmbed, MessageReaction, User } from 'discord.js';
import GameResult, { ResultType } from './game-result';

export default abstract class GameBase {
    protected gameId!: number;
    protected gameType: string;
    protected isMultiplayerGame: boolean;
    protected inGame: boolean = false;
    protected gameStarter!: User;
    protected player2: User | null = null;
    protected player1Turn = true;
    protected onGameEnd: (result: GameResult) => void = () => { };

    protected gameEmbed!: Message;
    protected reactions: string[] = [];

    public abstract initGame(): GameBase;
    protected abstract getEmbed(): MessageEmbed;
    protected abstract getGameOverEmbed(result: GameResult): MessageEmbed;
    protected abstract onReaction(reaction: MessageReaction): void;

    constructor(gameType: string, isMultiplayerGame: boolean) {
        this.gameType = gameType;
        this.isMultiplayerGame = isMultiplayerGame;
    }

    public newGame(msg: Message, player2: User | null, onGameEnd: (result: GameResult) => void, reactions: string[], showReactions = true): void {
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
        }).catch(e => this.handleError(e, 'send message/ embed'));
    }

    protected step(): void {
        if (this.gameEmbed.deleted) {
            this.gameOver({ result: ResultType.DELETED });
            return;
        }
        this.gameEmbed.edit(this.getEmbed()).catch(e => this.handleError(e, 'edit/ manage message'));
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
            .catch(error => {
                if (!this.inGame)
                    return;
                if (!this.gameEmbed || this.gameEmbed.deleted)
                    this.gameOver({ result: ResultType.DELETED });
                else if (error instanceof Collection)
                    this.gameOver({ result: ResultType.TIMEOUT });
                else
                    this.gameOver({ result: ResultType.ERROR, error: error });
            });
    }

    public handleError(e: any, perm: string) {
        if (e instanceof DiscordAPIError && this.gameEmbed != null) {
            const de = e as DiscordAPIError;
            switch (de.code) {
                case 10003:
                    this.gameOver({ result: ResultType.ERROR, error: "Channel not found!" });
                    break;
                case 10008:
                    this.gameOver({ result: ResultType.DELETED, error: "Message was deleted!" });
                    break;
                case 50001:
                    this.gameEmbed.channel.send(`The bot is missing access to preform some of it's actions!`).catch(err => {
                        console.log("Error in the access error handler!");
                    });
                    this.gameOver({ result: ResultType.ERROR, error: "Missing access!" });
                    break;
                case 50013:
                    this.gameEmbed.channel.send(`The bot is missing the '${perm}' permissions it needs order to work!`).catch(err => {
                        console.log("Error in the permission error handler!");
                    });
                    this.gameOver({ result: ResultType.ERROR, error: "Missing permissions!" });
                    break;
                default:
                    console.log("Encountered a Discord error not handled! ");
                    console.log(e);
                    break;
            }
        }
        else if (this.gameEmbed != null) {
            console.log("Encountered NonDiscord error! ");
            console.log(e);
        }
        else {
            this.gameOver({ result: ResultType.ERROR, error: "Game embed missing!" });
        }
    }

    public gameOver(result: GameResult) {
        if (!this.inGame)
            return;

        if (result.result !== ResultType.FORCE_END)
            this.onGameEnd(result);

        this.inGame = false;
        if (result.result != ResultType.DELETED && this.gameEmbed != null) {
            this.gameEmbed.edit(this.getGameOverEmbed(result)).catch(e => this.handleError(e, 'edit message'));
            this.gameEmbed.reactions.removeAll().catch(e => this.handleError(e, 'remove reactions'));
        }
    }

    protected getWinnerText(result: GameResult) {
        if (result.result === ResultType.TIE)
            return 'It was a tie!';
        else if (result.result === ResultType.TIMEOUT)
            return 'The game went unfinished :(';
        else if (result.result === ResultType.FORCE_END)
            return 'The game was ended';
        else if (result.result === ResultType.ERROR)
            return 'ERROR: ' + result.error;
        else if (result.result === ResultType.WINNER)
            return '`' + result.name + '` has won!';
        else if (result.result === ResultType.LOSER)
            return '`' + result.name + '` has lost!';
    }

    public setGameId(id: number): void {
        this.gameId = id;
    }

    public getGameId(): number {
        return this.gameId;
    }

    public getGameType(): string {
        return this.gameType;
    }

    public isInGame(): boolean {
        return this.inGame;
    }

    public doesSupportMultiplayer(): boolean {
        return this.isMultiplayerGame;
    }
}