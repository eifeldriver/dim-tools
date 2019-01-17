/**
 * define some vars
 */
var this_debug      = 1;
var this_version    = '0.1';
var version_file    = 'https://raw.githubusercontent.com/eifeldriver/dim-tools/master/version';


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

/**
 * init the script
 */
function initDimTools() {

}



//###########################################################

/*
 * init script
 */

initDimTools();