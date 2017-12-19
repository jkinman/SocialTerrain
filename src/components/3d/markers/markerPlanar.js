class CreateMarkerPlanar {
  
  constructor(event, position, map, lifespan = 6000) {
    this.beacon = undefined;
    this.shockwave = undefined;
    // let position = this.latLonToVector3(
    //   event.coordinates[0],
    //   event.coordinates[1],
    //   globeDiameter
    // );
    // let flagpolePosition = this.latLonToVector3(
    //   event.coordinates[0],
    //   event.coordinates[1],
    //   globeDiameter + 1
    // );

    this.beaconPosition = position;
    if (event.shader) {
      this.beacon = this.makeShaderSprite(event.impact, map);
      this.beacon.position.x = position.x;
      this.beacon.position.y = position.y;
      this.beacon.position.z = position.z;
    }

    if (event.shockwave) {
      let geo = new THREE.CircleGeometry(1, 32);
      let material = new THREE.MeshLambertMaterial({
        color: CONTRAST,
        side: THREE.BackSide,
        transparent: true,
        opacity: 1.0,
        emissiveIntensity: 0.5,
        emissive: 0xffffff
      });
      this.shockwave = new THREE.Mesh(geo, material);

      this.shockwave.position.x = position.x;
      this.shockwave.position.y = position.y;
      this.shockwave.position.z = position.z;

      this.add(this.shockwave);
    }

    if (!event.title) {
      event.title = `${position.x}, ${position.y}`;
    }

    if (!event.subtitle) {
      event.subtitle = `$${2000 * Math.random()} | 6 mins ago`;
    }

    this.spritey = this.makeTextSprite(event, {});

    if (event.coordinates) {
      this.spritey.position.x = flagpolePosition.x;
      this.spritey.position.y = flagpolePosition.y;
      this.spritey.position.z = flagpolePosition.z;

      this.add(this.spritey);
      if (this.beacon) {
        this.add(this.beacon);
      }
    }

    return this;
  }
}
export default CreateMarkerPlanar;
