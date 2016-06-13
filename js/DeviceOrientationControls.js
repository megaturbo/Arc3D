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

	var onDeviceOrientationChangeEvent = function ( event ) {

		scope.deviceOrientation = event;

		if ( scope.initialRoll === undefined && event.gamma ) {

			scope.initialRoll = THREE.Math.degToRad( event.gamma );
			//scope.initialScreenOffset -= scope.initialRoll;

		}

	};

	var onScreenOrientationChangeEvent = function () {

		scope.screenOrientation = THREE.Math.degToRad( window.orientation || 0 );

		if ( scope.initialScreenOffset === undefined ) {

			scope.initialScreenOffset = scope.screenOrientation;

		}

	};

	// The angles alpha, beta and gamma form a set of intrinsic Tait-Bryan angles of type Z-X'-Y''

	var setObjectQuaternion = function () {

		var euler = new THREE.Euler();

		var xAxis = new THREE.Vector3( 1, 0, 0 );
		var yAxis = new THREE.Vector3( 0, 1, 0 );
		var zAxis = new THREE.Vector3( 0, 0, 1 );

		var tempQuat  = new THREE.Quaternion();
		var worldQuat = new THREE.Quaternion();

		worldQuat.setFromAxisAngle( xAxis, - Math.PI / 2 ); // - PI/2 around the x-axis

		return function ( quaternion, alpha, beta, gamma, orient ) {

			// 'ZXY' for the device, but 'YXZ' for us
			euler.set( beta, alpha, - gamma, 'YXZ' );

			// orient the device
			quaternion.setFromEuler( euler );

			// adjust by initial non-absolute device orientation angle offset
			quaternion.multiplyQuaternions( tempQuat.setFromAxisAngle( yAxis, scope.initialScreenOffset || 0 ), quaternion );

			// camera looks out the back of the device, not the top
			quaternion.multiply( worldQuat );

			// adjust for current screen orientation angle
			quaternion.multiply( tempQuat.setFromAxisAngle( zAxis, - orient ) );

		};

	}();

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

		if ( scope.enabled === false || !scope.deviceOrientation.alpha ) return;

		var alpha  =  scope.deviceOrientation.alpha    ? THREE.Math.degToRad( scope.deviceOrientation.alpha ) : 0; // Z
		var beta   =  scope.deviceOrientation.beta     ? THREE.Math.degToRad( scope.deviceOrientation.beta  ) : 0; // X'
		var gamma  =  scope.deviceOrientation.gamma    ? THREE.Math.degToRad( scope.deviceOrientation.gamma ) : 0; // Y''

		var orient =  scope.screenOrientation || 0;

		setObjectQuaternion( scope.object.quaternion, alpha, beta, gamma, orient );

	};

	this.dispose = function () {

		this.disconnect();

	};

	this.connect();

};
