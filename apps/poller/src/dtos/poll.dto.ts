import { Param, ParamType } from '@discord-nestjs/core';

export class PollDto {
    @Param({
        name: 'title',
        description: 'Title of the poll/Question being asked.',
        type: ParamType.STRING,
        required: true,
    })
    title: string;

    @Param({
        name: 'option_1',
        description: 'First Option',
        type: ParamType.STRING,
        required: true,
    })
    option_1: string;

    @Param({
        name: 'option_2',
        description: 'Second Option',
        type: ParamType.STRING,
        required: true,
    })
    option_2: string;

    @Param({
        name: 'option_3',
        description: 'Third Option',
        type: ParamType.STRING,
        required: false,
    })
    option_3: string;

    @Param({
        name: 'option_4',
        description: 'Fourth Option',
        type: ParamType.STRING,
        required: false,
    })
    option_4: string;

    @Param({
        name: 'option_5',
        description: 'Fifth Option',
        type: ParamType.STRING,
        required: false,
    })
    option_5: string;

    @Param({
        name: 'option_6',
        description: 'Six Option',
        type: ParamType.STRING,
        required: false,
    })
    option_6: string;

    @Param({
        name: 'option_7',
        description: 'Seventh Option',
        type: ParamType.STRING,
        required: false,
    })
    option_7: string;

    @Param({
        name: 'option_8',
        description: 'Eighth Option',
        type: ParamType.STRING,
        required: false,
    })
    option_8: string;

    @Param({
        name: 'option_9',
        description: 'Nineth Option',
        type: ParamType.STRING,
        required: false,
    })
    option_9: string;

    @Param({
        name: 'option_10',
        description: 'Tenth Option',
        type: ParamType.STRING,
        required: false,
    })
    option_10: string;
}
