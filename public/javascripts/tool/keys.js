

function toolKeys(event) {
  if (event.key == '1' || event.key == 'escape') {
    selectTool.switch();
  }
  else if (event.key == '2') {
    editTool.switch(paper.tool.annotation);
  }
  else if (event.key == '3' || event.key == 'b') {
    brushTool.switch(paper.tool.annotation);
  }
  else if (event.key == '4' || event.key == 'n') {
    newTool.switch();
  }
  if (event.key == 'escape') {
    flashButton(escapeToolButton);
  }
  if (event.key == 'h') {
    alert("The help section for " + paper.tool.toolName + " is coming soon.");
  }

  if (event.key == '9') {
    var toolSize = paper.tool.toolSize - 0.5;
    toolSize = Math.max(toolSlider.min, Math.min(toolSlider.max, toolSize));

    paper.tool.toolSize = toolSize;
    toolSlider.value = paper.tool.toolSize;
    paper.tool.refreshTool();
  }
  else if (event.key == '0') {
    var toolSize = paper.tool.toolSize + 0.5;
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

function movementKeys(event) {
  if (event.key == 'left' || event.key == 'a') {
    background.move(new Point(100, 0));
    flashButton(leftButton);
  }
  else if (event.key == 'right' || event.key == 'd') {
    background.move(new Point(-100, 0));
    flashButton(rightButton);
  }
  else if (event.key == 'up' || event.key == 'w') {
    background.move(new Point(0, 100));
    flashButton(upButton);
  }
  else if (event.key == 'down' || event.key == 's') {
    background.move(new Point(0, -100));
    flashButton(downButton);
  }
}

function commonKeys(event) {
  if (event.key == 'q') {
    background.scale(0.8);
    flashButton(zoomOutButton);
  }
  else if (event.key == 'e') {
    background.scale(1.25);
    flashButton(zoomInButton);
  }
  else if (event.key == 'f') {
    flashButton(focusButton);
    // Toggle focus on annotation
    if (background.lastFocus != paper.tool.annotation) {
      background.focus(paper.tool.annotation);
    } else {
      background.focus();
    }
  }
  else if (event.key == 'v') {
    flashButton(visibleButton);
    $('#visible').find('i').toggleClass('fa fa-eye-slash').toggleClass('fa fa-eye');

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
    }
  }
  else if (event.key == 'c') {
    if (paper.tool.annotation) {
      paper.tool.annotation.changeColor();
    } else {
      var i = Math.floor(Math.random() * Math.floor(annotations.length));
      annotations[i].changeColor();
    }
    flashButton(colorButton);
  }
  else if (event.key == 'backspace') {
    flashButton(deleteButton);
    if (paper.tool.annotation) {
      var deleted = paper.tool.annotation.delete();
      if (deleted) {
        selectTool.switch();
      }
    } else {
      alert("Nothing to delete.");
    }
  }
}

function flashButton(button) {
  button.className += " active";
  setTimeout(function(){ button.className = button.className.replace(" active", ""); }, 100);
}

//
// Exports
//
function onKeyDownShared(event) {
  movementKeys(event);
  toolKeys(event);
  commonKeys(event);
}
window.onKeyDownShared = onKeyDownShared;
