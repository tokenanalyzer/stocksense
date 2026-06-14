import { useEffect } from "react";
import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";

const stockSenseLogo = "/stocksense-logo.png";

export default function PrivacyPolicy() {
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
        <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">Privacy Policy</h1>
        <p className="text-slate-400 text-sm mb-10">Last updated: June 2025</p>

        <div className="space-y-10 text-slate-300 leading-relaxed">

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">1. Introduction</h2>
            <p>
              Welcome to StockSense ("we", "our", "us"). We are committed to protecting your personal
              information and your right to privacy. This Privacy Policy explains how we collect, use,
              and safeguard the information you provide when you submit a form or interact with our
              website at <strong className="text-white">thestocksense.in</strong>.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">2. Information We Collect</h2>
            <p className="mb-3">When you fill out our intro session request form, we collect:</p>
            <ul className="list-disc list-inside space-y-2 text-slate-400 ml-2">
              <li>Full Name</li>
              <li>Mobile Number</li>
              <li>Starting Investment Capital</li>
              <li>Demat Account Status</li>
              <li>City</li>
              <li>Experience Level</li>
              <li>Preferred Contact Time</li>
              <li>What you want to understand (optional)</li>
            </ul>
            <p className="mt-3">
              We do <strong className="text-white">not</strong> collect sensitive financial data,
              passwords, or payment information through this form.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">3. How We Use Your Information</h2>
            <p className="mb-3">We use the information you provide solely to:</p>
            <ul className="list-disc list-inside space-y-2 text-slate-400 ml-2">
              <li>Contact you regarding your free intro session request via call, SMS, or WhatsApp</li>
              <li>Understand your background and tailor our educational content accordingly</li>
              <li>Send relevant updates about StockSense courses and sessions (only if you have consented)</li>
            </ul>
            <p className="mt-3">
              We will <strong className="text-white">never</strong> sell, rent, or share your personal
              information with third parties for marketing purposes.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">4. Data Storage</h2>
            <p>
              Your form submissions are stored securely in our internal systems (Google Sheets,
              accessible only by the StockSense team). We implement appropriate technical measures
              to protect your data from unauthorized access, alteration, or disclosure.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">5. Cookies</h2>
            <p>
              Our website may use basic analytics tools (such as Google Analytics) to understand
              how visitors interact with our site. These tools may set cookies to collect anonymous
              usage data. You can disable cookies in your browser settings at any time.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">6. Third-Party Links</h2>
            <p>
              Our website may contain links to external sites (e.g., WhatsApp). We are not responsible
              for the privacy practices of those websites. We encourage you to review their privacy
              policies before providing any personal information.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">7. Your Rights</h2>
            <p className="mb-3">You have the right to:</p>
            <ul className="list-disc list-inside space-y-2 text-slate-400 ml-2">
              <li>Request access to the personal data we hold about you</li>
              <li>Request correction or deletion of your data</li>
              <li>Withdraw your consent to be contacted at any time</li>
            </ul>
            <p className="mt-3">
              To exercise any of these rights, contact us at{" "}
              <a href="mailto:stocksense00@gmail.com" className="text-green-400 hover:underline">
                stocksense00@gmail.com
              </a>
              .
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">8. Children's Privacy</h2>
            <p>
              Our services are not directed to individuals under the age of 18. We do not knowingly
              collect personal information from minors. If you believe we have inadvertently collected
              such data, please contact us immediately.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">9. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. Any changes will be posted on this
              page with a revised "Last updated" date. Continued use of our website after changes
              constitutes acceptance of the updated policy.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">10. Contact Us</h2>
            <p>If you have any questions about this Privacy Policy, please contact us:</p>
            <div className="mt-3 bg-slate-800/60 rounded-xl p-5 border border-slate-700 space-y-2 text-sm">
              <p><span className="text-slate-400">Email:</span>{" "}
                <a href="mailto:stocksense00@gmail.com" className="text-green-400 hover:underline">
                  stocksense00@gmail.com
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
