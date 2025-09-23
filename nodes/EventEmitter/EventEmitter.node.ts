import type {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
import { type NodeConnectionType, NodeOperationError } from 'n8n-workflow';
import { ChannelProvider } from '../../channels/ChannelProvider';
import { eventIcon } from '../../constants';
import { EventPatternApi } from '../../credentials/EventPatternApi.credentials';

const provider = new ChannelProvider();

export class EventEmitter implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Event Emitter',
		name: 'eventEmitter',
		icon: eventIcon,
		group: ['transform'],
		version: 1,
		description: 'Emit events via a pluggable channel (currently Redis)',
		defaults: {
			name: 'Event Emitter',
		},
		inputs: [<NodeConnectionType>'main'],
		outputs: [<NodeConnectionType>'main'],
		credentials: provider.toCredentialDescriptions(),
		properties: [
			provider.getChannelNodeProperty(),
			new EventPatternApi().properties[0],
			{
				displayName: 'Event Payload',
				name: 'payload',
				type: 'json',
				default: '{}',
				description: 'Event data payload to be emitted',
				required: true,
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();

		const returnItems: INodeExecutionData[] = [];
		for (let i = 0; i < items.length; i++) {
			const item = items[i];
			try {
				const channel = provider.getChannel(this, i);

				const payload = this.getNodeParameter('payload', i, {}) as string;

				const event = this.getNodeParameter(new EventPatternApi().properties[0].name, i) as string;
				if (!event) {
					throw new NodeOperationError(this.getNode(), 'Event name not set');
				}

				await channel.publish(event, payload, this);

				returnItems.push(item);
			} catch (error) {
				if (this.continueOnFail()) {
					returnItems.push({
						json: {
							error: error.message,
						},
						pairedItem: { item: i },
					});
				} else {
					throw new NodeOperationError(this.getNode(), error as Error, { itemIndex: i });
				}
			}
		}
		return [returnItems];
	}
}
