import { SlashCommandPipe } from '@discord-nestjs/common';
import { Command, Handler, InteractionEvent } from '@discord-nestjs/core';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import {
    CacheType,
    CommandInteraction,
    CommandInteractionOption,
    EmbedBuilder,
    HexColorString,
} from 'discord.js';
import { Model } from 'mongoose';
import { PollSettingsDto } from '../dtos/pollSettings.dto';
import {
    PollSettings,
    PollSettingsDocument,
} from '../service/pollSettings.schema';

@Command({
    name: 'pollsettings',
    description:
        'Set settings for polls. If no parameters are passed, returns current settings.',
})
export class PollSettingsCommand {
    constructor(
        @InjectModel(PollSettings.name)
        private pollSettingsModel: Model<PollSettingsDocument>,
        private configService: ConfigService,
    ) {}

    @Handler()
    async handler(
        @InteractionEvent(SlashCommandPipe) dto: PollSettingsDto,
        @InteractionEvent() interaction: CommandInteraction,
    ): Promise<void> {
        const guildSettings = await this.pollSettingsModel.findOne({
            guild: interaction.guildId,
        });

        const options = interaction.options.data;

        const updatedSetting = {
            guild: this.settingHandler(guildSettings, options, 'guild'),
            type: this.settingHandler(guildSettings, options, 'type'),
            time_limit_hours: this.settingHandler(
                guildSettings,
                options,
                'time_limit_hours',
            ),
            time_limit_minutes: this.settingHandler(
                guildSettings,
                options,
                'time_limit_minutes',
            ),
            real_time_results: this.settingHandler(
                guildSettings,
                options,
                'real_time_results',
            ),
            multiple_votes: this.settingHandler(
                guildSettings,
                options,
                'multiple_votes',
            ),
            role: this.settingHandler(guildSettings, options, 'role'),
        };

        await this.pollSettingsModel.findOneAndUpdate(
            { guild: interaction.guildId },
            updatedSetting,
            { upsert: true },
        );

        const embed = new EmbedBuilder()
            .setTitle('Poll Settings')
            .setColor(this.configService.get<HexColorString>('PrimaryColor'))
            .addFields(
                {
                    name: 'Type',
                    value:
                        (updatedSetting['type'] as string)
                            .charAt(0)
                            .toUpperCase() +
                        (updatedSetting['type'] as string).slice(1),
                    inline: true,
                },
                {
                    name: 'Time Limit',
                    value: `${
                        updatedSetting['time_limit_hours'] ?? '0'
                    } Hours-${
                        updatedSetting['time_limit_minutes'] ?? '5'
                    } Minutes`,
                    inline: true,
                },
                {
                    name: 'Real Time Results',
                    value: updatedSetting['real_time_results']
                        ? 'True'
                        : 'False',
                    inline: true,
                },
                {
                    name: 'Multiple Votes',
                    value: updatedSetting['multiple_votes'] ? 'True' : 'False',
                    inline: true,
                },
                {
                    name: 'Minimum Role',
                    value: updatedSetting['role']
                        ? `<@&${
                              interaction.guild.roles.cache.get(
                                  updatedSetting['role'] as string,
                              ).id
                          }>`
                        : '@everyone',
                    inline: true,
                },
            );

        interaction.reply({
            embeds: [embed],
        });
    }

    private option(
        options: readonly CommandInteractionOption<CacheType>[],
        name: string,
    ): string | number | boolean {
        const option = options.find((option) => option.name === name);
        return option ? option.value : null;
    }

    private settingHandler(
        guildSettings: PollSettings,
        options: readonly CommandInteractionOption<CacheType>[],
        name: string,
    ): string | number | boolean {
        return this.option(options, name) ?? guildSettings[name];
    }
}
