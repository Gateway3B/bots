import { Param, ParamType } from '@discord-nestjs/core';

export class RandomQuoteDto {
    @Param({
        name: 'User',
        description: 'User to show a random quote from.',
        type: ParamType.USER,
        required: true,
    })
    user: string;
}
