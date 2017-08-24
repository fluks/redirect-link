'use strict';

const _ = chrome.i18n.getMessage;

/**
 */
const localize = () => {
    document.querySelectorAll('[data-i18n]').forEach(e => {
        e.textContent = _(e.dataset.i18n);
    });
};

/**
 * @param text {String}
 */
const showInfo = (text) => {
    const info = document.querySelector('#info-text');
    info.textContent = text;
    const hidden = 'hidden';
    info.classList.remove(hidden);
    setTimeout(() => info.classList.add(hidden), 3000);
};

/**
 * @param tbody {}
 */
const saveOptions = (tbody) => {
    const inputs = tbody.querySelectorAll('.title-input, url-input');
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
    });
    chrome.storage.local.clear(() => {
        chrome.storage.local.set(rows, () =>
            showInfo(_('options_js_settingsSaved')));
    });
};

/**
 * @param tbody {}
 * @param row {}
 */
const addRow = (tbody, row) => {
    let checked, title, url;
    checked = title = url = '';

    if (row) {
        checked = row.enabled ? 'checked' : '';
        title = row.title;
        url = row.url;
    }

    const urlHelp = _('options_js_urlHelpTooltip');
    const columns =
        `<td class="center">
           <input class="enabled-input" type="checkbox" ${checked}/>
         </td>
         <td class="title-column">
           <input class="title-input" type="text" value="" size="15" required/>
         </td>
         <td class="url-column">
           <input class="url-input" type="url" value="" title="${urlHelp}" required/>
         </td>
         <td>
           <input type="button" value="${_('options_js_removeRowButton')}"/>
         </td>
         `;
    const tr = document.createElement('tr');
    // Should be safe innerHTML.
    tr.innerHTML = columns;
    tr.querySelector('.title-input').setAttribute('value', title);
    tr.querySelector('.url-input').setAttribute('value', url);
    tr.querySelector('input[type=button]').addEventListener(
        'click', () => tr.remove());
    tbody.appendChild(tr);
};

/**
 * Add all the item rows into the table.
 * @param tbody {}
 * @param rows {}
 */
const addItems = (tbody, rows) => {
    Object.keys(rows).forEach((title) => {
        const row = rows[title];
        row['title'] = title;
        addRow(tbody, row);
    });
};

const tbody = document.getElementsByTagName('tbody')[0];

localize();
chrome.storage.local.get(null, (rows) => addItems(tbody, rows));
document.querySelector('#add-row-button').addEventListener(
    'click', () => addRow(tbody));
document.querySelector('#save-button').addEventListener(
    'click', () => saveOptions(tbody));
