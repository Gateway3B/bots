import { TransformPipe } from '@discord-nestjs/common';
import {
    Command,
    DiscordTransformedCommand,
    Payload,
    TransformedCommandExecutionContext,
} from '@discord-nestjs/core';
import { UsePipes } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    EmbedBuilder,
    HexColorString,
} from 'discord.js';
import { Model } from 'mongoose';
import { Response, ResponseDocument } from '../service/response.schema';

@Command({
    name: 'showresps',
    description: 'Show all reponses set for this server.',
})
@UsePipes(TransformPipe)
export class ShowRespCommand implements DiscordTransformedCommand<any> {
    constructor(
        @InjectModel(Response.name)
        private responseModel: Model<ResponseDocument>,
        private configService: ConfigService,
    ) {}

    async handler(
        @Payload() dto: any,
        { interaction }: TransformedCommandExecutionContext,
    ): Promise<void> {
        const primaryColor =
            this.configService.get<HexColorString>('PrimaryColor');
        let triggers = '';
        let responses = '';
        let others = '';
        const triggerCharLimit = 15;
        const responseCharLimit = 28;
        let empty = false;

        let details;

        const checkMark = String.fromCodePoint(0x2705);
        const crossMark = String.fromCodePoint(0x274c);

        const resps = await this.responseModel.find({
            guild: interaction.guildId,
        });
        if (resps.length == 0) empty = true;

        for (let i = 0; i < resps.length; i++) {
            const resp = resps[i];
            if (i == 0) {
                details = new EmbedBuilder()
                    .setTitle('Details')
                    .setDescription(String.fromCodePoint(0x1f1e6))
                    .setColor(primaryColor)
                    .addFields(
                        { name: 'Trigger', value: resp.trigger, inline: true },
                        {
                            name: 'Response',
                            value: resp.response,
                            inline: true,
                        },
                        {
                            name: 'Ignore Case',
                            value: resp.ignoreCase ? 'Yes' : 'No',
                            inline: true,
                        },
                        {
                            name: 'Message Listen',
                            value: resp.messageListen ? 'Yes' : 'No',
                            inline: true,
                        },
                        {
                            name: 'User Listen',
                            value: resp.userListen
                                ? `<@${resp.userListen}>`
                                : 'None',
                            inline: true,
                        },
                        {
                            name: 'Role Listen',
                            value: resp.roleListen
                                ? `<@&${resp.roleListen}>`
                                : 'None',
                            inline: true,
                        },
                        {
                            name: 'Channel Listen',
                            value: resp.channelListen
                                ? `<#${resp.channelListen}>`
                                : 'None',
                            inline: true,
                        },
                        {
                            name: 'Channel Respond',
                            value: resp.channelRespond
                                ? `<#${resp.channelRespond}>`
                                : 'None',
                            inline: true,
                        },
                        {
                            name: 'Created By',
                            value: resp.userCreate
                                ? `<@${resp.userCreate}>`
                                : 'None',
                            inline: true,
                        },
                    );
            }

            triggers +=
                String.fromCodePoint(0x1f1e6 + i) +
                (resp.trigger.replace(/<([^>]*)/g, 'AAA').length <
                triggerCharLimit
                    ? resp.trigger
                    : resp.trigger.substring(
                          0,
                          responseCharLimit +
                              (resp.response.length -
                                  resp.response.replace(/<([^>]*)/g, 'AAA')
                                      .length),
                      ) + '...') +
                '\n';
            responses +=
                ':grey_exclamation:' +
                (resp.response.replace(/<([^>]*)/g, 'AAA').length <
                responseCharLimit
                    ? resp.response
                    : resp.response.substring(
                          0,
                          responseCharLimit +
                              (resp.response.length -
                                  resp.response.replace(/<([^>]*)/g, 'AAA')
                                      .length),
                      ) + '...') +
                '\n';
            others += (resp.ignoreCase ? checkMark : crossMark) + '|';
            others += (resp.messageListen ? checkMark : crossMark) + '|';
            others += (resp.userListen ? checkMark : crossMark) + '|';
            others += (resp.roleListen ? checkMark : crossMark) + '|';
            others += (resp.channelListen ? checkMark : crossMark) + '|';
            others += (resp.channelRespond ? checkMark : crossMark) + '\n';
        }

        if (empty) {
            const empty = new EmbedBuilder()
                .setTitle('No Responses To Show')
                .setColor(primaryColor);

            interaction.reply({ embeds: [empty] });
        } else {
            const embed = new EmbedBuilder()
                .setColor(primaryColor)
                .setTitle('Responses')
                .addFields(
                    { name: 'Trigger', value: triggers, inline: true },
                    { name: 'Response', value: responses, inline: true },
                    { name: 'Others', value: others, inline: true },
                    {
                        name: 'Others Guide',
                        value: 'Ignore Case|Msg Listen|User Listen|Role Listen|Channel Listen|Channel Respond',
                        inline: false,
                    },
                );

            const followUp = { object: null };
            const buttonRows = this.createButtons(
                followUp,
                interaction,
                resps,
                primaryColor,
            );

            setTimeout(() => {
                buttonRows.forEach((x) =>
                    x.components.forEach((x) => x.setDisabled(true)),
                );
                interaction.editReply({
                    embeds: [embed],
                    components: buttonRows,
                });
                followUp.object.delete();
            }, 60000);

            await interaction.reply({
                embeds: [embed],
                components: buttonRows,
            });
            followUp.object = await interaction.followUp({ embeds: [details] });
        }
    }

    private createButtons(followUp, interaction, resps, primaryColor) {
        const buttonRows = [];
        buttonRows.push(new ActionRowBuilder());

        resps.forEach((resp, index) => {
            if (buttonRows[buttonRows.length - 1].components.length === 5)
                buttonRows.push(new ActionRowBuilder());

            const emoji = String.fromCodePoint(0x1f1e6 + index);

            const buttonId = `${
                interaction.guild.id
            }${emoji.toString()}${Math.floor(Math.random() * 1000)}`;

            buttonRows[buttonRows.length - 1].addComponents(
                new ButtonBuilder()
                    .setCustomId(buttonId)
                    .setLabel(emoji)
                    .setStyle(ButtonStyle.Primary),
            );

            const filter = (i) =>
                i.customId === buttonId &&
                i.member.id === interaction.member.id;

            const collector =
                interaction.channel.createMessageComponentCollector({
                    filter,
                    time: 60000,
                });

            collector.on('collect', async (i) => {
                const details = new EmbedBuilder()
                    .setTitle('Details')
                    .setDescription(emoji)
                    .setColor(primaryColor)
                    .addFields(
                        { name: 'Trigger', value: resp.trigger, inline: true },
                        {
                            name: 'Response',
                            value: resp.response,
                            inline: true,
                        },
                        {
                            name: 'Ignore Case',
                            value: resp.ignoreCase ? 'Yes' : 'No',
                            inline: true,
                        },
                        {
                            name: 'Message Listen',
                            value: resp.messageListen ? 'Yes' : 'No',
                            inline: true,
                        },
                        {
                            name: 'User Listen',
                            value: resp.userListen
                                ? `<@${resp.userListen}>`
                                : 'None',
                            inline: true,
                        },
                        {
                            name: 'Role Listen',
                            value: resp.roleListen
                                ? `<@&${resp.roleListen}>`
                                : 'None',
                            inline: true,
                        },
                        {
                            name: 'Channel Listen',
                            value: resp.channelListen
                                ? `<#${resp.channelListen}>`
                                : 'None',
                            inline: true,
                        },
                        {
                            name: 'Channel Respond',
                            value: resp.channelRespond
                                ? `<#${resp.channelRespond}>`
                                : 'None',
                            inline: true,
                        },
                        {
                            name: 'Created By',
                            value: resp.userCreate
                                ? `<@${resp.userCreate}>`
                                : 'None',
                            inline: true,
                        },
                    );

                followUp.object.edit({ embeds: [details] });
                i.deferUpdate();
            });
        });

        return buttonRows;
    }
}
