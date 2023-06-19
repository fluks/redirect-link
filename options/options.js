/** @module options */

'use strict';

import * as common from '../common/common.js';

const _ = chrome.i18n.getMessage,
    g_openInContainer = document.querySelector('#open-in-container'),
    g_switchToOpenedTab = document.querySelector('#switch-to-opened-tab'),
    g_openToNewTab = document.querySelector('#open-to-new-tab'),
    g_importButton = document.querySelector('#import-button'),
    g_tbody = document.getElementsByTagName('tbody')[0];
let g_draggedRow;

/**
 * Remove static elements when on a platform that doesn't support required
 * APIs.
 * @function removeUnsupportedStaticElements
 * @async
 */
const removeUnsupportedStaticElements = async () => {
    if (!await common.isSupportedContainer())
         document.querySelector('#open-in-container-div').remove();

    if (await common.detectBrowser() === common.FIREFOX_FOX_ANDROID)
        document.querySelector('#open-to-new-tab-div').remove();
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
    if (await common.detectBrowser() !== common.FIREFOX_FOR_ANDROID)
        opts['open-to-new-tab'] = g_openToNewTab.checked;

    chrome.storage.local.set(opts, () => showInfo(_('options_js_settingsSaved')));
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

    // Drag row button cell.
    td = document.createElement('td');
    input = document.createElement('input');
    input.type = 'button';
    input.value = _('options_js_dragButton');
    input.addEventListener('mousedown', () => tr.draggable = true);
    tr.addEventListener('mouseup', () => tr.draggable = false);
    td.appendChild(input);
    tr.appendChild(td);

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
    if (await common.detectBrowser() !== common.FIREFOX_FOR_ANDROID)
        g_openToNewTab.checked = options['open-to-new-tab'];
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
 * Start dragging a redirect row.
 * @function dragstartHandler
 * @param e {Event}
 */
const dragstartHandler = (e) => {
    if (!e.target.classList.contains('redirect-row'))
        return;

    g_draggedRow = e.target;
    // Some data must be set.
    e.dataTransfer.setData('text/plain', '');
    e.dataTransfer.dropEffect = 'move';
};

/**
 * Show drop effect on elements.
 * @function dragoverHandler
 * @param e {Event}
 */
const dragoverHandler = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
};

/**
 * Drop a redirect row. It can only be dropped on another redirect row or the
 * top header.
 * @function dropHandler
 * @param e {Event}
 */
const dropHandler = (e) => {
    e.preventDefault();
    const [ node, referenceNode ] = findMoveTargetRow(e.target, g_tbody);
    if (node && !g_draggedRow.isSameNode(referenceNode)) {
        g_draggedRow.remove();
        g_tbody.insertBefore(g_draggedRow, referenceNode);
    }
};

/**
 * Export and save all the settings to a file.
 * @function exportSettings
 */
const exportSettings = () => {
    chrome.storage.local.get(null, (options) => {
        const date = (new Date()).toLocaleString(navigator.language).replace(/\/|\\|:/g, '_');
        const filename = `redirect-link_settings_${date}.json`;
        const file = new File([ JSON.stringify(options) ], filename, { type: 'application/json' });

        const link = document.querySelector('iframe')
            .contentWindow.document.querySelector('#save-link');
        link.href = URL.createObjectURL(file);
        link.download = filename;
        link.addEventListener('click', function cleanResources() {
            URL.revokeObjectURL(file);
            this.removeEventListener('click', cleanResources);
        });
        link.click();
    });
};

/**
 * Import settings from a file either replacing or adding redirections.
 * @function importSettings
 * @param e {ChangeEvent}
 */
const importSettings = (e) => {
    const file = e.target.files[0];
    if (file) {
        const fr = new FileReader();
        fr.onload = async (e) => {
            const importedOptions = JSON.parse(e.target.result);
            const options = await browser.storage.local.get([ 'rows' ]);

            if (document.querySelector('#import-replace').checked) {
                Array.from(g_tbody.children).forEach(c => c.remove());
            }
            else {
                const duplicateTranslation = _('options_js_importedDuplicateTitle');
                Object.keys(options.rows).forEach(title => {
                    const sameTitlePrefix =
                        ({}).hasOwnProperty.call(importedOptions.rows, title) ?
                        duplicateTranslation : '';
                    const newTitle = sameTitlePrefix + title;
                    importedOptions.rows[newTitle] = importedOptions.rows[title];
                    delete importedOptions.rows[title];
                });

            }
            addItems(g_tbody, importedOptions);
        };
        fr.readAsText(file);
    }
};

(async () => await removeUnsupportedStaticElements())();
localize();
chrome.storage.local.get(null, (options) => addItems(g_tbody, options));
document.querySelector('#add-row-button').addEventListener(
    'click', async () => {
        await addRow(g_tbody);
        const trs = document.querySelectorAll('tr');
        const lastTr = trs[trs.length - 1];
        lastTr.querySelector('.title-input').focus();
});
document.querySelector('#save-button').addEventListener(
    'click', () => saveOptions(g_tbody));
document.querySelector('#export-button').addEventListener(
    'click', exportSettings);
document.querySelector('#fake-import-button').addEventListener(
    'click', () => g_importButton.click());
g_importButton.addEventListener('change', importSettings);

document.addEventListener('dragstart', dragstartHandler);
document.addEventListener('dragover', dragoverHandler);
document.addEventListener('drop', dropHandler);
