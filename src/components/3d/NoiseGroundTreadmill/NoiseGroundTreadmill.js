import React from 'react';
import * as THREE from 'three';
import GalaxyGenerator from '../GalaxyGenerator';
let TWEEN = require("tween.js");
import BaseSceneComponent from "../BaseSceneComponent";
import vertexShader from 'raw-loader!./shaders/vertexShader.txt';
import fragmentShaderNoise from 'raw-loader!./shaders/fragmentShaderNoise.txt';
import config from "config";
import openSocket from "socket.io-client";
import BeaconPlanar from "../BeaconPlanar";
import TreeObj from '../../../static/3dAssets/LowTree/Tree low.obj';

import GrassLight from '../../../static/3dAssets/textures/terrain/grasslight-big.jpg';
import GrassLightNM from '../../../static/3dAssets/textures/terrain/grasslight-big-nm.jpg';
import BackgroundDetailed from '../../../static/3dAssets/textures/terrain/backgrounddetailed6.jpg';

require("imports-loader?THREE=three!../../../externals/three.js/examples/js/ShaderTerrain.js");
require("imports-loader?THREE=three!../../../externals/three.js/examples/js/shaders/NormalMapShader.js");
require("imports-loader?THREE=three!../../../externals/three.js/examples/js/BufferGeometryUtils.js");
require("imports-loader?THREE=three!../../../externals/three.js/examples/js/controls/OrbitControls.js");

let SCREEN_WIDTH = window.innerWidth;
let SCREEN_HEIGHT = window.innerHeight;
const LAND_HEIGHT = -700;

const HUE = 0.5;
const SATURATION = 0.2;

const LIGHT_COLOUR_POINT = new THREE.Color("rgb(255, 255, 255)"); //0xff4400
const LIGHT_COLOUR_DIRECTIONAL = new THREE.Color("rgb(255, 255, 255)");
const LIGHT_COLOUR_AMBIENT = new THREE.Color("rgb(255, 255, 255)");

const LIGHT_AMBIENT_BRIGHTNESS = 0.2;
const LIGHT_POINT_BRIGHTNESS = 4.15;
const LIGHT_DIRECTIONAL_BRIGHTNESS = 2.15;

const FOG_COLOUR = new THREE.Color( 'rgb(0, 0, 0)' );

// let camera, scene, renderer;
let cameraOrtho, sceneRenderTarget;

let uniformsNoise, uniformsNormal,
    heightMap, normalMap,
    quadTarget;
let uniformsTerrain;

let terrain = {};

let textureCounter = 0;

let animDelta = 0, animDeltaDir = -1;
let lightVal = 0;

let treadmillClock = new THREE.Clock();

let animateTerrain = false;
let mlib = {};

// LINK UP SOCKET EVENTS
// const socket = openSocket('http://localhost:3000/terrainApp');
const socket = openSocket(config.serverUrl);
// TODO make a channel to kick off other remotes
// const socket = openSocket(`${config.serverUrl}/client`);
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
let deviceOrientation;
let screenOrientation = 0;


class NoiseTerrainTreadmill extends BaseSceneComponent {

    constructor( props, context ) {

        let settings = {
            showStats: true, 
            controls: 'orbit', 
            // controls: 'none', 
            elementId: 'noiseGroundTreadmill-component',
        };
        super(props, context, settings);
        this.updateNoise = true;
        this.tweetBackup = [];
        this.tweets = [];
        this.lightDir = -1;

        socket.on("remoteMessage", data => {
            this.remoteEventHandler(data)
        });
        
    }

    renderLoop() {
        super.renderLoop();
        let delta = treadmillClock.getDelta();
        TWEEN.update();
        this.globalEvents.traverse((obj) => {
            if( obj.name == 'beacon' || obj.name == 'movable'){
                obj.position.x -= 2 + Math.abs(obj.seed || 1);
                obj.position.z += obj.seed /2 || 0;
            }
        })

        this.trees.traverse((tree) => {
           if( tree.name == 'tree'){
                tree.traverse(( child ) => {
                    if ( child instanceof THREE.Mesh ) {
                        child.position.x -= 2;
                    }
                })
            }
        })
        
        if ( terrain.visible ) {
            let time = Date.now() * 0.001;
            let fLow = 0.1, fHigh = 0.8;
            lightVal = THREE.Math.clamp( lightVal + 0.5 * delta * this.lightDir, fLow, fHigh );

            let valNorm = ( lightVal - fLow ) / ( fHigh - fLow );
            this.scene.background.setHSL( HUE, SATURATION, lightVal );
            if(this.props.fog) this.scene.fog.color.setHSL( HUE, SATURATION, lightVal );

            this.directionalLight.intensity = THREE.Math.mapLinear( valNorm, 0, 1, 0.1, 1.15 );
            this.pointLight.intensity = THREE.Math.mapLinear( valNorm, 0, 1, 0.9, 1.5 );

            uniformsTerrain[ 'uNormalScale' ].value = THREE.Math.mapLinear( valNorm, 0, 1, 0.6, 3.5 );
            
            if ( this.updateNoise ) {
                animDelta = THREE.Math.clamp( animDelta + 0.00075 * animDeltaDir, 0, 0.05 );
                uniformsNoise[ 'time' ].value += delta * animDelta;
                uniformsNoise[ 'offset' ].value.x += delta * 0.05;
                uniformsTerrain[ 'uOffset' ].value.x = 4 * uniformsNoise[ 'offset' ].value.x;
                quadTarget.material = mlib[ 'heightmap' ];
                this.renderer.render( sceneRenderTarget, cameraOrtho, heightMap, true );
                quadTarget.material = mlib[ 'normal' ];
                this.renderer.render( sceneRenderTarget, cameraOrtho, normalMap, true );
            }
        }
        if (deviceOrientation){
            this.cameraRotate(deviceOrientation);
        }

        if( this.galaxyGenerator ) this.galaxyGenerator.renderLoop();
        //  align flash light with camera
        // var vec = new THREE.Vector3( -4, -2, -10 );
        // vec.applyQuaternion( this.camera.quaternion );
        // this.flashLight.position.copy( vec );

    }

    componentDidMount() {

        super.componentDidMount();
        this.init();
        this.sceneObjectInit();
        // this.cameraOrientationLinkingSetup();
        this.renderLoop();
        this.startPostProcessing();
        this.checkMessageQueue();
    }

    checkMessageQueue() {
        if( this.tweetBackup.length && !this.tweets.length ){
            this.tweets = this.tweetBackup.splice(0, this.tweetBackup.length);
        }

        console.log(`checkMessageQueue: ${this.tweets.length} / ${this.tweetBackup.length}`)
        if( Array.isArray(this.tweets) && this.tweets.length ){
            let tweet = this.tweets.splice( 0, 1 );
            this.tweetBackup.push( tweet[0] );
            this.showGlobalEvent(tweet[0]);
        }
        
        setTimeout( this.checkMessageQueue.bind(this), 3000 + Math.abs(this.getRandomInt(3000)));
    }

    componentWillReceiveProps(nextProps) {
        this.tweets = nextProps.tweets.sort((a,b) => a.created_at > b.created_at);
      }
    
      getRandomInt(variance) {
        return (Math.floor(Math.random() * Math.floor(variance))) - variance /2;
      }
      showGlobalEvent(event = {}) {
        // clear old geo
        this.clearDeadGlobalGeo();
        let position = new THREE.Vector3( 
            3500 + this.getRandomInt(1000), 
            -200 + this.getRandomInt(1000),  
            this.getRandomInt(2000) 
        )

        const beacon = new BeaconPlanar(
          {...event, 
            impact: 80,
            shockwave: true, 
            title: event.user.screen_name, 
            subtitle: event.text, 
            imageUrl: event.user.profile_image_url,
            backgroundUrl: event.user.profile_background_image_url,
            likes: event.entities.favorite_count + event.entities.retweet_count,
          },
          position,
          this.shaderRenderer.texture,
          20000,
        );
        
        this.globalEvents.add(beacon);
        beacon.activate();
      }
    
      clearDeadGlobalGeo( all=false ) {
        for (var i = this.globalEvents.children.length -1; i >= 0; i--) {
          if( all || !this.globalEvents.children[i].alive ){
            this.globalEvents.remove( this.globalEvents.children[i] );
          }
        }
      }
    
    sceneObjectInit() {
        
        // this.camera.position.set( -1200, 500, 1200 );
        this.camera.position.set( -250, 800, -250 );
        this.scene.background = FOG_COLOUR;
        
        if(this.props.fog) this.scene.fog = new THREE.Fog( FOG_COLOUR, 3000, 4000 );

        // this.scene.add( new THREE.AmbientLight( LIGHT_COLOUR_AMBIENT, LIGHT_AMBIENT_BRIGHTNESS ) );

        this.directionalLight = new THREE.DirectionalLight( LIGHT_COLOUR_DIRECTIONAL, LIGHT_DIRECTIONAL_BRIGHTNESS );
        this.directionalLight.position.set( 1000, 2000, 0 );
        this.scene.add( this.directionalLight );
        
        // this.pointLight = new THREE.PointLight( LIGHT_COLOUR_POINT, LIGHT_POINT_BRIGHTNESS );
        // PointLight( color, intensity, distance, decay )
        this.pointLight = new THREE.PointLight( LIGHT_COLOUR_POINT, 100, 2000, 1 );
        this.pointLight.position.set( 0, 0, 0 );
        this.scene.add( this.pointLight );

        // this.flashLight = new THREE.SpotLight( 0xffffff, 4 );
        // this.flashLight.position.set( -250, 1200, -250 );
        // this.flashLight.lookAt( 0, 0, 0)
        
        // this.flashLight.castShadow = true;
        // this.flashLight.shadow.mapSize.width = 1024;
        // this.flashLight.shadow.mapSize.height = 1024;
        // this.flashLight.shadow.camera.near = 500;
        // this.flashLight.shadow.camera.far = 4000;
        // this.flashLight.shadow.camera.fov = 30;
        // this.scene.add( this.flashLight );

        this.lightDir = -1.0;
        let sunAnim = new TWEEN.Tween(0)
            .to( 2, 60 * 1000 )
            .repeat(2000)
            .yoyo( true )
            .onUpdate((percent) => this.lightDir = 1 - (2 * percent))
            .start();

        this.galaxyGenerator = new GalaxyGenerator();
        this.theGalaxy = this.galaxyGenerator.generateUniverse(5);
        this.scene.add( this.theGalaxy );
        this.theGalaxy.position.set( 0, 1200, 0 );
        this.theGalaxy.scale.set( 1, 1, 1 );
        console.log( this.scene)
    }

    init() {

        // SCENE (RENDER TARGET)
        sceneRenderTarget = new THREE.Scene();

        cameraOrtho = new THREE.OrthographicCamera( SCREEN_WIDTH / - 2, SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2, SCREEN_HEIGHT / - 2, -10000, 10000 );
        cameraOrtho.position.z = 100;

        sceneRenderTarget.add( cameraOrtho );

        // HEIGHT + NORMAL MAPS
        let normalShader = THREE.NormalMapShader;

        let rx = 256, ry = 256;
        let pars = { minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, format: THREE.RGBFormat };

        heightMap  = new THREE.WebGLRenderTarget( rx, ry, pars );
        heightMap.texture.generateMipmaps = false;

        normalMap = new THREE.WebGLRenderTarget( rx, ry, pars );
        normalMap.texture.generateMipmaps = false;

        uniformsNoise = {
            time:   { value: 1.0 },
            scale:  { value: new THREE.Vector2( 1.5, 1.5 ) },
            offset: { value: new THREE.Vector2( 0, 0 ) }
        };

        uniformsNormal = THREE.UniformsUtils.clone( normalShader.uniforms );

        uniformsNormal.height.value = 0.05;
        uniformsNormal.resolution.value.set( rx, ry );
        uniformsNormal.heightMap.value = heightMap.texture;

        // TEXTURES
        let loadingManager = new THREE.LoadingManager( 
            () => terrain.visible = true,
            (url, loaded, total) => console.log(`loaded ${loaded} / ${total}: ${url}`)
        );
        let textureLoader = new THREE.TextureLoader( loadingManager );

        let specularMap = new THREE.WebGLRenderTarget( 2048, 2048, pars );
        specularMap.texture.generateMipmaps = false;    
        
        let diffuseTexture1 = textureLoader.load( GrassLight );
        let diffuseTexture2 = textureLoader.load( BackgroundDetailed );
        let detailTexture = textureLoader.load( GrassLightNM );

        diffuseTexture1.wrapS = diffuseTexture1.wrapT = THREE.RepeatWrapping;
        diffuseTexture2.wrapS = diffuseTexture2.wrapT = THREE.RepeatWrapping;
        detailTexture.wrapS = detailTexture.wrapT = THREE.RepeatWrapping;
        specularMap.texture.wrapS = specularMap.texture.wrapT = THREE.RepeatWrapping;

        // TERRAIN SHADER

        let terrainShader = THREE.ShaderTerrain[ "terrain" ];

        uniformsTerrain = THREE.UniformsUtils.clone( terrainShader.uniforms );

        uniformsTerrain[ 'tNormal' ].value = normalMap.texture;
        uniformsTerrain[ 'uNormalScale' ].value = 3.5;

        uniformsTerrain[ 'tDisplacement' ].value = heightMap.texture;

        uniformsTerrain[ 'tDiffuse1' ].value = diffuseTexture1;
        uniformsTerrain[ 'tDiffuse2' ].value = diffuseTexture2;
        uniformsTerrain[ 'tSpecular' ].value = specularMap.texture;
        uniformsTerrain[ 'tDetail' ].value = detailTexture;

        uniformsTerrain[ 'enableDiffuse1' ].value = true;
        uniformsTerrain[ 'enableDiffuse2' ].value = true;
        uniformsTerrain[ 'enableSpecular' ].value = true;

        uniformsTerrain[ 'diffuse' ].value.setHex( 0xffffff );
        uniformsTerrain[ 'specular' ].value.setHex( 0xffffff );

        uniformsTerrain[ 'shininess' ].value = 30;

        uniformsTerrain[ 'uDisplacementScale' ].value = 375;

        uniformsTerrain[ 'uRepeatOverlay' ].value.set( 6, 6 );


        let params = [
            [ 'heightmap', 	fragmentShaderNoise, 	vertexShader, uniformsNoise, false ],
            [ 'normal', 	normalShader.fragmentShader,  normalShader.vertexShader, uniformsNormal, false ],
            [ 'terrain', 	terrainShader.fragmentShader, terrainShader.vertexShader, uniformsTerrain, true ]
        ];

        for( let i = 0; i < params.length; i ++ ) {
            let material = new THREE.ShaderMaterial( {

                uniforms: 		params[ i ][ 3 ],
                vertexShader: 	params[ i ][ 2 ],
                fragmentShader: params[ i ][ 1 ],
                lights: 		params[ i ][ 4 ],
                fog: 			this.props.fog
                } );

            mlib[ params[ i ][ 0 ] ] = material;

        }

        let plane = new THREE.PlaneBufferGeometry( SCREEN_WIDTH, SCREEN_HEIGHT );

        quadTarget = new THREE.Mesh( plane, new THREE.MeshBasicMaterial( { color: 0x000000 } ) );
        quadTarget.position.z = -1000;
        sceneRenderTarget.add( quadTarget );

        // TERRAIN MESH

        // let geometryTerrain = new THREE.PlaneBufferGeometry( 6000, 6000, 256, 256 );
        let geometryTerrain = new THREE.PlaneBufferGeometry( 8000, 8000, 256, 256 );

        THREE.BufferGeometryUtils.computeTangents( geometryTerrain );

        let lambertGround = new THREE.MeshLambertMaterial( {
            wireframe: this.props.meshTerrain,
            color: this.props.terrainColour
          } )
      
        terrain = new THREE.Mesh( geometryTerrain, mlib[ 'terrain' ] );

        // terrain.position.set( 0, -125, 0 );
        terrain.position.set( 0, LAND_HEIGHT, 0 );
        terrain.rotation.x = -Math.PI / 2;
        terrain.visible = false;
        this.scene.add( terrain );

        this.worldgroup = new THREE.Object3D();
        this.scene.add(this.worldgroup);
    
        this.globalEvents = new THREE.Object3D();
        this.worldgroup.add(this.globalEvents);
        this.trees = new THREE.Object3D();
        this.scene.add(this.trees);

        this.objLoader = new THREE.OBJLoader(loadingManager);        
        this.objLoader.load( TreeObj, this.handleTree.bind(this), null, (err) => console.log(err), null, true );
        document.addEventListener( 'keydown', this.onKeyDown.bind(this), false );

    }
    
    remoteEventHandler( data ) {

        let position = new THREE.Vector3( 
            3500 + this.getRandomInt(1000), 
            -200 + this.getRandomInt(1000),  
            this.getRandomInt(2000) 
        )

        
        let newObj;
        newObj = this.cloneLoadedOBJ( this.obj3dTree.clone(), Math.random() * 10 )
        newObj.position.set(position.x, position.y, position.z)
        this.trees.add(newObj)
      }
    
    handleTree( treeObj ) {
        this.obj3dTree = treeObj;
    }

    cloneLoadedOBJ (obj=null, scale=1) {

        // let treeMaterial = new THREE.MeshBasicMaterial({
        //   wireframe: false,
        //   color: 0x229922,      
        //   side: THREE.DoubleSide,
        // });

        let treeMaterial = new THREE.MeshLambertMaterial( {
            wireframe: false,
            color: 0x009900
        } )

        let treeCopy = new THREE.Object3D()
        treeCopy.name = `tree`;
        obj.traverse(( child ) => {
          if ( child instanceof THREE.Mesh ) {
            let newMesh = child.clone(true)
            newMesh.position.set(0,LAND_HEIGHT / 2, 0)
            newMesh.scale.set(scale,scale,scale)
            newMesh.material = treeMaterial;
            treeCopy.add(newMesh) 
          }
        });

        return treeCopy;
      }
    
    cameraRotate(obj) {
        this.alphaOffset = 0;
        let alpha = obj.alpha ? THREE.Math.degToRad(obj.alpha) + this.alphaOffset : 0; // Z
        let beta = obj.beta ? THREE.Math.degToRad(obj.beta) : 0; // X'
        let gamma = obj.gamma ? THREE.Math.degToRad(obj.gamma) : 0; // Y''
        // I LUCKED OUT AND EVERYTHING WORKS IF I MULTIPLY BEAT BY -1
        beta = -beta;
    
        var orient = screenOrientation ? THREE.Math.degToRad(screenOrientation) : 0; // O
    
        if(this.gimble) this.setObjectQuaternion(this.gimble.quaternion, alpha, beta, gamma, orient);
        this.setObjectQuaternion(this.camera.quaternion, alpha, beta, gamma, orient);
      }
    
      setObjectQuaternion(quaternion, alpha, beta, gamma, orient) {
        euler.set(beta, alpha, -gamma, "YXZ"); // 'ZXY' for the device, but 'YXZ' for us
        quaternion.setFromEuler(euler); // orient the device
        quaternion.multiply(q1); // camera looks out the back of the device, not the top
        quaternion.multiply(q0.setFromAxisAngle(zee, -orient)); // adjust for screen orientation
      }
    
    cameraOrientationLinkingSetup() {
        this.gimble = new THREE.Mesh(
          new THREE.BoxGeometry( 4, 8, 1 ), 
          new THREE.MeshLambertMaterial( {color: 0x999999} )
        )
        this.gimble.renderOrder = 999;
        this.gimble.onBeforeRender = ( renderer ) => {renderer.clearDepth()};
        this.gimble.rotation.reorder("YXZ");
        this.gimble.scale.set(0.2,0.2,0.2)
        var vec = new THREE.Vector3( -4, -2, -10 );
        vec.applyQuaternion( this.camera.quaternion );
        this.gimble.position.copy( vec );
        this.camera.add(this.gimble)
        this.scene.add(this.camera)
        // for linking with device pos
        this.camera.rotation.reorder("YXZ");
        this.gimble.lookAt(this.camera.position)
      }
    
    onKeyDown ( event ) {
        switch( event.keyCode ) {
            case 78: /*N*/  this.lightDir *= -1; break;
            case 77: /*M*/  animDeltaDir *= -1; break;
            case 32: this.remoteEventHandler();
        }
    }

    render() {
    return (
      <div
        className="noiseGroundTreadmill-component"
        id="noiseGroundTreadmill-component"
      />
    );
  }

}

export default NoiseTerrainTreadmill;