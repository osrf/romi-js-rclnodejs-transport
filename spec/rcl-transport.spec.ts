import * as rclnodejs from 'rclnodejs';
import RclnodejsTransport from '../lib';
import { testService, testTopic } from './support/test-interfaces';

describe('rcl transport tests', () => {
  let node: rclnodejs.Node;
  let transport: RclnodejsTransport;

  beforeAll(async () => {
    await rclnodejs.init();
  });

  beforeEach(async () => {
    node = rclnodejs.createNode('test_node');
    rclnodejs.spin(node);
    transport = await RclnodejsTransport.create('romi_js_integration_test');
  });

  afterEach(async () => {
    node.destroy();
    transport.destroy();
  });

  afterAll(() => {
    if (!rclnodejs.isShutdown()) {
      rclnodejs.shutdown();
    }
  });

  itt('publish subscribe loopback', done => {
    transport.subscribe(testTopic, msg => {
      expect(msg.data).toBe('test');
      done();
    });

    const publisher = transport.createPublisher(testTopic);
    publisher.publish({ data: 'test' });
  });

  itt('service loopback', async () => {
    const service = transport.createService(testService);
    service.start(() => ({ message: 'success', success: true }));
    const result = await transport.call(testService, { data: true });
    expect(result.message).toBe('success');
    expect(result.success).toBe(true);
  });

  itt('async service loopback', async () => {
    const service = transport.createService(testService);
    service.start(async () => {
      await new Promise(res => setTimeout(res, 100));
      return { message: 'success', success: true };
    });
    const result = await transport.call(testService, { data: true });
    expect(result.message).toBe('success');
    expect(result.success).toBe(true);
  });
});
