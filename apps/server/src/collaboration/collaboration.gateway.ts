import * as os from "node:os";
import { Hocuspocus } from "@hocuspocus/server";
import { Injectable } from "@nestjs/common";
import type { IncomingMessage } from "http";
import RedisClient from "ioredis";
import { pack, unpack } from "msgpackr";
import { nanoid } from "nanoid";
import type WebSocket from "ws";
import {
	createRetryStrategy,
	parseRedisUrl,
	type RedisConfig,
} from "../common/helpers";
import type { EnvironmentService } from "../integrations/environment/environment.service";
import type { CollabWsAdapter } from "./adapter/collab-ws.adapter";
import type {
	CollabEventHandlers,
	CollaborationHandler,
} from "./collaboration.handler";
import type { AuthenticationExtension } from "./extensions/authentication.extension";
import type { LoggerExtension } from "./extensions/logger.extension";
import type { PersistenceExtension } from "./extensions/persistence.extension";
import {
	RedisSyncExtension,
	type SerializedHTTPRequest,
} from "./extensions/redis-sync";
import { toWebRequest } from "./extensions/redis-sync/redis-sync.types";
import { WsSocketWrapper } from "./extensions/redis-sync/ws-socket-wrapper";

@Injectable()
export class CollaborationGateway {
	private readonly hocuspocus: Hocuspocus;
	private redisConfig: RedisConfig;
	// @ts-expect-error
	private readonly redisSync: RedisSyncExtension<CollabEventHandlers> | null =
		null;
	private readonly withRedis: boolean;

	constructor(
		private authenticationExtension: AuthenticationExtension,
		private persistenceExtension: PersistenceExtension,
		private loggerExtension: LoggerExtension,
		private environmentService: EnvironmentService,
		private collabEventsService: CollaborationHandler,
	) {
		this.redisConfig = parseRedisUrl(this.environmentService.getRedisUrl());
		this.withRedis = !this.environmentService.isCollabDisableRedis();

		this.hocuspocus = new Hocuspocus({
			debounce: 10000,
			maxDebounce: 45000,
			unloadImmediately: false,
			extensions: [
				this.authenticationExtension,
				this.persistenceExtension,
				this.loggerExtension,
			],
		});

		if (this.withRedis) {
			// @ts-expect-error
			this.redisSync = new RedisSyncExtension({
				redis: new RedisClient({
					host: this.redisConfig.host,
					port: this.redisConfig.port,
					username: this.redisConfig.username,
					password: this.redisConfig.password,
					db: this.redisConfig.db,
					family: this.redisConfig.family,
					tls: this.redisConfig.tls,
					retryStrategy: createRetryStrategy(),
				}),
				serverId: `collab-${os?.hostname()}-${nanoid(10)}`,
				prefix: "collab",
				pack,
				unpack,
				// @ts-expect-error
				customEvents: this.collabEventsService.getHandlers(this.hocuspocus),
			});
			this.hocuspocus.configuration.extensions.push(this.redisSync);
			// @ts-expect-error
			this.redisSync.onConfigure({ instance: this.hocuspocus });
		}
	}

	private serializeRequest(request: IncomingMessage): SerializedHTTPRequest {
		return {
			method: request.method ?? "GET",
			url: request.url ?? "/",
			headers: {
				"sec-websocket-key": request.headers["sec-websocket-key"] ?? "",
				"sec-websocket-protocol":
					request.headers["sec-websocket-protocol"] ?? "",
			},
			socket: { remoteAddress: request.socket?.remoteAddress ?? "" },
		};
	}

	handleConnection(client: WebSocket, request: IncomingMessage): any {
		if (this.redisSync) {
			const serializedHTTPRequest = this.serializeRequest(request);
			const socketId = serializedHTTPRequest.headers["sec-websocket-key"];

			const wrappedSocket = new WsSocketWrapper(client);

			// Route through RedisSync extension (this calls handleConnection internally)
			this.redisSync.onSocketOpen(wrappedSocket, serializedHTTPRequest);

			client.on("message", (data: ArrayBuffer) => {
				this.redisSync!.onSocketMessage(serializedHTTPRequest, data);
			});

			client.on("close", (code: number, reason: Buffer) => {
				this.redisSync!.onSocketClose(
					socketId,
					code,
					new Uint8Array(reason).buffer,
				);
			});
		} else {
			// Fallback to direct Hocuspocus connection
			const clientConnection = this.hocuspocus.handleConnection(
				client,
				toWebRequest(this.serializeRequest(request)),
			);

			client.on("message", (data: Buffer) => {
				clientConnection.handleMessage(new Uint8Array(data));
			});

			client.on("close", (code: number, reason: Buffer) => {
				clientConnection.handleClose({ code, reason: reason.toString() });
			});
		}
	}

	getConnectionCount() {
		return this.hocuspocus.getConnectionsCount();
	}

	getDocumentCount() {
		return this.hocuspocus.getDocumentsCount();
	}

	handleYjsEvent<TName extends keyof CollabEventHandlers>(
		eventName: TName,
		documentName: string,
		payload: Parameters<CollabEventHandlers[TName]>[1],
	) {
		return this.redisSync?.handleEvent(eventName, documentName, payload);
	}

	openDirectConnection(documentName: string, context?: any) {
		return this.hocuspocus.openDirectConnection(documentName, context);
	}

	/*
	 *Can be used before calling openDirectConnection directly
	 */
	async lockDocument(documentName: string) {
		return this.redisSync.lockDocument(documentName);
	}

	/*
	 *Releases a document lock and stops the interval that maintains it.
	 */
	async releaseLock(documentName: string) {
		return this.redisSync.releaseLock(documentName);
	}

	async destroy(collabWsAdapter: CollabWsAdapter): Promise<void> {
		await new Promise(async (resolve) => {
			try {
				// Wait for all documents to unload
				this.hocuspocus.configuration.extensions.push({
					async afterUnloadDocument({ instance }) {
						if (instance.getDocumentsCount() === 0) resolve("");
					},
				});

				collabWsAdapter?.close();

				if (this.hocuspocus.getDocumentsCount() === 0) resolve("");
				this.hocuspocus.closeConnections();
				this.hocuspocus.flushPendingStores();
			} catch (error) {
				console.error(error);
			}
		});

		await this.hocuspocus.hooks("onDestroy", { instance: this.hocuspocus });
	}
}
