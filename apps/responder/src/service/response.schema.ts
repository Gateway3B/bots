import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ResponseDocument = Response & Document<any, any, any>;

@Schema()
export class Response {
    @Prop()
    guild: string;

    @Prop()
    trigger: string;

    @Prop()
    response: string;

    @Prop()
    ignoreCase: boolean;

    @Prop()
    messageListen: boolean;

    @Prop()
    userListen: string;

    @Prop()
    roleListen: string;

    @Prop()
    channelListen: string;

    @Prop()
    channelRespond: string;

    @Prop()
    userCreate: string;
}

export const ResponseSchema = SchemaFactory.createForClass(Response);
