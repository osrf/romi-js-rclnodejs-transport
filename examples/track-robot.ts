import * as RomiCore from '@romi/core';
import RclnodejsTransport from '../lib';

async function trackRobot(): Promise<void> {
  const transport = await RclnodejsTransport.create('example');

  transport.subscribe(RomiCore.fleetStates, fleetState => {
    for (const robot of fleetState.robots) {
      console.log(robot.name, robot.location);
    }
  });
}

trackRobot();
