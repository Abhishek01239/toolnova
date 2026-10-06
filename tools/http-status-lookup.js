(function () {
  'use strict';
  var root = document.getElementById('tool-app');
  if (!root) return;
  function control(id) { return root.querySelector('[data-control="' + id + '"]'); }
  function outputEl(id) { return root.querySelector('[data-output="' + id + '"]'); }
  function setOutput(id, value) {
    var el = outputEl(id);
    if (!el) return;
    if ('value' in el) { el.value = value; } else { el.textContent = value; }
  }
  function onAction(id, fn) {
    var btn = root.querySelector('[data-action="' + id + '"]');
    if (btn) btn.addEventListener('click', function () { fn(btn); });
  }
  function status(msg, kind) {
    var el = root.querySelector('[data-status]');
    if (!el) return;
    el.textContent = msg || '';
    el.className = 'status' + (kind ? ' ' + kind : '');
  }
  function setStats(id, entries) {
    var el = outputEl(id);
    if (!el) return;
    el.innerHTML = '';
    entries.forEach(function (pair) {
      var wrap = document.createElement('div');
      wrap.className = 'stat';
      var dt = document.createElement('dt');
      dt.textContent = pair[0];
      var dd = document.createElement('dd');
      dd.textContent = pair[1];
      wrap.appendChild(dt);
      wrap.appendChild(dd);
      el.appendChild(wrap);
    });
  }

  var CODES = {
    100: ['Continue', 'The server received the request headers and the client may send the body.'],
    200: ['OK', 'The request succeeded. The meaning of the body depends on the method.'],
    201: ['Created', 'The request created a resource. A Location header often points to it.'],
    204: ['No Content', 'Success with an intentionally empty body, common after deletes.'],
    301: ['Moved Permanently', 'The resource has a new URL that clients may cache.'],
    302: ['Found', 'A temporary redirect. Clients should keep using the original URL later.'],
    304: ['Not Modified', 'A cached copy is still valid, so the body is omitted.'],
    400: ['Bad Request', 'The server could not understand the request syntax or fields.'],
    401: ['Unauthorized', 'Authentication is missing or was rejected.'],
    403: ['Forbidden', 'The server understood the request but refuses to authorize it.'],
    404: ['Not Found', 'No resource matches the URL, or it is hidden from this client.'],
    405: ['Method Not Allowed', 'The URL exists but does not support this HTTP method.'],
    408: ['Request Timeout', 'The server timed out waiting for the rest of the request.'],
    409: ['Conflict', 'The request clashes with the current state of the resource.'],
    410: ['Gone', 'The resource existed before and is intentionally no longer available.'],
    413: ['Content Too Large', 'The request body exceeds a limit set by the server.'],
    415: ['Unsupported Media Type', 'The Content-Type is not accepted for this endpoint.'],
    422: ['Unprocessable Content', 'The body was parsed but failed validation rules.'],
    429: ['Too Many Requests', 'The client sent requests faster than the rate limit allows.'],
    500: ['Internal Server Error', 'The server hit an unexpected error while handling the request.'],
    502: ['Bad Gateway', 'A proxy received an invalid response from the upstream server.'],
    503: ['Service Unavailable', 'The server is temporarily unable to handle the request.'],
    504: ['Gateway Timeout', 'A proxy timed out waiting for the upstream server.']
  };
  var CLASSES = {
    1: 'Informational',
    2: 'Successful',
    3: 'Redirection',
    4: 'Client error',
    5: 'Server error'
  };

  function lookup() {
    var code = parseInt(control('code').value, 10);
    if (!code || code < 100 || code > 599) { status('Enter a code from 100 to 599.', 'err'); return; }
    var cls = CLASSES[Math.floor(code / 100)] || 'Unknown';
    var known = CODES[code];
    var name = known ? known[0] : 'Unlisted code';
    var note = known ? known[1] : 'This code is not in the built-in list. The class still comes from the first digit.';
    setOutput('result', code + ' ' + name + '\n' + note);
    setStats('summary', [
      ['Code', String(code)],
      ['Name', name],
      ['Class', cls]
    ]);
    status(known ? 'Found a known status code.' : 'Class only — code is not in the short list.', 'ok');
  }
  onAction('lookup', lookup);
  lookup();
})();
