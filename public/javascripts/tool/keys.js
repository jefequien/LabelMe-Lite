

function toolKeys(event) {
  // if (event.key == '1') {
  //   selectTool.switch();
  // }
  // else if (event.key == '2') {
  //   editTool.switch();
  // }
  // else if (event.key == '3') {
  //   brushTool.switch();
  // }
  // else if (event.key == '4') {
  //   newTool.switch();
  // }
}

function sliderKeys(event) {
  var minValue = buttons["slider"].min;
  var maxValue = buttons["slider"].max;
  if (event.key == '9') {
    var toolSize = Math.max(Math.min(paper.tool.toolSize - 1, maxValue), minValue);
    buttons["slider"].value = paper.tool.toolSize;
    paper.tool.toolSize = toolSize;
    paper.tool.refreshTool();
  }
  else if (event.key == '0') {
    var toolSize = Math.max(Math.min(paper.tool.toolSize + 1, maxValue), minValue);
    buttons["slider"].value = toolSize;
    paper.tool.toolSize = toolSize;
    paper.tool.refreshTool();
  }
}

function viewKeys(event) {
  if (event.key == 'h') {
    // Toggle hide everything
    var objects = paper.project.activeLayer.children;
    console.log("Number of objects: ", objects.length);

    if (objects.allHidden) {
      objects.allHidden = false;
      for (var i = 0; i < objects.length; i++) {
        objects[i].visible = true;
      }
    } else {
      objects.allHidden = true;
      for (var i = 0; i < objects.length; i++) {
        objects[i].visible = false;
      }
    }
    background.setVisible(true);
    paper.tool.refreshTool();

    if (objects.allHidden) {
      $('#hide').find('i').addClass('fa-eye').removeClass('fa-eye-slash');
    } else {
      $('#hide').find('i').addClass('fa-eye-slash').removeClass('fa-eye');
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
    if (paper.tool.annotation) {
      background.focus(paper.tool.annotation);
    } else {
      background.focus();
    }
    paper.tool.refreshTool();
    flashButton("focus");
  }
}

function movementKeys(event) {
  if (event.key == 'a') {
    background.move(new Point(100, 0));
    flashButton("left");
  }
  else if (event.key == 'd') {
    background.move(new Point(-100, 0));
    flashButton("right");
  }
  else if (event.key == 'w') {
    background.move(new Point(0, 100));
    flashButton("up");
  }
  else if (event.key == 's') {
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
