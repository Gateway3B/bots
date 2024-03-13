import { Field, Param, ParamType } from '@discord-nestjs/core';
import { TextInputModalData } from 'discord.js';

export class AddQuoteDto {
    @Param({
        name: 'user',
        description: 'User who gave the quote.',
        type: ParamType.USER,
        required: true,
    })
    user: string;

    @Param({
        name: 'year',
        description: 'Year of the quote.',
        type: ParamType.NUMBER,
        minValue: 1950,
        maxValue: 3000,
        required: false,
    })
    year: number;

    @Param({
        name: 'month',
        description: 'Month of the quote.',
        type: ParamType.NUMBER,
        minValue: 1,
        maxValue: 12,
        required: false,
    })
    month: number;

    @Param({
        name: 'day',
        description: 'Day of the quote.',
        type: ParamType.NUMBER,
        minValue: 1,
        maxValue: 31,
        required: false,
    })
    day: number;
}

export class AddQuoteModalDto {
    @Field('quote')
    quote: TextInputModalData;
}
