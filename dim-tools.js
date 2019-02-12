// ==UserScript==
// @name         dim-tools
// @namespace    http://tampermonkey.net/
// @version      0.23
// @description  add some features to app.destinyitemmanager.com
// @author       EifelDriver
// @match        https://app.destinyitemmanager.com/index.html
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    /**
     * define some vars
     */
    var js_debug            = 1;
    var js_version          = '0.23';
    var version_file        = 'https://raw.githubusercontent.com/eifeldriver/dim-tools/master/version';
    var selector_marker     = '#app';
    var selector_loading    = '#content .dim-loading';
    var watcher             = null;

    var actions_css         = '' +
        '#dim-vendors-actions { position:fixed; background:rgba(0, 0, 0, 0.65); padding:5px; z-index:99999; top: 55px; left:50%; ' +
        '  transform:translate(-50%, 0); }' +
        '#dim-vendors-actions h6 { margin: -5px 0 5px; padding: 0; } ' +
        '#dim-vendors-actions .row {}' +
        '#dim-vendors-actions .row button { font-size:90%; margin:1px; }' +
        '#dim-vendors-actions .row button:hover { background:green; color:#fff; }' +
        '#dim-vendors-actions .row button:active { background:black; }' +
        '';

    var css                 = actions_css +
        // inventory page
        '.character-text .currency.advice { background: darkgreen; padding: 2px 5px; }' +
        '.character-text .currency.warning { background: darkorange; padding: 2px 5px; }' +
        '.character-text .currency.critical { background: orangered; padding: 2px 5px; }' +
        '.character-text .currency.alert { background: orangered; padding: 2px 5px; }' +
        // progress page

        // vendors page
        '.faction-item-cnt { position:absolute; left:0; top:0; font-style:normal; border:2px solid #fff; ' +
        '  border-radius:50%; padding:2px; font-size:14px; color:#fff; background:darkgreen; min-width:1em; text-align:center; }';

    var vendors = {
        'lord saladin'      :   { 'items_per_levelup': 100, 'items_per_levelup_step': 10},
        'lord shaxx'        :   { 'items_per_levelup': 60,  'items_per_levelup_step': 10},
        'asher mir'         :   { 'items_per_levelup': 60,  'items_per_levelup_step': 10},
        'devrim kay'        :   { 'items_per_levelup': 60,  'items_per_levelup_step': 10},
        'sloane'            :   { 'items_per_levelup': 60,  'items_per_levelup_step': 10},
        'failsafe'          :   { 'items_per_levelup': 60,  'items_per_levelup_step': 10},
        'bruder vance'      :   { 'items_per_levelup': 60,  'items_per_levelup_step': 10},
        'ana bray'          :   { 'items_per_levelup': 100, 'items_per_levelup_step': 10},
        // 'Commander Zavala'  :   { 'items_per_levelup': 100, 'items_per_levelup_step': 10},
        // 'Banshee-44'        :   { 'items_per_levelup': 100, 'items_per_levelup_step': 25}

    };

    //------------------------------------------------------------

    /**
     * debug output function
     */
    function _debug(txt) {
        if (js_debug) {
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
                if (js_version.trim() != repo_version.trim()) {
                    // other version available
                    var info        = document.createElement('DIV');
                    info.id         = 'dim-tools-update';
                    info.className  = 'flashit';
                    info.innerHTML  = '<span title="Your version = ' + js_version + ' | New version = ' + repo_version + '">*</span>';
                    var btn = document.querySelector('#header');
                    btn.appendChild(info);
                }
            } else {
                return null;
            }
        };
        try { xhr.send(); } catch(err) { _debug('check for updates failed, because: ' + err.message); }
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
     * return the first classname as name of the current context
     *
     * @returns {string}
     */
    function getCurrentContext() {
        // _debug('exec getCurrentContext');
        var curr_context = document.querySelector('#content > div');
        if (curr_context) {
            curr_context = curr_context.className.split(' ')[0];
        } else {
            curr_context = 'unknown';
        }
        return curr_context;
    }

    /**
     * store the name of the current context
     *
     */
    function storeCurrentContext() {
        document.querySelector(selector_marker).dataset.context = getCurrentContext();
    }

    /**
     * return the name of the stored context
     * @returns {*}
     */
    function getStoredContext() {
        var marker          = document.querySelector(selector_marker);
        var stored_context  = '';
        if (marker) {
            stored_context = marker.dataset.context;
        } else {
            stored_context = 'unknown';
        }
        return stored_context;
    }

    /**
     * verify the current and stored context names
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
     * wait until the DIM loading process has finished
     */
    function waitForLoadingFinished() {
        // _debug('exec waitForLoadingFinished');
        if (document.querySelector(selector_loading)) {
            // _debug('still loading ...');

        } else {
            _debug('loading finished.');
            if (document.querySelectorAll('#content').length == 0) {
                // #content not found
                // do nothing because the next interval will call this function again
                _debug('unknown context - still waiting ...');

            } else {
                // all right
                window.clearInterval(watcher);
                _debug('kill watcher');
                storeCurrentContext();
                initDomObserver();
                startDimTools();
            }
        }
    }

    /**
     * set the mutation observer
     * The observer will be called on any DOM change inside the #content element.
     * If the DIM loading element was found, the new interval will be set and kill the observer.
     * otherwise check if the current context has changed.
     * Every DOM change will start the interval to check if the DIM loading is finished.
     * TODO: check if this concept force a high payload (CPU)
     */
    function initDomObserver() {
        _debug('exec initDomObserver');
        var div = document.querySelector('#content');
        if (div) {
            var observer = new MutationObserver(
                function(mutations) {
                    // _debug('exec MutationObserver');
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

    /**
     * remove other actions (vendors, progress, ...) if exists
     */
    function removeOtherContextActions() {
        var actions = ['#dim-vendors-actions'];
        actions.forEach(
            function(sel) {
                var elem = document.querySelector(sel);
                if (elem) {
                    elem.parentNode.removeChild(elem);
                }
            }
        );
    }

    //---------------------- Inventory page --------------------------------------

    /**
     * modify currency to alert at high amount
     */
    function checkCurrency() {
        _debug('exec checkCurrency');
        var credits = document.querySelector('.character-box.vault .character-text .currency');
        if (credits) {
            var css = '';
            var max_amount = 100000;
            var filled = parseInt(credits.innerText.trim()) / max_amount;
            if (filled  > 0.99) {
                css = ' alert';
            } else if (filled > 0.95) {
                css = ' critical';
            } else if (filled > 0.80) {
                css = ' warning';
            } else if (filled > 0.65) {
                css = ' advice';
            }
            credits.className += css;
        }
    }

    //---------------------- Progress page --------------------------------------


    //---------------------- Vendors page --------------------------------------

    /**
     * collapse all expanded vendor sections
     *
     */
    function vendorsCollapseAll(expanded) {
        if (typeof expanded != 'object' || expanded.__proto__ != 'NodeList') {
            // get currently expanded sections
            expanded = document.querySelectorAll('.vendor-char-items .title:not(.collapsed)');
        }
        expanded.forEach(function (t) { t.click(); });
        return expanded;
    }

    /**
     * expand all collapsed vendor sections
     */
    function vendorsExpandAll(collapsed) {
        if (typeof collapsed != 'object' || collapsed.__proto__ != 'NodeList') {
            // get currently collapsed sections
            collapsed = document.querySelectorAll('.vendor-char-items .title.collapsed');
        }
        collapsed.forEach(function (t) { t.click(); });
        return collapsed;
    }

    /**
     * add some new actions for the vendors page
     */
    function addVendorActions() {
        // create actions
        var html = '' +
            '<h6>Actions</h6>' +
            '<div class="row">' +
            '<button id="vendors-collapse" data-callback="vendorsCollapseAll" class="action">collapse</button><button id="vendors-expand" data-callback="vendorsExpandAll" class="action">expand</button>' +
            '</div>';
        var div         = document.createElement('DIV');
        div.id          = 'dim-vendors-actions';
        div.innerHTML   = html.trim();
        document.querySelector('#content').appendChild(div);
        // bind actions
        document.querySelector('#dim-vendors-actions #vendors-collapse').addEventListener('click', vendorsCollapseAll);
        document.querySelector('#dim-vendors-actions #vendors-expand').addEventListener('click', vendorsExpandAll);
    }

    /**
     * calculate the available faction item count based on the vendor currency
     */
    function addFactionItemCount() {
        _debug('exec addFactionItemCount');
        var factions = document.querySelectorAll('#content > div > .vendor-char-items');
        // expand all items
        var collapsed = vendorsExpandAll();
        // read item count of any NPC
        var level_poly, level_max, level_filled, level_progress;
        factions.forEach(function(faction, idx) {
            var npc_name        = faction.querySelector('.title > span > span > span');
            npc_name            = npc_name ? npc_name.innerText.toLocaleLowerCase() : 'unknown';
            if (vendors[npc_name]) {     // process only selected venodrs
                var vendor_items = faction.querySelector('.vendor-items');
                if (vendor_items) {
                    level_poly = faction.querySelector('.faction-icon polygon');
                    if (level_poly) {   // not every vendor has an progress polygon
                        level_max       = parseInt(level_poly.attributes[0].nodeValue);   // get value of stroke-dasharray
                        level_filled    = parseInt(level_poly.style['strokeDashoffset']);   // get value of stroke-offset
                        level_progress  = level_filled / level_max; // is a % value
                    } else {
                        // poly element doesnt exists but this is a DIM mistake and
                        // this script supposed level_progress = 0
                        level_progress  = 0;
                    }
                    var have_tokens     = faction.querySelector('.vendor-currencies .vendor-currency:nth-child(2)');
                    have_tokens         = have_tokens ? parseInt(have_tokens.innerText) : 0;
                    if (have_tokens) {   // min 1 token exists
                        var tokens_max      = vendors[npc_name]['items_per_levelup'];
                        var tokens_filled   = parseInt(vendors[npc_name]['items_per_levelup'] * level_progress);
                        if ((tokens_max - tokens_filled - have_tokens) < 0) {    // levelup is possible
                            var level_ups = parseInt((have_tokens - (tokens_max - tokens_filled)) / tokens_max) + 1;
                        }
                        if (level_ups) {    // hide none level_ups
                            var elem        = document.createElement('SPAN');
                            elem.className  = 'faction-item-cnt';
                            elem.innerText  = level_ups;
                            faction.prepend(elem);
                            _debug(npc_name + ' = ' + level_ups);
                        }
                    }
                }
            }
        });
        // collapsed all temporarly expanded sections
        vendorsCollapseAll(collapsed);
    }

    //------------------------------------------------------------

    /**
     * init the script
     *
     * 1st = wait 1 sec
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
        // checkForUpdates();
        var context = getCurrentContext();
        _debug('current context = ' + context);
        removeOtherContextActions();
        switch (context) {
            case 'vendor':
                addVendorActions();
                addFactionItemCount();
                break;
            case 'inventory-content':
                checkCurrency();
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
    window.addEventListener('load', initDimTools);

})();
