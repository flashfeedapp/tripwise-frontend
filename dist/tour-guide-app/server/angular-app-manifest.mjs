
export default {
  bootstrap: () => import('./main.server.mjs').then(m => m.default),
  inlineCriticalCss: true,
  baseHref: '/',
  locale: undefined,
  routes: [
  {
    "renderMode": 1,
    "preload": [
      "chunk-MIPI6R7H.js",
      "chunk-OKK7HQVI.js"
    ],
    "route": "/"
  },
  {
    "renderMode": 1,
    "preload": [
      "chunk-IZJOUL3W.js",
      "chunk-AK63VVPC.js",
      "chunk-RGWXOFZ4.js",
      "chunk-OKK7HQVI.js"
    ],
    "route": "/destinations/*"
  },
  {
    "renderMode": 1,
    "preload": [
      "chunk-CS2ZDEVX.js",
      "chunk-AK63VVPC.js",
      "chunk-BRFWAA3O.js",
      "chunk-RGWXOFZ4.js",
      "chunk-OKK7HQVI.js"
    ],
    "route": "/destinations/*/plans"
  },
  {
    "renderMode": 1,
    "preload": [
      "chunk-DJCT633W.js",
      "chunk-BRFWAA3O.js",
      "chunk-RGWXOFZ4.js",
      "chunk-OKK7HQVI.js"
    ],
    "route": "/trips/compare"
  },
  {
    "renderMode": 1,
    "redirectTo": "/",
    "route": "/**"
  }
],
  entryPointToBrowserMapping: undefined,
  assets: {
    'index.csr.html': {size: 1125, hash: '798c619b8c5e10d43281bf92ab83a086fc65e332e3b2419931758b79d6827697', text: () => import('./assets-chunks/index_csr_html.mjs').then(m => m.default)},
    'index.server.html': {size: 1137, hash: '22ccfd053af6a912e0fff8e310c5803ca2fb68015a9232a96f45cb2486f9e12a', text: () => import('./assets-chunks/index_server_html.mjs').then(m => m.default)},
    'styles-A6F4ZL65.css': {size: 81955, hash: 'vryENFd/Sws', text: () => import('./assets-chunks/styles-A6F4ZL65_css.mjs').then(m => m.default)}
  },
};
