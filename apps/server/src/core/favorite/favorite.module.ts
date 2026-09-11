import { Module } from "@nestjs/common";
import { FavoriteController } from "./favorite.controller";
import { FavoriteService } from "./services/favorite.service";

@Module({
  controllers: [FavoriteController],
  exports: [FavoriteService],
  providers: [FavoriteService],
})
export class FavoriteModule {}
