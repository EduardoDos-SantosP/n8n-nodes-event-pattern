import type {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
import { NodeConnectionType, NodeOperationError } from 'n8n-workflow';
import { ChannelProvider } from '../../channels/ChannelProvider';
import { eventIcon } from '../../constants';
import { EventPatternApi } from '../../credentials/EventPatternApi.credentials';
import { IEvent } from '../../types';

const provider = new ChannelProvider();

export class EventEmitter implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Custom Event Emitter',
		name: 'eventEmitter',
		icon: eventIcon,
		group: ['transform'],
		version: 1,
		description: 'Emit events via a pluggable channel (currently Redis)',
		defaults: {
			name: 'Custom Event Emitter',
		},
		inputs: [NodeConnectionType.Main],
		outputs: [NodeConnectionType.Main],
		credentials: [
			{
				name: EventPatternApi.credentialName,
				required: true,
			},
		].concat(provider.toCredentialDescriptions()),
		properties: [
			provider.getChannelNodeProperty(),
			{
				displayName: 'Event Payload',
				name: 'payload',
				type: 'json',
				default: {},
				description: 'Event data payload to be emitted',
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();

		const event = await this.getCredentials<IEvent>(EventPatternApi.credentialName);
		if (!event) {
			throw new NodeOperationError(this.getNode(), 'Event name not set in Custom Event credential');
		}

		const returnItems: INodeExecutionData[] = [];
		for (let i = 0; i < items.length; i++) {
			const item = items[i];
			try {
				const channel = provider.getChannel(this, i);

				const payload = this.getNodeParameter('payload', i, {}) as object;

				await channel.publish(event.eventName, payload, this);

				returnItems.push(item);
			} catch (error) {
				if (this.continueOnFail()) {
					returnItems.push({ json: { error: String(error) } });
				} else {
					throw new NodeOperationError(this.getNode(), error as Error, { itemIndex: i });
				}
			}
		}
		return [returnItems];
	}
}
