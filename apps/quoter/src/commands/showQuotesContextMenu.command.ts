import { Command, Handler } from '@discord-nestjs/core';
import {
    ActionRowBuilder,
    ApplicationCommandType,
    ButtonBuilder,
    ButtonStyle,
    ComponentType,
    MessageActionRowComponentBuilder,
    UserContextMenuCommandInteraction,
} from 'discord.js';
import { InjectModel } from '@nestjs/mongoose';
import { Quote, QuoteDocument } from '../service/quote.schema';
import { Model } from 'mongoose';
import { ConfigService } from '@nestjs/config';
import { AddQuoteDto } from '../dto/addQuote.dto';
import { createQuoteEmbed } from '../helpers';
import { ShowQuotesCommand } from './showQuotes.command';
import { ShowQuoteDto } from '../dto/showQuotes.dto';

@Command({
    name: 'show_quotes_from_user',
    type: ApplicationCommandType.User,
})
export class ShowQuotesContextMenuCommand {
    constructor(
        @InjectModel(Quote.name)
        private quoteModel: Model<QuoteDocument>,
        private configService: ConfigService,
    ) {}

    @Handler()
    async onShowQuotesContextMenu(
        interaction: UserContextMenuCommandInteraction,
    ) {
        const dto = new ShowQuoteDto();

        dto.user = interaction.targetId;

        try {
            await new ShowQuotesCommand(
                this.quoteModel,
                this.configService,
            ).listEmbed(dto, interaction, 0, true);
        } catch (e) {
            console.log(e);
            interaction.editReply({ components: [] });
        }
    }
}
