import { Param, ParamType } from '@discord-nestjs/core';

export class DelRespsDto {
    @Param({
        name: 'trigger',
        description: 'Trigger to delete',
        type: ParamType.STRING,
        required: true,
    })
    trigger: string;

    @Param({
        name: 'response',
        description: 'Response to delete.',
        type: ParamType.STRING,
        required: false,
    })
    response: string;
}
