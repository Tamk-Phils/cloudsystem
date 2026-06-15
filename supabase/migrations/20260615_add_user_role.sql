-- Migration: Add role column to users table for RBAC
-- NOTE: The users table already has a CHECK constraint:
--   role TEXT CHECK (role IN ('admin', 'it_staff')) DEFAULT 'it_staff'
-- This migration ensures the column exists; no need to re-add it if the table was created from schema.sql.
-- Run this ONLY if your users table is missing the role column.

ALTER TABLE public.users ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'it_staff'
  CHECK (role IN ('admin', 'it_staff'));

-- To promote a user to admin (run manually as needed):
-- UPDATE public.users SET role = 'admin' WHERE email = 'your-admin@example.com';

-- Drop and recreate RLS policies with role awareness

-- system_files: any authenticated user can read; only admins can write
DROP POLICY IF EXISTS "Allow all access to authenticated users" ON public.system_files;
DROP POLICY IF EXISTS "Authenticated users can read files" ON public.system_files;
CREATE POLICY "Authenticated users can read files"
  ON public.system_files FOR SELECT
  USING (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "Authenticated users can insert files" ON public.system_files;
CREATE POLICY "Authenticated users can insert files"
  ON public.system_files FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "Authenticated users can delete files" ON public.system_files;
CREATE POLICY "Authenticated users can delete files"
  ON public.system_files FOR DELETE
  USING (auth.role() = 'authenticated');

-- backups: any authenticated user can read, only authenticated can insert
DROP POLICY IF EXISTS "Allow all access to authenticated users" ON public.backups;
DROP POLICY IF EXISTS "Authenticated users can read backups" ON public.backups;
CREATE POLICY "Authenticated users can read backups"
  ON public.backups FOR SELECT
  USING (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "Service role can manage backups" ON public.backups;
CREATE POLICY "Service role can manage backups"
  ON public.backups FOR ALL
  USING (auth.role() = 'service_role');

-- system_logs: authenticated users can read; service role writes
DROP POLICY IF EXISTS "Allow all access to authenticated users" ON public.system_logs;
DROP POLICY IF EXISTS "Authenticated users can read logs" ON public.system_logs;
CREATE POLICY "Authenticated users can read logs"
  ON public.system_logs FOR SELECT
  USING (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "Service role can manage logs" ON public.system_logs;
CREATE POLICY "Service role can manage logs"
  ON public.system_logs FOR ALL
  USING (auth.role() = 'service_role');

-- users: authenticated users can see their own row
DROP POLICY IF EXISTS "Allow all access to authenticated users" ON public.users;
DROP POLICY IF EXISTS "Users can read own profile" ON public.users;
CREATE POLICY "Users can read own profile"
  ON public.users FOR SELECT
  USING (auth.uid() = id);
DROP POLICY IF EXISTS "Service role can manage users" ON public.users;
CREATE POLICY "Service role can manage users"
  ON public.users FOR ALL
  USING (auth.role() = 'service_role');
