import {
    Channel as ChannelParam,
    Param,
    ParamType,
} from '@discord-nestjs/core';
import { Channel, ChannelType, Role, User } from 'discord.js';

export class AddRespDto {
    @Param({
        name: 'trigger',
        description: 'Text responder should respond to.',
        type: ParamType.STRING,
        required: true,
    })
    trigger: string;

    @Param({
        name: 'response',
        description: 'Text responder should respond with.',
        type: ParamType.STRING,
        required: true,
    })
    response: string;

    @Param({
        name: 'ignore_case',
        description: 'Ignore capitalizations in trigger.',
        type: ParamType.BOOLEAN,
        required: false,
    })
    ignoreCase: boolean;

    @Param({
        name: 'message_listen',
        description: 'Listen for trigger in whole message.',
        type: ParamType.BOOLEAN,
        required: false,
    })
    messageListen: boolean;

    @Param({
        name: 'user_listen',
        description:
            'User responder should listen to say the triggetr. Defaults to all users.',
        type: ParamType.ROLE,
        required: false,
    })
    userListen: User;

    @Param({
        name: 'role_listen',
        description:
            'Role responder should listen to say the trigger. Defaults to all roles.',
        type: ParamType.ROLE,
        required: false,
    })
    roleListen: Role;

    @Param({
        name: 'channel_listen',
        description:
            'Channel responder should listen for the trigger in. Defaults to all channels.',
        required: false,
    })
    @ChannelParam([ChannelType.GuildText])
    channelListen: Channel;

    @Param({
        name: 'channel_respond',
        description:
            'Channel responder should respond in. Defaults to channel trigger was posted.',
        required: false,
    })
    @ChannelParam([ChannelType.GuildText])
    channelRespond: Channel;
}
