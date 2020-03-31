import { RomiTopic } from '@osrf/romi-js-core-interfaces';

export interface StdmsgString {
  data: string;
}

export const testTopic: RomiTopic<StdmsgString> = {
  topic: 'test_topic',
  type: 'std_msgs/msg/String',
  validate: msg => msg,
};
