import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type QuoteDocument = Quote & Document<any, any, any>;

@Schema()
export class Quote {
    @Prop()
    user: string;

    @Prop()
    guildId: string;

    @Prop()
    quote: string;

    @Prop()
    year: number;

    @Prop()
    month: number;

    @Prop()
    day: number;
}

export const QuoteSchema = SchemaFactory.createForClass(Quote);
