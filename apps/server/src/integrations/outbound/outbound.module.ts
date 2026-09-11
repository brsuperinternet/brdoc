import { Global, Module } from "@nestjs/common";
import { OutboundAgentFactory } from "./outbound-agent.factory";
import { OutboundUrlGuard } from "./outbound-url.guard";

@Global()
@Module({
  exports: [OutboundUrlGuard, OutboundAgentFactory],
  providers: [OutboundUrlGuard, OutboundAgentFactory],
})
export class OutboundModule {}
