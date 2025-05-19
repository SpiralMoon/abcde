import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { DtoWrappingInterceptor } from './interceptor';
import { ApiFilter } from './filter';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      ignoreEnvFile: process.env.NODE_ENV === 'production',
      envFilePath: '.env',
    }),
    AuthModule,
    UserModule,
    MongooseModule.forRoot(process.env.MONGO_URI, {
      dbName: process.env.MONGO_DATABASE_NAME,
    }),
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_INTERCEPTOR,
      useClass: DtoWrappingInterceptor,
    },
    {
      provide: APP_FILTER,
      useClass: ApiFilter,
    },
  ],
})
export class AppModule {}
