import { expect } from 'chai';
import { Middleware, Request, Response, NextFunction, ErrorTypes } from './';
import { MethodTypes, RouteTypes } from './enum';

describe('middleware.ts', () => {
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
  });

  it('should throw error for wrong method parameters', () => {
    const testcases = [
      function() {
        class Foo {
          @Middleware('/')
          fn(req: Request, res: Response) {}
        }
        return new Foo();
      },
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

  it('should return a Route object', () => {
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
