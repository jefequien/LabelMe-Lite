//
//  Setup Canvas
//
var canvas = document.getElementById('canvas0');

var current_project = paper.project;

var image_url = get_image_url();
var background = new Background(image_url);

function Background(image_url){
  HEIGHT = 500;
  CENTER = new Point(canvas.width/2-80, canvas.height/2-80);
  image = new Raster(image_url, CENTER);
  image.onLoad = function() {
    image.scale(HEIGHT/image.height);
    loadAnnotations();
  }

  this.default_height = HEIGHT;
  this.default_center = CENTER;
  this.image = image;
}
Background.prototype.transform = function(annotation) {
  var bbox = this.image.bounds;
  var ratio = bbox.height/this.image.height;
  var x = this.image.position.x;
  var y = this.image.position.y;
  var dx = x - bbox.width/2
  var dy = y - bbox.height/2
  annotation.scale(ratio, new Point(0,0));
  annotation.translate(new Point(dx, dy));
}
Background.prototype.itransform = function(annotation) {
  var bbox = this.image.bounds;
  var ratio = this.image.height/bbox.height;
  var x = this.image.position.x;
  var y = this.image.position.y;
  var dx = x - bbox.width/2
  var dy = y - bbox.height/2

  annotation.translate(new Point(-dx, -dy));
  annotation.scale(ratio, new Point(0,0));

  // Round annotation points
  for (var i=0; i < annotation.segments.length; i++) {
    annotation.segments[i].point = annotation.segments[i].point.round();
  }
}
Background.prototype.move = function(delta) {
  objects = paper.project.activeLayer.children;
  for (var i = 0; i < objects.length; i++){
    objects[i].translate(delta);
  }
}
Background.prototype.scale = function(ratio) {
  objects = paper.project.activeLayer.children;
  for (var i = 0; i < objects.length; i++){
    if (objects[i] != paper.tool.curser) {
      objects[i].scale(ratio, this.default_center);
    }
  }
}
Background.prototype.center = function(point) {
    var x = this.default_center.x;
    var y = this.default_center.y;
    var dx = x - point.x;
    var dy = y - point.y;
    this.move(new Point(dx,dy));
}
Background.prototype.focus = function(annotation) {
  this.scale(this.default_height/this.image.bounds.height);
  this.center(this.image.position);
  if (annotation) {
    var bbox = getBoundingBox(annotation);
    var ideal_height = 400;
    var ideal_width = 600;
    var ratio = Math.min(ideal_width/bbox.width, ideal_height/bbox.height)
    this.center(bbox.center);
    this.scale(Math.max(ratio, 1));
  }
}
Background.prototype.getBlankAnnotation = function() {
  ann_height = 500;
  bbox = this.image.bounds;
  ratio = ann_height/bbox.height
  ann_width = ratio * bbox.width;

  var blank = new Raster({
      size: {
          width: ann_width,
          height: ann_height
      }
  });
  blank.scale(1/ratio);
  blank.position = this.image.position;
  return blank;
}

function getBoundingBox(annotation) {
  var x1 = annotation.width;
  var y1 = annotation.height;
  var x2 = 0;
  var y2 = 0;
  for (var i = 0; i < annotation.width; i++) {
    for (var j = 0; j < annotation.height; j++) {
      color = annotation.getPixel(i, j);
      if (color.alpha != 0) {
        if (i < x1) {
          x1 = i;
        }
        if (i > x2) {
          x2 = i;
        }
        if (j < y1) {
          y1 = j;
        }
        if (j > y2) {
          y2 = j;
        }
      }
    }
  }
  var pixel1 = new Point(x1, y1);
  var pixel2 = new Point(x2, y2);

  console.log(pixel1);
  console.log(pixel2);
  var point1 = pixelToPoint(pixel1, annotation);
  var point2 = pixelToPoint(pixel2, annotation);
  return new Rectangle(point1.x, point1.y, point2.x-point1.x, point2.y-point1.y);
}

//
// Tools
//
var selectTool = new Tool();
selectTool.curser = new Shape.Circle(new Point(0, 0), 0);
selectTool.onMouseMove = function(event) {
  this.curser.position = event.point;

  var annotations = getAnnotations();
  var topAnn = getTopMostAnnotation(event.point, annotations);
  for (var i = 0; i < annotations.length; i++) {
    if (annotations[i] == topAnn) {
      highlight(annotations[i]);
    } else {
      unhighlight(annotations[i]);
    }
  }
}
selectTool.onDoubleClick = function(event) {
  var annotations = getAnnotations();
  var topAnn = getTopMostAnnotation(event.point, annotations);
  if (topAnn) {
    editTool.switch(topAnn);
  }
}
selectTool.onMouseDrag = function(event) {
  background.move(event.delta);
}
selectTool.onKeyDown = function(event) {
  if (event.key == 'n') {
    newTool.switch();
    return false;
  }
  if (event.key == '9') {
    background.scale(0.8);
    return false;
  }
  if (event.key == '0') {
    background.scale(1.25);
    return false;
  }
  if (event.key == 'f' || event.key == 'escape') {
    background.focus();
    return false;
  }
}
selectTool.switch = function() {
  console.log("Switching to selectTool");
  unhighlightAll();

  this.curser = paper.tool.curser;
  this.curser.remove();
  this.activate()
}
function getTopMostAnnotation(point, annotations) {
  for (var i = annotations.length - 1; i >= 0; i--) {
    var ann = annotations[i];
    var pixel = pointToPixel(point, ann)
    color = ann.getPixel(pixel.x, pixel.y);
    // Highlight if mouse is over annotation
    if (color.alpha != 0) {
      return ann;
    }
  }
  return null;
}
function pointToPixel(point, annotation) {
    var bbox = annotation.bounds;
    var ratio = bbox.height / annotation.height
    var pixelX = (point.x - bbox.x) / ratio;
    var pixelY = (point.y - bbox.y) / ratio;
    return new Point(pixelX, pixelY)
}
function pixelToPoint(pixel, annotation) {
    var bbox = annotation.bounds;
    var ratio = bbox.height / annotation.height
    var pointX = pixel.x * ratio + bbox.x;
    var pointY = pixel.y * ratio + bbox.y;
    return new Point(pointX, pointY)
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
    annotation = createNewAnnotation(this.name, this.annotation);
    this.removePoints();
    // imageToCanvas.refine(this.annotation);
    // editTool.switch(this.annotation);
    selectTool.switch();
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

  // Prompt for object name.
  this.name = requestName();
  if (this.name == null || this.name == "") {
    selectTool.switch();
  } else {
    this.annotation = new Path();
    this.annotation.strokeWidth = 3;
    this.annotation.strokeColor = 'blue';
    this.points = [];

    this.loadCurser();
    this.activate();
  }
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

editTool.onMouseDown = function(event) {
  var pixel = pointToPixel(event.point, this.annotation)
  this.color = this.annotation.getPixel(pixel.x, pixel.y);
}

editTool.onMouseDrag = function(event) {
  this.onMouseMove(event);
  var ratio = this.annotation.bounds.height / this.annotation.height
  var r = this.curser.radius / ratio;

  var pixel = pointToPixel(event.point, this.annotation)
  for (var i = -r; i < r; i++) {
    for (var j = -r; j < r; j++) {
      if (i*i + j*j <= r*r) {
        this.annotation.setPixel(pixel.x+i,pixel.y+j, this.color);
      }
    }
  }
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
    background.focus(this.annotation);
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
  // Prep annotation to get rasterized
  annotation.strokeWidth = 0;
  annotation.fillColor = {
    red: Math.random(),
    green: Math.random(),
    blue: Math.random(),
    alpha: 1.0
  };

  var raster = annotation.rasterize();
  var new_annotation = background.getBlankAnnotation();

  for (var i = 0; i < raster.width; i++) {
    for (var j = 0; j < raster.height; j++) {
      var pixel = new Point(i,j);
      var point = pixelToPoint(pixel, raster);
      var pixel = pointToPixel(point, new_annotation);
      var color = raster.getPixel(i, j);
      new_annotation.setPixel(pixel.x, pixel.y, color);
    }
  }
  tree.addAnnotation(new_annotation, name);

  annotation.remove();
  raster.remove();
  unhighlight(new_annotation);

  // Insert annotation sorted by area
  var anns = getAnnotations();
  for (var i = 0; i < anns.length; i++) {
    if (Math.abs(anns[i].size) < Math.abs(new_annotation.size)) {
      new_annotation.insertBelow(anns[i]);
      break;
    }
  }

  // HACK: tool can't watch for double click so I'm getting the items to do it
  new_annotation.onDoubleClick = function(event) {
    if (paper.tool == selectTool) {
      selectTool.onDoubleClick(event);
    }
  }
  return new_annotation;
}

function deleteAnnotation(annotation) {
  annotation.remove();
  tree.deleteAnnotation(annotation);

  console.log("Deleted annotation.");
  selectTool.switch();
}

function highlight(annotation) {
  if (annotation.unhighlighted) {
    console.log(tree.getName(annotation));

    annotation.opacity = 0.9;
    annotation.strokeColor = "black";
    annotation.strokeColor.alpha = 1;
    annotation.strokeWidth = 2;

    tree.setActive(annotation, true);
    annotation.unhighlighted = false;
  }
}
function unhighlight(annotation) {
  if ( ! annotation.unhighlighted) {
    annotation.opacity = 0.6;
    annotation.strokeWidth = 0;

    tree.setActive(annotation, false);
    annotation.unhighlighted = true;
  }
}
function unhighlightAll() {
  var annotations = getAnnotations();
  for (var i = 0; i < annotations.length; i++) {
    unhighlight(annotations[i]);
  }
}
function setRasterBoundary(raster, color) {
  for (var i = 0; i < annotations.length; i++) {

  }
}

function changeToolSize(change) {
  curser = paper.tool.curser;
  new_radius = Math.max(curser.radius * change, 5);
  curser.radius = new_radius;
}

function getAnnotations() {
  var annotations = [];
  objects = paper.project.activeLayer.children;
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
    background.itransform(annotation);

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

    background.transform(annotation);
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

    var objects = json["objects"];
    if (objects) {
      var num = objects.length;
      console.log("Loading " + num + " annotations...");

      var idMap = {};
      for (var i=0; i < num; i++) {
        console.log(i)
        var obj = objects[i];
        idMap[obj["id"]] = loadAnnotation(obj);
      }
      loadTree(objects, idMap);
    }
  }
  get_polygons(callback);
}

// function loadAnnotation(obj) {
//   console.log(obj);
//   var name = obj["category_id"];
//   var objId = obj["id"];
//   var segmentation = obj["segmentation"];

//   var height = segmentation.length;
//   var width = segmentation[0].length;

//   var annotation = new Raster({
//       size: {
//           width: width,
//           height: height
//       }
//   });

//   color = {
//     red: Math.random(),
//     green: Math.random(),
//     blue: Math.random(),
//     alpha: 1.0
//   };

//   for (var i = 0; i < annotation.height; i++) {
//     for (var j = 0; j < annotation.width; j++) {
//       console.log(segmentation[i][j]);
//       if (segmentation[i][j] == 1) {
//         console.log("set");
//         annotation.setPixel(i, j, color);
//       }
//     }
//   }

//   background.transform(annotation);
//   annotation = createNewAnnotation(name, annotation);
//   return annotation;
// }

function loadAnnotation(obj) {
  var name = obj["name"];
  var objId = obj["id"];
  var polygon = obj["polygon"];

  var annotation = new Path({
      segments: polygon,
      closed: true
  });
  background.transform(annotation);
  annotation = createNewAnnotation(name, annotation);
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
        background.focus(annotation);
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