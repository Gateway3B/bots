import { TransformPipe } from '@discord-nestjs/common';
import {
    Command,
    DiscordTransformedCommand,
    Payload,
    TransformedCommandExecutionContext,
    UsePipes,
} from '@discord-nestjs/core';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import {
    Attachment,
    AttachmentBuilder,
    Embed,
    EmbedBuilder,
    HexColorString,
} from 'discord.js';
import { CrabDocument } from '../service/crab.schema';
import { CrabService } from '../service/crab.service';
import { CrabCascadeDto } from '../dto/crabCascade.dto';

@Command({
    name: 'crabcascade',
    description: 'Get a cascade of crabs.',
})
@UsePipes(TransformPipe)
export class CrabCascadeCommand
    implements DiscordTransformedCommand<CrabCascadeDto>
{
    constructor(
        private crabService: CrabService,
        private configService: ConfigService,
    ) {}

    async handler(
        @Payload() dto: CrabCascadeDto,
        { interaction }: TransformedCommandExecutionContext,
    ): Promise<void> {
        interaction.deferReply({ ephemeral: true });

        const embeds: Embed[] = [];
        const files: Attachment[] = [];
        const awaits = [];
        for (let i = 0; i < 10; i++) {
            const index = Math.floor(
                Math.random() * this.crabService.crabs.length,
            );

            awaits.push(
                this.getImage(this.crabService.crabs[index], embeds, files),
            );
        }

        await Promise.all(awaits);
        interaction.editReply({ embeds: embeds, files: files });
    }

    private async getImage(crab: CrabDocument, embeds, files) {
        const response = await axios.get(crab.imageURL, {
            responseType: 'arraybuffer',
        });
        const buffer = Buffer.from(response.data, 'utf-8');

        const title = crab.name.replace(/ ([a-z])/g, (x) => x.toUpperCase());
        const embed = new EmbedBuilder()
            .setColor(this.configService.get<HexColorString>('PrimaryColor'))
            .setTitle(title)
            .setImage(
                `attachment://${crab.name
                    .replace(' ', '_')
                    .replace('.', '')}.jpg`,
            );

        const attachmentName = `${crab.name.replace('.', '')}.jpg`;
        const file = new AttachmentBuilder(buffer).setName(attachmentName);

        embeds.push(embed);
        files.push(file);
    }
}
