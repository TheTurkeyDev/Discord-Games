import { MessageActionRow, MessageEmbed } from 'discord.js';

export interface GameContent {
    embeds?: MessageEmbed[];
    components?: MessageActionRow[];
}
