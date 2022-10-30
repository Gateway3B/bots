import { TransformPipe } from '@discord-nestjs/common';
import {
    Command,
    DiscordTransformedCommand,
    Payload,
    TransformedCommandExecutionContext,
    UsePipes,
} from '@discord-nestjs/core';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { EmbedBuilder, HexColorString } from 'discord.js';
import { Model } from 'mongoose';
import { DelRespsDto } from '../dtos/delresps.dto';
import { Response, ResponseDocument } from '../service/response.schema';

@Command({
    name: 'delresps',
    description:
        'Delete all responses with trigger or tidder and optional response.',
})
@UsePipes(TransformPipe)
export class DelRespsCommand implements DiscordTransformedCommand<DelRespsDto> {
    constructor(
        @InjectModel(Response.name)
        private responseModel: Model<ResponseDocument>,
        private configService: ConfigService,
    ) {}

    async handler(
        @Payload() dto: DelRespsDto,
        { interaction }: TransformedCommandExecutionContext<any>,
    ): Promise<void> {
        const primaryColor =
            this.configService.get<HexColorString>('PrimaryColor');

        // Create filter depending sent parameters.
        const filter = dto.response
            ? { trigger: dto.trigger, response: dto.response }
            : { trigger: dto.trigger };

        // Delete all documents that pass the filter.
        const num = await this.responseModel.deleteMany({
            ...filter,
            guild: interaction.guildId,
        });

        // Create embed.
        const embed = new EmbedBuilder()
            .setColor(primaryColor)
            .setTitle(
                `${num.deletedCount} Response${
                    num.deletedCount != 1 ? 's' : ''
                } Deleted`,
            );

        for (let i = 0; i < interaction.options.data.length; i++) {
            if (interaction.options.data[i]) {
                embed.addFields({
                    name: this.format(interaction.options.data[i].name),
                    value: interaction.options.data[i].value as string,
                });
            }
        }

        interaction.reply({ embeds: [embed] });
    }

    private format(camelString: string): string {
        return camelString
            .replace(/_/g, ' ')
            .trim()
            .replace(/^\w|\s\w/g, (c) => c.toUpperCase());
    }
}
