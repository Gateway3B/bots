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
import { EmbedBuilder, HexColorString } from 'discord.js';
import { Model } from 'mongoose';
import { AddTickerDto } from '../dto/addticker.dto';
import { Favorite, FavoriteDocument } from '../service/favorite.schema';
import * as yahooFinance from 'yahoo-finance';

@Command({
    name: 'addticker',
    description: 'Add ticker to favorites list. (Max 10)',
})
@UsePipes(TransformPipe)
export class AddTickerCommand
    implements DiscordTransformedCommand<AddTickerDto>
{
    constructor(
        @InjectModel(Favorite.name)
        private favoriteModel: Model<FavoriteDocument>,
        private configService: ConfigService,
    ) {}

    async handler(
        @Payload() dto: AddTickerDto,
        { interaction }: TransformedCommandExecutionContext,
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

        const quote = await yahooFinance
            .quote({
                symbol: ticker,
                modules: ['price'],
            })
            .catch(() => {});

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
