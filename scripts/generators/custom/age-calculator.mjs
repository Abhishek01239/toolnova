import { frame } from '../../../lib/factories/helpers.mjs';
import { parseISODate, daysBetween, computeAge, weekdayOf, nextBirthday, zodiacSign } from '../../../lib/fns/age.mjs';

export default function generate(catalogItem, ctx) {
  const entry = {
    id: 'age-calculator',
    title: 'Age Calculator',
    h1: 'Age Calculator — exact age in years, months & days',
    seoTitle: 'Age Calculator — Exact Age in Years, Months, Days | ToolNova',
    description:
      'Calculate your exact age in years, months and days — plus total days lived, day of birth, zodiac sign and countdown to your next birthday. Free.',
    intro:
      'Find your exact age down to the day: years, months and days, plus your total time on Earth in weeks, days and hours, the weekday you were born, your zodiac sign and a live countdown to your next birthday.',
    category: 'Date & Time',
    keywords: ['age calculator', 'how old am i', 'date of birth calculator', 'age in days', 'birthday calculator', 'exact age'],
    popularity: 85,
    ui: {
      layout: 'single',
      controls: [
        { type: 'date', id: 'dob', label: 'Date of birth', value: '1995-06-15' },
        { type: 'date', id: 'on', label: 'Age at the date of', value: ctx.today, help: 'Defaults to today — change it to calculate your age on any past or future date.' }
      ],
      actions: [],
      outputs: [
        { type: 'text', id: 'headline', label: 'Exact age' },
        { type: 'stats', id: 'breakdown', label: 'Your time on Earth' }
      ]
    },
    howItWorks: [
      'Enter your date of birth; the second date defaults to today but can be any date you like.',
      'The calendar math borrows days from the correct month and accounts for leap years automatically.',
      'The breakdown shows your age in total months, weeks, days, hours and minutes.',
      'You also get the weekday you were born, your zodiac sign and how many days remain until your next birthday.',
      'All calculations run in your browser — birth dates are never sent anywhere.'
    ],
    examples: [
      'Born 1995-06-15 and checking on 2026-07-31 → 31 years, 1 month and 16 days old.',
      'Born on a leap day (1996-02-29)? Your birthday falls on February 28 in non-leap years.',
      'Set the second date to your next New Year to see exactly how old you will be.'
    ],
    faq: [
      {
        q: 'How is the exact age calculated?',
        a: 'The tool counts whole years, then whole months, then remaining days, borrowing days from the correct calendar month when needed. Leap years and month lengths are handled automatically, so the result matches a calendar count done by hand.'
      },
      {
        q: 'Can I calculate age on a past or future date?',
        a: 'Yes — change the “Age at the date of” field to any date. This is handy for form deadlines (“age as of 1 January 2027”), historical figures or planning future milestones.'
      },
      {
        q: 'What happens if I was born on February 29?',
        a: 'Your age calculation works normally. For the birthday countdown, your birthday is celebrated on February 28 in years that are not leap years — the common legal convention in most countries.'
      },
      {
        q: 'How accurate is “total hours” for old dates?',
        a: 'Hours and minutes assume midnight birth time, so they are exact in multiples of whole days — 24 hours and 1,440 minutes per day lived — which is the standard convention for age counters.'
      }
    ]
  };

  const js = frame(`  ${parseISODate.toString()}
  ${daysBetween.toString()}
  ${computeAge.toString()}
  ${weekdayOf.toString()}
  ${nextBirthday.toString()}
  ${zodiacSign.toString()}

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
  render();`);

  return { entry, js };
}
