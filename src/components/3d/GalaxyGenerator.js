import * as THREE from "three";
import SpriteGradient from '../../static/3dAssets/textures/gradient.png';
THREE.ImageUtils.crossOrigin = true;

class GalaxyGenerator {
    
    renderLoop() {
      //   spin the stars
      // scene.rotation.y -= .0002;
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
        var letters = '0123456789ABCDEF'.split('');
        var color = '#';
        for (var i = 0; i < 6; i++) {
            color += letters[Math.floor(Math.random() * 16)];
        }
        return color;
  }
  
   makeParticles(num) {
    let particleArray = []
    for (var i = 0; i < num; i++) {
      var c = this.getRandomColor();
      var o = Math.floor(Math.random() * (100 - 0 + 1)) / 100;
      var s = Math.floor(Math.random() * (15 - 5 + 1)) + 5;
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
      map: THREE.ImageUtils.loadTexture(SpriteGradient
      )
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
    let obj3d = new THREE.Object3D();
    obj3d.name = 'pointUniverse';
    universe.map((galaxy, index) => {
        let pointCloud = new THREE.Points(galaxy.system, galaxy.material)
        pointCloud.name = `star-${index%3}`
        obj3d.add(pointCloud)
    });
    return obj3d;
  }

}

export default GalaxyGenerator;
