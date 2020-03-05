import * as RomiCore from '@osrf/romi-js-core-interfaces';
import RclnodejsTransport from '../lib';

async function openDoors(): Promise<void> {
  const transport = await RclnodejsTransport.create('example');

  const buildingMap = (await transport.call(RomiCore.getBuildingMap, {})).building_map;

  const pub = transport.createPublisher(RomiCore.doorRequests);
  for (const level of buildingMap.levels) {
    for (const door of level.doors) {
      pub.publish({
        door_name: door.name,
        request_time: RomiCore.toRosTime(new Date()),
        requested_mode: { value: RomiCore.DoorMode.MODE_OPEN },
        requester_id: 'example',
      });
    }
  }
}

openDoors();
