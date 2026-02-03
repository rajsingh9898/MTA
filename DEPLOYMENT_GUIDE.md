# 🚀 MTA Deployment Guide

## Option 1: Vercel (Recommended)

### Why Vercel?
- ✅ Built for Next.js apps
- ✅ Automatic deployments from Git
- ✅ Free SSL certificates
- ✅ Global CDN
- ✅ Easy environment variables

### Steps:
1. **Install Vercel CLI**:
   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel**:
   ```bash
   vercel login
   ```

3. **Deploy**:
   ```bash
   vercel --prod
   ```

4. **Set Environment Variables** in Vercel Dashboard:
   - `DATABASE_URL`
   - `NEXTAUTH_SECRET`
   - `NEXTAUTH_URL`

## Option 2: Netlify

### Steps:
1. **Install Netlify CLI**:
   ```bash
   npm i -g netlify-cli
   ```

2. **Build and Deploy**:
   ```bash
   pnpm build
   netlify deploy --prod --dir=.next
   ```

## Option 3: Railway (Full-stack)

### Steps:
1. **Install Railway CLI**:
   ```bash
   npm install -g @railway/cli
   ```

2. **Login and Deploy**:
   ```bash
   railway login
   railway up
   ```

## Required Environment Variables

```env
DATABASE_URL=your_postgresql_connection_string
NEXTAUTH_SECRET=your_random_secret_string
NEXTAUTH_URL=https://your-domain.com
```

## Database Deployment

### Option A: Supabase (Recommended)
1. Go to [supabase.com](https://supabase.com)
2. Create new project
3. Get connection string
4. Run migrations:
   ```bash
   pnpm prisma db push
   ```

### Option B: Railway PostgreSQL
1. Add PostgreSQL service in Railway
2. Get connection string
3. Update environment variables

## Post-Deployment Checklist

- [ ] Test all pages load correctly
- [ ] Test login/logout functionality
- [ ] Test trip creation workflow
- [ ] Test mobile responsiveness
- [ ] Check for console errors
- [ ] Verify SSL certificate
- [ ] Test database connection

## Domain Setup

### Custom Domain (Vercel):
1. Go to Vercel Dashboard → Project → Domains
2. Add your custom domain
3. Update DNS records
4. SSL certificate auto-generated

## Monitoring

### Vercel Analytics:
- Built-in performance monitoring
- Error tracking
- Usage analytics

### Alternative: Sentry
```bash
npm install @sentry/nextjs
```

## Production Optimizations

Your app is already optimized with:
- ✅ Next.js Image optimization
- ✅ Automatic code splitting
- ✅ Static generation where possible
- ✅ Minified CSS/JS
- ✅ Gzip compression

## Troubleshooting

### Common Issues:
1. **Database Connection**: Check DATABASE_URL format
2. **Auth Issues**: Verify NEXTAUTH_URL matches domain
3. **Build Errors**: Check Node.js version (18+)
4. **Environment Variables**: Ensure all are set in production

### Commands:
```bash
# Check build locally
pnpm build

# Start production server locally
pnpm start

# Check environment
vercel env ls
```

## Security Checklist

- [ ] Environment variables are set
- [ ] Database connection is secure (SSL)
- [ ] NextAuth is properly configured
- [ ] CORS is configured correctly
- [ ] Rate limiting is implemented
- [ ] Error messages don't leak sensitive info

## Performance Monitoring

Use these tools:
- [Lighthouse](https://developers.google.com/web/tools/lighthouse)
- [PageSpeed Insights](https://pagespeed.web.dev/)
- [Web Vitals](https://web.dev/vitals/)

Your MTA app is production-ready! 🎉
