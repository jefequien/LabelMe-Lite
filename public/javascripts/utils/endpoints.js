

var base_url = parseBaseURL();

//
// Get Requests
//
function getBundle(params, callback) {
  var endpoint = base_url + "/bundles/" + params.job_id + "/" + params.bundle_id + ".json";
  get_async(endpoint, callback);
}
function getBundles(params, callback) {
  var query = {"job_id": params.job_id};
  var endpoint = base_url + "/api/bundles?" + buildQuery(query);
  get_async(endpoint, callback);
}
function getAnnotations(params, callback) {
  var query = {"dataset": params.dataset, "ann_source": params.ann_source};
  if (params.img_id) { query.img_id = params.img_id; }
  if (params.cat_id) { query.cat_id = params.cat_id; }
  var endpoint = base_url + "/api/annotations?" + buildQuery(query);
  get_async(endpoint, callback);
}
function getDefinition(cat, callback) {
  var query = {"keyword": cat["name"]};
  var endpoint = base_url + "/api/definitions?" + buildQuery(query);
  get_async(endpoint, function(res) {
    if (res && res.length != 0) {
      callback(res[0])
    } else {
      callback();
    }
  });
}
function getImageURL(img) {
  if (img.dataset) {
    var endpoint = base_url + "/data/" + img.dataset + "/images/" + img.file_name;
    return endpoint;
  }

  // Infer image dataset
  var alternate_url = "https://labelmelite.csail.mit.edu";
  var dataset = "";
  if (img.file_name.includes("challenge")) {
    dataset = "scaleplaces";
    var endpoint = alternate_url + "/data/" + dataset + "/" + img.file_name;
    return endpoint;
  } else if (img.file_name.includes("ADE")) {
    dataset = "ade20k";
  } else {
    dataset = "places";
  }
  var endpoint = alternate_url + "/data/" + dataset + "/images/" + img.file_name;
  return endpoint;
}


//
// Post Requests
//
function postResults(params, coco) {
  if (params.host) {
    postAmtResults(params, coco);
    return;
  }
  var query = {"job_id": params.job_id};
  var endpoint = base_url + "/api/results?" + buildQuery(query);
  post(endpoint, coco.dataset);
}
function postAmtResults(params, coco) {
  var query = {"assigmentId": params.assigmentId, "hitId": params.hitId};
  var endpoint = params.host + "?" + buildQuery(query);
  post(endpoint, coco.dataset);
}

//
// Redirects
//
function redirectToAmtBrowser(params) {
  var query = {"job_id": params.job_id};
  window.location.href = base_url + "/amt_browser?" + buildQuery(query);
}

//
// XHR functions
//
function get_async(url, callback) {
  console.log(url);
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
  xhr.setRequestHeader("Access-Control-Allow-Origin", "*");
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
  var url = href.split('?')[0];
  var query = href.split('?')[1];

  var split = url.split('/');
  var base_url = split[0] +"/" + split[1] + "/" + split[2];
  return base_url
}
function parseURLParams() {
  var href = window.location.href;
  var query = href.split('?')[1];
  if ( ! query) {
    return {};
  }

  var params = {}
  var query_split = query.split("&");
  for (var i in query_split) {
    split = query_split[i].split("=");
    key = split[0];
    value = split[1];
    params[key] = value;
  }
  return params;
}
function setURLParams(params) {
  var href = window.location.href;
  var url = href.split('?')[0];
  var path = url.replace(base_url, "");
  window.history.pushState(null, null, path + "?" + buildQuery(params));
}
function buildQuery(params) {
  query = ""; 
  for (var key in params) {
    query = query + "&" + key + "=" + params[key];
  }
  return query.substring(1);
}