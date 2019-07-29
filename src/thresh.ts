import { createContainer } from 'awilix';
import { Application as ExpressApplication } from 'express';
import { App, AppSettings, Constructor, Injector } from './types';
import {
  createRoutes,
  provideRouters,
  provideServices,
  getConstructorServices
} from './utils';

const defaultConfig: AppSettings = {
  routers: [],
  services: []
};

export function Thresh(config: AppSettings = defaultConfig) {
  config = Object.assign({}, defaultConfig, config);
  return function _Thresh<T extends Constructor<{}>>(Base: T) {
    return class __Thresh extends Base {
      __app: App;
      __services: Injector;

      constructor(...args: any[]) {
        let app: App, container: Injector;
        // Root Application
        if (args.length === 0) {
          app = require('express')();
          container = createContainer();
        }
        // Router Application
        else {
          app = require('express').Router();
          container = createContainer({}, args[0]);
        }

        // Inject services declared in the constructor
        const services = provideServices(container, config.services!);
        super(...getConstructorServices(__Thresh, services));
        this.__app = app;
        this.__services = services;

        // Add declared routes and middleware
        createRoutes(
          this,
          this.__app,
          Object.getOwnPropertyNames(Base.prototype).map(
            method => Base.prototype[method]
          )
        );

        // Build Routers
        provideRouters(this.__app, this.__services, config.routers!);

        // Launch Express
        if (config.express) {
          const [port, cb] = config.express;
          if (this.__app.hasOwnProperty('listen')) {
            const app = this.__app as ExpressApplication;
            app.listen(port, () => {
              if (cb) cb(port);
            });
          }
        }
      }
    };
  };
}
