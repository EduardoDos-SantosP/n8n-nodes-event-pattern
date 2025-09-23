/// <reference types="jest" />
import { RedisChannel } from '../../../channels/redis/RedisChannel';

jest.mock('redis', () => ({
  createClient: jest.fn(),
}));

import { createClient as mockedCreateClient } from 'redis';

type MockClient = {
  connect: jest.Mock<Promise<void>, []>;
  ping: jest.Mock<Promise<string>, []>;
  pSubscribe: jest.Mock<Promise<void>, [string, (message: string) => void]>;
  pUnsubscribe: jest.Mock<Promise<void>, []>;
  quit: jest.Mock<Promise<void>, []>;
  publish: jest.Mock<Promise<void>, [string, string]>;
  destroy: jest.Mock<void, []>;
};

function makeMockClient(): MockClient {
  return {
    connect: jest.fn().mockResolvedValue(undefined),
    ping: jest.fn().mockResolvedValue('PONG'),
    pSubscribe: jest.fn().mockResolvedValue(undefined),
    pUnsubscribe: jest.fn().mockResolvedValue(undefined),
    quit: jest.fn().mockResolvedValue(undefined),
    publish: jest.fn().mockResolvedValue(undefined),
    destroy: jest.fn(),
  };
}

function makeFunctionsBase(getModeValue: 'trigger' | 'manual' = 'manual') {
  const emit = jest.fn();
  const helpers = { returnJsonArray: (data: any) => data };
  return {
    getCredentials: jest.fn().mockResolvedValue({
      host: 'localhost',
      port: 6379,
      ssl: false,
      database: 0,
    }),
    logger: { info: jest.fn() },
    emit,
    helpers,
    getMode: jest.fn().mockReturnValue(getModeValue),
  } as any;
}

describe('RedisChannel', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('publish connects, pings, publishes, and quits', async () => {
    const mockClient = makeMockClient();
    (mockedCreateClient as jest.Mock).mockReturnValue(mockClient);

    const redisChannel = new RedisChannel();
    const fn = makeFunctionsBase('manual');

    await redisChannel.publish('my-event', 'payload-data', fn as any);

    expect(mockedCreateClient).toHaveBeenCalled();
    expect(mockClient.connect).toHaveBeenCalled();
    expect(mockClient.ping).toHaveBeenCalled();
    expect(mockClient.publish).toHaveBeenCalledWith('n8n-event-pattern-my-event', 'payload-data');
    expect(mockClient.quit).toHaveBeenCalled();
  });

  test('trigger manualTriggerFunction resolves on message and emit is called', async () => {
    const mockClient = makeMockClient();

    // pSubscribe should call the provided callback immediately to simulate a message
    mockClient.pSubscribe.mockImplementationOnce(async (_channel: string, cb: (message: string) => void) => {
      // simulate asynchronous message delivery
      setTimeout(() => cb(JSON.stringify({ hello: 'world' })), 0);
    });

    (mockedCreateClient as jest.Mock).mockReturnValue(mockClient);

    const redisChannel = new RedisChannel();
    const fn = makeFunctionsBase('manual');

    const triggerResponse = await redisChannel.trigger('my-event', fn as any);

    // manualTriggerFunction should resolve when a message is received
    if (triggerResponse.manualTriggerFunction) {
      await triggerResponse.manualTriggerFunction();
    }

    // the emit function should have been called with the event data
    expect(fn.emit).toHaveBeenCalled();

    // close function should unsubscribe and quit
    await triggerResponse.closeFunction();
    expect(mockClient.pUnsubscribe).toHaveBeenCalled();
    expect(mockClient.quit).toHaveBeenCalled();
  });

  test('trigger in "trigger" mode subscribes and onMessage invokes emit', async () => {
    const mockClient = makeMockClient();

    // Capture the onMessage callback so we can invoke it later
    let savedCallback: ((message: string) => void) | undefined;
    mockClient.pSubscribe.mockImplementation(async (_channel: string, cb: (message: string) => void) => {
      savedCallback = cb;
      return Promise.resolve();
    });

    (mockedCreateClient as jest.Mock).mockReturnValue(mockClient);

    const redisChannel = new RedisChannel();
    const fn = makeFunctionsBase('trigger');

    const triggerResponse = await redisChannel.trigger('another-event', fn as any);

    // simulate message arriving
    expect(savedCallback).toBeDefined();
    savedCallback && savedCallback(JSON.stringify({ foo: 'bar' }));

    expect(fn.emit).toHaveBeenCalled();

    // ensure close unsubscribes and quits
    await triggerResponse.closeFunction();
    expect(mockClient.pUnsubscribe).toHaveBeenCalled();
    expect(mockClient.quit).toHaveBeenCalled();
  });
});
