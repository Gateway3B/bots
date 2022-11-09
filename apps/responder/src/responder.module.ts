import { DiscordModule } from '@discord-nestjs/core';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { GatewayIntentBits } from 'discord.js';
import { AddRespCommand } from './commands/addresp.command';
import { DelRespsCommand } from './commands/delresps.command';
import { ShowRespCommand } from './commands/showresp.command';
import { RespondGateway } from './respond.gateway';
import { Response, ResponseSchema } from './service/response.schema';

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
                token: configService.get('RESPONDER_TOKEN'),
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
        MongooseModule.forFeature([
            { name: Response.name, schema: ResponseSchema },
        ]),
    ],
    providers: [
        AddRespCommand,
        DelRespsCommand,
        ShowRespCommand,
        RespondGateway,
    ],
})
export class ResponderModule {}
