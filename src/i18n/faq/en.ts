import type { FaqCategory } from "./types";

const en: FaqCategory[] = [
  {
    id: "getting-started",
    title: "Getting Started",
    questions: [
      { id: "create-account", q: "How do I create an account?", keywords: "sign up register signup email", a: "Tap **Get Started** and enter your email and a password. We'll send you a confirmation email — click the link inside to activate your account. You can browse services and lost-pet listings without signing in, but you'll need an account to book, message, or list." },
      { id: "no-confirmation-email", q: "I didn't get my confirmation email — what should I do?", keywords: "email not received spam verify", a: "Check your spam or junk folder first. If it's not there after a few minutes, request a new confirmation link from the sign-in screen. Make sure the email address you used is spelled correctly." },
      { id: "owner-vs-provider", q: "What's the difference between a Pet Owner and a Service Provider?", keywords: "both sitter account type user", a: "A **Pet Owner** books services, buys or adopts pets, and reports lost pets. A **Service Provider** lists services (walking, sitting, grooming, boarding, and more) and accepts bookings. You can be **both at once** — your account type adapts automatically based on the services you set up." },
      { id: "verify-profile", q: "How do I verify my profile and build trust?", keywords: "certification badge photo bio trust", a: "Add a clear profile photo, complete your bio, and fill in your country and city. Service providers can attach certifications to each listing (for example Pet First Aid & CPR, DVM, or Fear Free Certified) so owners can see your credentials at a glance." },
      { id: "add-payment-method", q: "How do I add a payment method?", keywords: "card credit settings payments", a: "Go to [Settings](/settings) → Payments and add a card. You'll need a saved payment method on file to pay for a booking — if you try to pay without one, we'll send you straight there to add one." },
    ],
  },
  {
    id: "finding-booking",
    title: "Finding & Booking a Service",
    questions: [
      { id: "how-to-search", q: "How do I search for a service?", keywords: "filter browse find sitter walker groomer vet", a: "Open [Browse Services](/browse) and filter by service type, location, dates, minimum rating, and number of past bookings. Sort by price, rating, newest, or popularity to find the right match." },
      { id: "map-list-views", q: "How do the map and list views work?", keywords: "leaflet pin toggle desktop mobile", a: "On desktop you can split the screen into **Map + List** side-by-side, or view the list only. On mobile, switch between the list and a full-screen map. Hovering or tapping a card highlights its pin on the map, and clustered pins spread out so nothing hides underneath." },
      { id: "service-types", q: "What types of services can I book?", keywords: "sitting walking grooming boarding daycare drop-in veterinarian vet", a: "Seven service types: **Pet Sitting** (date range at your home), **Dog Walking** (per walk, 30 or 60 min), **Grooming** (per session, in-shop or mobile), **Boarding** (per night at the provider), **Daycare** (full or half day), **Drop-in Visits** (short visits at your home), and **Veterinarian** appointments. Each type has its own date, time, and pricing logic." },
      { id: "booking-flow", q: "How does booking work step by step?", keywords: "request accept confirm pay pending", a: "Pick a service, choose your date/time and which pets are coming, then submit a request. The provider reviews it and accepts or declines. Once accepted, you pay through the platform and the booking appears on your [Bookings](/bookings) page with a live status." },
      { id: "cancellation-policy", q: "What is the cancellation policy?", keywords: "refund cancel fee 48 hours", a: "You get a **full refund** if you cancel at least **48 hours** before the start time, or if the provider cancels. If you cancel within 48 hours, a **partial refund** applies (50% of the service fee). Booking fees are refunded in line with the same policy." },
    ],
  },
  {
    id: "becoming-provider",
    title: "Becoming a Service Provider",
    questions: [
      { id: "list-first-service", q: "How do I list my first service?", keywords: "wizard setup create listing add new", a: "From your [Dashboard](/dashboard), complete the provider setup wizard: choose your service types, set your city and country, and write a short bio (at least 20 characters). Then create a listing with a title, price, photos, and a description." },
      { id: "multiple-listings", q: "Can I offer more than one service?", keywords: "two same category multiple listings", a: "Yes. You can create as many listings as you like — even multiple under the same category (for example, two grooming options at different price points). Each listing is managed separately from your dashboard, and you can also list pets for sale or adoption alongside your services." },
      { id: "required-profile-info", q: "What profile information do providers need?", keywords: "certifications photos biography working hours", a: "At minimum: a profile photo, full name, country and city, and a bio. On each listing you can add a photo gallery (up to 5 photos), the specific services you offer, relevant **certifications**, working hours per weekday, slot duration, and type-specific details (like whether a groomer is mobile, or a boarding facility's property type)." },
      { id: "edit-delete-listing", q: "How do I edit or delete a listing?", keywords: "pause remove update", a: "Open the listing from your dashboard and use **Edit** or **Delete**. You can also pause a listing to temporarily hide it from search results without losing its details, then reactivate it whenever you're ready." },
    ],
  },
  {
    id: "pets-sale-adoption",
    title: "Pets for Sale & Adoption",
    questions: [
      { id: "sale-vs-adoption", q: "What's the difference between \u201CFor Sale\u201D and \u201CFor Adoption\u201D?", keywords: "free rehome price donate", a: "**For Sale** listings have a set price. **For Adoption** (sometimes called \u201CFor Free\u201D) listings have no price — the goal is to rehome the pet to a good home. Both support up to 5 photos, vaccination records, certificates, and compatibility notes (child-friendly, good with dogs or cats)." },
      { id: "make-offer", q: "How does \u201CMake an Offer\u201D work?", keywords: "negotiate price lower minimum 30 percent", a: "On a For Sale listing you can offer less than the asking price. The minimum acceptable offer is **30% below** the listed price — in other words, at least 70% of the price. The seller then accepts or declines your offer. Adoption listings use a simple request instead of an offer." },
      { id: "offer-limit", q: "Is there a limit on offers?", keywords: "20 daily cap per day platform", a: "Yes. To keep things fair, the platform allows **20 offers per day** across all users combined. The counter resets every 24 hours, and you'll see how many are left right on the listing page." },
      { id: "after-offer-accepted", q: "What happens after my offer is accepted?", keywords: "escrow pickup code confirm receipt", a: "You pay into **escrow** to secure the pet. The seller then generates a 4-digit **pickup code**. When you collect the pet, you enter the code to confirm receipt and the sale completes. If the buyer doesn't pay before the deadline, the seller can cancel and relist automatically." },
      { id: "adoption-flow", q: "How do adoptions work?", keywords: "free collection request accept", a: "For Adoption listings skip payment and escrow entirely. You send a request, the current owner reviews it and accepts, then you arrange collection directly between yourselves." },
    ],
  },
  {
    id: "payments-commissions",
    title: "Payments & Commissions",
    questions: [
      { id: "fee-structure", q: "How are fees and commissions calculated?", keywords: "18 percent 10 cap 45 tip pet sale 8 5 adoption free 0", a: "**Service bookings:** Providers are charged an **18% commission** on their earnings. Buyers pay up to a **10% fee**, capped at **€45**.\n\n**Pet sales:** Sellers are charged an **8% commission** (capped at €150) on the agreed price. Buyers pay a **5% fee** (capped at €80) on top. Example: a €100 sale costs the buyer €105, and the seller receives €92.\n\n**Pet adoptions:** Listing a pet for free adoption or rehoming costs **nothing** — 0% commission. We believe rehoming a pet is an act of kindness, and we're here to support that process.\n\n**Tips** go entirely to the provider — 0% commission on tips." },
      { id: "when-providers-paid", q: "When do providers get paid?", keywords: "payout earnings release completed transfer", a: "Earnings are released when a booking is marked complete. Providers are prompted to connect a Stripe account for payouts once live payment processing is enabled. You can track earnings on your Earnings page." },
      { id: "refund-policy", q: "How do refunds work?", keywords: "money back return cancel", a: "Refunds follow the cancellation policy: a full refund if you cancel 48+ hours ahead or the provider cancels, and a partial refund within 48 hours. Approved refunds return to your original payment method." },
      { id: "payment-security", q: "Is my payment information secure?", keywords: "card details safe stripe last4", a: "We only store the last four digits and brand of your card — never the full number. Payment processing is handled by our payment partner when live mode is active. See our [Terms](/terms-and-conditions) for the full detail." },
    ],
  },
  {
    id: "reviews-ratings",
    title: "Reviews & Ratings",
    questions: [
      { id: "how-ratings-calculated", q: "How are ratings calculated?", keywords: "average stars score", a: "A provider's rating is the simple average of all star ratings left on completed bookings. Every review counts equally — there's no weighting or hidden scoring." },
      { id: "who-can-review", q: "Who can leave a review?", keywords: "buyer seller owner feedback", a: "For service bookings, the **pet owner** can leave a review once the booking is completed. For pet sales, **both the buyer and the seller** can review each other after the order completes — so both sides are accountable." },
      { id: "edit-review", q: "Can I edit or update my review?", keywords: "change update modify", a: "For **pet sales**, yes — you can update your review at any time. For **service bookings**, reviews can't be edited once submitted, so please check yours carefully before posting." },
      { id: "repeat-customers", q: "What does \u201Crepeat customers\u201D mean on a profile?", keywords: "returning booking count metric", a: "It's an estimate based on a provider's booking history, shown to give a sense of how much repeat business a provider tends to get. It's a handy signal, not a precise headcount." },
    ],
  },
  {
    id: "messaging",
    title: "Messaging & Communication",
    questions: [
      { id: "contact-provider", q: "How do I contact a provider or buyer?", keywords: "message chat send text", a: "Use the **Message** button on any service page, pet listing, booking, or order. This opens a private 1-to-1 chat. You'll need to be signed in. You can also reach out via a direct message link." },
      { id: "response-time", q: "How quickly should I expect a reply?", keywords: "fast response notification time", a: "Response times vary from person to person. We notify the other side the instant you send a message, so most replies come within a day. If you're waiting too long, a friendly follow-up helps." },
      { id: "send-photos", q: "Can I send photos in a message?", keywords: "attachment image proof picture", a: "Yes — you can attach photos in a conversation. This is handy for sharing proof of a found pet, pet updates during a booking, or any service details you want to confirm visually." },
      { id: "notifications", q: "How do message notifications work?", keywords: "bell realtime alert push", a: "You'll get an in-app bell alert for every new message, booking update, or important event, updated in real time. Messages you've opened are marked as read automatically. You can fine-tune some preferences in [Settings](/settings)." },
    ],
  },
  {
    id: "trust-safety",
    title: "Trust & Safety",
    questions: [
      { id: "photo-moderation", q: "How are profile photos moderated?", keywords: "ai inappropriate avatar check", a: "Profile photos are checked by automated moderation before they go live. Clearly safe images are approved instantly, clearly unsafe ones are rejected, and borderline cases are flagged for a closer look. This keeps the community authentic without slowing you down." },
      { id: "disputes", q: "What if something goes wrong with a pet sale?", keywords: "dispute evidence resolve problem escrow", a: "If a problem arises while an order is in escrow or completed, either the buyer or seller can **open a dispute** with a reason and up to 5 evidence photos. Our team reviews the details and helps reach a resolution. Always include clear evidence — it speeds things up." },
      { id: "report-listing", q: "How do I report a listing or user?", keywords: "flag inappropriate report abuse", a: "If you see something that doesn't look right and there's no report button handy on that page, please [contact us](/contact-us) directly with the details and we'll look into it." },
      { id: "data-protection", q: "Is my personal information protected?", keywords: "gdpr data privacy rights", a: "Yes. Your data is handled in line with our [Privacy Centre](/privacy-centre), which explains your rights — including access, correction, and deletion — and how to exercise them." },
    ],
  },
  {
    id: "lost-pets",
    title: "Lost Pets",
    questions: [
      { id: "report-lost-pet", q: "How do I report a lost pet?", keywords: "create ad missing lost dashboard", a: "From your [Dashboard](/dashboard), tap **Report Lost Pet**. Add at least one photo (up to two), your pet's details and distinguishing marks, and where and when they were last seen. You can start from a registered pet to auto-fill the basics, or enter everything fresh." },
      { id: "rewards", q: "How do rewards work?", keywords: "money pledge finder pay", a: "When you post a lost pet you can optionally add a **reward** amount. It's shown on the listing and on the printable flyer as a pledge — you arrange payment directly with the finder once your pet is safely home." },
      { id: "found-my-pet", q: "Someone found my pet — what happens next?", keywords: "claim finder proof email reply", a: "When someone taps **I Found This Pet** on your listing, they send proof photos and a message. You'll get a private message with those photos, an in-app notification, and an email alert. Review the proof, then reply to coordinate the return." },
      { id: "print-flyer", q: "Can I print a flyer for my lost pet?", keywords: "poster pdf a4 share", a: "Yes. Every lost-pet listing has a print-friendly **flyer** — an A4 layout with both photos side-by-side, your bold contact number, and the last-seen address. You can also share the listing to Facebook, X, or WhatsApp directly." },
    ],
  },
  {
    id: "account-privacy",
    title: "Account & Privacy",
    questions: [
      { id: "update-profile", q: "How do I update my profile details?", keywords: "edit name photo bio location", a: "Go to [Settings](/settings) to change your photo, full name, gender, bio, contact details, and location. Changes save instantly to your profile." },
      { id: "manage-notifications", q: "How do I manage my notification and cookie preferences?", keywords: "push analytics marketing preferences", a: "Some notification and push preferences can be adjusted in [Settings](/settings). For analytics and marketing cookies, visit the [Cookie Settings](/cookies) page anytime." },
      { id: "delete-account", q: "How do I delete my account?", keywords: "remove close remove data", a: "On your profile page, open the **Delete Account** option. You'll confirm and pick a reason (with an \u201COther\u201D option for anything else). After deletion, your email becomes available again if you ever want to create a new account." },
      { id: "gdpr-rights", q: "What are my GDPR rights?", keywords: "access correct delete data protection law", a: "You have the right to access, correct, and delete your personal data, among others. Our [Privacy Centre](/privacy-centre) breaks down each right and exactly how to exercise it." },
    ],
  },
  {
    id: "general",
    title: "General / Other",
    questions: [
      { id: "countries-languages", q: "Which countries and languages are supported?", keywords: "region currency language english", a: "PET BASE supports a wide range of countries — including the US, Canada, the UK, Ireland, EU members, Australia, New Zealand, and more. The app is available in multiple languages, and you can switch currency and language from your settings." },
      { id: "contact-support", q: "How do I contact customer support?", keywords: "help support team email", a: "For anything this FAQ doesn't cover, head to our [Contact Us](/contact-us) page. Pick a subject, tell us what's going on, and we'll get back to you." },
      { id: "give-feedback", q: "How do I give feedback or suggest a feature?", keywords: "suggest idea improve comment", a: "We'd love to hear it. Send feedback through the [Contact Us](/contact-us) page and select \u201CGeneral Inquiry\u201D or \u201COther\u201D — real suggestions help shape what we build next." },
    ],
  },
];

export default en;
