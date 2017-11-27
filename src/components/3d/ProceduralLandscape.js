'use strict';

import * as THREE from 'three';
import React from 'react';
// import TCL from 'three-collada-loader';
import BaseSceneComponent from './BaseSceneComponent';
import './ProceduralLandscape.scss';

let TWEEN = require('tween.js');

require( "imports-loader?THREE=three!../../externals/three.js/examples/js/postprocessing/EffectComposer.js");
require( "imports-loader?THREE=three!../../externals/three.js/examples/js/postprocessing/RenderPass.js");
require( "imports-loader?THREE=three!../../externals/three.js/examples/js/postprocessing/ShaderPass.js");
require( "imports-loader?THREE=three!../../externals/three.js/examples/js/postprocessing/MaskPass.js");
require( "imports-loader?THREE=three!../../externals/three.js/examples/js/postprocessing/SSAOPass.js");

require( "imports-loader?THREE=three!../../externals/three.js/examples/js/shaders/DotScreenShader.js");
require( "imports-loader?THREE=three!../../externals/three.js/examples/js/shaders/CopyShader.js");
require( "imports-loader?THREE=three!../../externals/three.js/examples/js/shaders/RGBShiftShader.js");
require( "imports-loader?THREE=three!../../externals/three.js/examples/js/shaders/SSAOShader.js");

require( "imports-loader?THREE=three!../../externals/three.js/examples/js/controls/FlyControls.js");

import SimplexNoise from "imports-loader?THREE=three!../../externals/threex/SimplexNoise.js";
import * as THREEx from "imports-loader?THREE=three!../../externals/threex/threex.terrain.js";


const CAMERA_ANIMATION_DELAY = 3000;
const CAMERA_ROTATE_TIME = 3000;
const TEXTURE_SIZE = 512;
const PRIMARY = 0x666666;
// const PRIMARY = 0x53BDFD;
const GREEN = 0x1ec503;
const BACKGROUND_MESH = false;
let onRenderFcts= [];

class ProceduralLandscapeComponent extends BaseSceneComponent {
  constructor(props, context) {
    super(props, context);
    window.addEventListener( 'resize', this.resize.bind( this ), false);
    if( this.datgui ){
      this.datgui = this.props.datgui.addFolder( 'landscape' );
    }
    this.start = Date.now();
    this.clock = new THREE.Clock();

  }

  componentDidMount(){
    super.componentDidMount();
    document.getElementById( 'proceduralLandscape-component' ).appendChild( this.renderer.domElement );
    this.buildScene();


    var geometry = new THREE.TorusGeometry( 6, 3, 16, 10 );
    var material = new THREE.MeshBasicMaterial( { color: 0xffff00, side: THREE.DoubleSide } );
    var torus = new THREE.Mesh( geometry, material );
    this.scene.add( torus );

    this.controls = new THREE.FlyControls( this.cameraPivot );
    // this.controls = new THREE.FlyControls( torus );
    this.controls.movementSpeed = 0.3;
    this.controls.domElement = document.getElementById( 'proceduralLandscape-component' );
    this.controls.rollSpeed = Math.PI / 24;
    this.controls.autoForward = true;
    this.controls.dragToLook = true;

    this.mounted = true;
  }

  renderLoop( time ) {
    if( !this.mounted ) return;
    let delta = this.clock.getDelta();
    super.renderLoop( time );
    TWEEN.update();
    this.controls.update( delta );
    // this.cameraPivot.position.z -= 0.01
  }

  buildScene(){

    super.buildScene();
    
    this.camera.position.x = 20;
    this.camera.position.y = 20;
    this.camera.position.z = 20;
    if( this.datgui ){
      this.datgui.add( this.camera.position, 'x', -200, 200 );
      this.datgui.add( this.camera.position, 'y', -200, 200 );
      this.datgui.add( this.camera.position, 'z', -200, 200 );
      this.datgui.add( this.camera, 'fov', 1, 100 )
      .onFinishChange( ( val ) => {
        this.resize();
        });
    }

    this.ambientLight = new THREE.AmbientLight( new THREE.Color('rgb(255, 255, 255)'), 0.1 );
    this.scene.add( this.ambientLight );
    
    // this.scene.fog = new THREE.Fog( 0x000, 0, 10);
     // ;(function(){
      var light	= new THREE.AmbientLight( 0x202020 )
      this.scene.add( light )
      var light	= new THREE.DirectionalLight('white', 5)
      light.position.set(0.5, 0.0, 2)
      this.scene.add( light )
      var light	= new THREE.DirectionalLight('white', 0.75*2)
      light.position.set(-0.5, -0.5, -2)
      this.scene.add( light )		
    // })()

    var heightMap	= THREEx.Terrain.allocateHeightMap(256,256)
    THREEx.Terrain.simplexHeightMap(heightMap)	
    var geometry	= THREEx.Terrain.heightMapToPlaneGeometry(heightMap)
    THREEx.Terrain.heightMapToVertexColor(heightMap, geometry)

  /* Wireframe built-in color is white, no need to change that */
    var material	= new THREE.MeshBasicMaterial({
      wireframe: true
    });
    var mesh	= new THREE.Mesh( geometry, material );
    this.scene.add( mesh );
    mesh.lookAt(new THREE.Vector3(0,1,0));

    mesh.scale.y	= 3.5;
    mesh.scale.x	= 3;
    mesh.scale.z	= 0.20;
    mesh.scale.multiplyScalar(10);

    onRenderFcts.push(function(delta, now){
      mesh.rotation.z += 0.2 * delta;	
    })
    onRenderFcts.push(function(){
      this.renderer.render( this.scene, this.camera );		
    })
    var lastTimeMsec= null
  
    this.cameraPivot = new THREE.Object3D();
    this.cameraPivot.add( this.camera )
    this.scene.add( this.cameraPivot )

    this.camera.position.set( 0, 0, 0 );
    this.camera.lookAt( mesh.position );

  }

  render() {
    return (
      <div className="proceduralLandscape-component" id="proceduralLandscape-component">
      </div>
    );
  }
}

ProceduralLandscapeComponent.displayName = 'ProceduralLandscapeComponent';

export default ProceduralLandscapeComponent;
