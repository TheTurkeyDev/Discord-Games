import GameBase from './game-base';
import Discord, { Message, MessageEmbed, MessageReaction, User } from 'discord.js';
import GameResult, { ResultType } from './game-result';
import fetch from 'node-fetch';

//unicode fun...
const reactions = new Map([
    ["🅰️", "A"],
    ["🇦", "A"],
    ["🅱️", "B"],
    ["🇧", "B"],
    ["🇨", "C"],
    ["🇩", "D"],
    ["🇪", "E"],
    ["🇫", "F"],
    ["🇬", "G"],
    ["🇭", "H"],
    ["ℹ️", "I"],
    ["🇮", "I"],
    ["🇯", "J"],
    ["🇰", "K"],
    ["🇱", "L"],
    ["Ⓜ️", "M"],
    ["🇲", "M"],
    ["🇳", "N"],
    ["🅾️", "O"],
    ["⭕", "O"],
    ["🇴", "O"],
    ["🅿️", "P"],
    ["🇵", "P"],
    ["🇶", "Q"],
    ["🇷", "R"],
    ["🇸", "S"],
    ["🇹", "T"],
    ["🇺", "U"],
    ["🇻", "V"],
    ["🇼", "W"],
    ["✖️", "X"],
    ["❎", "X"],
    ["❌", "X"],
    ["🇽", "X"],
    ["🇾", "Y"],
    ["💤", "Z"],
    ["🇿", "Z"],
]);

export default class HangmanGame extends GameBase {
    private word: string = "";
    private guesssed: string[] = [];
    private wrongs: number = 0;

    constructor() {
        super('hangman', false);
    }

    public initGame(): GameBase {
        return new HangmanGame();
    }

    public newGame(msg: Message, player2: User | null, onGameEnd: () => void): void {
        if (this.inGame)
            return;

        fetch('https://api.theturkey.dev/randomword').then(resp => resp.text()).then(word => {
            this.word = word.toUpperCase();
            this.guesssed = [];
            this.wrongs = 0;

            super.newGame(msg, player2, onGameEnd, Array.from(reactions.keys()), false);
        });
    }

    protected getEmbed(): MessageEmbed {
        return new Discord.MessageEmbed()
            .setColor('#db9a00')
            .setTitle('Hangman')
            .setAuthor("Made By: TurkeyDev", "https://site.theturkey.dev/images/turkey_avatar.png", "https://twitter.com/turkeydev")
            .setDescription(this.getDescription())
            .addField('Letters Guessed', this.guesssed.length == 0 ? '\u200b' : this.guesssed.join(" "))
            .addField('How To Play', "React to this message using the emojis that look like letters (🅰️, 🇹, )")
            .setFooter(`Currently Playing: ${this.gameStarter.username}`)
            .setTimestamp();
    }

    protected getGameOverEmbed(result: GameResult): MessageEmbed {
        const endText = result.result === ResultType.WINNER ? result.name : 'The game was ended!';
        return new Discord.MessageEmbed()
            .setColor('#db9a00')
            .setTitle('Hangman')
            .setAuthor("Made By: TurkeyDev", "https://site.theturkey.dev/images/turkey_avatar.png", "https://twitter.com/turkeydev")
            .setDescription(`${endText}\n\nThe Word was:\n${this.word}\n\n${this.getDescription()}`)
            .setTimestamp();
    }

    private makeGuess(reaction: string) {
        if (reactions.has(reaction)) {
            const letter = reactions.get(reaction);
            if (letter === undefined)
                return;

            if (!this.guesssed.includes(letter)) {
                this.guesssed.push(letter);

                if (this.word.indexOf(letter) == -1) {
                    this.wrongs++;

                    if (this.wrongs == 6) {
                        this.gameOver({ result: ResultType.WINNER, name: "Chat loses" });
                        return;
                    }
                }
                else if (!this.word.split("").map(l => this.guesssed.includes(l) ? l : "_").includes("_")) {
                    this.gameOver({ result: ResultType.WINNER, name: "Chat Wins!" });
                    return;
                }
            }
        }

        this.step();
    }

    private getDescription(): string {
        return "```"
            + "|‾‾‾‾‾‾|   \n|     "
            + (this.wrongs > 0 ? "🎩" : " ")
            + "   \n|     "
            + (this.wrongs > 1 ? "😟" : " ")
            + "   \n|     "
            + (this.wrongs > 2 ? "👕" : " ")
            + "   \n|     "
            + (this.wrongs > 3 ? "🩳" : " ")
            + "   \n|    "
            + (this.wrongs > 4 ? "👞👞" : " ")
            + "   \n|     \n|__________\n\n"
            + this.word.split("").map(l => this.guesssed.includes(l) ? l : "_").join(" ")
            + "```";
    }

    protected onReaction(reaction: MessageReaction): void {
        if (reaction.users.cache.has(this.gameStarter.id))
            this.makeGuess(reaction.emoji.name);
        else
            this.step();
        reaction.remove();
    }
}