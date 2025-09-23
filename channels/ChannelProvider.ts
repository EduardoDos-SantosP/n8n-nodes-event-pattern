import {
	IExecuteFunctions,
	INodeProperties,
	INodePropertyOptions,
	ITriggerFunctions,
	NodeOperationError,
} from 'n8n-workflow';
import { channelPropertyName } from '../constants';
import { ChannelCredentialName } from '../types';
import { EventChannel } from './EventChannel';
import { PostgresChannel } from './postgres/PostgresChannel';
import { RedisChannel } from './redis/RedisChannel';

export class ChannelProvider {
	readonly channels = {
		postgres: new PostgresChannel(),
		redis: new RedisChannel(),
	};

	get activeChannels(): EventChannel[] {
		return Object.values(this.channels)
			.filter(channel => !channel.inactive) as any as EventChannel[];
	}

	/** @description Get default event channel */
	get defaultChannel(): EventChannel {
		return this.activeChannels[0];
	}

	toCredentialOptions(): INodePropertyOptions[] {
		return this.activeChannels.map(channel => ({
			name: channel.credentialName[0].toUpperCase() + channel.credentialName.slice(1),
			value: channel.credentialName,
		}));
	}

	toCredentialDescriptions(): ({ name: ChannelCredentialName, required: true })[] {
		return this.activeChannels.map(channel => ({
			name: channel.credentialName,
			required: true,
		}));
	}

	getChannelNodeProperty(): INodeProperties {
		return {
			name: channelPropertyName,
			displayName: 'Channel',
			description: 'Which means will be used as a channel for the event',
			type: 'options',
			default: this.defaultChannel.credentialName,
			options: this.toCredentialOptions(),
		};
	}
	getChannel(fn: ITriggerFunctions): EventChannel;
	getChannel(fn: IExecuteFunctions, itemIndex: number): EventChannel;
	getChannel(fn: ITriggerFunctions | IExecuteFunctions, itemIndex?: number): EventChannel {
		const channelName = fn.getNodeParameter(channelPropertyName, itemIndex) as keyof ChannelProvider['channels'];
		if (!channelName) {
			throw new NodeOperationError(fn.getNode(), 'Channel not set');
		}
		const channel = this.channels[channelName];
		if (!channel) {
			throw new NodeOperationError(fn.getNode(), `Channel "${channelName}" not found`);
		}
		return channel;
	}
}
