import { createContainer, asClass, asFunction } from 'awilix';
import { MethodTypes, ServiceTypes, RouteTypes } from './enum';
import {
  App,
  AppRoute,
  AppRouter,
  AppService,
  Injector,
  RouteTypes as RTypes,
  Route
} from './types';

export function buildApp(
  args: any[],
  services: AppService[]
): { app: App; services: Injector } {
  let app, container;
  if (args.length === 0) {
    app = require('express')();
    container = createContainer();
  }
  // Router Application
  else {
    app = require('express').Router();
    container = createContainer({}, args[0]);
  }
  return { app, services: provideServices(container, services) };
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

export function checkInjector(args: any[]) {
  if (args.length !== 1 || !args[0].cradle) {
    throw Error('Injector not found');
  }
}

function provideServices(
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

export function createRoutes(
  base: any,
  app: App,
  Base: { new (...args: any[]): any }
) {
  type OrderBase = { new (...args: any[]): any } & { $order: string[] };
  const order = (Base as OrderBase).$order || [];
  Object.getOwnPropertyNames(Base.prototype)
    .map(m => ({ name: m, i: order.indexOf(m) }))
    .sort((a, b) => {
      if (a.i === b.i) return 0;
      return (b.i === -1 ? -1 : 1) * order.length;
    })
    .map(q => {
      console.log(q.name);
      return Base.prototype[q.name];
    })
    .forEach(route => createRoute(base, app, route));
}

function createRoute(base: any, app: App, route: AppRoute) {
  if (!isAppRoute(route)) return {};
  route.fn = route.fn.map(fn => fn.bind(base));
  switch (+route.type) {
    // Middleware
    case RouteTypes.Middleware:
      app.use(route.route, route.fn);
      break;
    // Route
    case RouteTypes.Route:
      app[route.method](route.route, route.fn);
      break;
    // Param
    case RouteTypes.Param:
      app.param(route.route, route.fn[0]);
      break;
  }

  function isAppRoute(route: AppRoute) {
    return route.type && route.method && route.route && route.fn;
  }
}
