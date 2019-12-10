/** @module options */

'use strict';

import * as common from '../common/common.js';

const _ = chrome.i18n.getMessage,
    g_openInContainer = document.querySelector('#open-in-container'),
    g_switchToOpenedTab = document.querySelector('#switch-to-opened-tab');

/**
 * Remove static elements when on a platform that doesn't support required
 * APIs.
 * @function removeUnsupportedStaticElements
 * @async
 */
const removeUnsupportedStaticElements = async () => {
    if (!await common.isSupportedContainer()) {
        Array.from(document.querySelectorAll('.remove-container'))
            .forEach(e => e.remove());
    }
};

/**
 * Add text and accesskey as a span element for a text which has underscores
 * around a character, meaning to create an accesskey for it and that it can
 * be used as a shortcut on the UI.
 * @function addAccesskey
 * @param elem {HTMLElement} Element where the accesskey and texts are appended
 * to as children.
 * @param match {Array} Matches for underscore text, will contain the character
 * surrounded by underscores and strings on the left and right sides of the
 * underscores, they can be empty.
 */
const addAccesskey = (elem, match) => {
    const textLeft = document.createTextNode(match[1]);
    elem.appendChild(textLeft);

    const accesskey = document.createElement('span');
    accesskey.classList.add('accesskey');
    accesskey.setAttribute('accesskey', match[2]);
    accesskey.textContent = match[2];
    elem.appendChild(accesskey);

    const textRight = document.createTextNode(match[3]);
    elem.appendChild(textRight);
};

/**
 * Localize strings in the options page. Each string to be localized in the
 * HTML has data-i18n attribute in the tag.
 * @function localize
 */
const localize = () => {
    document.querySelectorAll('[data-i18n]').forEach(e => {
        const text = _(e.dataset.i18n);
        const m = text.match(/(.*)_(.)_(.*)/);
        if (m)
            addAccesskey(e, m);
        else
            e.textContent = text;
    });
};

/**
 * Show an informational message for a while.
 * @function showInfo
 * @param text {String} Message shown to the user.
 */
const showInfo = (text) => {
    const info = document.querySelector('#info-text');
    info.textContent = text;
    const hidden = 'hidden';
    info.classList.remove(hidden);
    setTimeout(() => info.classList.add(hidden), 3000);
};

/**
 * Save all the options. Doesn't save anything if any of the titles or the URLs
 * is an empty string.
 * @function saveOptions
 * @async
 * @param tbody {HTMLElement} The tag where the redirect options are added.
 */
const saveOptions = async (tbody) => {
    const inputs = tbody.querySelectorAll('.title-input, .url-input');
    const empty = Array.from(inputs).find(input => !input.value);
    if (empty) {
        showInfo(_('options_js_errorEmptyInput'));
        return;
    }

    const rows = {};
    tbody.querySelectorAll('tr').forEach((tr, i) => {
        const title = tr.querySelector('.title-input').value;
        rows[title] = {
            enabled: tr.querySelector('.enabled-input').checked,
            url: tr.querySelector('.url-input').value,
            index: i,
        };
        const enableURLElement = tr.querySelector('.enable-url-input');
        if (enableURLElement)
            rows[title].enableURL = enableURLElement.value;
    });

    const opts = {
        rows: rows,
        'switch-to-opened-tab': g_switchToOpenedTab.checked,
    };
    if (await common.isSupportedContainer())
        opts['open-in-container'] = g_openInContainer.checked;

    chrome.storage.local.set(opts, () => showInfo(_('options_js_settingsSaved')));
};

/**
 * Find where user is trying to move a row.
 * @function findMoveTargetRow
 * @param node {HTMLElement} Target node where user tried to move a row.
 * @param tbody {HTMLElement} Element which children redirection rows are.
 * @return {HTMLElement[]} A redirection row and its next sibling if node
 * is a header or redirection row, or null or undefined and undefined otherwise.
 */
const findMoveTargetRow = (node, tbody) => {
    let referenceNode;
    do {
        // Mouseup on top of header row. Insert as a first row.
        if (node.classList && node.classList.contains('header-row')) {
            referenceNode = tbody.children[0];
            break;
        }
        // Mouseup on top of any redirection row. Insert after it.
        else if (node.classList && node.classList.contains('redirect-row')) {
            referenceNode = node.nextSibling;
            break;
        }
        node = node.parentNode;
    } while (node);

    return [ node, referenceNode ];
};

/**
 * Move a row.
 * @function startMovingARow
 * @param tr {HTMLElement} Row to move.
 * @param e {MouseEvent} Mousedown event.
 */
const startMovingARow = (tr, e) => {
    const tbody = tr.parentNode;

    const showMovingARow = (e) => {
        const [ node ] = findMoveTargetRow(e.target, tbody);
        if (node)
            node.style.setProperty('--row-move-highlight-size', 1);
    };
    const table = document.getElementsByTagName('table')[0];
    table.addEventListener('mouseover', showMovingARow);

    const nextSibling = tr.nextSibling;
    tr.remove();
    const moveRow = (e) => {
        const [ node, referenceNode ] = findMoveTargetRow(e.target, tbody);
        if (node)
            tbody.insertBefore(tr, referenceNode);
        // Moved to incorrect area, move the row back where it was.
        else
            tbody.insertBefore(tr, nextSibling);

        table.querySelectorAll('tr').forEach(r =>
            r.style.setProperty('--row-move-highlight-size', 0));
        document.removeEventListener('mouseup', moveRow);
        table.removeEventListener('mouseover', showMovingARow);
    };
    document.addEventListener('mouseup', moveRow);
};

/**
 * Add a new row to the redirect options table.
 * @function addRow
 * @async
 * @param tbody {HTMLElement} The tag where the redirect options are added.
 * @param row {Object} A redirect option.
 */
const addRow = async (tbody, row) => {
    let checked, title, url, enableURL;
    checked = title = url = enableURL = '';

    if (row) {
        checked = row.enabled ? 'checked' : '';
        title = row.title;
        url = row.url;
        enableURL = row.enableURL || '';
    }
    else
        checked = 'checked';

    const tr = document.createElement('tr');
    tr.classList.add('redirect-row');

    // Redirect enabled cell.
    let td = document.createElement('td');
    td.className = 'center';
    let input = document.createElement('input');
    input.type = 'checkbox';
    input.className = 'enabled-input';
    input.checked = checked;
    td.appendChild(input);
    tr.appendChild(td);

    // Title cell.
    td = document.createElement('td');
    td.className = 'title-column';
    input = document.createElement('input');
    input.type = 'text';
    input.className = 'title-input';
    input.required = true;
    input.size = 15;
    input.value = title;
    td.appendChild(input);
    tr.appendChild(td);

    // URL cell.
    td = document.createElement('td');
    td.className = 'url-column';
    input = document.createElement('input');
    input.type = 'url';
    input.className = 'url-input';
    input.required = true;
    input.value = url;
    input.title = _('options_js_urlHelpTooltip');
    td.appendChild(input);
    tr.appendChild(td);

    // EnableURL cell.
    td = document.createElement('td');
    td.className = 'enable-url-column';
    input = document.createElement('input');
    input.type = 'url';
    input.className = 'enable-url-input';
    input.value = enableURL;
    input.title = _('options_js_enableURLTooltip');
    td.appendChild(input);
    tr.appendChild(td);

    // Remove row button cell.
    td = document.createElement('td');
    input = document.createElement('input');
    input.type = 'button';
    input.value = _('options_js_removeRowButton');
    input.addEventListener('click', () => tr.remove());
    td.appendChild(input);
    tr.appendChild(td);

    // Drag image.
    const moveImg = document.createElement('img');
    moveImg.classList.add('move-img');
    moveImg.src = './move.svg';
    moveImg.title = 'Move';
    moveImg.addEventListener('mousedown', (e) => startMovingARow(tr, e));
    tr.appendChild(moveImg);

    tbody.appendChild(tr);
};

/**
 * Add all the stored options to the page.
 * @function addItems
 * @async
 * @param tbody {HTMLElement} The tag where the redirect options are added.
 * @param options {Object} All the options.
 */
const addItems = async (tbody, options) => {
    Object.keys(options.rows)
        .sort((title1, title2) =>
            common.compareRowIndices(options.rows, title1, title2))
        .forEach((title) => {
            const row = options.rows[title];
            row['title'] = title;
            addRow(tbody, row);
        });

    g_switchToOpenedTab.checked = options['switch-to-opened-tab'];
    if (await common.isSupportedContainer())
        g_openInContainer.checked = options['open-in-container'];
};

const tbody = document.getElementsByTagName('tbody')[0];

(async () => await removeUnsupportedStaticElements())();
localize();
chrome.storage.local.get(null, (options) => addItems(tbody, options));
document.querySelector('#add-row-button').addEventListener(
    'click', async () => {
        await addRow(tbody);
        const trs = document.querySelectorAll('tr');
        const lastTr = trs[trs.length - 1];
        lastTr.querySelector('.title-input').focus();
});
document.querySelector('#save-button').addEventListener(
    'click', () => saveOptions(tbody));
