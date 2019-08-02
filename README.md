# Thresh

Decorative implementation of Express with TypeScript and dependency injection

# Table of Contents

- [Installation](#installation)
- [Usage](#usage)
  - [Basic](#usage-basic)
  - [Services](#usage-services)
  - [Routers](#usage-routers)
  - [Router Scope](#usage-router-scope)
  - [Middleware](#usage-middleware)
  - [HTTP Methods](#usage-methods)
  - [Hooks](#usage-hooks)
- [Still in Development](#still-in-dev)

<a name="installation"></a>

# Installation

Install with `npm`

```
npm install thresh --save
```

Or `yarn`

```
yarn add thresh
```

<a name="usage"></a>

# Usage

<a name="usage-basic"></a>

### Basic

The most basic implementation with no dependencies or middleware. This is an Express app listening on port 3000 for GET requests on `'/hello'`.

```javascript
import { Thresh, Route, Request, Response } from 'thresh';

@Thresh({ express: [3000] })
class ThreshApplication {
  @Route('/hello')
  helloWorld(req: Request, res: Response) {
    res.json({ hello: 'world' });
  }
}

new ThreshApplication();
```

<a name="usage-services"></a>

### Services

Services are created as singletons and are available are provided for in the decorator `@Thresh`. They are immediately available in the constructor of the class that provided them, as well as the constructor of all nested routers.

```javascript
import { Thresh, Route, Request, Response } from 'thresh';

class FooService {
  public foo: string = 'bar';
}

@Thresh({
  services: [FooService],
  express: [3000]
})
class ThreshApplication {
  constructor(private fs: FooService) {}

  @Route('/hello') // GET http://localhost:3000/hello
  helloWorld(req: Request, res: Response) {
    res.json({ foo: this.fs.foo }); // { foo: 'bar' }
  }
}

new ThreshApplication();
```

<a name="usage-routers"></a>

### Routers

Routers are essentially identical to Apps and are also declared with `@Thresh`. They will inherit services from their parents.

```javascript
import { Thresh, Route, Request, Response } from 'thresh';

class FooService {
  public foo: string = 'bar';
}

@Thresh()
class ThreshRouter {
  constructor(fs: FooService) {}

  @Route('/hello') // GET http://localhost:3000/foo/hello
  helloWorld(req: Request, res: Response) {
    res.json({ foo: this.fs.foo }); // { foo: 'bar' }
  }
}

@Thresh({
  routers: [['/foo', ThreshRouter]]
  services: [FooService],
  express: [3000]
})
class ThreshApplication {}

new ThreshApplication();
```

<a name="usage-router-scope"></a>

### Router Scope

Services provided in routers will receive their own singletons isolated from the router's parents.

```javascript
import { Thresh, Route, Request, Response } from 'thresh';

class FooService {
  public foo: string = 'bar';
}

@Thresh({
  services: [FooService]
})
class ThreshRouter {
  constructor(fs: FooService) {
    console.log(this.fs.foo) // 'bar'
    this.fs.foo = 'banana';
  }

  @Route('/hello') // GET http://localhost:3000/foo/hello
  helloWorld(req: Request, res: Response) {
    res.json({ foo: this.fs.foo }); // { foo: 'banana' }
  }
}

@Thresh({
  routers: [['/foo', ThreshRouter]]
  services: [FooService],
  express: [3000]
})
class ThreshApplication {
  constructor(fs: FooService) {
    this.fs.foo = 'apple';
  }

  @Route('/hello') // GET http://localhost:3000/hello
  helloWorld(req: Request, res: Response) {
    res.json({ foo: this.fs.foo }); // { foo: 'apple' }
  }
}

new ThreshApplication();
```

<a name="usage-middleware"></a>

### Middleware

Middleware is still in development, and will unfortunately be applied randomly (but before any routes) until fixed.

```javascript
import { Thresh, Route, Request, Response, NextFunction } from 'thresh';

@Thresh({ express: [3000] })
class ThreshApplication {
  @Middleware('/')
  addName(req: Request, res: Response, next: NextFunction) {
    req.query.name = 'Peter Parker';
    next();
  }

  @Route('/hello')
  helloWorld(req: Request, res: Response) {
    res.send(`Hello, ${req.query.name}!`); // Hello, Peter Parker!
  }
}

new ThreshApplication();
```

<a name="usage-methods"></a>

### HTTP Methods

GET, POST, and ALL are currently allowed. Other needed methods are in development

```javascript
import {
  Thresh,
  Route,
  Request,
  Response,
  NextFunction,
  Method,
  MethodTypes
} from 'thresh';

@Thresh({ express: [3000] })
class ThreshApplication {
  @Route('/hello')
  @Method(MethodTypes.POST) // POST: http://localhost:3000/hello
  helloWorld(req: Request, res: Response) {
    res.send(`Hello, ${req.query.name}!`); // Hello, Peter Parker!
  }
}

new ThreshApplication();
```

<a name="usage-hooks"></a>

### Hooks

Several lifecycle hooks are available to modify the App/Router creation.

In Order:

- onInit: Express and Services initialized, but no routes/routers/middleware added yet
- afterInit: Just after the child Routers, routes and middleware have been added
- onStart: Just before Express.listen is called, only called on the root application
- afterStart: Just after Express.listen is called, only called on the root application

```javascript
import {
  Thresh,
  Route,
  Request,
  Response,
  App,
  Injector,
  afterInit
} from 'thresh';

@Thresh({ express: [3000] })
class ThreshApplication implements afterInit {
  @Route('/hello')
  helloWorld(req: Request, res: Response) {
    res.send(`Hello, world!`);
  }

  afterInit(app: App, services: Injector) {
    console.log(app._router.stack); // List all routes
    app.use('/public', express.static('public')); // Serve public files
  }
}

new ThreshApplication();
```

<a name="still-in-dev"></a>

# Still in Development

- Middleware and Route ordering
- More Http Methods
- Providing Services within Services
- Error handling
- Tests
