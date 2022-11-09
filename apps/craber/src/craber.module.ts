import { DiscordModule } from '@discord-nestjs/core';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { GatewayIntentBits } from 'discord.js';
import { CrabCommand } from './commands/crab.command';
import { CrabCascadeCommand } from './commands/crabCascade.command';
import { Crab, CrabSchema } from './service/crab.schema';
import { CrabService } from './service/crab.service';

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
                token: configService.get('CRABER_TOKEN'),
                discordClientOptions: {
                    intents: [GatewayIntentBits.Guilds],
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
        MongooseModule.forFeature([{ name: Crab.name, schema: CrabSchema }]),
    ],
    providers: [CrabCommand, CrabCascadeCommand, CrabService],
})
export class CraberModule {}
