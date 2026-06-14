import { useEffect } from "react";
import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";

const stockSenseLogo = "/stocksense-logo.png";

export default function TermsOfService() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-slate-900/95 backdrop-blur border-b border-slate-800">
        <div className="container mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
          <Link href="/">
            <img src={stockSenseLogo} alt="StockSense" className="h-9 w-auto cursor-pointer" />
          </Link>
          <Link href="/" className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="container mx-auto px-4 md:px-6 py-16 max-w-3xl">
        <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">Terms of Service</h1>
        <p className="text-slate-400 text-sm mb-10">Last updated: June 2025</p>

        <div className="space-y-10 text-slate-300 leading-relaxed">

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">1. Acceptance of Terms</h2>
            <p>
              By accessing or using the StockSense website at{" "}
              <strong className="text-white">thestocksense.in</strong>, you agree to be bound by
              these Terms of Service. If you do not agree to these terms, please do not use our
              website or services. We reserve the right to update these terms at any time, and your
              continued use of the site constitutes acceptance of the revised terms.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">2. About StockSense</h2>
            <p>
              StockSense is an educational initiative that provides structured learning about the
              stock market for beginners. We are <strong className="text-white">not</strong> a
              registered investment advisor, broker, or financial services company. All content,
              courses, and sessions offered by StockSense are strictly for educational and
              investor awareness purposes only.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">3. Educational Purpose Only</h2>
            <p className="mb-3">
              All information, content, and materials provided by StockSense — including but not
              limited to sessions, webinars, videos, PDFs, and written content — are for
              educational purposes only and do not constitute:
            </p>
            <ul className="list-disc list-inside space-y-2 text-slate-400 ml-2">
              <li>Investment advice or financial advice</li>
              <li>Stock tips, buy/sell recommendations, or trading signals</li>
              <li>Portfolio management services</li>
              <li>Any form of SEBI-regulated advisory service</li>
            </ul>
            <p className="mt-3">
              Always consult a SEBI-registered investment advisor before making any financial
              decision. All investments are subject to market risk.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">4. User Responsibilities</h2>
            <p className="mb-3">By using our website and services, you agree to:</p>
            <ul className="list-disc list-inside space-y-2 text-slate-400 ml-2">
              <li>Provide accurate and truthful information when filling out our forms</li>
              <li>Not misuse our platform for any unlawful or unauthorized purpose</li>
              <li>Not reproduce, distribute, or commercially exploit our educational content without written permission</li>
              <li>Take full responsibility for your own investment decisions</li>
              <li>Be at least 18 years of age to use our services</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">5. Intro Session & Communication Consent</h2>
            <p>
              By submitting the intro session request form, you expressly consent to being contacted
              by StockSense via phone call, SMS, or WhatsApp at the mobile number provided. This
              communication is solely for the purpose of scheduling your free intro session and
              sharing relevant educational updates. You may opt out at any time by contacting us.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">6. Intellectual Property</h2>
            <p>
              All content on this website — including text, graphics, logos, images, and course
              materials — is the property of StockSense and is protected by applicable intellectual
              property laws. You may not copy, reproduce, modify, or distribute any content without
              prior written consent from StockSense.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">7. Limitation of Liability</h2>
            <p>
              StockSense, its founders, instructors, and team members shall not be held liable for
              any financial loss, damage, or harm arising from the use of information provided
              through our educational sessions or website. We do not guarantee any specific
              financial outcomes or returns from applying the concepts taught. Users bear full
              responsibility for their own investment decisions.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">8. Third-Party Links & Services</h2>
            <p>
              Our website may contain links to third-party websites (e.g., WhatsApp, YouTube,
              Google). These links are provided for convenience only. StockSense does not endorse
              or take responsibility for the content, privacy practices, or availability of any
              third-party websites.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">9. Governing Law</h2>
            <p>
              These Terms of Service are governed by and construed in accordance with the laws of
              India. Any disputes arising under these terms shall be subject to the exclusive
              jurisdiction of the courts located in Mumbai, Maharashtra, India.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">10. Changes to Terms</h2>
            <p>
              We reserve the right to modify these Terms of Service at any time. Changes will be
              effective immediately upon posting to this page with a revised "Last updated" date.
              We encourage you to review these terms periodically. Continued use of our services
              after any changes constitutes your acceptance of the new terms.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">11. Contact Us</h2>
            <p>For any questions regarding these Terms of Service, please reach out to us:</p>
            <div className="mt-3 bg-slate-800/60 rounded-xl p-5 border border-slate-700 space-y-2 text-sm">
              <p><span className="text-slate-400">Email:</span>{" "}
                <a href="mailto:info@thestocksense.in" className="text-green-400 hover:underline">
                  info@thestocksense.in
                </a>
              </p>
              <p><span className="text-slate-400">WhatsApp:</span>{" "}
                <a href="https://wa.me/919167514859" target="_blank" rel="noopener noreferrer" className="text-green-400 hover:underline">
                  +91 91675 14859
                </a>
              </p>
              <p><span className="text-slate-400">Website:</span>{" "}
                <a href="https://thestocksense.in" className="text-green-400 hover:underline">
                  thestocksense.in
                </a>
              </p>
            </div>
          </section>

        </div>

        {/* Back to home */}
        <div className="mt-16 pt-8 border-t border-slate-800">
          <Link href="/">
            <button className="flex items-center gap-2 text-green-400 hover:text-green-300 transition-colors font-medium">
              <ArrowLeft className="w-4 h-4" />
              Back to StockSense Home
            </button>
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-6 mt-8">
        <div className="container mx-auto px-4 text-center text-slate-500 text-sm">
          © {new Date().getFullYear()} StockSense Education. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
