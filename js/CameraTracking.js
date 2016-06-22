/*jshint esversion: 6 */

var CAMERA_DEFAULT_SPEED = 50;

/**
* Creates a CmaeraTracking object
*
* @constructor
* @this {CameraTracking}
* @param {THREE.Camera} camera : A three.js camera
*/
ARC3D.CameraTracking = function(camera) {
    this.camera = camera;
    this.isRunning = false;
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
    };

    /**
    * Stop and reset the camera.
    */
    this.stop = function(){
        this.isRunning = false;
    };

    /**
    * Toggle pause mode
    */
    this.togglePause = function(){
        this.isRunning = !this.isRunning;
    };

    /**
    * Update the camera position. Have to be called every frame.
    *
    * @param {Number} delta : Delta time since the last frame
    */
    this.update = function(delta){
        if(!this.isRunning)
            return;

        this.distance += delta * this.speed;
        var t_camera = this.distance / this.spline.getLength();
        var t_look = 0;
        if(t_camera < 1.0){
            t_look = t_camera + 0.02;
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
