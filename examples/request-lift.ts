import * as RomiCore from '@romi/core';
import RclnodejsTransport from '../lib';

async function requestLift(): Promise<void> {
  const transport = await RclnodejsTransport.create('example');

  const buildingMap = (await transport.call(RomiCore.getBuildingMap, {})).building_map;

  const lift = buildingMap.lifts[0];
  const request: RomiCore.LiftRequest = {
    destination_floor: lift.levels[0],
    door_state: RomiCore.LiftRequest.DOOR_OPEN,
    lift_name: lift.name,
    request_time: RomiCore.toRosTime(new Date()),
    request_type: RomiCore.LiftRequest.REQUEST_AGV_MODE,
    session_id: 'example',
  };
  const pub = transport.createPublisher(RomiCore.liftRequests);
  pub.publish(request);
}

requestLift();
