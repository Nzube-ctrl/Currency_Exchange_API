import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: { createdAt: false, updatedAt: false } })
export class Country extends Document {
  @Prop({ required: true, unique: true })
  name: string;

  @Prop()
  capital?: string;

  @Prop()
  region?: string;

  @Prop({ required: true })
  population: number;

  @Prop({ type: String })
  currency_code?: string | null;

  @Prop({ type: Number })
  exchange_rate?: number | null;

  @Prop({ type: Number, default: 0 })
  estimated_gdp?: number | null;

  @Prop()
  flag_url?: string;

  @Prop({ default: () => new Date() })
  last_refreshed_at: Date;
}

export const CountrySchema = SchemaFactory.createForClass(Country);


CountrySchema.pre('save', function (next) {
  if (this.name) {
    this.name = this.name.trim().toLowerCase();
  }
  next();
});


CountrySchema.pre('findOneAndUpdate', function (next) {
  const update = this.getUpdate() as any;
  if (update?.$set?.name) {
    update.$set.name = update.$set.name.trim().toLowerCase();
  }
  next();
});


CountrySchema.index({ name: 1 }, { unique: true });