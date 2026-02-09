/** @module options */

'use strict';

import * as common from '../common/common.js';

const _ = chrome.i18n.getMessage,
    g_openInContainer = document.querySelector('#open-in-container'),
    g_switchToOpenedTab = document.querySelector('#switch-to-opened-tab'),
    g_openToNewTab = document.querySelector('#open-to-new-tab'),
    g_importButton = document.querySelector('#import-button');
let g_tbody = document.getElementsByTagName('tbody')[0],
    g_draggedRow,
    g_sort = {
        column: null,
        direction: null,
    };

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
 * is an empty string or if titles are same.
 * @function saveOptions
 * @async
 * @param tbody {HTMLElement} The tag where the redirect options are added.
 */
const saveOptions = async (tbody) => {
    const titles = Array.from(tbody.querySelectorAll('.title-input')).map(t => t.value);
    if ((new Set(titles)).size !== titles.length) {
        showInfo(_('options_js_errorSameTitle'));
        return;
    }
    const inputs = Array.from(tbody.querySelectorAll('.url-input')).map(u => u.value).concat(titles);
    const empty = inputs.some(i => !i);
    if (empty) {
        showInfo(_('options_js_errorEmptyInput'));
        return;
    }

    const rows = {};
    tbody.querySelectorAll('tr').forEach((tr, i) => {
        const title = tr.querySelector('.title-input').value;
        const favicon = tr.querySelector('.favicon-button');
        rows[title] = {
            enabled: tr.querySelector('.enabled-input').checked,
            url: tr.querySelector('.url-input').value,
            index: i,
        };
        if (favicon.hasAttribute('data-favicon-16')) {
            rows[title]['favicon'] = {
                '16': favicon.getAttribute('data-favicon-16'),
                '32': favicon.getAttribute('data-favicon-32'),
            };
        }
        const enableURLElement = tr.querySelector('.enable-url-input');
        if (enableURLElement)
            rows[title].enableURL = enableURLElement.value;
        rows[title].redirectAlways = tr.querySelector('.redirect-always-input').checked;
    });

    const opts = {
        rows: rows,
        'switch-to-opened-tab': g_switchToOpenedTab.checked,
    };

    const columnSizes = {};
    document.querySelectorAll("thead tr th").forEach(e => {
        columnSizes[e.getAttribute('id')] = e.offsetWidth;
    });
    opts['column-sizes'] = columnSizes;

    if (await common.isSupportedContainer())
        opts['open-in-container'] = g_openInContainer.checked;
    if (await common.detectBrowser() !== common.FIREFOX_FOR_ANDROID)
        opts['open-to-new-tab'] = g_openToNewTab.checked;

    chrome.storage.local.set(opts, () => showInfo(_('options_js_settingsSaved')));
};

/**
 * Enable or disable Always checkbox.
 * @function enableOrDisableAlwaysCheckbox
 * @param tr {HTMLElement}
 */
const enableOrDisableAlwaysCheckbox = (tr) => {
    const redirectAlwaysInput = tr.querySelector('.redirect-always-input'),
        enableURLInput = tr.querySelector('.enable-url-input');
    redirectAlwaysInput.disabled = !enableURLInput.value;
    if (redirectAlwaysInput.checked && !enableURLInput.value)
        redirectAlwaysInput.checked = false;
};

/** Add favicon to element and its data.
 * @function setFavicon
 * @param elem {HTMLElement} Element where to show the favicon and add dataURI.
 * @param dataURI {String} Data URI of the favicon.
 */
const setFavicon = (elem, dataURI) => {
    elem.style.background = `url(${dataURI}) 0% 0% / contain no-repeat`;
    elem.style.backgroundPosition = 'center';
    elem.setAttribute('data-favicon-32', dataURI);
};

/** Resize favicon, show it and add its data to an element.
 * @function importFavicon
 * @param e {Event} Change event.
 */
const importFavicon = (e) => {
    const reader = new FileReader();
    reader.onload = file => {
        const img = document.createElement('img');
        img.addEventListener('load', () => {
            const favicon16px = common.resizeFavicon(img, 16);
            const favicon32px = common.resizeFavicon(img, 32);
            const label = e.target.parentNode;
            label.setAttribute('data-favicon-16', favicon16px);
            setFavicon(label, favicon32px);
        });
        img.src = file.target.result;
    };
    reader.readAsDataURL(e.target.files[0]);
};

/**
 * Add a new row to the redirect options table.
 * @function addRow
 * @async
 * @param tbody {HTMLElement} The tag where the redirect options are added.
 * @param row {Object} A redirect option.
 */
const addRow = async (tbody, row) => {
    let checked, title, url, enableURL, redirectAlways, favicon;
    checked = title = url = enableURL = redirectAlways = favicon = '';

    if (row) {
        checked = row.enabled ? 'checked' : '';
        title = row.title;
        url = row.url;
        enableURL = row.enableURL || '';
        redirectAlways = row.redirectAlways ? 'checked' : '';
        favicon = row.favicon || '';
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

    // Favicon cell.
    td = document.createElement('td');
    td.className = 'center';
    const label = document.createElement('label');
    label.classList.add('favicon-button');
    if (favicon) {
        setFavicon(label, favicon['32']);
        label.setAttribute('data-favicon-16', favicon['16']);
    }
    input = document.createElement('input');
    input.type = 'file';
    input.classList.add('hidden');
    input.addEventListener('change', importFavicon);
    label.appendChild(input);
    td.appendChild(label);
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
    input.addEventListener('input', () => enableOrDisableAlwaysCheckbox(tr));
    td.appendChild(input);
    tr.appendChild(td);

    td = document.createElement('td');
    td.className = 'redirect-always-column';
    input = document.createElement('input');
    input.type = 'checkbox';
    input.className = 'redirect-always-input';
    input.checked = redirectAlways;
    input.disabled = !enableURL;
    input.title = _('options_js_redirectAlwaysTooltip');
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
    if ('column-sizes' in options) {
        for (const [id, size] of Object.entries(options['column-sizes'])) {
            document.querySelector(`#${id}`).style.width = `${size}px`;
        }
    }
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
    if (!e.target.classList?.contains('redirect-row'))
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

/**
 * Sort redirects by some of the redirect attributes.
 * @function sort
 * @param _event {Object} Click event.
 */
const sort = (_event) => {
    /* TODO Remove the object and make this simpler. Need to change the selectors elsewhere to
     * make it possible to select the correct input.
     */
    const sortableHeaders = {
        enabled: {
            selector: '.enabled-input',
            value: e => e.checked,
        },
        favicon: {
            selector: '.favicon-button',
            value: e => e.getAttribute('data-favicon-16') || '',
        },
        title: {
            selector: '.title-input',
            value: e => e.value,
        },
        url: {
            selector: '.url-input',
            value: e => e.value,
        },
        'enable-url': {
            selector: '.enable-url-input',
            value: e => e.value,
        },
        always: {
            selector: '.redirect-always-input',
            value: e => e.checked,
        },
    };
    const classes = Object.keys(sortableHeaders);
    const _class = _event.target.className;
    if (!(classes.includes(_class)))
        return;

    let direction = (g_sort.column === _class && g_sort.direction) || 'ascending';
    const sortedRows = Array.from(g_tbody.querySelectorAll('tr')).sort((a, b) => {
        const aElement = a.querySelector(sortableHeaders[_class].selector);
        const bElement = b.querySelector(sortableHeaders[_class].selector);
        const aValue = sortableHeaders[_class].value(aElement).toString();
        const bValue = sortableHeaders[_class].value(bElement).toString();

        return direction === 'ascending' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
    });
    g_tbody.replaceChildren(...sortedRows);

    g_sort.column = _class;
    g_sort.direction = direction === 'ascending' ? 'descending' : 'ascending';
};

/** Resize columns of the table. Found from https://jsfiddle.net/thrilleratplay/epcybL4v/.
 */
const resizeColumns = () => {
    let thElm, startOffset;

    const ths = document.querySelectorAll("thead tr th, tfoot tr th");
    Array.prototype.forEach.call(ths, (th) => {
        th.style.position = 'relative';

        const grip = document.createElement('div');
        grip.innerHTML = "&nbsp;";
        grip.style.top = 0;
        grip.style.right = 0;
        grip.style.bottom = 0;
        grip.style.width = '20px';
        grip.style.position = 'absolute';
        grip.style.cursor = 'col-resize';
        grip.addEventListener('mousedown', (e) => {
            thElm = th;
            startOffset = th.offsetWidth - e.pageX;
        });

        th.appendChild(grip);
    });

    const findOtherTh = (th) => {
        const _class = th.className;
        if (th.parentNode.parentNode.nodeName === 'THEAD')
            return document.querySelector(`tfoot tr th.${_class}`);
        else if (th.parentNode.parentNode.nodeName === 'TFOOT')
            return document.querySelector(`thead tr th.${_class}`);
        else
            return;
    };

    document.addEventListener('mousemove', (e) => {
        if (thElm) {
            const otherTh = findOtherTh(thElm);
            if (!otherTh)
                return;
            const width = startOffset + e.pageX + 'px';
            thElm.style.width = width;
            otherTh.style.width = width;
        }
    });

    document.addEventListener('mouseup', () => {
        thElm = undefined;
    });
};

(async () => await removeUnsupportedStaticElements())();
common.localize();
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
document.querySelectorAll('.header-row').forEach(e => {
    e.addEventListener('click', sort);
});
document.addEventListener('DOMContentLoaded', resizeColumns);
