import { RouteTypes, ErrorTypes } from '../enum';
import { Route } from '../types';
import {
  build,
  validateRoute,
  isMiddlewareFunction,
  buildRoute
} from './functions';

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
