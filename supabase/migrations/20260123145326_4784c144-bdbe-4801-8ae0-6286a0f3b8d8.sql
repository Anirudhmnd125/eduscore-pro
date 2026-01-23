-- Allow users to insert their own role during signup
CREATE POLICY "Users can insert their own role"
ON public.user_roles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Also add a policy so users without roles can still be recognized
-- Fix: Allow service role or trigger to assign roles (using a function)
CREATE OR REPLACE FUNCTION public.assign_user_role(p_user_id UUID, p_role app_role)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (p_user_id, p_role)
    ON CONFLICT (user_id, role) DO NOTHING;
    RETURN TRUE;
END;
$$;