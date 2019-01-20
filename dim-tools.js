/**
 * define some vars
 */
var this_debug          = 1;
var this_version        = '0.1';
var version_file        = 'https://raw.githubusercontent.com/eifeldriver/dim-tools/master/version';
var loading_starts      = 0;
var loading_ends        = 0;
var selector_marker     = '#app';
var selector_spinner    = '.dim-loading';
var selector_loading    = '#content .dim-loading';
var watcher             = null;

var css                 = '' +
    '.faction-item-cnt { position:absolute; left:0; top:0; font-style:normal; border:2px solid lightgreen; ' +
    '  border-radius:50%; padding:2px; font-size:12px; color:#fff; background:green; min-width:1em; text-align:center;' +
    '}';

//------------------------------------------------------------

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
function insertCss(css) {
    _debug('add CSS to the page');
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
    _debug('exec getCurrentContext');
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
        // _debug('still loading ...');

    } else {
        _debug('loading finished.');
        window.clearInterval(watcher);
        _debug('kill watcher');
        storeCurrentContext();
        initDomObserver();
        startDimTools();
    }
}

/**
 * init the mutation observer
 */
function initDomObserver() {
    _debug('exec initDomObserver');
    var div = document.querySelector('#content');
    if (div) {
        var observer = new MutationObserver(
            function(mutations) {
                // _debug('exec MutationObserver');
                // clear and set watcher on every mutation event
                // the timeout is larger then the next event is fired, so the start function doesnt will be called
                // after the last event the timeout can be reached and the start function will be called
                if (document.querySelector(selector_loading)) {
                    _debug('loading ...');
                    watcher = window.setInterval(waitForLoadingFinished, 1000);
                    // remove observer so that this code will be exec only one time on changes
                    this.disconnect();
                    _debug('kill MutationObserver');

                } else if (hasContextChanged()) {
                    _debug('new context loaded.');
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
    _debug('exec addFactionItemCount');
    var vendors = document.querySelectorAll('#content > div > .vendor-char-items');
    // expand all items
    var collapsed = document.querySelectorAll('.vendor-char-items .title.collapsed');
    collapsed.forEach(function (t) { t.click(); });
    // read item count of any NPC
    vendors.forEach(function(faction, idx) {
        var npc_name        = faction.querySelector('.title > span > span > span');
        npc_name            = npc_name ? npc_name.innerText : 'unknown';
        var vendor_items    = faction.querySelector('.vendor-items');
        if (vendor_items) {
            var cnt = vendor_items.querySelector('.item-faction');
            if (cnt) {
                cnt = cnt.innerText;
                var elem = document.createElement('SPAN');
                elem.className = 'faction-item-cnt';
                elem.innerText = cnt;
                faction.prepend(elem);
                _debug(npc_name + ' = ' + cnt);
            }
        }
    });
    // restore collapsed or expanded sections
    collapsed.forEach(function (t) { t.click(); });
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
        _debug('Need authentification ... Please login!');

    } else {
        _debug('loading ...');
        watcher = window.setInterval(waitForLoadingFinished, 1000); // wait 1 second before run
    }
}

/**
 * exec on any finished DIM loading
 */
function startDimTools() {
    _debug('DIM Tools started');
    window.clearTimeout(watcher);
    _debug('watcher cleared');
    insertCss(css);
    var context = getCurrentContext();
    _debug('current context = ' + context);
    switch (context) {
        case 'vendor':
            addFactionItemCount();
            break;
        case 'inventory':

            break;
        case 'progress-page':

            break;

        default:

            break;
    }
}


//###########################################################

/*
 * init script
 */

initDimTools();