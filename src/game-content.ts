import { DiscordEmbed, DiscordMessageActionRow } from 'discord-minimal';

export interface GameContent {
    embeds?: DiscordEmbed[];
    components?: DiscordMessageActionRow[];
}
