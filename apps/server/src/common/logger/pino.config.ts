import { Params } from "nestjs-pino";
import { stdTimeFunctions } from "pino";
import { redactSensitiveUrl } from "../helpers/utils";

const CONTEXTS_TO_IGNORE = [
  "InstanceLoader",
  "RoutesResolver",
  "RouterExplorer",
  "LegacyRouteConverter",
  "WebSocketsController",
];

export function createPinoConfig(): Params {
  const isProduction = process.env.NODE_ENV?.toLowerCase() === "production";
  const isDebugMode = process.env.DEBUG_MODE?.toLowerCase() === "true";
  const logHttp = process.env.LOG_HTTP?.toLowerCase() === "true";

  const level = isProduction && !isDebugMode ? "info" : "debug";

  return {
    pinoHttp: {
      autoLogging: logHttp
        ? {
            ignore: (req) =>
              req.url === "/api/health" || req.url === "/api/health/live",
          }
        : false,
      customLogLevel: (_req, res, err) => {
        if (res.statusCode >= 500 || err) {
          return "error";
        }
        if (res.statusCode >= 400) {
          return "warn";
        }
        return "info";
      },
      formatters: {
        level: (label) => ({ level: label }),
      },
      hooks: {
        logMethod(inputArgs, method) {
          if (isProduction && !isDebugMode) {
            for (const arg of inputArgs) {
              if (typeof arg === "object" && arg !== null && "context" in arg) {
                const context = (arg as Record<string, unknown>)["context"];
                if (
                  typeof context === "string" &&
                  CONTEXTS_TO_IGNORE.includes(context)
                ) {
                  return;
                }
              }
            }
          }
          return method.apply(this, inputArgs);
        },
      },
      level,
      serializers: {
        req: (req) => ({
          ip: req.ip || req.remoteAddress,
          method: req.method,
          url: redactSensitiveUrl(req.url),
          userAgent: req.headers?.["user-agent"],
        }),
        res: (res) => ({
          statusCode: res.statusCode,
        }),
      },
      timestamp: stdTimeFunctions.isoTime,
      transport: isProduction
        ? undefined
        : {
            options: {
              colorize: true,
              ignore: "pid,hostname",
              singleLine: true,
              translateTime: "SYS:standard",
            },
            target: "pino-pretty",
          },
    },
  };
}
