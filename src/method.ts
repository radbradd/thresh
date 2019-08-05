import { MethodTypes, ErrorTypes } from './enum';

export function Method(http: string) {
  if (!Object.values(MethodTypes).includes(http)) {
    throw new Error(ErrorTypes.InvalidHttpMethod);
  }
  return function(target: any, method: string) {
    target[method].method = http;
    return target;
  };
}
