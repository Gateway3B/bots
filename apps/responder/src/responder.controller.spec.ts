import { Test, TestingModule } from '@nestjs/testing';
import { ResponderController } from './responder.controller';
import { ResponderService } from './responder.service';

describe('ResponderController', () => {
  let responderController: ResponderController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [ResponderController],
      providers: [ResponderService],
    }).compile();

    responderController = app.get<ResponderController>(ResponderController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(responderController.getHello()).toBe('Hello World!');
    });
  });
});
