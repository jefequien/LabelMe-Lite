//
//  Setup Canvas
//
var canvas = document.getElementById('canvas0');

var current_project = paper.project;
var imageToCanvas;
var showPoints = false;

//
// Load Background
//
var image = get_image();
image.onload = function() {
  // Set image as background with fixed height
  var height = 500;
  var background = new Raster(image);
  background.scale(height/image.height);
  background.position = new Point(canvas.width/2-80, canvas.height/2-80);

  imageToCanvas = new ImageToCanvas(canvas, image, background);
  console.log(project);

  selectTool.switch();

  // Download annotations
  loadAnnotations();
}


function ImageToCanvas(canvas, image, background){
   this.canvas = canvas;
   this.image = image;
   this.background = background;
   this.default_center = background.position;
   this.default_ratio = background.bounds.height/image.height;

   this.resolution = 20;
}
ImageToCanvas.prototype.transform = function(annotation) {
  var ratio = this.background.bounds.height/this.image.height;
  var _x = this.background.position._x;
  var _y = this.background.position._y;
  var dx = _x - this.background.bounds.width/2
  var dy = _y - this.background.bounds.height/2
  annotation.scale(ratio, new Point(0,0));
  annotation.translate(new Point(dx, dy));
}
ImageToCanvas.prototype.itransform = function(annotation) {
  var ratio = this.image.height/this.background.bounds.height;
  var _x = this.background.position._x;
  var _y = this.background.position._y;
  var dx = _x - this.background.bounds.width/2
  var dy = _y - this.background.bounds.height/2

  annotation.translate(new Point(-dx, -dy));
  annotation.scale(ratio, new Point(0,0));

  // Round annotation points
  for (var i=0; i < annotation.segments.length; i++) {
    annotation.segments[i].point = annotation.segments[i].point.round();
  }
}
ImageToCanvas.prototype.moveBackground = function(delta) {
  objects = current_project._activeLayer._children;
  for (var i = 0; i < objects.length; i++){
    objects[i].translate(delta);
  }
}
ImageToCanvas.prototype.scaleBackground = function(ratio) {
  objects = current_project._activeLayer._children;
  for (var i = 0; i < objects.length; i++){
    if (objects[i] != paper.tool.curser) {
      objects[i].scale(ratio, this.default_center);
    }
  }
  this.resolution = this.resolution * ratio;
}
ImageToCanvas.prototype.setCenter = function(point) {
    var _x = this.default_center._x;
    var _y = this.default_center._y;
    var dx = _x - point._x;
    var dy = _y - point._y;
    this.moveBackground(new Point(dx,dy));
}
ImageToCanvas.prototype.setRatio = function(ratio) {
  var r = this.background.bounds.height/this.image.height;
  this.scaleBackground(ratio/r);
}
ImageToCanvas.prototype.focus = function(annotation) {
  this.setRatio(this.default_ratio);
  if (annotation) {
    var ideal_height = 400;
    var ideal_width = 600;
    var ratio = Math.min(ideal_width/annotation.bounds.width, ideal_height/annotation.bounds.height)
    this.scaleBackground(Math.max(ratio, 1));
    this.setCenter(annotation.bounds.center);
  } else {
    this.setCenter(this.background.position);
  }
}
ImageToCanvas.prototype.bound = function(annotation) {
  this.itransform(annotation);
  var segments = annotation.segments;
  for (var i=0; i < segments.length; i++) {
    point = segments[i].point;
    point.x = Math.max(0, Math.min(point.x, this.image.width));
    point.y = Math.max(0, Math.min(point.y, this.image.height));
  }
  this.transform(annotation);
}
ImageToCanvas.prototype.refine = function(annotation) {
  this.bound(annotation);
  this.toPolygon(annotation);
}
ImageToCanvas.prototype.toPolygon = function(annotation) {
  annotation.flatten(1);
  var polygon = [];
  var changes = 0;
  var n = annotation.segments.length
  for (var i=0; i < n; i++) {
    var prior = i-1;
    if (prior == -1) {
      prior = n-1;
    }
    var next = i+1;
    if (next == n) {
      next = 0;
    }
    var p_prior = annotation.segments[prior].point;
    var p = annotation.segments[i].point;
    var p_next = annotation.segments[next].point;

    var v1 = p - p_prior;
    var v2 = p_next - p;
    if (v1.length + v2.length < this.resolution) {
      i += 1;
      polygon.push(p_next);
      changes += 1;
    } else if (v1.length > this.resolution) {
      polygon.push(p_prior + v1/2);
      polygon.push(p);
      changes += 1;
    } else if (p_prior.getDistance(p_next) < this.resolution/2) {
      changes += 1;
    } else {
      polygon.push(p)
    }
  }
  annotation.segments = polygon;
  if (changes > 0) {
    this.toPolygon(annotation);
  }
}

//
// Tools
//
var selectTool = new Tool();
selectTool.onMouseMove = function(event) {
  try {
    this.curser.position = event.point;
  } catch (err) {
    // This tool is the default so the curser may not have initialized.
  }
}
selectTool.onMouseDrag = function(event) {

  imageToCanvas.moveBackground(event.delta);
}
selectTool.onKeyDown = function(event) {
  if (event.key == 'n') {
    newTool.switch();
    return false;
  }
  if (event.key == '9') {
    imageToCanvas.scaleBackground(0.8);
    return false;
  }
  if (event.key == '0') {
    imageToCanvas.scaleBackground(1.25);
    return false;
  }
  if (event.key == 'f' || event.key == 'escape') {
    imageToCanvas.focus();
    return false;
  }
}
selectTool.switch = function() {
  console.log("Switching to selectTool");
  unhighlightAll();
  selectTool.loadCurser();

  selectTool.activate()
}
selectTool.loadCurser = function() {
  if (paper.tool.curser) {
    paper.tool.curser.remove();
    this.curser = paper.tool.curser;
  } else {
    this.curser = new Shape.Circle(new Point(0, 0), 20);
    this.curser.remove();
  }
}


var newTool = new Tool();
newTool.onMouseMove = function(event) {
  this.curser.position = event.point;

  if (this.points.length != 0) {
    this.annotation.removeSegment(this.points.length);
    this.annotation.add(event.point);
  }
}
newTool.onMouseDown = function(event) {
  var n = this.points.length;
  if (n == 0) {
    this.points.push(this.curser.clone());
    return;
  }
  var newLine = new Path.Line(this.points[n-1].position, event.point);
  newLine.remove();
  if (this.annotation.getIntersections(newLine).length <= 2) {
    this.points.push(this.curser.clone());
  }

  if (this.points.length > 3) {
    var start = this.annotation.firstSegment.point;
    if (event.point.getDistance(start) < 10) {
      this.deletePoint();
      this.annotation.closed = true;
    }
  }
}
newTool.onMouseUp = function(event) {
  if (this.annotation.closed) {
    // Prompt for object name.
    var name = requestName();
    if (name != null && name != "") {
      createNewAnnotation(name, this.annotation);
      this.removePoints();
      imageToCanvas.refine(this.annotation);
      editTool.switch(this.annotation);
    } else {
      this.annotation.closed = false;
    }
  }
}
newTool.deletePoint = function() {
  if (this.points.length > 0) {
    this.annotation.removeSegment(this.points.length);
    this.annotation.removeSegment(this.points.length-1);
    this.points.pop().remove();
  }
}
newTool.onKeyDown = function(event) {
  if (event.key == 'escape') {
    this.annotation.remove();
    this.removePoints();
    selectTool.switch();
    return false;
  }
  if (event.key == 'backspace') {
    this.deletePoint();
    return false;
  }
}
newTool.switch = function () {
  console.log("Switching to newTool");
  unhighlightAll();

  this.annotation = new Path();
  this.annotation.strokeWidth = 3;
  this.annotation.strokeColor = 'blue';
  this.points = [];

  this.loadCurser();
  this.activate();
}
newTool.loadCurser = function() {
  paper.tool.curser.remove();
  this.curser = new Shape.Circle({
    center: paper.tool.curser.position,
    radius: 5,
    strokeColor: 'red',
    strokeWidth: 3
  });
}
newTool.removePoints = function() {
  for (var i=0; i < this.points.length; i++) {
    this.points[i].remove();
  }
}

var editTool = new Tool();
editTool.onMouseMove = function(event) {

  this.curser.position = event.point;
}
editTool.onMouseDrag = function(event) {
  this.onMouseMove(event);

  for (var i=0; i < this.annotation.segments.length; i++) {
    if (this.curser.contains(this.annotation.segments[i].point)) {
      var v = this.annotation.segments[i].point - event.point;
      this.annotation.segments[i].point += v.normalize() * event.delta.length;
    }
  }
  imageToCanvas.toPolygon(this.annotation);
}
editTool.onMouseUp = function(event) {

  imageToCanvas.refine(this.annotation);
}
editTool.onKeyDown = function(event) {
  // Quit annotate tool
  if (event.key == 'escape') {
    selectTool.switch();
    return false;
  }
  if (event.key == 'backspace') {
    deleteAnnotation(this.annotation);
    return false;
  }
  if (event.key == 'n') {
    newTool.switch();
    return false;
  }
  if (event.key == '9') {
    changeToolSize(0.8);
    return false;
  }
  if (event.key == '0') {
    changeToolSize(1.25);
    return false;
  }
  if (event.key == 'f') {
    imageToCanvas.focus(this.annotation);
    return false;
  }
  if (event.key == 'r') {
    // refine()
    return false;
  }
}
editTool.switch = function(annotation) {
  console.log("Switching to editTool");
  if (annotation != null) {
    unhighlightAll();
    this.annotation = annotation;
    highlight(this.annotation);

    this.loadCurser();
    this.activate();
  } else {
    console.log("Annotation is null. Cannot switch to edit tool.");
  }
}
editTool.loadCurser = function() {
  paper.tool.curser.remove();
  this.curser = new Shape.Circle({
    center: paper.tool.curser.position,
    radius: 20,
    strokeColor: 'black',
    strokeWidth: 2
  });
}


function createNewAnnotation(name, annotation) {
  tree.addAnnotation(annotation, name);
  annotation.fillColor = {
    red: Math.random(),
    green: Math.random(),
    blue: Math.random(),
    alpha: 1.0
  };

  // Insert annotation sorted by area
  objects = current_project._activeLayer._children;
  for (var i = 0; i < objects.length; i++) {
    if (Math.abs(objects[i].area) < Math.abs(annotation.area)) {
      annotation.insertBelow(objects[i]);
      break;
    }
  }

  annotation.onMouseEnter = function() {
    if (paper.tool == selectTool) {
      highlight(this);
    }
  }
  annotation.onMouseLeave = function() {
    if ( paper.tool != editTool) {
      unhighlight(this);
    }
  }
  annotation.onDoubleClick = function(event) {
    editTool.switch(this);
  }
}

function deleteAnnotation(annotation) {
  annotation.remove();
  tree.deleteAnnotation(annotation);

  console.log("Deleted annotation.");
  selectTool.switch();
}

function highlight(annotation) {
  console.log(tree.getName(annotation));

  annotation.fillColor.alpha = 0.7;
  annotation.strokeColor = "black";
  annotation.strokeColor.alpha = 1;
  annotation.strokeWidth = 2;

  annotation.fullySelected = showPoints;
  tree.setActive(annotation, true);
}
function unhighlight(annotation) {
  annotation.fillColor.alpha = 0.4;
  annotation.strokeWidth = 0;
  annotation.selected = false;
  tree.setActive(annotation, false);
}
function unhighlightAll() {
  var annotations = getAnnotations();
  for (var i = 0; i < annotations.length; i++) {
    unhighlight(annotations[i]);
  }
}

function changeToolSize(change) {
  curser = paper.tool.curser;
  new_radius = Math.max(curser.radius * change, 5);
  curser.radius = new_radius;
}

function getAnnotations() {
  var annotations = [];
  objects = current_project._activeLayer._children;
  for (var i = 0; i < objects.length; i++){
    object = objects[i];
    if (tree.containsAnnotation(object)) {
      annotations.push(object);
    }
  }
  return annotations;
}

function getAnnotationById(id) {
  var annotations = getAnnotations();
  for (var i = 0; i < annotations.length; i++){
    if (annotations[i].id == id) {
      return annotations[i];
    }
  }
}

//
// I/O Functions
//
function requestName() {
    var name = prompt("Please enter object name.", "");
    return name;
}
function save() {
  console.log("Saving...");

  var objects = [];
  var annotations = getAnnotations();
  for (var i = 0; i < annotations.length; i++){
    var annotation = annotations[i];
    imageToCanvas.itransform(annotation);

    var polygon = [];
    for (var j=0; j < annotation.segments.length; j++) {
      var point = annotation.segments[j].point;
      polygon.push([point.x,point.y]);
    }
    var obj = {};
    obj["name"] = tree.getName(annotation);
    obj["id"] = annotation.id;
    obj["polygon"] = polygon;

    // Handle annotation tree
    if (tree.getChildren(annotation).length != 0 || tree.getParent(annotation) != null) {
      var parts = {};
      parts["hasparts"] = tree.getChildren(annotation);
      parts["ispartof"] = tree.getParent(annotation);
      obj["parts"] = parts;
    }

    objects.push(obj);

    imageToCanvas.transform(annotation);
  }

  var json = {};
  json["filename"] = "filename";
  json["folder"] = "folder";
  json["objects"] = objects;

  alert("Saving!");
  // alert("Not allowed to save yet!");
  post_polygons(json);
}

function loadAnnotations() {
  var callback = function (data) {
    var json = JSON.parse(data);
    for (var i=0; i < json.length; i++) {
      json[i] = JSON.parse(json[i]);
    }
    console.log(json);

    // for (var i=0; i < json.length; i++) {
    //   var ann = json[i];
    //   console.log(ann);
    //   var raster = new Raster();
    //   raster.size = new Size(672, 512);
    //   for (var x=0; x < ann.length; x++) {
    //     for (var y=0; y < ann[0].length; y++) {
    //       raster.setPixel(x, y, 'green')
    //     }
    //   }
    // }

    var objects = json["objects"];
    if (objects) {
      var num = objects.length;
      console.log("Loading " + num + " annotations...");

      var idMap = {};
      for (var i=0; i < num; i++) {
        var obj = objects[i];
        idMap[obj["id"]] = loadAnnotation(obj);
      }
      loadTree(objects, idMap);
    }
  }
  get_polygons(callback);
}
function loadAnnotation(obj) {
  var name = obj["name"];
  var objId = obj["id"];
  var polygon = obj["polygon"]

  var annotation = new Path({
      segments: polygon,
      closed: true
  });
  imageToCanvas.transform(annotation);
  createNewAnnotation(name, annotation);
  unhighlight(annotation);
  return annotation;
}
function loadTree(objects, idMap) {
  for (var i=0; i < objects.length; i++) {
    var obj = objects[i];
    if (obj["parts"]) {
      var parent = idMap[obj["id"]];
      var children = obj["parts"]["hasparts"];
      for (var j=0; j<children.length; j++) {
        annotation = idMap[children[j]];
        tree.addPart(parent, annotation);
      }
    }
  }
}

//
// Buttons
//
var next_button = document.getElementById('next');
next_button.onclick = function(){
    next_image();
}
var previous_button = document.getElementById('previous');
previous_button.onclick = function(){
    previous_image();
}
var new_button = document.getElementById('new');
new_button.onclick = function(){
    newTool.switch();
}
var delete_button = document.getElementById('delete');
delete_button.onclick = function(){
  if (paper.tool == editTool) {
    deleteAnnotation(editTool.annotation);
    selectTool.switch();
  }
}
var save_button = document.getElementById('save');
save_button.onclick = function(){
  save();
}
var sort_button = document.getElementById('sort');
sort_button.onclick = function(){
  // no sorting need anymore
}
var toggle_points_button = document.getElementById('toggle_points');
toggle_points_button.onclick = function(){
  showPoints = !(showPoints);
  console.log("Show points " + showPoints);
}


// 
// Annotation Tree
// 
$("#tree").fancytree({
      activeVisible: true, // Make sure, active nodes are visible (expanded)
      aria: false, // Enable WAI-ARIA support
      autoActivate: true, // Automatically activate a node when it is focused using keyboard
      autoCollapse: false, // Automatically collapse all siblings, when a node is expanded
      autoScroll: false, // Automatically scroll nodes into visible area
      clickFolderMode: 4, // 1:activate, 2:expand, 3:activate and expand, 4:activate (dblclick expands)
      checkbox: false, // Show checkboxes
      debugLevel: 1, // 0:quiet, 1:normal, 2:debug
      disabled: false, // Disable control
      focusOnSelect: false, // Set focus when node is checked by a mouse click
      escapeTitles: false, // Escape `node.title` content for display
      generateIds: false, // Generate id attributes like <span id='fancytree-id-KEY'>
      idPrefix: "ft_", // Used to generate node id´s like <span id='fancytree-id-<key>'>
      icon: true, // Display node icons
      keyboard: true, // Support keyboard navigation
      keyPathSeparator: "/", // Used by node.getKeyPath() and tree.loadKeyPath()
      minExpandLevel: 1, // 1: root node is not collapsible
      quicksearch: false, // Navigate to next node by typing the first letters
      rtl: false, // Enable RTL (right-to-left) mode
      selectMode: 1, // 1:single, 2:multi, 3:multi-hier
      tabindex: "0", // Whole tree behaves as one single control
      titlesTabbable: false, // Node titles can receive keyboard focus
      tooltip: false, // Use title as tooltip (also a callback could be specified)

      source: [],

      extensions: ["dnd","edit", "glyph", "wide"],
      dnd: {
        focusOnClick: true,
        dragStart: function(node, data) { return true; },
        dragEnter: function(node, data) { return true; },
        dragDrop: function(node, data) {
          data.otherNode.moveTo(node, data.hitMode);
        }
      },
      glyph: {
        map: {
          dragHelper: "glyphicon glyphicon-play",
          dropMarker: "glyphicon glyphicon-arrow-right",
          expanderClosed: "glyphicon glyphicon-menu-right",
          expanderLazy: "glyphicon glyphicon-menu-right",  // glyphicon-plus-sign
          expanderOpen: "glyphicon glyphicon-menu-down",  // glyphicon-collapse-down
        }
      },
      toggleEffect: { effect: "drop", options: {direction: "left"}, duration: 400 },
      wide: {
        iconWidth: "1em",     // Adjust this if @fancy-icon-width != "16px"
        iconSpacing: "0.5em", // Adjust this if @fancy-icon-spacing != "3px"
        levelOfs: "1.5em"     // Adjust this if ul padding != "16px"
      },
      click: function(event, data) {
        // data.node.setExpanded(!data.node.isExpanded());
        // return false;
      },
      dblclick: function(event, data){
        var node = data.node;
        annotation = getAnnotationById(node.key);
        if (paper.tool.annotation == annotation) {
          // Change name.
          var name = requestName();
          if (name != null && name != "") {
            node.setTitle(name);
          }
        }
        imageToCanvas.focus(annotation);
        editTool.switch(annotation);
        return false;
      }
    }).on("mouseenter", ".fancytree-title", function(event){
      // Highlight annotation when mouse is over cell
      var node = $.ui.fancytree.getNode(event);
      if (paper.tool == selectTool) {
        annotation = getAnnotationById(node.key);
        highlight(annotation);
      }
    }).on("mouseleave", ".fancytree-title", function(event){
      // Unhighlight annotation when mouse leaves cell
      var node = $.ui.fancytree.getNode(event);
      if (paper.tool == selectTool) {
        annotation = getAnnotationById(node.key);
        unhighlight(annotation);
      }
    });


var tree = $("#tree").fancytree("getTree");
tree.idMap = {};
tree.deleteAnnotation = function (annotation) {
  var key = String(annotation.id);
  var node = tree.getNodeByKey(key);
  while( node.hasChildren() ) {
    node.getFirstChild().moveTo(node.parent, "child");
  }
  node.remove();
}
tree.addAnnotation = function (annotation, name) {
  var key = String(annotation.id);
  tree.getRootNode().addChildren({"title":name, "key":annotation.id});
}
tree.setActive = function (annotation, isActive) {
  var key = String(annotation.id);
  var node = tree.getNodeByKey(key);
  if (node != null) {
    node.setActive(isActive);
  }
}
tree.containsAnnotation = function (annotation) {
  var key = String(annotation.id);
  var node = tree.getNodeByKey(key);
  return (node != null);
}
tree.getName = function (annotation) {
  var key = String(annotation.id);
  var node = tree.getNodeByKey(key);
  return node.title;
}
tree.getChildren = function (annotation) {
  var key = String(annotation.id);
  var node = tree.getNodeByKey(key);
  var children = [];
  if (! node.children) {
    return children;
  }
  for (var i=0; i < node.children.length; i++) {
    var child_node = node.children[i];
    children.push(child_node.key);
  }
  return children
}
tree.getParent = function (annotation) {
  var key = String(annotation.id);
  var node = tree.getNodeByKey(key);
  var parent = node.parent;
  if (parent.isRootNode()) {
    return null;
  }
  return parent.key;
}
tree.addPart = function (parent, part) {
  var parent_key = String(parent.id);
  var child_key = String(part.id)
  var parent_node = tree.getNodeByKey(parent_key);
  var child_node = tree.getNodeByKey(child_key);
  child_node.moveTo(parent_node, "child");
}