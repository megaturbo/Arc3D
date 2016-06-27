/*jshint esversion: 6 */

var CAMERA_DEFAULT_SPEED = 50;

/**
* Creates a TrackingSimulation object
*
* @constructor
* @this {CameraTracking}
* @param {THREE.Camera} camera : A three.js camera
*/
ARC3D.TrackingLive = function(camera) {
    this.camera = camera;
    this.isRunning = false;
    this.isPaused = false;
    this.speed = CAMERA_DEFAULT_SPEED;

    this.path = [];
    this.spline = undefined;
    this.distance = 0.0;

    this.cube = new THREE.Mesh( new THREE.CubeGeometry( 10, 10, 10 ), new THREE.MeshNormalMaterial() );
    scene.add(this.cube);

    /**
    * Set the path the camera shall follow.
    *
    * @param {Array} path : Array of THREE.Vector3 (the positions)
    * @return {Curve3} The curve created for the pathfinding.
    */
    this.setPath = function(path) {
        this.path = path;
        this.spline = new THREE.CatmullRomCurve3(this.path);
        return this.spline;
    };

    /**
    * Set the camera mode to running.
    */
    this.start = function(){
        this.isRunning = true;
        this.distance = 0.0;
        this.isPaused = false;
        this.camera.position.copy( 0.0 );
        this.camera.lookAt(this.spline.getPointAt(0.01));
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

        // Distance = t * v
        var d = this.distance;
        d += delta * this.speed;
        var t_camera = d / this.spline.getLength();
        var t_look = 0;
        if(t_camera < 1.0){
            t_look = t_camera <= 0.98 ? t_camera + 0.02 : 1.0;
        }
        else {
            this.stop();
            return;
        }


        // Point on the spline
        var p_camera = this.spline.getPointAt( t_camera );
        var p_look = this.spline.getPointAt( t_look );
        this.cube.position.copy(p_look);

        var frustum = new THREE.Frustum();
        var projScreenMatrix = new THREE.Matrix4();
        projScreenMatrix.multiplyMatrices( camera.projectionMatrix, camera.matrixWorldInverse );

        frustum.setFromMatrix( new THREE.Matrix4().multiplyMatrices( camera.projectionMatrix, camera.matrixWorldInverse ) );

        if(frustum.containsPoint(p_look)){
            this.camera.position.copy( p_camera );
            this.distance = d;
        }

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
