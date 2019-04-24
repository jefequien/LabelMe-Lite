

var yesnoUrl = base_url + "/amt_yesno";
var editUrl = base_url + "/amt_edit";

window.onload = function() {
    document.body.innerHTML = "Loading...";
    getBundlesList(function(res) {
        document.body.innerHTML = "";
    	for (var i = 0; i < res.length; i++) {
    		var bundleId = res[i];
    		addBundle(bundleId);
    	}
    });
}

function addBundle(bundleId) {
	var yesnoLink = yesnoUrl + "?" + buildQuery({"bundle_id": bundleId});
    var yesnoHref = "<a href=\"" + yesnoLink + "\">YesNo</a>";

	var editLink = editUrl + "?" + buildQuery({"bundle_id": bundleId});
    var editHref = "<a href=\"" + editLink + "\">Edit</a>";

    var rawLink = base_url + "/bundles/tasks/" + bundleId + ".json";
    var rawHref = "<a href=\"" + rawLink + "\">Raw</a>";

	var html = bundleId + " " + yesnoHref + " " + editHref + " " + rawHref + " <br>";
	document.body.innerHTML += html;
}