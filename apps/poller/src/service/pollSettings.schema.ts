import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type PollSettingsDocument = PollSettings & Document<any, any, any>;

@Schema()
export class PollSettings {
    @Prop()
    guild: string;

    @Prop()
    type: string;

    @Prop()
    time_limit_hours: number;

    @Prop()
    time_limit_minutes: number;

    @Prop()
    real_time_results: boolean;

    @Prop()
    multiple_votes: boolean;

    @Prop()
    role: string;
}

export const PollSettingsSchema = SchemaFactory.createForClass(PollSettings);
