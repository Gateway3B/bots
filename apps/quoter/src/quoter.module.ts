import { DiscordModule } from '@discord-nestjs/core';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { GatewayIntentBits } from 'discord.js';
import { Quote, QuoteSchema } from './service/quote.schema';
import { AddQuoteCommand } from './commands/addQuote.command';
import { RandomQuoteCommand } from './commands/randomQuote.command';
import { ShowQuotesCommand } from './commands/showQuotes.command';
import { AddQuoteContextMenuCommand } from './commands/addQuoteContextMenu.command';
import { ShowQuotesContextMenuCommand } from './commands/showQuotesContextMenu.command';

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
                // registerCommandOptions: [
                //     {
                //         forGuild: configService.get('TEST_GUILD'),
                //         removeCommandsBefore: true,
                //     },
                // ],
            }),
            inject: [ConfigService],
        }),
        MongooseModule.forFeature([{ name: Quote.name, schema: QuoteSchema }]),
    ],
    providers: [
        AddQuoteCommand,
        AddQuoteContextMenuCommand,
        RandomQuoteCommand,
        ShowQuotesCommand,
        ShowQuotesContextMenuCommand,
    ],
})
export class QuoterModule {}
