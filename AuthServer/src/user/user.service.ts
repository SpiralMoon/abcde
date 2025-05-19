import { Injectable } from '@nestjs/common';
import { ReqUserCreateForm } from './user.dto';
import { UserDocument, UserEntity } from './user.schema';
import * as bcrypt from 'bcrypt';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { ApiException, ErrorCode } from '../common/exceptions';
import { UserRoles } from '../common/roles/roles';

/**
 * 계정 정보를 관리하는 서비스 입니다.
 */
@Injectable()
export class UserService {
  constructor(
    @InjectModel(UserEntity.name)
    private readonly userModel: Model<UserDocument>,
  ) {}

  /**
   * 계정을 생성 합니다.
   * @param form 계정 생성 폼
   */
  async createUser(form: ReqUserCreateForm): Promise<UserEntity> {
    const { password } = form;

    const hashedPassword = await bcrypt.hash(password, 10);

    try {
      const user = new this.userModel({
        ...form,
        password: hashedPassword,
      });

      return await user.save();
    } catch (e) {
      if (
        e.name === 'MongoServerError' &&
        e.message.startsWith('E11000 duplicate key error collection')
      ) {
        throw new ApiException(
          ErrorCode.UserAlreadyExist,
          'User already exists.',
        );
      }

      throw e;
    }
  }

  /**
   * 계정을 조회 합니다.
   * @param id 계정 식별자
   */
  async getUser(id: string): Promise<UserEntity> {
    const user = await this.userModel.findOne({ id: id });

    if (!user) {
      throw new ApiException(ErrorCode.UserNotFound, 'User not found.');
    }

    return user;
  }

  /**
   * 계정을 조회 합니다.
   * @param email 계정 이메일
   */
  async getUserByEmail(email: string): Promise<UserEntity> {
    const user = await this.userModel.findOne({ email: email });

    if (!user) {
      throw new ApiException(ErrorCode.UserNotFound, 'User not found.');
    }

    return user;
  }

  /**
   * 계정의 권한을 변경 합니다.
   * @param id  계정 식별자
   * @param role 계정 권한
   */
  async updateUserRole(id: string, role: UserRoles): Promise<UserEntity> {
    const user = await this.userModel.findOneAndUpdate(
      { id: id },
      { role: role },
      { new: true },
    );

    if (!user) {
      throw new ApiException(ErrorCode.UserNotFound, 'User not found.');
    }

    return user;
  }
}
