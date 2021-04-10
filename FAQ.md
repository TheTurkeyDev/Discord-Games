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
        3.  [I've taken one of the files from this repo and used it for my bot, but it isn't working?](#ive-taken-one-of-the-files-from-this-repo-and-used-it-for-my-bot-but-it-isnt-working)

## Questions

### My bot wont respond to me?
> On [Line 45](https://github.com/TheTurkeyDev/Discord-Games/blob/master/src/index.ts#L45) of the `index.ts` file, you will see this:
> ```js
> if (msg.channel instanceof TextChannel && msg.channel.name && msg.channel.name.includes("bot_land")) {
> ```
> Remove/Change the ` && msg.channel.name.includes("bot_land")` part from Line 45, and relaunch your bot.

### My bot was working, and now it isnt?
> Turkey has recently updated his bot's code (*As of Feb 20th 2021*). See [here](https://github.com/TheTurkeyDev/Discord-Games/tree/master/src) to get the updated structure!

### Ive taken one of the files from this repo and used it for my bot, but it isnt working?
> We prefer you to have a basic understanding of how JS/TS works. As you can see from the single file you've copied, it is pulling information from various other files. You will
> **need** them files too! 
