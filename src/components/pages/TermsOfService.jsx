import { FileText } from 'lucide-react';

const TermsOfService = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center gap-3 mb-8">
          <FileText className="w-8 h-8 text-indigo-600" />
          <h1 className="text-3xl font-bold text-gray-900">Terms of Service</h1>
        </div>
        <p className="text-sm text-gray-500 mb-8">Last updated: May 24, 2026</p>

        <div className="space-y-8 text-gray-700 text-sm leading-relaxed">
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">1. Acceptance of Terms</h2>
            <p>By accessing or using ChooseMood ("the Platform"), you agree to be bound by these Terms of Service. If you do not agree, please do not use our services. We reserve the right to update these terms at any time, and continued use constitutes acceptance of the changes.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">2. Account Registration</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>You must provide accurate, current, and complete information during registration.</li>
              <li>You are responsible for maintaining the confidentiality of your account credentials.</li>
              <li>You must notify us immediately of any unauthorized use of your account.</li>
              <li>We reserve the right to suspend or terminate accounts found to be fraudulent or in violation of these terms.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">3. Products & Pricing</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>All product descriptions, images, and pricing are subject to change without notice.</li>
              <li>We strive to display accurate colors and details, but we cannot guarantee your monitor's display accuracy.</li>
              <li>We reserve the right to modify, discontinue, or limit the quantity of any product.</li>
              <li>In the event of a pricing error, we reserve the right to cancel the order and issue a full refund.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">4. Orders & Payments</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>All payments are processed securely through Razorpay.</li>
              <li>We accept UPI, credit/debit cards, net banking, and Cash on Delivery (COD).</li>
              <li>Order confirmation does not guarantee stock availability. We may cancel orders if the product is out of stock.</li>
              <li>You agree to pay all charges associated with your order, including applicable taxes and shipping fees.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">5. User Conduct</h2>
            <p>You agree not to:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>Use the Platform for any unlawful purpose or violate any applicable laws.</li>
              <li>Attempt to gain unauthorized access to any part of the Platform.</li>
              <li>Interfere with the proper functioning of the Platform, including introducing malware.</li>
              <li>Impersonate any person or entity or provide false information.</li>
              <li>Engage in any activity that could harm, disable, or overburden our servers.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">6. Intellectual Property</h2>
            <p>All content on the Platform, including logos, text, images, graphics, and software, is the property of ChooseMood and is protected by applicable intellectual property laws. You may not reproduce, distribute, or create derivative works without our express written consent.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">7. Limitation of Liability</h2>
            <p>ChooseMood shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of the Platform. Our total liability is limited to the amount paid by you for the product in question.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">8. Governing Law</h2>
            <p>These terms shall be governed by and construed in accordance with the laws of India. Any disputes arising under these terms shall be subject to the exclusive jurisdiction of the courts in India.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">9. Contact</h2>
            <p>
              Email: support@choosemood.in<br />
              Response Time: Within 24 hours
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default TermsOfService;
