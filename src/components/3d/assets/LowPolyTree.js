"use strict";

import * as THREE from "three";
require("imports-loader?THREE=three!../../externals/three.js/examples/js/loaders/OBJLoader2.js");
import TreeObj from '../../../static/3dAssets/LowTree/Tree low.obj';

class LowPolyTree extends THREE.Object3D {
    // const treeObj = () => 

    constructor(cb) {
        this.treeObj;
        this.cb = cb;
        let loader = new THREE.OBJLoader2();
        loader.load( TreeObj, this.loaded, null, null, null, true );
    }

    loaded(obj) {
        this.treeObj = obj;
        this.cb()
    }
}
    
export default LowPolyTree;