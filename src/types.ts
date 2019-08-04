import { AwilixContainer } from 'awilix';
import { Request, Response, NextFunction, Application, Router } from 'express';
import {
  ServiceTypes as Service,
  RouteTypes as Route,
  MethodTypes as Method
} from './enum';

// Enums
export type ServiceTypes = Service.Class | Service.Function;
export type RouteTypes = Route.Middleware | Route.Route;
export type MethodTypes = Method.Get | Method.Post;

// Aliases
export type App = Application | Router;
export type Injector = AwilixContainer;

// App/Router
export type Constructor<T> = new (...args: any[]) => T;

export type AppFunction = (
  req: Request,
  res: Response,
  next?: NextFunction
) => any;
export type AppService = Function | [ServiceTypes, any];
export type AppRouter = [string, { new (services: AwilixContainer): any }];

export type AppSettings = {
  routers?: Array<AppRouter>;
  services?: Array<AppService>;
  express?: [number] | [number, (port?: number) => {}];
};

// Route/Middleware
export type AppRoute = {
  fn: AppFunction[];
  type: RouteTypes;
  route: string;
  description: string;
  method: MethodTypes;
};

export type Route = string | RegExp | Array<string | RegExp>;
