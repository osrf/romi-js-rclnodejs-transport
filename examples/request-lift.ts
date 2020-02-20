import * as romi_core from '@osrf/romi-js-core-interfaces';
import RclnodejsTransport from '../lib';

async function requestLift(): Promise<void> {
  const transport = await RclnodejsTransport.create('example');

  const buildingMap = (await transport.call(romi_core.getBuildingMap, {})).building_map;

  const lift = buildingMap.lifts[0];
  const request: romi_core.LiftRequest = {
    destination_floor: lift.levels[0],
    door_state: romi_core.LiftRequest.DOOR_OPEN,
    lift_name: lift.name,
    request_time: romi_core.toRosTime(new Date()),
    request_type: romi_core.LiftRequest.REQUEST_AGV_MODE,
    session_id: 'example',
  };
  const pub = transport.createPublisher(romi_core.liftRequests);
  pub.publish(request);
}

requestLift();
