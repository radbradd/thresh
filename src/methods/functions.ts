import { MethodTypes } from '../enum';
import { Route, RouteTypes as RTypes } from '../types';

type CheckPath = (path: Route) => void;
type CheckArgs = (metadata: any[]) => void;

export function build(
  route: Route,
  type: RTypes,
  checkPath: CheckPath,
  checkArgs: CheckArgs
) {
  checkPath(route);
  return function(target: any, method: string) {
    const metadata = Reflect.getMetadata('design:paramtypes', target, method);
    checkArgs(metadata);
    return buildRoute(target, method, route, type, !metadata.length);
  };
}

export function validateRoute(route: Route) {
  if (strOrRegExp(route)) return true;
  if (!Array.isArray(route)) return false;
  return route.reduce((p, c) => {
    if (!p) return false;
    return strOrRegExp(c);
  }, true);
}

function strOrRegExp(v: any) {
  if (typeof v === 'string') return true;
  if (v.constructor === RegExp) return true;
  return false;
}

export function isMiddlewareFunction(metadata: any[]) {
  return metadata.length <= 3;
}

export function buildRoute(
  target: any,
  method: string,
  route: Route,
  type: RTypes,
  inner: boolean = false
): any {
  let fn = target[method];
  if (inner) fn = fn();
  if (!Array.isArray(fn)) fn = [fn];
  target[method] = Object.assign(
    {
      fn: fn,
      type: type,
      route: route,
      description: '',
      method: MethodTypes.Get
    },
    fn
  );
  return target;
}
