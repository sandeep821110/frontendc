import { Shield } from 'lucide-react';

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center gap-3 mb-8">
          <Shield className="w-8 h-8 text-indigo-600" />
          <h1 className="text-3xl font-bold text-gray-900">Privacy Policy</h1>
        </div>
        <p className="text-sm text-gray-500 mb-8">Last updated: May 24, 2026</p>

        <div className="space-y-8 text-gray-700 text-sm leading-relaxed">
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">1. Information We Collect</h2>
            <p>When you use ChooseMood, we collect the following types of information:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li><strong>Account Information:</strong> Name, email address, phone number, shipping address, and password when you create an account.</li>
              <li><strong>Order Information:</strong> Products purchased, payment details (processed securely through Razorpay), order history, and delivery preferences.</li>
              <li><strong>Device Information:</strong> IP address, browser type, device type, and operating system to improve our service.</li>
              <li><strong>Usage Data:</strong> Pages visited, search queries, products viewed, and interactions with our platform.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">2. How We Use Your Information</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>Process and fulfill your orders, including sending order confirmations and delivery updates.</li>
              <li>Provide customer support and respond to your inquiries.</li>
              <li>Improve our products, services, and user experience.</li>
              <li>Send personalized product recommendations and promotional offers (with your consent).</li>
              <li>Detect and prevent fraud, abuse, and security incidents.</li>
              <li>Comply with legal obligations and enforce our terms of service.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">3. Data Sharing & Disclosure</h2>
            <p>We do not sell your personal information. We may share your data with:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li><strong>Service Providers:</strong> Payment processors (Razorpay), shipping carriers, and analytics providers who need the data to perform their services.</li>
              <li><strong>Legal Compliance:</strong> When required by law, court order, or to protect our rights and safety.</li>
              <li><strong>Business Transfers:</strong> In the event of a merger, acquisition, or sale of assets, your data may be transferred.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">4. Data Security</h2>
            <p>We implement industry-standard security measures including SSL encryption, secure payment gateways, and regular security audits. However, no method of electronic storage is 100% secure. We recommend using strong passwords and keeping your account credentials confidential.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">5. Your Rights</h2>
            <p>You have the right to:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>Access and review your personal data stored with us.</li>
              <li>Request correction or deletion of your data.</li>
              <li>Opt out of marketing communications at any time.</li>
              <li>Request a copy of your data in a portable format.</li>
              <li>Withdraw consent where processing is based on consent.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">6. Cookies</h2>
            <p>We use cookies to enhance your browsing experience, analyze site traffic, and personalize content. You can control cookie preferences through your browser settings. Essential cookies are required for the site to function properly.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">7. Contact Us</h2>
            <p>If you have any questions about this Privacy Policy, please contact us:</p>
            <p className="mt-2">
              Email: support@choosemood.in<br />
              Address: ChooseMood Fashion, India
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
