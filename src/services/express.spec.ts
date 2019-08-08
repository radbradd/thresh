// Setup Chai
import chai, { expect } from 'chai';
import chaiHttp from 'chai-http';
chai.use(chaiHttp);

import {
  Thresh,
  Route,
  Middleware,
  Param,
  RootService,
  ExpressService,
  afterStart,
  startThresh,
  Request,
  Response,
  NextFunction
} from '..';
import { AppRouter } from '../types';
import { ErrorTypes } from '../enum';

// Main Tester
class FooService {
  hello: string = 'world';
}

class BarService {
  foo: string = 'bar';
}

@Thresh()
class Foo {
  constructor(
    public rootService: RootService,
    public fooService: FooService,
    public barService: BarService
  ) {}
}

describe('ExpressService', () => {
  const appService = new ExpressService([], [FooService], Foo);
  const routerService = new ExpressService(
    [appService.injector],
    [BarService],
    Foo
  );

  describe('constructor', () => {
    it('should create root application if no args', () => {
      // Is an Express.Application
      expect(appService.isApp).to.equal(true);
      // Which should have the property 'listen'
      expect(appService.app).to.haveOwnProperty('listen');
    });

    it('should create nested router if args', () => {
      // Is an Express.Router
      expect(routerService.isApp).to.equal(false);
      // Which should not have the property 'listen'
      expect(routerService.app).to.not.haveOwnProperty('listen');
      // But the rootService is an app
      expect(routerService.injector.cradle.RootService.isApp).to.equal(true);
      // The FooService objects are different
      expect(routerService.injector.cradle.FooService).to.not.equal(
        appService.injector.cradle.FooService
      );
    });

    // it('should provide the services in @Thresh({services})', () => {
    //   // [RootService, FooService, undefined] undefined since BarService isn't provided
    //   expect(appService.args).to.eql([
    //     appService.injector.cradle.RootService,
    //     appService.injector.cradle.FooService,
    //     undefined
    //   ]);
    //   // [FooService, BarService] FooService is the same one from appService
    //   expect(routerService.args).to.eql([
    //     appService.injector.cradle.ExpressService,
    //     appService.injector.cradle.FooService,
    //     routerService.injector.cradle.BarService
    //   ]);
    // });

    it("should throw an error if any service isn't an ES6 class", () => {
      expect(fn).to.throw(Error, ErrorTypes.MustBeClass);
      function fn() {
        new ExpressService([], [3], Foo);
      }
    });
  });

  describe('routers', () => {
    @Thresh()
    class MockRouter {}

    @Thresh()
    class FakeRouter {}

    it('should throw an error if any router is invalid', () => {
      class FakeRouter {}
      [
        [['/route', FakeRouter, '']], // Too many arguments
        [[3, FakeRouter]], // First argument not a string
        [['/route', () => {}]] // Second argument not an ES6 class
      ]
        .map(testcase => () => {
          // @ts-ignore
          appService.routers = testcase;
        })
        .forEach(testfn => {
          expect(testfn).to.throw(Error, ErrorTypes.RouterConfig);
        });
    });

    it('should add routers to the app', () => {
      const routers: AppRouter[] = [
        ['/mock', MockRouter],
        ['/fake', FakeRouter]
      ];
      appService.routers = routers;
      expect(appService.routers.length).to.equal(2);
    });

    it('should not run more than once', () => {
      const routers: AppRouter[] = [['/mock', MockRouter]];
      appService.routers = routers;
      expect(appService.routers.length).to.equal(2);
    });
  });

  describe('routes', () => {
    class MockApp {
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

    const mockApp = new MockApp();

    it('should add routes to the app', () => {
      appService.routes = { klassInstance: mockApp, Klass: MockApp };
    });

    it('should not run more than once', () => {});
  });
});
