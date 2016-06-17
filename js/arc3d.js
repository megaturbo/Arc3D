var ARC3D = {};


ARC3D.ControlModes = { FLY: 0, GYRO: 1};
ARC3D.controlMode = ARC3D.ControlModes.GYRO;

ARC3D.defaultCameraPosition = new THREE.Vector3(518.1343902256439, 179.21829815866715, -204.30850284213201);
ARC3D.defaultCameraRotation = new THREE.Vector3(-0.1076350906304018, 1.5321409768616594, 0.07200147984575293);

ARC3D.isPositionDefined = false;

/**
* Get url paramters. From:
http://stackoverflow.com/questions/19491336/get-url-parameter-jquery-or-how-to-get-query-string-values-in-js
*/
ARC3D.getUrlParameter = function getUrlParameter(sParam) {
    var sPageURL = decodeURIComponent(window.location.search.substring(1)),
    sURLVariables = sPageURL.split('&'),
    sParameterName,
    i;

    for (i = 0; i < sURLVariables.length; i++) {
        sParameterName = sURLVariables[i].split('=');

        if (sParameterName[0] === sParam) {
            return sParameterName[1] === undefined ? true : sParameterName[1];
        }
    }
};



ARC3D.switchControls = function(){
    switch( ARC3D.controlMode ) {
        case ARC3D.ControlModes.FLY:
        controls = new THREE.DeviceOrientationControls( camera , renderer.domElement);
        ARC3D.controlMode = ARC3D.ControlModes.GYRO;
        break;

        case ARC3D.ControlModes.GYRO:
        controls = new THREE.FlyControls(camera, renderer.domElement);
        controls.movementSpeed = 100;
        controls.domElement = container;
        controls.rollSpeed = 1;
        controls.autoForward = false;
        controls.dragToLook = true;
        ARC3D.controlMode = ARC3D.ControlModes.FLY;
        break;
    }
};


ARC3D.initNodes = function(){
    // Clear scene
    while(lines.length !== 0 && boxes.length !== 0)
    {
        scene.remove(lines.pop());
        scene.remove(boxes.pop());
    }

    // Materials and Geometry
    var box_geometry = new THREE.BoxGeometry(2, 2, 2);
    var box_mat_yellow = new THREE.MeshBasicMaterial( {color: 0xffff00 } );
    var box_mat_red = new THREE.MeshBasicMaterial( {color: 0xff0000 } );
    var lin_mat_yellow = new THREE.LineBasicMaterial( {color: 0xffff00 } );
    var lin_mat_red = new THREE.LineBasicMaterial( {color: 0xff0000 } );

    nodes.forEach(function(node){
        // Add links
        node.neighbors.forEach(function(neighbor_id){
            var line_geometry = new THREE.Geometry();
            var lin_mat = lin_mat_red;
            if((path[path.indexOf(node.id) - 1] == neighbor_id) || (path[path.indexOf(neighbor_id) - 1] == node.id))
            {
                lin_mat = lin_mat_yellow;
            }
            var neighbor = pathfinder.getNode(neighbor_id);
            line_geometry.vertices.push(
                node.position,
                neighbor.position
            );
            var line = new THREE.Line(line_geometry, lin_mat);
            lines.push(line);
            scene.add(line);
        });

        // Add box
        var box_mat = path.indexOf(node.id) != -1 ? box_mat_yellow : box_mat_red;
        var box_mesh = new THREE.Mesh(box_geometry, box_mat);
        box_mesh.position.copy(node.position);
        box_mesh.name = node.id;
        boxes.push(box_mesh);
        scene.add(box_mesh);
    });

    // console.log(JSON.stringify(nodes));      Can be used to have a .json output
};



/*
*   Log some informations on key press
*/
ARC3D.keyEvent = function(e) {
    var event = window.event ? window.event : e;
    if(event.keyCode == 32){
        var cpos = camera.position;
        var point = {id:key_points.length + 3000, position:{x:cpos.x, y:cpos.y, z:cpos.z}, neighbors:[]};
        key_points.push(point);

        var light = new THREE.PointLight( 0xffffff, 1, 0 );

        light.position.copy(cpos)
        scene.add(light);

        var object;

        console.log(JSON.stringify(key_points));
    }
};



ARC3D.geoFindMe = function() {
    var output = document.getElementById("out");

    if (!navigator.geolocation){
        output.innerHTML = "<p>Geolocation is not supported by your browser</p>";
        return;
    }

    function success(position) {
        var latitude  = position.coords.latitude;
        var longitude = position.coords.longitude;

        output.innerHTML = '<p>Latitude is ' + latitude + '° <br>Longitude is ' + longitude + '°</p>';

        var img = new Image();
        img.src = "https://maps.googleapis.com/maps/api/staticmap?center=" + latitude + "," + longitude + "&zoom=13&size=300x300&sensor=false";

        output.appendChild(img);
    }

    function error() {
        output.innerHTML = "Unable to retrieve your location";
    }

    output.innerHTML = "<p>Locating…</p>";

    navigator.geolocation.getCurrentPosition(success, error);
};

ARC3D.toggleFullScreen = function() {
    if (!document.fullscreenElement && !document.mozFullScreenElement && !document.webkitFullscreenElement) {  // current working methods
        if (document.documentElement.requestFullscreen) {
            document.documentElement.requestFullscreen();
        } else if (document.documentElement.mozRequestFullScreen) {
            document.documentElement.mozRequestFullScreen();
        } else if (document.documentElement.webkitRequestFullscreen) {
            document.documentElement.webkitRequestFullscreen(Element.ALLOW_KEYBOARD_INPUT);
        }
    } else {
        if (document.cancelFullScreen) {
            document.cancelFullScreen();
        } else if (document.mozCancelFullScreen) {
            document.mozCancelFullScreen();
        } else if (document.webkitCancelFullScreen) {
            document.webkitCancelFullScreen();
        }
    }
};
