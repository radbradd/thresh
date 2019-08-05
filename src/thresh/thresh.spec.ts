// Setup Chai
import chai, { expect } from 'chai';
import chaiHttp from 'chai-http';
chai.use(chaiHttp);

import { createContainer, asClass } from 'awilix';

import { Thresh, onStart } from './thresh';
import {
  buildApp,
  provideRouters,
  getConstructorServices,
  createRoutes
} from './functions';
import { ErrorTypes } from '../enum';
import { Constructor, App, Injector } from '../types';
import { Request, Response, NextFunction } from '../';
import { Route, Param, Middleware } from '../methods/route';

const world = 'world';
class FooService {
  public hello: string = world;
}

const bar = 'world';
class BarService {
  public bar: string = bar;
}

function Injectable() {
  return function _Injectable<T extends Constructor<{}>>(Base: T) {
    return class __Injectable extends Base {};
  };
}

describe('thresh.ts', () => {
  describe('@Thresh', () => {
    const secret = 'agentman';

    @Thresh({
      services: [FooService, BarService],
      express: [3003]
    })
    class Foo implements onStart {
      onStart(app: App) {
        app.get('/secret', (req: Request, res: Response) => {
          res.send(secret);
        });
      }
    }
    const foo = new Foo();

    it('should return the secret message', done => {
      chai
        .request('http://localhost:3003')
        .get('/secret')
        .send()
        .end((err, res) => {
          expect(err).to.be.null;
          expect(res).to.have.status(200);
          expect(res.text).to.equal(secret);
          // @ts-ignore
          foo.__close();
          done();
        });
    });
  });

  describe('fn: buildApp', () => {
    it('should create Express.App with no args passed', () => {
      const obj = buildApp([], []);
      expect(obj.app).to.haveOwnProperty('listen');
      expect(obj.services).to.haveOwnProperty('cradle');
    });

    it('should create Express.Router if any args passed', () => {
      const container = createContainer();
      const obj = buildApp([container], []);
      expect(obj.app).to.not.haveOwnProperty('listen');
      expect(obj.services).to.haveOwnProperty('cradle');
    });

    it('should add services to new container with no args passed', () => {
      const obj = buildApp([], [FooService]);
      expect(obj.app).to.haveOwnProperty('listen');
      expect(obj.services).to.haveOwnProperty('cradle');
      expect(obj.services.cradle.FooService.hello).to.equal(world);
    });

    it('should add services to existing container if any args passed', () => {
      const container = createContainer();
      container.register('FooService', asClass(FooService).singleton());
      const obj = buildApp([container], [BarService]);
      expect(obj.app).to.not.haveOwnProperty('listen');
      expect(obj.services).to.haveOwnProperty('cradle');
      expect(obj.services.cradle.FooService.hello).to.equal(world);
      expect(obj.services.cradle.BarService.bar).to.equal(bar);
    });

    it('should override services if a new service of same type is provided', () => {
      // Initial Container
      const container = createContainer();
      container.register('FooService', asClass(FooService).singleton());
      container.cradle.FooService.hello = 'you';

      // New Container
      const obj = buildApp([container], [FooService]);
      expect(obj.app).to.not.haveOwnProperty('listen');
      expect(obj.services).to.haveOwnProperty('cradle');
      expect(obj.services.cradle.FooService.hello).to.not.equal(
        container.cradle.FooService.hello
      );
    });

    it('should throw error if class is not passed', () => {
      const test = () => {
        return buildApp([], [function fn() {}]);
      };
      expect(test).to.throw(Error, ErrorTypes.MustBeClass);
    });
  });

  describe('fn: getConstructorServices', () => {
    it('should return Classes for arguments in constructor', () => {
      @Injectable()
      class Foo {
        constructor(fooService: FooService, barService: BarService) {}
      }

      const container = createContainer();
      container.register(FooService.name, asClass(FooService));
      container.register(BarService.name, asClass(BarService));

      const services = getConstructorServices(Foo, container);

      expect(services.length).to.equal(2);
      expect(services[0].hello).to.equal(world);
      expect(services[1].bar).to.equal(bar);
    });

    it('should return undefined for unprovided services', () => {
      @Injectable()
      class Foo {
        constructor(fooService: FooService, barService: BarService) {}
      }

      const container = createContainer();
      container.register(FooService.name, asClass(FooService));
      // container.register(BarService.name, asClass(BarService));

      const services = getConstructorServices(Foo, container);

      expect(services.length).to.equal(2);
      expect(services[0].hello).to.equal(world);
      expect(services[1]).to.equal(undefined);
      expect(() => services[1].bar).to.throw(TypeError);
    });

    it('should return empty array if no arguments', () => {
      @Injectable()
      class Foo {
        constructor() {}
      }

      const container = createContainer();
      container.register(FooService.name, asClass(FooService));
      container.register(BarService.name, asClass(BarService));

      const services = getConstructorServices(Foo, container);

      expect(services.length).to.equal(0);
    });
  });

  describe('fn: provideRouters', () => {
    const { app, services } = buildApp([], [FooService, BarService]);

    @Thresh()
    class Router {}

    it("should throw an error if shape isn't: [string, App][]", () => {
      // @ts-ignore
      expect(() => provideRouters(app, services, [[3, Router]])).to.throw(
        Error,
        ErrorTypes.RouterConfig
      );
    });

    it('should add routers to the parent App', () => {
      expect(() =>
        provideRouters(app, services, [['/router', Router]])
      ).to.not.throw(Error);
    });
  });

  describe('fn: createRoutes', () => {
    const { app } = buildApp([], [FooService, BarService]);

    class Foo {
      static $order = ['modId', 'addId'];

      @Middleware('/:id')
      addId(req: Request, res: Response, next: NextFunction) {
        req.query.id = 'x' + req.query.id;
        next();
      }

      @Route('/:id')
      getId(req: Request, res: Response) {
        res.send(req.query.id);
      }

      @Route('/:id/hello')
      helloId(req: Request, res: Response) {
        res.json({ hello: 'world', id: req.query.id });
      }

      @Param('id')
      modId(req: Request, res: Response, next: NextFunction, id: string) {
        req.query.id = '00' + id;
        next();
      }
    }

    it('should create routes according to $order', done => {
      const foo = new Foo();
      createRoutes(foo, app, Foo);
      // @ts-ignore
      const server = app.listen(3002);
      chai
        .request('http://localhost:3002')
        .get('/hello')
        .send()
        .end((err, res) => {
          expect(err).to.be.null;
          expect(res).to.have.status(200);
          expect(res.text).to.equal('x00hello');
          server.close();
          done();
        });
    });
  });
});
