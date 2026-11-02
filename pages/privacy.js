import { esc, escAttr } from '../lib/html.js';
import { buildHead, breadcrumbLD } from '../lib/seo.js';
import { breadcrumbs } from '../components/breadcrumbs.js';

export default function privacy({ site }) {
  const path = '/privacy';
  const crumbs = [{ name: 'Home', path: '/' }, { name: 'Privacy' }];
  const head = buildHead({
    site,
    title: `Privacy Policy — ${site.name}`,
    description: `How ${site.name} handles tool input, technical data, cookies and Google AdSense advertising, and the privacy rights available to you.`,
    path,
    jsonLd: [breadcrumbLD(site, crumbs)]
  });

  const body = `${breadcrumbs(crumbs)}
<article class="prose">
  <h1>Privacy Policy</h1>
  <p class="muted">Last updated: 2026-11-03</p>

  <p>This policy explains what ${esc(site.name)} (“we”, “us”) processes when you use this website, why, and what choices you have. It applies to every page on this site.</p>

  <h2>In short</h2>
  <ul>
    <li>Tools marked “runs in your browser” process your input on your device; we do not receive it.</li>
    <li>We do not require an account, and we do not operate a newsletter or contact database.</li>
    <li>We use Google AdSense to fund the site. Advertising cookies are off until you consent.</li>
    <li>Our host and font provider process limited technical data such as your IP address to deliver pages.</li>
  </ul>

  <h2>Information you enter into tools</h2>
  <p>Most tools on ${esc(site.name)} are static browser utilities. Text, numbers, dates and files you enter are processed in your browser and are not transmitted to us. Some file tools (for example image converters or PDF tools) read files locally using browser APIs. A small number of tools download an open-source library or model from a third-party CDN; the tool page identifies that dependency. In those cases the library request reveals your IP address and user agent to the CDN, but your input is still processed locally.</p>
  <p>Please do not enter passwords, private keys, confidential documents or other secrets into any web tool, including ours.</p>

  <h2>Local storage</h2>
  <p>We store a small number of preferences in your browser using <code>localStorage</code>: your theme choice and your cookie consent choice. These are not sent to us. You can clear them at any time in your browser settings. See the <a href="/cookies">Cookie Policy</a> for details.</p>

  <h2>Hosting and technical data</h2>
  <p>The site is hosted on Vercel. Like most hosting providers, Vercel processes technical request data — such as IP address, requested URL, referrer, browser user agent, timestamps and diagnostic logs — to deliver content, prevent abuse and maintain reliability. We do not combine this with tool input, and we do not use it to identify individual visitors. Vercel's handling is described in the <a href="https://vercel.com/legal/privacy-policy" rel="noopener noreferrer">Vercel privacy policy</a>.</p>

  <h2>Fonts and third-party assets</h2>
  <p>Pages load web fonts from Google Fonts, which means Google receives your IP address and user agent when the font files are requested. Some tools load open-source JavaScript libraries from public CDNs such as jsDelivr or cdnjs; those CDNs also receive the technical request data needed to serve the file.</p>

  <h2>Advertising and Google AdSense</h2>
  <p>${esc(site.name)} uses Google AdSense to display advertising. Google and its advertising partners may process cookie identifiers, device information, approximate location derived from IP address, and information about pages visited in order to serve, cap, measure and — where you have consented — personalise ads.</p>
  <ul>
    <li>Advertising storage and personalisation are <strong>denied by default</strong>. They are enabled only after you choose “Accept all” or turn on the relevant controls in the consent panel.</li>
    <li>You can change or withdraw your choice at any time through “Cookie settings” in the footer.</li>
    <li>Google's use of advertising data is described at <a href="https://policies.google.com/technologies/partner-sites" rel="noopener noreferrer">How Google uses data from sites that use its services</a>.</li>
    <li>You can control ad personalisation at <a href="https://adssettings.google.com" rel="noopener noreferrer">Google Ads Settings</a>, or opt out of participating vendors at <a href="https://www.aboutads.info/choices/" rel="noopener noreferrer">aboutads.info</a> (US) and <a href="https://www.youronlinechoices.eu/" rel="noopener noreferrer">Your Online Choices</a> (Europe).</li>
    <li>We do not sell personal information for money, and we do not share tool input with advertisers.</li>
  </ul>
  <p>For a full list of the storage entries involved, see the <a href="/cookies">Cookie Policy</a>.</p>

  <h2>Legal bases (EEA, UK and Switzerland)</h2>
  <p>Where the GDPR or UK GDPR applies, we rely on:</p>
  <ul>
    <li><strong>Consent</strong> for advertising cookies, ad personalisation and any optional analytics storage. You may withdraw consent at any time.</li>
    <li><strong>Legitimate interests</strong> in delivering a secure, functional website, preventing abuse and understanding aggregate site performance, balanced against your rights.</li>
    <li><strong>Legal obligation</strong> where we must retain or disclose information to comply with applicable law.</li>
  </ul>

  <h2>Your rights</h2>
  <p>Depending on where you live, you may have the right to access, correct, delete, restrict or object to processing of your personal data, to data portability, and to withdraw consent. California residents may also have the right to know, delete, correct and opt out of the sale or sharing of personal information, and not to be discriminated against for exercising those rights. Because we do not run accounts or collect tool input, we usually hold no personal data that can be tied to you; where we do, we will respond within the period required by law.</p>
  <p>To make a request, email <a href="mailto:${escAttr(site.contactEmail)}">${esc(site.contactEmail)}</a>. You may also complain to your local data-protection authority.</p>

  <h2>Data retention</h2>
  <p>We do not maintain a user database. Hosting and diagnostic logs are retained by Vercel for the period described in its policy. Advertising data is retained by Google according to its own retention rules. Local storage remains in your browser until you clear it.</p>

  <h2>International transfers</h2>
  <p>Our host, font provider and advertising partner are global companies and may process data in countries outside your own, using the transfer safeguards described in their respective privacy policies.</p>

  <h2>Children</h2>
  <p>The site is intended for a general audience and is not directed at children under 13. We do not knowingly collect personal information from children. If you believe a child has provided personal data, contact us and we will address it.</p>

  <h2>Security</h2>
  <p>The site is served over HTTPS with a restrictive content-security policy. No method of transmission or storage is completely secure, so avoid entering sensitive information into any online tool.</p>

  <h2>Changes</h2>
  <p>If this policy changes materially, the updated version will be published here with a new revision date. Continued use after an update means you accept the revised policy.</p>

  <h2>Contact</h2>
  <p>Privacy questions: <a href="mailto:${escAttr(site.contactEmail)}">${esc(site.contactEmail)}</a>. You can also use the <a href="/contact">contact page</a>.</p>
</article>`;

  return { path, head, body };
}
