import { expect } from 'chai';
import { Request, Response, NextFunction, Route, Param, Middleware } from './';
import { MethodTypes, RouteTypes, ErrorTypes } from './enum';

describe('route.ts', () => {
  describe('@Route', () => {
    it('should throw error for parameter wrong type', () => {
      const testcases: any[] = [
        3,
        true,
        ['str', /^str$/i, 3],
        ['str', true, 'str'],
        [/^foo$/i, 3]
      ];
      testcases.forEach(testcase => {
        expect(ClassFromRouteParams(testcase)).to.throw(
          Error,
          ErrorTypes.RoutePath
        );
      });

      function ClassFromRouteParams(param: any) {
        return function() {
          class Foo {
            // @ts-ignore
            @Route(param)
            bar(req: Request, res: Response) {}
          }
          return new Foo();
        };
      }
    });

    it('should throw error for > 3 parameters', () => {
      const testcases = [
        function() {
          class Foo {
            @Route('/')
            fn(req: Request, res: Response, next: NextFunction, id: any) {}
          }
          return new Foo();
        }
      ];
      testcases.forEach(testcase => {
        expect(testcase).to.throw(Error, ErrorTypes.RouteArgs);
      });
    });

    it('should return a Route object', () => {
      class Foo {
        @Route('/')
        bar() {}
      }
      const foo = new Foo();
      expect(foo.bar).to.haveOwnProperty('fn');
      // @ts-ignore
      expect(foo.bar.route).to.equal('/');
      // @ts-ignore
      expect(foo.bar.description).to.equal('');
      // @ts-ignore
      expect(foo.bar.method).to.equal(MethodTypes.Get);
      // @ts-ignore
      expect(foo.bar.type).to.equal(RouteTypes.Route);
    });

    it('should return a Route object for route ["/"]', () => {
      const path = ['/'];
      class Foo {
        @Route(path)
        bar() {
          return [function(req: Request, res: Response) {}];
        }
      }
      const foo = new Foo();
      // @ts-ignore
      expect(foo.bar.fn).to.not.be.undefined;
      // @ts-ignore
      expect(foo.bar.route).to.eql(path);
      // @ts-ignore
      expect(foo.bar.description).to.equal('');
      // @ts-ignore
      expect(foo.bar.method).to.equal(MethodTypes.Get);
      // @ts-ignore
      expect(foo.bar.type).to.equal(RouteTypes.Route);
    });
  });

  describe('@Middleware', () => {
    it('should throw error for parameter wrong type', () => {
      const testcases: any[] = [
        3,
        true,
        ['str', /^str$/i, 3],
        ['str', true],
        [/^foo$/i, 3]
      ];
      testcases.forEach(testcase => {
        expect(ClassFromMiddlewareParams(testcase)).to.throw(
          Error,
          ErrorTypes.MiddlewarePath
        );
      });

      function ClassFromMiddlewareParams(param: any) {
        return function() {
          class Foo {
            // @ts-ignore
            @Middleware(param)
            bar(req: Request, res: Response, next: NextFunction) {}
          }
          return new Foo();
        };
      }
    });

    it('should throw error for > 3 parameters', () => {
      const testcases = [
        function() {
          class Foo {
            @Middleware('/')
            fn(req: Request, res: string, next: any, id: any) {}
          }
          return new Foo();
        }
      ];
      testcases.forEach(testcase => {
        expect(testcase).to.throw(Error, ErrorTypes.MiddlewareArgs);
      });
    });

    it('should return a Route object for route "/"', () => {
      class Foo {
        @Middleware('/')
        bar() {}
      }
      const foo = new Foo();
      expect(foo.bar).to.haveOwnProperty('fn');
      // @ts-ignore
      expect(foo.bar.route).to.equal('/');
      // @ts-ignore
      expect(foo.bar.description).to.equal('');
      // @ts-ignore
      expect(foo.bar.method).to.equal(MethodTypes.Get);
      // @ts-ignore
      expect(foo.bar.type).to.equal(RouteTypes.Middleware);
    });

    it('should return a Route object for route ["/"]', () => {
      const path = ['/'];
      class Foo {
        @Middleware(path)
        bar() {}
      }
      const foo = new Foo();
      expect(foo.bar).to.haveOwnProperty('fn');
      // @ts-ignore
      expect(foo.bar.route[0]).to.eql('/');
      // @ts-ignore
      expect(foo.bar.description).to.equal('');
      // @ts-ignore
      expect(foo.bar.method).to.equal(MethodTypes.Get);
      // @ts-ignore
      expect(foo.bar.type).to.equal(RouteTypes.Middleware);
    });
  });

  describe('@Param', () => {
    it('should return a Route object', () => {
      class Foo {
        @Param('id')
        processId(
          req: Request,
          res: Response,
          next: NextFunction,
          id: string
        ) {}
      }
      const foo = new Foo();
      expect(foo.processId).to.haveOwnProperty('fn');
      // @ts-ignore
      expect(foo.processId.description).to.equal('');
      // @ts-ignore
      expect(foo.processId.type).to.equal(RouteTypes.Param);
    });
  });
});
