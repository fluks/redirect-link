## Description

A browser extension for redirecting links to somewhere else. If you don't want
to support some site for some reason, you can view the page's content in
Google's WebCache. Or if the site is small and doesn't have a lot of resources
and it could go down, when a lot of people visit the site, you can easily open
the link in Internet Archive's Wayback Machine. archive.is is also provided
from start and you can add more.

## Install

[Firefox Add-ons](https://addons.mozilla.org/en-US/firefox/addon/redirect-link/)

[Chrome Web Store](https://chrome.google.com/webstore/detail/redirect-link/jlmiipndkcgobnpmcdhinopedkkejkek)

## Usage

You can redirect links and the current page. Current page can be redirected by
clicking the right mouse button on the page, not on any kind of media or other
elements, but basically the background.

## Options

The URL field denotes where the page or the link is redirected to. It must start
with a scheme, e.g. https://. It can contain formats, which are replaced by the
component parts of the link's or page's URL. If the URL doesn't contain any
formats, the link's or page's URL is appended to this URL.

### Formats

* %u - entire URL
* %s - scheme
* %h - hostname
* %p - whole path without the leading slash, or %p[N], where N is index of the
* path part. e.g. in http://example.com/a/b/c?param=1, %p[0] is a, %p[1] is b and
%p[2] is c
* %q - all query parameters, or %q[KEY], where KEY is the name of the query
parameter. e.g. in http://example.com/?a=1&b=2, %q[a] is 1 and %q[b] is 2
* %f - fragment

There are examples in the other screenshot.

To enable a redirection everywhere, leave Enable URL field empty. If you want to
enable it only on certain URLs, add the URL or part of it and you can use a
regular expression also.  This feature works only on versions 63 and newer.

Remember to save if you changed options!

More redirections and you can propose or share new redirections at GitHub in this issue:
https://github.com/fluks/redirect-link/issues/7

## Permissions

* Access your data for all websites - Needed for disabling redirections on
  certain URLs.
* Access browser tabs - Get the URL of the current page.

## Screenshots

![Menu](screenshot_menu.png)
![Options](screenshot_options.png)

## License

Everything else is licensed as GPL3, but the images are licensed as
GFDL 1.2/CC-by-sa-2.5/CC-by-sa-3.0. The author of the original
image is Stephan Baum. The image was found on [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Disambiguation.svg).
