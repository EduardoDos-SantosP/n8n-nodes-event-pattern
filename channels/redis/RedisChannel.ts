import {
	FunctionsBase,
	IExecuteFunctions,
	ITriggerFunctions,
	ITriggerResponse,
} from 'n8n-workflow';
import { createClient } from 'redis';
import { EventChannel } from '../EventChannel';
import type { RedisCredential } from './RedisCredential';

export class RedisChannel extends EventChannel<'redis', RedisCredential> {
	readonly credentialName = 'redis';

	private readonly channelPrefix = 'n8n-event-pattern-';

	private async createClient(fn: FunctionsBase, isTest: boolean = false) {
		const credential = await this.getCredential(fn);
		const socketConfig: any = {
			host: credential.host,
			port: credential.port,
			tls: credential.ssl === true,
			connectTimeout: 10000,
			reconnectStrategy: isTest ? false : undefined,
		};

		fn.logger.info(`Connecting to Redis: ${JSON.stringify(socketConfig)}`);

		if (credential.ssl === true && credential.disableTlsVerification === true) {
			socketConfig.rejectUnauthorized = false;
		}

		return createClient({
			socket: socketConfig,
			database: credential.database,
			username: credential.user ?? undefined,
			password: credential.password ?? undefined,
			...(isTest && {
				disableOfflineQueue: true,
				enableOfflineQueue: false,
			}),
		});
	}

	async trigger(event: string, fn: ITriggerFunctions): Promise<ITriggerResponse> {
		fn.logger.info('Redis Event Channel Trigger started');

		const client = await this.createClient(fn);
		await client.connect();
		await client.ping();

		const onMessage = (message: string) => {
			const data = {
				event: JSON.parse(message),
			};
			fn.emit([fn.helpers.returnJsonArray(data)]);
		};

		const channelName = this.channelPrefix + event;
		const manualTriggerFunction = async () =>
			await new Promise<void>(async (resolve) => {
				await client.pSubscribe(channelName, (message) => {
					onMessage(message);
					resolve();
				});
			});

		if (fn.getMode() === 'trigger') {
			await client.pSubscribe(channelName, onMessage);
		}

		async function closeFunction() {
			await client.pUnsubscribe();
			await client.quit();
		}

		return {
			closeFunction,
			manualTriggerFunction,
		};
	}

	async publish(event: string, payload: string, fn: IExecuteFunctions): Promise<void> {
		fn.logger.info('Redis Event Channel Publish started');

		const client = await this.createClient(fn);
		try {
			await client.connect();
			await client.ping();

			const channelName = this.channelPrefix + event;
			await client.publish(channelName, payload);
		} finally {
			try {
				await client.quit();
			} catch (e) {
				try {
					client.destroy();
				} catch (e) {}
			}
		}
	}
}
