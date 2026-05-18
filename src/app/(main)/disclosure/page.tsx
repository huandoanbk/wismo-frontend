export default function DisclosurePage() {
  return (
    <div className="flex flex-1 justify-center px-4 py-10">
      <div className="w-full max-w-2xl">
        <h1 className="text-2xl font-bold text-wismo-text mb-2">Responsible Disclosure</h1>
        <p className="text-xs text-wismo-text-light mb-8">Last updated: May 2025</p>

        <div className="space-y-8 text-sm text-wismo-text-muted leading-relaxed">

          {/* Intro */}
          <p>
            We take the security of WISMO and the privacy of our users seriously. If you
            discover a security vulnerability in our service, we ask that you report it to us
            responsibly so we can address it before it is publicly disclosed.
          </p>

          {/* 1. Scope */}
          <section>
            <h2 className="text-base font-semibold text-wismo-text mb-3">1. Scope</h2>
            <p className="mb-2">This policy applies to security vulnerabilities in:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>The WISMO web application at <span className="text-wismo-text">wismo.app</span></li>
              <li>WISMO API endpoints and backend services</li>
              <li>Authentication and session handling</li>
              <li>Data storage and user data handling</li>
            </ul>
            <p className="mt-3">
              This policy does <strong className="text-wismo-text">not</strong> cover
              vulnerabilities in third-party services we depend on (such as hosting providers
              or AI model providers). Please report those directly to the relevant vendor.
            </p>
          </section>

          {/* 2. What we ask */}
          <section>
            <h2 className="text-base font-semibold text-wismo-text mb-3">2. What we ask of you</h2>
            <p className="mb-2">When you discover a potential vulnerability, please:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Report it to us promptly via the contact below.</li>
              <li>Give us a reasonable amount of time to investigate and remediate before any public disclosure.</li>
              <li>Avoid accessing, modifying, or deleting data that does not belong to you.</li>
              <li>Do not perform denial-of-service attacks, social engineering, or physical attacks.</li>
              <li>Do not use automated scanners in a way that degrades service availability.</li>
            </ul>
          </section>

          {/* 3. What to include */}
          <section>
            <h2 className="text-base font-semibold text-wismo-text mb-3">3. What to include in your report</h2>
            <p className="mb-2">A good report helps us reproduce and fix the issue faster. Please include:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>A clear description of the vulnerability and its potential impact.</li>
              <li>Steps to reproduce the issue (proof of concept if applicable).</li>
              <li>The URL, endpoint, or component affected.</li>
              <li>The browser, OS, or environment used (if relevant).</li>
              <li>Any relevant screenshots or logs (with personal data of other users redacted).</li>
            </ul>
          </section>

          {/* 4. Our commitment */}
          <section>
            <h2 className="text-base font-semibold text-wismo-text mb-3">4. Our commitment to you</h2>
            <p className="mb-2">If you follow this policy in good faith, we commit to:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Acknowledge receipt of your report within 5 business days.</li>
              <li>Investigate the report and keep you informed of our progress.</li>
              <li>Notify you when the vulnerability has been remediated.</li>
              <li>Not pursue legal action against you for the vulnerability disclosure, provided you have acted in good faith and within the scope of this policy.</li>
              <li>Give credit for your discovery if you wish, once the issue is resolved.</li>
            </ul>
          </section>

          {/* 5. Out of scope */}
          <section>
            <h2 className="text-base font-semibold text-wismo-text mb-3">5. Out of scope</h2>
            <p className="mb-2">The following are generally not considered valid security vulnerabilities for this program:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Missing security headers that do not directly lead to exploitability.</li>
              <li>Theoretical vulnerabilities without a working proof of concept.</li>
              <li>Reports from automated scanners without manual verification.</li>
              <li>Social engineering of WISMO staff or users.</li>
              <li>Clickjacking on pages without sensitive actions.</li>
              <li>Rate limiting issues that do not result in data exposure.</li>
            </ul>
          </section>

          {/* 6. Contact */}
          <section>
            <h2 className="text-base font-semibold text-wismo-text mb-3">6. Contact</h2>
            <p>Send your report by email to our security team:</p>
            <p className="mt-2">
              <a
                href="mailto:security@wismo.app"
                className="text-wismo-primary hover:underline font-medium"
              >
                security@wismo.app
              </a>
            </p>
            <p className="mt-3">
              Please encrypt sensitive reports using our PGP key if you need to include
              confidential details. Contact us at the address above to request our public key.
            </p>
            <p className="mt-3 text-xs text-wismo-text-light">
              We do not offer a paid bug bounty programme at this time. We do appreciate
              responsible disclosure and will acknowledge researchers who help improve WISMO&apos;s
              security.
            </p>
          </section>

        </div>
      </div>
    </div>
  )
}
