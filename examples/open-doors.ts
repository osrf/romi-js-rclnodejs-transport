import * as romi_core from '@osrf/romi-js-core-interfaces';
import RclnodejsTransport from '../lib';

async function openDoors(): Promise<void> {
  const transport = await RclnodejsTransport.create('example');

  const buildingMap = (await transport.call(romi_core.getBuildingMap, {})).building_map;

  const pub = transport.createPublisher(romi_core.doorRequests);
  for (const level of buildingMap.levels) {
    for (const door of level.doors) {
      pub.publish({
        door_name: door.name,
        request_time: romi_core.toRosTime(new Date()),
        requested_mode: { value: romi_core.DoorMode.MODE_OPEN },
        requester_id: 'example',
      });
    }
  }
}

openDoors();
