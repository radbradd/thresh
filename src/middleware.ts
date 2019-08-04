import { buildRoute } from './utils';
import { RouteTypes } from './enum';
import { Route } from './types';

export function Middleware(route: Route) {
  return function(target: any, method: string) {
    const metadata = Reflect.getMetadata('design:paramtypes', target, method);
    const inner = !metadata.length;
    return buildRoute(target, method, route, RouteTypes.Middleware, inner);
  };
}
