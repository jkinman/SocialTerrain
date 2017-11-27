require( "../assets/three.js/examples/js/postprocessing/EffectComposer.js");
require( "../assets/three.js/examples/js/postprocessing/RenderPass.js");
require( "../assets/three.js/examples/js/postprocessing/ShaderPass.js");
require( "../assets/three.js/examples/js/postprocessing/MaskPass.js");
require( "../assets/three.js/examples/js/postprocessing/SSAOPass.js");

require( "../assets/three.js/examples/js/shaders/DotScreenShader.js");
require( "../assets/three.js/examples/js/shaders/CopyShader.js");
require( "../assets/three.js/examples/js/shaders/RGBShiftShader.js");
require( "../assets/three.js/examples/js/shaders/SSAOShader.js");


var camera, scene, renderer, composer;
			var object, light, ssaoPass;

			init();
			animate();

			function init() {

				renderer = new THREE.WebGLRenderer();
				renderer.setPixelRatio( window.devicePixelRatio );
				renderer.setSize( window.innerWidth, window.innerHeight );
				document.body.appendChild( renderer.domElement );

				//

				camera = new THREE.PerspectiveCamera( 70, window.innerWidth / window.innerHeight, 1, 1000 );
				camera.position.z = 400;

				scene = new THREE.Scene();
				scene.fog = new THREE.Fog( 0x000000, 1, 750 );

				object = new THREE.Object3D();
				scene.add( object );

				
				//   var controls = new THREE.OrbitControls(camera);
				// controls.damping = 0.2;
				// controls.enabled = true;
				// controls.maxPolarAngle = Math.PI / 2;
				// controls.minPolarAngle = 1;
				// controls.minDistance = 300;
				// controls.maxDistance = 500;

				var geometry = new THREE.SphereGeometry( 1, 4, 4 );
				var material = new THREE.MeshPhongMaterial( { color: 0xffffff, flatShading: true } );

// 				for ( var i = 0; i < 100; i ++ ) {

// 					var mesh = new THREE.Mesh( geometry, material );
// 					mesh.position.set( Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5 ).normalize();
// 					mesh.position.multiplyScalar( Math.random() * 400 );
// 					mesh.rotation.set( Math.random() * 2, Math.random() * 2, Math.random() * 2 );
// 					mesh.scale.x = mesh.scale.y = mesh.scale.z = Math.random() * 50;
					// object.add( mesh );

				// }

				
				var loader = new THREE.ObjectLoader();
				
				loader.load(
    // resource URL
    "https://drive.google.com/file/d/1JE0cLyCUV5Y7sXY7zyRMXVN9l1EBBymc/view?usp=sharing",

    // pass the loaded data to the onLoad function.
//Here it is assumed to be an object
    function ( obj ) {
		//add the loaded object to the scene
        scene.add( obj );
    },

    // Function called when download progresses
    function ( xhr ) {
        console.log( (xhr.loaded / xhr.total * 100) + '% loaded' );
    },

    // Function called when download errors
    function ( xhr ) {
        console.error( 'An error happened' );
    }
);
				
				
				
				scene.add( new THREE.AmbientLight( 0xffffff, .5 ) );

				light = new THREE.DirectionalLight( 0xffffff );
				light.position.set( 1, 1, 1 );
				scene.add( light );

				// postprocessing
				
				var renderPass = new THREE.RenderPass( scene, camera );

				composer = new THREE.EffectComposer( renderer );

				var effect = new THREE.ShaderPass( THREE.DotScreenShader );
				effect.uniforms[ 'scale' ].value = 6;
				// composer.addPass( effect );

				var effect = new THREE.ShaderPass( THREE.RGBShiftShader );
				effect.uniforms[ 'amount' ].value = 0.0035;
				effect.renderToScreen = true;

				// composer.addPass( effect );

				// Setup SSAO pass
				ssaoPass = new THREE.SSAOPass( scene, camera );
				ssaoPass.renderToScreen = true;
								ssaoPass.onlyAO = false;
				ssaoPass.radius = 30;
				ssaoPass.aoClamp = 0.5;
				ssaoPass.lumInfluence = 0.5;
				// Add pass to effect composer
				// effectComposer = new THREE.EffectComposer( renderer );

				
				composer.addPass( renderPass );

				composer.addPass( ssaoPass );
				/////
				
				// Setup SSAO pass
				// ssaoPass = new THREE.SSAOPass( scene, camera );
				// ssaoPass.renderToScreen = true;
				// // Add pass to effect composer
				// effectComposer = new THREE.EffectComposer( renderer );
				// effectComposer.addPass( renderPass );
				// effectComposer.addPass( ssaoPass );
				
				window.addEventListener( 'resize', onWindowResize, false );

			}

			function onWindowResize() {

				camera.aspect = window.innerWidth / window.innerHeight;
				camera.updateProjectionMatrix();

				renderer.setSize( window.innerWidth, window.innerHeight );
				composer.setSize( window.innerWidth, window.innerHeight );

			}

			function animate() {

				requestAnimationFrame( animate );

				object.rotation.x += 0.005;
				object.rotation.y += 0.01;

				composer.render();

			}

  function genesisDevice() {
  var mainColor = "#33AAEE";

    this.geometry = new THREE.PlaneGeometry(800 * 2, 800 * 2, 128, 128);

    this.material = new THREE.MeshLambertMaterial({
      color: mainColor
    });

    this.wireMaterial = new THREE.MeshLambertMaterial({
      color: 0x000000,
      wireframe: true,
      transparent: true
    })

    this.inception = function() {
      //plot terrain vertices
      for (var i = 0; i < this.geometry.vertices.length; i++) {
        if (i % 2 === 0 || i % 5 === 0 || i % 7 === 0) {
          var num = Math.floor(Math.random() * (30 - 20 + 1)) + 20;
          this.geometry.vertices[i].z = Math.random() * num;
        }
      }
      //define terrain model
      this.terrain = new THREE.Mesh(this.geometry, this.material);
      this.wire = new THREE.Mesh(this.geometry, this.wireMaterial);

      this.terrain.rotation.x = -Math.PI / 2;
      this.terrain.position.y = -20;
      this.wire.rotation.x = -Math.PI / 2;
      this.wire.position.y = -19.8;

      this.terrain.recieveShadow = true;
      this.terrain.castShadow = true;

      scene.add(this.terrain, this.wire);
      return this;
    }

    this.inception();
  }

  var terrain = genesisDevice();

