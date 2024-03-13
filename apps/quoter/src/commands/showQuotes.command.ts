import { SlashCommandPipe } from '@discord-nestjs/common';
import { Command, Handler, InteractionEvent } from '@discord-nestjs/core';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import {
    ActionRowBuilder,
    AttachmentPayload,
    ButtonBuilder,
    ButtonInteraction,
    ButtonStyle,
    CommandInteraction,
    ComponentType,
    MessageActionRowComponentBuilder,
    UserContextMenuCommandInteraction,
} from 'discord.js';
import { Model } from 'mongoose';
import { Quote, QuoteDocument } from '../service/quote.schema';
import {
    buttonFilter,
    createQuoteEmbed,
    embedBuilder,
    quoteDateString,
} from '../helpers';
import { ShowQuoteDto } from '../dto/showQuotes.dto';

@Command({
    name: 'showquotes',
    description: 'Show quotes.',
})
export class ShowQuotesCommand {
    constructor(
        @InjectModel(Quote.name)
        private quoteModel: Model<QuoteDocument>,
        private configService: ConfigService,
    ) {}

    @Handler()
    async onRandomQuote(
        @InteractionEvent(SlashCommandPipe) dto: ShowQuoteDto,
        @InteractionEvent() interaction: CommandInteraction,
    ): Promise<void> {
        try {
            await this.listEmbed(dto, interaction, 0, true);
        } catch (e) {
            console.log(e);
            interaction.editReply({ components: [] });
        }
    }

    async listEmbed(
        dto: ShowQuoteDto,
        interaction:
            | CommandInteraction
            | ButtonInteraction
            | UserContextMenuCommandInteraction,
        pageNumber: number,
        initial: boolean,
        files: AttachmentPayload[] = [],
    ) {
        const count = await this.quoteModel.countDocuments({
            user: dto.user,
            guild: interaction.guild.id,
        });

        if (pageNumber + 1 > Math.ceil(count / 10) && pageNumber > 0) {
            pageNumber--;
        }

        const quotes = await this.quoteModel
            .find({
                user: dto.user,
                guild: interaction.guild.id,
            })
            .sort({ year: -1, month: -1, day: -1 })
            .skip(pageNumber * 10)
            .limit(10);

        if (quotes.length === 0) {
            const embed = embedBuilder(this.configService)
                .setTitle('No Quotes')
                .setDescription(`<@${dto.user}>'s Quotes`);

            await interaction.reply({ embeds: [embed] });

            return;
        }

        const embed = embedBuilder(this.configService)
            .setTitle(`Quotes (${pageNumber + 1}/${Math.ceil(count / 10)})`)
            .setDescription(`<@${dto.user}>'s Quotes`);

        const selectorColumn: string[] = [];
        const dateColumn: string[] = [];
        const quoteColumn: string[] = [];

        const actionRows: ActionRowBuilder<MessageActionRowComponentBuilder>[] =
            [];
        actionRows.push(new ActionRowBuilder());

        quotes.forEach((quote, i) => {
            const letter = String.fromCodePoint(0x1f1e6 + i);
            selectorColumn.push(letter);
            dateColumn.push(quoteDateString(quote));
            quoteColumn.push(
                quote.quote.substring(0, 60) +
                    (quote.quote.length > 60 ? '...' : ''),
            );

            if (actionRows[actionRows.length - 1].components.length == 5) {
                actionRows.push(new ActionRowBuilder());
            }

            actionRows[actionRows.length - 1].addComponents(
                new ButtonBuilder()
                    .setCustomId(quote.id)
                    .setLabel(letter)
                    .setStyle(ButtonStyle.Primary),
            );
        });

        embed.addFields({
            name: '*',
            value: selectorColumn.join('\n'),
            inline: true,
        });

        embed.addFields({
            name: 'Date',
            value: dateColumn.join('\n'),
            inline: true,
        });

        embed.addFields({
            name: 'Quote',
            value: quoteColumn.join('\n'),
            inline: true,
        });

        actionRows.push(new ActionRowBuilder());

        actionRows[actionRows.length - 1].addComponents(
            new ButtonBuilder()
                .setCustomId(`prev`)
                .setLabel('Prev')
                .setStyle(ButtonStyle.Secondary)
                .setDisabled(pageNumber === 0),
            new ButtonBuilder()
                .setCustomId(`next`)
                .setLabel('Next')
                .setStyle(ButtonStyle.Secondary)
                .setDisabled(((pageNumber + 1) * 10) / count >= 1),
            new ButtonBuilder()
                .setCustomId('Export')
                .setLabel('Export')
                .setStyle(ButtonStyle.Success),
        );

        const resp = await (initial
            ? interaction.reply({
                  embeds: [embed],
                  components: actionRows,
              })
            : (interaction as ButtonInteraction).update({
                  embeds: [embed],
                  components: actionRows,
                  files,
              }));

        const buttonClick =
            await resp.awaitMessageComponent<ComponentType.Button>({
                filter: buttonFilter(interaction),
                time: 60_000,
            });

        switch (buttonClick.customId) {
            case 'prev':
                await this.listEmbed(dto, buttonClick, pageNumber - 1, false);
                break;
            case 'next':
                await this.listEmbed(dto, buttonClick, pageNumber + 1, false);
                break;
            case 'Export':
                const quotes = await this.quoteModel
                    .find({
                        user: dto.user,
                        guild: interaction.guild.id,
                    })
                    .sort({ year: -1, month: -1, day: -1 });

                let csv = 'Date,Quote\n';

                quotes.forEach((quote) => {
                    csv += quoteDateString(quote);
                    csv += ',';
                    csv += `"${quote.quote.replace('"', '""')}"`;
                    csv += '\n';
                });

                const files = [
                    { attachment: Buffer.from(csv), name: 'Quotes.csv' },
                ];
                await this.listEmbed(
                    dto,
                    buttonClick,
                    pageNumber,
                    false,
                    files,
                );
            default:
                await this.quoteEmbed(
                    dto,
                    buttonClick,
                    buttonClick.customId,
                    pageNumber,
                );
        }
    }

    async quoteEmbed(
        dto: ShowQuoteDto,
        interaction: ButtonInteraction,
        quoteId: string,
        pageNumber: number,
        deleted = false,
    ) {
        const quote = await this.quoteModel.findById(quoteId);
        if (deleted) {
            await this.quoteModel.findByIdAndDelete(quoteId);
        }

        const embed = createQuoteEmbed(this.configService, quote, 'Quote');

        const deleteQuote =
            new ActionRowBuilder<MessageActionRowComponentBuilder>({
                components: [
                    new ButtonBuilder()
                        .setCustomId(deleted ? 'Deleted' : 'Delete')
                        .setLabel('Delete Quote')
                        .setStyle(ButtonStyle.Primary)
                        .setDisabled(deleted),
                    new ButtonBuilder()
                        .setCustomId('Return')
                        .setLabel('Return')
                        .setStyle(ButtonStyle.Primary),
                ],
            });

        const response = await interaction.update({
            embeds: [embed],
            components: [deleteQuote],
        });

        const deleteQuoteButtonInteraction =
            await response.awaitMessageComponent<ComponentType.Button>({
                filter: buttonFilter(interaction),
                time: 60_000,
            });

        if (deleteQuoteButtonInteraction.customId === 'Return') {
            await this.listEmbed(
                dto,
                deleteQuoteButtonInteraction,
                pageNumber,
                false,
            );
        } else {
            await this.quoteEmbed(
                dto,
                deleteQuoteButtonInteraction,
                quoteId,
                pageNumber,
                true,
            );
        }
    }
}
