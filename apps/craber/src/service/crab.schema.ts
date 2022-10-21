import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type CrabDocument = Crab & Document<any, any, any>;

@Schema()
export class Crab {
    @Prop()
    name: string;

    @Prop()
    imageURL: string;
}

export const CrabSchema = SchemaFactory.createForClass(Crab);
