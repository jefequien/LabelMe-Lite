

function toolKeys(event) {
  if (event.key == '1' || event.key == 'escape') {
    if (paper.tool != selectTool) {
      selectTool.switch();
    }
  }
  else if (event.key == '2') {
    if (paper.tool != editTool) {
      editTool.switch(paper.tool.annotation);
    }
  }
  else if (event.key == '3' || event.key == 'b') {
    if (paper.tool != brushTool) {
      brushTool.switch(paper.tool.annotation);
    }
  }
  else if (event.key == '4' || event.key == 'n') {
    if (paper.tool != newTool) {
      newTool.switch();
    }
  }
  if (event.key == 'z') {
    flashButton(undoToolButton);

    if (paper.tool.undoTool) {
      var undoed = paper.tool.undoTool();
      if ( ! undoed) {
        selectTool.switch();
      }
    } else {
      if (paper.tool.toolName != "selectTool") {
        selectTool.switch();
      }
    }
  }

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
  // Zoom in and out
  if (event.key == 'q') {
    background.scale(0.8);
    flashButton(zoomOutButton);
  }
  else if (event.key == 'e') {
    background.scale(1.25);
    flashButton(zoomInButton);
  }

  // Undo and redo
  if (event.key == 'u') {
    flashButton(undoAnnButton);
    if (paper.tool.annotation) {
      var undoed = paper.tool.annotation.undo();
      if (undoed) {
        paper.tool.switch(paper.tool.annotation);
      }
    } else {
      alert("Select an annotation to undo first.");
    }
  } else if (event.key == 'y') {
    flashButton(redoAnnButton);
    if (paper.tool.annotation) {
      var redoed = paper.tool.annotation.redo();
      if (redoed) {
        paper.tool.switch(paper.tool.annotation);
      }
    } else {
      alert("Select an annotation to redo first.");
    }
  }

  if (event.key == 'f') {
    flashButton(focusButton);
    // Toggle focus on annotation
    if (background.lastFocus != paper.tool.annotation) {
      background.focus(paper.tool.annotation);
    } else {
      background.focus();
    }
  }
  else if (event.key == 'h') {
    flashButton(hideButton);

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
  }
  else if (event.key == 'c') {
    flashButton(colorButton);
    if (paper.tool.annotation) {
      paper.tool.annotation.changeColor();
    } else {
      if (annotations.length > 0) {
        // Change color of random annotation;
        var i = Math.floor(Math.random() * Math.floor(annotations.length));
        annotations[i].changeColor();
      }
    }
  }
  else if (event.key == 'backspace') {
    flashButton(deleteButton);
    if (paper.tool.annotation) {
      var deleted = paper.tool.annotation.delete();
      if (deleted) {
        selectTool.switch();
      }
    } else {
      alert("Select an annotation to delete first.");
    }
  }
  else if (event.key == 'space') {
    return; // Prevent default
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
