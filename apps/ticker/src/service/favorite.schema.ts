import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type FavoriteDocument = Favorite & Document<any, any, any>;

@Schema()
export class Favorite {
    @Prop()
    guild: string;

    @Prop()
    ticker: string;
}

export const FavoriteSchema = SchemaFactory.createForClass(Favorite);
