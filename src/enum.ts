export enum RouteTypes {
  Route = 1,
  Middleware,
  Param
}

export enum MethodTypes {
  Checkout = 'checkout',
  Copy = 'copy',
  Delete = 'delete',
  Get = 'get',
  Head = 'head',
  Lock = 'lock',
  Merge = 'merge',
  Mkactivity = 'mkactivity',
  Mkcol = 'mkcol',
  Move = 'move',
  MSearch = 'm-search',
  Notify = 'notify',
  Options = 'options',
  Patch = 'patch',
  Post = 'post',
  Purge = 'purge',
  Put = 'put',
  Report = 'report',
  Search = 'search',
  Subscribe = 'subscribe',
  Trace = 'trace',
  Unlock = 'unlock',
  Unsubscribe = 'unsubscribe',
  All = 'all'
}

export enum ErrorTypes {
  InvalidHttpMethod = '@Method was provided an invalid method',
  MiddlewarePath = '@Middleware requires a single argument of type: string | RegExp | Array<string|RegExp>',
  MiddlewareArgs = '@Middleware method should either be a middleware function or return an array of middleware functions',
  RoutePath = '@Route requires a single argument of type: string | RegExp | Array<string|RegExp>',
  RouteArgs = '@Route method should either be a route function or return an array of route/middleware functions',
  MustBeClass = '@Thresh.services must be ES6 classes defined as `class Foo {}`',
  RouterConfig = '@Thresh.routers must be of type Array<[string, @Thresh]>'
}
