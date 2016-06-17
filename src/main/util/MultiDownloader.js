// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

wmsx.MultiDownloader = function (urlSpecs, onAllSuccess, onAnyError, timeout) {

    this.start = function() {
        if (!urlSpecs || urlSpecs.length === 0)
            onAllSuccess(urlSpecs);
        else {
            for (var i = 0; i < urlSpecs.length; i++) load(urlSpecs[i]);
            checkFinish();
        }
    };

    function load(urlSpec) {
        if (!urlSpec) return;
        wmsx.Util.log("Reading file from URL: " + urlSpec.url);

        // Check for embedded file request
        if (urlSpec.url[0] === "@") {
            var compressedContent = wmsx.MultiDownloader.embeddedCompressedFiles[urlSpec.url.substr(1)];
            if (compressedContent !== undefined) {
                urlSpec.success = true;
                urlSpec.content = wmsx.Util.uncompressStringBase64ToInt8BitArray(compressedContent);
                if (urlSpec.onSuccess) urlSpec.onSuccess(urlSpec);
            } else {
                urlSpec.success = false;
                urlSpec.error = "Embedded file not found: " + urlSpec.url;
                wmsx.Util.log(urlSpec.error);
                if (urlSpec.onError) urlSpec.onError(urlSpec);
                else wmsx.Util.message(urlSpec.error);
            }
            checkFinish();
            return;
        }

        // If not, request download
        var req = new XMLHttpRequest();
        req.withCredentials = true;
        req.open("GET", urlSpec.url, true);
        req.responseType = "arraybuffer";
        req.timeout = timeout !== undefined ? timeout : DEFAULT_TIMEOUT;
        req.onload = function () {
            if (req.status === 200) {
                urlSpec.success = true;
                urlSpec.content = new Uint8Array(req.response);
                if (urlSpec.onSuccess) urlSpec.onSuccess(urlSpec);
            } else {
                getError(urlSpec, req);
            }
            checkFinish();
        };
        req.onerror = function () {
            getError(urlSpec, req);
            checkFinish();
        };
        req.ontimeout = function () {
            getError(urlSpec, req);
            checkFinish();
        };
        req.send();
    }

    function getError(urlSpec, req) {
        urlSpec.success = false;
        urlSpec.error = (req.statusText || req.status);
        var mes = "Could not load file: " + urlSpec.url + "\nError: " + res.error;
        wmsx.Util.log(mes);
        if (urlSpec.onError) urlSpec.onError(urlSpec);
        else wmsx.Util.message(mes);
    }

    function checkFinish() {
        if (finished) return;

        for (var i = 0; i < urlSpecs.length; i++)
            if (urlSpecs[i] && (urlSpecs[i].success === undefined)) return;

        finished = true;

        // All urls have a definition, check for errors
        for (i = 0; i < urlSpecs.length; i++)
            if (urlSpecs[i] && !urlSpecs[i].success) {
                if (onAnyError) onAnyError(urlSpecs);
                return;
            }

        // If no errors, then success
        if (onAllSuccess) onAllSuccess(urlSpecs);
    }

    var finished = false;

    var DEFAULT_TIMEOUT = 8000;

};

wmsx.MultiDownloader.embedCompressedFile = function(fileName, compressedContent) {
    wmsx.MultiDownloader.embeddedCompressedFiles[fileName] = compressedContent;
};

wmsx.MultiDownloader.flushEmbeddedFile = function(fileName) {
    delete wmsx.MultiDownloader.embeddedCompressedFiles[fileName];
};

wmsx.MultiDownloader.embeddedCompressedFiles = {};
