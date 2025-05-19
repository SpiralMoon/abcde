import { Test, TestingModule } from '@nestjs/testing';
import { getConnectionToken, MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { UserModule } from '../user/user.module';
import { AuthModule } from './auth.module';
import { UserService } from '../user/user.service';
import { UserRoles } from '../common/roles/roles';
import { ApiException, ErrorCode } from '../common/exceptions';
import { ReqUserCreateForm } from '../user/user.dto';
import * as mongoose from 'mongoose';
import { Connection } from 'mongoose';

describe('AuthService 통합 테스트', () => {
  let module: TestingModule;
  let authService: AuthService;
  let userService: UserService;
  let connection: mongoose.Connection;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          ignoreEnvFile: process.env.NODE_ENV === 'production',
          envFilePath: '.env',
        }),
        MongooseModule.forRootAsync({
          imports: [ConfigModule],
          useFactory: (config: ConfigService) => ({
            uri: config.get('MONGO_URI'),
            dbName: 'test_auth_' + config.get('MONGO_DATABASE_NAME'),
          }),
          inject: [ConfigService],
        }),
        UserModule,
        AuthModule,
      ],
    }).compile();

    authService = module.get(AuthService);
    userService = module.get(UserService);
    connection = module.get<Connection>(getConnectionToken());
  });

  afterAll(async () => {
    await connection.db.dropDatabase();
    await connection.close();
  });

  it('정상적으로 인증을 수행하고 JWT를 반환한다', async () => {
    const form: ReqUserCreateForm = {
      email: 'correct-pw@test.test',
      password: 'pw',
      name: '유저',
      role: UserRoles.USER,
    };

    // 유저 생성
    await userService.createUser(form);

    const token = await authService.authenticate(form.email, form.password);

    console.log(token);

    expect(token).toBeDefined();
    expect(typeof token).toBe('string');
  });

  it('잘못된 비밀번호로 인증 시 예외가 발생한다', async () => {
    const form: ReqUserCreateForm = {
      email: 'incorrect-pw@test.test',
      password: 'pw',
      name: '유저',
      role: UserRoles.USER,
    };

    await userService.createUser(form);

    try {
      await authService.authenticate(form.email, 'incorrect password');
      fail('예외가 발생해야 합니다');
    } catch (err) {
      expect(err).toBeInstanceOf(ApiException);
      expect(err.code).toBe(ErrorCode.UserNotFound);
    }
  });

  it('존재하지 않는 이메일로 인증 시 예외가 발생한다', async () => {
    try {
      await authService.authenticate('notfound@test.test', 'pw');
      fail('예외가 발생해야 합니다');
    } catch (err) {
      expect(err).toBeInstanceOf(ApiException);
      expect(err.code).toBe(ErrorCode.UserNotFound);
    }
  });
});
