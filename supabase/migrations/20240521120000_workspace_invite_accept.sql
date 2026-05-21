-- Allow workspace admins to add members directly (optional UI flows).
CREATE POLICY workspace_members_insert_admin ON public.workspace_members
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM workspace_members wm
    WHERE wm.workspace_id = workspace_members.workspace_id
      AND wm.user_id = auth.uid()
      AND wm.role IN ('owner', 'admin')
      AND wm.deleted_at IS NULL
  )
);

-- SECURITY DEFINER: invited users cannot SELECT invite rows under admin-only RLS,
-- but they can redeem a token when their auth email matches the invite.
CREATE OR REPLACE FUNCTION public.accept_workspace_invite(p_token text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_hash text := encode(digest(convert_to(p_token, 'UTF8'), 'sha256'), 'hex');
  v_inv public.workspace_invites%ROWTYPE;
  v_email text;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_authenticated');
  END IF;

  SELECT * INTO v_inv
  FROM public.workspace_invites wi
  WHERE wi.token_hash = v_hash
    AND wi.accepted_at IS NULL
    AND wi.expires_at > now();

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'invalid_or_expired');
  END IF;

  SELECT email INTO v_email FROM auth.users WHERE id = auth.uid();
  IF v_email IS NULL OR lower(btrim(v_email)) <> lower(btrim(v_inv.email)) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'email_mismatch');
  END IF;

  INSERT INTO public.workspace_members (workspace_id, user_id, role)
  VALUES (v_inv.workspace_id, auth.uid(), v_inv.role)
  ON CONFLICT (workspace_id, user_id) DO UPDATE
    SET deleted_at = NULL,
        role = EXCLUDED.role,
        updated_at = now();

  UPDATE public.workspace_invites SET accepted_at = now() WHERE id = v_inv.id;

  RETURN jsonb_build_object('ok', true, 'workspace_id', v_inv.workspace_id);
END;
$$;

REVOKE ALL ON FUNCTION public.accept_workspace_invite(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.accept_workspace_invite(text) TO authenticated;
