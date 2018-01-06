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
import { Object3D } from "three";
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

const CRAWL_SPEED = 0.0;
const CAMERA_ANIMATION_DELAY = 3000;
const CAMERA_ROTATE_TIME = 3000;
const TEXTURE_SIZE = 512;
const PRIMARY = 0x666666;
// const PRIMARY = 0x53BDFD;
const GREEN = 0x1ec503;
const BACKGROUND_MESH = false;
const FOG_COLOUR = 0x000000;

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

  renderLoop(time) {
    super.renderLoop(time);
    if (!this.mounted) return;
    let delta = this.clock.getDelta();
    TWEEN.update();
    this.controls.update( delta );
    
    // creep the camera gimble along
    this.cameraPivot.position.z -= CRAWL_SPEED;

    if( this.heightMap && this.groundMesh && this.cameraPivot ) {
      let cameraPivotPosition	= this.cameraPivot.position;
      cameraPivotPosition.y	= 5 + THREEx.Terrain.planeToHeightMapCoords(
        this.heightMap, this.groundMesh, cameraPivotPosition.x, cameraPivotPosition.z);
    }
    
    if (deviceOrientation){
      this.cameraRotate(deviceOrientation);
    }
  }

  componentDidMount() {
    super.componentDidMount();
    document
      .getElementById("proceduralLandscape-component")
      .appendChild(this.renderer.domElement);
    this.buildScene();

    this.controls = new THREE.FlyControls( this.cameraPivot );
    this.controls.movementSpeed = 2;
    this.controls.domElement = document.getElementById( 'proceduralLandscape-component' );
    this.controls.rollSpeed = Math.PI / 24;
    this.controls.autoForward = false;
    this.controls.dragToLook = true;

    this.mounted = true;
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
      {...event, 
        impact: 1.5,
        shockwave: false, 
        title: event.handle, 
        subtitle: event.text, 
        imageUrl: event.profile,
        backgroundUrl: event.user.profile_background_image_url,
        likes: event.entities.favorite_count + event.entities.retweet_count,
      },
      position,
      this.shaderRenderer.texture,
      20000
    );
    
    this.globalEvents.add(beacon);
    beacon.activate();

    // let newObj;
    // newObj = this.cloneLoadedOBJ( this.obj3dTree.clone(), Math.random() / 5 + 0.01 )
    // newObj.position.set(position.x, position.y, position.z)
    // this.trees.add(newObj)
    // this.scene.add(newObj)
  
    // this.camera.lookAt(position.x, position.y, position.z)
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

    this.obj3dTree = obj3dTree;

    // setInterval( (obj) => {
    //   let newObj;
    //   newObj = this.cloneLoadedOBJ( this.obj3dTree.clone(), Math.random() / 5 + 0.01 )
    //   // this.trees.add(newObj)
    //   this.scene.add(newObj)
    //   // let newPos = [this.getRandomInt(200),this.getRandomInt(200),this.getRandomInt(200)]
    //   newObj.position.set(this.getRandomInt(200),0,this.getRandomInt(200))  
    //   if( this.heightMap && this.groundMesh  ) {
    //     let objPos	= newObj.position;
    //     objPos.y	= THREEx.Terrain.planeToHeightMapCoords(
    //       this.heightMap, this.groundMesh, objPos.x, objPos.z);
    //   }
  
    // }, 3000)

  }

   getRandomInt(max) {
    return (Math.floor(Math.random() * Math.floor(max))) - max /2;
  }

  cloneLoadedOBJ (obj=null, scale=1) {
    let treeMaterial = new THREE.MeshBasicMaterial({
      wireframe: false,
      color: 0x229922,      
      side: THREE.DoubleSide,
    });

    let treeCopy = new THREE.Object3D()
    treeCopy.name = `treecopy-${this.scene.children.length}`
    obj.traverse(( child ) => {
      if ( child instanceof THREE.Mesh ) {
        let newMesh = child.clone(true)
        newMesh.position.set(0,0,0)
        newMesh.scale.set(scale,scale,scale)
        newMesh.material = treeMaterial;
        treeCopy.add( newMesh) 
      }
    });
    return treeCopy;
  }

  buildScene() {
    super.buildScene();
    let loader = new THREE.OBJLoader();
    this.trees = new THREE.Object3D();
    // this.scene.add(this.trees);

    //add the marker group
    // world objects group
    this.worldgroup = new THREE.Object3D();
    this.scene.add(this.worldgroup);

    this.globalEvents = new THREE.Object3D();
    this.worldgroup.add(this.globalEvents);

    
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

    // this.scene.fog = new THREE.Fog( FOG_COLOUR, 5, 50);
    var light = new THREE.AmbientLight(0x202020);
    // this.scene.add( light )
    var light = new THREE.DirectionalLight("white", 5);
    light.position.set(0.5, 0.0, 2);
    this.scene.add(light);
    var light = new THREE.DirectionalLight("white", 0.75 * 2);
    light.position.set(-0.5, -0.5, -2);
    this.scene.add(light);

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

    mesh.scale.y = 3;
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

    // for linking with device pos
    this.camera.rotation.reorder("YXZ");

    this.cameraPivot = new THREE.Object3D();
    this.cameraPivot.add(this.camera);
    this.scene.add(this.cameraPivot);
    
    this.cameraPivot.position.set(0, 0, 0);
    this.camera.position.z = 100;
    this.camera.position.y = 50;
    this.camera.position.set(0,0,0);
    this.camera.lookAt(0,0,0)

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
