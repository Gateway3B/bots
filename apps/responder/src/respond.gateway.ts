import { On } from '@discord-nestjs/core';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { EmbedBuilder, HexColorString, Message, TextChannel } from 'discord.js';
import { Model } from 'mongoose';
import { Response, ResponseDocument } from './service/response.schema';

@Injectable()
export class RespondGateway {
    constructor(
        @InjectModel(Response.name)
        private responseModel: Model<ResponseDocument>,
        private configService: ConfigService,
    ) {}

    @On('messageCreate')
    async onMessage(message: Message): Promise<void> {
        await this.responseModel
            .find({ guild: message.guildId })
            .then(async (resp: Response[]) => {
                resp.forEach(async (resp) => {
                    let shouldRespond = true;
                    let trigger = resp.trigger;
                    let messageContent = message.content;

                    // Determine if responder should respond.
                    if (
                        resp.userListen &&
                        resp.userListen !== message.author.id
                    )
                        shouldRespond = false;
                    else if (
                        resp.channelListen &&
                        resp.channelListen !== message.channel.id
                    )
                        shouldRespond = false;
                    else if (
                        resp.roleListen &&
                        message.member.roles.cache.some(
                            (role) => role.id === resp.roleListen,
                        )
                    )
                        shouldRespond = false;
                    else if (resp.ignoreCase) {
                        messageContent = messageContent.toLowerCase();
                        trigger = trigger.toLowerCase();
                    }

                    if (shouldRespond) {
                        if (resp.messageListen) {
                            if (!messageContent.includes(trigger))
                                shouldRespond = false;
                        } else {
                            if (!(messageContent === trigger))
                                shouldRespond = false;
                        }
                    }

                    if (shouldRespond) {
                        // Create embed.
                        const embed = new EmbedBuilder()
                            .setColor(
                                this.configService.get<HexColorString>(
                                    'PrimaryColor',
                                ),
                            )
                            .setTitle(resp.response);

                        if (resp.userCreate) {
                            const user = await message.client.users.fetch(
                                resp.userCreate,
                            );
                            embed.setFooter({
                                text: `Created By: ${user.username}`,
                            });
                        }

                        if (resp.channelRespond) {
                            embed.setDescription(
                                `Responding From: ${message.channel.url}`,
                            );
                            const chan = (await message.client.channels.fetch(
                                resp.channelRespond,
                            )) as TextChannel;

                            chan.send({ embeds: [embed] });
                        } else {
                            message.channel.send({
                                embeds: [embed],
                            });
                        }
                    }
                });
            });
    }
}
