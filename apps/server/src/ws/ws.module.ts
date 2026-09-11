import { Global, Module } from "@nestjs/common";
import { TokenModule } from "../core/auth/token.module";
import { BaseRealtimeBridge } from "./base-realtime.bridge";
import { WsGateway } from "./ws.gateway";
import { WsService } from "./ws.service";
import { WsTreeService } from "./ws-tree.service";

@Global()
@Module({
  exports: [WsGateway, WsService, WsTreeService],
  imports: [TokenModule],
  providers: [WsGateway, WsService, WsTreeService, BaseRealtimeBridge],
})
export class WsModule {}
