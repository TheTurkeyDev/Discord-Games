import { DiscordAPIError, DiscordInteraction, DiscordMessage, DiscordMessageActionRow, DiscordMessageButton, DiscordMessageReactionAdd, DiscordUser, Snowflake, DiscordButtonStyle, DiscordInteractionResponseMessageData } from 'discord-minimal';
import GameResult, { ResultType } from './game-result';

export default abstract class GameBase {
    protected gameId!: number;
    protected gameType: string;
    protected isMultiplayerGame: boolean;
    protected inGame = false;
    protected result: GameResult | undefined = undefined;
    protected gameMessage: DiscordMessage | undefined = undefined;
    public gameStarter!: DiscordUser;
    public player2: DiscordUser | null = null;
    public player1Turn = true;
    protected onGameEnd: (result: GameResult) => void = () => { };

    protected gameTimeoutId: NodeJS.Timeout | undefined;

    protected abstract getContent(): DiscordInteractionResponseMessageData;
    protected abstract getGameOverContent(result: GameResult): DiscordInteractionResponseMessageData;
    public abstract onReaction(reaction: DiscordMessageReactionAdd): void;
    public abstract onInteraction(interaction: DiscordInteraction): void;

    constructor(gameType: string, isMultiplayerGame: boolean) {
        this.gameType = gameType;
        this.isMultiplayerGame = isMultiplayerGame;
    }

    public newGame(interaction: DiscordInteraction, player2: DiscordUser | null, onGameEnd: (result: GameResult) => void): void {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        this.gameStarter = interaction.user ?? interaction.member!.user!;
        this.player2 = player2;
        this.onGameEnd = onGameEnd;
        this.inGame = true;

        const resp = new DiscordInteractionResponseMessageData();
        resp.content = 'Game started. Happy Playing!';

        interaction.respond(resp).catch(console.log);

        const content = this.getContent();
        interaction.sendMessageInChannel({ embeds: content.embeds, components: content.components }).then(msg => {
            this.gameMessage = msg;
            this.gameTimeoutId = setTimeout(() => this.gameOver({ result: ResultType.TIMEOUT }), 60000);
        }).catch(e => this.handleError(e, 'send message/ embed'));
    }

    protected step(edit = false): void {
        if (edit)
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
                case 10062:
                    console.log('Unknown Interaction??');
                    break;
                case 50001:
                    if (this.gameMessage)
                        this.gameMessage.sendMessageInChannel('The bot is missing access to preform some of it\'s actions!').catch(() => {
                            console.log('Error in the access error handler!');
                        });
                    else
                        console.log('Error in the access error handler!');

                    this.gameOver({ result: ResultType.ERROR, error: 'Missing access!' });
                    break;
                case 50013:
                    if (this.gameMessage)
                        this.gameMessage.sendMessageInChannel(`The bot is missing the '${perm}' permissions it needs order to work!`).catch(() => {
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

    public gameOver(result: GameResult, interaction: DiscordInteraction | undefined = undefined): void {
        if (!this.inGame)
            return;

        this.result = result;
        this.inGame = false;

        const gameOverContent = this.getGameOverContent(result);
        // Remove components to clean up the end-game view.
        if (gameOverContent.components.length)
            gameOverContent.components = [];

        if (result.result !== ResultType.FORCE_END) {
            this.onGameEnd(result);
            this.gameMessage?.edit(gameOverContent).catch(e => this.handleError(e, ''));
            this.gameMessage?.removeAllReactions();
        }
        else {
            if (interaction)
                interaction.update(gameOverContent).catch(e => this.handleError(e, 'update interaction'));
            else
                this.gameMessage?.edit(gameOverContent).catch(e => this.handleError(e, ''));
        }

        if (this.gameTimeoutId)
            clearTimeout(this.gameTimeoutId);
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

    public getMessageId(): Snowflake {
        return this.gameMessage?.id ?? '';
    }

    public isInGame(): boolean {
        return this.inGame;
    }

    public doesSupportMultiplayer(): boolean {
        return this.isMultiplayerGame;
    }

    public createMessageActionRowButton(buttonInfo: string[][]): DiscordMessageActionRow {
        return new DiscordMessageActionRow()
            .addComponents(
                ...buttonInfo.map(([id, label]) => new DiscordMessageButton(DiscordButtonStyle.SECONDARY)
                    .setCustomId(id)
                    .setLabel(label))
            );
    }
}
