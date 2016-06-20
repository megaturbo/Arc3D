/*
* Created by Thomas.roulin @thomasroulin
* 27.05.2016 - 13:33
*
* The Node object used everywhere in this code is read from a .JSON file.
* The class structure is:

    "id": 0,
    "name": "Node position name IRL",
    "position": {
        "x": 0.0,
        "y": 0.0,
        "z": 0.0
    },
    "neighbors": [1,2,3]
*/

/*jshint esversion: 6 */

/**
* Creates a Pathfinder object
*
* @constructor
* @this {Pathfinder}
* @param {Node list} nodes : Node graph
* See example.json for Node architecture
*/
ARC3D.Pathfinder = function(nodes){
    this.nodes = nodes;

    /**
    * Give an array of position from an Array of node IDs
    *
    * @param {Array} path  Array of {Number} which are the nodes IDs
    * @return {Array} Array of THREE.Vector3
    *
    */
    this.getPathPositions = function(path)
    {
        var positions = [];
        for(var i = 0; i < path.length; i++)
        {
            var p = this.getNode(path[i]).position;
            positions.push(new THREE.Vector3(p.x, p.y, p.z));
        }
        return positions;
    };

    /**
    * Get the node with the specified ID
    *
    * @param {number} node_id  :The id of the node...
    * @return {Node} The node with the specified ID or null if there is no Node with
    *                such ID.
    */
    this.getNode = function(node_id)
    {
        var out_node = null;
        this.nodes.forEach(function(node){
            if(node.id == node_id)
            {
                out_node = node;
            }
        });
        return out_node;
    };

    /**
    * Return a three.js Vector3 of the vector position
    *
    * @param {number} node_id : The id of the node...
    * @return {THREE.Vector3} Position vector of the specified ID node.
    */
    this.getNodePosition = function(node_id)
    {
        var node_position = this.getNode(node_id).position;
        return new THREE.Vector3(node_position.x, node_position.y, node_position.z);
    };

    /**
    * Get the distance between two neighbors nodes. No computing here, we are only
    * looking for the dist param value.
    *
    * @param {number} node_a_id : The id of the first node
    * @param {number} node_b_id : The id of the second node
    * @return {number} The distance between the two points or null if no Node found
    *                  or B is not a neighbor
    */
    this.getDistance = function(node_a_id, node_b_id)
    {
        var dist = null;
        var node_a = this.getNode(node_a_id);
        node_a.neighbors.forEach(function(neighbor) {
            if(neighbor.id == node_b_id)
            {
                dist = neighbor.dist;
            }
        });
        return dist;
    };

    /**
    * Calculate the distance between two nodes as the crow flies
    *
    * @param {Node} node_a : The id of the first node
    * @param {Node} node_b : The id of the second node
    * @return {number} The distance between the two nodes.
    */
    this.computeDistance = function(node_a, node_b)
    {
        var pa = node_a.position;
        var pb = node_b.position;
        return Math.sqrt(Math.pow(Math.abs(pa.x - pb.x), 2) + Math.pow(Math.abs(pa.y - pb.y), 2) + Math.pow(Math.abs(pa.z - pb.z), 2));
    };

    /**
    * Heuristic used in the get_path function
    *
    * @param {number} node_a_id : The id of the first node
    * @param {number} node_b_id : The id of the second node
    * @return {number} The cost for the two nodes
    */
    this.heuristic = function(node_a_id, node_b_id)
    {
        // ATM the crow flies distance is used
        var node_a = this.getNode(node_a_id);
        var node_b = this.getNode(node_b_id);
        return this.computeDistance(node_a, node_b);
    };

    /**
    * Use A-star algorithm to find a path between two points of the graph.
    *
    * @param {number} start_id : ID of the start Node
    * @param {number} goal_id : ID of the goal Node
    * @return {Array} An array of Node IDs representing the path found.
    */
    this.getPath = function(start_id, goal_id)
    {
        var closedSet = new Set();
        var openSet = new Set([start_id]);
        var cameFrom = new Map();
        var gScore = new Map();
        var fScore = new Map();

        for(var i = 0; i < this.nodes.length; i++)
        {
            gScore.set(i, Infinity);
            fScore.set(i, Infinity);
        }

        gScore.set(start_id, 0);
        fScore.set(start_id, this.heuristic(start_id, goal_id));

        while(openSet.size !== 0)
        {
            // Magic line: Transform the openSet in an Array, then apply it the
            // Math.min function
            var min = Infinity;
            var current_id;
            for(let item of openSet)
            {
                var score = fScore.get(item);
                if(score < min){
                    current_id = item;
                    min = score;
                }
            }

            if(current_id == goal_id)
            {
                return this.reconstructPath(cameFrom, current_id);
            }

            openSet.delete(current_id);
            closedSet.add(current_id);
            var current_node = this.getNode(current_id);
            var neighbors = current_node.neighbors;

            for(i = 0; i < neighbors.length; i++)
            {
                var neighbor_id = neighbors[i];
                var neighbor_node = this.getNode(neighbor_id);

                if(closedSet.has(neighbor_id))
                {
                    continue; // Break the forEach
                }

                tentative_gScore = gScore.get(current_id) + this.computeDistance(current_node, neighbor_node);

                if(!openSet.has(neighbor_id)){
                    openSet.add(neighbor_id);
                } else if (tentative_gScore >= gScore.get(neighbor_id)) {
                    continue;
                }

                cameFrom.set(neighbor_id, current_id);
                gScore.set(neighbor_id, tentative_gScore);
                fScore.set(neighbor_id, gScore.get(neighbor_id) + this.heuristic(neighbor_id, goal_id));
            }
        }
        console.error("Pathfinding has failed.");
        return [];
    };

    /**
    * Reconstruct the path from the cameFrom map with the last current Node ID
    *
    * @param {Map} cameFrom : The path where the algorithm cam from
    * @param {number} current_id : The current node ID
    * @return {Array} An array of Node IDs representing the path found.
    */
    this.reconstructPath = function(cameFrom, current_id)
    {
        total_path = [current_id];
        while(cameFrom.has(current_id))
        {
            current_id = cameFrom.get(current_id);
            total_path.push(current_id);
        }
        return total_path.reverse();
    };


};
