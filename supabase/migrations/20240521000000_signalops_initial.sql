-- SignalOps: initial schema with RLS and multi-tenant isolation
-- Extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Enums
DO $$ BEGIN
  CREATE TYPE public.member_role AS ENUM ('owner', 'admin', 'member');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.project_member_role AS ENUM ('pm', 'admin', 'contributor', 'viewer');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.project_status AS ENUM ('active', 'on_hold', 'completed', 'archived');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.milestone_status AS ENUM ('planned', 'in_progress', 'at_risk', 'completed', 'missed');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.task_status AS ENUM ('todo', 'in_progress', 'blocked', 'done');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.blocker_status AS ENUM ('open', 'resolved');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.risk_severity AS ENUM ('low', 'medium', 'high', 'critical');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.risk_status AS ENUM ('open', 'mitigating', 'closed');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.reminder_channel AS ENUM ('in_app', 'email', 'slack');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.reminder_status AS ENUM ('scheduled', 'sent', 'cancelled');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.integration_type AS ENUM ('slack', 'gmail', 'google_sheets');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.integration_status AS ENUM ('connected', 'error', 'disconnected');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.transcript_source AS ENUM ('zoom', 'google_meet', 'plaintext');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.transcript_status AS ENUM ('processing', 'completed', 'failed');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.transcript_entity_type AS ENUM (
    'action_item', 'decision', 'risk', 'deadline', 'milestone_update', 'participant', 'dependency'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.operational_event_source AS ENUM (
    'slack', 'gmail', 'meeting', 'manual', 'ai', 'sheets', 'system'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.suggestion_status AS ENUM ('draft', 'pending_approval', 'approved', 'rejected');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.draft_channel AS ENUM ('gmail_draft', 'slack_channel', 'slack_dm');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.draft_status AS ENUM ('draft', 'pending_approval', 'approved', 'sent', 'discarded');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.approval_status AS ENUM ('pending', 'approved', 'rejected');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Profiles (application user row linked to auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles (email) WHERE deleted_at IS NULL;

-- Organizations (tenant)
CREATE TABLE IF NOT EXISTS public.organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.organization_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  role public.member_role NOT NULL DEFAULT 'member',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ,
  UNIQUE (organization_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_org_members_user ON public.organization_members (user_id) WHERE deleted_at IS NULL;

-- Workspaces (team / business unit within org)
CREATE TABLE IF NOT EXISTS public.workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ,
  UNIQUE (organization_id, slug)
);

CREATE TABLE IF NOT EXISTS public.workspace_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces (id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  role public.member_role NOT NULL DEFAULT 'member',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ,
  UNIQUE (workspace_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_workspace_members_user ON public.workspace_members (user_id) WHERE deleted_at IS NULL;

-- Projects
CREATE TABLE IF NOT EXISTS public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces (id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  status public.project_status NOT NULL DEFAULT 'active',
  health_score INTEGER NOT NULL DEFAULT 50 CHECK (health_score >= 0 AND health_score <= 100),
  google_sheet_id TEXT,
  settings JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ,
  UNIQUE (workspace_id, slug)
);

CREATE INDEX IF NOT EXISTS idx_projects_workspace ON public.projects (workspace_id) WHERE deleted_at IS NULL;

CREATE TABLE IF NOT EXISTS public.project_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects (id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  role public.project_member_role NOT NULL DEFAULT 'contributor',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ,
  UNIQUE (project_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_project_members_user ON public.project_members (user_id) WHERE deleted_at IS NULL;

-- Milestones & tasks
CREATE TABLE IF NOT EXISTS public.milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects (id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  due_date DATE,
  status public.milestone_status NOT NULL DEFAULT 'planned',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_milestones_project ON public.milestones (project_id) WHERE deleted_at IS NULL;

CREATE TABLE IF NOT EXISTS public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects (id) ON DELETE CASCADE,
  milestone_id UUID REFERENCES public.milestones (id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  status public.task_status NOT NULL DEFAULT 'todo',
  priority TEXT NOT NULL DEFAULT 'medium',
  due_date DATE,
  assignee_id UUID REFERENCES public.profiles (id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_tasks_project ON public.tasks (project_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_tasks_milestone ON public.tasks (milestone_id) WHERE deleted_at IS NULL;

CREATE TABLE IF NOT EXISTS public.dependencies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects (id) ON DELETE CASCADE,
  predecessor_task_id UUID NOT NULL REFERENCES public.tasks (id) ON DELETE CASCADE,
  successor_task_id UUID NOT NULL REFERENCES public.tasks (id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT chk_dependency_distinct CHECK (predecessor_task_id <> successor_task_id),
  UNIQUE (predecessor_task_id, successor_task_id)
);

CREATE INDEX IF NOT EXISTS idx_dependencies_project ON public.dependencies (project_id);

CREATE TABLE IF NOT EXISTS public.blockers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects (id) ON DELETE CASCADE,
  task_id UUID REFERENCES public.tasks (id) ON DELETE SET NULL,
  milestone_id UUID REFERENCES public.milestones (id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  blocked_by TEXT,
  status public.blocker_status NOT NULL DEFAULT 'open',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_blockers_project ON public.blockers (project_id) WHERE deleted_at IS NULL;

CREATE TABLE IF NOT EXISTS public.risks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects (id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  severity public.risk_severity NOT NULL DEFAULT 'medium',
  status public.risk_status NOT NULL DEFAULT 'open',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_risks_project ON public.risks (project_id) WHERE deleted_at IS NULL;

CREATE TABLE IF NOT EXISTS public.reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects (id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT,
  remind_at TIMESTAMPTZ NOT NULL,
  channel public.reminder_channel NOT NULL DEFAULT 'in_app',
  status public.reminder_status NOT NULL DEFAULT 'scheduled',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_reminders_project_time ON public.reminders (project_id, remind_at) WHERE deleted_at IS NULL;

-- Integrations
CREATE TABLE IF NOT EXISTS public.integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces (id) ON DELETE CASCADE,
  type public.integration_type NOT NULL,
  status public.integration_status NOT NULL DEFAULT 'disconnected',
  credentials_ref TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  last_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ,
  UNIQUE (workspace_id, type)
);

CREATE TABLE IF NOT EXISTS public.slack_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_id UUID NOT NULL REFERENCES public.integrations (id) ON DELETE CASCADE,
  slack_team_id TEXT NOT NULL,
  slack_team_name TEXT,
  bot_user_id TEXT,
  access_token_encrypted TEXT,
  refresh_token_encrypted TEXT,
  scopes TEXT[] DEFAULT '{}',
  installed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.slack_channel_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_id UUID NOT NULL REFERENCES public.integrations (id) ON DELETE CASCADE,
  project_id UUID REFERENCES public.projects (id) ON DELETE CASCADE,
  channel_id TEXT NOT NULL,
  channel_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (integration_id, channel_id)
);

CREATE TABLE IF NOT EXISTS public.gmail_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_id UUID NOT NULL REFERENCES public.integrations (id) ON DELETE CASCADE,
  gmail_email TEXT NOT NULL,
  history_id BIGINT,
  watch_expiration TIMESTAMPTZ,
  token_metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.email_thread_contexts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects (id) ON DELETE CASCADE,
  thread_id TEXT NOT NULL,
  subject TEXT,
  last_message_at TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (project_id, thread_id)
);

-- Meeting transcripts
CREATE TABLE IF NOT EXISTS public.meeting_transcripts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects (id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  source public.transcript_source NOT NULL,
  storage_path TEXT,
  raw_text TEXT,
  status public.transcript_status NOT NULL DEFAULT 'processing',
  meeting_at TIMESTAMPTZ,
  ai_summary JSONB,
  created_by UUID REFERENCES public.profiles (id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_transcripts_project ON public.meeting_transcripts (project_id) WHERE deleted_at IS NULL;

CREATE TABLE IF NOT EXISTS public.transcript_entities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transcript_id UUID NOT NULL REFERENCES public.meeting_transcripts (id) ON DELETE CASCADE,
  entity_type public.transcript_entity_type NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  confidence NUMERIC,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_transcript_entities_transcript ON public.transcript_entities (transcript_id);

-- Operational memory & events
CREATE TABLE IF NOT EXISTS public.operational_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects (id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT,
  source public.operational_event_source NOT NULL DEFAULT 'system',
  source_ref TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_operational_events_project_time ON public.operational_events (project_id, occurred_at DESC);

CREATE TABLE IF NOT EXISTS public.project_memory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects (id) ON DELETE CASCADE,
  memory_key TEXT NOT NULL,
  memory_value JSONB NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (project_id, memory_key)
);

CREATE INDEX IF NOT EXISTS idx_project_memory_project ON public.project_memory (project_id);

CREATE TABLE IF NOT EXISTS public.ai_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects (id) ON DELETE CASCADE,
  suggestion_type TEXT NOT NULL,
  title TEXT NOT NULL,
  body JSONB NOT NULL DEFAULT '{}'::jsonb,
  status public.suggestion_status NOT NULL DEFAULT 'pending_approval',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ai_suggestions_project_status ON public.ai_suggestions (project_id, status);

CREATE TABLE IF NOT EXISTS public.communication_drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects (id) ON DELETE CASCADE,
  channel public.draft_channel NOT NULL,
  subject TEXT,
  body TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  status public.draft_status NOT NULL DEFAULT 'pending_approval',
  created_by UUID REFERENCES public.profiles (id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_comm_drafts_project_status ON public.communication_drafts (project_id, status);

CREATE TABLE IF NOT EXISTS public.approval_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects (id) ON DELETE CASCADE,
  requester_id UUID REFERENCES public.profiles (id),
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  status public.approval_status NOT NULL DEFAULT 'pending',
  decided_by UUID REFERENCES public.profiles (id),
  decided_at TIMESTAMPTZ,
  decision_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_approvals_project_status ON public.approval_requests (project_id, status);

CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT,
  type TEXT NOT NULL DEFAULT 'info',
  read_at TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON public.notifications (user_id) WHERE read_at IS NULL;

CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations (id) ON DELETE SET NULL,
  actor_id UUID REFERENCES public.profiles (id),
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  changes JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_org_time ON public.audit_logs (organization_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.activity_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces (id) ON DELETE CASCADE,
  actor_id UUID REFERENCES public.profiles (id),
  activity_type TEXT NOT NULL,
  description TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_activity_workspace_time ON public.activity_history (workspace_id, created_at DESC);

-- Invites (workspace)
CREATE TABLE IF NOT EXISTS public.workspace_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces (id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role public.member_role NOT NULL DEFAULT 'member',
  token_hash TEXT NOT NULL,
  invited_by UUID REFERENCES public.profiles (id),
  expires_at TIMESTAMPTZ NOT NULL,
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (workspace_id, email)
);

-- updated_at triggers
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$ DECLARE r RECORD; BEGIN
  FOR r IN SELECT unnest(ARRAY[
    'profiles','organizations','organization_members','workspaces','workspace_members',
    'projects','project_members','milestones','tasks','blockers','risks','reminders',
    'integrations','meeting_transcripts','project_memory','ai_suggestions',
    'communication_drafts','approval_requests'
  ]) AS tbl
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS trg_%I_updated ON public.%I', r.tbl, r.tbl);
    EXECUTE format('CREATE TRIGGER trg_%I_updated BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at()', r.tbl, r.tbl);
  END LOOP;
END $$;

-- Auto profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)))
  ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Helper: user can access workspace
CREATE OR REPLACE FUNCTION public.user_in_workspace(ws uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM workspace_members wm
    WHERE wm.workspace_id = ws AND wm.user_id = auth.uid() AND wm.deleted_at IS NULL
  );
$$;

CREATE OR REPLACE FUNCTION public.user_in_project(proj uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM projects p
    JOIN workspace_members wm ON wm.workspace_id = p.workspace_id AND wm.user_id = auth.uid() AND wm.deleted_at IS NULL
    LEFT JOIN project_members pm ON pm.project_id = p.id AND pm.user_id = auth.uid() AND pm.deleted_at IS NULL
    WHERE p.id = proj AND p.deleted_at IS NULL
      AND (pm.id IS NOT NULL OR wm.role IN ('owner','admin','member'))
  );
$$;

-- RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dependencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blockers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.risks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.slack_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.slack_channel_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gmail_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_thread_contexts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meeting_transcripts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transcript_entities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.operational_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_memory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.communication_drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.approval_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_invites ENABLE ROW LEVEL SECURITY;

-- Profiles: self read/update
CREATE POLICY profiles_select_self ON public.profiles FOR SELECT USING (auth.uid() = id AND deleted_at IS NULL);
CREATE POLICY profiles_update_self ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Organizations via membership
CREATE POLICY orgs_select_member ON public.organizations FOR SELECT
USING (EXISTS (SELECT 1 FROM organization_members om WHERE om.organization_id = organizations.id AND om.user_id = auth.uid() AND om.deleted_at IS NULL));

CREATE POLICY org_members_select ON public.organization_members FOR SELECT
USING (EXISTS (SELECT 1 FROM organization_members om2 WHERE om2.organization_id = organization_members.organization_id AND om2.user_id = auth.uid() AND om2.deleted_at IS NULL));

-- Workspaces
CREATE POLICY workspaces_select ON public.workspaces FOR SELECT
USING (public.user_in_workspace(id));

CREATE POLICY workspace_members_select ON public.workspace_members FOR SELECT
USING (public.user_in_workspace(workspace_id));

-- Projects & children
CREATE POLICY projects_select ON public.projects FOR SELECT
USING (public.user_in_workspace(workspace_id) AND deleted_at IS NULL);

CREATE POLICY projects_write ON public.projects FOR ALL
USING (public.user_in_workspace(workspace_id))
WITH CHECK (public.user_in_workspace(workspace_id));

CREATE POLICY project_members_select ON public.project_members FOR SELECT
USING (public.user_in_project(project_id));

CREATE POLICY project_members_write ON public.project_members FOR ALL
USING (public.user_in_project(project_id))
WITH CHECK (public.user_in_project(project_id));

CREATE POLICY milestones_all ON public.milestones FOR ALL
USING (public.user_in_project(project_id)) WITH CHECK (public.user_in_project(project_id));

CREATE POLICY tasks_all ON public.tasks FOR ALL
USING (public.user_in_project(project_id)) WITH CHECK (public.user_in_project(project_id));

CREATE POLICY dependencies_all ON public.dependencies FOR ALL
USING (public.user_in_project(project_id)) WITH CHECK (public.user_in_project(project_id));

CREATE POLICY blockers_all ON public.blockers FOR ALL
USING (public.user_in_project(project_id)) WITH CHECK (public.user_in_project(project_id));

CREATE POLICY risks_all ON public.risks FOR ALL
USING (public.user_in_project(project_id)) WITH CHECK (public.user_in_project(project_id));

CREATE POLICY reminders_all ON public.reminders FOR ALL
USING (public.user_in_project(project_id)) WITH CHECK (public.user_in_project(project_id));

CREATE POLICY integrations_all ON public.integrations FOR ALL
USING (public.user_in_workspace(workspace_id)) WITH CHECK (public.user_in_workspace(workspace_id));

CREATE POLICY slack_conn_all ON public.slack_connections FOR ALL
USING (EXISTS (SELECT 1 FROM integrations i WHERE i.id = slack_connections.integration_id AND public.user_in_workspace(i.workspace_id)))
WITH CHECK (EXISTS (SELECT 1 FROM integrations i WHERE i.id = slack_connections.integration_id AND public.user_in_workspace(i.workspace_id)));

CREATE POLICY slack_map_all ON public.slack_channel_mappings FOR ALL
USING (EXISTS (SELECT 1 FROM integrations i WHERE i.id = slack_channel_mappings.integration_id AND public.user_in_workspace(i.workspace_id)))
WITH CHECK (EXISTS (SELECT 1 FROM integrations i WHERE i.id = slack_channel_mappings.integration_id AND public.user_in_workspace(i.workspace_id)));

CREATE POLICY gmail_conn_all ON public.gmail_connections FOR ALL
USING (EXISTS (SELECT 1 FROM integrations i WHERE i.id = gmail_connections.integration_id AND public.user_in_workspace(i.workspace_id)))
WITH CHECK (EXISTS (SELECT 1 FROM integrations i WHERE i.id = gmail_connections.integration_id AND public.user_in_workspace(i.workspace_id)));

CREATE POLICY email_threads_all ON public.email_thread_contexts FOR ALL
USING (public.user_in_project(project_id)) WITH CHECK (public.user_in_project(project_id));

CREATE POLICY transcripts_all ON public.meeting_transcripts FOR ALL
USING (public.user_in_project(project_id)) WITH CHECK (public.user_in_project(project_id));

CREATE POLICY transcript_entities_all ON public.transcript_entities FOR ALL
USING (EXISTS (SELECT 1 FROM meeting_transcripts t WHERE t.id = transcript_entities.transcript_id AND public.user_in_project(t.project_id)))
WITH CHECK (EXISTS (SELECT 1 FROM meeting_transcripts t WHERE t.id = transcript_entities.transcript_id AND public.user_in_project(t.project_id)));

CREATE POLICY operational_events_all ON public.operational_events FOR ALL
USING (public.user_in_project(project_id)) WITH CHECK (public.user_in_project(project_id));

CREATE POLICY project_memory_all ON public.project_memory FOR ALL
USING (public.user_in_project(project_id)) WITH CHECK (public.user_in_project(project_id));

CREATE POLICY ai_suggestions_all ON public.ai_suggestions FOR ALL
USING (public.user_in_project(project_id)) WITH CHECK (public.user_in_project(project_id));

CREATE POLICY comm_drafts_all ON public.communication_drafts FOR ALL
USING (public.user_in_project(project_id)) WITH CHECK (public.user_in_project(project_id));

CREATE POLICY approvals_all ON public.approval_requests FOR ALL
USING (public.user_in_project(project_id)) WITH CHECK (public.user_in_project(project_id));

CREATE POLICY notifications_self ON public.notifications FOR ALL
USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY audit_logs_select ON public.audit_logs FOR SELECT
USING (organization_id IS NULL OR EXISTS (
  SELECT 1 FROM organization_members om WHERE om.organization_id = audit_logs.organization_id AND om.user_id = auth.uid() AND om.deleted_at IS NULL
));

CREATE POLICY activity_select ON public.activity_history FOR SELECT
USING (public.user_in_workspace(workspace_id));

CREATE POLICY workspace_invites_admin ON public.workspace_invites FOR ALL
USING (EXISTS (
  SELECT 1 FROM workspace_members wm
  WHERE wm.workspace_id = workspace_invites.workspace_id AND wm.user_id = auth.uid()
    AND wm.role IN ('owner','admin') AND wm.deleted_at IS NULL
))
WITH CHECK (EXISTS (
  SELECT 1 FROM workspace_members wm
  WHERE wm.workspace_id = workspace_invites.workspace_id AND wm.user_id = auth.uid()
    AND wm.role IN ('owner','admin') AND wm.deleted_at IS NULL
));
