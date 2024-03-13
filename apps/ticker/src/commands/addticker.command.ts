import { Command, Handler, InteractionEvent } from '@discord-nestjs/core';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { CommandInteraction, EmbedBuilder, HexColorString } from 'discord.js';
import { Model } from 'mongoose';
import { AddTickerDto } from '../dto/addticker.dto';
import { Favorite, FavoriteDocument } from '../service/favorite.schema';
import yahooFinance from 'yahoo-finance2';
import { SlashCommandPipe } from '@discord-nestjs/common';

@Command({
    name: 'addticker',
    description: 'Add ticker to favorites list. (Max 10)',
})
export class AddTickerCommand {
    constructor(
        @InjectModel(Favorite.name)
        private favoriteModel: Model<FavoriteDocument>,
        private configService: ConfigService,
    ) {}

    @Handler()
    async handler(
        @InteractionEvent(SlashCommandPipe) dto: AddTickerDto,
        @InteractionEvent() interaction: CommandInteraction,
    ): Promise<void> {
        const embed = new EmbedBuilder().setColor(
            this.configService.get<HexColorString>('PrimaryColor'),
        );

        const ticker = (
            interaction.options.get('ticker').value as string
        ).toUpperCase();

        const guild = interaction.guildId;

        const count = await this.favoriteModel
            .find()
            .count()
            .catch((err) => {
                throw new Error(err);
            });
        if (count >= 10) {
            embed.setTitle('Limit of 10 Favorites Reached');

            interaction.reply({ embeds: [embed] });
            return;
        }

        const existing = await this.favoriteModel
            .find({
                guild: guild,
                ticker: ticker,
            })
            .count()
            .catch((err) => {
                throw new Error(err);
            });
        if (existing != 0) {
            embed.setTitle(`Ticker ${ticker} Is Already On Favoites List`);

            interaction.reply({ embeds: [embed] });
            return;
        }

        const quote = await yahooFinance.quote(ticker).catch();

        if (!quote) {
            embed.setTitle(`Ticker ${ticker} Is Invalid`);

            interaction.reply({ embeds: [embed] });
            return;
        }

        // If ticker exists, add to Favorites
        const fav = new this.favoriteModel({
            guild: guild,
            ticker: quote.price.symbol,
        });

        await fav.save();

        embed.setTitle(quote.price.symbol + ' Added to Favorites');

        interaction.reply({ embeds: [embed] });
    }
}
