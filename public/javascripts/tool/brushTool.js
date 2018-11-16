


var brushTool = new Tool();

brushTool.onMouseMove = function(event) {
  this.curser.position = event.point;
  this.snapCurser();

  // Set this.annotation
  if ( ! this.annotationFixed) {
    this.annotation = selectTool.getAnnotationAt(this.curser.position);
  }

  this.setMode();
  this.enforceStyles();
  this.updateSmartBrush();
  this.writeHints();
}

brushTool.onMouseDrag = function(event) {
  this.curser.position = event.point;
  this.snapCurser();
  this.enforceStyles();
  this.updateSmartBrush();
  this.writeHints();
  
  if (this.annotationFixed) {
    this.editAnnotation();
  } else {
    background.move(event.delta);
    this.isDragging = true;
  }
}
brushTool.onMouseDown = function(event) {
  this.onMouseMove(event);
  if (this.annotationFixed) {
    this.editAnnotation();
  }
}
brushTool.onMouseUp = function(event) {
  if (this.annotation) {
    this.annotation.updateBoundary();
    if ( ! this.isDragging) {
      this.annotationFixed = true;
    }
  }
  this.isDragging = false;
  this.refreshTool();
}
brushTool.onKeyDown = function(event) {
  if (event.key == 'space') {
    editTool.switch(this.annotation);
    return;
  }
  else if (event.key == 'z') {
    if (this.annotationFixed) {
      brushTool.switch();
      return;
    }
  }
  else if (event.key == 'i') {
    this.invertedMode = ! this.invertedMode;
    this.refreshTool();
  }
  
  // Smart tool
  if (event.key == 't') {
    brush.toggle();
    this.refreshTool();
  }
  else if (event.key == 'g') {
    brush.toggleVisualize();
  }
  onKeyDownShared(event);
}
brushTool.deactivate = function() {
  this.button.className = this.button.className.replace(" active", "");
  this.curser.remove();
  this.smartBrush.remove();
}
brushTool.switch = function(annotation) {
  this.toolName = "Brush Tool";
  console.log("Switching to", this.toolName);
  var lastCurserPosition = paper.tool.curser.position;
  var lastToolSize = paper.tool.toolSize;
  paper.tool.deactivate();
  this.activate();

  this.button = brushToolButton;
  this.button.className += " active";
  this.curser = new Shape.Circle(lastCurserPosition, 1);
  this.toolSize = lastToolSize;

  this.annotation = annotation;
  this.annotationFixed = (this.annotation != null);

  this.smartBrush = new Path();
  this.smartBrush.visible = false;
  this.invertedMode = false;

  this.refreshTool();
}
brushTool.refreshTool = function() {
  brushTool.onMouseMove({point: brushTool.curser.position});
}

//
// Edit Actions
//
brushTool.editAnnotation = function() {
  var shape = this.curser;
  if (brush.active) {
    shape = this.smartBrush;
  }

  if (this.mode == "unite") {
    this.annotation.unite(shape);
  } else {
    this.annotation.subtract(shape);
  }
}

//
// Styles
//
brushTool.snapCurser = function() {
  // Snap to image bounds
  if ( ! background.image.contains(this.curser.position)) {
    var rect = new Path.Rectangle(background.image.bounds);
    rect.remove();
    this.curser.position = rect.getNearestPoint(this.curser.position);
  }
}
brushTool.setMode = function() {
  this.mode = "subtract";
  if (this.annotation && this.annotation.containsPoint(this.curser.position)) {
    this.mode = "unite";
  }
  if (this.invertedMode) {
    if (this.mode == "unite") {
      this.mode = "subtract";
    } else {
      this.mode = "unite";
    }
  }
}
brushTool.enforceStyles = function() {
  var curserHeight = this.toolSize * this.toolSize;

  // this.annotation styles
  if (this.annotation) {
    this.annotation.highlight();

    if (this.annotationFixed) {
      this.annotation.boundary.strokeWidth = 0;
      if (this.mode == "unite") {
        this.annotation.raster.opacity = 0.8;
        this.annotation.rasterinv.opacity = 0;
      } else {
        this.annotation.raster.opacity = 0;
        this.annotation.rasterinv.opacity = 0.8;
      }
    } else {
      this.annotation.boundary.strokeWidth = this.toolSize;
      this.annotation.raster.opacity = 0.5;
    }
  }

  // Other annotations styles
  for (var i = 0; i < annotations.length; i++) {
    if (annotations[i] != this.annotation) {
      if (this.annotation) {
        annotations[i].hide();
      } else {
        annotations[i].unhighlight();
      }
    }
  }

  // Curser styles
  this.curser.scale(curserHeight / this.curser.bounds.height);
  if (this.mode == "unite") {
    this.curser.fillColor = "#00FF00";
  } else {
    this.curser.fillColor = "red";
  }
  if ( ! this.annotationFixed) {
    this.curser.fillColor = "red";
  }

  // Curser gradient style
  if (this.invertedMode) {
    var stops = ['black', this.curser.fillColor];
    this.curser.fillColor = {
     gradient: {
         stops: stops,
         radial: true
     },
     origin: this.curser.position,
     destination: this.curser.bounds.rightCenter
    };
  }
}

brushTool.updateSmartBrush = function() {
  if (brush.active) {
    var numPixels = this.curser.bounds.height / background.getPixelHeight();
    numPixels *= numPixels;
    var p = background.getPixel(this.curser.position);
    var pixels = brush.getNearestPixels([p.x, p.y], numPixels);
    var path = new Path(pixels);
    path.remove();
    background.toPointSpace(path);
    this.smartBrush.segments = path.segments;

    this.curser.visible = false;
    this.smartBrush.visible = true;
    this.smartBrush.selected = true;
  } else {
    this.curser.visible = true;
    this.smartBrush.visible = false;
    this.smartBrush.selected = false;
  }
}

brushTool.writeHints = function() {
  var hints = [];
  if ( ! this.annotationFixed) {
    hints.push("Click on an annotation to begin editing.");
  }
  hints.push("Press '9' or '0' to change brush size.");
  // hints.push("Press 'esc' to quit.");
  $('#toolName').text(this.toolName);
  $('#toolMessage').text(hints[0]);
}


//
// Exports
//
window.brushTool = brushTool;
