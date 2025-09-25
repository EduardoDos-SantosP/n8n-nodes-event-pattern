import { EventRepository } from './EventRepository';
import { LocalFileSystemRepository } from './localFileSystem/LocalFileSystemRepository';

export class RepositoryProvider {
	getRepository(): EventRepository {
		return new LocalFileSystemRepository();
	}
}

export const repositoryProvider = new RepositoryProvider();