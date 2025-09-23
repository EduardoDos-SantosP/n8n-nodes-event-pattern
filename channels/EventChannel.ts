import { FunctionsBase, IExecuteFunctions, ITriggerFunctions, type ITriggerResponse } from 'n8n-workflow';
import { ChannelCredentialName } from '../types';

export abstract class EventChannel<TName extends ChannelCredentialName = ChannelCredentialName, TCredential = any> {
	readonly inactive: boolean = false;
	abstract readonly credentialName: TName;
	abstract trigger(event: string, fn: ITriggerFunctions): Promise<ITriggerResponse>;

	abstract publish(event: string, payload: string, nodeExecution?: IExecuteFunctions): Promise<void>;

	getCredential(fn: FunctionsBase): TCredential {
		return fn.getCredentials(this.credentialName) as TCredential;
	}
}
