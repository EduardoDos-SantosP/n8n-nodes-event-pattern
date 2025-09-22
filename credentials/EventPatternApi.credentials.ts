import type { Icon, ICredentialType, INodeProperties } from 'n8n-workflow';
import { eventIcon } from '../constants';

export class EventPatternApi implements ICredentialType {
	static readonly credentialName = 'eventPatternApi';

	name = EventPatternApi.credentialName;
	displayName = 'Event Name API';
	icon: Icon = eventIcon;

	properties: INodeProperties[] = [
		{
			displayName: 'Event Name',
			name: 'eventName',
			type: 'string',
			default: '',
			description: 'Event name to be emitted and listened to',
			placeholder: 'whatsapp.message.created',
			required: true,
		},
	];
}
