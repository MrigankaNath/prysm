require("dotenv").config();
const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

function extractToken(req) {
  const authHeader = req.headers.authorization || "";
  return authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
}

async function requireAuth(req, res, next) {
  const token = extractToken(req);

  if (!token) {
    return res.status(401).json({ error: "Missing bearer token" });
  }

  const { data, error } = await supabase.auth.getUser(token);

  if (error || !data.user) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }

  req.userId = data.user.id;
  req.userEmail = data.user.email;
  next();
}

async function optionalAuth(req, res, next) {
  const token = extractToken(req);

  if (token) {
    const { data } = await supabase.auth.getUser(token);
    if (data?.user) {
      req.userId = data.user.id;
      req.userEmail = data.user.email;
    }
  }

  next();
}

module.exports = { supabase, requireAuth, optionalAuth };
