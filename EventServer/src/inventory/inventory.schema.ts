import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

@Schema({ _id: false })
export class InventoryItem {
  @Prop({ type: Number, required: true, unique: true })
  code: number;

  @Prop({ type: Number, required: true })
  quantity: number;
}

@Schema({ timestamps: true })
export class InventoryEntity {
  @Prop({ type: String, required: true, unique: true })
  user: string;

  @Prop({ type: [InventoryItem], required: true, default: [] })
  items: InventoryItem[];
}

export type InventoryDocument = HydratedDocument<InventoryEntity>;

export const InventorySchema = SchemaFactory.createForClass(InventoryEntity);
