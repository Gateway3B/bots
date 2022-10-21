import { DiscordModule } from '@discord-nestjs/core';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { GatewayIntentBits } from 'discord.js';
import { PollCommand } from './commands/poll.command';
import { PollSettingsCommand } from './commands/pollSettings.command';
import {
    PollSettings,
    PollSettingsSchema,
} from './service/pollSettings.schema';

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
                token: configService.get('POLLER_TOKEN'),
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
            { name: PollSettings.name, schema: PollSettingsSchema },
        ]),
    ],
    providers: [PollCommand, PollSettingsCommand],
})
export class PollerModule {}
