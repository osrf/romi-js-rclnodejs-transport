import * as RomiCore from '@osrf/romi-js-core-interfaces';
import RclnodejsTransport from '@osrf/romi-js-rclnodejs-transport';

//example of how one could publish fleet state to the  web

async function pub(): Promise<void> {
    const transport = await RclnodejsTransport.create("example");

    const pub= transport.createPublisher(RomiCore.fleetStates);
    let list=[4,5,6];
    let msg:RomiCore.FleetState = {
        name:           "WebRobofleet",
        robots: []
    }
    for (let i in list){
        msg.robots.push(retRobo(i));
    }
    var someTimer = setInterval(()=>{
        pub.publish(msg);
        console.log("Published");
    },5000);
    




}


function retRobo(i: string) {
    let someName:string ="WebRobo"+i;
    //let r = RomiCore.RobotState;
    let v:RomiCore.RobotState = {
        name:               someName,
        model:              "webrobo2020",
        mode:               new RomiCore.RobotMode(0),
        task_id:            "adada",
        path:               [],
        battery_percent:    50,
        location: {
                            t:          RomiCore.toRosTime(new Date()),
                            x:          100,
                            y:          100,
                            yaw:        0,
                            level_name: "ground_floor"

        }
    }
    return v;
}

pub();