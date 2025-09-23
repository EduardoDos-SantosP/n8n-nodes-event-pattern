import {
	FunctionsBase,
	IExecuteFunctions,
	ITriggerFunctions,
	type ITriggerResponse,
} from 'n8n-workflow';
import { ChannelCredentialName } from '../types';

export abstract class EventChannel<
	TName extends ChannelCredentialName = ChannelCredentialName,
	TCredential extends object = any,
> {
	readonly inactive: boolean = false;
	abstract readonly credentialName: TName;
	abstract trigger(event: string, fn: ITriggerFunctions): Promise<ITriggerResponse>;

	abstract publish(
		event: string,
		payload: string,
		nodeExecution?: IExecuteFunctions,
	): Promise<void>;

	async getCredential(fn: FunctionsBase): Promise<TCredential> {
		const credential = await fn.getCredentials<TCredential>(this.credentialName);
		fn.logger.info(`Using credential: ${this.credentialName}: ${JSON.stringify(credential)}`);
		return credential;
	}
}
