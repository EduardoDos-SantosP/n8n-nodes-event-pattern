import {
	type INodeType,
	type INodeTypeDescription,
	type ITriggerFunctions,
	type ITriggerResponse,
	type NodeConnectionType,
	NodeOperationError,
} from 'n8n-workflow';
import { ChannelProvider } from '../../channels/ChannelProvider';
import { eventIcon } from '../../constants';
import { EventPatternApi } from '../../credentials/EventPatternApi.credentials';

const provider = new ChannelProvider();

export class EventListenerTrigger implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Event Listener Trigger',
		name: 'eventListenerTrigger',
		icon: eventIcon,
		group: ['trigger'],
		version: 1,
		subtitle: 'Listens for configured events',
		description: 'Trigger that listens for configured events via the selected channel',
		defaults: {
			name: 'Event Listener Trigger',
		},
		inputs: [],
		outputs: [<NodeConnectionType>'main'],
		credentials: provider.toCredentialDescriptions(),
		properties: [provider.getChannelNodeProperty(), new EventPatternApi().properties[0]],
	};

	async trigger(this: ITriggerFunctions): Promise<ITriggerResponse> {
		this.logger.debug('Event Listener Trigger started');

		const channel = provider.getChannel(this);

		const event = this.getNodeParameter(EventPatternApi.credentialName) as string;
		if (!event) {
			throw new NodeOperationError(this.getNode(), 'Event name not set');
		}

		return await channel.trigger(event, this);
	}
}
