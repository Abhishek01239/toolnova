(function () {
  'use strict';
  var root = document.getElementById('tool-app');
  if (!root) return;
  function control(id) { return root.querySelector('[data-control="' + id + '"]'); }
  function setOutput(id, value) {
    var el = root.querySelector('[data-output="' + id + '"]');
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

  var KEYWORDS = ['SELECT','FROM','WHERE','AND','OR','ORDER BY','GROUP BY','HAVING','JOIN','LEFT JOIN','RIGHT JOIN','INNER JOIN','ON','INSERT','INTO','VALUES','UPDATE','SET','DELETE','CREATE','TABLE','ALTER','DROP','LIMIT','OFFSET','AS','DISTINCT','COUNT','SUM','AVG','MAX','MIN','UNION','ALL','CASE','WHEN','THEN','ELSE','END','IN','NOT','LIKE','BETWEEN','IS','NULL','ASC','DESC'];

  function formatSql(sql) {
    var s = sql.replace(/\s+/g, ' ').trim();
    KEYWORDS.forEach(function(kw) {
      var re = new RegExp('\\b' + kw.replace(/\s+/g, '\\s+') + '\\b', 'gi');
      s = s.replace(re, kw);
    });
    // Add newlines before major clauses
    s = s.replace(/\b(FROM|WHERE|GROUP BY|ORDER BY|HAVING|LIMIT|UNION|JOIN|LEFT JOIN|RIGHT JOIN|INNER JOIN)\b/gi, '\n$1');
    s = s.replace(/\b(AND|OR)\b/gi, '\n  $1');
    return s.trim();
  }

  function run() {
    var text = control('input').value.trim();
    if (!text) {
      status('Paste some SQL first.', 'error');
      setOutput('output', '');
      return;
    }
    var formatted = formatSql(text);
    setOutput('output', formatted);
    status('✓ SQL formatted.', 'ok');
  }

  onAction('format', run);
  onAction('clear', function() {
    control('input').value = '';
    setOutput('output', '');
    status('');
  });
})();
