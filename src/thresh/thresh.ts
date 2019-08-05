import { Application as ExpressApplication } from 'express';
import { App, AppSettings, Constructor, Injector } from '../types';
import {
  buildApp,
  createRoutes,
  provideRouters,
  getConstructorServices
} from './functions';

const defaultConfig: AppSettings = {
  routers: [],
  services: []
};

/**
 * Lifecycle hook for after Express and Services have
 * been initialized
 */
export interface onInit {
  onInit(app: App, services: Injector): void;
}

/**
 * Lifecycle hook for after Routers, Routes and
 * Middleware have been set up
 */
export interface afterInit {
  afterInit(app: App, services: Injector): void;
}

/**
 * Lifecycle hook for before Express.listen is
 * run
 */
export interface onStart {
  onStart(app: App, services: Injector): void;
}

/**
 * Lifecycle hook for after the Express app has
 * been successfully started
 */
export interface afterStart {
  afterStart(app: App, services: Injector): void;
}

export function Thresh(config: AppSettings = defaultConfig) {
  config = Object.assign({}, defaultConfig, config);
  return function _Thresh<T extends Constructor<{}>>(Base: T) {
    return class __Thresh extends Base {
      __app: App;
      __services: Injector;

      constructor(...args: any[]) {
        const { app, services } = buildApp(args, config.services!);

        // Inject services declared in the constructor
        super(...getConstructorServices(__Thresh, services));
        this.__app = app;
        this.__services = services;

        // Fire off that constructor has been set up
        this.__fireEvent('onInit', app, services);

        // Add declared routes and middleware
        createRoutes(this, app, Base);

        // Build Routers
        provideRouters(app, services, config.routers!);

        // Fire off that App is built
        this.__fireEvent('afterInit', app, services);

        // Launch Express
        if (config.express) {
          // Fire off that app is starting
          this.__fireEvent('onStart', app, services);
          const [port, cb] = config.express;
          (app as ExpressApplication).listen(port, () => {
            // Fire off that app has started
            this.__fireEvent('afterStart', app, services);
          });
        }
      }

      __fireEvent(event: string, app: App, services: Injector) {
        try {
          // @ts-ignore
          super[event](app, services);
        } catch {}
      }
    };
  };
}
