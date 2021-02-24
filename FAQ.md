# Frequently Asked Questions

This is a collection of the most frequent questions asked, related to Turkey's GamesBot.

We hope this helps you!

* If you feel like something should be added, contact [TurkeyDev](https://discord.gg/DkexpJj) via Discord!

## Table of Contents

1.  [Frequently Asked Questions](#frequently-asked-questions)
    1.  [Table of Contents](#table-of-contents)
    2.  [Questions](#questions)
        1.  [My bot wont respond to me?](#my-bot-wont-respond-to-me)
        2.  [My bot was working, and now it isnt?](#my-bot-was-working-and-now-it-isnt)

## Questions

### My bot wont respond to me?
> On the `index.js` file, you will see this:
> ```js
> if (msg.channel.name.includes("bot_land")) { // Remove [Line 35.](https://github.com/TheTurkeyDev/Discord-Games/blob/master/src/index.js#L35) <------
>   // Ignore everything inside the brackets.
> } // Remove [Line 69](https://github.com/TheTurkeyDev/Discord-Games/blob/master/src/index.js#L69). <------
> ```
> Remove both the lines designated with `<------` beside them, and relaunch your bot.

### My bot was working, and now it isnt?
> Turkey has recently updated his bot's code (*As of Feb 20th 2021*). See [here](https://github.com/TheTurkeyDev/Discord-Games/tree/master/src) to get the updated structure!
