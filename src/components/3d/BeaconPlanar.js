"use strict";

import * as THREE from "three";
import TwitterLogo from '../../images/twitter_PNG28.png';
const CanvasTextWrapper = require('canvas-text-wrapper').CanvasTextWrapper;

window.THREE = THREE;
let TWEEN = require("tween.js");

const TEXTURE_SIZE = 1024;
const PRIMARY = 0x53bdfd;
const GREEN = 0x1ec503;

const CONTRAST = 0x00ffff;
const FADE_OUT_TIME = 1000;
const SHOCKWAVE_ANIM_TIME = 1000;
const BILLBOARD_OPACITY = 0.8;

class Beacon extends THREE.Object3D {
  constructor(event, position, map, lifeSpan = 3000) {
    super();
    this.event = event;
    this.alive = false;
    this.beaconPosition = new THREE.Vector3();
    this.lifeSpan = event.lifeSpan;
    if (this.lifeSpan === undefined) {
      this.lifeSpan = lifeSpan;
    }

    this.GeoMarker = this.createMarker(
      event,
      position,
      map,
      lifeSpan
    );
    this.name = "beacon";
  }

  activate() {
    this.alive = true;
    this.fadeIn();
    this.popIn();
    this.kickoffFX();
    if (this.lifeSpan > 0) {
      setTimeout(this.fadeOut.bind(this), this.lifeSpan);
    }
    requestAnimationFrame(this.renderLoop.bind(this));
  }

  renderLoop(t) {
    TWEEN.update();
  }

  getPosition() {
    return this.beaconPosition;
  }

  makeShaderSprite(map, size = 0.5) {
    // size = Math.max(size, 0.3);
    // size = Math.min(size, 1.0);
    
    let scale = size;

    let shaderSpriteMaterial = new THREE.SpriteMaterial({
      map: map,
      color: 0xffffff,
      transparent: true,
      opacity: 1,
      depthWrite: false,
      depthTest: false,
      blending: THREE.AdditiveBlending,
      fog: true
    });

    let sprite = new THREE.Sprite(shaderSpriteMaterial);
    // sprite.scale.set(scale , scale /2, 1.0);
    sprite.scale.set(100 , 100 /2, 1.0);
    return sprite;
  }

  makeTextSprite(message, parameters) {
    const OVERLAY_WIDTH = 1024;
    const OVERLAY_HEIGHT = 512;
    const TWITTER_PROFILE_WIDTH = OVERLAY_HEIGHT / 3;
    const TWITTER_PROFILE_HEIGHT = OVERLAY_HEIGHT / 3;
    let canvas = document.createElement("canvas");
    let context = canvas.getContext("2d");
    canvas.width = OVERLAY_WIDTH + 100;
    canvas.height = OVERLAY_WIDTH + 100; //for media
    context.fillStyle = "black";

    let drawTextSub = (context) => {
          // DRAW TEXT
      context.font = 'bold 72px Oswald';
      context.fillStyle = "rgba(0,0,0,1)";            
      // TITLE
      context.fillText(
        `@${message.title}`,
        TWITTER_PROFILE_WIDTH / 2,
        OVERLAY_HEIGHT - TWITTER_PROFILE_WIDTH / 2
      );

      // TITLE
      let allHashTags = message.entities.hashtags.reduce(
        (accumulator, hashTag) =>  `${accumulator} #${hashTag.text}`, '' );
        context.font = 'bold 42px Oswald';
        context.fillText(
          allHashTags,
          TWITTER_PROFILE_WIDTH / 2,
          OVERLAY_HEIGHT - TWITTER_PROFILE_WIDTH / 5
        );

        // BODY
        context.font = 'bold 42px Oswald';
        this.wrapText(context, message.subtitle, 
          OVERLAY_HEIGHT - TWITTER_PROFILE_WIDTH / 2, 
          TWITTER_PROFILE_WIDTH / 2, 
          OVERLAY_HEIGHT + TWITTER_PROFILE_WIDTH / 2, 
          50);
      }


    // get size data (height depends only on font size)
    let metrics = context.measureText(message.title);
    let textWidth = metrics.width;

    // DRAW BOTTOM UP

    // DRAW BLACK BACKGROUND
    context.fillStyle = "white";
    context.fillRect(0, 0, OVERLAY_WIDTH, OVERLAY_HEIGHT);

    if (message.user.profile_background_image_url_https && false) {
      let img = new Image();
      img.crossOrigin = "Anonymous";
      img.onload = () => {
        context.drawImage(
          img,
          0,
          0,
          OVERLAY_WIDTH,
          OVERLAY_HEIGHT,
        );

        drawTextSub(context);
        
      };
      img.src =message.user.profile_background_image_url_https;
    }

    let twitterImage = new Image();
    const LOGO_DIMENTION = TWITTER_PROFILE_WIDTH*2.5;
    twitterImage.src = TwitterLogo;
    context.drawImage(twitterImage, 
      OVERLAY_WIDTH - 300, 
      OVERLAY_HEIGHT - 350, 
      LOGO_DIMENTION,
      LOGO_DIMENTION,
    );

    let tweetPhotos = message.entities.media ? message.entities.media.filter((e) => e.type == 'photo') : []

    tweetPhotos.map((pic, i, fullArray) => {
      let img = new Image();
      img.crossOrigin = "Anonymous";
      img.onload = () => {
        context.drawImage(
          img,
          OVERLAY_HEIGHT * i,
          OVERLAY_HEIGHT,
          OVERLAY_WIDTH,
          OVERLAY_WIDTH,
        );

      drawTextSub(context);
        
      };
      img.src = pic.media_url_https;
    })

    // DRAW ANY IMAGES
    if (message.image) {
      context.drawImage(message.image, 64, 64, 64, 64);
    }

    if (message.imageUrl) {
      let img = new Image();
      img.crossOrigin = "Anonymous";
      img.onload = () => {
        context.drawImage(
          img,
          TWITTER_PROFILE_WIDTH / 2,
          TWITTER_PROFILE_WIDTH / 2,
          TWITTER_PROFILE_WIDTH,
          TWITTER_PROFILE_HEIGHT
        );
      drawTextSub(context);
      };
      img.src = message.imageUrl;
    }
    
    // CORNER FLAGS
    if( false ){
      context.fillStyle = "rgba(0,0,0,1)";      
      context.beginPath();
      context.moveTo(0, 0);
      context.lineTo(OVERLAY_HEIGHT/5, 0);
      context.lineTo(0, OVERLAY_HEIGHT/5);
      context.fill();
    }
    

    drawTextSub(context);
    
    // canvas contents will be used for a texture
    let texture = new THREE.Texture(canvas);
    texture.needsUpdate = true;
    // texture.anisotropy = 32;
    texture.generateMipmaps = false;
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;

    let spriteMaterial = new THREE.SpriteMaterial({
      map: texture,
      color: 0xffffff,
      transparent: true,
      opacity: 1,
      depthWrite: false,
      depthTest: false,
      blending: THREE.NormalBlending,
      fog: true,
      side: THREE.DoubleSide,
    });
    var sprite = new THREE.Sprite(spriteMaterial);
    // sprite.scale.set(42, 42, 1.0);
    // sprite.scale.set(10, 10, 1.0);
    
    sprite.scale.set(10, 10, 1);

    return sprite;
  }



  wrapText(ctx, text, x, y, maxWidth, lineHeight) {
    var words = text.split(' ');
    var line = '';

    for(var n = 0; n < words.length; n++) {
      var testLine = line + words[n] + ' ';
      var metrics = ctx.measureText(testLine);
      var testWidth = metrics.width;
      if (testWidth > maxWidth && n > 0) {
        ctx.fillText(line, x, y);
        line = words[n] + ' ';
        y += lineHeight;
      }
      else {
        line = testLine;
      }
    }
    ctx.fillText(line, x, y);
  }

  fadeIn() {
    let obj;
    this.children.map(e => {
      if (e.material) {
        obj = e.material;
        obj.transparent = true;
        obj.opacity = 0;
        let anim = new TWEEN.Tween(obj)
          .easing(TWEEN.Easing.Quadratic.InOut)
          .to({ opacity: BILLBOARD_OPACITY }, FADE_OUT_TIME)
          .start();
      } else if (e.materials) {
        obj = e.materials[0];
        obj.transparent = true;
        obj.opacity = 0;
        let anim = new TWEEN.Tween(obj)
          .easing(TWEEN.Easing.Quadratic.InOut)
          .to({ opacity: BILLBOARD_OPACITY }, FADE_OUT_TIME)
          .start();
      }
    });
  }

  popIn() {
    let obj;
    this.children.map(e => {
      if (e.material || e.materials) {
        obj = e;
        let size = 30;
        if (this.event.impact) {
          size = 6 * this.event.impact;
        }
  
        e.scale.set(1,1,1);
        let anim = new TWEEN.Tween(e.scale)
          .easing(TWEEN.Easing.Elastic.Out)
          .to ({ y: size, x: size, z: 1 }, FADE_OUT_TIME)
          .start();
      }
    })
  }

  fadeOut() {
    let obj;
    this.children.map(e => {
      if (e.material) {
        obj = e.material;
        obj.transparent = true;
        let anim = new TWEEN.Tween(obj)
          .easing(TWEEN.Easing.Quadratic.InOut)
          .to({ opacity: 0 }, FADE_OUT_TIME)
          .onComplete(() => {
            this.alive = false;
          })
          .start();
      } else if (e.materials) {
        obj = e.materials[0];
        obj.transparent = true;
        let anim = new TWEEN.Tween(obj)
          .easing(TWEEN.Easing.Quadratic.InOut)
          .to({ opacity: 0 }, FADE_OUT_TIME)
          .onComplete(() => {
            this.alive = false;
          })
          .start();
      }
    });
  }

  kickoffFX() {
    if (this.shockwave) {
      this.shockwave.material.opacity = 0.8;
      let blastFade = new TWEEN.Tween(this.shockwave.material)
        .easing(TWEEN.Easing.Quadratic.Out)
        .to({ opacity: 0.0 }, SHOCKWAVE_ANIM_TIME)
        .start();
      
      let size = 60;
      if (this.event.impact) {
        size = 1 * this.event.impact;
      }

      let blastGrow = new TWEEN.Tween(this.shockwave.scale)
        .easing(TWEEN.Easing.Quadratic.Out)
        .to({ y: size, x: size, z: 1 }, SHOCKWAVE_ANIM_TIME)
        // .to({ x: size/20, y: size, z: size/20 }, SHOCKWAVE_ANIM_TIME)
        .start();
        
      // let shockwavePosition = this.shockwave.position;
      // let blastMoveUp = new TWEEN.Tween(this.shockwave.position)
      //   .easing(TWEEN.Easing.Quadratic.Out)
      //   .to({ x: shockwavePosition.x, y: size*1.50, z: shockwavePosition.z }, SHOCKWAVE_ANIM_TIME)
      //   .start();
    }
  }

  latLonToVector3(lat, lon, height) {
    const PI_HALF = Math.PI / 2;
    height = height ? height : 0;

    var vector3 = new THREE.Vector3(0, 0, 0);

    lon = lon + 10;
    lat = lat - 2;

    var phi = PI_HALF - lat * Math.PI / 180 - Math.PI * 0.01;
    var theta = 2 * Math.PI - lon * Math.PI / 180 + Math.PI * 0.06;
    var rad = height;
    // var rad = 600 + height;

    vector3.x = Math.sin(phi) * Math.cos(theta) * rad;
    vector3.y = Math.cos(phi) * rad;
    vector3.z = Math.sin(phi) * Math.sin(theta) * rad;

    return vector3;
  }

  createMarker(event, position, map, lifespan = 6000) {
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
      this.beacon = this.makeShaderSprite( map, event.impact);
      this.beacon.position.x = position.x;
      this.beacon.position.y = position.y;
      this.beacon.position.z = position.z;
    }

    if ( event.shockwave ) {
      // let geo = new THREE.CircleGeometry(1, 32);
      let geo = new THREE.RingGeometry( 8.5, 10, 30, 3 );
      // let geo = new THREE.CylinderGeometry( 1, 1, 3, 32, 32 );
      
      let material = new THREE.MeshLambertMaterial({
        color: 0x00ff00,
        // color: CONTRAST,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 1.0,
        emissiveIntensity: 0.5,
        emissive: 0xFFFFFF
      });
      this.shockwave = new THREE.Mesh(geo, material);

      this.shockwave.position.x = position.x;
      this.shockwave.position.y = position.y;
      this.shockwave.position.z = position.z;
      this.shockwave.scale.set( 0,0,0 )
      var newDir = new THREE.Vector3(0, 1, 0);
      var pos = new THREE.Vector3();
      pos.addVectors(newDir, this.shockwave.position);
      this.shockwave.lookAt(pos);

      this.add(this.shockwave);
    }

    if (!event.title) {
      event.title = `${position.x}, ${position.y}`;
    }

    if (!event.subtitle) {
      event.subtitle = `$${2000 * Math.random()} | 6 mins ago`;
    }

    this.spritey = this.makeTextSprite(event, {});

    if (position) {
      this.spritey.position.x = position.x;
      this.spritey.position.y = position.y;
      this.spritey.position.z = position.z;

      this.add(this.spritey);
      if (this.beacon) {
        this.add(this.beacon);
      }
    }

    return this;
  }
}

export default Beacon;
