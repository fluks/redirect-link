#!/usr/bin/env python

import json
import sys
import locale

def main():
    ''' '''
    _file = sys.argv[1]
    with open(_file, 'r') as fp:
        settings = json.load(fp)
    print('|Name|URL|Enable URL|\n|:---:|:---:|:---:|')
    for k in sorted(settings['rows'], key=lambda name: locale.strxfrm(name).lower()):
        enable_url = settings['rows'][k]['enableURL']
        if (enable_url == ''):
            enable_url = '-'
        url = settings['rows'][k]['url'].replace('|', '\|')
        enable_url = enable_url.replace('|', '\|')
        print('|{}|{}|{}|'.format(k, url, enable_url))


if __name__ == '__main__':
    main()
