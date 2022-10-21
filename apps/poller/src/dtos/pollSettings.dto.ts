import { Choice, Param, ParamType } from '@discord-nestjs/core';
import { Transform } from 'class-transformer';

export class PollSettingsDto {
    @Param({
        name: 'type',
        description: 'Type of poll.',
        type: ParamType.STRING,
        required: false,
    })
    @Choice({
        'Standard: First Past The Post': 'standard',
        'Reverse: Downvote First Past the Post': 'reverse',
        'Ranked: Order Choice Preference': 'ranked',
    })
    type: string;

    @Param({
        name: 'time_limit_hours',
        description: '0-24',
        type: ParamType.INTEGER,
        required: false,
    })
    @Transform(({ value }) => (value > 24 ? 24 : value < 0 ? 0 : value))
    time_limit_hours: number;

    @Param({
        name: 'time_limit_minutes',
        description: '0-59',
        type: ParamType.INTEGER,
        required: false,
    })
    @Transform(({ value }) => (value > 59 ? 59 : value < 0 ? 0 : value))
    time_limit_minutes: number;

    @Param({
        name: 'real_time_results',
        description: 'Show results in real time.',
        type: ParamType.BOOLEAN,
        required: false,
    })
    real_time_results: boolean;

    @Param({
        name: 'multiple_votes',
        description: 'Allow votes for multiple options.',
        type: ParamType.BOOLEAN,
        required: false,
    })
    multiple_votes: boolean;

    @Param({
        name: 'role',
        description: 'Limit who can vote to a specific role and higher.',
        type: ParamType.ROLE,
        required: false,
    })
    role: string;
}
