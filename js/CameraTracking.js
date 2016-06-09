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

    this.current_id = 0;
    this.speed = CAMERA_DEFAULT_SPEED;
    this.timer = 0.0;
}

/**
* Set the path the camera shall follow.
*
* @param {Array} Array of THREE.Vector3 (the positions)
*/
CameraTracking.prototype.set_path = function(path){
    this.path = path;
    this.spline = new THREE.CatmullRomCurve3(this.path);
};

/**
* Set the camera mode to running.
*/
CameraTracking.prototype.start = function(){
    this.IS_RUNNING = true;
    this.timer = 0.0;
    this.current_id = 0;
    this.camera.position.copy(this.path[this.current_id]);
};

/**
* Stop and reset the camera.
*/
CameraTracking.prototype.stop = function(){
    this.IS_RUNNING = false;
};


/**
* Update the camera position. Have to be called every frame.
*
* @param {Number} delta time since the last frame
*/
CameraTracking.prototype.update = function(delta){
    if(!this.IS_RUNNING)
        return;

    this.timer += delta;
    var t_camera = (this.speed * this.timer) / this.spline.getLength();
    var t_look = t_camera + 0.01;

    var p_camera = this.spline.getPointAt( t_camera );
    var p_look = this.spline.getPointAt( t_look );
    this.camera.position.copy( p_camera );
    this.camera.lookAt( p_look );
};

/**
* Set the camera velocity
*
* @param {Number} The speed to set
*/
CameraTracking.prototype.set_speed = function (speed) {
    this.speed = speed;
};
