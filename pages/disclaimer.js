import { esc, escAttr } from '../lib/html.js';
import { buildHead, breadcrumbLD } from '../lib/seo.js';
import { breadcrumbs } from '../components/breadcrumbs.js';

export default function disclaimer({ site }) {
  const path = '/disclaimer';
  const crumbs = [{ name: 'Home', path: '/' }, { name: 'Disclaimer' }];
  const head = buildHead({
    site,
    title: `Disclaimer — ${site.name}`,
    description: `Important limitations of the free tools and information provided by ${site.name}, including financial, health, legal and security-related tools.`,
    path,
    jsonLd: [breadcrumbLD(site, crumbs)]
  });

  const body = `${breadcrumbs(crumbs)}
<article class="prose">
  <h1>Disclaimer</h1>
  <p class="muted">Last updated: 2026-11-03</p>

  <p>The tools and information on ${esc(site.name)} are provided for general informational and productivity purposes. They are not professional advice and should not be used as the sole basis for a decision that could affect your health, finances, safety, legal rights or security.</p>

  <h2>Accuracy</h2>
  <p>We aim for correct calculations and useful explanations, but results can be affected by input errors, rounding, browser behaviour, changing rules or bugs. Always check important results independently. See our <a href="/terms">Terms of Use</a> for the limitations of liability that apply.</p>

  <h2>Financial tools</h2>
  <p>Calculators such as EMI, mortgage, SIP, compound interest, salary and tax-related tools use simplified mathematical models. They do not account for every fee, tax rule, jurisdiction or lender-specific condition. They are not financial advice and do not create a professional relationship.</p>

  <h2>Health and fitness tools</h2>
  <p>BMI, TDEE and sleep-cycle calculators provide estimates based on general formulas. They are not medical devices and are not a substitute for advice from a qualified healthcare professional.</p>

  <h2>Security and developer tools</h2>
  <p>Hash, password, JWT, regex and similar tools are conveniences. A strong password generator cannot protect an account on its own, and decoding a token does not verify that it is trustworthy. Never paste production secrets, private keys or sensitive credentials into any website, including this one.</p>

  <h2>External links and advertising</h2>
  <p>Links to third-party sites and advertisements are provided for convenience. We do not control and are not responsible for third-party content, products, services or privacy practices. Advertising does not constitute an endorsement.</p>

  <h2>No warranty</h2>
  <p>The site and tools are provided “as is” and “as available”, without warranties of any kind, to the extent permitted by law.</p>

  <h2>Contact</h2>
  <p>If you believe a result or explanation is wrong, please email <a href="mailto:${escAttr(site.contactEmail)}">${esc(site.contactEmail)}</a> or <a href="/contact">contact us</a> so it can be reviewed and corrected.</p>
</article>`;

  return { path, head, body };
}
