import { Test, TestingModule } from '@nestjs/testing';
import { getConnectionToken, MongooseModule } from '@nestjs/mongoose';
import { UserService } from './user.service';
import * as mongoose from 'mongoose';
import { ReqUserCreateForm } from './user.dto';
import { UserRoles } from '../common/roles/roles';
import { ApiException, ErrorCode } from '../common/exceptions';
import { UserModule } from './user.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Connection } from 'mongoose';

describe('UserService 통합 테스트', () => {
  let module: TestingModule;
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
            dbName: 'test_user_' + config.get('MONGO_DATABASE_NAME'),
          }),
          inject: [ConfigService],
        }),
        UserModule,
      ],
    }).compile();

    userService = module.get(UserService);
    connection = module.get<Connection>(getConnectionToken());
  });

  afterAll(async () => {
    await connection.db.dropDatabase();
    await connection.close();
  });

  it('유저를 성공적으로 생성한다', async () => {
    const form: ReqUserCreateForm = {
      email: 'test@test.test',
      password: 'pw',
      name: '유저',
      role: UserRoles.USER,
    };

    const user = await userService.createUser(form);

    expect(user).toBeDefined();
    expect(user.email).toBe(form.email);
    expect(user.name).toBe(form.name);
    expect(user.role).toBe(form.role);
    expect(user.password).not.toBe(form.password);
  });

  it('중복 이메일로 유저 생성 시 예외가 발생한다', async () => {
    const form: ReqUserCreateForm = {
      email: 'duplicate@test.test',
      password: 'pw',
      name: '중복 유저',
      role: UserRoles.USER,
    };

    try {
      await userService.createUser(form);
      await userService.createUser(form); // 중복 생성 시도

      fail('예외가 발생해야 합니다');
    } catch (err) {
      expect(err).toBeInstanceOf(ApiException);
      expect(err.code).toBe(ErrorCode.UserAlreadyExist);
    }
  });

  it('식별자로 유저를 조회한다', async () => {
    const form: ReqUserCreateForm = {
      email: 'id-find@test.test',
      password: 'pw',
      name: '유저',
      role: UserRoles.USER,
    };

    const created = await userService.createUser(form);
    const found = await userService.getUser(created.id);

    expect(found.email).toBe(form.email);
  });

  it('이메일로 유저를 조회한다', async () => {
    const form: ReqUserCreateForm = {
      email: 'email-find@test.test',
      password: 'pw',
      name: '유저',
      role: UserRoles.USER,
    };

    const created = await userService.createUser(form);
    const found = await userService.getUserByEmail(created.email);

    expect(found.name).toBe(form.name);
  });

  it('존재하지 않는 유저 조회 시 예외가 발생한다', async () => {
    const invalidId = 'this is not exist user id';

    try {
      await userService.getUser(invalidId);

      fail('예외가 발생해야 합니다');
    } catch (err) {
      expect(err).toBeInstanceOf(ApiException);
      expect(err.code).toBe(ErrorCode.UserNotFound);
    }
  });

  it('유저 권한을 변경한다', async () => {
    const form: ReqUserCreateForm = {
      email: 'role-change@test.test',
      password: 'pw',
      name: '유저',
      role: UserRoles.ADMIN,
    };

    const created = await userService.createUser(form);
    const updated = await userService.updateUserRole(
      created.id,
      UserRoles.AUDITOR,
    );

    expect(updated.role).toBe(UserRoles.AUDITOR);
  });
});
