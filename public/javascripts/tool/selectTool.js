

var selectTool = new Tool();
selectTool.onMouseMove = function(event) {
  this.curser.position = event.point;

  if (this.annotation) {
    for (var i = 0; i < annotations.length; i++) {
      annotations[i].hide();
    }
    if (this.annotation.boundary.contains(this.curser.position)) {
      this.annotation.highlight();
    } else {
      this.annotation.unhighlight();
    }
  } else {
    var mouseOver = this.getAnnotationAt(this.curser.position);
    for (var i = 0; i < annotations.length; i++) {
      annotations[i].unhighlight();
    }
    if (mouseOver) {
      mouseOver.highlight();
    }
  }
}
selectTool.onMouseUp = function(event) {
  if (this.isDragging) {
    this.isDragging = false;
  } else {
    this.onMouseClick(event);
  }
}
selectTool.onMouseDrag = function(event) {
  background.move(event.delta);
  this.isDragging = true;
}
selectTool.onMouseClick = function(event) {
  if (this.annotation) {
    if (this.annotation.boundary.contains(this.curser.position)) {
      editTool.switch(this.annotation);
      return;
    } else {
      this.annotation = null;
    }
  } else {
    var mouseOver = this.getAnnotationAt(this.curser.position);
    this.annotation = mouseOver;
    if (this.annotation) {
      background.focus(this.annotation);
    }
  }
  this.refreshTool();
}
selectTool.onKeyDown = function(event) {
  onKeyDownShared(event)

  if (event.key == 'escape') {
    background.focus();
  }
  else if (event.key == 'backspace') {
    this.annotation.delete();
    this.annotation = null;
  }
  else if (event.key == 'u') {
    if (this.annotation) {
      this.annotation.undo();
    }
  }
  this.refreshTool();
}
selectTool.refreshTool = function() {
  selectTool.onMouseMove({point: selectTool.curser.position});
}
selectTool.deactivate = function() {
  if (this.curser) {
    this.curser.remove();
  }
  if (this.button) {
    this.button.className = this.button.className.replace(" active", "");
  }
}
selectTool.switch = function(annotation) {
  this.toolName = "selectTool";
  console.log("Switching to", this.toolName);
  var lastCurserPosition = background.canvas_center;
  paper.tool.deactivate();
  this.activate();

  this.curser = new Shape.Circle(lastCurserPosition);
  this.button = selectToolButton;
  this.button.className += " active";

  this.annotation = annotation;
  if (this.annotation) {
    background.focus(annotation);
  }
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
  commonKeys(event);

  // Tool keys
  if (event.key == '1' || event.key == 'escape') {
    selectTool.switch();
  }
  else if (event.key == '2' || event.key == 'l') {
    if (paper.tool.annotation) {
      editTool.switch(paper.tool.annotation);
    }
  }
  else if (event.key == '3' || event.key == 'b') {
    if (paper.tool.annotation) {
      brushTool.switch(paper.tool.annotation);
    }
  }
  else if (event.key == '4' || event.key == 'n') {
    newTool.switch();
  }
}

function commonKeys(event) {
  var button = {};
  if (event.key == 'left' || event.key == 'a') {
    background.move(new Point(100, 0));
    button = leftButton;
  }
  else if (event.key == 'right' || event.key == 'd') {
    background.move(new Point(-100, 0));
    button = rightButton;
  }
  else if (event.key == 'up' || event.key == 'w') {
    background.move(new Point(0, 100));
    button = upButton;
  }
  else if (event.key == 'down' || event.key == 's') {
    background.move(new Point(0, -100));
    button = downButton;
  }
  else if (event.key == 'q') {
    background.scale(0.8, paper.tool.curser.position);
    button = zoomOutButton;
  }
  else if (event.key == 'e') {
    background.scale(1.25, paper.tool.curser.position);
    button = zoomInButton;
  }
  else if (event.key == 'f') {
    if (background.lastFocus != paper.tool.annotation) {
      background.focus(paper.tool.annotation);
    } else {
      background.focus();
    }
    button = focusButton;
  }
  else if (event.key == 'h') {
    var allInvisible = true;
    for (var i = 0; i < annotations.length; i++) {
      if (annotations[i].visible) {
        annotations[i].setInvisible();
        allInvisible = false;
      }
    }
    if (allInvisible) {
      for (var i = 0; i < annotations.length; i++) {
        annotations[i].setVisible();
      }
    }
    button = hideButton;
    $('#hide').find('i').toggleClass('fa fa-eye-slash').toggleClass('fa fa-eye');
  }
  button.className += " active";
  setTimeout(function(){ button.className = button.className.replace(" active", ""); }, 100);
}

window.paper = paper;
window.selectTool = selectTool;
window.onKeyDownShared = onKeyDownShared;
