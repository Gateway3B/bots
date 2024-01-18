import { Field, Param, ParamType } from '@discord-nestjs/core';
import { TextInputModalData } from 'discord.js';

export class AddQuoteDto {
    @Param({
        name: 'User',
        description: 'User who gave the quote.',
        type: ParamType.USER,
        required: true,
    })
    user: string;

    @Param({
        name: 'Year',
        description: 'Year of the quote.',
        type: ParamType.NUMBER,
        minValue: 1950,
        maxValue: 3000,
        required: false,
    })
    year: number;

    @Param({
        name: 'Month',
        description: 'Month of the quote.',
        type: ParamType.NUMBER,
        minValue: 1,
        maxValue: 12,
        required: false,
    })
    month: number;

    @Param({
        name: 'Day',
        description: 'Day of the quote.',
        type: ParamType.NUMBER,
        minValue: 1,
        maxValue: 31,
        required: true,
    })
    day: number;
}

export class AddQuoteModalDto {
    @Field('Quote')
    username: TextInputModalData;
}
