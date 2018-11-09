// 
// Annotation Tree
// 
$("#tree").fancytree({
      activeVisible: true, // Make sure, active nodes are visible (expanded)
      aria: false, // Enable WAI-ARIA support
      autoActivate: true, // Automatically activate a node when it is focused using keyboard
      autoCollapse: false, // Automatically collapse all siblings, when a node is expanded
      autoScroll: true, // Automatically scroll nodes into visible area
      clickFolderMode: 4, // 1:activate, 2:expand, 3:activate and expand, 4:activate (dblclick expands)
      checkbox: false, // Show checkboxes
      debugLevel: 1, // 0:quiet, 1:normal, 2:debug
      disabled: false, // Disable control
      focusOnSelect: false, // Set focus when node is checked by a mouse click
      escapeTitles: false, // Escape `node.title` content for display
      generateIds: false, // Generate id attributes like <span id='fancytree-id-KEY'>
      idPrefix: "ft_", // Used to generate node id´s like <span id='fancytree-id-<key>'>
      icon: true, // Display node icons
      keyboard: false, // Support keyboard navigation
      keyPathSeparator: "/", // Used by node.getKeyPath() and tree.loadKeyPath()
      minExpandLevel: 1, // 1: root node is not collapsible
      quicksearch: false, // Navigate to next node by typing the first letters
      rtl: false, // Enable RTL (right-to-left) mode
      selectMode: 1, // 1:single, 2:multi, 3:multi-hier
      tabindex: "0", // Whole tree behaves as one single control
      titlesTabbable: false, // Node titles can receive keyboard focus
      tooltip: false, // Use title as tooltip (also a callback could be specified)

      source: [],

      extensions: ["edit", "glyph", "wide"],
      glyph: {
        map: {
          dragHelper: "glyphicon glyphicon-play",
          dropMarker: "glyphicon glyphicon-arrow-right",
          expanderClosed: "glyphicon glyphicon-menu-right",
          expanderLazy: "glyphicon glyphicon-menu-right",  // glyphicon-plus-sign
          expanderOpen: "glyphicon glyphicon-menu-down",  // glyphicon-collapse-down
        }
      },
      toggleEffect: { effect: "drop", options: {direction: "left"}, duration: 400 },
      wide: {
        iconWidth: "0.4em",     // Adjust this if @fancy-icon-width != "16px"
        iconSpacing: "0.3em", // Adjust this if @fancy-icon-spacing != "3px"
        levelOfs: "1.5em"     // Adjust this if ul padding != "16px"
      },
      click: function(event, data) {
        data.node.setExpanded(!data.node.isExpanded());
        return false;
      },
      dblclick: function(event, data){
        var node = data.node;
        var annotation = tree.getAnnotationById(node.key);
        if (annotation) {
          background.focus(annotation);
          editTool.switch(annotation);
        }
        return false;
      }
    }).on("mousemove", ".fancytree-node", function(event){
      var node = $.ui.fancytree.getNode(event);
      var annotation = tree.getAnnotationById(node.key);
      if (annotation) {
        node.setActive(true);
        node.setFocus(true);
        if (paper.tool == selectTool) {
          for (var i = 0; i < annotations.length; i++) {
            if (annotations[i] != annotation) {
              annotations[i].hide();
            }
          }
          annotation.highlight();
        }
      }
      return false;
    });


var tree = $("#tree").fancytree("getTree");
tree.idMap = {};
tree.deleteAnnotation = function (annotation) {
  var key = String(annotation.id);
  var node = tree.getNodeByKey(key);
  if (node) {
    while( node.hasChildren() ) {
      node.getFirstChild().moveTo(node.parent, "child");
    }
    node.remove();
  }
  if (annotations.length == 0) {
    tree.setMessage("No annotations.");
  }
}
tree.addAnnotation = function (annotation) {
  var key = String(annotation.id);
  var root = tree.getRootNode();
  root.addChildren({"title": annotation.name, "key": key});
  tree.removeMessage();
}
tree.setActive = function (annotation, isActive) {
  var key = String(annotation.id);
  var node = tree.getNodeByKey(key);
  if (node != null) {
    node.setActive(isActive);
    node.setFocus(isActive);
  }
}
tree.containsAnnotation = function (annotation) {
  var key = String(annotation.id);
  var node = tree.getNodeByKey(key);
  return (node != null);
}
tree.getName = function (annotation) {
  var key = String(annotation.id);
  var node = tree.getNodeByKey(key);
  return node.title;
}
tree.getChildren = function (annotation) {
  var key = String(annotation.id);
  var node = tree.getNodeByKey(key);
  var children = [];
  if (! node.children) {
    return children;
  }
  for (var i=0; i < node.children.length; i++) {
    var child_node = node.children[i];
    children.push(child_node.key);
  }
  return children
}
tree.getParent = function (annotation) {
  var key = String(annotation.shape.id);
  var node = tree.getNodeByKey(key);
  var parent = node.parent;
  if (parent.isRootNode()) {
    return null;
  }
  return parent.key;
}
tree.addPart = function (parent, part) {
  var parent_key = String(parent.id);
  var child_key = String(part.id);
  var parent_node = tree.getNodeByKey(parent_key);
  var child_node = tree.getNodeByKey(child_key);
  child_node.moveTo(parent_node, "child");
}

tree.getAnnotationById = function(id) {
  for (var i = 0; i < annotations.length; i++){
    if (annotations[i].id == id) {
      return annotations[i];
    }
  }
}

tree.setMessage = function(message) {
  var node = tree.getNodeByKey("");
  if (! node) {
    tree.getRootNode().addChildren({"title": "", "key": ""});
  }
  var node = tree.getNodeByKey("");
  node.setTitle(message);
}
tree.removeMessage = function() {
  var node = tree.getNodeByKey("");
  if (node) {
    node.remove();
  }
}

function requestName() {
  var name = prompt("Change object name.", "");
  if (name == null || name == "") {
    return null;
  }
  return name
}

window.tree = tree;