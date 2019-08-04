import { buildRoute } from './utils';
import { RouteTypes } from './enum';
import { Route } from './types';

export function Route(route: Route) {
  return function(target: any, method: string) {
    const metadata = Reflect.getMetadata('design:paramtypes', target, method);
    const inner = !metadata.length;
    return buildRoute(target, method, route, RouteTypes.Route, inner);
  };
}
