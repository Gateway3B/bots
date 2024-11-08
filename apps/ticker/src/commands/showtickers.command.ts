import { SlashCommandPipe } from '@discord-nestjs/common';
import { Command, Handler, InteractionEvent } from '@discord-nestjs/core';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { CommandInteraction, EmbedBuilder, HexColorString } from 'discord.js';
import { Model } from 'mongoose';
import { ShowTickersDto } from '../dto/showtickers.dto';
import { Favorite, FavoriteDocument } from '../service/favorite.schema';
import yahooFinance from 'yahoo-finance2';

@Command({
    name: 'showtickers',
    description: 'Show ticker favorites list.',
})
export class ShowTickersCommand {
    constructor(
        @InjectModel(Favorite.name)
        private favoriteModel: Model<FavoriteDocument>,
        private configService: ConfigService,
    ) {}

    @Handler()
    async handler(
        @InteractionEvent(SlashCommandPipe) dto: ShowTickersDto,
        @InteractionEvent() interaction: CommandInteraction,
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
            const quote = await yahooFinance.quote(favorites[i].ticker).catch();

            if (!quote) {
                embed
                    .setTitle('Error Recieving Data From Yahoo')
                    .setColor(primaryColor);

                interaction.reply({ embeds: [embed] });
                return;
            }

            tickers += quote.symbol + '\n';
            prices += `$${quote.regularMarketPrice}\n`;
            highsLows += `$${quote.regularMarketDayHigh}/$${quote.regularMarketDayLow}\n`;
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
