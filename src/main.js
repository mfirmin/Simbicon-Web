var $           = require('jquery');

var World       = require('./world/world');
var Sphere      = require('./entity/sphere');
var Box         = require('./entity/box');
var Capsule     = require('./entity/capsule');
var Cylinder    = require('./entity/cylinder');
var Hinge       = require('./joints/hinge');
var Ball        = require('./joints/ball');

var Character   = require('./character');

var PDController = require('./controller/pdcontroller');
var VPDController = require('./controller/vpdcontroller');

var FPS = 1/30;
var dt = 0.0001;

window.initialize = function() {

    var world = new World({FPS: FPS, dt: dt});
    var ground = new Box('ground', [100,1,1], {mass: 0, color: [0,0,255]});
    ground.setPosition([0,-.5,0]);
    world.addEntity(ground, {shader: {fragmentShader: 'ground_fragShader', vertexShader: 'ground_vertShader'}});

    // MAKE HUMAN!

    var humanoid = new Character('human');

    humanoid.setFromJSON(human);

    world.addCharacter(humanoid);

    /*
    for (var e in human.parts) {
        var eInfo = human.parts[e];

        var entity;
        switch (eInfo.type) {
            case "SPHERE": 
                entity = new Sphere(e, eInfo.radius, { "mass": eInfo.mass });
                break;
            case "CAPSULE": 
                entity = new Capsule(e, (eInfo.radiusTop + eInfo.radiusBottom)/2.0, eInfo.height, {"mass": eInfo.mass});
                break;
            case "BOX":
                entity = new Box(e, eInfo.sides, { "mass": eInfo.mass });
                break;
            default:
                throw "Unknown Entity type: " + eInfo.type;
        }
        entity.setPosition(eInfo.position);
        var offset = 0.01;
        if (e === 'rForearm' || e === 'rArm') {
            offset += .065;
        } else if (e === 'rHand') {
            offset += .08;
        } else if (e === 'lForearm' || e === 'lArm') {
            offset += -.065;
        } else if (e === 'lHand') {
            offset += -.08;
        } else if (e === 'rShin') {
            offset += .04;
        } else if (e === 'lShin') {
            offset += .04;
        } else if (e === 'rThigh') {
            offset += -.008;
        } else if (e === 'rFoot' || e === 'lFoot') {
            offset += .2;
        } 
        world.addEntity(entity, {"mesh": {"faces": mesh[e].faces, "vertices": mesh[e].vertices, "color": mesh[e].color, "lineOffset": offset}});
    }

    for (var j in human.joints) {
        var jInfo = human.joints[j];

        var joint;
        switch(jInfo.type) {
            case "HINGE":
                joint = new Hinge(j, 
                                  {"A": jInfo.A, "B": jInfo.B}, 
                                  jInfo.position, 
                                  jInfo.axis, 
                                  {"lo": jInfo.min[2], "hi": jInfo.max[2]});

                break;
            default:
                throw "Unknown Joint type: " + jInfo.type;
        }
        world.addJoint(joint, {render: false});
    }
    */

    var controllers = {};

    var simbiconParams = {
        dt: .3,
        cde: 0,
        cdo: -2.2,
        cve: -.2,
        cvo: 0,
        tor: 0.,
        swhe: -.4,
        swho: .7,
        swke:  1.1,
        swko: .05,
        stke: .05,
        stko: .1,
        ankle: -.2,
    }

    window.setSimbiconParameters = function(set) {
        for (var entry in set) {
            simbiconParams[entry] = set[entry];
        }
    };

    for (var name in human.joints) {
        controllers['human.'+name] = new PDController(world.joints['human.'+name], 0);
    }

    var rHip_uTorsoVPD = new VPDController(world.joints['human.rHip'], world.entities['human.uTorso'], 0, {kp: 300, kd: 30});
    var lHip_lThighVPD = new VPDController(world.joints['human.lHip'], world.entities['human.lThigh'], 0, {kp: -300, kd: -30});

    var lHip_uTorsoVPD = new VPDController(world.joints['human.lHip'], world.entities['human.uTorso'], 0, {kp: 300, kd: 30});
    var rHip_rThighVPD = new VPDController(world.joints['human.rHip'], world.entities['human.rThigh'], 0, {kp: -300, kd: -30});

    var lHip = world.joints['human.lHip'];
    var rHip = world.joints['human.rHip'];


    var COM = { color: [255,0,0], position: [0,1,0], getRadius: function() { return .06; }};

//    var comObj = world.renderer.addSphere(COM);
 //   comObj.position.y = 1;
  //  world.renderer.scene.add(comObj);

    function getCOM() {
        var massTot = 0;
        var posTot = [0,0,0];
        for (var name in human.parts) {
            var pos = world.entities['human.'+name].getPosition();
            var mass = world.entities['human.'+name].getMass();

            posTot = [posTot[0] + pos[0]*mass,posTot[1] + pos[1]*mass,posTot[2] + pos[2]*mass];
            massTot += mass;
        }
        var ret = [posTot[0]/massTot, posTot[1]/massTot, 0];
        return ret;
    }

    var com_last = getCOM();

    var t = 0;
    var phase = 0;

window.simulationCallback = function(dt) {

    var com = getCOM();
    var com_vel = (com[0]-com_last[0])*(1.0/dt);

    com_last = [com[0], com[1], com[2]];

    t += dt;

    if (phase === 0) {


        // COMFB

        var d = com[0] - world.joints['human.rAnkle'].getPosition()[0];

        var optimizer = (simbiconParams.cde*d + simbiconParams.cve*com_vel);

        lHip_uTorsoVPD.goal = simbiconParams.tor;
        rHip_rThighVPD.goal = (simbiconParams.swhe + optimizer);

        var lh_ut_torque = lHip_uTorsoVPD.evaluate();
        lHip.addTorque(+lh_ut_torque);

        var rh_rt_torque = rHip_rThighVPD.evaluate();
        rHip.addTorque(+rh_rt_torque);
        lHip.addTorque(-rh_rt_torque);


        controllers['human.neck2head'].goal = 0;
        controllers['human.uTorso2neck'].goal = 0;
        controllers['human.waist'].goal = 0;
        controllers['human.waist'].kp = 600;
        controllers['human.waist'].kd = 60;

        controllers['human.lTorso2uTorso'].goal = 0;
        controllers['human.lTorso2uTorso'].kp = 600;
        controllers['human.lTorso2uTorso'].kd = 60;

        controllers['human.lWrist'].goal = 0;
        controllers['human.lWrist'].kp = 5;
        controllers['human.lWrist'].kd = 3;

        controllers['human.rWrist'].goal = 0;
        controllers['human.rWrist'].kp = 5;
        controllers['human.rWrist'].kd = 3;

        controllers['human.rKnee'].goal = simbiconParams.swke;

        controllers['human.rAnkle'].goal = simbiconParams.ankle;

        controllers['human.lKnee'].goal = simbiconParams.stke;

        controllers['human.lAnkle'].goal = simbiconParams.ankle;

        controllers['human.rShoulder'].goal = .3;
        controllers['human.rShoulder'].kp = 100;
        controllers['human.rShoulder'].kd = 30;

        controllers['human.rElbow'].goal = 0;
        controllers['human.rElbow'].kp = 100;
        controllers['human.rElbow'].kd = 30;


        controllers['human.lShoulder'].goal = -.3;
        controllers['human.lShoulder'].kp = 100;
        controllers['human.lShoulder'].kd = 30;

        controllers['human.rElbow'].goal = -.4;
        controllers['human.rElbow'].kp = 100;
        controllers['human.rElbow'].kd = 30;
        if (t > simbiconParams.dt) {
            t = 0;
            phase = 1;
        }
    } else if (phase === 1) {

        var d = com[0] - world.joints['human.rAnkle'].getPosition()[0];

        var optimizer = simbiconParams.cdo*d + simbiconParams.cvo*com_vel;

        controllers['human.rKnee'].goal = simbiconParams.swko;
        controllers['human.lKnee'].goal = simbiconParams.stko;

        lHip_uTorsoVPD.goal = simbiconParams.tor;
        rHip_rThighVPD.goal = (simbiconParams.swho + optimizer);

        var lh_ut_torque = lHip_uTorsoVPD.evaluate();
        lHip.addTorque(+lh_ut_torque);

        var rh_rt_torque = rHip_rThighVPD.evaluate();
        rHip.addTorque(+rh_rt_torque);
        lHip.addTorque(-rh_rt_torque);

        var test = new Ammo.ConcreteContactResultCallback();
        test.addSingleResult = function( cp, colObj0, partid0, index0, colObj1, partid1, index1 ) {
            t= 0;
            phase = 2;
        }
        world.simulator.dynamicsWorld.contactPairTest(world.simulator.entities['human.rFoot'].body, world.simulator.entities['ground'].body, test);

    } else if (phase === 2) {
        var d = com[0] - world.joints['human.lAnkle'].getPosition()[0];

        var optimizer = simbiconParams.cde*d + simbiconParams.cve*com_vel;

        controllers['human.lKnee'].goal = simbiconParams.swke;
        controllers['human.rKnee'].goal = simbiconParams.stke;
        controllers['human.rShoulder'].goal = -.3;
        controllers['human.lShoulder'].goal = .3;
        controllers['human.rElbow'].goal = -.4;
        controllers['human.lElbow'].goal = 0;

        rHip_uTorsoVPD.goal = simbiconParams.tor;
        lHip_lThighVPD.goal = (simbiconParams.swhe + optimizer);

        var rh_ut_torque = rHip_uTorsoVPD.evaluate();
        rHip.addTorque(+rh_ut_torque);

        var lh_lt_torque = lHip_lThighVPD.evaluate();
        lHip.addTorque(+lh_lt_torque);
        rHip.addTorque(-lh_lt_torque);

        if (t > simbiconParams.dt) {
            t = 0;
            phase = 3;
        }
    } else if (phase === 3) {

        var d = com[0] - world.joints['human.lAnkle'].getPosition()[0];

        var optimizer = simbiconParams.cdo*d + simbiconParams.cvo*com_vel;

        controllers['human.lKnee'].goal = simbiconParams.swko;
        controllers['human.rKnee'].goal = simbiconParams.stko;

        rHip_uTorsoVPD.goal = simbiconParams.tor;
        lHip_lThighVPD.goal = (simbiconParams.swho + optimizer);

        var rh_ut_torque = rHip_uTorsoVPD.evaluate();
        rHip.addTorque(+rh_ut_torque);

        var lh_lt_torque = lHip_lThighVPD.evaluate();
        lHip.addTorque(+lh_lt_torque);
        rHip.addTorque(-lh_lt_torque);

        var test = new Ammo.ConcreteContactResultCallback();
        test.addSingleResult = function( cp, colObj0, partid0, index0, colObj1, partid1, index1 ) {
            t = 0;
            phase = 0;
        }
        world.simulator.dynamicsWorld.contactPairTest(world.simulator.entities['human.lFoot'].body, world.simulator.entities['ground'].body, test);
    }

    for (var name in controllers) {
        if (name === 'human.lHip') {continue; }
        if (name === 'human.rHip') {continue; }
        var torque = controllers[name].evaluate();
        controllers[name].joint.addTorque(torque);
    }
};
window.renderCallback = function(time) {
    var com = getCOM();
    world.renderer.camera.position.x = com[0];
    $('#simRate').text((time*30.).toFixed(1)); 
}

window.world = world;

};
