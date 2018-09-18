

var base_url = parseBaseURL();
var query = parseQuery();
var params = parseParams(query);

//
// Get Requests
//
function get_task(callback) {
    var endpoint = base_url + "/tasks?" + query;
    var parse = function(data) {
      task = JSON.parse(data);
      callback(task);
    }

    get_async(endpoint, parse);
}
function get_polygons(callback) {
    var endpoint = base_url + "/annotations/polygons?" + query;
    get_async(endpoint, callback);
}
function get_annotation_tree(callback) {
    var endpoint = base_url + "/annotations/trees?" + query;
    get_async(endpoint, callback);
}
function get_image() {
    var image = new Image();
    image.src = base_url + "/images?" + query;
    return image;
}
function get_image_url() {
  var image_url = base_url + "/images?" + query;
  return image_url;
}
function next_image() {
    var endpoint = base_url + "/images/next?" + query;
    var callback = function(data) {
      params["image"] = data;
      query = build_query_string(params);
      var next_href = base_url + "/labelme?" + query;
      window.location.href = next_href;
    }
    get_async(endpoint, callback);

}
function previous_image() {
    var endpoint = base_url + "/images/previous?" + query;
    var callback = function(data) {
      params["image"] = data;
      query = build_query_string(params);
      var next_href = base_url + "/labelme?" + query;
      console.log(next_href);
      window.location.href = next_href;
    }
    get_async(endpoint, callback);
}

//
// Post Requests
//
function post_polygons(json) {
    var endpoint = base_url + "/annotations/polygons?" + query;
    post(endpoint, json);
}
function post_annotation_tree(json) {
    var endpoint = base_url + "/annotations/trees?" + query;
    post(endpoint, json);
}

function build_query_string(params) {
  query = ""; 
  for (var key in params) {
    query = query + "&" + key + "=" + params[key];
  }
  return query.substring(1);
}

function get_async(url, callback) {
  var xhr = new XMLHttpRequest();
  xhr.onreadystatechange = function() { 
    if (xhr.readyState == 4){
      if (xhr.status == 200) {
        callback(xhr.responseText);
      } else if (xhr.status == 404) {
        callback("{}");
      }
    }
  }
  xhr.open("GET", url, true); // true for asynchronous 
  xhr.send(null);
}

function post(url, json) {
  xhr = new XMLHttpRequest();
  xhr.open("POST", url, true);
  xhr.setRequestHeader("Content-type", "application/json");
  xhr.onreadystatechange = function () { 
    if (xhr.readyState == 4 && xhr.status == 200) {
      console.log(xhr.responseText);
    }
  }
  var data = JSON.stringify(json);
  xhr.send(data);
}

//
// Parse URL functions
//
function parseBaseURL() {
  var href = window.location.href;
  var href_split = href.split('?');
  var base_url = href_split[0].split("/labelme")[0];
  return base_url
}

function parseQuery() {
  var href = window.location.href;
  var href_split = href.split('?');
  var query = href_split[1];
  return query;
}

function parseParams(query) {
  var query_split = query.split("&");
  var params = {}
  for (var i in query_split) {
    split = query_split[i].split("=");
    key = split[0];
    value = split[1];
    params[key] = value;
  }
  return params;
}