import { Command, Handler } from '@discord-nestjs/core';
import {
    ActionRowBuilder,
    ApplicationCommandType,
    ButtonBuilder,
    ButtonStyle,
    ComponentType,
    MessageActionRowComponentBuilder,
    MessageContextMenuCommandInteraction,
} from 'discord.js';
import { InjectModel } from '@nestjs/mongoose';
import { Quote, QuoteDocument } from '../service/quote.schema';
import { Model } from 'mongoose';
import { ConfigService } from '@nestjs/config';
import { AddQuoteDto } from '../dto/addQuote.dto';
import { createQuoteEmbed } from '../helpers';

@Command({
    name: 'add_quote_from_message',
    type: ApplicationCommandType.Message,
})
export class AddQuoteContextMenuCommand {
    constructor(
        @InjectModel(Quote.name)
        private quoteModel: Model<QuoteDocument>,
        private configService: ConfigService,
    ) {}

    @Handler()
    async onAddQuoteContextMenu(
        interaction: MessageContextMenuCommandInteraction,
    ) {
        const dto = new AddQuoteDto();
        dto.user = interaction.targetMessage.author.id;

        const date = new Date(
            interaction.targetMessage.editedTimestamp ??
                interaction.targetMessage.createdTimestamp,
        );
        dto.day = date.getDate();
        dto.month = date.getMonth() + 1;
        dto.year = date.getFullYear();

        if (!dto.year && !dto.month && !dto.day) {
            const currDate = new Date();
            dto.year = currDate.getFullYear();
            dto.month = currDate.getMonth() + 1;
            dto.day = currDate.getDate();
        }

        const quote = new this.quoteModel({
            quote: interaction.targetMessage.content,
            guildId: interaction.guild.id,
            ...dto,
        });

        const id = (await quote.save()).id;

        const embed = createQuoteEmbed(
            this.configService,
            quote,
            'Quote Added',
        );

        const deleteQuote =
            new ActionRowBuilder<MessageActionRowComponentBuilder>({
                components: [
                    new ButtonBuilder()
                        .setCustomId('Delete')
                        .setLabel(`Delete Quote`)
                        .setStyle(ButtonStyle.Primary),
                ],
            });

        const response = await interaction.reply({
            embeds: [embed],
            components: [deleteQuote],
        });

        await response
            .awaitMessageComponent<ComponentType.Button>({
                filter: (i) => {
                    i.deferUpdate();
                    return i.user.id === interaction.user.id;
                },
                time: 60_000,
            })
            .then(async () => {
                await this.quoteModel.findByIdAndDelete(id);

                const deleteQuote =
                    new ActionRowBuilder<MessageActionRowComponentBuilder>({
                        components: [
                            new ButtonBuilder()
                                .setCustomId('Deleted')
                                .setLabel(`Quote Deleted`)
                                .setStyle(ButtonStyle.Primary)
                                .setDisabled(true),
                        ],
                    });

                await response.edit({
                    embeds: [embed],
                    components: [deleteQuote],
                });
            })
            .catch(async () => {
                await response.edit({
                    embeds: [embed],
                    components: [],
                });
            });
    }
}
