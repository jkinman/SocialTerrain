require("imports-loader?THREE=three!../../externals/three.js/examples/js/shaders/NormalMapShader.js");
require("imports-loader?THREE=three!../../externals/three.js/examples/js/ShaderTerrain.js");
require("imports-loader?THREE=three!../../externals/three.js/examples/js/BufferGeometryUtils.js");


let SCREEN_WIDTH = window.innerWidth;
let SCREEN_HEIGHT = window.innerHeight;

let renderer, container, stats;

let camera, scene, controls;
let cameraOrtho, sceneRenderTarget;

let uniformsNoise, uniformsNormal, uniformsTerrain,
    heightMap, normalMap,
    quadTarget;

let directionalLight, pointLight;

let terrain;

let textureCounter = 0;

let animDelta = 0, animDeltaDir = -1;
let lightVal = 0, lightDir = 1;

let clock = new THREE.Clock();

let updateNoise = true;

let animateTerrain = false;

let mlib = {};

init();
animate();

function init() {

    container = document.getElementById( 'container' );

    // SCENE (RENDER TARGET)

    sceneRenderTarget = new THREE.Scene();

    cameraOrtho = new THREE.OrthographicCamera( SCREEN_WIDTH / - 2, SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2, SCREEN_HEIGHT / - 2, -10000, 10000 );
    cameraOrtho.position.z = 100;

    sceneRenderTarget.add( cameraOrtho );

    // CAMERA

    camera = new THREE.PerspectiveCamera( 40, SCREEN_WIDTH / SCREEN_HEIGHT, 2, 4000 );
    camera.position.set( -1200, 800, 1200 );

    controls = new THREE.OrbitControls( camera );

    controls.rotateSpeed = 1.0;
    controls.zoomSpeed = 1.2;
    controls.panSpeed = 0.8;

    controls.keys = [ 65, 83, 68 ];

    // SCENE (FINAL)

    scene = new THREE.Scene();
    scene.background = new THREE.Color( 0x050505 );
    scene.fog = new THREE.Fog( 0x050505, 2000, 4000 );

    // LIGHTS

    scene.add( new THREE.AmbientLight( 0x111111 ) );

    directionalLight = new THREE.DirectionalLight( 0xffffff, 1.15 );
    directionalLight.position.set( 500, 2000, 0 );
    scene.add( directionalLight );

    pointLight = new THREE.PointLight( 0xff4400, 1.5 );
    pointLight.position.set( 0, 0, 0 );
    scene.add( pointLight );


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

    let vertexShader = document.getElementById( 'vertexShader' ).textContent;

    // TEXTURES

    let loadingManager = new THREE.LoadingManager( function(){
        terrain.visible = true;
    });
    let textureLoader = new THREE.TextureLoader( loadingManager );

    let specularMap = new THREE.WebGLRenderTarget( 2048, 2048, pars );
    specularMap.texture.generateMipmaps = false;

    let diffuseTexture1 = textureLoader.load( "textures/terrain/grasslight-big.jpg");
    let diffuseTexture2 = textureLoader.load( "textures/terrain/backgrounddetailed6.jpg" );
    let detailTexture = textureLoader.load( "textures/terrain/grasslight-big-nm.jpg" );

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
        [ 'heightmap', 	document.getElementById( 'fragmentShaderNoise' ).textContent, 	vertexShader, uniformsNoise, false ],
        [ 'normal', 	normalShader.fragmentShader,  normalShader.vertexShader, uniformsNormal, false ],
        [ 'terrain', 	terrainShader.fragmentShader, terrainShader.vertexShader, uniformsTerrain, true ]
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

    renderer = new THREE.WebGLRenderer();
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setSize( SCREEN_WIDTH, SCREEN_HEIGHT );
    container.appendChild( renderer.domElement );

    // STATS

    stats = new Stats();
    container.appendChild( stats.dom );

    // EVENTS

    onWindowResize();

    window.addEventListener( 'resize', onWindowResize, false );

    document.addEventListener( 'keydown', onKeyDown, false );

}

//

function onWindowResize( event ) {

    SCREEN_WIDTH = window.innerWidth;
    SCREEN_HEIGHT = window.innerHeight;

    renderer.setSize( SCREEN_WIDTH, SCREEN_HEIGHT );

    camera.aspect = SCREEN_WIDTH / SCREEN_HEIGHT;
    camera.updateProjectionMatrix();

}

//

function onKeyDown ( event ) {

    switch( event.keyCode ) {

        case 78: /*N*/  lightDir *= -1; break;
        case 77: /*M*/  animDeltaDir *= -1; break;

    }

}

//

function animate() {

    requestAnimationFrame( animate );

    render();
    stats.update();

}

function render() {

    let delta = clock.getDelta();

    if ( terrain.visible ) {

        let time = Date.now() * 0.001;

        let fLow = 0.1, fHigh = 0.8;

        lightVal = THREE.Math.clamp( lightVal + 0.5 * delta * lightDir, fLow, fHigh );

        let valNorm = ( lightVal - fLow ) / ( fHigh - fLow );

        scene.background.setHSL( 0.1, 0.5, lightVal );
        scene.fog.color.setHSL( 0.1, 0.5, lightVal );

        directionalLight.intensity = THREE.Math.mapLinear( valNorm, 0, 1, 0.1, 1.15 );
        pointLight.intensity = THREE.Math.mapLinear( valNorm, 0, 1, 0.9, 1.5 );

        uniformsTerrain[ 'uNormalScale' ].value = THREE.Math.mapLinear( valNorm, 0, 1, 0.6, 3.5 );

        if ( updateNoise ) {

            animDelta = THREE.Math.clamp( animDelta + 0.00075 * animDeltaDir, 0, 0.05 );
            uniformsNoise[ 'time' ].value += delta * animDelta;

            uniformsNoise[ 'offset' ].value.x += delta * 0.05;

            uniformsTerrain[ 'uOffset' ].value.x = 4 * uniformsNoise[ 'offset' ].value.x;

            quadTarget.material = mlib[ 'heightmap' ];
            renderer.render( sceneRenderTarget, cameraOrtho, heightMap, true );

            quadTarget.material = mlib[ 'normal' ];
            renderer.render( sceneRenderTarget, cameraOrtho, normalMap, true );

        }

        renderer.render( scene, camera );

    }

}