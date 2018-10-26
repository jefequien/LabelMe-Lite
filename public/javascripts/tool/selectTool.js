

var selectTool = new Tool();
selectTool.onMouseMove = function(event) {
  this.curser.position = event.point;
  // Highlight one annotation. Unhighlight everything else.
  var annotation = this.getAnnotationAt(this.curser.position);
  for (var i = 0; i < annotations.length; i++) {
    if (annotations[i] == annotation) {
      annotations[i].highlight();
    } else {
      annotations[i].unhighlight();
    }
  }
}
selectTool.onMouseDown = function(event) {
  this.downAnnotation = this.getAnnotationAt(this.curser.position);
}
selectTool.onMouseUp = function(event) {
  this.upAnnotation = this.getAnnotationAt(this.curser.position);
  if (this.isDragging) {
    this.isDragging = false;
  } else {
    if (this.downAnnotation == this.upAnnotation) {
      if (this.upAnnotation) {
        editTool.switch(this.upAnnotation);
      }
    }
  }
}
selectTool.onMouseDrag = function(event) {
  background.move(event.delta);
  this.isDragging = true;
}
selectTool.onKeyDown = function(event) {
  onKeyDownShared(event)
  // Escape keys
  if (event.key == 'escape') {
    background.focus();
  }
  else if (event.key == 'backspace') {
    background.focus();
  }
  else if (event.key == 'z') {
    background.focus();
  }

  // Tool keys
  else if (event.key == 'v') {
    brush.toggleVisualize();
  }
}
selectTool.deactivate = function() {
  if (this.curser) {
    this.curser.remove();
  }
}
selectTool.switch = function() {
  this.toolName = "selectTool";
  console.log("Switching to", this.toolName);
  paper.tool.deactivate();
  this.curser = new Shape.Circle(background.canvas_center);
  this.activate();

  for (var i = 0; i < annotations.length; i++) {
    annotations[i].unhighlight();
    annotations[i].unhide();
  }

  this.downAnnotation = null;
  this.upAnnotation = null;
}
selectTool.getAnnotationAt = function(point) {
  for (var i = 0; i < annotations.length; i++) {
    if (annotations[i].boundary.contains(point)) {
      return annotations[i];
    }
  }
  return null;
}

function onKeyDownShared(event) {
  // Common keys
  if (event.key == 'left' || event.key == 'a') {
    background.move(new Point(100, 0));
  }
  else if (event.key == 'right' || event.key == 'd') {
    background.move(new Point(-100, 0));
  }
  else if (event.key == 'up' || event.key == 'w') {
    background.move(new Point(0, 100));
  }
  else if (event.key == 'down' || event.key == 's') {
    background.move(new Point(0, -100));
  }
  else if (event.key == 'q') {
    background.scale(0.8, paper.tool.curser.position);
  }
  else if (event.key == 'e') {
    background.scale(1.25, paper.tool.curser.position);
  }
  else if (event.key == 'f') {
    if (paper.tool.annotation) {
      paper.tool.annotation.updateBoundary();
    }
    background.focus(paper.tool.annotation);
  }
  else if (event.key == 'h') {
    // Hide everything
    var allHidden = true;
    for (var i = 0; i < annotations.length; i++) {
      if ( ! annotations[i].hidden) {
        annotations[i].hide();
        allHidden = false;
      }
    }
    if (allHidden) {
      // If everything was hidden.
      if (paper.tool.annotation) {
        paper.tool.annotation.unhide();
      } else {
        for (var i = 0; i < annotations.length; i++) {
          annotations[i].unhide();
        }
      }
    }
  }

  // Switch tool keys
  else if (event.key == '1' || event.key == 'escape') {
    selectTool.switch();
  }
  else if (event.key == '2' || event.key == 'l') {
    var target = paper.tool.annotation;
    if ( ! target) {
      target = selectTool.getAnnotationAt(paper.tool.curser.position);
    }
    if (target) {
      editTool.switch(target);
    }
  }
  else if (event.key == '3' || event.key == 'b') {
    var target = paper.tool.annotation;
    if ( ! target) {
      target = selectTool.getAnnotationAt(paper.tool.curser.position);
    }
    if (target) {
      brushTool.switch(target);
    }
  }
  else if (event.key == '4' || event.key == 'n') {
    newTool.switch();
  }
}

window.paper = paper;
window.selectTool = selectTool;
window.onKeyDownShared = onKeyDownShared;
