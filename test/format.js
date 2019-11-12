QUnit.test('No formats used', (assert) => {
    const url = 'http://localhost';
    assert.equal(format.replaceFormats('', url),
        url,
        'Append url to replace url if no formats are used 1');

    const replaceUrl = 'https://www.google.com/';
    assert.equal(format.replaceFormats(replaceUrl, url),
        replaceUrl + url,
        'Append url to replace url if no formats are used 2');
});

QUnit.test('%u format', (assert) => {
    const url = 'https://www.google.com';
    assert.equal(format.replaceFormats('%u', url),
        url,
        '%u alone');

    assert.equal(format.replaceFormats('a%ub', url),
        'a' + url + 'b',
        'Something in left and right');

    assert.equal(format.replaceFormats('a%u', url),
        'a' + url,
        'Something before');

    assert.equal(format.replaceFormats('%ua', url),
        url + 'a',
        'Something after');

    assert.equal(format.replaceFormats('%u%u', url),
        url + url,
        'Two formats');
});

QUnit.test('%p format', (assert) => {
    assert.equal(format.replaceFormats(
        'http://localhost/%p',
        'https://www.youtube.com/'),
        'http://localhost/',
        'Empty path');

    assert.equal(format.replaceFormats(
        'http://localhost/%p',
        'https://en.wikipedia.org/wiki/Main_Page'),
        'http://localhost/wiki/Main_Page',
        'Two path elements');

    assert.equal(format.replaceFormats(
        'http://localhost/#%p[1] %p[0]',
        'https://en.wikipedia.org/wiki/Main_Page'),
        'http://localhost/#Main_Page wiki',
        'Using indices');

    assert.equal(format.replaceFormats(
        'http://localhost/#%p[]',
        'https://en.wikipedia.org/wiki/Main_Page'),
        'http://localhost/#wiki/Main_Page[]',
        'Empty brackets after are ignored');

    assert.equal(format.replaceFormats(
        'http://localhost/#%p[a]',
        'https://en.wikipedia.org/wiki/Main_Page'),
        'http://localhost/#wiki/Main_Page[a]',
        'Brackets with not a number after are ignored');

    assert.throws(() => format.replaceFormats(
        'http://localhost/#%p[2]',
        'https://en.wikipedia.org/wiki/Main_Page'),
        'Index overflow throws');
});

QUnit.test('%q format', (assert) => {
    assert.equal(format.replaceFormats(
        'http://localhost/%q',
        'https://www.youtube.com/watch?v=EYs22diuCTg&t=87'),
        'http://localhost/v=EYs22diuCTg&t=87',
        'Just %q with two parameters');

    assert.equal(format.replaceFormats(
        'http://localhost/%q[t]/%q[v]',
        'https://www.youtube.com/watch?v=EYs22diuCTg&t=87'),
        'http://localhost/87/EYs22diuCTg',
        'Individual keys');

    assert.equal(format.replaceFormats(
        'http://localhost/%q[t]%q[t]%q[t]',
        'https://www.youtube.com/watch?v=EYs22diuCTg&t=87'),
        'http://localhost/878787',
        'Same key replaced multiple times');

    assert.equal(format.replaceFormats(
        'http://localhost/%q',
        'https://www.youtube.com/'),
        'http://localhost/',
        'No parameters');

    assert.equal(format.replaceFormats(
        'http://localhost/%q[]xyz',
        'https://www.youtube.com/watch?v=EYs22diuCTg&t=87'),
        'http://localhost/v=EYs22diuCTg&t=87[]xyz',
        'Empty brackets are ignored');

    assert.throws(() => format.replaceFormats(
        'http://localhost/%q[x]',
        'https://www.youtube.com/search?y=1'),
        'Throws with non-existing key');
});

QUnit.test('%s format', (assert) => {
    assert.equal(format.replaceFormats('%s://localhost/a/b/?x=1&y=2#abc',
        'https://localhost/'),
        'https://localhost/a/b/?x=1&y=2#abc',
        'Only %s format');

    // XXX Add-ons might not support file protocol.
    assert.equal(format.replaceFormats('%s://localhost/%s',
        'file:///home/user'),
        'file://localhost/file',
        'Only %s format');
});

QUnit.test('%f format', (assert) => {
    assert.equal(format.replaceFormats(
        'http://localhost/%f',
        'http://localhost/#abc'),
        'http://localhost/#abc',
        'Only %f format');

    assert.equal(format.replaceFormats(
        'http://localhost/%f',
        'http://localhost/a/q?a=1'),
        'http://localhost/',
        'Without fragment');

    assert.equal(format.replaceFormats(
        'http://localhost/%f#%f',
        'http://localhost/#abc#xyz'),
        'http://localhost/#abc#xyz##abc#xyz',
        'Two formats');
});

QUnit.test('Format in URL bug', (assert) => {
    const url = 'http://www.google.com/#%u';
    assert.equal(format.replaceFormats('http://localhost/%f', url),
        'http://localhost/#%u',
        'Format in url is not replaced');
});

QUnit.test('Some redirections listed on github', (assert) => {
    let id = 'JyA1lBJl_qM';
    assert.equal(format.replaceFormats(
        'https://www.bitchute.com/video/%q[v]/',
        `https://www.youtube.com/watch?v=${id}`),
        `https://www.bitchute.com/video/${id}/`,
        'Bitchute redirection');

    id = 'vE9og17';
    assert.equal(format.replaceFormats(
        'https://i.imgur.com/%p[0].jpg',
        `https://imgur.com/${id}`),
        `https://i.imgur.com/${id}.jpg`,
        'Imgur image redirection');

    assert.equal(format.replaceFormats(
        'https://isitup.org/check.php?domain=%h',
        'https://www.youtube.com/intl/en-GB/yt/dev/'),
        'https://isitup.org/check.php?domain=www.youtube.com',
        'Is it up? redirection');
});
