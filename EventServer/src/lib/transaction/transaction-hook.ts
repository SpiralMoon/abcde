import { ClsServiceManager } from 'nestjs-cls';
import { ClientSession, Schema } from 'mongoose';
import { TRANSACTION_CONTEXT_KEY } from './transaction.constants';

/**
 * 현재 async context 에서 mongoose session 을 가져 옵니다.
 */
const getSession = () =>
  ClsServiceManager.getClsService().get<ClientSession>(TRANSACTION_CONTEXT_KEY);

/**
 * mongoose schema 에 transaction 을 적용하기 위한 pre hook을 등록 합니다.
 * 현재 context 에서 mongoose session이 열려있으면 DB 명령을 session에 포함 시킵니다.
 * @param schema
 */
export function GlobalClsTransactionPlugin(schema: Schema) {
  schema.pre(
    [
      'find',
      'findOne',
      'findOneAndUpdate',
      'findOneAndReplace',
      'findOneAndDelete',
    ],
    function (next) {
      const session = getSession();
      if (session) {
        this.session(session);
      }
      next();
    },
  );

  schema.pre(
    ['updateOne', 'updateMany', 'deleteOne', 'deleteMany'],
    function (next) {
      const session = getSession();
      if (session) {
        this.session(session);
      }
      next();
    },
  );

  schema.pre('save', function (next) {
    const session = getSession();
    if (session) {
      this.$session(session);
    }
    next();
  });

  schema.pre('insertMany', function (next, docs) {
    const session = getSession();
    if (session) {
      for (const doc of docs) {
        doc.$session?.(session);
      }
    }
    next();
  });
}
