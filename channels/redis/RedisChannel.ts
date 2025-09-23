import { IExecuteFunctions, ITriggerFunctions, ITriggerResponse, NodeOperationError } from 'n8n-workflow';
import { createClient } from 'redis';
import { EventChannel } from '../EventChannel';
import type { RedisCredential } from './RedisCredential';

export class RedisChannel extends EventChannel<'redis', RedisCredential> {
	readonly credentialName = 'redis';

	private readonly channelPrefix = 'n8n-event-pattern-';

	async trigger(event: string, fn: ITriggerFunctions): Promise<ITriggerResponse> {
		fn.logger.debug('Redis Event Channel Trigger started');

		const credentials = this.getCredential(fn);

		const client = createClient({
			url: `redis://${credentials.host}:${credentials.port}`,
			password: credentials.password,
			database: credentials.database,
		});

		const channelName = this.channelPrefix + event;
		const connectionPromise = new Promise((resolve, reject) => {
			client.on('connect', () => {
				client.pSubscribe(channelName, message => {
					const event = JSON.parse(message);
					fn.emit([fn.helpers.returnJsonArray({ event })]);
					resolve(true);
				});
			});
			client.on('error', (error) => {
				reject(error);
			});
		});

		const manualTriggerFunction = async () => {
			await connectionPromise;
		};

		if (fn.getMode() === 'trigger') {
			await manualTriggerFunction();
		}

		return {
			async closeFunction() {
				client.quit();
			},
			manualTriggerFunction,
		};
	}

	async publish(event: string, payload: object, fn: IExecuteFunctions): Promise<void> {
		fn.logger.debug('Redis Event Channel Publish started');

		const credential = this.getCredential(fn);

		const client = createClient({
			url: `redis://${credential.host}:${credential.port}`,
			password: credential.password,
			database: credential.database,
		});

		try {
			await client.connect();
			const channelName = this.channelPrefix + event;
			const message = JSON.stringify(payload);
			await client.publish(channelName, message);
		} catch (e) {
			throw new NodeOperationError(fn.getNode(), e);
		}
		finally {
			try {
				await client.quit();
			} catch (e) {
				// ignore
			}
		}
	}
}
