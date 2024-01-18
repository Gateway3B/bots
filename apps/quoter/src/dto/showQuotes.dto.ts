import { Param, ParamType } from '@discord-nestjs/core';

export class ShowQuoteDto {
    @Param({
        name: 'User',
        description: 'User to show quotes from.',
        type: ParamType.USER,
        required: false,
    })
    user: string;
}
