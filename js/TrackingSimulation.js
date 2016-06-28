/*jshint esversion: 6 */

var CAMERA_DEFAULT_SPEED = 50;

/**
* Creates a TrackingSimulation object
*
* @constructor
* @this {CameraTracking}
* @param {THREE.Camera} camera : A three.js camera
*/
ARC3D.TrackingSimulation = function(camera) {
    this.camera = camera;
    this.isRunning = false;
    this.isPaused = false;
    this.speed = CAMERA_DEFAULT_SPEED;

    this.path = [];
    this.spline = undefined;
    this.distance = 0.0;

    /**
    * Set the path the camera shall follow.
    *
    * @param {Array} path : Array of THREE.Vector3 (the positions)
    * @return {Curve3} The curve created for the pathfinding.
    */
    this.setPath = function(path) {
        this.path = path;
        this.spline = new THREE.CatmullRomCurve3(this.path);
        // for(var i = 0; i < path.length; i++){
        //     var p = this.path[i];
        //     console.log(p);
        //     this.spline.points.push(new THREE.Vector3(i.x, i.y, i.z));
        // }
        return this.spline;
    };

    /**
    * Set the camera mode to running.
    */
    this.start = function(){
        this.isRunning = true;
        this.distance = 0.0;
        this.isPaused = false;
    };

    /**
    * Stop and reset the camera.
    */
    this.stop = function(){
        this.isRunning = false;
    };

    /**
    * Toggle pause mode
    * @return True if now it's in pause. False if it's not
    */
    this.togglePause = function(){
        this.isPaused = !this.isPaused;
        return this.isPaused;
    };

    /**
    * Update the camera position. Have to be called every frame.
    *
    * @param {Number} delta : Delta time since the last frame
    */
    this.update = function(delta){
        if(!this.isRunning || this.isPaused)
            return;

        this.distance += delta * this.speed;
        var t_camera = this.distance / this.spline.getLength();
        var t_look = 0;
        if(t_camera < 1.0){
            t_look = t_camera <= 0.98 ? t_camera + 0.02 : 1.0;
        }
        else {
            this.stop();
            return;
        }

        var p_camera = this.spline.getPointAt( t_camera );
        var p_look = this.spline.getPointAt( t_look );
        this.camera.position.copy( p_camera );
        this.camera.lookAt( p_look );
    };

    /**
    * Set the camera velocity
    *
    * @param {Number} speed : The speed to set
    */
    this.setSpeed = function (speed) {
        this.speed = speed;
    };
};