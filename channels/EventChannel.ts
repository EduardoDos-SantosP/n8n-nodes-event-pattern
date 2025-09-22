import { IExecuteFunctions, ITriggerFunctions, type ITriggerResponse } from 'n8n-workflow';
import { ChannelCredentialName } from '../types';

export abstract class EventChannel<TName extends ChannelCredentialName = ChannelCredentialName, TCredential = any> {
	readonly inactive: boolean = false;
	abstract readonly credentialName: TName;
	abstract trigger(event: string, fn: ITriggerFunctions): Promise<ITriggerResponse>;

	abstract publish(event: string, payload: object, nodeExecution?: IExecuteFunctions): Promise<void>;

	getCredential(nodeExecution: any): TCredential {
		return nodeExecution.getCredentials(this.credentialName) as TCredential;
	}
}
