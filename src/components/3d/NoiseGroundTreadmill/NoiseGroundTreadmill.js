import * as THREE from 'three';
import vertexShader from 'raw-loader!./shaders/vertexShader.txt';
import fragmentShaderNoise from 'raw-loader!./shaders/fragmentShaderNoise.txt';

import GrassLight from '../../../static/3dAssets/textures/terrain/grasslight-big.jpg';
import GrassLightNM from '../../../static/3dAssets/textures/terrain/grasslight-big-nm.jpg';
import BackgroundDetailed from '../../../static/3dAssets/textures/terrain/backgrounddetailed6.jpg';

require("imports-loader?THREE=three!../../../externals/three.js/examples/js/ShaderTerrain.js");
require("imports-loader?THREE=three!../../../externals/three.js/examples/js/shaders/NormalMapShader.js");
require("imports-loader?THREE=three!../../../externals/three.js/examples/js/BufferGeometryUtils.js");
require("imports-loader?THREE=three!../../../externals/three.js/examples/js/controls/OrbitControls.js");

let SCREEN_WIDTH = window.innerWidth;
let SCREEN_HEIGHT = window.innerHeight;

// let camera, scene, renderer;
let cameraOrtho, sceneRenderTarget;

let uniformsNoise, uniformsNormal,
    heightMap, normalMap,
    quadTarget;

let directionalLight, pointLight;
let terrain;

let textureCounter = 0;

let animDelta = 0, animDeltaDir = -1;
let lightVal = 0, lightDir = 1;

let treadmillClock = new THREE.Clock();

let animateTerrain = false;

let mlib = {};

class NoiseTerrainTreadmill {
    constructor( camera, scene, renderer ) {
        this.renderer = renderer;
        this.camera = camera;
        this.scene = scene;
        this.updateNoise = false;
    }

sceneObectInit(camera, scene, renderer) {
    camera.position.set( -1200, 800, 1200 );
    scene.background = new THREE.Color( 0x050505 );
    // scene.fog = new THREE.Fog( 0x050505, 2000, 4000 );

    scene.add( new THREE.AmbientLight( 0x111111 ) );

    directionalLight = new THREE.DirectionalLight( 0xffffff, 1.15 );
    directionalLight.position.set( 500, 2000, 0 );
    scene.add( directionalLight );

    pointLight = new THREE.PointLight( 0xff4400, 1.5 );
    pointLight.position.set( 0, 0, 0 );
    scene.add( pointLight );

}

init(camera, scene, renderer) {

    // SCENE (RENDER TARGET)
    sceneRenderTarget = new THREE.Scene();

    cameraOrtho = new THREE.OrthographicCamera( SCREEN_WIDTH / - 2, SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2, SCREEN_HEIGHT / - 2, -10000, 10000 );
    cameraOrtho.position.z = 100;

    sceneRenderTarget.add( cameraOrtho );

    // CAMERA
    // camera = new THREE.PerspectiveCamera( 40, SCREEN_WIDTH / SCREEN_HEIGHT, 2, 4000 );
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

    let loadingManager = new THREE.LoadingManager( function(){
        terrain.visible = true;
    });
    let textureLoader = new THREE.TextureLoader( loadingManager );

    let specularMap = new THREE.WebGLRenderTarget( 2048, 2048, pars );
    specularMap.texture.generateMipmaps = false;    
    
    let diffuseTexture1 = textureLoader.load( GrassLight );
    let diffuseTexture2 = textureLoader.load( GrassLightNM );
    let detailTexture = textureLoader.load( BackgroundDetailed );

    diffuseTexture1.wrapS = diffuseTexture1.wrapT = THREE.RepeatWrapping;
    diffuseTexture2.wrapS = diffuseTexture2.wrapT = THREE.RepeatWrapping;
    detailTexture.wrapS = detailTexture.wrapT = THREE.RepeatWrapping;
    specularMap.texture.wrapS = specularMap.texture.wrapT = THREE.RepeatWrapping;

    // TERRAIN SHADER
debugger
    let terrainShader = THREE.ShaderTerrain[ "terrain" ];

    this.uniformsTerrain = THREE.UniformsUtils.clone( terrainShader.uniforms );

    this.uniformsTerrain[ 'tNormal' ].value = normalMap.texture;
    this.uniformsTerrain[ 'uNormalScale' ].value = 3.5;

    this.uniformsTerrain[ 'tDisplacement' ].value = heightMap.texture;

    this.uniformsTerrain[ 'tDiffuse1' ].value = diffuseTexture1;
    this.uniformsTerrain[ 'tDiffuse2' ].value = diffuseTexture2;
    this.uniformsTerrain[ 'tSpecular' ].value = specularMap.texture;
    this.uniformsTerrain[ 'tDetail' ].value = detailTexture;

    this.uniformsTerrain[ 'enableDiffuse1' ].value = true;
    this.uniformsTerrain[ 'enableDiffuse2' ].value = true;
    this.uniformsTerrain[ 'enableSpecular' ].value = true;

    this.uniformsTerrain[ 'diffuse' ].value.setHex( 0xffffff );
    this.uniformsTerrain[ 'specular' ].value.setHex( 0xffffff );

    this.uniformsTerrain[ 'shininess' ].value = 30;

    this.uniformsTerrain[ 'uDisplacementScale' ].value = 375;

    this.uniformsTerrain[ 'uRepeatOverlay' ].value.set( 6, 6 );


    let params = [
        [ 'heightmap', 	fragmentShaderNoise, 	vertexShader, uniformsNoise, false ],
        [ 'normal', 	normalShader.fragmentShader,  normalShader.vertexShader, uniformsNormal, false ],
        [ 'terrain', 	terrainShader.fragmentShader, terrainShader.vertexShader, this.uniformsTerrain, true ]
     ];

    for( let i = 0; i < params.length; i ++ ) {
        let material = new THREE.ShaderMaterial( {

            uniforms: 		params[ i ][ 3 ],
            vertexShader: 	params[ i ][ 2 ],
            fragmentShader: params[ i ][ 1 ],
            lights: 		params[ i ][ 4 ],
            fog: 			true
            } );

        mlib[ params[ i ][ 0 ] ] = material;

    }

    let plane = new THREE.PlaneBufferGeometry( SCREEN_WIDTH, SCREEN_HEIGHT );

    quadTarget = new THREE.Mesh( plane, new THREE.MeshBasicMaterial( { color: 0x000000 } ) );
    quadTarget.position.z = -500;
    sceneRenderTarget.add( quadTarget );

    // TERRAIN MESH

    let geometryTerrain = new THREE.PlaneBufferGeometry( 6000, 6000, 256, 256 );

    THREE.BufferGeometryUtils.computeTangents( geometryTerrain );

    terrain = new THREE.Mesh( geometryTerrain, mlib[ 'terrain' ] );
    terrain.position.set( 0, -125, 0 );
    terrain.rotation.x = -Math.PI / 2;
    terrain.visible = false;
    scene.add( terrain );

    // RENDERER
    // renderer = new THREE.WebGLRenderer();
    // renderer.setPixelRatio( window.devicePixelRatio );
    // renderer.setSize( SCREEN_WIDTH, SCREEN_HEIGHT );
    // container.appendChild( renderer.domElement );

    // EVENTS

    // this.onWindowResize();
    // window.addEventListener( 'resize', this.onWindowResize, false );
    // document.addEventListener( 'keydown', this.onKeyDown, false );

}


//  onWindowResize( event ) {

//     const SCREEN_WIDTH = window.innerWidth;
//     const SCREEN_HEIGHT = window.innerHeight;

//     this.renderer.setSize( SCREEN_WIDTH, SCREEN_HEIGHT );

//     this.camera.aspect = SCREEN_WIDTH / SCREEN_HEIGHT;
//     this.camera.updateProjectionMatrix();

// }



 onKeyDown ( event ) {
    switch( event.keyCode ) {
        case 78: /*N*/  lightDir *= -1; break;
        case 77: /*M*/  animDeltaDir *= -1; break;
    }
}



 render( camera, scene, renderer ) {

    let delta = treadmillClock.getDelta();

    if ( terrain.visible ) {

        let time = Date.now() * 0.001;

        let fLow = 0.1, fHigh = 0.8;

        lightVal = THREE.Math.clamp( lightVal + 0.5 * delta * lightDir, fLow, fHigh );

        let valNorm = ( lightVal - fLow ) / ( fHigh - fLow );

        // scene.background.setHSL( 0.1, 0.5, lightVal );
        // scene.fog.color.setHSL( 0.1, 0.5, lightVal );

        directionalLight.intensity = THREE.Math.mapLinear( valNorm, 0, 1, 0.1, 1.15 );
        pointLight.intensity = THREE.Math.mapLinear( valNorm, 0, 1, 0.9, 1.5 );

        this.uniformsTerrain[ 'uNormalScale' ].value = THREE.Math.mapLinear( valNorm, 0, 1, 0.6, 3.5 );

        if ( this.updateNoise ) {

            animDelta = THREE.Math.clamp( animDelta + 0.00075 * animDeltaDir, 0, 0.05 );
            uniformsNoise[ 'time' ].value += delta * animDelta;

            uniformsNoise[ 'offset' ].value.x += delta * 0.05;

            this.uniformsTerrain[ 'uOffset' ].value.x = 4 * uniformsNoise[ 'offset' ].value.x;

            quadTarget.material = mlib[ 'heightmap' ];
            renderer.render( sceneRenderTarget, cameraOrtho, heightMap, true );

            quadTarget.material = mlib[ 'normal' ];
            this.renderer.render( sceneRenderTarget, cameraOrtho, normalMap, true );

        }

        // renderer.render( this.scene, this.camera );

    }

}

}

export default NoiseTerrainTreadmill;