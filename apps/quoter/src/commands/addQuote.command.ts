import { SlashCommandPipe } from '@discord-nestjs/common';
import { Command, Handler, InteractionEvent } from '@discord-nestjs/core';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    CacheType,
    CommandInteraction,
    ComponentType,
    MessageActionRowComponentBuilder,
    ModalActionRowComponentBuilder,
    ModalBuilder,
    ModalSubmitInteraction,
    TextInputBuilder,
    TextInputStyle,
} from 'discord.js';
import { Model } from 'mongoose';
import { Quote, QuoteDocument } from '../service/quote.schema';
import { AddQuoteDto } from '../dto/addQuote.dto';
import { createQuoteEmbed } from '../helpers';

@Command({
    name: 'addquote',
    description: 'Add response with a trigger, with optional conditionals.',
})
export class AddQuoteCommand {
    constructor(
        @InjectModel(Quote.name)
        private quoteModel: Model<QuoteDocument>,
        private configService: ConfigService,
    ) {}

    @Handler()
    async onAddQuote(
        @InteractionEvent(SlashCommandPipe) dto: AddQuoteDto,
        @InteractionEvent() interaction: CommandInteraction,
    ): Promise<void> {
        await this.addQuote(dto, interaction);
    }

    async addQuote(dto: AddQuoteDto, interaction: CommandInteraction) {
        const modal = new ModalBuilder().setTitle('Quote').setCustomId('Quote');

        const quoteInput = new TextInputBuilder()
            .setLabel('Enter Quote')
            .setMinLength(1)
            .setStyle(TextInputStyle.Paragraph)
            .setCustomId('quote')
            .setRequired(true);

        modal.addComponents(
            new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(
                quoteInput,
            ),
        );

        await interaction.showModal(modal);

        await interaction
            .awaitModalSubmit({
                time: 60_000,
            })
            .then(async (modalSubmittion) =>
                this.modalSubmitHandler(dto, interaction, modalSubmittion),
            )
            .catch(
                async () =>
                    await interaction.followUp({
                        content: 'Timed out...',
                        ephemeral: true,
                    }),
            );
    }

    async modalSubmitHandler(
        dto: AddQuoteDto,
        interaction: CommandInteraction,
        modalSubmittion: ModalSubmitInteraction<CacheType>,
    ) {
        if (!dto.year && !dto.month && !dto.day) {
            const currDate = new Date();
            dto.year = currDate.getFullYear();
            dto.month = currDate.getMonth() + 1;
            dto.day = currDate.getDate();
        }

        const quote = new this.quoteModel({
            quote: modalSubmittion.fields.getTextInputValue('quote'),
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

        await modalSubmittion.reply({
            content: 'Saving...',
            ephemeral: true,
        });

        setTimeout(async () => {
            await modalSubmittion.deleteReply();

            const response = await interaction.followUp({
                embeds: [embed],
                components: [deleteQuote],
            });

            response
                .awaitMessageComponent<ComponentType.Button>({
                    filter: (i) => {
                        i.deferUpdate();
                        return i.user.id === interaction.user.id;
                    },
                    time: 60_000,
                })
                .then(async (buttonClick) => {
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

                    await buttonClick.update({
                        embeds: [embed],
                        components: [deleteQuote],
                    });
                })
                .catch(
                    async () =>
                        await response.edit({
                            embeds: [embed],
                            components: [],
                        }),
                );
        }, 1_000);
    }
}
