import { IExecuteFunctions, INodeTypeBaseDescription } from 'n8n-workflow';
import { eventIcon } from './constants';

export const eventListenerNodeBaseDescription: INodeTypeBaseDescription = {
	displayName: 'Event Listener Trigger',
	name: 'eventListenerTrigger',
	icon: eventIcon,
	group: ['trigger'],
	subtitle: 'Listens for configured events',
	description: 'Trigger that listens for configured events via the selected channel',
};

export function tryGetParameter<T>(fn: IExecuteFunctions, name: string, index: number): T | undefined {
	try {
		return fn.getNodeParameter(name, index) as T;
	} catch (e) {
		return undefined;
	}
}