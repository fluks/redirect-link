'use strict';

import * as common from '../common/common.js';

// Localization function.
const _ = chrome.i18n.getMessage;

/**
 * Remove static elements when on a platform that doesn't support APIs
 * required for enabling URLs.
 * @async
 */
const removeUnsupportedStaticElements = async () => {
    if (await common.getBrowser() !== 'chrome')
        return;

    Array.from(document.querySelectorAll('.remove'))
        .forEach(e => e.remove());
};

/**
 * Add text and accesskey as a span element for a text which has underscores
 * around a character, meaning to create an accesskey for it and that it can
 * be used as a shortcut on the UI.
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
 * @param tbody {HTMLElement} The tag where the redirect options are added.
 */
const saveOptions = (tbody) => {
    const inputs = tbody.querySelectorAll('.title-input, .url-input');
    const empty = Array.from(inputs).find(input => !input.value);
    if (empty) {
        showInfo(_('options_js_errorEmptyInput'));
        return;
    }

    const rows = {};
    tbody.querySelectorAll('tr').forEach(tr => {
        const title = tr.querySelector('.title-input').value;
        rows[title] = {
            enabled: tr.querySelector('.enabled-input').checked,
            url: tr.querySelector('.url-input').value,
        };
        const enableURLElement = tr.querySelector('.enable-url-input');
        if (enableURLElement)
            rows[title].enableURL = enableURLElement.value;
    });

    const switchToOpenedTab = document.querySelector('#switch-to-opened-tab');

    chrome.storage.local.set({
        rows: rows,
        'switch-to-opened-tab': switchToOpenedTab.checked,
    }, () => showInfo(_('options_js_settingsSaved')));
};

/**
 * Add a new row to the redirect options table.
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
    if (await common.getBrowser() !== 'chrome') {
        td = document.createElement('td');
        td.className = 'enable-url-column';
        input = document.createElement('input');
        input.type = 'url';
        input.className = 'enable-url-input';
        input.value = enableURL;
        input.title = _('options_js_enableURLTooltip');
        td.appendChild(input);
        tr.appendChild(td);
    }

    // Remove row button cell.
    td = document.createElement('td');
    input = document.createElement('input');
    input.type = 'button';
    input.value = _('options_js_removeRowButton');
    input.addEventListener('click', () => tr.remove());
    td.appendChild(input);
    tr.appendChild(td);

    tbody.appendChild(tr);
};

/**
 * Add all the stored options to the page.
 * @param tbody {HTMLElement} The tag where the redirect options are added.
 * @param options {Object} All the options.
 */
const addItems = (tbody, options) => {
    Object.keys(options.rows).forEach((title) => {
        const row = options.rows[title];
        row['title'] = title;
        addRow(tbody, row);
    });

    document.querySelector('#switch-to-opened-tab').checked =
        options['switch-to-opened-tab'];
};

const tbody = document.getElementsByTagName('tbody')[0];

removeUnsupportedStaticElements();
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
