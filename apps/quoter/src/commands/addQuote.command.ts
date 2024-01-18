import { SlashCommandPipe } from '@discord-nestjs/common';
import { Command, Handler, InteractionEvent } from '@discord-nestjs/core';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import {
    EmbedBuilder,
    HexColorString,
    InteractionReplyOptions,
} from 'discord.js';
import { Model } from 'mongoose';
import { Quote, QuoteDocument } from '../service/quote.schema';
import { AddQuoteDto } from '../dto/addQuote.dto';

@Command({
    name: 'addquote',
    description: 'Add response with a trigger, with optional conditionals.',
})
export class AddRespCommand {
    constructor(
        @InjectModel(Quote.name)
        private quoteModel: Model<QuoteDocument>,
        private configService: ConfigService,
    ) {}

    @Handler()
    async onAddQuote(
        @InteractionEvent(SlashCommandPipe) dto: AddQuoteDto,
    ): Promise<InteractionReplyOptions> {
        const quote = new this.quoteModel({
            ...dto,
        });

        if (!quote.year && !quote.month && !quote.day) {
            const currDate = new Date();
            quote.year = currDate.getFullYear();
            quote.month = currDate.getMonth();
            quote.day = currDate.getDay();
        }

        await quote.save();

        const primaryColor =
            this.configService.get<HexColorString>('PrimaryColor');

        const embed = new EmbedBuilder()
            .setColor(primaryColor)
            .setTitle('Quote Added')
            .addFields(
                {
                    name: 'User',
                    value: `<@${quote.user}>`,
                    inline: true,
                },
                {
                    name: 'Quote',
                    value: quote.quote,
                    inline: true,
                },
            );

        if (quote.year || quote.month || quote.day) {
            const year = quote.year ?? '----';
            const month = quote.month ?? '--';
            const day = quote.day ?? '--';

            embed.addFields({
                name: 'Date',
                value: `${month}/${day}/${year}`,
                inline: true,
            });
        }

        return {
            embeds: [embed],
        };
    }
}
