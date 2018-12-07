

function toolKeys(event) {
  if (event.key == '1' || event.key == 'escape') {
    if (paper.tool != selectTool) {
      selectTool.switch();
    }
  }
  else if (event.key == '2') {
    if (paper.tool != editTool) {
      if (paper.tool.annotation) {
        editTool.switch(paper.tool.annotation);
      } else if (annotations.length == 1) {
        editTool.switch(annotations[0]);
      } else {
        editTool.switch();
      }
    }
  }
  else if (event.key == '3' || event.key == 'b') {
    if (paper.tool != brushTool) {
      if (paper.tool.annotation) {
        brushTool.switch(paper.tool.annotation);
      } else if (annotations.length == 1) {
        brushTool.switch(annotations[0]);
      } else {
        brushTool.switch();
      }
    }
  }
  else if (event.key == '4' || event.key == 'n') {
    if (paper.tool != newTool) {
      newTool.switch();
    }
  }
}

function sliderKeys(event) {
  if (event.key == '9') {
    var toolSize = paper.tool.toolSize - 1;
    toolSize = Math.max(toolSlider.min, Math.min(toolSlider.max, toolSize));

    paper.tool.toolSize = toolSize;
    toolSlider.value = paper.tool.toolSize;
    paper.tool.refreshTool();
  }
  else if (event.key == '0') {
    var toolSize = paper.tool.toolSize + 1;
    toolSize = Math.max(toolSlider.min, Math.min(toolSlider.max, toolSize));

    paper.tool.toolSize = toolSize;
    toolSlider.value = paper.tool.toolSize;
    paper.tool.refreshTool();
  }
  else if (event.key == 'r') {
    paper.tool.toolSize = parseInt(toolSlider.defaultValue);
    toolSlider.value = parseInt(toolSlider.defaultValue);
    paper.tool.refreshTool();
  }
}

function viewKeys(event) {
  if (event.key == 'h') {
    // Toggle hide all
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
      $('#hide').find('i').addClass('fa-eye-slash').removeClass('fa-eye');
    } else {
      $('#hide').find('i').addClass('fa-eye').removeClass('fa-eye-slash');
    }
    flashButton("hide");
  }
  else if (event.key == 'c') {
    if (paper.tool.annotation) {
      paper.tool.annotation.changeColor();
    } else {
      if (annotations.length > 0) {
        // Change color of random annotation;
        var i = Math.floor(Math.random() * Math.floor(annotations.length));
        annotations[i].changeColor();
      }
    }
    paper.tool.refreshTool();
    flashButton("color");
  }
}

function zoomKeys(event) {
  if (event.key == 'q') {
    background.scale(0.8);
    paper.tool.refreshTool();
    flashButton("zoomOut");
  }
  else if (event.key == 'e') {
    background.scale(1.25);
    paper.tool.refreshTool();
    flashButton("zoomIn");
  }
  else if (event.key == 'f') {
    // Toggle focus on annotation
    if (background.lastFocus != paper.tool.annotation) {
      background.focus(paper.tool.annotation);
    } else {
      background.focus();
    }
    paper.tool.refreshTool();
    flashButton("focus");
  }
}

function movementKeys(event) {
  if (event.key == 'left' || event.key == 'a') {
    background.move(new Point(100, 0));
    flashButton("left");
  }
  else if (event.key == 'right' || event.key == 'd') {
    background.move(new Point(-100, 0));
    flashButton("right");
  }
  else if (event.key == 'up' || event.key == 'w') {
    background.move(new Point(0, 100));
    flashButton("up");
  }
  else if (event.key == 'down' || event.key == 's') {
    background.move(new Point(0, -100));
    flashButton("down");
  }
}


//
// Exports
//
function onKeyDownShared(event) {
  toolKeys(event);
  sliderKeys(event);
  viewKeys(event)
  zoomKeys(event)
  movementKeys(event);
}
window.onKeyDownShared = onKeyDownShared;
