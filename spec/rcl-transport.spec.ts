import { RomiService, RomiTopic } from '@osrf/romi-js-core-interfaces';
import * as rclnodejs from 'rclnodejs';
import RclnodejsTransport from '../lib';

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
    rclnodejs.shutdown();
  });

  itt('publish subscribe loopback', done => {
    const testTopic: RomiTopic = {
      type: 'std_msgs/msg/String',
      topic: 'test_topic',
    };

    transport.subscribe(testTopic, msg => {
      expect(msg.data).toBe('test');
      done();
    });

    const publisher = transport.createPublisher(testTopic);
    publisher.publish({ data: 'test' });
  });

  itt('call service', done => {
    const testService: RomiService = {
      type: 'std_srvs/srv/Empty',
      service: 'test_service',
    };

    node.createService(testService.type as rclnodejs.TypeClass, testService.service, {}, () => {
      done();
    });

    transport.call(testService, {});
  });
});
