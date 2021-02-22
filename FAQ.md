# Frequently Asked Questions

This is a collection of the most frequent questions asked, related to Turkey's GamesBot.

We hope this helps you!

* If you feel like something should be added, contact [TurkeyDev](https://discord.gg/DkexpJj) via Discord!

## Table of Contents

1.  [Frequently Asked Questions](#frequently-asked-questions)
    1.  [Table of Contents](#table-of-contents)
    2.  [Questions](#questions)
        1.  [My bot wont respond to me?](#my-bot-wont-respond-to-me)
        2.  [How do I make the bot only listen to the user that started the game?](#how-do-i-make-the-bot-only-listen-to-the-user-that-started-the-game)
        3.  [My bot was working, and now it isnt?](#my-bot-was-working-and-now-it-isnt)

## Questions

### My bot wont respond to me?
> On [Line 35](https://github.com/TheTurkeyDev/Discord-Games/blob/master/src/index.js#L35) of the `index.js` file, you will see this:
> ```js
> if (msg.channel.name.includes("bot_land")) { // Remove line 35 <------
>   // Ignore everything inside the brackets.
> } // Remove line 69. <------
> ```
> Remove both the lines designated with `<------` beside them, and relaunch your bot.

### How do I make the bot only listen to the user that started the game?
> On line number [126-128](https://github.com/TheTurkeyDev/Discord-Games/blob/master/src/snake.js#L126) of the `snake.js` file, You'll see a filter function. Replace this:
> ```js
> && user.id !== this.gameEmbed.author.id
> ```
> to this:
> ```js
> && user.id === gameStarter
> ```
> 
> And add `let gameStarter = '';` above `const WIDTH =...`
> 
> And inside the `newGame(msg)` function, add `gameStarter = msg.author.id;`
> 
> **Use this on any game code you borrow from Turkey's GamesBot, that relies on reactions**

### My bot was working, and now it isnt?
> Turkey has recently updated his bot's code (*As of Feb 20th 2021*). See [here](https://github.com/TheTurkeyDev/Discord-Games/tree/master/src) to get the updated structure!
