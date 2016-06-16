var ARC3D = {};


ARC3D.ControlModes = { FLY: 0, GYRO: 1};
ARC3D.controlMode = ARC3D.ControlModes.GYRO;

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
            var neighbor = pathfinder.get_node(neighbor_id);
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
ARC3D.addNodeAtCameraPosition = function(e) {
    var event = window.event ? window.event : e;
    if(event.keyCode == 32){
        var geometry = new THREE.BoxGeometry( 1, 1, 1 );
        var material = new THREE.MeshBasicMaterial( { color: 0xffff00 } );
        var mesh = new THREE.Mesh( geometry, material );
        mesh.position.set(camera.position.x, camera.position.y, camera.position.z);
        var point = {id:key_points.length + 3000, position:{x:camera.position.x, y:camera.position.y, z:camera.position.z}, neighbors:[]};
        key_points.push(point);
        var object;
        console.log(JSON.stringify(key_points));
        // console.log(point);
        scene.add( mesh );
        ARC3D.initNodes();
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
