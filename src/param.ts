import { buildRoute } from './utils';
import { RouteTypes } from './enum';

export function Param(param: string) {
  return function(target: any, method: string) {
    return buildRoute(target, method, param, RouteTypes.Param, false);
  };
}
