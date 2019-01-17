/**
 * define some vars
 */
var this_debug          = 1;
var this_version        = '0.1';
var version_file        = 'https://raw.githubusercontent.com/eifeldriver/dim-tools/master/version';
var loading_starts      = 0;
var loading_ends        = 0;
var selector_spinner    = '.dim-loading';
var watcher             = null;


/**
 * debug function
 */
function _debug(txt) {
    if (this_debug) {
        var d = new Date();
        var now = [d.getHours(), d.getMinutes(), d.getSeconds(), d.getMilliseconds()].join(':');
        console.log(now + ': ' + txt);
    }
}

/**
 * check Github version with local version
 */
function checkForUpdates() {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', version_file);
    xhr.onload = function() {
        if (xhr.status == 200) {
            var repo_version = xhr.responseText;
            if (this_version.trim() != repo_version.trim()) {
                // other version available
                var info        = document.createElement('DIV');
                info.id         = 'dim-tools-update';
                info.className  = 'flashit';
                info.innerHTML  = '<span title="Your version = ' + this_version + ' | New version = ' + repo_version + '">*</span>';
                var btn = document.querySelector('#dim-tools-button');
                btn.appendChild(info);
            }
        } else {
            return null;
        }
    };
    xhr.send();
}


/**
 * insert custom CSS
 *
 */
function insertCss() {
    var css     =   '' +
        '';
    var style   = document.createElement('STYLE');
    style.innerHTML = css;
    document.querySelector('head').appendChild(style);
}

//------------------------------------------------------------

function addFactionItemCount() {
    if (location.href.endsWith('/vendors')) {
        var vendors = document.querySelectorAll('.vendor-char-items');
        for (var idx=0; idx<vendors.length; idx++) {
            var faction = vendors[idx];
            var cnt     = faction.querySelector('.item-faction').innerText;
            _debug(faction.querySelector('span > span > span').innerText + ': ' + cnt)
        }
    }
}


/**
 * simple check for running loading process
 */
function isStillLoading() {
    // DOM element only exists on running reload
    return document.querySelectorAll(selector_spinner).length;
}

function waitForReloadStarts() {
    if (isStillLoading()) {
        loading_starts = 1;
        window.clearInterval(watcher);
        _debug("watcher cleared");
        watcher = window.setInterval(waitForReloadFinished, 1000);
        _debug("watcher 'wait for loading finished' started");
        
    }
}

function waitForReloadFinished() {
    if (!isStillLoading()) {
        loading_ends = 1;
        window.clearInterval(watcher);
        _debug("watcher cleared");
        startDimTools();
    }
}

/**
 * init the script
 *
 * 1st = waiting for loading
 * 2nd = wait for loading finished
 * 3rd = exec dim-tools
 */
function initDimTools() {
    window.clearInterval(watcher);
    _debug("watcher cleared");
    watcher = window.setInterval(waitForReloadStarts, 1000);
    _debug("watcher 'wait for loading starts' started");
}

/**
 * add the tools to the page
 */
function startDimTools() {
    _debug('DIM Tools started');
}


//###########################################################

/*
 * init script
 */

initDimTools();