/*jshint esversion: 6 */

var CAMERA_DEFAULT_SPEED = 50;
var CAMERA_STATES = {GO: 0, TURN: 1, ELEVATOR: 2};

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
    this.state = CAMERA_STATES.GO;

    this.path = [];
    this.splines = [];
    this.splineLength = -1.0;
    this.distance = 0.0;

    /**
    * Set the path the camera shall follow.
    *
    * @param {Array} path : Array of THREE.Vector3 (the positions)
    * @return {Curve3} The curve created for the pathfinding.
    */
    this.setPath = function(path) {
        this.path = pathfinder.getPathPositions(path);
        this.splines = [];

        var fromElevator = false;
        var curve = new THREE.CatmullRomCurve3();

        // Create the curves
        for(var i = 0; i < path.length; i++){
            var p = this.path[i];
            var n = pathfinder.getNode(path[i]);

            // Create a new curve, and add it to the splines array
            if((n.name == 'elevator' && !fromElevator) || (n.name != 'elevator' && fromElevator))
            {
                // Push it if entering elevator
                if(n.name == 'elevator'){curve.points.push(p);}

                this.splines.push(curve);

                curve = new THREE.CatmullRomCurve3();

                if(n.name != 'elevator'){curve.points.push(this.path[i - 1]);}
            }

            // Add the point to the current created curve
            curve.points.push(p);

            // Set past node state
            if(n.name == 'elevator'){
                fromElevator = true;
            }else{
                fromElevator = false;
            }
        }

        // Add the remaining curve if it got at leaste one point.
        if(curve.points.length > 0){ this.splines.push(curve); }

        // Compute spline total length
        this.splineLength = 0.0;
        for(var i = 0; i < this.splines.length; i++)
        {
            this.splineLength += this.splines[i].getLength();
        }

        console.log("Spline is made of " + this.splines.length + " curves");

        return this.splines;
    };

    /**
    * Set the camera mode to running.
    */
    this.start = function(){
        this.isRunning = true;
        this.distance = 0.0;
        this.isPaused = false;
        this.state = CAMERA_STATES.GO;
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
        var t_camera = this.distance / this.splineLength;
        var t_look = 0;
        if(t_camera < 1.0){
            t_look = t_camera <= 0.98 ? t_camera + 0.02 : 1.0;
        }
        else {
            this.stop();
            return;
        }

        var p_camera = this.getPointAt( t_camera );
        var p_look = this.getPointAt( t_camera );
        this.camera.position.copy( p_camera );
        this.camera.lookAt( p_look );
    };

    this.getPointAt = function(t)
    {
        var distanceCurrentSpline = t * this.splineLength;
        var currentSplineId;

        for(var i = 0; i < this.splines.length; i++)
        {
            var sl = this.splines[i].getLength();
            if (distanceCurrentSpline - sl < 0.0)
            {
                currentSplineId = i;
                break;
            }
            distanceCurrentSpline -= sl;
        }

        var currentSpline = this.splines[currentSplineId];
        var currentSplineLength = currentSpline.getLength();
        var to01 = distanceCurrentSpline / currentSplineLength;
        return currentSpline.getPointAt(to01);
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
