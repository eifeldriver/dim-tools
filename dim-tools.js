/**
 * define some vars
 */
var this_version        = '0.1';
var version_file        = 'https://raw.githubusercontent.com/eifeldriver/dim-tools/master/version';
var selector_marker     = '#app';
var selector_loading    = '#content .dim-loading';
var watcher             = null;

var actions_css         = '' +
    '#dim-actions { position:fixed; background:rgba(0, 0, 0, 0.65); padding:5px; z-index:99999; left:50%; ' +
    '  transform:translate(-50%, 0); }' +
    '#dim-actions h6 { margin: -5px 0 5px; padding: 0; } ' +
    '#dim-actions .row {}' +
    '#dim-actions .row button { font-size:90%; margin:1px; }' +
    '#dim-actions .row button:hover { background:green; color:#fff; }' +
    '#dim-actions .row button:active { background:black; }' +
    '';

var css                 = actions_css +
    '.faction-item-cnt { position:absolute; left:0; top:0; font-style:normal; border:2px solid lightgreen; ' +
    '  border-radius:50%; padding:2px; font-size:12px; color:#fff; background:green; min-width:1em; text-align:center;' +
    '}';

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

function vendorsCollapseAll() {
    var expanded = document.querySelectorAll('.vendor-char-items .title:not(.collapsed)');
    expanded.forEach(function (t) { t.click(); });
}

function vendorsExpandAll() {
    var collapsed = document.querySelectorAll('.vendor-char-items .title.collapsed');
    collapsed.forEach(function (t) { t.click(); });
}

/**
 * add some new actions for the vendors page
 */
function addVendorActions() {
    // define allowed actions
    var allowed_actions = {vendorsCollapseAll: vendorsCollapseAll, vendorsExpandAll: vendorsExpandAll};
    // create actions
    var html = '' +
        '<h6>Actions</h6>' +
        '<div class="row">' +
            '<button id="vendorsCollapseAll" class="action">collapse</button><button id="vendorsExpandAll" class="action">expand</button>' +
        '</div>';
    var div = document.createElement('DIV');
    div.id = 'dim-actions';
    div.innerHTML = html.trim();
    document.querySelector('#content').prepend(div);
    // bind actions
    var actions = document.querySelectorAll('#dim-actions .action');
    actions.forEach(function(elem, idx) {
        var callback = allowed_actions[elem.id];
        if (typeof callback === "function") {
            // function exists and are allowed
            elem.addEventListener('click', callback);
        }
    });
}

/**
 * add the faction item count to the collapsable (visible) DOM element
 */
function addFactionItemCount() {
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

    } else {
        watcher = window.setInterval(waitForLoadingFinished, 1000); // wait 1 second before run
    }
}

/**
 * exec on any finished DIM loading
 */
function startDimTools() {
    window.clearTimeout(watcher);
    insertCss(css);
    var context = getCurrentContext();
    switch (context) {
        case 'vendor':
            addVendorActions();
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