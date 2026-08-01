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
  function readControls(defs) {
    var vals = {};
    defs.forEach(function (d) {
      var el = control(d.id);
      if (!el) { vals[d.id] = d.value; return; }
      if (d.type === 'checkbox') vals[d.id] = el.checked;
      else if (d.type === 'number' || d.type === 'range') vals[d.id] = parseFloat(el.value) || 0;
      else vals[d.id] = el.value;
    });
    return vals;
  }

  function parseISODate(iso) {
  var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(iso));
  if (!m) return null;
  var y = Number(m[1]);
  var mo = Number(m[2]);
  var d = Number(m[3]);
  if (mo < 1 || mo > 12 || d < 1 || d > 31) return null;
  if (d > new Date(Date.UTC(y, mo, 0)).getUTCDate()) return null;
  return { y: y, m: mo, d: d };
}
  function daysBetween(aIso, bIso) {
  var a = parseISODate(aIso);
  var b = parseISODate(bIso);
  if (!a || !b) return null;
  return Math.round((Date.UTC(b.y, b.m - 1, b.d) - Date.UTC(a.y, a.m - 1, a.d)) / 86400000);
}
  function computeAge(dobIso, onIso) {
  var dob = parseISODate(dobIso);
  var on = parseISODate(onIso);
  if (!dob || !on) return null;
  var totalDays = daysBetween(dobIso, onIso);
  if (totalDays === null || totalDays < 0) return null;

  var years = on.y - dob.y;
  var months = on.m - dob.m;
  var days = on.d - dob.d;
  if (days < 0) {
    months -= 1;
    var pm = on.m === 1 ? 12 : on.m - 1;
    var py = on.m === 1 ? on.y - 1 : on.y;
    days += new Date(Date.UTC(py, pm, 0)).getUTCDate();
  }
  if (months < 0) {
    years -= 1;
    months += 12;
  }
  return { years: years, months: months, days: days, totalDays: totalDays };
}
  function weekdayOf(iso) {
  var names = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  var p = parseISODate(iso);
  if (!p) return null;
  return names[new Date(Date.UTC(p.y, p.m - 1, p.d)).getUTCDay()];
}
  function nextBirthday(dobIso, onIso) {
  var dob = parseISODate(dobIso);
  var on = parseISODate(onIso);
  if (!dob || !on) return null;
  function birthdayIn(year) {
    var d = dob.d;
    if (dob.m === 2 && d === 29 && !((year % 4 === 0 && year % 100 !== 0) || year % 400 === 0)) d = 28;
    return year + '-' + String(dob.m).padStart(2, '0') + '-' + String(d).padStart(2, '0');
  }
  var cand = birthdayIn(on.y);
  var diff = daysBetween(onIso, cand);
  if (diff < 0) {
    cand = birthdayIn(on.y + 1);
    diff = daysBetween(onIso, cand);
  }
  return { dateIso: cand, daysLeft: diff };
}
  function zodiacSign(month, day) {
  var v = month * 100 + day;
  if (v >= 321 && v <= 419) return 'Aries';
  if (v >= 420 && v <= 520) return 'Taurus';
  if (v >= 521 && v <= 620) return 'Gemini';
  if (v >= 621 && v <= 722) return 'Cancer';
  if (v >= 723 && v <= 822) return 'Leo';
  if (v >= 823 && v <= 922) return 'Virgo';
  if (v >= 923 && v <= 1022) return 'Libra';
  if (v >= 1023 && v <= 1121) return 'Scorpio';
  if (v >= 1122 && v <= 1221) return 'Sagittarius';
  if (v >= 1222 || v <= 119) return 'Capricorn';
  if (v >= 120 && v <= 218) return 'Aquarius';
  return 'Pisces';
}

  function isoToday() {
    var d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }

  function render() {
    var dob = control('dob').value;
    var on = control('on').value || isoToday();
    if (!dob) {
      setOutput('headline', '');
      setStats('breakdown', []);
      status('Enter your date of birth above.', '');
      return;
    }
    var age = computeAge(dob, on);
    if (!age) {
      setOutput('headline', '');
      setStats('breakdown', []);
      status('Check the dates — date of birth must be a valid date not after the target date.', 'error');
      return;
    }
    var dobP = parseISODate(dob);
    var nb = nextBirthday(dob, on);
    var weeks = Math.floor(age.totalDays / 7);
    setOutput('headline', age.years + ' years, ' + age.months + ' months, ' + age.days + ' days');
    setStats('breakdown', [
      ['Total months', (age.years * 12 + age.months).toLocaleString('en-US')],
      ['Total weeks', weeks.toLocaleString('en-US')],
      ['Total days', age.totalDays.toLocaleString('en-US')],
      ['Total hours', (age.totalDays * 24).toLocaleString('en-US')],
      ['Total minutes', (age.totalDays * 1440).toLocaleString('en-US')],
      ['Born on a', weekdayOf(dob)],
      ['Zodiac sign', zodiacSign(dobP.m, dobP.d)],
      ['Next birthday', nb.daysLeft === 0 ? 'Today! 🎉' : 'in ' + nb.daysLeft + ' days']
    ]);
    status('Exact age as of ' + on + '.', 'ok');
  }

  ['dob', 'on'].forEach(function (id) {
    var el = control(id);
    el.addEventListener('input', render);
    el.addEventListener('change', render);
  });
  render();
})();
