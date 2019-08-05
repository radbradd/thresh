import { buildRoute, validateRoute } from './utils';
import { RouteTypes, ErrorTypes } from './enum';
import { Route } from './types';

export function Middleware(route: Route) {
  if (!validateRoute(route)) {
    throw Error(ErrorTypes.MiddlewarePath);
  }
  return function(target: any, method: string) {
    const metadata = Reflect.getMetadata('design:paramtypes', target, method);
    if (metadata.length !== 0 && metadata.length !== 3) {
      throw Error(ErrorTypes.MiddlewareArgs);
    }
    const inner = !metadata.length;
    return buildRoute(target, method, route, RouteTypes.Middleware, inner);
  };
}
