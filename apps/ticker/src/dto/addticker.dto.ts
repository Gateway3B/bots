import { Param, ParamType } from '@discord-nestjs/core';

export class AddTickerDto {
    @Param({
        name: 'ticker',
        description: 'Ticker to search for.',
        type: ParamType.STRING,
        required: true,
    })
    ticker: string;
}
