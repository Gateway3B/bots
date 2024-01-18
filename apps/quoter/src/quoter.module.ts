import { DiscordModule } from '@discord-nestjs/core';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { GatewayIntentBits } from 'discord.js';
import { Quote, QuoteSchema } from './service/quote.schema';

@Module({
    imports: [
        MongooseModule.forRootAsync({
            imports: [ConfigModule],
            useFactory: async (configService: ConfigService) => ({
                uri: configService.get('MONGO_URI'),
            }),
            inject: [ConfigService],
        }),
        ConfigModule.forRoot(),
        DiscordModule.forRootAsync({
            imports: [ConfigModule],
            useFactory: (configService: ConfigService) => ({
                token: configService.get('QUOTER_TOKEN'),
                discordClientOptions: {
                    intents: [
                        GatewayIntentBits.Guilds,
                        GatewayIntentBits.GuildMessages,
                        GatewayIntentBits.MessageContent,
                    ],
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
        MongooseModule.forFeature([{ name: Quote.name, schema: QuoteSchema }]),
    ],
    providers: [],
})
export class QuoterModule {}
