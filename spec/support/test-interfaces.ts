import { RomiService, RomiTopic } from '@osrf/romi-js-core-interfaces';

export interface StdmsgString {
  data: string;
}

export const testTopic: RomiTopic<StdmsgString> = {
  topic: 'test_topic',
  type: 'std_msgs/msg/String',
  validate: msg => msg,
};

export interface SetBoolRequest {
  data: boolean;
}

export interface SetBoolResponse {
  success: boolean;
  message: string;
}

export const testService: RomiService<SetBoolRequest, SetBoolResponse> = {
  validateRequest: msg => msg,
  validateResponse: msg => msg,
  type: 'std_srvs/srv/SetBool',
  service: 'test_service',
};
