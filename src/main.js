var $           = require('jquery');

var World       = require('./world/world');
var Renderer    = require('./renderer/renderer');
var Simulator   = require('./simulator/simulator');
var Sphere      = require('./entity/sphere');
var Box         = require('./entity/box');
var Capsule     = require('./entity/capsule');

var FPS = 1000/30;


$(document).ready(function() {

    var simulator = new Simulator();
    var renderer  = new Renderer();

    var world = new World(renderer, simulator, {FPS: FPS});
    var ground = new Box('ground', [10,5,10], {mass: 0});

    var e = new Sphere('s1', 1, {
        mass: 1,
        color: [255,0,0],
    });
    e.setPosition([0,1,0]);
    world.addEntity(e);

    /*
    var e2 = new Sphere('s2', 1, {
        mass: 1,
        color: [0,255,0],
    });
    e2.setPosition([2,1,0]);
    world.addEntity(e2);
    */

    var e3 = new Box('s3', [1,1,1], {
        mass: 1,
        color: [0,0,255],
    });
    e3.setPosition([.5,5,.5]);
    world.addEntity(e3);

    ground.setPosition([0,-2.5,0]);

    world.addEntity(ground);

    world.go();

    var i = 0;
    $('#addsphere').click(function() {
        var sphere = new Sphere('sphere'+(++i), Math.random()*2, {
            mass: 1,
            color: [Math.floor(Math.random()*255),Math.floor(Math.random()*255),Math.floor(Math.random()*255)],
        });
        sphere.setPosition([Math.random()*10-5,Math.random()*10+5,Math.random()*10-5]);
        world.addEntity(sphere);
    });
    $('#addbox').click(function() {
        var box = new Box('box'+(++i), [Math.random()*2, Math.random()*2, Math.random()*2], {
            mass: 1,
            color: [Math.floor(Math.random()*255),Math.floor(Math.random()*255),Math.floor(Math.random()*255)],
        });
        box.setPosition([Math.random()*10-5,Math.random()*10+5,Math.random()*10-5]);
        world.addEntity(box);
    });

    $('#addcapsule').click(function() {
        var capsule = new Capsule('capsule'+(++i), Math.random()*2, Math.random()*2, {
            mass: 1,
            color: [Math.floor(Math.random()*255),Math.floor(Math.random()*255),Math.floor(Math.random()*255)],
        });
        capsule.setPosition([Math.random()*10-5,Math.random()*10+5,Math.random()*10-5]);
        world.addEntity(capsule);
    });

});
