'use strict';

import React from 'react';
import * as THREE from 'three'
let TWEEN = require('tween.js');


const CAMERA_ANIMATION_DELAY = 3000;
const CAMERA_ROTATE_TIME = 3000;
const TEXTURE_SIZE = 512;
const PRIMARY = 0x53BDFD;
const GREEN = 0x1ec503;
const BACKGROUND_MESH = false;

let testScene = new THREE.Scene();
let textureCamera;
let shaderScene;
let renderer, scene;

let depthMaterial, effectComposer, depthRenderTarget, ssaoPass;
let group;
let depthScale = 1.0;
let postprocessing = { enabled : true, renderMode: 0 };

class BaseSceneComponent extends React.Component {

  constructor(props, context) {
    super(props, context);

    // this.datgui = props.datgui.addFolder( 'base scene' );

  }

  // 'delegate' functions
  showGlobalEvent(event) {
  }

  addBeacon( position, flagpolePosition, event) {
  }

  startAmbientAnimation() {
  }

  moveToBottom( cb ) {
  }

  moveToMiddle( cb, paramPos ) {
  }

  setVisionProperties( obj ){
  }


  startAmbientAnimation() {
    this.ambientAnimationOn = true;
    requestAnimationFrame( this.doAmbientAnim.bind( this ) );
  }

  doAmbientAnim() {
    // this.camera.rotation.x += 0.0009;
    this.camera.rotation.y += 0.001;
    if( this.ambientAnimationOn ){
      requestAnimationFrame( this.doAmbientAnim.bind( this ) );
    }
  }

  componentDidMount( preMadeCamera = false){
    // setup rederer and add to DOM
    renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      stencil: true,
      precision: 'highp'
    });
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setSize( window.innerWidth, window.innerHeight );


    // setup off screen graphics buffer
    this.shaderRenderer = new THREE.WebGLRenderTarget( TEXTURE_SIZE, TEXTURE_SIZE, {
          minFilter:THREE.LinearFilter,
          magFilter:THREE.LinearFilter,
          generateMipmaps: false,
          stencilBuffer:true,
          depthBuffer:false,
          alpha: true,
          transparent:true,
          format: THREE.RGBAFormat,
    } );
    this.shaderRenderer.setSize( TEXTURE_SIZE, TEXTURE_SIZE);

    textureCamera = new THREE.OrthographicCamera(TEXTURE_SIZE / - 2,TEXTURE_SIZE / 2,TEXTURE_SIZE / 2,TEXTURE_SIZE / - 2, -1000, 100000 );
    shaderScene = new THREE.Scene();

    if( preMadeCamera ){
      this.camera = preMadeCamera;
    }
    else{
      this.camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 0.1, 10000 );
      this.camera.position.z = 1000;
    }
    scene = new THREE.Scene();
    // scene.fog = new THREE.FogExp2( 0x000000, 0.005, 50 );
    // this.setupShaderBuffer();

    requestAnimationFrame( this.renderLoop.bind( this ));
    this.mounted = true;

    if( this.datgui ){
      this.datgui.add( this.camera.position, 'x', -200, 200 )
      .onFinishChange( ( val ) => {
        this.camera.position.x = val;
      });
      this.datgui.add( this.camera.position, 'y', -200, 200 )
      .onFinishChange( ( val ) => {
        this.camera.position.y = val;
      });
      this.datgui.add( this.camera.position, 'z', -200, 200 )
      .onFinishChange( ( val ) => {
        this.camera.position.z = val;
      });
    }

  }

  renderLoop( time ) {
    if( !this.mounted ) return;
    requestAnimationFrame( this.renderLoop.bind( this ) );
    TWEEN.update();
    if( this.postprocessing ){
      renderer.render( shaderScene, textureCamera, this.shaderRenderer );
      // Render depth into depthRenderTarget
      scene.overrideMaterial = depthMaterial;
      renderer.render( scene, this.camera, depthRenderTarget, true );

      // Render renderPass and SSAO shaderPass
      scene.overrideMaterial = null;
      effectComposer.render(time);
    }
    else{
      renderer.render( shaderScene, textureCamera, this.shaderRenderer );
      renderer.render( scene, this.camera );
    }

    // update shader unis
    if( this.bufferShaderMaterial && this.bufferShaderMaterial.uniforms ){
      this.bufferShaderMaterial.uniforms[ 'iGlobalTime' ].value = (Date.now() - this.start) / 1000;
      this.bufferShaderMaterial.uniforms[ 't' ].value = (Date.now() - this.start) / 1000;
    }
  }


  loadCollada( filepath, cb, startAnimations = true ) {
    // var loader = new ColladaLoader2();
    let loader = new THREE.ColladaLoader();
    // let loader = new TCL();
    // let loader = new ColladaLoader();
    loader.options = {
      centerGeometry: true,
      defaultEnvMap: true,
      convertUpAxis: true
    };

    loader.load( filepath,
      ( obj ) => {

        if( startAnimations ){

        obj.scene.traverse( function ( child ) {
    			if ( child instanceof THREE.SkinnedMesh ) {
    				var animation = new THREE.Animation( child, child.geometry.animation  );
    				animation.play();
    			}
    		});
        }

        if( cb ){
          cb.call( this, obj.scene );
        }
      }
    );
  }


  initPostprocessing() {
    this.postprocessing = true;
    // Setup render pass
    let renderPass = new THREE.RenderPass( scene, this.camera );

    // Setup depth pass
    depthMaterial = new THREE.MeshDepthMaterial();
    depthMaterial.depthPacking = THREE.RGBADepthPacking;
    depthMaterial.blending = THREE.NoBlending;

    let pars = { minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter };
    depthRenderTarget = new THREE.WebGLRenderTarget( window.innerWidth, window.innerHeight, pars );

    // Setup SSAO pass
    ssaoPass = new THREE.ShaderPass( THREE.SSAOShader );
    ssaoPass.renderToScreen = true;
    ssaoPass.uniforms[ "tDiffuse" ].value //will be set by ShaderPass
    ssaoPass.uniforms[ "tDepth" ].value = depthRenderTarget.texture;
    ssaoPass.uniforms[ 'size' ].value.set( window.innerWidth, window.innerHeight );
    ssaoPass.uniforms[ 'cameraNear' ].value = this.camera.near;
    ssaoPass.uniforms[ 'cameraFar' ].value = this.camera.far;
    ssaoPass.uniforms[ 'onlyAO' ].value = ( false );
    ssaoPass.uniforms[ 'aoClamp' ].value = 0.3;
    ssaoPass.uniforms[ 'lumInfluence' ].value = 0.5;

    // do a BloomPass
    // let bloomPass = new THREE.BloomPass();
    let bloomPass = new THREE.BloomPass(1.5, 25, 4, 512);
    // bloomPass.renderToScreen = true;
    // halftone mask
    let dotScreenPass = new THREE.DotScreenPass();

    // Add pass to effect composer
    effectComposer = new THREE.EffectComposer( renderer );
    effectComposer.addPass( renderPass );

    // effectComposer.addPass( bloomPass );
    effectComposer.addPass( dotScreenPass );
    effectComposer.addPass( ssaoPass );

  }

  resize(){
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setSize( window.innerWidth, window.innerHeight );
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
  }

  setVisionProperties( properties ) {
    this.visionPresets = properties;
  }

  get renderer() {
    return renderer;
  }
  set renderer( val ) {
    renderer = val;
  }
  get scene() {
    return scene;
  }
  set scene( val ) {
    scene = val;
  }

  buildScene(){

  }


  buildTestGeo() {
    let boxMaterial = new THREE.MeshLambertMaterial({
      map: this.shaderRenderer.texture,
      wireframe: false,
      color: 'rgb(200, 100, 100)',
      depthWrite:false,
      depthTest:false,
      opacity: 1
    });
    let boxGeometry2 = new THREE.PlaneGeometry( 100, 100, 2 );
    let mainBoxObject = new THREE.Mesh(boxGeometry2, boxMaterial );
    this.camera.add( mainBoxObject );
    mainBoxObject.position.set( -80,0,-160 );
    mainBoxObject.lookAt( this.camera.position );
  }

  setupShaderBuffer() {

    this.bufferShaderMaterial = new THREE.ShaderMaterial( {
      side: THREE.DoubleSide,
      transparent: true,
      depthWrite: false,
      wireframe: false,
      fragmentShader: document.getElementById( 'etherFragment' ).textContent,
      uniforms: {
        time: {type: 'f',value: 0.0},
        t: {type: 'f',value: 0.0},
        iGlobalTime: {type: 'i',value: 0},
        iResolution: {type: 'vec3',value: [0, TEXTURE_SIZE * .7, 0]}
      },
    } );
    let geo = new THREE.PlaneGeometry( TEXTURE_SIZE, TEXTURE_SIZE );
    let mesh = new THREE.Mesh( geo, this.bufferShaderMaterial );

    shaderScene.add( mesh )
    shaderScene.add( textureCamera )
    mesh.position.x = 0;
    mesh.position.y = 0;
    mesh.position.z = -50;
    textureCamera.lookAt( mesh.position );
    mesh.lookAt( textureCamera.position );

  }

  loadTestScene() {

    let ambientLight = new THREE.AmbientLight( new THREE.Color('rgb(255, 255, 255)'), 0.5 );
    let light = new THREE.PointLight( 0xffffff, 1, 0 );
    light.position.set( 50, 50, 500 );
    scene.add( ambientLight );
    scene.add( light );
    scene.add( this.camera );

    var geometry = new THREE.BoxGeometry( 1, 1, 1 );
    var material = new THREE.MeshBasicMaterial( { color: 0x00ff00 } );
    var cube = new THREE.Mesh( geometry, material );
    scene.add( cube );

    this.camera.position.set( 0, -150, 160 );
    // this.camera.lookAt( 0,0,0 );

  }
  makeRandomSphere() {
    let variance = 100;
    var geometry = new THREE.SphereGeometry( Math.random() * (variance/2), 50, 50 );
    var material = new THREE.MeshLambertMaterial( {color: 0x1010ee} );
    var sphere = new THREE.Mesh( geometry, material );
    sphere.position.set( Math.random() * variance - variance/2, Math.random() * variance - variance/2, Math.random() * variance - variance/2 );

    return sphere;
  }

  render() {
    return (
      <div className="basescene-component" id="basescene-component">
      </div>
    );
  }
}

BaseSceneComponent.displayName = 'Shared3dBaseSceneComponent';

export default BaseSceneComponent;

// let event = {
// coordinates: [23.498582, -109.987843] //cabo
// coordinates: [-54.557950,-69.733685] // bottom of south america
//   coordinates: [49.282729,-123.120738]// vancouer
// };
