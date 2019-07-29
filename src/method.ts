export function Method(http: string) {
  return function(target: any, method: string) {
    target[method].method = http;
    return target;
  };
}
