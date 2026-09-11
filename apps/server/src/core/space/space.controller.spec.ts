import { Test, TestingModule } from "@nestjs/testing";
import { SpaceService } from "./services/space.service";
import { SpaceController } from "./space.controller";

describe("SpaceController", () => {
  let controller: SpaceController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SpaceController],
      providers: [SpaceService],
    }).compile();

    controller = module.get<SpaceController>(SpaceController);
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });
});
