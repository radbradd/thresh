import { expect } from 'chai';
import { Description } from './description';

describe('description.ts', () => {
  it('should have description property', () => {
    const desc = 'this is a description';
    class Foo {
      @Description(desc)
      bar() {
        return desc;
      }
    }
    const foo = new Foo();
    expect(foo.bar()).to.equal(desc);
    // @ts-ignore
    expect(foo.bar.description).to.equal(desc);
  });
});
