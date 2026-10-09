# Billplz Payment Gateway Integration & Setup Guide

This document describes how to configure, connect, and verify the Billplz payment gateway on the Bilingual Idol Language Centre (BILC) platform.

---

## 🔗 Official Billplz Documentation & References

Before starting, refer to the following official resources:
1. **API v3 Reference / Create a Bill**: [Billplz API v3 - Bills](https://www.billplz.com/api#bills)
2. **Signature & Verification**: [Billplz X-Signature Verification](https://www.billplz.com/api#x-signature)
3. **Webhook Callback Service**: [Billplz Callback Subscriptions](https://www.billplz.com/api#callbacks)
4. **Sandbox / Staging Environment**: [Billplz Sandbox Registration](https://www.billplz-sandbox.com/)

---

## ⚙️ Environment Variables Configuration

The entire Billplz integration is configured strictly using server-side environment variables. To keep your credentials secure, keys **never** leak into the client-side bundle, audit logs, or API responses.

Add the following variables to your private `.env` file (refer to `.env.example` for placeholders):

```bash
# ==========================================================================
# BILLPLZ GATEWAY CONFIGURATION
# ==========================================================================

# 1. Enable or disable Billplz gateway ("true" / "false")
BILLPLZ_ENABLED=true

# 2. Billplz API Secret Key (retrieved from dashboard Settings -> Keys & Integration)
BILLPLZ_API_KEY=your_api_secret_key_here

# 3. Billplz Collection ID (representing your merchant account / payment channel)
BILLPLZ_COLLECTION_ID=your_collection_id_here

# 4. X-Signature Verification Key (exclusively used to sign callbacks and redirects)
BILLPLZ_SIGNATURE_KEY=your_x_signature_key_here

# 5. Sandbox Mode Flag ("true" for staging/sandbox, "false" for live production)
BILLPLZ_SANDBOX=true

# 6. Public Webhook Callback URL (absolute URL where Billplz sends payment status updates)
# Note: In development, you can use a ngrok/tunnel URL.
BILLPLZ_CALLBACK_URL=https://your-domain.com/api/payments/callback

# 7. Post-Payment Redirect URL (where the user's browser is sent after transaction)
BILLPLZ_REDIRECT_URL=https://your-domain.com/api/payments/redirect
```

---

## 🛠️ Step-by-Step Connection Instructions

### Step 1: Create a Billplz Account
1. For development and testing, register a sandbox merchant account at [Billplz Sandbox](https://www.billplz-sandbox.com/).
2. For live production payments, register a verified account at [Billplz Live](https://www.billplz.com/).

### Step 2: Create a Collection
1. Navigate to your Billplz Dashboard.
2. Click **Billing** -> **Collections** -> **Create Collection**.
3. Name your collection (e.g., `Bilingual Idol Language Centre Tuition`) and click save.
4. Copy the generated **Collection ID** (e.g., `8wq99s_k`) and paste it as `BILLPLZ_COLLECTION_ID` in your environment.

### Step 3: Retrieve your API & X-Signature Keys
1. In your dashboard, click your profile arrow in the top right and select **Settings**.
2. Scroll to the **KEYS & INTEGRATION** section.
3. Copy your **API Secret Key** and paste it as `BILLPLZ_API_KEY`.
4. Check the **X Signature** checkbox to activate signature validation on Billplz's side.
5. Copy your **X Signature Key** and paste it as `BILLPLZ_SIGNATURE_KEY`. **Do not confuse this with your standard API key.**

### Step 4: Whitelist Server IP Address (Recommended)
To prevent mock callbacks from malicious third parties:
- Whitelist Billplz's callback server IP address: `13.250.178.132`.
- Ensure `BILLPLZ_SIGNATURE_KEY` is present, as any callback failing signature verification is rejected automatically on our server.

---

## 🔒 Security & Verification Details

1. **Amount Format**: The Billplz API strictly processes amounts in **cents** (e.g. RM 750.00 is passed as integer `75000` to avoid float precision rounding discrepancies).
2. **Signature Verification Algorithm**:
   - Gathers all callback parameters (except `x_signature`).
   - Removes any brackets from the keys (e.g. `billplz[id]` becomes `billplzid`).
   - Concatenates each key-value pair directly (`keyvalue`).
   - Sorts the source strings in case-insensitive ascending order.
   - Joins them together using a pipe (`|`) delimiter.
   - Computes an HMAC-SHA256 signature using your `BILLPLZ_SIGNATURE_KEY` as the secret key.
   - Compares the calculated signature in a timing-safe way with the `x_signature` header value.

---

## 🧑‍💻 Manual Approvals (Fallback)

If `BILLPLZ_ENABLED` is `false` or the keys are unconfigured:
- The student's dashboard will display the total tuition due, but hide the checkout button, prompting them with local admissions office contacts (email and support line).
- **Manual mark as Paid**: Admin or Founder can log into the Admin portal, navigate to **Dues & Gateway Status**, and manually approve/mark any student payment record as completed/failed/refunded.
- Manual approvals require an administrative note detailing the reason (e.g., Cash settled on campus, verified bank wire transfer, etc.) and are permanently logged to the system's tamper-evident **Audit Logs** for absolute financial tracking.
