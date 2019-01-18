

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

brushTool.enforceStyles = function() {
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