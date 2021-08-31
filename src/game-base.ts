import { Collection, DiscordAPIError, Interaction, Message, MessageReaction, User, MessageEditOptions } from 'discord.js';
import { GameContent } from './game-content';
import GameResult, { ResultType } from './game-result';

export default abstract class GameBase {
    protected gameId!: number;
    protected gameType: string;
    protected isMultiplayerGame: boolean;
    protected usesReactions: boolean;
    protected inGame = false;
    protected result: GameResult | undefined = undefined;
    protected gameMessage: Message | undefined = undefined;
    public gameStarter!: User;
    public player2: User | null = null;
    public player1Turn = true;
    protected onGameEnd: (result: GameResult) => void = () => { };

    public reactions: string[] = [];
    protected gameTimeoutId: NodeJS.Timeout | undefined;

    protected abstract getContent(): GameContent;
    protected abstract getGameOverContent(result: GameResult): GameContent;
    public abstract onReaction(reaction: MessageReaction): void;
    public abstract onInteraction(interaction: Interaction): void;

    constructor(gameType: string, isMultiplayerGame: boolean, usesReactions: boolean) {
        this.gameType = gameType;
        this.isMultiplayerGame = isMultiplayerGame;
        this.usesReactions = usesReactions;
    }

    public newGame(msg: Message, player2: User | null, onGameEnd: (result: GameResult) => void, reactions: string[], showReactions = true): void {
        this.gameStarter = msg.author;
        this.player2 = player2;
        this.onGameEnd = onGameEnd;
        this.inGame = true;
        this.reactions = reactions;

        const content = this.getContent();
        msg.channel.send({ embeds: content.embeds, components: content.components }).then(emsg => {
            this.gameMessage = emsg;
            if (this.usesReactions) {
                if (showReactions)
                    reactions.forEach(reaction => emsg.react(reaction));
            }
            this.gameTimeoutId = setTimeout(() => this.gameOver({ result: ResultType.TIMEOUT }), 60000);
        }).catch(e => this.handleError(e, 'send message/ embed'));
    }

    protected step(): void {
        if (this.gameMessage?.deleted) {
            this.gameOver({ result: ResultType.DELETED });
            return;
        }

        if (this.usesReactions)
            this.gameMessage?.edit(this.getContent());

        if (this.gameTimeoutId)
            clearTimeout(this.gameTimeoutId);
        this.gameTimeoutId = setTimeout(() => this.gameOver({ result: ResultType.TIMEOUT }), 60000);
    }

    public handleError(e: unknown, perm: string): void {
        if (e instanceof DiscordAPIError) {
            const de = e as DiscordAPIError;
            switch (de.code) {
                case 10003:
                    this.gameOver({ result: ResultType.ERROR, error: 'Channel not found!' });
                    break;
                case 10008:
                    this.gameOver({ result: ResultType.DELETED, error: 'Message was deleted!' });
                    break;
                case 50001:
                    if (this.gameMessage)
                        this.gameMessage.channel.send('The bot is missing access to preform some of it\'s actions!').catch(() => {
                            console.log('Error in the access error handler!');
                        });
                    else
                        console.log('Error in the access error handler!');

                    this.gameOver({ result: ResultType.ERROR, error: 'Missing access!' });
                    break;
                case 50013:
                    if (this.gameMessage)
                        this.gameMessage.channel.send(`The bot is missing the '${perm}' permissions it needs order to work!`).catch(() => {
                            console.log('Error in the permission error handler!');
                        });
                    else
                        console.log('Error in the permission error handler!');

                    this.gameOver({ result: ResultType.ERROR, error: 'Missing permissions!' });
                    break;
                default:
                    console.log('Encountered a Discord error not handled! ');
                    console.log(e);
                    break;
            }
        }
        else {
            this.gameOver({ result: ResultType.ERROR, error: 'Game embed missing!' });
        }
    }

    public gameOver(result: GameResult): void {
        if (!this.inGame)
            return;

        this.result = result;
        this.inGame = false;

        if (result.result !== ResultType.FORCE_END) {
            this.onGameEnd(result);
            if (this.usesReactions) {
                try {
                    this.gameMessage?.edit(this.getGameOverContent(result)).catch(e => this.handleError(e, ''));
                } catch (e) {
                    //This is needed because apparently the above catch doesn't catch when the message doesn't have a channel?
                    console.log(e);
                }

                this.gameMessage?.reactions.removeAll();
            }
        }
        else {
            try {
                this.gameMessage?.edit(this.getGameOverContent(result)).catch(e => this.handleError(e, ''));
            } catch (e) {
                //This is needed because apparently the above catch doesn't catch when the message doesn't have a channel?
                console.log(e);
            }
            if (this.gameTimeoutId)
                clearTimeout(this.gameTimeoutId);
        }
    }

    protected getWinnerText(result: GameResult): string {
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
        return '';
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