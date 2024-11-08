import { SlashCommandPipe } from '@discord-nestjs/common';
import { Command, Handler, InteractionEvent } from '@discord-nestjs/core';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import {
    CommandInteraction,
    EmbedBuilder,
    HexColorString,
    InteractionReplyOptions,
} from 'discord.js';
import { CrabService } from '../service/crab.service';

@Command({
    name: 'crab',
    description: 'Get a crab.',
})
export class CrabCommand {
    constructor(
        private crabService: CrabService,
        private configService: ConfigService,
    ) {}

    @Handler()
    async handler(
        @InteractionEvent(SlashCommandPipe) dto: any,
        @InteractionEvent() interaction: CommandInteraction<any>,
    ): Promise<InteractionReplyOptions> {
        await interaction.deferReply();

        const count = this.crabService.crabs.length;
        const index = Math.floor(Math.random() * count);

        const crab = this.crabService.crabs[index];

        if (!crab) {
            const embed = new EmbedBuilder()
                .setColor(
                    this.configService.get<HexColorString>('PrimaryColor'),
                )
                .setTitle('No Crabs Error :(');

            return { embeds: [embed], ephemeral: true };
        }

        const response = await axios.get(crab.imageURL, {
            responseType: 'arraybuffer',
        });
        const buffer = Buffer.from(response.data, 'utf-8');

        crab.name = crab.name.replace(/ ([a-z])/g, function (x) {
            return x.toUpperCase();
        });

        const embed = new EmbedBuilder()
            .setColor(this.configService.get<HexColorString>('PrimaryColor'))
            .setTitle(crab.name)
            .setImage(
                `attachment://${crab.name
                    .replace(' ', '_')
                    .replace('.', '')}.jpg`,
            );

        await interaction.editReply({
            embeds: [embed],
            files: [
                {
                    attachment: buffer,
                    name: `${crab.name.replace('.', '')}.jpg`,
                },
            ],
        });
    }
}
