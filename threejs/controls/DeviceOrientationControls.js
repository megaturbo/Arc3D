/**
 * @author richt / http://richt.me
 * @author WestLangley / http://github.com/WestLangley
 *
 * W3C Device Orientation control (http://w3c.github.io/deviceorientation/spec-source-orientation.html)
 */

THREE.DeviceOrientationControls = function ( object ) {

	var scope = this;

	this.object = object;
	this.object.rotation.reorder( "YXZ" );

	this.enabled = true;

	this.deviceOrientation = {};
	this.screenOrientation = 0;

    this.offset = 0.0;

	var onDeviceOrientationChangeEvent = function ( event ) {

		scope.deviceOrientation = event;

	};

	var onScreenOrientationChangeEvent = function () {

		scope.screenOrientation = window.orientation || 0;

	};

	// The angles alpha, beta and gamma form a set of intrinsic Tait-Bryan angles of type Z-X'-Y''

	var setObjectQuaternion = function () {

		var zee = new THREE.Vector3( 0, 0, 1 );

		var euler = new THREE.Euler();

		var q0 = new THREE.Quaternion();

		var q1 = new THREE.Quaternion( - Math.sqrt( 0.5 ), 0, 0, Math.sqrt( 0.5 ) ); // - PI/2 around the x-axis

		return function ( quaternion, alpha, beta, gamma, orient ) {

			euler.set( beta, alpha, - gamma, 'YXZ' );                       // 'ZXY' for the device, but 'YXZ' for us

			quaternion.setFromEuler( euler );                               // orient the device

			quaternion.multiply( q1 );                                      // camera looks out the back of the device, not the top

			quaternion.multiply( q0.setFromAxisAngle( zee, - orient ) );    // adjust for screen orientation

		};

	}();

    this.addOffset = function(value){
        this.offset += value;
        console.log("of: " + this.offset);
    };

	this.connect = function() {

		onScreenOrientationChangeEvent(); // run once on load

		window.addEventListener( 'orientationchange', onScreenOrientationChangeEvent, false );
		window.addEventListener( 'deviceorientation', onDeviceOrientationChangeEvent, false );

		scope.enabled = true;

	};

	this.disconnect = function() {

		window.removeEventListener( 'orientationchange', onScreenOrientationChangeEvent, false );
		window.removeEventListener( 'deviceorientation', onDeviceOrientationChangeEvent, false );

		scope.enabled = false;

	};

	this.update = function () {

		if ( scope.enabled === false ) return;

		var alpha  = scope.deviceOrientation.alpha ? THREE.Math.degToRad( scope.deviceOrientation.alpha + this.offset) : 0; // Z
		var beta   = scope.deviceOrientation.beta  ? THREE.Math.degToRad( scope.deviceOrientation.beta  ) : 90; // X'
		var gamma  = scope.deviceOrientation.gamma ? THREE.Math.degToRad( scope.deviceOrientation.gamma ) : 0; // Y''
		var orient = scope.screenOrientation       ? THREE.Math.degToRad( scope.screenOrientation       ) : 0; // O

		setObjectQuaternion( scope.object.quaternion, alpha, beta, gamma, orient );

	};

    this.compassHeading = function( alpha, beta, gamma ) {

        var _x = beta; // beta value
        var _y = gamma; // gamma value
        var _z = alpha; // alpha value

        var cX = Math.cos( _x );
        var cY = Math.cos( _y );
        var cZ = Math.cos( _z );
        var sX = Math.sin( _x );
        var sY = Math.sin( _y );
        var sZ = Math.sin( _z );

        // Calculate Vx and Vy components
        var Vx = - cZ * sY - sZ * sX * cY;
        var Vy = - sZ * sY + cZ * sX * cY;

        // Calculate compass heading
        var compassHeading = Math.atan( Vx / Vy );

        // Convert compass heading to use whole unit circle
        if( Vy < 0 ) {
            compassHeading += Math.PI;
        } else if( Vx < 0 ) {
            compassHeading += 2 * Math.PI;
        }

        return compassHeading * ( 180 / Math.PI ); // Compass Heading (in degrees)
    };

	this.dispose = function () {

		this.disconnect();

	};

	this.connect();

};
