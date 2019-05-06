
var urlParams = parseURLParams();
console.log(urlParams);

var yesnoUrl = base_url + "/amt_yesno";
var editUrl = base_url + "/amt_edit";

window.onload = function() {
    document.body.innerHTML = "Loading...";

    var jobId = urlParams.job_id;
    getBundles(urlParams, function(res) {
        if ( ! res || res.length == 0) {
            document.body.innerHTML = "No bundles found for job_id: " + jobId;
            return;
        }

        document.body.innerHTML = "";
        for (var i = 0; i < res.length; i++) {
            addBundle(jobId, res[i]);
        }
    });
}

function addBundle(jobId, bundleId) {
    var query = {"job_id": jobId, "bundle_id": bundleId};
    var queryString = buildQuery(query);

	var yesnoLink = yesnoUrl + "?" + queryString;
	var editLink = editUrl + "?" + queryString;
    var rawLink = base_url + "?" + queryString;

    var yesnoHref = "<a href=\"" + yesnoLink + "\">YesNo</a>";
    var editHref = "<a href=\"" + editLink + "\">Edit</a>";
    var rawHref = "<a href=\"" + rawLink + "\">Raw</a>";
	var html = bundleId + " " + yesnoHref + " " + editHref + " " + rawHref + " <br>";
	document.body.innerHTML += html;
}