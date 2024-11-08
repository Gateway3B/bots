import { ConfigService } from '@nestjs/config';
import {
    HexColorString,
    EmbedBuilder,
    CommandInteraction,
    ButtonInteraction,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    CacheType,
    Message,
    MessageActionRowComponentBuilder,
    InteractionResponse,
} from 'discord.js';
import { Quote, QuoteDocument } from './service/quote.schema';
import { Model } from 'mongoose';

export const embedBuilder = (configService: ConfigService): EmbedBuilder => {
    const primaryColor = configService.get<HexColorString>('PrimaryColor');
    return new EmbedBuilder().setColor(primaryColor);
};

export const createQuoteEmbed = <Q extends Quote>(
    configService: ConfigService,
    quote: Q,
    embedTitle: string,
): EmbedBuilder => {
    const embed = embedBuilder(configService).setTitle(embedTitle);

    embed.addFields({
        name: 'User',
        value: quoteUserString(quote),
        inline: true,
    });

    embed.addFields({
        name: 'Date',
        value: quoteDateString(quote),
        inline: true,
    });

    embed.addFields({
        name: 'Quote',
        value: quote.quote,
        inline: false,
    });

    return embed;
};

export const quoteUserString = <Q extends Quote>(quote: Q) => {
    return quote ? `<@${quote.user}>` : 'User';
};

export const quoteDateString = <Q extends Quote>(quote: Q) => {
    const year = quote?.year ?? '----';
    const month = quote?.month ?? '--';
    const day = quote?.day ?? '--';
    return `${month}/${day}/${year}`;
};

export const buttonFilter =
    (interaction: CommandInteraction | ButtonInteraction) =>
    (i: ButtonInteraction) =>
        i.user.id === interaction.user.id;
