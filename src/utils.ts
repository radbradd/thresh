import { asClass, asFunction } from 'awilix';
import { MethodTypes, ServiceTypes, RouteTypes } from './enum';
import {
  App,
  AppRoute,
  AppRouter,
  AppService,
  Injector,
  RouteTypes as RTypes
} from './types';

export function buildRoute(
  target: any,
  method: string,
  route: string,
  type: RTypes
): any {
  const fn = target[method];
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

export function checkInjector(args: any[]) {
  if (args.length !== 1 || !args[0].cradle) {
    throw Error('Injector not found');
  }
}

export function provideServices(
  container: Injector,
  services: AppService[]
): Injector {
  services.forEach(service => {
    if (!Array.isArray(service)) {
      if (service.prototype.constructor) {
        service = [ServiceTypes.Class, service];
      } else {
        service = [ServiceTypes.Function, service];
      }
    }
    switch (service[0]) {
      case ServiceTypes.Class:
        container.register(service[1].name, asClass(service[1]).singleton());
        break;
      case ServiceTypes.Function:
        container.register(service[1].name, asFunction(service[1]).singleton());
        break;
      default:
        throw Error(`Unable to register ${service[1].name} as a ${service[0]}`);
    }
  });
  return container;
}

export function provideRouters(
  app: App,
  services: Injector,
  routers: Array<AppRouter>
) {
  routers.forEach(routerObj => {
    if (routerObj.length !== 2) {
      throw Error(`Invalid router configuration`);
    }
    const [path, router] = routerObj;
    const r = new router(services);
    app.use(path, r.__app);
  });
}

export function getConstructorServices(Klass: any, container: Injector) {
  const constructor = Klass.prototype.constructor;
  const requested = Reflect.getMetadata('design:paramtypes', constructor) || [];
  return requested.map((klass: any) => container.cradle[klass.name]);
}

export function createRoutes(base: any, app: App, routes: AppRoute[]) {
  routes.sort(sort).forEach(route => createRoute(base, app, route));

  function sort(a: AppRoute, b: AppRoute) {
    if (a.type === b.type) return 0;
    if (a.type === RouteTypes.Middleware) return -1;
    return 1;
  }
}

function createRoute(base: any, app: App, route: AppRoute) {
  if (!isAppRoute(route)) return {};
  route.fn = route.fn.bind(base);
  switch (+route.type) {
    // Middleware
    case RouteTypes.Middleware:
      console.log('middle');
      app.use(route.route, route.fn);
      break;
    // Route
    case RouteTypes.Route:
      console.log('route');
      switch (+route.method) {
        // ALL
        case MethodTypes.All:
          app.all(route.route, route.fn);
          break;
        // POST
        case MethodTypes.Post:
          app.post(route.route, route.fn);
          break;
        // GET
        case MethodTypes.Get:
        default:
          app.get(route.route, route.fn);
      }
  }

  function isAppRoute(route: AppRoute) {
    return route.type && route.method && route.route && route.fn;
  }
}
