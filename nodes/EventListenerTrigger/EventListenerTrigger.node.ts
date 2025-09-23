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
import { IEvent } from '../../types';

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
		credentials: [
			{
				name: EventPatternApi.credentialName,
				required: true,
			},
		].concat(provider.toCredentialDescriptions()),
		properties: [provider.getChannelNodeProperty()],
	};

	async trigger(this: ITriggerFunctions): Promise<ITriggerResponse> {
		this.logger.debug('Event Listener Trigger started');

		const channel = provider.getChannel(this);

		const event = await this.getCredentials<IEvent>(EventPatternApi.credentialName);
		if (!event) {
			throw new NodeOperationError(this.getNode(), 'Event name not set in Custom Event credential');
		}

		return await channel.trigger(event.eventName, this);
	}
}
