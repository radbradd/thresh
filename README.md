# Thresh

[![NPM Version](https://badge.fury.io/js/thresh.svg)](https://badge.fury.io/js/thresh)
[![Coverage Status](https://coveralls.io/repos/github/radbradd/thresh/badge.svg)](https://coveralls.io/github/radbradd/thresh)
[![Build Status](https://travis-ci.org/radbradd/thresh.svg?branch=master)](https://travis-ci.org/radbradd/thresh)
[![License: MIT](https://img.shields.io/badge/License-MIT-brightgreen.svg)](https://opensource.org/licenses/MIT)

Decorative implementation of Express with TypeScript and dependency injection

# Table of Contents

- [Installation](#installation)
- [Usage](#usage)
  - [Basic](#usage-basic)
  - [Services](#usage-services)
  - [Routers](#usage-routers)
  - [Router Scope](#usage-router-scope)
  - [Middleware](#usage-middleware)
  - [Params](#usage-params)
  - [HTTP Methods](#usage-methods)
  - [Hooks](#usage-hooks)
  - [Route/Middleware Ordering](#usage-ordering)
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

The most basic implementation with no dependencies or middleware. This is an Express app listening on port 3000 for GET requests on `'/hello'`. As a note `/hello` could
also be a RegExp, Express path expression or an array containing any combination of
those.

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

Services are created as singletons and are available and provided for in the decorator `@Thresh`. They are immediately available in the constructor of the class that provided them, as well as the constructor of all nested routers.

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

Middleware like routes, can also be chained by passing no parameters to the
class method and returning an array of middleware.

```javascript
import {
  Thresh,
  Route,
  Middleware,
  Request,
  Response,
  NextFunction
} from 'thresh';

@Thresh({ express: [3000] })
class ThreshApplication {
  @Middleware('/')
  addHero(req: Request, res: Response, next: NextFunction) {
    req.query.name = 'Peter Parker';
    next();
  }

  @Middleware('/villian')
  addVillian() {
    // ^-- No Parameters
    return [
      function(req: Request, res: Response, next: NextFunction) {
        console.log(`You're done ${req.query.name}!`);
        next();
      },
      function(req: Request, res: Response, next: NextFunction) {
        req.query.name = 'Doctor Octavius';
        next();
      }
    ];
  }

  @Route('/hello')
  hello(req: Request, res: Response) {
    res.send(`Hello, ${req.query.name}!`); // Hello, Peter Parker!
  }

  @Route('/villian')
  getVillian(req: Request, res: Response) {
    res.send(`Oh no, it's ${req.query.name}!`);
    // Oh no, it's Doctor Octavius
  }
}

new ThreshApplication();
```

<a name="usage-params"></a>

# Params

Parameter interceptors are assigned via the `@Param` decorator. Pass in a
string with the parameter you want to intercept and act on.

```javascript
import { Thresh, Route, Param, Request, Response, NextFunction } from 'thresh';

@Thresh({ express: [3000] })
class ThreshApplication {
  @Param('name')
  addName(req: Request, res: Response, next: NextFunction, name: any) {
    req.query.name = name + 'awesome';
    next();
  }

  @Route('/hello/:name')
  hello(req: Request, res: Response) {
    res.send(`Hello, ${req.query.name}!`); //Hello [name]awesome!
  }
}

new ThreshApplication();
```

<a name="usage-methods"></a>

### HTTP Methods

All HTTP verbs that Express supports, Thresh does as well. They can either be typed out
as a string or imported by the `MethodTypes` constant. If `@Method` is not defined, the
route will default to `GET`.

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
  @Method(MethodTypes.Post) // POST: http://localhost:3000/hello
  helloWorld(req: Request, res: Response) {
    res.send(`Hello, world!`); // Hello, world!
  }

  @Route('/helloall')
  @Method('put') // PUT: http://localhost:3000/helloall
  helloAll(req: Request, res: Response) {
    res.send(`Hello, everyone!`); // Hello, everyone!
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

<a name="usage-ordering"></a>

### Route/Middleware Ordering

If compiled to ES2015+ (ES6+) Routes and Middleware are applied exactly
how they appear in the class from top to bottom. Compiling further back
than that doesn't guarantee object property ordering
**[ECMA-262](https://www.ecma-international.org/ecma-262/6.0/#sec-object.getownpropertynames)**.
To overcome this a `static $order: string[]` can be provided with the exact
order to apply routes/middleware in. Any `@Routes` or `@Middleware` not declared
in `$order` will be applied after those in `$order`.

```javascript
import { Thresh, Route, Request, Response, NextFunction } from 'thresh';

@Thresh({ express: [3000] })
class ThreshApplication implements afterInit {
  static $order = ['appliedFirst', 'appliedLast'];

  @Route('/hello')
  appliedLast(req: Request, res: Response) {
    res.send(`Hello, ${req.query.name}!`);
    // With $order: Hello, Peter Parker!
    // Without $order: Hello, undefined
    //    This is because appliedLast is applied first as
    //    it comes first in the class definition
  }

  @Middleware('/')
  appliedFirst(req: Request, res: Response, next: NextFunction) {
    req.query.name = 'Peter Parker';
    next();
  }
}

new ThreshApplication();
```

<a name="still-in-dev"></a>

# Still in Development

- App settings
- Providing Services within Services
