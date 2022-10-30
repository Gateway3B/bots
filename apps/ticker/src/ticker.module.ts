import { DiscordModule } from '@discord-nestjs/core';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { GatewayIntentBits } from 'discord.js';
import { AddTickerCommand } from './commands/addticker.command';
import { DelTickerCommand } from './commands/delticker.command';
import { ShowTickersCommand } from './commands/showtickers.command';
import { TickerCommand } from './commands/ticker.command';
import { Favorite, FavoriteSchema } from './service/favorite.schema';

@Module({
    imports: [
        MongooseModule.forRootAsync({
            imports: [ConfigModule],
            useFactory: async (configService: ConfigService) => ({
                uri: `mongodb://${configService.get<string>(
                    'MONGO_USERNAME',
                )}:${configService.get<string>(
                    'MONGO_PASSWORD',
                )}@localhost:27017?retryWrites=true&w=majority`,
            }),
            inject: [ConfigService],
        }),
        ConfigModule.forRoot(),
        DiscordModule.forRootAsync({
            imports: [ConfigModule],
            useFactory: (configService: ConfigService) => ({
                token: configService.get('TICKER_TOKEN'),
                discordClientOptions: {
                    intents: [GatewayIntentBits.Guilds],
                },
                failOnLogin: true,
                registerCommandOptions: [
                    {
                        forGuild: configService.get('TEST_GUILD'),
                        removeCommandsBefore: true,
                    },
                ],
            }),
            inject: [ConfigService],
        }),
        MongooseModule.forFeature([
            { name: Favorite.name, schema: FavoriteSchema },
        ]),
    ],
    providers: [
        AddTickerCommand,
        DelTickerCommand,
        ShowTickersCommand,
        TickerCommand,
    ],
})
export class TickerModule {}
