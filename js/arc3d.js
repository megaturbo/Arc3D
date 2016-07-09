var ARC3D = {};

ARC3D.ToiletMale = 'toilet-man';
ARC3D.ToiletFemale = 'toilet-woman';

ARC3D.ControlModes = { FLY: 0, GYRO: 1};
ARC3D.controlMode = undefined;

ARC3D.TrackingModes = {WAITING: 0, SIM: 1, LIVE: 2};
ARC3D.trackingMode = ARC3D.TrackingModes.WAITING;

// ARC3D.defaultCameraPosition = new THREE.Vector3(518.1343902256439, 179.21829815866715, -204.30850284213201);
ARC3D.defaultCameraPosition = new THREE.Vector3(-256, -66, 322);
ARC3D.defaultCameraRotation = new THREE.Vector3(-0.1076350906304018, 1.5321409768616594, 0.07200147984575293);

ARC3D.isPositionDefined = false;

ARC3D.isDisabledMode = false;

raycaster = new THREE.Raycaster();
mouse = new THREE.Vector2();

// View
ARC3D.buttonDefaultClass = 'btn waves-effect grey lighten-5 grey-text text-darken-3';
ARC3D.buttonActiveClass = 'btn waves-effect';

//Models
ARC3D.modelsWalls = ["walls_0", "walls_1", "walls_2", "walls_3"];
ARC3D.modelsWindows = ["window_0", "window_1", "window_2", "window_3"];
ARC3D.modelsGrounds = ["ground_1", "ground_2", "ground_3", "ground_4"];
ARC3D.modelsStairs = ["stairs"];
ARC3D.modelsMisc = ["commerce_0"];

ARC3D.models = [].concat(ARC3D.modelsWalls, ARC3D.modelsWindows, ARC3D.modelsGrounds, ARC3D.modelsStairs, ARC3D.modelsMisc);

/**
* JSONLoader load method override
*
* The same as three.js version except it uses a modelName and give it to the callback
*/
THREE.JSONLoader.prototype.load = function( modelName, onLoad, onProgress, onError ) {

    var url = "models/multipart/" + modelName + ".js";


    var scope = this;

    var texturePath = this.texturePath && ( typeof this.texturePath === "string" ) ? this.texturePath : THREE.Loader.prototype.extractUrlBase( url );

    var loader = new THREE.XHRLoader( this.manager );
    loader.setWithCredentials( this.withCredentials );
    loader.load( url, function ( text ) {

        var json = JSON.parse( text );
        var metadata = json.metadata;

        if ( metadata !== undefined ) {

            var type = metadata.type;

            if ( type !== undefined ) {

                if ( type.toLowerCase() === 'object' ) {

                    console.error( 'THREE.JSONLoader: ' + url + ' should be loaded with THREE.ObjectLoader instead.' );
                    return;

                }

                if ( type.toLowerCase() === 'scene' ) {

                    console.error( 'THREE.JSONLoader: ' + url + ' should be loaded with THREE.SceneLoader instead.' );
                    return;

                }

            }

        }

        var object = scope.parse( json, texturePath );
        onLoad( object.geometry, object.materials, modelName );

    }, onProgress, onError );

};

/**
* p {Vector3} camera position
* parts {Array of mesh} building_parts
*/
ARC3D.updateFloorCulling = function(p, parts){
    for(var i = 0; i < parts.length; i++){
        var me = parts[i].mesh;
        var bb = parts[i].boundingBox.box;

        //When it's not a wall, continue to next iteration
        if($.inArray(me.name, ARC3D.modelsWalls) <= -1){
            continue;
        }

        me.visible = false;
        if( bb.min.x <= p.x && p.x <= bb.max.x && bb.min.y <= p.y && p.y <= bb.max.y && bb.min.z <= p.z && p.z <= bb.max.z) {
            me.visible = true;
        }
    }
};

/**
* Get url paramters. From:
http://stackoverflow.com/questions/19491336/get-url-parameter-jquery-or-how-to-get-query-string-values-in-js
*/
ARC3D.getUrlParameter = function(sParam) {
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

/**
* Set the camera control mode.
*
* @param {Number} mode : The desired mode for camera control.
*
* Best. Code. Ever.
*/
ARC3D.setControl = function(mode){
    switch(mode) {
        case ARC3D.ControlModes.FLY:
            controls = new THREE.FlyControls(camera, renderer.domElement);
            controls.movementSpeed = 100;
            controls.domElement = container;
            controls.rollSpeed = 1;
            controls.autoForward = false;
            controls.dragToLook = true;
            ARC3D.controlMode = ARC3D.ControlModes.FLY;
            break;

        case ARC3D.ControlModes.GYRO:
            controls = new THREE.DeviceOrientationControls( camera , renderer.domElement);
            ARC3D.controlMode = ARC3D.ControlModes.GYRO;
            break;

        default:
            console.info("Control mode not found.");
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
    var box_mat_blue = new THREE.MeshBasicMaterial( {color: 0x0000ff } );
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
        var box_mat = path.indexOf(node.id) != -1 ? box_mat_yellow : node.name == 'elevator' ? box_mat_blue : box_mat_red;
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
        var point = {id:key_points.length + 3000, positiwaon:{x:cpos.x, y:cpos.y, z:cpos.z}, neighbors:[]};
        key_points.push(point);
		pointLight = new THREE.PointLight( 0xffffff, 0.8, 300 );
		pointLight.position.copy(cpos);
		scene.add( pointLight );

        var object;

        console.log(JSON.stringify(key_points));
    }
};

ARC3D.mobileCheck = function() {
    var check = false;
    (function(a){if(/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(a)||/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0,4)))check = true;})(navigator.userAgent||navigator.vendor||window.opera);
    return check;
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
