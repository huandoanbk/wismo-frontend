export default function UsagePolicyPage() {
  return (
    <div className="flex flex-1 justify-center px-4 py-10">
      <div className="w-full max-w-2xl">
        <h1 className="text-2xl font-bold text-wismo-text mb-2">Usage Policy</h1>
        <p className="text-xs text-wismo-text-light mb-8">Last updated: May 2025</p>

        <div className="space-y-8 text-sm text-wismo-text-muted leading-relaxed">

          {/* Intro */}
          <p>
            This Usage Policy explains who may use WISMO, what the service is designed for,
            and what is not permitted. By using WISMO you agree to this policy. Please read
            it carefully.
          </p>

          {/* 1. What WISMO is */}
          <section>
            <h2 className="text-base font-semibold text-wismo-text mb-3">1. What WISMO is</h2>
            <p>
              WISMO is an AI companion designed to help you reflect on your thoughts, process
              your feelings, and better understand yourself — at your own pace, in your own
              language.
            </p>
            <p className="mt-2 font-medium text-wismo-text">
              WISMO is not a mental health service, medical device, or substitute for
              professional care. It does not diagnose conditions, prescribe treatment, or
              provide therapy of any kind.
            </p>
            <p className="mt-2">
              If you are in crisis or need immediate support, please contact a qualified
              professional or emergency services. In Finland, call{' '}
              <a href="tel:112" className="text-wismo-primary hover:underline font-medium">
                112
              </a>{' '}
              or visit{' '}
              <a
                href="https://112.fi"
                target="_blank"
                rel="noopener noreferrer"
                className="text-wismo-primary hover:underline"
              >
                112.fi
              </a>.
            </p>
          </section>

          {/* 2. Who may use WISMO */}
          <section>
            <h2 className="text-base font-semibold text-wismo-text mb-3">2. Who may use WISMO</h2>
            <p className="mb-2">You may use WISMO if you:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Are aged 18 or over.</li>
              <li>Have the legal capacity to enter into agreements in your jurisdiction.</li>
              <li>Have read and agreed to our consent terms before accessing the chat service.</li>
            </ul>
            <p className="mt-3">
              WISMO is not available to anyone under 18. If we detect or have reason to believe
              a user is under 18, access to the chat service will be blocked and any associated
              data will be deleted.
            </p>
          </section>

          {/* 3. Permitted use */}
          <section>
            <h2 className="text-base font-semibold text-wismo-text mb-3">3. Permitted use</h2>
            <p className="mb-2">You may use WISMO to:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Engage in personal reflection and journalling-style conversations.</li>
              <li>Explore your thoughts, emotions, and day-to-day experiences.</li>
              <li>Use WISMO as a private, supportive space to articulate and process your feelings.</li>
              <li>Access the service in any supported language for personal, non-commercial purposes.</li>
            </ul>
          </section>

          {/* 4. Prohibited use */}
          <section>
            <h2 className="text-base font-semibold text-wismo-text mb-3">4. Prohibited use</h2>
            <p className="mb-3">You must not use WISMO to:</p>

            <div className="space-y-4">
              <div>
                <h3 className="font-medium text-wismo-text mb-1">Harmful or illegal content</h3>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>Generate, distribute, or solicit content that is illegal, abusive, or harmful to others.</li>
                  <li>Seek or spread instructions for self-harm, violence, or illegal activities.</li>
                  <li>Attempt to elicit content that WISMO is designed to decline.</li>
                </ul>
              </div>

              <div>
                <h3 className="font-medium text-wismo-text mb-1">Misuse of the AI</h3>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>Attempt to manipulate, jailbreak, or bypass WISMO&apos;s safety guidelines.</li>
                  <li>Use WISMO as if it were a licensed therapist, psychologist, or medical professional.</li>
                  <li>Rely on WISMO for clinical decisions, crisis management, or medical advice.</li>
                  <li>Use prompt injection or adversarial inputs to alter the behaviour of the AI.</li>
                </ul>
              </div>

              <div>
                <h3 className="font-medium text-wismo-text mb-1">Abuse of the platform</h3>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>Create multiple accounts to circumvent usage limits or access restrictions.</li>
                  <li>Use automated bots, scripts, or tools to send messages to WISMO at scale.</li>
                  <li>Attempt to overload, attack, or disrupt the service (including denial-of-service).</li>
                  <li>Access or attempt to access accounts, data, or systems that are not yours.</li>
                </ul>
              </div>

              <div>
                <h3 className="font-medium text-wismo-text mb-1">Commercial and third-party use</h3>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>Resell, sublicense, or offer access to WISMO to third parties.</li>
                  <li>Integrate WISMO into commercial products or services without authorisation.</li>
                  <li>Scrape or harvest data from WISMO for any purpose.</li>
                </ul>
              </div>
            </div>
          </section>

          {/* 5. AI limitations */}
          <section>
            <h2 className="text-base font-semibold text-wismo-text mb-3">5. AI limitations and your responsibility</h2>
            <p>
              WISMO&apos;s responses are generated by an AI model. They may occasionally be
              inaccurate, incomplete, or inappropriate despite safeguards. You are responsible
              for how you interpret and act on WISMO&apos;s responses.
            </p>
            <p className="mt-2">
              WISMO does not have memory of conversations beyond what is explicitly stored as
              part of your session. It does not know your full history, circumstances, or needs.
              It should never be your only source of support.
            </p>
            <p className="mt-2">
              If WISMO responds in a way that concerns you or seems wrong, please stop and seek
              appropriate human support. You can also report the issue to us at{' '}
              <a href="mailto:support@wismo.app" className="text-wismo-primary hover:underline">
                support@wismo.app
              </a>.
            </p>
          </section>

          {/* 6. Content moderation */}
          <section>
            <h2 className="text-base font-semibold text-wismo-text mb-3">6. Content and safety</h2>
            <p>
              WISMO applies automated safety checks to conversations. Certain types of content
              — including content related to immediate crisis, self-harm, or attempts to bypass
              safety guidelines — will be detected and handled according to our safety policies.
              This may include displaying crisis resources or declining to respond to a specific
              request.
            </p>
            <p className="mt-2">
              These safety measures exist to protect you and others. Attempting to disable or
              circumvent them is a violation of this policy.
            </p>
          </section>

          {/* 7. Account responsibilities */}
          <section>
            <h2 className="text-base font-semibold text-wismo-text mb-3">7. Your account and credentials</h2>
            <p>
              You are responsible for maintaining the security of your account credentials.
              Do not share your account with others. If you believe your account has been
              compromised, contact us immediately at{' '}
              <a href="mailto:support@wismo.app" className="text-wismo-primary hover:underline">
                support@wismo.app
              </a>.
            </p>
            <p className="mt-2">
              You are responsible for all activity that occurs under your account.
            </p>
          </section>

          {/* 8. Enforcement */}
          <section>
            <h2 className="text-base font-semibold text-wismo-text mb-3">8. Enforcement</h2>
            <p>
              We reserve the right to suspend or terminate access to WISMO for any account
              that violates this policy, without prior notice where the violation is serious.
              We may also report illegal activity to appropriate authorities.
            </p>
            <p className="mt-2">
              We aim to apply this policy fairly and proportionately. If you believe your
              access was restricted in error, contact us at{' '}
              <a href="mailto:support@wismo.app" className="text-wismo-primary hover:underline">
                support@wismo.app
              </a>.
            </p>
          </section>

          {/* 9. Changes */}
          <section>
            <h2 className="text-base font-semibold text-wismo-text mb-3">9. Changes to this policy</h2>
            <p>
              We may update this policy from time to time. Material changes will be communicated
              to registered users via the service. Continued use of WISMO after changes take
              effect constitutes acceptance of the updated policy.
            </p>
          </section>

          {/* 10. Contact */}
          <section>
            <h2 className="text-base font-semibold text-wismo-text mb-3">10. Contact</h2>
            <p>Questions about this policy:</p>
            <p className="mt-2">
              <a href="mailto:support@wismo.app" className="text-wismo-primary hover:underline">
                support@wismo.app
              </a>
            </p>
          </section>

        </div>
      </div>
    </div>
  )
}
