import {
  DurabilityPolicy,
  HistoryPolicy,
  Options,
  Publisher,
  ReliabilityPolicy,
  RomiService,
  RomiTopic,
  Service,
  Subscription,
  SubscriptionCb,
  Transport,
  TransportEvents,
} from '@osrf/romi-js-core-interfaces/transport';
import * as rclnodejs from 'rclnodejs';

export class RclnodejsTransport extends TransportEvents implements Transport {
  static async create(nodeName: string): Promise<RclnodejsTransport> {
    try {
      const rosArgs: string[] | undefined = process.env['RCLNODEJS_ROS_ARGS']
        ? JSON.parse(process.env['RCLNODEJS_ROS_ARGS'])
        : undefined;
      await rclnodejs.init(undefined, rosArgs);
    } catch (e) {
      if ((e as Error).message !== 'The context has already been initialized.') {
        throw e;
      }
    }
    return new RclnodejsTransport(nodeName);
  }

  static toRclnodejsTypeClass(
    topicOrService: RomiTopic<unknown> | RomiService<unknown, unknown>,
  ): rclnodejs.TypeClass {
    return topicOrService.type as rclnodejs.TypeClass;
  }

  static toRclnodejsOptions(options: Options): rclnodejs.Options {
    const rclOptions: rclnodejs.Options = {};

    if (options.qos) {
      rclOptions.qos = new rclnodejs.QoS();

      if (options.qos.depth) {
        rclOptions.qos.depth = options.qos.depth;
      }

      // prettier-ignore
      /* eslint-disable max-len */
      switch (options.qos.historyPolicy) {
        case HistoryPolicy.KeepLast:
          rclOptions.qos.history = rclnodejs.QoS.HistoryPolicy.RMW_QOS_POLICY_HISTORY_KEEP_LAST;
          break;
        case HistoryPolicy.KeepAll:
          rclOptions.qos.history = rclnodejs.QoS.HistoryPolicy.RMW_QOS_POLICY_HISTORY_KEEP_ALL;
          break;
        case HistoryPolicy.SystemDefault:
        default:
          rclOptions.qos.history = rclnodejs.QoS.HistoryPolicy.RMW_QOS_POLICY_HISTORY_SYSTEM_DEFAULT;
      }
      /* eslint-enable max-len */

      // rclnodes reliability type information is broken, should be a value instead of a function
      // prettier-ignore
      /* eslint-disable max-len, @typescript-eslint/no-explicit-any */
      switch (options.qos.reliabilityPolicy) {
        case ReliabilityPolicy.BestEffort:
          (rclOptions.qos.reliability as any) = rclnodejs.QoS.ReliabilityPolicy.RMW_QOS_POLICY_RELIABILITY_BEST_EFFORT;
          break;
        case ReliabilityPolicy.Reliable:
          (rclOptions.qos.reliability as any) = rclnodejs.QoS.ReliabilityPolicy.RMW_QOS_POLICY_RELIABILITY_RELIABLE;
          break;
        case ReliabilityPolicy.SystemDefault:
        default:
          (rclOptions.qos.reliability as any) = rclnodejs.QoS.ReliabilityPolicy.RMW_QOS_POLICY_RELIABILITY_SYSTEM_DEFAULT;
      }
      /* eslint-enable max-len, @typescript-eslint/no-explicit-any */

      // prettier-ignore
      /* eslint-disable max-len */
      switch (options.qos.durabilityPolicy) {
        case DurabilityPolicy.TransientLocal:
          rclOptions.qos.durability = rclnodejs.QoS.DurabilityPolicy.RMW_QOS_POLICY_DURABILITY_TRANSIENT_LOCAL;
          break;
        case DurabilityPolicy.Volatile:
          rclOptions.qos.durability = rclnodejs.QoS.DurabilityPolicy.RMW_QOS_POLICY_DURABILITY_VOLATILE;
          break;
        case DurabilityPolicy.SystemDefault:
        default:
          rclOptions.qos.durability = rclnodejs.QoS.DurabilityPolicy.RMW_QOS_POLICY_DURABILITY_SYSTEM_DEFAULT;
      }
      /* eslint-enable max-len */
    }

    return rclOptions;
  }

  get name(): string {
    return this._node.name();
  }

  get rclnodejsNode(): rclnodejs.Node {
    return this._node;
  }

  createPublisher<Message>(topic: RomiTopic<Message>, options?: Options): Publisher<Message> {
    options = options ? options : topic.options ? topic.options : undefined;
    const rclOptions = options ? RclnodejsTransport.toRclnodejsOptions(options) : undefined;
    return this._node.createPublisher(
      RclnodejsTransport.toRclnodejsTypeClass(topic),
      topic.topic,
      rclOptions,
    );
  }

  subscribe<Message>(
    topic: RomiTopic<Message>,
    cb: SubscriptionCb<Message>,
    options?: Options,
  ): Subscription {
    options = options ? options : topic.options ? topic.options : undefined;

    // type information for Node.createSubscription is broken, options can be undefined.
    /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
    const rclOptions = options
      ? RclnodejsTransport.toRclnodejsOptions(options)
      : (undefined as any);

    const rosSub = this._node.createSubscription(
      RclnodejsTransport.toRclnodejsTypeClass(topic),
      topic.topic,
      rclOptions,
      (msg) => cb(topic.validate(msg)),
    );

    return {
      unsubscribe: (): void => {
        this._node.destroySubscription(rosSub);
      },
    };
  }

  async call<Request, Response>(
    service: RomiService<Request, Response>,
    req: Request,
  ): Promise<Response> {
    let client = this._clients.get(service.service);
    if (client === undefined) {
      client = this._node.createClient(
        RclnodejsTransport.toRclnodejsTypeClass(service),
        service.service,
      );
      this._clients.set(service.service, client);
    }
    if (!(await client.waitForService(10000))) {
      throw new Error('service not available');
    }
    return new Promise((res) => {
      if (client) {
        client.sendRequest(req, (resp) => {
          res(service.validateResponse(resp));
        });
      }
    });
  }

  createService<Request extends unknown, Response extends unknown>(
    service: RomiService<Request, Response>,
  ): Service<Request, Response> {
    let rclService: rclnodejs.Service;
    return {
      start: (handler: (req: Request) => Promise<Response> | Response): void => {
        if (rclService) {
          throw new Error('service already started');
        }
        rclService = this._node.createService(
          RclnodejsTransport.toRclnodejsTypeClass(service),
          service.service,
          {},
          (req, resp) => {
            const result = handler(service.validateRequest(req));
            if (result instanceof Promise) {
              (result as Promise<rclnodejs.Message>).then((x) => resp.send(x));
            } else {
              resp.send(result as rclnodejs.Message);
            }
          },
        );
      },
      stop: (): void => {
        rclService && this._node.destroyService(rclService);
      },
    };
  }

  destroy(): void {
    this._node.destroy();
  }

  private _node: rclnodejs.Node;
  private _clients = new Map<string, rclnodejs.Client>();

  private constructor(nodeName: string) {
    super();
    this._node = rclnodejs.createNode(nodeName);
    rclnodejs.spin(this._node);
  }
}
