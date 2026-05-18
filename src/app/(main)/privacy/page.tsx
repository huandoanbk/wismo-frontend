export default function PrivacyPage() {
  return (
    <div className="flex flex-1 justify-center px-4 py-10">
      <div className="w-full max-w-2xl">
        <h1 className="text-2xl font-bold text-wismo-text mb-2">Privacy Policy</h1>
        <p className="text-xs text-wismo-text-light mb-8">Last updated: May 2025</p>

        <div className="space-y-8 text-sm text-wismo-text-muted leading-relaxed">

          {/* 1. Who we are */}
          <section>
            <h2 className="text-base font-semibold text-wismo-text mb-3">1. Who we are</h2>
            <p>
              WISMO (&ldquo;we&rdquo;, &ldquo;us&rdquo;, &ldquo;our&rdquo;) operates the WISMO service available at{' '}
              <span className="text-wismo-text">wismo.app</span>. WISMO is an AI companion
              designed to help you reflect on your thoughts and better understand yourself.
            </p>
            <p className="mt-2">
              WISMO is <strong className="text-wismo-text">not</strong> a mental health service,
              medical provider, or substitute for professional care. It does not diagnose,
              prescribe, or provide therapy.
            </p>
            <p className="mt-2">
              For questions about this policy or your data, contact us at{' '}
              <a href="mailto:privacy@wismo.app" className="text-wismo-primary hover:underline">
                privacy@wismo.app
              </a>.
            </p>
          </section>

          {/* 2. Data we collect */}
          <section>
            <h2 className="text-base font-semibold text-wismo-text mb-3">2. Data we collect</h2>
            <p className="mb-3">We collect the following categories of personal data:</p>

            <div className="space-y-4">
              <div>
                <h3 className="font-medium text-wismo-text mb-1">Account information</h3>
                <p>
                  When you register, we collect your email address and display name. If you sign in
                  with Google, we receive your email and name from Google in accordance with their
                  privacy policy. Passwords are stored in hashed form and never readable by us.
                </p>
              </div>

              <div>
                <h3 className="font-medium text-wismo-text mb-1">Conversation content</h3>
                <p>
                  The messages you send to WISMO and the responses you receive are stored on our
                  servers. This data is used to provide continuity between sessions and to
                  personalise your experience. Conversation content may relate to your emotional
                  state and personal reflections and is treated as sensitive personal data.
                </p>
              </div>

              <div>
                <h3 className="font-medium text-wismo-text mb-1">Session and technical data</h3>
                <p>
                  We use HttpOnly cookies to maintain your session. We may log request timestamps,
                  error codes, and basic usage signals (such as number of messages sent) for
                  operational purposes. We do not collect IP addresses beyond what is technically
                  required for the connection.
                </p>
              </div>

              <div>
                <h3 className="font-medium text-wismo-text mb-1">Analytics (optional)</h3>
                <p>
                  With your explicit consent, we may collect anonymised usage data to understand
                  how the service is used and to improve it. This consent is optional and can be
                  withdrawn at any time.
                </p>
              </div>

              <div>
                <h3 className="font-medium text-wismo-text mb-1">Guest sessions</h3>
                <p>
                  If you use WISMO without registering, a temporary guest session is created via
                  a session cookie. Guest session data is limited and subject to shorter retention
                  periods. Creating an account is not required to use the basic service.
                </p>
              </div>
            </div>
          </section>

          {/* 3. Why we process your data */}
          <section>
            <h2 className="text-base font-semibold text-wismo-text mb-3">3. Why we process your data</h2>
            <p className="mb-3">We process personal data on the following legal bases:</p>
            <div className="space-y-3">
              <div>
                <h3 className="font-medium text-wismo-text mb-1">Contract performance</h3>
                <p>
                  Account data, session data, and conversation history are necessary to provide
                  the WISMO service you have requested.
                </p>
              </div>
              <div>
                <h3 className="font-medium text-wismo-text mb-1">Consent</h3>
                <p>
                  Before you access the chat service, we ask for your explicit consent to:
                </p>
                <ul className="list-disc list-inside mt-2 space-y-1 ml-2">
                  <li>store and process your conversations to personalise support;</li>
                  <li>remember information between sessions for continuity;</li>
                  <li>use anonymised data to improve the service (optional).</li>
                </ul>
                <p className="mt-2">
                  You can withdraw any consent at any time via{' '}
                  <span className="text-wismo-text">Account → Privacy</span>. Withdrawing
                  consent will prevent access to chat until consent is re-granted.
                </p>
              </div>
              <div>
                <h3 className="font-medium text-wismo-text mb-1">Legitimate interests</h3>
                <p>
                  We may process minimal technical data to maintain security, detect abuse,
                  and ensure the reliability of the service.
                </p>
              </div>
            </div>
          </section>

          {/* 4. AI processing */}
          <section>
            <h2 className="text-base font-semibold text-wismo-text mb-3">4. AI processing</h2>
            <p>
              WISMO uses third-party large language model (LLM) providers to generate responses
              to your messages. Your conversation content is transmitted to these providers as
              part of the request. Providers are bound by data processing agreements and are not
              permitted to use your data to train their models.
            </p>
            <p className="mt-2">
              WISMO does not make automated decisions about you that produce legal or similarly
              significant effects. All responses are generated by AI and are not reviewed by
              a human unless required for safety or legal reasons.
            </p>
          </section>

          {/* 5. Data sharing */}
          <section>
            <h2 className="text-base font-semibold text-wismo-text mb-3">5. Data sharing</h2>
            <p className="mb-3">
              We do not sell your personal data. We share data only with:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-2">
              <li>
                <strong className="text-wismo-text">LLM providers</strong> — to generate AI
                responses, under data processing agreements.
              </li>
              <li>
                <strong className="text-wismo-text">Hosting and infrastructure providers</strong>{' '}
                — necessary for operating the service, under data processing agreements.
              </li>
              <li>
                <strong className="text-wismo-text">Google</strong> — if you choose to sign in
                with Google. Governed by Google&apos;s own privacy policy.
              </li>
              <li>
                <strong className="text-wismo-text">Legal authorities</strong> — if required by
                applicable law or to protect the safety of users.
              </li>
            </ul>
          </section>

          {/* 6. Data retention */}
          <section>
            <h2 className="text-base font-semibold text-wismo-text mb-3">6. Data retention</h2>
            <p>
              We retain your account data and conversation history for as long as your account
              is active. If you delete your account or all chat history, the relevant data is
              permanently deleted within 30 days.
            </p>
            <p className="mt-2">
              Guest session data is retained for a shorter period tied to session expiry.
              Anonymised analytics data, where collected, may be retained in aggregate form
              after individual data is deleted.
            </p>
          </section>

          {/* 7. Your rights */}
          <section>
            <h2 className="text-base font-semibold text-wismo-text mb-3">7. Your rights</h2>
            <p className="mb-3">
              Under applicable data protection law (including GDPR where it applies), you have
              the right to:
            </p>
            <div className="space-y-2">
              {[
                ['Access', 'Request a copy of the personal data we hold about you.'],
                ['Rectification', 'Correct inaccurate or incomplete data.'],
                ['Erasure', 'Request deletion of your data. You can delete all conversations via Account → Data, or close your account entirely.'],
                ['Portability', 'Receive your data in a structured, machine-readable format.'],
                ['Objection', 'Object to processing based on legitimate interests.'],
                ['Withdraw consent', 'Withdraw consent for any consent-based processing at any time via Account → Privacy.'],
                ['Lodge a complaint', 'Lodge a complaint with your local data protection authority.'],
              ].map(([right, description]) => (
                <div key={right} className="flex gap-2">
                  <span className="font-medium text-wismo-text min-w-[140px] flex-shrink-0">{right}</span>
                  <span>{description}</span>
                </div>
              ))}
            </div>
            <p className="mt-3">
              To exercise your rights, contact us at{' '}
              <a href="mailto:privacy@wismo.app" className="text-wismo-primary hover:underline">
                privacy@wismo.app
              </a>. We will respond within 30 days.
            </p>
          </section>

          {/* 8. Cookies */}
          <section>
            <h2 className="text-base font-semibold text-wismo-text mb-3">8. Cookies and sessions</h2>
            <p>
              We use strictly necessary HttpOnly session cookies to authenticate you and maintain
              your session. These cookies are not used for advertising and cannot be read by
              browser scripts.
            </p>
            <p className="mt-2">
              We do not use third-party tracking cookies or advertising cookies.
            </p>
          </section>

          {/* 9. Age restriction */}
          <section>
            <h2 className="text-base font-semibold text-wismo-text mb-3">9. Age restriction</h2>
            <p>
              WISMO is intended for users aged 18 and over. We do not knowingly collect
              personal data from anyone under 18. If we become aware that a minor has used the
              service, we will delete the relevant data promptly.
            </p>
          </section>

          {/* 10. Security */}
          <section>
            <h2 className="text-base font-semibold text-wismo-text mb-3">10. Security</h2>
            <p>
              We implement appropriate technical and organisational measures to protect your
              personal data, including encrypted connections (TLS), HttpOnly session tokens,
              and access controls. No system is completely secure; if you discover a security
              vulnerability, please report it via our{' '}
              <a href="/disclosure" className="text-wismo-primary hover:underline">
                Responsible Disclosure Policy
              </a>.
            </p>
          </section>

          {/* 11. Changes */}
          <section>
            <h2 className="text-base font-semibold text-wismo-text mb-3">11. Changes to this policy</h2>
            <p>
              We may update this policy from time to time. If we make material changes that
              affect how we process your data, we will ask for your consent again before you
              can continue using the chat service. The date at the top of this page reflects
              the most recent update.
            </p>
          </section>

          {/* 12. Contact */}
          <section>
            <h2 className="text-base font-semibold text-wismo-text mb-3">12. Contact</h2>
            <p>
              For privacy-related questions or to exercise your rights:
            </p>
            <p className="mt-2">
              <a href="mailto:privacy@wismo.app" className="text-wismo-primary hover:underline">
                privacy@wismo.app
              </a>
            </p>
            <p className="mt-1 text-xs text-wismo-text-light">
              This policy should be reviewed by a qualified legal professional before launch.
              Specific company registration details and DPO information to be added.
            </p>
          </section>

        </div>
      </div>
    </div>
  )
}
