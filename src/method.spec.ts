import { expect } from 'chai';
import { Method } from './method';
import { MethodTypes, ErrorTypes } from './enum';

describe('method.ts', () => {
  it('should have method property', () => {
    const method = MethodTypes.Get;
    class Foo {
      @Method(method)
      bar() {
        return method;
      }
    }
    const foo = new Foo();
    expect(foo.bar()).to.equal(method);
    // @ts-ignore
    expect(foo.bar.method).to.equal(method);
  });

  it('should throw an error if method not in MethodTypes', () => {
    const method = 'not-a-valid-method';
    function fn() {
      class Foo {
        @Method(method)
        bar() {
          return method;
        }
      }
      return new Foo();
    }
    expect(fn).to.throw(Error, ErrorTypes.InvalidHttpMethod);
  });
});
