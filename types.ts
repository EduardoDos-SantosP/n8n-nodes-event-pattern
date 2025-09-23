import { ChannelProvider } from './channels/ChannelProvider';

export type IEvent = {
	eventName: string;
};

export type ChannelCredentialName = keyof ChannelProvider['channels'];
