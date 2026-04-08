const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.SUPABASE_URL
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY

/**
 * Middleware to verify Supabase JWT token
 * Extracts the user from the Authorization header and attaches to req.user
 */
async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing or invalid authorization header' })
    }

    const token = authHeader.split(' ')[1]

    // Create a Supabase client with the user's token to verify it
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    })

    const { data: { user }, error } = await supabase.auth.getUser(token)

    if (error || !user) {
      return res.status(401).json({ error: 'Invalid or expired token' })
    }

    req.user = user
    req.token = token
    next()
  } catch (err) {
    console.error('[Auth] Error:', err.message)
    res.status(500).json({ error: 'Authentication failed' })
  }
}

/**
 * Optional auth — doesn't block if no token, just doesn't set req.user
 */
async function optionalAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next()
    }
    await authenticate(req, res, next)
  } catch {
    next()
  }
}

module.exports = { authenticate, optionalAuth }
