export type RedisCredential = {
	host: string;
	port: number;
	ssl?: boolean;
	disableTlsVerification?: boolean;
	database: number;
	user?: string;
	password?: string;
};
