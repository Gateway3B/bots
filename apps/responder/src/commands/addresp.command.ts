import { Command, Handler, InteractionEvent } from '@discord-nestjs/core';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { CommandInteraction, EmbedBuilder, HexColorString } from 'discord.js';
import { Model } from 'mongoose';
import { AddRespDto } from '../dtos/addresp.dto';
import { Response, ResponseDocument } from '../service/response.schema';
import { SlashCommandPipe } from '@discord-nestjs/common';

@Command({
    name: 'addresp',
    description: 'Add response with a trigger, with optional conditionals.',
})
export class AddRespCommand {
    constructor(
        @InjectModel(Response.name)
        private responseModel: Model<ResponseDocument>,
        private configService: ConfigService,
    ) {}

    @Handler()
    async handler(
        @InteractionEvent(SlashCommandPipe) dto: AddRespDto,
        @InteractionEvent() interaction: CommandInteraction,
    ): Promise<void> {
        console.log(dto);
        const primaryColor =
            this.configService.get<HexColorString>('PrimaryColor');

        const resps = await this.responseModel.find({
            guild: interaction.guildId,
        });

        const embed = new EmbedBuilder().setColor(primaryColor);

        if (resps.length === 25) {
            embed.setTitle('Limit of 25 Responses Hit. Response Not Added.');
        } else {
            // Create a new response from the parameters.
            const resp = new this.responseModel({
                trigger: dto.trigger.trim(),
                response: dto.response,
                ignoreCase: dto.ignoreCase || false,
                messageListen: dto.messageListen || false,
                userListen: dto.userListen,
                roleListen: dto.roleListen,
                channelListen: dto.channelListen,
                channelRespond: dto.channelRespond,
                userCreate: interaction.member.user.id,
                guild: interaction.guildId,
            });

            await resp.save();

            embed.setTitle('Response Added').addFields(
                { name: 'Trigger', value: resp.trigger, inline: true },
                { name: 'Response', value: resp.response, inline: true },
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
                    value: resp.userListen ? `<@${resp.userListen}>` : 'None',
                    inline: true,
                },
                {
                    name: 'Role Listen',
                    value: resp.roleListen ? `<@&${resp.roleListen}>` : 'None',
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
                    value: resp.userCreate ? `<@${resp.userCreate}>` : 'None',
                    inline: true,
                },
            );
        }

        interaction.reply({ embeds: [embed] });
    }
}
