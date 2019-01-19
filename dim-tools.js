/**
 * define some vars
 */
var this_version        = '0.1';
var version_file        = 'https://raw.githubusercontent.com/eifeldriver/dim-tools/master/version';
var loading_starts      = 0;
var loading_ends        = 0;
var selector_marker     = '#app';
var selector_spinner    = '.dim-loading';
var selector_loading    = '#content .dim-loading';
var watcher             = null;

var css                 = '';

//------------------------------------------------------------

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
function insertCss(css) {
    var style   = document.createElement('STYLE');
    style.innerHTML = css;
    document.querySelector('head').appendChild(style);
}

/**
 * return the first classname of the current context
 *
 * @returns {string}
 */
function getCurrentContext() {
    var curr_context = document.querySelector('#content > div').className.split(' ')[0];
    return curr_context;
}

/**
 * store the 1st classname of the current context for usage in the observer
 *
 */
function storeCurrentContext() {
    var curr_context = document.querySelector('#content > div').className.split(' ')[0];
    document.querySelector(selector_marker).dataset.context = curr_context;
    return curr_context;
}

/**
 * return the stored context
 * @returns {*}
 */
function getStoredContext() {
    return document.querySelector(selector_marker).dataset.context;
}

/**
 * verify current and stored context
 * if not the same then the context has changed
 * @returns {boolean}
 */
function hasContextChanged() {
    var changed = false;
    if (getCurrentContext() != getStoredContext()) {
        changed = true;
    }
    return changed;
}

/**
 * wait after page load of the DIM loading spinner
 */
function waitForLoadingFinished() {
    // _debug('exec waitForLoadingFinished');
    if (document.querySelector(selector_loading)) {
        // still loading ...

    } else {
        window.clearInterval(watcher);
        storeCurrentContext();
        initDomObserver();
        startDimTools();
    }
}

/**
 * init the mutation observer
 */
function initDomObserver() {
    var div = document.querySelector('#content');
    if (div) {
        var observer = new MutationObserver(
            function(mutations) {
                // this function will be called on any DOM changes
                if (document.querySelector(selector_loading)) {
                    watcher = window.setInterval(waitForLoadingFinished, 1000);
                    // remove observer so that this code will be exec only one time on changes
                    this.disconnect();

                } else if (hasContextChanged()) {
                    waitForLoadingFinished();   // direct call to run dim-tools again
                }
            }
        );
        observer.observe(div,
            {
                attributes: true,
                characterData: true,
                childList: true,
                subtree: true,
                attributeOldValue: true,
                characterDataOldValue: true
            }
        );
    }
}

//------------------------------------------------------------

/**
 * add the faction item count to the collapsable (visible) DOM element
 */
function addFactionItemCount() {
    var vendors = document.querySelectorAll('.vendor-char-items');
    for (var idx=0; idx<vendors.length; idx++) {
        var faction = vendors[idx];
        var cnt     = faction.querySelector('.item-faction').innerText;
    }
}

//------------------------------------------------------------

/**
 * init the script
 *
 * 1st = waiting for loading
 * 2nd = wait for loading finished
 * 3rd = exec dim-tools
 */
function initDimTools() {
    if (document.querySelector('#app .billboard')) {
        // need Battle.net login

    } else {
        watcher = window.setInterval(waitForLoadingFinished, 1000); // wait 1 second before run
    }
}

/**
 * exec on any finished DIM loading
 */
function startDimTools() {
    window.clearTimeout(watcher);
    var context = getCurrentContext();
}


//###########################################################

/*
 * init script
 */

initDimTools();