import { TransformPipe } from '@discord-nestjs/common';
import {
    Command,
    DiscordTransformedCommand,
    TransformedCommandExecutionContext,
} from '@discord-nestjs/core';
import { UsePipes } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import {
    EmbedBuilder,
    HexColorString,
    InteractionReplyOptions,
} from 'discord.js';
import { CrabService } from '../service/crab.service';

@Command({
    name: 'crab',
    description: 'Get a crab.',
})
@UsePipes(TransformPipe)
export class CrabCommand implements DiscordTransformedCommand<any> {
    constructor(
        private crabService: CrabService,
        private configService: ConfigService,
    ) {}

    async handler(
        dto: any,
        executionContext: TransformedCommandExecutionContext<any>,
    ): Promise<InteractionReplyOptions> {
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

        return {
            embeds: [embed],
            files: [
                {
                    attachment: buffer,
                    name: `${crab.name.replace('.', '')}.jpg`,
                },
            ],
        };
    }
}
