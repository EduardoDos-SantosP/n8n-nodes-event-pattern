import { INodeTypeBaseDescription } from 'n8n-workflow';
import { eventIcon } from './constants';

export const eventListenerNodeBaseDescription: INodeTypeBaseDescription = {
	displayName: 'Event Listener Trigger',
	name: 'eventListenerTrigger',
	icon: eventIcon,
	group: ['trigger'],
	subtitle: 'Listens for configured events',
	description: 'Trigger that listens for configured events via the selected channel',
};
