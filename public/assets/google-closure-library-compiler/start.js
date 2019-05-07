goog.provide('myproject.start');

goog.require('goog.dom');
goog.require('goog.dom.TagName');
goog.require('goog.structs.PriorityQueue');

myproject.start = function() {
  var newDiv = goog.dom.createDom(goog.dom.TagName.H1, {'style': 'background-color:#EEE'},
    'Hello world!');
  goog.dom.appendChild(document.body, newDiv);
};

// Ensures the symbol will be visible after compiler renaming.
goog.exportSymbol('myproject.start', myproject.start);