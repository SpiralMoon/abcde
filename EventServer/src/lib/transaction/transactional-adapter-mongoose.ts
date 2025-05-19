import { TransactionalAdapter } from '@nestjs-cls/transactional';
import { ClientSession, Connection } from 'mongoose';
import { ClsServiceManager } from 'nestjs-cls';
import { TRANSACTION_CONTEXT_KEY } from './transaction.constants';

type MongooseTransactionOptions = Parameters<Connection['transaction']>[1];

export interface MongoDBTransactionalAdapterOptions {
  mongooseConnectionToken: any;
  defaultTxOptions?: Partial<MongooseTransactionOptions>;
}

export class TransactionalAdapterMongoose
  implements
    TransactionalAdapter<
      Connection,
      ClientSession | null,
      MongooseTransactionOptions
    >
{
  connectionToken: any;
  defaultTxOptions?: Partial<MongooseTransactionOptions>;

  constructor(options: MongoDBTransactionalAdapterOptions) {
    this.connectionToken = options.mongooseConnectionToken;
    this.defaultTxOptions = options.defaultTxOptions;
  }

  supportsTransactionProxy = false;

  optionsFactory(connection: Connection) {
    return {
      wrapWithTransaction: async (
        options: MongooseTransactionOptions,
        fn: (...args: any[]) => Promise<any>,
        setTx: (tx?: ClientSession) => void,
      ) => {
        const cls = ClsServiceManager.getClsService();
        return cls.run(() => {
          return connection.transaction((session) => {
            setTx(session);
            cls.set(TRANSACTION_CONTEXT_KEY, session);
            return fn();
          }, options);
        });
      },
      getFallbackInstance: () => null,
    };
  }
}
