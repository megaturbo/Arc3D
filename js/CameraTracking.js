/*jshint esversion: 6 */

var CAMERA_DEFAULT_SPEED = 50;

/**
* Creates a CmaeraTracking object
*
* @constructor
* @this {CameraTracking}
* @param {THREE.Camera} A three.js camera
*/
function CameraTracking(camera){
    this.camera = camera;
    this.path = [];
    this.spline = undefined;
    this.IS_RUNNING = false;
    this.IS_ROTATING = false;

    this.current_id = 0;
    this.speed = CAMERA_DEFAULT_SPEED;
}

/**
* Set the path the camera shall follow.
*
* @param {Array} Array of THREE.Vector3 (the positions)
*/
CameraTracking.prototype.set_path = function(path){
    this.path = path;
    this.spline = new THREE.Spline(this.path);
};

/**
* Set the camera mode to running.
*/
CameraTracking.prototype.start = function(){
    this.IS_RUNNING = true;
    this.current_id = 0;
    this.camera.position.copy(this.path[this.current_id]);
};

/**
* Stop and reset the camera.
*/
CameraTracking.prototype.stop = function(){
    this.IS_RUNNING = false;
    this.IS_ROTATING = false;
};


/**
* Update the camera position. Have to be called every frame.
*
* @param {Number} delta time since the last frame
*/
CameraTracking.prototype.update = function(delta){
    if(!this.IS_RUNNING)
        return;

    // init the node we come from and the node we are going to
    var v_from = this.path[this.current_id];
    var v_to = this.path[this.current_id + 1];

    // Computing
    var v_dir = v_to.clone().sub(this.camera.position).normalize();
    var v_shifting = v_dir.multiplyScalar(delta * this.speed);

    if(this.IS_ROTATING)
    {
        var cam = this.camera.clone();
        cam.lookAt(v_to);
        this.camera.quaternion.slerp(cam.quaternion, 0.01);
    }
    else
    {
        // Setting camera position and direction
    this.camera.quaternion.normalize();
        this.camera.lookAt(v_to);
        this.camera.position.add(v_shifting);

        if(this.camera.position.distanceTo(v_to) < 10)
        {
            this.current_id++;
            // this.IS_ROTATING = true;
        }
    }
};

/**
* Set the camera velocity
*
* @param {Number} The speed to set
*/
CameraTracking.prototype.set_speed = function (speed) {
    this.speed = speed;
};
