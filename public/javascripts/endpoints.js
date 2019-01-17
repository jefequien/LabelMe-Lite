
var href = window.location.href;
var url = href.split('?')[0];
var query = href.split('?')[1];

var base_url = parseBaseURL(url);
var params = {};
if (query) {
  params = parseParams(query);
}

//
// Get Requests
//
function getImageURL(src) {
    var endpoint = base_url + "/data/images?" + query;
    return endpoint;
}
function getNextImage(callback) {
    var endpoint = base_url + "/data/images/next?" + query;
    get_async(endpoint, callback);
}
function getPrevImage(callback) {
    var endpoint = base_url + "/data/images/prev?" + query;
    get_async(endpoint, callback);
}

function getAnnotations(callback) {
    var endpoint = base_url + "/data/annotations?" + query;
    get_async(endpoint, callback);
}
function getBundle(callback) {
    var endpoint = base_url + "/data/bundles?" + query;
    get_async(endpoint, callback);
}
function get_annotation_tree(callback) {
    var endpoint = base_url + "/annotations/trees?" + query;
    get_async(endpoint, callback);
}

//
// Post Requests
//
function postAnnotations(json) {
    var endpoint = base_url + "/annotations?" + query;
    post(endpoint, json);
}

function get_async(url, callback) {
  var xhr = new XMLHttpRequest();
  xhr.onreadystatechange = function() { 
    if (xhr.readyState == 4){
      if (xhr.status == 200) {
        var json = JSON.parse(xhr.responseText);
        callback(json);
      } else if (xhr.status == 404) {
        callback();
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
function parseBaseURL(url) {
  var split = url.split('/');
  var base_url = split[0] +"/" + split[1] + "/" + split[2];
  return base_url
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
function buildQuery(params) {
  query = ""; 
  for (var key in params) {
    query = query + "&" + key + "=" + params[key];
  }
  return query.substring(1);
}