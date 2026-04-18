import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useSEO } from '../hooks/useSEO';
import { Lock, ArrowLeft } from 'lucide-react';

const LAST_UPDATED = 'April 18, 2026';
const SITE_URL = 'https://scorex-live.vercel.app';
const CONTACT_EMAIL = 'support@scorex-live.vercel.app';

export default function PrivacyPolicy() {
  useSEO({
    title: 'Privacy Policy',
    description: 'Read the Privacy Policy for ScoreX — how we collect, use, and protect your data on the live cricket scoring and tournament management platform.',
    canonical: '/privacy',
  });

  useEffect(() => { window.scrollTo(0, 0); }, []);

  return (
    <div className="min-h-screen" style={{ background: '#0a0f0a', color: '#e2e8f0', fontFamily: 'system-ui, sans-serif' }}>
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #0d1f0d 0%, #0a0f0a 100%)', borderBottom: '1px solid rgba(34,197,94,0.15)' }}>
        <div className="max-w-4xl mx-auto px-6 py-6 flex items-center gap-4">
          <Link to="/" className="flex items-center gap-2 text-green-400 hover:text-green-300 transition text-sm font-medium">
            <ArrowLeft className="w-4 h-4" />
            Back to ScoreX
          </Link>
        </div>
        <div className="max-w-4xl mx-auto px-6 pb-10 pt-2">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center justify-center">
              <Lock className="w-5 h-5 text-green-400" />
            </div>
            <span className="text-xs font-semibold uppercase tracking-widest text-green-400">Legal</span>
          </div>
          <h1 className="text-4xl font-black text-white mb-2" style={{ fontFamily: 'var(--font-orbitron, monospace)' }}>
            Privacy Policy
          </h1>
          <p className="text-gray-400 text-sm">Last updated: {LAST_UPDATED}</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-12 space-y-10">

        <Section>
          <p className="text-gray-300 leading-relaxed">
            At <strong className="text-white">ScoreX</strong>, we take your privacy seriously. This Privacy Policy explains what information we collect, how we use it, who we share it with, and what choices you have regarding your data when you use ScoreX ({SITE_URL}).
          </p>
          <p className="text-gray-300 leading-relaxed mt-4">
            By using ScoreX, you agree to the practices described in this Privacy Policy. If you disagree, please discontinue use of the platform.
          </p>
        </Section>

        <Section title="1. Information We Collect">
          <Subsection title="1.1 Information You Provide">
            <p className="text-gray-300 leading-relaxed">When you register or use ScoreX, you may provide:</p>
            <ul className="mt-3 space-y-2 text-gray-300">
              <Li><strong className="text-white">Account information</strong> — name, email address, and password (stored as a secure hash)</Li>
              <Li><strong className="text-white">Profile data</strong> — display name, profile picture (via Google OAuth if used)</Li>
              <Li><strong className="text-white">Match and tournament data</strong> — teams, players, scores, and statistics you input while scoring matches</Li>
              <Li><strong className="text-white">Payment information</strong> — membership transactions processed by Razorpay (we do not store card details)</Li>
              <Li><strong className="text-white">Overlay configurations</strong> — your saved sponsor data, animation preferences, and overlay settings</Li>
            </ul>
          </Subsection>

          <Subsection title="1.2 Information Collected Automatically">
            <p className="text-gray-300 leading-relaxed">When you access ScoreX, we may automatically collect:</p>
            <ul className="mt-3 space-y-2 text-gray-300">
              <Li><strong className="text-white">Log data</strong> — IP address, browser type, pages visited, and timestamps</Li>
              <Li><strong className="text-white">Device information</strong> — operating system, screen resolution, and browser version</Li>
              <Li><strong className="text-white">Usage data</strong> — features used, session duration, and navigation patterns</Li>
            </ul>
            <p className="text-gray-300 leading-relaxed mt-3">
              We do not use third-party advertising trackers or sell your browsing data.
            </p>
          </Subsection>

          <Subsection title="1.3 Google OAuth">
            <p className="text-gray-300 leading-relaxed">
              If you sign in with Google, we receive your name, email address, and profile picture from Google as part of the OAuth flow. We do not receive your Google password or access to your Gmail, Drive, or other Google services. Google's own Privacy Policy governs how Google processes your data.
            </p>
          </Subsection>
        </Section>

        <Section title="2. How We Use Your Information">
          <p className="text-gray-300 leading-relaxed">We use your data to:</p>
          <ul className="mt-3 space-y-2 text-gray-300">
            <Li>Create and manage your ScoreX account</Li>
            <Li>Provide live scoring, overlay broadcasting, and tournament management services</Li>
            <Li>Process membership payments via Razorpay</Li>
            <Li>Send important account notifications (e.g., password reset, membership expiry)</Li>
            <Li>Improve platform performance, fix bugs, and develop new features</Li>
            <Li>Prevent fraud, abuse, and violations of our Terms and Conditions</Li>
            <Li>Comply with legal obligations</Li>
          </ul>
          <p className="text-gray-300 leading-relaxed mt-4">
            We do <strong className="text-white">not</strong> use your data for targeted advertising. We do <strong className="text-white">not</strong> sell your personal information to third parties.
          </p>
        </Section>

        <Section title="3. Data Storage and Security">
          <p className="text-gray-300 leading-relaxed">
            Your data is stored in a <strong className="text-white">MongoDB</strong> database hosted on MongoDB Atlas. Our backend is hosted on <strong className="text-white">Render</strong> and our frontend on <strong className="text-white">Vercel</strong>. We implement the following security measures:
          </p>
          <ul className="mt-3 space-y-2 text-gray-300">
            <Li>Passwords are hashed using bcrypt — we never store plaintext passwords</Li>
            <Li>Authentication uses signed <strong className="text-white">JWT tokens</strong> with expiry</Li>
            <Li>All data is transmitted over <strong className="text-white">HTTPS</strong></Li>
            <Li>Sensitive environment variables (API keys, secrets) are stored server-side only</Li>
          </ul>
          <p className="text-gray-300 leading-relaxed mt-4">
            No system is 100% secure. While we work hard to protect your data, we cannot guarantee absolute security against all possible threats.
          </p>
        </Section>

        <Section title="4. Data Sharing">
          <p className="text-gray-300 leading-relaxed">
            We share your data only in the following limited circumstances:
          </p>

          <Subsection title="4.1 Service Providers">
            <ul className="space-y-2 text-gray-300">
              <Li><strong className="text-white">Razorpay</strong> — processes payment transactions. Subject to Razorpay's Privacy Policy.</Li>
              <Li><strong className="text-white">Google</strong> — used for OAuth sign-in. Subject to Google's Privacy Policy.</Li>
              <Li><strong className="text-white">MongoDB Atlas</strong> — database hosting. Subject to MongoDB's Data Processing Agreement.</Li>
              <Li><strong className="text-white">Render / Vercel</strong> — infrastructure hosting. Subject to their respective Data Processing Agreements.</Li>
            </ul>
          </Subsection>

          <Subsection title="4.2 Public Match Data">
            <p className="text-gray-300 leading-relaxed">
              Match scores and tournament data you create on ScoreX may be accessible via public overlay URLs that you share with viewers or embed in broadcasts. Be mindful that data you mark as "public" may be viewed by anyone with the link.
            </p>
          </Subsection>

          <Subsection title="4.3 Legal Requirements">
            <p className="text-gray-300 leading-relaxed">
              We may disclose your information if required to do so by law, court order, or a government authority.
            </p>
          </Subsection>
        </Section>

        <Section title="5. Cookies and Local Storage">
          <p className="text-gray-300 leading-relaxed">
            ScoreX uses <strong className="text-white">browser localStorage</strong> to store your authentication token and user preferences (such as theme settings). We do not use third-party advertising cookies. We may use minimal first-party cookies for session management.
          </p>
          <p className="text-gray-300 leading-relaxed mt-4">
            You can clear localStorage and cookies through your browser settings, which will log you out of ScoreX.
          </p>
        </Section>

        <Section title="6. Your Rights and Choices">
          <p className="text-gray-300 leading-relaxed">You have the right to:</p>
          <ul className="mt-3 space-y-2 text-gray-300">
            <Li><strong className="text-white">Access</strong> — request a copy of the personal data we hold about you</Li>
            <Li><strong className="text-white">Correction</strong> — update or correct inaccurate information via your Profile page</Li>
            <Li><strong className="text-white">Deletion</strong> — request deletion of your account and associated data by emailing us</Li>
            <Li><strong className="text-white">Portability</strong> — request an export of your match and tournament data</Li>
            <Li><strong className="text-white">Withdrawal</strong> — withdraw consent for non-essential data processing at any time</Li>
          </ul>
          <p className="text-gray-300 leading-relaxed mt-4">
            To exercise any of these rights, contact us at <a href={`mailto:${CONTACT_EMAIL}`} className="text-green-400 hover:underline">{CONTACT_EMAIL}</a>. We will respond within 30 days.
          </p>
        </Section>

        <Section title="7. Data Retention">
          <p className="text-gray-300 leading-relaxed">
            We retain your account and match data for as long as your account is active or as needed to provide our services. If you delete your account, we will delete your personal data within 30 days, except where we are required to retain it for legal or compliance purposes.
          </p>
          <p className="text-gray-300 leading-relaxed mt-4">
            Match data and tournament records may be retained in anonymised or aggregated form for platform analytics purposes.
          </p>
        </Section>

        <Section title="8. Children's Privacy">
          <p className="text-gray-300 leading-relaxed">
            ScoreX is not directed at children under 13 years of age. We do not knowingly collect personal information from children under 13. If you believe a child has provided us with their data without parental consent, please contact us and we will delete it promptly.
          </p>
        </Section>

        <Section title="9. International Users">
          <p className="text-gray-300 leading-relaxed">
            ScoreX is operated from India. If you access ScoreX from outside India, please be aware that your data may be transferred to and processed in India. By using ScoreX, you consent to this transfer. We ensure that our service providers maintain adequate data protection standards.
          </p>
        </Section>

        <Section title="10. Changes to This Policy">
          <p className="text-gray-300 leading-relaxed">
            We may update this Privacy Policy from time to time to reflect changes in our practices or legal requirements. When we make changes, we will update the "Last updated" date at the top of this page. We encourage you to review this page periodically. Continued use of ScoreX after changes are posted constitutes acceptance of the updated policy.
          </p>
        </Section>

        <Section title="11. Contact Us">
          <p className="text-gray-300 leading-relaxed">
            If you have any questions, concerns, or requests relating to this Privacy Policy, please contact us:
          </p>
          <div className="mt-4 p-5 rounded-2xl border border-green-500/20 bg-green-500/5">
            <p className="text-white font-semibold">ScoreX Privacy Team</p>
            <p className="text-gray-400 mt-1">Email: <a href={`mailto:${CONTACT_EMAIL}`} className="text-green-400 hover:underline">{CONTACT_EMAIL}</a></p>
            <p className="text-gray-400">Website: <a href={SITE_URL} className="text-green-400 hover:underline">{SITE_URL}</a></p>
          </div>
        </Section>

        {/* Footer nav */}
        <div className="flex flex-wrap gap-4 pt-6 border-t border-white/10 text-sm">
          <Link to="/terms" className="text-green-400 hover:underline">Terms & Conditions</Link>
          <Link to="/" className="text-gray-400 hover:text-white transition">← Back to ScoreX</Link>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <section>
      {title && (
        <h2 className="text-xl font-bold text-white mb-4" style={{ fontFamily: 'var(--font-orbitron, monospace)' }}>
          {title}
        </h2>
      )}
      {children}
    </section>
  );
}

function Subsection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-5">
      <h3 className="text-base font-semibold text-green-300 mb-3">{title}</h3>
      {children}
    </div>
  );
}

function Li({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex gap-2">
      <span className="text-green-400 mt-1 shrink-0">→</span>
      <span>{children}</span>
    </li>
  );
}
