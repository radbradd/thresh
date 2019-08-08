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
  afterInit,
  startThresh,
  Request,
  Response,
  NextFunction
} from '../';

// Main Tester
class FooService {
  hello: string = 'world';
}

class BarService {
  bar: boolean = true;
}

@Thresh({
  services: [FooService]
})
class ThreshRouter {
  constructor(
    public expressService: ExpressService,
    public rootService: RootService,
    public fooService: FooService
  ) {}
}

@Thresh({
  services: [FooService],
  routers: [['/thresh', ThreshRouter]],
  express: [3000]
})
class ThreshApp implements afterStart, afterInit {
  constructor(
    public rootService: RootService,
    public fooService: FooService,
    public barService: BarService
  ) {}

  static $order = ['modId', 'addId'];

  afterInit() {}

  afterStart() {
    // For code coverage, should do nothing
    this.rootService.routers = [['', class {}]];
    this.rootService.routes = { klassInstance: this, Klass: ThreshApp };
  }

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

describe('@Thresh', () => {
  let app: ThreshApp;
  let router: ThreshRouter;

  before(() => {
    // @ts-ignore
    app = startThresh(ThreshApp);
    // @ts-ignore
    router = app.rootService.routers[0];
  });

  after(done => {
    app.rootService
      .close()
      .catch()
      .finally(done);
  });

  describe('@Thresh.Application', () => {
    it('root app should be an Express Application', () => {
      expect(app.rootService.isApp).to.equal(true);
    });

    it('should have args that match constructor', () => {
      expect(app.rootService.args).to.eql([
        app.rootService,
        app.fooService,
        app.barService
      ]);
    });

    it('should close without error', () => {
      return new Promise(resolve => {
        app.rootService
          .close()
          .then(() => {
            expect(true).to.equal(true);
          })
          .catch((err: any) => {
            expect(true).to.equal(false);
          })
          .finally(resolve);
      });
    });

    it('should reject closing a closed app', () => {
      return new Promise(resolve => {
        app.rootService
          .close()
          .then(() => {
            expect(true).to.equal(false);
          })
          .catch((err: any) => {
            expect(true).to.equal(true);
          })
          .finally(resolve);
      });
    });

    it('should start without error', () => {
      return new Promise(resolve => {
        app.rootService
          .listen(3000)
          .then(() => {
            expect(true).to.equal(true);
          })
          .catch((err: any) => {
            console.error(err);
            expect(true).to.equal(false);
          })
          .finally(resolve);
      });
    });

    it('should reject starting a running app', () => {
      return new Promise(resolve => {
        app.rootService
          .listen(3000)
          .then(() => {
            expect(true).to.equal(false);
          })
          .catch((err: any) => {
            expect(true).to.equal(true);
          })
          .finally(resolve);
      });
    });
  });

  describe('@Thresh.Router', () => {
    it('routers should be Express Routers', () => {
      expect(router.expressService.isApp).to.equal(false);
    });

    it('routers should have access to RootService', () => {
      expect(router.rootService).to.equal(app.rootService);
    });

    it('routers services should scope if provided in router', () => {
      expect(router.expressService).to.not.equal(router.rootService);
      expect(router.fooService).to.not.equal(app.fooService);
    });

    it('should have args that match constructor', () => {
      expect(router.expressService.args).to.eql([
        router.expressService,
        router.rootService,
        router.fooService
      ]);
    });
  });
});
