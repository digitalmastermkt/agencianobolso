# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/782109cd-82c6-41d1-8008-24c1d844fd1f

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/782109cd-82c6-41d1-8008-24c1d844fd1f) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/782109cd-82c6-41d1-8008-24c1d844fd1f) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/tips-tricks/custom-domain#step-by-step-guide)

---

## 🔒 Security & Compliance

### Critical Security Features Implemented

#### ✅ Phase 1: Critical Security (COMPLETED)

1. **Secure Role-Based Access Control (RBAC)**
   - User roles stored in separate `user_roles` table with proper RLS policies
   - Users can only view their own roles
   - Admins have elevated privileges with audit logging

2. **Comprehensive Admin Audit Logging**
   - All administrative access to sensitive data is logged in `admin_access_audit` table
   - Tracks: admin actions, target users, timestamps, IP addresses, and metadata
   - Accessible via Admin Panel > Logs de Auditoria
   - Helps with LGPD/GDPR compliance

3. **Row-Level Security (RLS)**
   - All tables have proper RLS policies enabled
   - PII data protected with access controls
   - Rate limiting on sensitive operations

### ⚠️ IMPORTANT: PostgreSQL Upgrade Required

**Current Status:** PostgreSQL version needs upgrade to latest security patches.

**Action Required:**
1. Access Supabase dashboard: [Database Settings](https://supabase.com/dashboard/project/mqzbuctebbyryptmprkc/settings/infrastructure)
2. Follow upgrade guide: [Supabase Upgrade Documentation](https://supabase.com/docs/guides/platform/migrating-and-upgrading-projects)
3. **CRITICAL:** Create full database backup before upgrade
4. Test all functionality after upgrade (especially RLS policies and triggers)
5. Verify audit logging continues to work properly

### Compliance & Data Protection

- **LGPD/GDPR Ready**: Audit logs track all access to personal data
- **Rate Limiting**: Protection against brute force and abuse
- **Encrypted Connections**: All data transmitted over HTTPS
- **Session Management**: Secure JWT-based authentication with auto-refresh

### Security Best Practices for Administrators

1. **Review Audit Logs Regularly**: Check `/admin/audit-logs` weekly for suspicious activity
2. **Principle of Least Privilege**: Only grant admin access when absolutely necessary
3. **Monitor Failed Login Attempts**: Watch for patterns indicating attacks
4. **Keep Dependencies Updated**: Regularly update npm packages
5. **Backup Strategy**: Maintain regular database backups

### Reporting Security Issues

If you discover a security vulnerability, please email: [your-security-email@example.com]

Do not disclose security issues publicly until they have been addressed.
