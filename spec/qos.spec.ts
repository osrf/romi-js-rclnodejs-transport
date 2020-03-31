import {
  DurabilityPolicy,
  RomiTopic,
  HistoryPolicy,
  ReliabilityPolicy,
} from '@osrf/romi-js-core-interfaces/transport';
import * as rclnodejs from 'rclnodejs';
import RclnodejsTransport from '../lib';
import { StdmsgString, testTopic } from './support/test-interfaces';

let transport: RclnodejsTransport;
let node: rclnodejs.Node;

describe('qos', () => {
  beforeAll(async () => {
    await rclnodejs.init();
  });

  afterAll(() => {
    if (!rclnodejs.isShutdown()) {
      rclnodejs.shutdown();
    }
  });

  beforeEach(async () => {
    transport = await RclnodejsTransport.create('testTransport');
    node = rclnodejs.createNode('testNode');
    rclnodejs.spin(node);
  });

  afterEach(() => {
    transport.destroy();
    node.destroy();
  });

  it('supports transient local', async done => {
    const topic: RomiTopic<StdmsgString> = {
      ...testTopic,
      options: {
        qos: {
          historyPolicy: HistoryPolicy.KeepLast,
          depth: 10,
          reliabilityPolicy: ReliabilityPolicy.Reliable,
          durabilityPolicy: DurabilityPolicy.TransientLocal,
        },
      },
    };

    const qos = new rclnodejs.QoS(
      rclnodejs.QoS.HistoryPolicy.RMW_QOS_POLICY_HISTORY_KEEP_LAST,
      10,
      rclnodejs.QoS.ReliabilityPolicy.RMW_QOS_POLICY_RELIABILITY_RELIABLE,
      rclnodejs.QoS.DurabilityPolicy.RMW_QOS_POLICY_DURABILITY_TRANSIENT_LOCAL,
    );
    const publisher = node.createPublisher('std_msgs/msg/String', 'test_topic', {
      qos,
    });
    publisher.publish({ data: 'something' });

    // subscribe after the publishing, if QoS works we should get the last published
    // messages.
    transport.subscribe(topic, () => done());
  });

  it('transport options take precedence', async done => {
    const topic: RomiTopic<StdmsgString> = {
      ...testTopic,
      options: {
        qos: {
          historyPolicy: HistoryPolicy.KeepLast,
          depth: 10,
          reliabilityPolicy: ReliabilityPolicy.Reliable,
          durabilityPolicy: DurabilityPolicy.Volatile,
        },
      },
    };

    const qos = new rclnodejs.QoS(
      rclnodejs.QoS.HistoryPolicy.RMW_QOS_POLICY_HISTORY_KEEP_LAST,
      10,
      rclnodejs.QoS.ReliabilityPolicy.RMW_QOS_POLICY_RELIABILITY_RELIABLE,
      rclnodejs.QoS.DurabilityPolicy.RMW_QOS_POLICY_DURABILITY_TRANSIENT_LOCAL,
    );
    const publisher = node.createPublisher('std_msgs/msg/String', 'test_topic', {
      qos,
    });
    publisher.publish({ data: 'something' });

    // qos options defined in the interface would not receive previous messages, if the transport
    // options take precedence we should get those messages.
    transport.subscribe(topic, () => done(), {
      qos: {
        historyPolicy: HistoryPolicy.KeepLast,
        depth: 10,
        reliabilityPolicy: ReliabilityPolicy.Reliable,
        durabilityPolicy: DurabilityPolicy.TransientLocal,
      },
    });
  });
});
