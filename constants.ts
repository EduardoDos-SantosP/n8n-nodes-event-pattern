import { INodeCredentialDescription } from 'n8n-workflow';
import { EventPatternApi } from './credentials/EventPatternApi.credentials';

export const channelPropertyName = 'channel';
export const eventIcon = 'file:icon.svg';

export const eventCredentialDescription: INodeCredentialDescription = {
	displayName: 'Event Name Credential',
	name: EventPatternApi.credentialName,
	required: true,
};
