import { Application as ExpressApplication } from 'express';
import { App, AppSettings, Constructor, Injector } from '../types';
import {
  buildApp,
  createRoutes,
  provideRouters,
  getConstructorServices
} from './functions';
import { ExpressService } from '../services/express.service';

const defaultConfig: AppSettings = {
  routers: [],
  services: []
};

/**
 * Lifecycle hook for after Express and Services have
 * been initialized
 */
export interface onInit {
  onInit(): void;
}

/**
 * Lifecycle hook for after Routers, Routes and
 * Middleware have been set up
 */
export interface afterInit {
  afterInit(): void;
}

/**
 * Lifecycle hook for before Express.listen is
 * run
 */
export interface onStart {
  onStart(): void;
}

/**
 * Lifecycle hook for after the Express app has
 * been successfully started
 */
export interface afterStart {
  afterStart(): void;
}

export function startThresh<T>(Base: { new (): T }): T {
  return new Base();
}

export function Thresh(config: AppSettings = defaultConfig) {
  config = Object.assign({}, defaultConfig, config);
  return function _Thresh<T extends Constructor<{}>>(Base: T) {
    return class __Thresh extends Base {
      __app: App;

      constructor(...args: any[]) {
        const service = new ExpressService(args, config.services!, __Thresh);

        // Inject services declared in the constructor
        super(...service.args);
        this.__app = service.app;

        // Fire off that constructor has been set up
        this.__fireEvent('onInit');

        // Add declared routes, middleware and params
        service.routes = { klassInstance: this, Klass: Base };

        // Build Routers
        service.routers = config.routers!;

        // Fire off that App is built
        this.__fireEvent('afterInit');

        // Launch Express
        if (!!config.express) {
          // Fire off that app is starting
          this.__fireEvent('onStart');
          const [port] = config.express;
          service.listen(port).then(() => {
            // Fire off that app has started
            this.__fireEvent('afterStart');
          });
        }
      }

      __fireEvent(event: string) {
        try {
          // @ts-ignore
          super[event]();
        } catch {}
      }
    };
  };
}
