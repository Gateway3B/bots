import { Param, ParamType } from '@discord-nestjs/core';

export class ShowQuoteDto {
    @Param({
        name: 'user',
        description: 'User to show quotes from.',
        type: ParamType.USER,
        required: true,
    })
    user: string;
}
