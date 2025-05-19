export type ProxyObject<T> = {
  toObject: () => T;
};

/**
 * Proxy 객체를 해제하여 원본 객체를 반환 합니다.
 * example:
 * ```ts
 *  const mongooseDocument: MongooseDocument = something;
 *  const unwrappedObj = unwrap(mongooseDocument);
 *  ```
 * @param proxyObj
 */
export function unwrap<T>(proxyObj: T) {
  return (proxyObj as ProxyObject<T>).toObject();
}
