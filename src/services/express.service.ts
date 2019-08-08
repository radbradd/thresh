import { Application } from 'express';
import { App, AppRouter, Injector, AppService, AppRoute } from '../types';
import { createContainer, asClass, asFunction } from 'awilix';
import { isClass } from '../utils';
import { ErrorTypes, RouteTypes } from '../enum';

type OrderBase = { new (...args: any[]): any } & { $order: string[] };

export class ExpressService {
  readonly app: App;
  readonly args: any[];
  readonly isApp: boolean;
  readonly injector: Injector;

  private server: any;
  private _routers: any[] = [];
  private _routes: any[] = [];
  private _listening: boolean = false;

  constructor(args: any[], services: AppService[], Klass: any) {
    // If no injector in args, create root component
    if (args.length === 0) {
      this.isApp = true;
      this.app = require('express')();
      this.injector = createContainer();
    }
    // Else create a nested router
    else {
      this.isApp = false;
      this.app = require('express').Router();
      this.injector = createContainer({}, args[0]);
    }

    // Add this service to injector
    this.injector.register('ExpressService', asFunction(() => this).scoped());

    // If this is the root app create a RootService
    if (this.isApp) {
      this.injector.register('RootService', asFunction(() => this).singleton());
    }

    // Add services declared in @Thresh({services})
    services.forEach((service: AppService) => {
      if (!isClass(service)) {
        throw Error(ErrorTypes.MustBeClass);
      }
      this.injector.register(service.name, asClass(service).scoped());
    });

    // Create the neccessary constructor args for the @Thresh() class Foo {}
    const c = Klass.prototype.constructor;
    const m = Reflect.getMetadata('design:paramtypes', c) || [];
    this.args = m.map((klass: any) => {
      if (klass.name === 'RootService') {
        return this.injector.cradle.RootService;
      }
      try {
        return this.injector.cradle[klass.name];
      } catch {
        return undefined;
      }
    });
  }

  set routers(routerPairs: AppRouter[]) {
    if (this._routers.length) return;
    routerPairs.forEach(routerPair => {
      if (!isRouterValid(routerPair)) {
        throw Error(ErrorTypes.RouterConfig);
      }
      const [path, router] = routerPair;
      const r = new router(this.injector);
      this.app.use(path, r.__app);
      this._routers.push(r);
    });

    function isRouterValid(router: AppRouter) {
      // Must be of type ['string', @Thresh() class Router{}]
      if (router.length !== 2) return false;
      if (typeof router[0] !== 'string') return false;
      if (!isClass(router[1])) return false;
      return true;
    }
  }

  get routers() {
    return this._routers;
  }

  set routes(routes: {
    klassInstance: any;
    Klass: { new (...args: any[]): any };
  }) {
    if (this._routes.length) return;
    const order = (routes.Klass as OrderBase).$order || [];
    Object.getOwnPropertyNames(routes.Klass.prototype)
      .map(m => ({ name: m, i: order.indexOf(m) }))
      .filter(m => m.name !== 'constructor')
      .sort((a, b) => {
        if (a.i === b.i) return 0;
        return (b.i === -1 ? -1 : 1) * order.length;
      })
      .map(q => {
        return routes.Klass.prototype[q.name];
      })
      .forEach(route => {
        this._routes.push(route);
        createRoute(routes.klassInstance, this.app, route);
      });

    function createRoute(base: any, app: App, route: AppRoute) {
      if (!isAppRoute(route)) return;
      route.fn = route.fn.map((fn: Function) => fn.bind(base));
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
  }

  listen(port: number) {
    return new Promise((resolve, reject) => {
      if (!this.isApp || this._listening) {
        return reject();
      }
      this.server = (this.app as Application).listen(port, () => {
        this._listening = true;
        resolve(port);
      });
    });
  }

  close() {
    return new Promise((resolve, reject) => {
      if (!this.isApp || !this._listening) reject();
      this.server.close(() => {
        this.server = null;
        this._listening = false;
        resolve();
      });
    });
  }
}

export class RootService extends ExpressService {}
