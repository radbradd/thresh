import { createContainer, asClass } from 'awilix';
import { RouteTypes, ErrorTypes } from '../enum';
import { App, AppRoute, AppRouter, AppService, Injector } from '../types';

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

function provideServices(
  container: Injector,
  services: AppService[]
): Injector {
  services.forEach(service => {
    if (!isClass(service)) {
      throw Error(ErrorTypes.MustBeClass);
    }
    container.register(service.name, asClass(service).scoped());
  });
  return container;

  function isClass(func: any) {
    return (
      typeof func === 'function' &&
      /^class\s/.test(Function.prototype.toString.call(func))
    );
  }
}

export function provideRouters(
  app: App,
  services: Injector,
  routers: Array<AppRouter>
) {
  routers.forEach(routerObj => {
    if (routerObj.length !== 2 || typeof routerObj[0] !== 'string') {
      throw Error(ErrorTypes.RouterConfig);
    }
    const [path, router] = routerObj;
    const r = new router(services);
    app.use(path, r.__app);
  });
}

export function getConstructorServices(Klass: any, container: Injector) {
  const constructor = Klass.prototype.constructor;
  const requested = Reflect.getMetadata('design:paramtypes', constructor) || [];
  return requested.map((klass: any) => {
    try {
      return container.cradle[klass.name];
      // Consider throwing own error here
    } catch (AwilixResolutionError) {
      return undefined;
    }
  });
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
    .filter(m => m.name !== 'constructor')
    .sort((a, b) => {
      if (a.i === b.i) return 0;
      return (b.i === -1 ? -1 : 1) * order.length;
    })
    .map(q => {
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
