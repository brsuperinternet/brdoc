import * as fs from "node:fs";
import { join } from "node:path";
import fastifyStatic from "@fastify/static";
import { Module, OnModuleInit } from "@nestjs/common";
import { HttpAdapterHost } from "@nestjs/core";
import { EnvironmentService } from "../environment/environment.service";

@Module({})
export class StaticModule implements OnModuleInit {
  constructor(
    private readonly httpAdapterHost: HttpAdapterHost,
    private readonly environmentService: EnvironmentService
  ) {}

  public async onModuleInit() {
    const httpAdapter = this.httpAdapterHost.httpAdapter;
    const app = httpAdapter.getInstance();

    const clientDistPath = join(
      import.meta.dirname,
      "..",
      "..",
      "..",
      "..",
      "client/dist"
    );

    const indexFilePath = join(clientDistPath, "index.html");

    if (fs.existsSync(clientDistPath) && fs.existsSync(indexFilePath)) {
      const indexTemplateFilePath = join(clientDistPath, "index-template.html");
      const windowVar = "<!--window-config-->";

      const configString = {
        AI_VECTOR_DRIVER:
          this.environmentService.getAiVectorDriver() === "turbopuffer"
            ? "turbopuffer"
            : undefined,
        APP_URL: this.environmentService.getAppUrl(),
        BETA_PUBLIC_SPACES: this.environmentService.isBetaPublicSpaces(),
        BILLING_TRIAL_DAYS: this.environmentService.isCloud()
          ? this.environmentService.getBillingTrialDays()
          : undefined,
        CLOUD: this.environmentService.isCloud(),
        COLLAB_URL: this.environmentService.getCollabUrl(),
        DRAWIO_URL: this.environmentService.getDrawioUrl(),
        ENV: this.environmentService.getNodeEnv(),
        FILE_IMPORT_SIZE_LIMIT:
          this.environmentService.getFileImportSizeLimit(),
        FILE_UPLOAD_SIZE_LIMIT:
          this.environmentService.getFileUploadSizeLimit(),
        POSTHOG_HOST: this.environmentService.getPostHogHost(),
        POSTHOG_KEY: this.environmentService.getPostHogKey(),
        SUBDOMAIN_HOST: this.environmentService.isCloud()
          ? this.environmentService.getSubdomainHost()
          : undefined,
      };

      const windowScriptContent = `<script>window.CONFIG=${JSON.stringify(configString)};</script>`;

      if (!fs.existsSync(indexTemplateFilePath)) {
        fs.copyFileSync(indexFilePath, indexTemplateFilePath);
      }

      const html = fs.readFileSync(indexTemplateFilePath, "utf8");
      const transformedHtml = html.replace(windowVar, windowScriptContent);

      fs.writeFileSync(indexFilePath, transformedHtml);

      const RENDER_PATH = "*";

      await app.register(fastifyStatic, {
        root: clientDistPath,
        setHeaders: (reply: any, pathName: string) => {
          // Vite content-hashes everything under /assets, so they can be cached forever
          if (/[\\/]assets[\\/]/.test(pathName)) {
            reply.header(
              "Cache-Control",
              "public, max-age=31536000, immutable"
            );
          }
        },
        wildcard: false,
      });

      app.get(RENDER_PATH, (req: any, res: any) => {
        const stream = fs.createReadStream(indexFilePath);
        res
          .header("Cache-Control", "no-cache, no-store, must-revalidate")
          .type("text/html")
          .send(stream);
      });
    }
  }
}
