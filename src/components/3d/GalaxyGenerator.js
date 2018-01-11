import * as THREE from "three";
import SpriteGradient from '../../static/3dAssets/textures/gradient.png';
import SpritePantone975c from '../../static/3dAssets/textures/pantone-975c.png';
THREE.ImageUtils.crossOrigin = true;

class GalaxyGenerator {
    
  constructor(){
    this.obj3d = new THREE.Object3D();    
  }
    renderLoop() {
      
      let A = 1500;
      let f = 0.000006;
      let phase = 0;
      let t = Date.now();
      this.obj3d.traverse((obj) => {
        if( obj instanceof THREE.Points ){
          phase = parseInt(obj.name[obj.name.length - 1]);
          let y = A * Math.sin( 2 * Math.PI * f * t + phase );
          obj.position.y = y ;
          if( 0 === phase ) obj.rotateX( 0.0005 )
          if( 1 === phase ) obj.rotateX( -0.0008 )
          if( 2 === phase ) obj.rotateX( 0.0002)
        }
      })

    };
  
    generateUniverse(iterations, scene ) {
        // setting the scene
        var space = "#151718";
        var canvas_height = window.innerHeight;
        var canvas_width = window.innerWidth;

        // renderer.shadowMap.enabled = true;
        // renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        // renderer.setClearColor(space, 1);

        let particles = this.makeParticles(iterations);
        let universe = this.getParticleUniverse(particles);
        return this.createUniverse(universe);

    }

    getRandomColor() {

      const COLOUR_1 = 0xFDDD79;
      const COLOUR_2 = 0xFCC551;
      const COLOUR_3 = 0xE82664;
      const COLOUR_4 = 0xEE7480;

      let colours = [COLOUR_1, COLOUR_2, COLOUR_3, COLOUR_4];
      return  colours[Math.floor(Math.random()*colours.length)];
  }
  
   makeParticles(num) {
    let particleArray = []
    for (var i = 0; i < num; i++) {
      var c = this.getRandomColor();
      var o = Math.floor(Math.random() * (75 - 0 + 1)) / 100;
      var s = Math.floor(Math.random() * (15 - 5 + 1)) + 3;
      var particleCount = Math.floor(Math.random() * (1000 - 250 + 1)) + 250;
      var particle = {
        color: c,
        opacity: o,
        size: s,
        number: particleCount
      }
      particleArray.push(particle);
    }
    return particleArray;
  }

   ParticleMaterial(c, s, o) {
    return new THREE.PointsMaterial({
      color: c,
      size: s,
      transparent: true,
      opacity: o,
      // map: THREE.ImageUtils.loadTexture(SpriteGradient
        map: THREE.ImageUtils.loadTexture(SpritePantone975c)
    });
  }

   ParticleSystem(number) {
    let particles = new THREE.Geometry();
    for (var i = 0; i < number; i++) {
      var x = (Math.random() - 0.5) * 4000;
      var y = (Math.random() - 0.5) * 4000;
      var z = (Math.random() - 0.5) * 4000;
      particles.vertices.push(new THREE.Vector3(x, y, z));
    }
    return particles;
  }

  getParticleUniverse(particles) {
    let galaxies = [];
    var pArr = particles;
    for (var i = 0; i < pArr.length; i++) {
      var pMaterial =  this.ParticleMaterial(pArr[i].color, pArr[i].size, pArr[i].opacity);
      var pSystem = this.ParticleSystem(pArr[i].number);
      var pObject = {
        material: pMaterial,
        system: pSystem
      };
      galaxies.push(pObject);
    }
    return galaxies;
  }

   createUniverse(universe) {
    this.obj3d.name = 'pointUniverse';
    universe.map((galaxy, index) => {
        let pointCloud = new THREE.Points(galaxy.system, galaxy.material)
        pointCloud.name = `star-${index%3}`
        this.obj3d.add(pointCloud)
    });
    return this.obj3d;
  }

}

export default GalaxyGenerator;
