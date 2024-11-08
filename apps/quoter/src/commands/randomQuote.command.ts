import { SlashCommandPipe } from '@discord-nestjs/common';
import { Command, Handler, InteractionEvent } from '@discord-nestjs/core';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { CommandInteraction } from 'discord.js';
import { Model } from 'mongoose';
import { RandomQuoteDto } from '../dto/randomQuote.dto';
import { Quote, QuoteDocument } from '../service/quote.schema';
import { createQuoteEmbed } from '../helpers';

@Command({
    name: 'randomquote',
    description: 'Display a random quote from a user.',
})
export class RandomQuoteCommand {
    constructor(
        @InjectModel(Quote.name)
        private quoteModel: Model<QuoteDocument>,
        private configService: ConfigService,
    ) {}

    @Handler()
    async onRandomQuote(
        @InteractionEvent(SlashCommandPipe) dto: RandomQuoteDto,
        @InteractionEvent() interaction: CommandInteraction,
    ): Promise<void> {
        const count = await this.quoteModel.countDocuments({
            user: dto.user,
            guildId: interaction.guild.id,
        });
        const random = Math.floor(Math.random() * count);
        const quote = await this.quoteModel
            .findOne({ user: dto.user, guildId: interaction.guild.id })
            .skip(random);

        const embed = createQuoteEmbed(this.configService, quote, 'Quote');

        await interaction.reply({ embeds: [embed] });
    }
}
