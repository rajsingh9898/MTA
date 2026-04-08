# Admin Authentication Security Details

## Current Credentials
- Stored in Supabase table `admin_credentials`
- Password is stored as bcrypt hash (`password_hash`)
- Only active credentials (`is_active = true`) are allowed

---

## 🛡️ Security Measures Implemented

### 1. SQL Injection Prevention ✅

Admin authentication uses Prisma + Supabase with parameterized queries, and includes comprehensive input validation:

- **Type Validation:** Ensures username and password are strings (not objects, arrays, etc.)
- **Input Sanitization:** Removes null bytes (`\0`) and escape characters (`\x1b`) that could be used in injection attacks
- **Maximum Length Enforcement:** 
  - Username maximum: 255 characters
  - Password maximum: 255 characters
  - This prevents buffer overflow and other length-based attacks
- **Content-Type Validation:** Only accepts `application/json` requests

### 2. Secure Password Verification ✅

Uses `bcrypt.compare()` against hashed password from Supabase. Plaintext passwords are never stored in code or database.

### 3. Information Disclosure Prevention ✅

- **Generic error messages:** Returns "Invalid username or password" for ALL failures
- **No username enumeration:** Attacker cannot determine if a username is valid by comparing response times or messages
- **Secure error logging:** Detailed errors logged only to server console, never sent to client

### 4. DoS (Denial of Service) Protection ✅

- Input length limits prevent attackers from sending massive payloads
- Type checking prevents processing of invalid data types
- Request validation at the start prevents unnecessary processing

### 5. Session Security ✅

- **JWT Tokens:** Cryptographically signed and cannot be forged
- **24-hour expiration:** Automatic session timeout
- **httpOnly Cookies:** Tokens stored securely, inaccessible from JavaScript (prevents XSS attacks from stealing tokens)
- **Secure flag:** In production, cookies only sent over HTTPS
- **SameSite=Strict:** Prevents CSRF (Cross-Site Request Forgery) attacks

### 6. Database-Backed Secret Storage ✅

- Credentials are not hardcoded in code
- Stored in Supabase with hashed password
- Rotated via setup script without code changes

---

## Security Request/Response Flow

### Request Validation
```
1. Check Content-Type header → Must be application/json
   ↓
2. Parse JSON request body
   ↓
3. Type check → Both username and password must be strings
   ↓
4. Empty check → Both must be non-empty
   ↓
5. Length check → Both must be ≤ 255 characters
   ↓
6. Sanitize → Remove null bytes and control characters
   ↓
7. Fetch active credential from Supabase with Prisma
   ↓
8. Verify password with bcrypt.compare()
   ↓
9. Return result
```

### Response Handling
```
On Success:
- Generate JWT token
- Set httpOnly, Secure (prod), SameSite=Strict cookie
- Return: { success: true, message: "Admin login successful" }

On Failure:
- Return generic error message
- NO indication of which part (username/password) failed
- NO stack trace or detailed error information leaked
- Status code: 401 Unauthorized
```

---

## Attack Scenarios Prevented

| Attack Type | Prevention Method | Status |
|------------|-------------------|--------|
| **SQL Injection** | Prisma parameterized query + input validation | ✅ Protected |
| **Timing Attacks** | bcrypt hash verification + 1s artificial delay on failure | ✅ Protected |
| **Username Enumeration** | Generic error messages on all auth routes | ✅ Protected |
| **Buffer Overflow** | Max length validation (255 chars) + 100kb body-size limit in middleware | ✅ Protected |
| **XSS (Session Token Theft)** | httpOnly cookies + Content-Security-Policy header | ✅ Protected |
| **CSRF** | SameSite=Strict cookies + Origin/Referer check in middleware | ✅ Protected |
| **DoS via Large Payloads** | Input length limits + 413 check via Content-Length in middleware | ✅ Protected |
| **Brute Force** | Rate limiting: 5 attempts/IP/15 min with Retry-After + 1s delay | ✅ Protected |

---

## ✅ Implemented Security Enhancements

### Brute Force Protection
- **5 login attempts** per IP per **15 minutes** on admin login endpoint
- **1-second artificial delay** on all failed authentication responses (slows credential stuffing)
- Returns `429 Too Many Requests` with a `Retry-After` header
- Rate-limited via in-memory bucket (`src/lib/rate-limit.ts`)

### Content-Security-Policy (XSS Hardening)
- Sets `Content-Security-Policy` header via `middleware.ts` on all responses
- `default-src 'self'`, `frame-ancestors 'none'`, `form-action 'self'`
- Limits where scripts/styles/images/fonts can be loaded from

### CSRF Origin Check (Belt-and-Suspenders)
- Middleware validates `Origin` and `Referer` headers on all `POST/PUT/PATCH/DELETE /api/*` requests
- Returns `403 Forbidden` if request comes from an unexpected origin
- Works alongside `SameSite=Strict` cookies for double protection

### Body-Size DoS Protection
- Middleware checks `Content-Length` header on every request
- Returns `413 Content Too Large` for payloads over **100 KB**

### Public API Rate Limiting
- `/api/auth/register` — 10 attempts/IP/min (already implemented)
- `/api/auth/forgot-password` — 5 attempts/IP/15 min *(newly added)*
- `/api/itinerary/generate` — 5 generations/IP/10 min *(newly added, protects AI API costs)*

### Email Enumeration Fix
- `forgot-password` route previously returned `404` when email not found (revealing valid emails)
- Now always returns `200` with a generic message regardless of registration status

---

## Future Security Enhancements

To further improve security in production, consider implementing:

1. **Multi-Factor Authentication (MFA)**
   - Add TOTP (Time-based One-Time Password) support
   - Require additional verification for admin access
   - Use authenticator apps like Google Authenticator

2. **IP Whitelisting**
   - Restrict admin access to specific IP addresses
   - Allow emergency access from backup IPs
   - Enable/disable per admin user

3. **Login Attempt Logging & Alerting**
   - Persist failed attempts to database (current in-memory store resets on restart)
   - Alert on multiple failed attempts via email
   - Generate audit reports for compliance

4. **Session Activity Tracking**
   - Log all actions performed in admin panel
   - Track when admin accesses sensitive data

5. **Environment-Based Credentials**
   - Store credentials in environment variables
   - Use secrets management service (AWS Secrets Manager, Vault, etc.)
   - Rotate credentials regularly

6. **HTTPS Enforcement**
   - Set to production environment to enforce HTTPS
   - HSTS already configured (max-age=63072000; includeSubDomains; preload)
   - Prevent man-in-the-middle attacks

7. **Tighten CSP for Production**
   - Replace `unsafe-inline`/`unsafe-eval` with nonce-based CSP
   - Next.js supports nonces in production via custom `_document`

---

## Verification Checklist

- ✅ Credentials stored in Supabase only (not in source code)
- ✅ Input validation prevents SQL injection
- ✅ bcrypt hash verification hardens credential checks against timing abuse
- ✅ Generic error messages prevent username enumeration
- ✅ httpOnly cookies prevent XSS token theft
- ✅ SameSite cookies prevent CSRF
- ✅ Maximum length enforcement prevents DoS
- ✅ No detailed error information leaked to client
- ✅ JWT token expiration set to 24 hours
- ✅ Content-Type validation enforced

---

## Testing Security

To verify the security measures are working:

```bash
# Test with invalid JSON
curl -X POST http://localhost:3000/api/admin/login \
  -H "Content-Type: text/plain" \
  -d "username=admin&password=admin123"
# Expected: 400 - Content-Type must be application/json

# Test with extremely long password
curl -X POST http://localhost:3000/api/admin/login \
   -H "Content-Type: application/json" \
   -d "{\"username\":\"test\",\"password\":\"$(printf 'A%.0s' {1..300})\"}"
# Expected: 400 - Input exceeds maximum allowed length

# Test with null bytes (if possible in your client)
# Expected: Input sanitized and rejected

# Test timing attack (measure response times)
# All wrong credentials should take roughly the same time to respond
```

---

## Admin Panel Access

Once authenticated, the admin panel provides:
- Real-time statistics (users, destinations, trips, etc.)
- Recent trips overview
- User management (future: add ability to manage users)
- Destination management (future: add CRUD operations)
- Secure logout functionality

All admin access is protected and requires valid credentials.
