# UniBackup Setup Guide

This guide will help you deploy the Cloud Backup and Disaster Recovery System for your university.

## Prerequisites
- **Node.js**: v18 or later
- **PostgreSQL Client**: `pg_dump` and `psql` must be available in the system PATH.
- **Supabase Project**: An active project for Database and Auth.
- **AWS S3 Bucket**: A bucket with programmatic access.

## Environment Variables
Create a `.env` file in the root directory and fill in the following:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

# AWS S3
# AWS S3 (Renamed for Netlify compatibility)
STORAGE_AWS_ACCESS_KEY_ID=your-aws-access-key-id
STORAGE_AWS_SECRET_ACCESS_KEY=your-aws-secret-access-key
STORAGE_AWS_REGION=your-aws-region
STORAGE_AWS_BUCKET_NAME=your-s3-bucket-name

# Backup Encryption (32 characters recommended)
BACKUP_ENCRYPTION_KEY=your-32-byte-encryption-key

# Database Connection (Direct URL for pg_dump)
DATABASE_URL=postgresql://postgres:[password]@db.[project-id].supabase.co:5432/postgres

# Email (Nodemailer)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
EMAIL_FROM_NAME="UniBackup Alerts"
```

## Database Setup
1. Open the Supabase SQL Editor.
2. Run the contents of `lib/supabase/schema.sql` to create the required tables and security policies.

## Installation
```bash
npm install
```

## Running the System
```bash
npm run dev
```
The server will start at `http://localhost:3000`.

## Testing the System
1. **Login**: Go to `/login` (You'll need to create a user in Supabase Auth first).
2. **Manual Backup**: On the Dashboard, click **Backup Now**. Check the **Backups** page to see the encrypted record.
3. **File Backup**: Go to **Backups**, click **Backup File**, and upload a PDF or image.
4. **Restore**: Go to **Recovery**, select a restore point, and click **Confirm Restoration**.
5. **Real-time**: Observe the status changes on the dashboard without refreshing.
