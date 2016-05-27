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
    "neighbors": [
        {
         "id": 1,
         "dist": 10.0
        }
*/

/*jshint esversion: 6 */

/**
* Creates a Pathfinder object
*
* @constructor
* @this {Pathfinder}
* @param {Node list} nodes
* See example.json for Node architecture
*/
function Pathfinder(nodes){
    this.nodes = nodes;
}

/**
* Get the node with the specified ID
*
* @param {number} node_id
* @return {Node} The node with the specified ID or null if there is no Node with
*                such ID.
*/
Pathfinder.prototype.get_node = function(node_id)
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
* Get the distance between two neighbors nodes. No computing here, we are only
* looking for the dist param value.
*
* @param {number} node_a_id
* @param {number} node_b_id
* @return {number} The distance between the two points or null if no Node found
*                  or B is not a neighbor
*/
Pathfinder.prototype.get_distance = function(node_a_id, node_b_id)
{
    var dist = null;
    var node_a = this.get_node(node_a_id);
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
* @param {Node} node_a
* @param {Node} node_b
* @return {number} The distance between the two nodes.
*/
Pathfinder.prototype.compute_distance = function(node_a, node_b)
{
    var pa = node_a.position;
    var pb = node_b.position;
    return Math.sqrt(Math.pow(Math.abs(pa.x - pb.x), 2) + Math.pow(Math.abs(pa.y - pb.y), 2) + Math.pow(Math.abs(pa.z - pb.z), 2));
};

/**
* Heuristic used in the get_path function
*
* @param {number} node_a_id
* @param {number} node_b_id
* @return {number} The cost for the two nodes
*/
Pathfinder.prototype.heuristic = function(node_a_id, node_b_id)
{
    // ATM the crow flies distance is used
    var node_a = this.get_node(node_a_id);
    var node_b = this.get_node(node_b_id);
    return this.compute_distance(node_a, node_b);
};

/**
* Use A-star algorithm to find a path between two points of the graph.
*
* @param {number} node_start_id
* @param {number} node_goal_id
* @return {Array} An array of Node IDs representing the path found.
*/
Pathfinder.prototype.get_path = function(node_start_id, node_goal_id)
{
    var closedSet = new Set();
    var openSet = new Set([node_start_id]);
    var cameFrom = new Map();
    var gScore = new Map();
    var fScore = new Map();

    for(var i = 0; i < this.nodes.length; i++)
    {
        gScore.set(i, Infinity);
        fScore.set(i, Infinity);
    }

    gScore.set(node_start_id, 0);
    fScore.set(node_start_id, h(node_start_id, node_goal_id));

    while(openSet.size !== 0)
    {
        // Magic line: Transform the openSet in an Array, then apply it the
        // Math.min function
        var current = Math.min.apply(null, Array.from(openSet));

        if(current == goal)
        return reconstruct_path(cameFrom, current);

        openSet.delete(current);
        closedSet.add(current);
        var current_node = getNode(current, nodes);
        current_node.neighbors.forEach(function(neighbor_obj) {
            var neighbor = neighbor_obj.id;
            var neighbor_node = getNode(neighbor, nodes);
            if(closedSet.has(neighbor))
            return;

            tentative_gScore = gScore.get(current) + getDistance(current, neighbor, nodes);

            if(!openSet.has(neighbor)){
                openSet.add(neighbor);
            } else if (tentative_gScore >= gScore.get(neighbor)) {
                return;
            }

            cameFrom.set(neighbor, current);
            gScore.set(neighbor, tentative_gScore);
            fScore.set(neighbor, gScore.get(neighbor) + h(neighbor, goal, nodes));
        });
    }
    console.error("Pathfinding has failed.");
    return -1;
};
