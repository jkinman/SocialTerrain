"use strict";

import * as THREE from "three";
import React from "react";
// import TCL from 'three-collada-loader';
import BaseSceneComponent from "./BaseSceneComponent";
import "./ProceduralLandscape.scss";
import SimplexNoise from "imports-loader?THREE=three!../../externals/threex/SimplexNoise.js";
import * as THREEx from "imports-loader?THREE=three!../../externals/threex/threex.terrain.js";
import config from "config";
import openSocket from "socket.io-client";
import BeaconPlanar from "./BeaconPlanar";
import TreeObj from '../../static/3dAssets/LowTree/Tree low.obj';
// import TreeMaterialFile from '../../static/3dAssets/LowTree/Tree low.mtl';

let TWEEN = require("tween.js");

require("imports-loader?THREE=three!../../externals/three.js/examples/js/loaders/MTLLoader.js");
require("imports-loader?THREE=three!../../externals/three.js/examples/js/loaders/OBJLoader.js");
require("imports-loader?THREE=three!../../externals/three.js/examples/js/postprocessing/EffectComposer.js");
require("imports-loader?THREE=three!../../externals/three.js/examples/js/postprocessing/RenderPass.js");
require("imports-loader?THREE=three!../../externals/three.js/examples/js/postprocessing/ShaderPass.js");
require("imports-loader?THREE=three!../../externals/three.js/examples/js/postprocessing/MaskPass.js");
require("imports-loader?THREE=three!../../externals/three.js/examples/js/postprocessing/SSAOPass.js");
require("imports-loader?THREE=three!../../externals/three.js/examples/js/shaders/DotScreenShader.js");
require("imports-loader?THREE=three!../../externals/three.js/examples/js/shaders/CopyShader.js");
require("imports-loader?THREE=three!../../externals/three.js/examples/js/shaders/RGBShiftShader.js");
require("imports-loader?THREE=three!../../externals/three.js/examples/js/shaders/SSAOShader.js");
require("imports-loader?THREE=three!../../externals/three.js/examples/js/controls/FlyControls.js");

let deviceOrientation;
let screenOrientation = 0;

const socket = openSocket(config.serverUrl);
socket.on("orientation", orientation => {
  deviceOrientation = orientation;
});

socket.on("screenrotation", orientation => {
  screenOrientation = orientation.direction;
});

// rotation consts
const zee = new THREE.Vector3(0, 0, 1);
const euler = new THREE.Euler();
const q0 = new THREE.Quaternion();
const q1 = new THREE.Quaternion(-Math.sqrt(0.5), 0, 0, Math.sqrt(0.5)); // - PI/2 around the x-axis

const CRAWL_SPEED = 0.04;
const CAMERA_ANIMATION_DELAY = 3000;
const CAMERA_ROTATE_TIME = 3000;
const TEXTURE_SIZE = 512;
const PRIMARY = 0x666666;
// const PRIMARY = 0x53BDFD;
const GREEN = 0x1ec503;
const BACKGROUND_MESH = false;
let onRenderFcts = [];

class ProceduralLandscapeComponent extends BaseSceneComponent {
  constructor(props, context) {
    super(props, context);
    window.addEventListener("resize", this.resize.bind(this), false);
    if (this.datgui) {
      this.datgui = this.props.datgui.addFolder("landscape");
    }
    this.start = Date.now();
    this.clock = new THREE.Clock();
  }

  componentDidMount() {
    super.componentDidMount();
    document
      .getElementById("proceduralLandscape-component")
      .appendChild(this.renderer.domElement);
    this.buildScene();

    var geometry = new THREE.TorusGeometry(6, 3, 16, 10);
    var material = new THREE.MeshBasicMaterial({
      color: 0xffff00,
      side: THREE.DoubleSide,
    });
    // this.torus = new THREE.Mesh( geometry, material );
    // this.scene.add( this.torus );

    // this.controls = new THREE.FlyControls( this.camera );
    this.controls = new THREE.FlyControls( this.cameraPivot );
    // this.controls = new THREE.FlyControls( torus );
    this.controls.movementSpeed = 0.3;
    this.controls.domElement = document.getElementById( 'proceduralLandscape-component' );
    this.controls.rollSpeed = Math.PI / 24;
    this.controls.autoForward = true;
    this.controls.dragToLook = true;

    this.mounted = true;
  }

  renderLoop(time) {
    super.renderLoop(time);
    if (!this.mounted) return;
    let delta = this.clock.getDelta();
    TWEEN.update();
    this.controls.update( delta );
    
    // creep the camera gimble along
    // this.cameraPivot.position.z -= CRAWL_SPEED;

    if( this.heightMap && this.groundMesh && this.cameraPivot ) {
      let cameraPivotPosition	= this.cameraPivot.position;
      cameraPivotPosition.y	= 2 + THREEx.Terrain.planeToHeightMapCoords(
        this.heightMap, this.groundMesh, cameraPivotPosition.x, cameraPivotPosition.z);
    }
    
    if (deviceOrientation){
      this.cameraRotate(deviceOrientation);
    }
  }

  componentWillReceiveProps(nextProps) {
    this.showGlobalEvent(nextProps.tweets[nextProps.tweets.length - 1]);
  }

  cameraRotate(obj) {
    this.alphaOffset = 0;
    var alpha = obj.alpha
      ? THREE.Math.degToRad(obj.alpha) + this.alphaOffset
      : 0; // Z
    var beta = obj.beta ? THREE.Math.degToRad(obj.beta) : 0; // X'
    var gamma = obj.gamma ? THREE.Math.degToRad(obj.gamma) : 0; // Y''

    var orient = screenOrientation ? THREE.Math.degToRad(screenOrientation) : 0; // O
    this.setObjectQuaternion(
      this.camera.quaternion,
      alpha,
      beta,
      gamma,
      orient
    );
  }

  setObjectQuaternion(quaternion, alpha, beta, gamma, orient) {
    euler.set(beta, alpha, -gamma, "YXZ"); // 'ZXY' for the device, but 'YXZ' for us
    quaternion.setFromEuler(euler); // orient the device
    quaternion.multiply(q1); // camera looks out the back of the device, not the top
    quaternion.multiply(q0.setFromAxisAngle(zee, -orient)); // adjust for screen orientation
  }

  fakeCoords(obj) {
    return {
      x: obj.position.x + (Math.random()*20-10),
      y: obj.position.y + (Math.random()*20-10),
      z: obj.position.z - (Math.random()*50 + 25)
    };
  }

  showGlobalEvent(event = {}) {
    // clear old geo
    this.clearDeadGlobalGeo();
    const position = this.fakeCoords(this.cameraPivot);
    let cameraPivotPosition	= this.cameraPivot.position;
    
    position.y	= 1 + THREEx.Terrain.planeToHeightMapCoords(
      this.heightMap, this.groundMesh, cameraPivotPosition.x, cameraPivotPosition.z);


    const beacon = new BeaconPlanar(
      {...event, shockwave: true, title: event.handle, subtitle: event.text, imageUrl: event.profile},
      position,
      this.shaderRenderer.texture,
      20000
    );
    
    this.globalEvents.add(beacon);
    beacon.activate();
    this.camera.lookAt(beacon.position)
  }

  clearDeadGlobalGeo( all=false ) {
    for (var i = this.globalEvents.children.length -1; i >= 0; i--) {
      if( all || !this.globalEvents.children[i].alive ){
        this.globalEvents.remove( this.globalEvents.children[i] );
      }
    }
  }


  handleTrees( obj3dTree ){
    // let textureLoader = new THREE.TextureLoader( );
    // let texture = textureLoader.load( 'textures/UV_Grid_Sm.jpg' );

    // let materialLoader = new THREE.MTLLoader( );
    // let material = materialLoader.load( TreeMaterialFile );
    this.trees.add( obj3dTree);
    this.scene.add( obj3dTree);
    let material = new THREE.MeshBasicMaterial({
      wireframe: false,
      color: 0x229922,      
      side: THREE.DoubleSide,
    });

    // obj3dTree.traverse(( child ) => {
    //   if ( child instanceof THREE.Mesh ) {
    //     child.material = material;
    //   }
    // });

    obj3dTree.scale.set( 0.1, 0.1, 0.1);
    this.obj3dTree = obj3dTree.clone(true);
    
    let cameraPivotPosition	= this.cameraPivot.position;

    let n = 100;
    while (n < 10) {
      n++;
      let treeCopy = new THREE.Group();
      treeCopy = this.obj3dTree.clone(true);
      this.trees.add( treeCopy );
      treeCopy.children = obj3dTree.children.slice();
      
      treeCopy.traverse(( child ) => {
        if ( child instanceof THREE.Mesh ) {
          child.material = material;
        }
      });

      let randomScale = Math.random() * 0.5;
      treeCopy.scale.set( randomScale, randomScale, randomScale);
      let randomPos = {
        x:(Math.random() * 1024)-512, 
        y:0,
        z:(Math.random() * 1024)-512
      };

      // console.log(randomPos)

    //   try{
    //     randomPos.y	= THREEx.Terrain.planeToHeightMapCoords(
    //     this.heightMap, 
    //     this.groundMesh, 
    //     randomPos.x, 
    //     randomPos.z
    //   );
    // } catch(error) {
    //   console.log(error)
    // }

      treeCopy.position.set(randomPos.x, randomPos.y, randomPos.z);

    }
    // obj3dTree.position.set(0,0,0);
    obj3dTree.position.set(this.fakeCoords(this.cameraPivot));
    this.camera.lookAt( obj3dTree.position);

  }

  buildScene() {
    super.buildScene();
    let loader = new THREE.OBJLoader();

    this.trees = new THREE.Group();
    this.scene.add(this.trees);

    //add the marker group
    // world objects group
    this.worldgroup = new THREE.Object3D();
    this.scene.add(this.worldgroup);

    this.globalEvents = new THREE.Object3D();
    this.worldgroup.add(this.globalEvents);

    this.camera.position.x = 20;
    this.camera.position.y = 20;
    this.camera.position.z = 20;
    this.camera.rotation.reorder("YXZ");
    if (this.datgui) {
      this.datgui.add(this.camera.position, "x", -200, 200);
      this.datgui.add(this.camera.position, "y", -200, 200);
      this.datgui.add(this.camera.position, "z", -200, 200);
      this.datgui.add(this.camera, "fov", 1, 100).onFinishChange(val => {
        this.resize();
      });
    }

    this.ambientLight = new THREE.AmbientLight(
      new THREE.Color("rgb(255, 255, 255)"),
      0.1
    );
    this.scene.add(this.ambientLight);

    this.scene.fog = new THREE.Fog( 0x000, 5, 50);
    var light = new THREE.AmbientLight(0x202020);
    // this.scene.add( light )
    var light = new THREE.DirectionalLight("white", 5);
    light.position.set(0.5, 0.0, 2);
    this.scene.add(light);
    var light = new THREE.DirectionalLight("white", 0.75 * 2);
    light.position.set(-0.5, -0.5, -2);
    this.scene.add(light);

    loader.load( TreeObj, this.handleTrees.bind(this), null, (err) => console.log(err), null, true );
    loader.load( TreeObj, this.handleTrees.bind(this), null, (err) => console.log(err), null, true );
    loader.load( TreeObj, this.handleTrees.bind(this), null, (err) => console.log(err), null, true );
    loader.load( TreeObj, this.handleTrees.bind(this), null, (err) => console.log(err), null, true );
    loader.load( TreeObj, this.handleTrees.bind(this), null, (err) => console.log(err), null, true );
    loader.load( TreeObj, this.handleTrees.bind(this), null, (err) => console.log(err), null, true );


    this.heightMap = THREEx.Terrain.allocateHeightMap(512, 512);
    THREEx.Terrain.simplexHeightMap(this.heightMap);
    let geometry = THREEx.Terrain.heightMapToPlaneGeometry(this.heightMap);
    THREEx.Terrain.heightMapToVertexColor(this.heightMap, geometry);

    /* Wireframe built-in color is white, no need to change that */
    var material = new THREE.MeshBasicMaterial({
      wireframe: this.props.meshTerrain,
      color: this.props.terrainColour
    });
    var mesh = new THREE.Mesh(geometry, material);
    this.scene.add(mesh);
    mesh.lookAt(new THREE.Vector3(0, 1, 0));

    mesh.scale.y = 3.5;
    mesh.scale.x = 3;
    mesh.scale.z = 0.1;
    mesh.scale.multiplyScalar(100);
    
    // store the ground
    this.groundGeo = geometry;
    this.groundMesh = mesh;
    
    // onRenderFcts.push(function(delta, now){
    //   mesh.rotation.z += 0.2 * delta;
    // })
    // onRenderFcts.push(function(){
    //   this.renderer.render( this.scene, this.camera );
    // })
    var lastTimeMsec = null;

    this.cameraPivot = new THREE.Object3D();
    this.cameraPivot.add(this.camera);
    this.cameraPivot.position.set(0, 0, 0);
    this.scene.add(this.cameraPivot);

    this.camera.position.set(0, 0, 0);
    this.camera.lookAt(mesh.position);
  }

  render() {
    return (
      <div
        className="proceduralLandscape-component"
        id="proceduralLandscape-component"
      />
    );
  }
}

ProceduralLandscapeComponent.displayName = "ProceduralLandscapeComponent";

export default ProceduralLandscapeComponent;
