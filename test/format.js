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
    assert.equal(
        format.replaceFormats(
            'http://localhost/%f',
            'http://www.google.com/#%u'
        ),
        'http://localhost/#%u',
        'Format in url is not replaced'
    );
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

QUnit.test('%r format', (assert) => {
    assert.equal(
        format.replaceFormats(
            'http://localhost/#%r[.]',
            'http://google.com'
        ),
        'http://localhost/#h',
        'Length of one character regex'
    );

    assert.equal(
        format.replaceFormats(
            'http://localhost/#%r[.*]',
            'http://google.com'
        ),
        'http://localhost/#http://google.com',
        'Match all 1'
    );

    assert.equal(
        format.replaceFormats(
            '%r[.*]',
            'http://google.com'
        ),
        'http://google.com',
        'Match all 2'
    );

    assert.equal(
        format.replaceFormats(
            'http://localhost/#%r[(:/{1,2})]',
            'http://google.com'
        ),
        'http://localhost/#://',
        'Capture group'
    );

    assert.equal(
        format.replaceFormats(
            'http://localhost/#%r[(.)(.)(.)$]',
            'http://google.com'
        ),
        'http://localhost/#com',
        'Multiple capture groups'
    );

    assert.equal(
        format.replaceFormats(
            'http://localhost/%r[nomatch]abc',
            'http://google.com'
        ),
        'http://localhost/abc',
        'Non-matching regex is replaced with empty string'
    );

    assert.equal(
        format.replaceFormats(
            'http://localhost/%r[/([a-z\\]+)]',
            'http://google.com'
        ),
        'http://localhost/google',
        'Character class'
    );

    assert.equal(
        format.replaceFormats(
            'https://%r[^https://www.google.[^/\\]+/amp/(.*?)/amp.*]',
            'https://www.google.ie/amp/www.howtogeek.com/282487/how-to-take-photos-at-night/amp/?client=safari'
        ),
        'https://www.howtogeek.com/282487/how-to-take-photos-at-night',
        'Google AMP'
    );

    assert.equal(
        format.replaceFormats(
            'http://localhost/#%r[]+$]',
            'https://en.wikipedia.org/wiki/Main_Page#]'
        ),
        'http://localhost/#%r[]+$]',
        'Non-escaped right bracket'
    );

    assert.equal(
        format.replaceFormats(
            'http://localhost/#%r[]',
            'https://en.wikipedia.org/'
        ),
        'http://localhost/#%r[]',
        'Empty regex is not replaced 1'
    );

    assert.equal(
        format.replaceFormats(
            'http://localhost/#%r[]a',
            'https://en.wikipedia.org/'
        ),
        'http://localhost/#%r[]a',
        'Empty regex is not replaced 2'
    );

    assert.equal(
        format.replaceFormats(
            '%r[.*abc',
            'https://en.wikipedia.org/abc'
        ),
        '%r[.*abc',
        'Format with missing right bracket is not replaced 1'
    );

    assert.equal(
        format.replaceFormats(
            '%r[',
            'https://en.wikipedia.org/'
        ),
        '%r[',
        'Format with missing right bracket is not replaced 2'
    );

    assert.equal(
        format.replaceFormats(
            '%r[\\[]]',
            'https://en.wikipedia.org/#[X'
        ),
        '[]',
        'Format ends to first unescaped right bracket 1'
    );

    assert.equal(
        format.replaceFormats(
            '%r[]]',
            'https://en.wikipedia.org/#]'
        ),
        '%r[]]',
        'Format ends to first unescaped right bracket 2'
    );

    assert.equal(
        format.replaceFormats(
            '%r[[^\\\\]\\]+]',
            'http://localhost/abc]'
        ),
        'http://localhost/abc',
        'Match up to not right bracket'
    );

    assert.throws(() =>
        format.replaceFormats(
            'http://localhost/%r[[]',
            'http://google.com'
        ),
        // What this returns? We match any string. Must use regex.
        /.*/,
        'Invalid regex throws'
    );
});

QUnit.test('%g format', (assert) => {
    assert.equal(
        format.replaceFormats(
            '%g[1]',
            'http://google.com',
            'http://google.(com)',
        ),
        'com',
        'Capture something',
    );

    assert.equal(
        format.replaceFormats(
            '%g[0]',
            'http://google.com',
            'http://google.(com)',
        ),
        'http://google.com',
        '0 returns whole string',
    );

    assert.equal(
        format.replaceFormats(
            '%g[2]-%g[1]',
            'http://google.com',
            'http://(google).(com)',
        ),
        'com-google',
        'Use multiple groups',
    );

    assert.throws(() =>
        format.replaceFormats(
            '%g[2]',
            'http://google.com',
            'http://google.(com)',
        ),
        /^No matching captured group with index 2$/,
        'Invalid capturing group index',
    );

    assert.throws(() =>
        format.replaceFormats(
            '%g[2]',
            'http://google.com',
            'http://google.(net)',
        ),
        /^Enable URL didn't match$/,
        'Doesn\'t match EnableURL',
    );
});
