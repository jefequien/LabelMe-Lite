
window.onload = function() {
    var callback = function(bundle) {
      var task = bundle[0];
      setUpTool(task);
    }
    getBundle(callback);
}