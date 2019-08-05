import { RouteTypes, ErrorTypes, MethodTypes } from './enum';
import { Route, RouteTypes as RTypes } from './types';

export function Route(route: Route) {
  return build(
    route,
    RouteTypes.Route,
    (r: Route) => {
      if (!validateRoute(r)) {
        throw Error(ErrorTypes.RoutePath);
      }
    },
    (m: any[]) => {
      if (!isMiddlewareFunction(m)) {
        throw Error(ErrorTypes.RouteArgs);
      }
    }
  );
}

export function Middleware(route: Route) {
  return build(
    route,
    RouteTypes.Middleware,
    (r: Route) => {
      if (!validateRoute(r)) {
        throw Error(ErrorTypes.MiddlewarePath);
      }
    },
    (m: any[]) => {
      if (!isMiddlewareFunction(m)) {
        throw Error(ErrorTypes.MiddlewareArgs);
      }
    }
  );
}

export function Param(param: string) {
  return function(target: any, method: string) {
    return buildRoute(target, method, param, RouteTypes.Param);
  };
}

type CheckPath = (path: Route) => void;
type CheckArgs = (metadata: any[]) => void;

function build(
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

function validateRoute(route: Route) {
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

function isMiddlewareFunction(metadata: any[]) {
  return metadata.length <= 3;
}

function buildRoute(
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
