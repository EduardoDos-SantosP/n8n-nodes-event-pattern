import { ITriggerFunctions, ITriggerResponse } from 'n8n-workflow';
import { EventChannel } from '../EventChannel';

export class PostgresChannel extends EventChannel<'postgres'> {
	readonly credentialName = 'postgres';
	readonly inactive = true;
	trigger(event: string, fn: ITriggerFunctions): Promise<ITriggerResponse> {
		throw new Error('Method not implemented.');
	}

	async publish(event: string, payload: object): Promise<void> {
		// Postgres channel is inactive in this implementation stub.
		// If later implemented, this should perform a pg NOTIFY.
		throw new Error('PostgresChannel.publish is not implemented');
	}
}
