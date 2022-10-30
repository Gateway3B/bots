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
import { ShowTickersDto } from '../dto/showtickers.dto';
import { Favorite, FavoriteDocument } from '../service/favorite.schema';
import * as yahooFinance from 'yahoo-finance';

@Command({
    name: 'showtickers',
    description: 'Show ticker favorites list.',
})
@UsePipes(TransformPipe)
export class ShowTickersCommand
    implements DiscordTransformedCommand<ShowTickersDto>
{
    constructor(
        @InjectModel(Favorite.name)
        private favoriteModel: Model<FavoriteDocument>,
        private configService: ConfigService,
    ) {}

    async handler(
        @Payload() dto: ShowTickersDto,
        { interaction }: TransformedCommandExecutionContext,
    ): Promise<void> {
        const embed = new EmbedBuilder();

        const primaryColor =
            this.configService.get<HexColorString>('PrimaryColor');

        let tickers = '';
        let prices = '';
        let highsLows = '';

        const favorites = await this.favoriteModel.find({
            guild: interaction.guildId,
        });

        if (favorites.length == 0) {
            embed
                .setTitle('Favorites List Empty. Use /addticker')
                .setColor(primaryColor);

            interaction.reply({ embeds: [embed] });
            return;
        }

        for (let i = 0; i < favorites.length; i++) {
            const quote = await yahooFinance
                .quote({
                    symbol: favorites[i].ticker,
                    modules: ['price'],
                })
                .catch(() => {});

            if (!quote) {
                embed
                    .setTitle('Error Recieving Data From Yahoo')
                    .setColor(primaryColor);

                interaction.reply({ embeds: [embed] });
                return;
            }

            tickers += quote.price.symbol + '\n';
            prices +=
                '$' +
                parseFloat(quote.price.regularMarketPrice).toFixed(2) +
                '\n';
            highsLows +=
                '$' +
                parseFloat(quote.price.regularMarketDayHigh).toFixed(2) +
                '/' +
                '$' +
                parseFloat(quote.price.regularMarketDayLow).toFixed(2) +
                '\n';
        }

        embed
            .setTitle('Favorite Tickers List')
            .setColor(primaryColor)
            .addFields(
                { name: 'Ticker', value: tickers, inline: true },
                { name: 'Price', value: prices, inline: true },
                { name: 'High/Low', value: highsLows, inline: true },
            );

        interaction.reply({ embeds: [embed] });
    }
}
