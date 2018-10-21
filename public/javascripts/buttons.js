/**
 * Buttons
 */

var downloadImgButton = document.getElementById('downloadImg');
downloadImgButton.onclick = function(){
    openUrl(background.image.source);
}
var downloadAnnButton = document.getElementById('downloadAnn');
downloadAnnButton.onclick = function(){
    var res = saveAnnotations();

    var encoded = Base64.encode(JSON.stringify(res, null, 2));
    var dataUrl = "data:text/plain;base64," + encoded;
    openUrl(dataUrl);
}
var helpButton = document.getElementById('help');
helpButton.onclick = function(){

}
var prevButton = document.getElementById('prevImage');
prevButton.onclick = function(){
    prevImage();
}
var nextButton = document.getElementById('nextImage');
nextButton.onclick = function(){
    nextImage();
}

//
// Zoom buttons
//
var zoomInButton = document.getElementById('zoomIn');
zoomInButton.onclick = function(){
    zoomIn();
}
var zoomOutButton = document.getElementById('zoomOut');
zoomOutButton.onclick = function(){
    zoomOut();
}
var fitScreenButton = document.getElementById('fitScreen');
fitScreenButton.onclick = function(){
    fitScreen();
}
var lassoButton = document.getElementById('lasso');
lassoButton.onclick = function(){
    scissors.toggle();
}

//
// Tool buttons
//
var selectToolButton = document.getElementById('selectTool');
selectToolButton.onclick = function(){
    selectTool.switch();
}
var newToolButton = document.getElementById('newTool');
newToolButton.onclick = function(){
    newTool.switch();
}
var editToolButton = document.getElementById('editTool');
editToolButton.onclick = function(){
    // editTool.switch();
}
var brushToolButton = document.getElementById('brushTool');
brushToolButton.onclick = function(){
    // brushTool.switch();
}
function openUrl(url) {
    console.log(url);
    if (true) {
        var newTab = window.open();
        newTab.location.href = url;
    } else {
        var html = '<html>' +
            '<style>html, body { padding: 0; margin: 0; } iframe { width: 100%; height: 100%; border: 0;}  </style>' +
            '<body>' +
            '<iframe src="' + url + '"></iframe>' +
            '</body></html>';
        a = window.open();
        a.document.write(html);
    }
}
/**
*
*  Base64 encode / decode
*  http://www.webtoolkit.info/
*
**/
var Base64 = {

// private property
_keyStr : "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",

// public method for encoding
encode : function (input) {
    var output = "";
    var chr1, chr2, chr3, enc1, enc2, enc3, enc4;
    var i = 0;

    input = Base64._utf8_encode(input);

    while (i < input.length) {

        chr1 = input.charCodeAt(i++);
        chr2 = input.charCodeAt(i++);
        chr3 = input.charCodeAt(i++);

        enc1 = chr1 >> 2;
        enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
        enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
        enc4 = chr3 & 63;

        if (isNaN(chr2)) {
            enc3 = enc4 = 64;
        } else if (isNaN(chr3)) {
            enc4 = 64;
        }

        output = output +
        this._keyStr.charAt(enc1) + this._keyStr.charAt(enc2) +
        this._keyStr.charAt(enc3) + this._keyStr.charAt(enc4);

    }

    return output;
},

// public method for decoding
decode : function (input) {
    var output = "";
    var chr1, chr2, chr3;
    var enc1, enc2, enc3, enc4;
    var i = 0;

    input = input.replace(/[^A-Za-z0-9\+\/\=]/g, "");

    while (i < input.length) {

        enc1 = this._keyStr.indexOf(input.charAt(i++));
        enc2 = this._keyStr.indexOf(input.charAt(i++));
        enc3 = this._keyStr.indexOf(input.charAt(i++));
        enc4 = this._keyStr.indexOf(input.charAt(i++));

        chr1 = (enc1 << 2) | (enc2 >> 4);
        chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
        chr3 = ((enc3 & 3) << 6) | enc4;

        output = output + String.fromCharCode(chr1);

        if (enc3 != 64) {
            output = output + String.fromCharCode(chr2);
        }
        if (enc4 != 64) {
            output = output + String.fromCharCode(chr3);
        }

    }

    output = Base64._utf8_decode(output);

    return output;

},

// private method for UTF-8 encoding
_utf8_encode : function (string) {
    string = string.replace(/\r\n/g,"\n");
    var utftext = "";

    for (var n = 0; n < string.length; n++) {

        var c = string.charCodeAt(n);

        if (c < 128) {
            utftext += String.fromCharCode(c);
        }
        else if((c > 127) && (c < 2048)) {
            utftext += String.fromCharCode((c >> 6) | 192);
            utftext += String.fromCharCode((c & 63) | 128);
        }
        else {
            utftext += String.fromCharCode((c >> 12) | 224);
            utftext += String.fromCharCode(((c >> 6) & 63) | 128);
            utftext += String.fromCharCode((c & 63) | 128);
        }

    }

    return utftext;
},

// private method for UTF-8 decoding
_utf8_decode : function (utftext) {
    var string = "";
    var i = 0;
    var c = c1 = c2 = 0;

    while ( i < utftext.length ) {

        c = utftext.charCodeAt(i);

        if (c < 128) {
            string += String.fromCharCode(c);
            i++;
        }
        else if((c > 191) && (c < 224)) {
            c2 = utftext.charCodeAt(i+1);
            string += String.fromCharCode(((c & 31) << 6) | (c2 & 63));
            i += 2;
        }
        else {
            c2 = utftext.charCodeAt(i+1);
            c3 = utftext.charCodeAt(i+2);
            string += String.fromCharCode(((c & 15) << 12) | ((c2 & 63) << 6) | (c3 & 63));
            i += 3;
        }

    }

    return string;
}

}

