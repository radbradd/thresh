import { buildRoute } from './utils';
import { RouteTypes } from './enum';

export function Route(route: string) {
  return function(target: any, method: string) {
    return buildRoute(target, method, route, RouteTypes.Route);
  };
}
