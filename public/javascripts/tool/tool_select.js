

var selectTool = new Tool();
selectTool.onMouseMove = function(event) {
  this.curser.position = event.point;

  this.annotation = this.getAnnotationAt(this.curser.position);
  this.enforceStyles();
}
selectTool.onMouseDrag = function(event) {
  this.curser.position = event.point;

  background.move(event.delta);
  this.dragDelta += event.delta.length;
  this.enforceStyles();
}
selectTool.onMouseDown = function(event) {
  this.curser.position = event.point;

  this.dragDelta = 0;
}
selectTool.onMouseUp = function(event) {
  this.curser.position = event.point;

  if (this.dragDelta < 15) {
    this.annotation = this.getAnnotationAt(this.curser.position);
    if (this.annotation) {
      if (this.annotation != background.lastFocusedAnnotation) {
        background.focus(this.annotation);
      }
      editTool.switch();
    }
  }
}
selectTool.onKeyDown = function(event) {
  if (event.key == 'u') {
    if (this.annotation) {
      this.annotation.undo();
      this.refreshTool();
      flashButton("undo");
    }
  }
  else if (event.key == 'y') {
    if (this.annotation) {
      this.annotation.redo();
      this.refreshTool();
      flashButton("redo");
    }
  }
  if (event.key == 'escape') {
    background.focus();
  }

  if (event.key == 'i') {
    annotations.styleInverted = ( ! annotations.styleInverted);
    this.refreshTool();
  }
  onKeyDownShared(event);
}
selectTool.refreshTool = function() {
  selectTool.onMouseMove({point: selectTool.curser.position});
}
selectTool.deactivate = function() {
  if (this.curser) {
    this.curser.remove();
  }
  deactivateButton(this.toolName);
}
selectTool.switch = function() {
  var lastAnnotation = paper.tool.annotation;
  var lastCurserPosition = (paper.tool.curser) ? paper.tool.curser.position : background.viewCenter;
  var lastToolSize = (paper.tool.toolSize) ? paper.tool.toolSize : parseInt(buttons["slider"].value);
  
  this.toolName = "selectTool";
  console.log("Switching to", this.toolName);
  paper.tool.deactivate();
  this.activate();
  activateButton(this.toolName);

  this.annotation = lastAnnotation;
  this.curser = new Shape.Circle(lastCurserPosition, 1);
  this.toolSize = lastToolSize;

  this.refreshTool();
}

selectTool.getAnnotationAt = function(point) {
  for (var i = 0; i < annotations.length; i++) {
    if (annotations[i].boundary.contains(point)) {
      return annotations[i];
    }
  }
  return null;
}
selectTool.getNearestAnnotation = function(point) {
  var nearestAnnotation = this.getAnnotationAt(point);
  if (nearestAnnotation) {
    return nearestAnnotation;
  }

  var minDist = null;
  for (var i = 0; i < annotations.length; i++) {
    var dist = point.getDistance(annotations[i].boundary.getNearestPoint(point));
    if (minDist == null || dist < minDist) {
      nearestAnnotation = annotations[i];
      minDist = dist;
    }
  }
  return nearestAnnotation;
}

//
// Styles
//
selectTool.enforceStyles = function() {
  // Annotation styles
  for (var i = 0; i < annotations.length; i++) {
    if (annotations[i] == this.annotation) {
      annotations[i].highlight();
    } else {
      annotations[i].unhighlight();
    }
  }
}

window.paper = paper;
window.selectTool = selectTool;
