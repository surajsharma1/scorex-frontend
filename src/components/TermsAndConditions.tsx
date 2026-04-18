import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useSEO } from '../hooks/useSEO';
import { Shield, ArrowLeft } from 'lucide-react';

const LAST_UPDATED = 'April 18, 2026';
const SITE_URL = 'https://scorex-live.vercel.app';
const CONTACT_EMAIL = 'support@scorex-live.vercel.app';

export default function TermsAndConditions() {
  useSEO({
    title: 'Terms & Conditions',
    description: 'Read the Terms and Conditions for ScoreX — the live cricket scoring, overlay broadcasting, and tournament management platform.',
    canonical: '/terms',
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
              <Shield className="w-5 h-5 text-green-400" />
            </div>
            <span className="text-xs font-semibold uppercase tracking-widest text-green-400">Legal</span>
          </div>
          <h1 className="text-4xl font-black text-white mb-2" style={{ fontFamily: 'var(--font-orbitron, monospace)' }}>
            Terms &amp; Conditions
          </h1>
          <p className="text-gray-400 text-sm">Last updated: {LAST_UPDATED}</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-12 space-y-10">

        <Section>
          <p className="text-gray-300 leading-relaxed">
            Welcome to <strong className="text-white">ScoreX</strong> ({SITE_URL}). By accessing or using our platform — including live cricket scoring, broadcast overlay creation, tournament management, and any associated services — you agree to be bound by these Terms and Conditions. Please read them carefully before using our services.
          </p>
          <p className="text-gray-300 leading-relaxed mt-4">
            If you do not agree to these terms, you must discontinue use of ScoreX immediately.
          </p>
        </Section>

        <Section title="1. About ScoreX">
          <p className="text-gray-300 leading-relaxed">
            ScoreX is a web-based cricket management platform that provides:
          </p>
          <ul className="mt-3 space-y-2 text-gray-300">
            <Li>Real-time live cricket scoring and scoreboard management</Li>
            <Li>Broadcast overlay creation and streaming integration for OBS, Streamlabs, and similar software</Li>
            <Li>Cricket tournament organisation, bracket management, and NRR tracking</Li>
            <Li>Player statistics, club management, and leaderboards</Li>
            <Li>Membership plans with premium overlay templates and advanced features</Li>
          </ul>
          <p className="text-gray-300 leading-relaxed mt-4">
            ScoreX is intended for cricket clubs, academies, tournament organisers, streamers, and cricket enthusiasts across India and worldwide.
          </p>
        </Section>

        <Section title="2. Eligibility and Account Registration">
          <p className="text-gray-300 leading-relaxed">
            You must be at least <strong className="text-white">13 years of age</strong> to use ScoreX. By registering, you confirm that the information you provide is accurate and up to date. You are responsible for maintaining the confidentiality of your account credentials and for all activity that occurs under your account.
          </p>
          <p className="text-gray-300 leading-relaxed mt-4">
            We reserve the right to suspend or terminate accounts that violate these terms or are found to contain fraudulent information.
          </p>
        </Section>

        <Section title="3. Acceptable Use">
          <p className="text-gray-300 leading-relaxed">You agree <strong className="text-white">not</strong> to:</p>
          <ul className="mt-3 space-y-2 text-gray-300">
            <Li>Use ScoreX for any unlawful purpose or in violation of any applicable laws</Li>
            <Li>Attempt to gain unauthorised access to any part of the platform, its servers, or databases</Li>
            <Li>Upload or transmit malicious code, viruses, or disruptive software</Li>
            <Li>Scrape, crawl, or extract data from ScoreX without prior written permission</Li>
            <Li>Impersonate another user, organisation, or ScoreX staff</Li>
            <Li>Use broadcast overlays or match data to spread misinformation or fake scores</Li>
            <Li>Resell, sublicense, or commercially redistribute ScoreX features without authorisation</Li>
            <Li>Attempt to reverse-engineer, decompile, or modify ScoreX's proprietary code</Li>
          </ul>
        </Section>

        <Section title="4. User-Generated Content">
          <p className="text-gray-300 leading-relaxed">
            ScoreX allows you to create and store match data, tournament records, player information, overlay configurations, and other content ("User Content"). You retain ownership of your User Content. By submitting it to ScoreX, you grant us a non-exclusive, worldwide, royalty-free licence to store, process, and display it solely for the purpose of providing our services to you.
          </p>
          <p className="text-gray-300 leading-relaxed mt-4">
            You are solely responsible for the accuracy of match scores, player data, and tournament information you enter. ScoreX is a tool — the integrity of the data depends on the operator.
          </p>
        </Section>

        <Section title="5. Memberships and Payments">
          <p className="text-gray-300 leading-relaxed">
            ScoreX offers free and paid membership tiers. Paid memberships are processed via <strong className="text-white">Razorpay</strong> and are subject to their terms of service in addition to ours. By purchasing a membership, you agree to the following:
          </p>
          <ul className="mt-3 space-y-2 text-gray-300">
            <Li>Membership fees are charged at the time of purchase and are non-refundable unless required by applicable law</Li>
            <Li>Memberships are valid for the duration selected (1 day, 1 week, or 1 month) and do not auto-renew</Li>
            <Li>Access to premium overlay templates and features is contingent on an active membership</Li>
            <Li>We reserve the right to modify membership pricing with reasonable notice</Li>
          </ul>
          <p className="text-gray-300 leading-relaxed mt-4">
            For billing disputes, contact us at <a href={`mailto:${CONTACT_EMAIL}`} className="text-green-400 hover:underline">{CONTACT_EMAIL}</a>.
          </p>
        </Section>

        <Section title="6. Broadcast Overlays and Streaming">
          <p className="text-gray-300 leading-relaxed">
            ScoreX's overlay system is designed for use with broadcasting software such as OBS Studio and Streamlabs for legitimate cricket match coverage. You may use ScoreX overlays to stream your own matches on platforms such as YouTube or Facebook. You must ensure your stream complies with the Terms of Service of those platforms.
          </p>
          <p className="text-gray-300 leading-relaxed mt-4">
            ScoreX overlay templates are proprietary. You may not extract, copy, or redistribute overlay template source code for use outside of ScoreX without written permission.
          </p>
        </Section>

        <Section title="7. Intellectual Property">
          <p className="text-gray-300 leading-relaxed">
            All content, design elements, overlay templates, logos, and software comprising the ScoreX platform are the intellectual property of ScoreX and its developers, protected under applicable copyright and intellectual property law. Nothing in these Terms grants you ownership of any ScoreX intellectual property.
          </p>
        </Section>

        <Section title="8. Third-Party Services">
          <p className="text-gray-300 leading-relaxed">
            ScoreX integrates with third-party services including Razorpay (payments), Google OAuth (authentication), and Render/Vercel (hosting). These services operate under their own terms and privacy policies. ScoreX is not responsible for the conduct or content of third-party services.
          </p>
        </Section>

        <Section title="9. Disclaimers and Limitation of Liability">
          <p className="text-gray-300 leading-relaxed">
            ScoreX is provided <strong className="text-white">"as is"</strong> without warranties of any kind, express or implied. We do not guarantee uninterrupted, error-free service. Match scoring data displayed through ScoreX depends entirely on user input and is not independently verified.
          </p>
          <p className="text-gray-300 leading-relaxed mt-4">
            To the fullest extent permitted by law, ScoreX and its developers shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of the platform, including but not limited to loss of data, revenue, or goodwill.
          </p>
        </Section>

        <Section title="10. Termination">
          <p className="text-gray-300 leading-relaxed">
            We reserve the right to suspend or terminate your account at any time, with or without notice, for conduct that we believe violates these Terms or is harmful to other users, ScoreX, or third parties. Upon termination, your right to use the platform ceases immediately. Provisions of these Terms that by their nature should survive termination shall survive.
          </p>
        </Section>

        <Section title="11. Changes to These Terms">
          <p className="text-gray-300 leading-relaxed">
            We may update these Terms from time to time. When we do, we will update the "Last updated" date at the top of this page. Continued use of ScoreX after changes are posted constitutes your acceptance of the revised Terms. We encourage you to review this page periodically.
          </p>
        </Section>

        <Section title="12. Governing Law">
          <p className="text-gray-300 leading-relaxed">
            These Terms are governed by the laws of <strong className="text-white">India</strong>. Any disputes arising from or related to these Terms shall be subject to the exclusive jurisdiction of the courts of India.
          </p>
        </Section>

        <Section title="13. Contact Us">
          <p className="text-gray-300 leading-relaxed">
            If you have questions about these Terms and Conditions, please contact us at:
          </p>
          <div className="mt-4 p-5 rounded-2xl border border-green-500/20 bg-green-500/5">
            <p className="text-white font-semibold">ScoreX Support</p>
            <p className="text-gray-400 mt-1">Email: <a href={`mailto:${CONTACT_EMAIL}`} className="text-green-400 hover:underline">{CONTACT_EMAIL}</a></p>
            <p className="text-gray-400">Website: <a href={SITE_URL} className="text-green-400 hover:underline">{SITE_URL}</a></p>
          </div>
        </Section>

        {/* Footer nav */}
        <div className="flex flex-wrap gap-4 pt-6 border-t border-white/10 text-sm">
          <Link to="/privacy" className="text-green-400 hover:underline">Privacy Policy</Link>
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

function Li({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex gap-2">
      <span className="text-green-400 mt-1 shrink-0">→</span>
      <span>{children}</span>
    </li>
  );
}
