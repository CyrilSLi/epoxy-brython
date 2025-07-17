# epoxy-polyfill

This package provides polyfills for XHR, fetch, and the Brython AJAX interface using epoxy-tls.
It allows making web requests using these APIs without CORS restrictions using a [Wisp](https://github.com/MercuryWorkshop/wisp-protocol) proxy,
which keeps your data encrypted unlike HTTP proxies.

[npm](https://www.npmjs.com/package/epoxy-polyfill)&nbsp;&nbsp;&nbsp;[jsDelivr](https://www.jsdelivr.com/package/npm/epoxy-polyfill)

## Demos

- [demo/index.html](demo/index.html): A demo of each of the APIs in action.
- [demo/frametest.html](demo/frametest.html): An experiment which loads websites into a same-origin iframe, fetching page content using epoxt-tls.

## Contents

This package contains four scripts:
- `javascript.min.js` - For `XMLHttpRequest` and `fetch` in JavaScript
- `brython.min.js` - For the `ajax` module in Brython
- `javascript-bundled.min.js` - Javascript version bundled with `epoxy-tls`
- `brython-bundled.min.js` - Brython version bundled with `epoxy-tls`

It is strongly recommended to **not use the bundled versions** unless a single script file is required,
as the base64 encoded bundle is around 500KB larger than dynamically loading the `epoxy-tls` library.

## Installation / Usage

The scripts are designed to be included with `<script>` tags in an HTML file and require no additional configuration:

```html
<script src="https://cdn.jsdelivr.net/npm/epoxy-polyfill@1/dist/javascript.min.js"></script>
```

If using the Brython versions (`brython.min.js` or `brython-bundled.min.js`), place this script **after all Brython scripts**, for example:

```html
<script src="https://cdn.jsdelivr.net/npm/brython@3/brython.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/brython@3/brython_stdlib.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/epoxy-polyfill@1/dist/brython.min.js"></script>
```

Including **both unbundled** or **both bundled** script versions is supported and they will share a single `epoxy-tls` instance.
Mixing bundled and unbundled versions is untested and may lead to unexpected behavior.

## Todo

- Allow configuring the `epoxy-tls` instance (e.g. proxy URL, the `EpoxyClientOptions` object)

## License

The scripts make extensive usage of AGPL code, so the entire package is licensed under AGPLv3.