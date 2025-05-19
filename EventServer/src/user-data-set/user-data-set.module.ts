import { Module } from '@nestjs/common';
import { UserDataSetController } from './user-data-set.controller';
import { UserDataSetService } from './user-data-set.service';
import { MongooseModule } from '@nestjs/mongoose';
import { UserDataSetEntity, UserDataSetSchema } from './user-data-set.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: UserDataSetEntity.name,
        schema: UserDataSetSchema,
      },
    ]),
  ],
  controllers: [UserDataSetController],
  providers: [UserDataSetService],
  exports: [UserDataSetService],
})
export class UserDataSetModule {}
