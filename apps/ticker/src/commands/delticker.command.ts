import { SlashCommandPipe } from '@discord-nestjs/common';
import { Command, Handler, InteractionEvent } from '@discord-nestjs/core';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { CommandInteraction, EmbedBuilder, HexColorString } from 'discord.js';
import { Model } from 'mongoose';
import { DelTickerDto } from '../dto/delticker.dto';
import { Favorite, FavoriteDocument } from '../service/favorite.schema';

@Command({
    name: 'delticker',
    description: 'Delete ticker from favorites list.',
})
export class DelTickerCommand {
    constructor(
        @InjectModel(Favorite.name)
        private favoriteModel: Model<FavoriteDocument>,
        private configService: ConfigService,
    ) {}

    @Handler()
    async handler(
        @InteractionEvent(SlashCommandPipe) dto: DelTickerDto,
        @InteractionEvent() interaction: CommandInteraction,
    ): Promise<void> {
        const embed = new EmbedBuilder();

        const ticker = (
            interaction.options.get('ticker').value as string
        ).toUpperCase();

        const primaryColor =
            this.configService.get<HexColorString>('PrimaryColor');

        const guild = interaction.guildId;

        await this.favoriteModel
            .find({
                guild: guild,
                ticker: ticker,
            })
            .then(async (tickers) => {
                if (tickers.length != 0) {
                    await this.favoriteModel.deleteOne({
                        guild: guild,
                        ticker: ticker,
                    });

                    embed
                        .setTitle(ticker + ' Removed From Favoites List')
                        .setColor(primaryColor);

                    interaction.reply({ embeds: [embed] });
                } else {
                    embed
                        .setTitle(ticker + ' Is Not On Favoites List')
                        .setColor(primaryColor);

                    interaction.reply({ embeds: [embed] });
                }
            });
    }
}
