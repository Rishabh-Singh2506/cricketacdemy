// api/adminLogin.js
// Vercel Serverless Function
// Set these in Vercel Dashboard → Settings → Environment Variables:
//   ADMIN_EMAIL   → your admin email
//   ADMIN_PASSWORD → your admin password

export default function handler(req, res) {
  // Only allow POST
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, message: "Method not allowed" });
  }

  const { email, password } = req.body;

  const validEmail    = process.env.ADMIN_EMAIL;
  const validPassword = process.env.ADMIN_PASSWORD;

  if (!validEmail || !validPassword) {
    console.error("Environment variables ADMIN_EMAIL or ADMIN_PASSWORD not set.");
    return res.status(500).json({ success: false, message: "Server misconfigured" });
  }

  if (email === validEmail && password === validPassword) {
    return res.status(200).json({ success: true });
  }

  return res.status(401).json({ success: false, message: "Invalid credentials" });
}
