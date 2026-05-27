import { RotateCcw } from 'lucide-react';

const RefundPolicy = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center gap-3 mb-8">
          <RotateCcw className="w-8 h-8 text-indigo-600" />
          <h1 className="text-3xl font-bold text-gray-900">Refund & Return Policy</h1>
        </div>
        <p className="text-sm text-gray-500 mb-8">Last updated: May 24, 2026</p>

        <div className="space-y-8 text-gray-700 text-sm leading-relaxed">
          <section className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <h2 className="text-lg font-semibold text-amber-800 mb-2">2-Day Refund Policy</h2>
            <p className="text-amber-700">We offer a 2-day refund window from the date of delivery. Refunds are only applicable for damaged or defective products received. No returns or exchanges are accepted for change of mind or sizing issues.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">1. Eligibility for Refund</h2>
            <p>Refunds are only accepted under the following conditions:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>The product received is damaged, defective, or significantly different from the description.</li>
              <li>The wrong product (different size, color, or item) was delivered.</li>
              <li>You must notify us within <strong>2 days</strong> of receiving the delivery.</li>
              <li>Photographic evidence of the damage or defect must be provided.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">2. Non-Returnable Items</h2>
            <p>Due to hygiene and safety reasons, the following items <strong>cannot be returned or exchanged</strong>:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>Innerwear, lingerie, and swimwear.</li>
              <li>Personal care and beauty products that have been opened or used.</li>
              <li>Customized or personalized items.</li>
              <li>Sale items and final clearance products.</li>
              <li>Products without original packaging and tags.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">3. How to Request a Refund</h2>
            <ol className="list-decimal pl-5 mt-2 space-y-2">
              <li>Contact our support team at <strong>support@choosemood.in</strong> within 2 days of delivery.</li>
              <li>Provide your order number, product details, and clear photos showing the damage or defect.</li>
              <li>Our team will review your request within 24-48 hours.</li>
              <li>Once approved, the refund will be processed to your original payment method within 5-7 business days.</li>
            </ol>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">4. Refund Processing Time</h2>
            <p className="mb-2">All refunds require admin approval and are processed within <strong>2 business days</strong> after approval.</p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Review & Approval:</strong> Within 24-48 hours of submitting your request by our admin team.</li>
              <li><strong>Refund Credit:</strong> 2 business days after admin approval, depending on your bank or payment provider.</li>
              <li><strong>Razorpay (UPI/Cards):</strong> Reflected within 2 business days after processing.</li>
              <li><strong>COD Orders:</strong> Refund processed via bank transfer within 2 business days. Please share your bank details with our support team.</li>
              <li>No refund is processed without explicit admin approval.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">5. Shipping Policy</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>Free shipping on orders above ₹499.</li>
              <li>Standard delivery: 4-7 business days.</li>
              <li>Express delivery: 2-3 business days (additional charges apply).</li>
              <li>We ship to all pincodes across India. Please use our pincode checker to verify delivery availability.</li>
              <li>Orders are processed within 24 hours of placement (excluding weekends and holidays).</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">6. Cancellation Policy</h2>
            <p>Orders can be cancelled within 24 hours of placement. After 24 hours, if the order has been shipped, cancellation will not be possible. To cancel, please contact our support team immediately.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">7. Contact Support</h2>
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

export default RefundPolicy;
