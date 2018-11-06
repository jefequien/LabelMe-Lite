

function onKeyDownShared(event) {
  commonKeys(event);

  // Tool keys
  if (event.key == '1' || event.key == 'escape') {
    selectTool.switch();
  }
  else if (event.key == '2' || event.key == 'l') {
    editTool.switch(paper.tool.annotation);
  }
  else if (event.key == '3' || event.key == 'b') {
    brushTool.switch(paper.tool.annotation);
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
    background.scale(0.8);
    button = zoomOutButton;
  }
  else if (event.key == 'e') {
    background.scale(1.25);
    button = zoomInButton;
  }
  else if (event.key == 'f') {
    // Toggle focus on annotation
    if (background.lastFocus != paper.tool.annotation) {
      background.focus(paper.tool.annotation);
    } else {
      background.focus();
    }
    button = focusButton;
  }
  else if (event.key == 'h') {
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
    button = hideButton;
    $('#hide').find('i').toggleClass('fa fa-eye-slash').toggleClass('fa fa-eye');
  }
  button.className += " active";
  setTimeout(function(){ button.className = button.className.replace(" active", ""); }, 100);
}

//
// Exports
//
window.onKeyDownShared = onKeyDownShared;
