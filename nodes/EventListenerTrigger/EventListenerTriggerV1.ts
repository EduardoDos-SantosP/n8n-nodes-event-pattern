import {
	type INodeType,
	type INodeTypeDescription,
	type ITriggerFunctions,
	type ITriggerResponse,
	type NodeConnectionType,
	NodeOperationError,
} from 'n8n-workflow';
import { ChannelProvider } from '../../channels/ChannelProvider';
import { EventPatternApi } from '../../credentials/EventPatternApi.credentials';
import { eventListenerNodeBaseDescription } from '../../utils';

const provider = new ChannelProvider();

export class EventListenerTriggerV1 implements INodeType {
	description: INodeTypeDescription = {
		...eventListenerNodeBaseDescription,
		defaults: {
			name: eventListenerNodeBaseDescription.displayName,
		},
		version: 1,
		inputs: [],
		outputs: [<NodeConnectionType>'main'],
		credentials: provider.toCredentialDescriptions(),
		properties: [provider.getChannelNodeProperty(), new EventPatternApi().properties[0]],
	};

	async trigger(this: ITriggerFunctions): Promise<ITriggerResponse> {
		this.logger.info('Event Listener Trigger started');

		const channel = provider.getChannel(this);

		const event = this.getNodeParameter(new EventPatternApi().properties[0].name!) as string;
		if (!event) {
			throw new NodeOperationError(this.getNode(), 'Event name not set');
		}

		return await channel.trigger(event, this);
	}
}
