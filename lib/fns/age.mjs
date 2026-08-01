// Pure date/age helpers — self-contained and serialization-safe.

export function parseISODate(iso) {
  var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(iso));
  if (!m) return null;
  var y = Number(m[1]);
  var mo = Number(m[2]);
  var d = Number(m[3]);
  if (mo < 1 || mo > 12 || d < 1 || d > 31) return null;
  if (d > new Date(Date.UTC(y, mo, 0)).getUTCDate()) return null;
  return { y: y, m: mo, d: d };
}

export function isLeapYear(y) {
  return (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
}

export function daysBetween(aIso, bIso) {
  var a = parseISODate(aIso);
  var b = parseISODate(bIso);
  if (!a || !b) return null;
  return Math.round((Date.UTC(b.y, b.m - 1, b.d) - Date.UTC(a.y, a.m - 1, a.d)) / 86400000);
}

export function computeAge(dobIso, onIso) {
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

export function weekdayOf(iso) {
  var names = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  var p = parseISODate(iso);
  if (!p) return null;
  return names[new Date(Date.UTC(p.y, p.m - 1, p.d)).getUTCDay()];
}

export function nextBirthday(dobIso, onIso) {
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

export function zodiacSign(month, day) {
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
