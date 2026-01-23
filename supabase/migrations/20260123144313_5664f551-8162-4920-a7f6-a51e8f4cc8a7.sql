-- Create role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'faculty', 'student');

-- Create profiles table
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_roles table (separate from profiles for security)
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Create exams table
CREATE TABLE public.exams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    faculty_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    subject TEXT NOT NULL,
    total_marks INTEGER NOT NULL,
    question_paper_url TEXT,
    model_answer_url TEXT,
    rubric TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create evaluations table
CREATE TABLE public.evaluations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    exam_id UUID REFERENCES public.exams(id) ON DELETE CASCADE NOT NULL,
    student_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    student_name TEXT,
    student_roll_number TEXT,
    answer_sheet_url TEXT,
    total_marks_obtained DECIMAL(5,2),
    max_marks INTEGER,
    grade TEXT,
    percentage DECIMAL(5,2),
    ai_evaluation JSONB,
    faculty_override JSONB,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'approved')),
    evaluated_at TIMESTAMP WITH TIME ZONE,
    approved_at TIMESTAMP WITH TIME ZONE,
    approved_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create question_evaluations table for detailed breakdown
CREATE TABLE public.question_evaluations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    evaluation_id UUID REFERENCES public.evaluations(id) ON DELETE CASCADE NOT NULL,
    question_id TEXT NOT NULL,
    max_marks INTEGER NOT NULL,
    marks_obtained DECIMAL(5,2) NOT NULL,
    criteria_breakdown JSONB,
    strengths TEXT[],
    weaknesses TEXT[],
    feedback TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.question_evaluations ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles (prevents RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.user_roles
        WHERE user_id = _user_id AND role = _role
    )
$$;

-- Profiles policies
CREATE POLICY "Users can view their own profile"
ON public.profiles FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all profiles"
ON public.profiles FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage all profiles"
ON public.profiles FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- User roles policies
CREATE POLICY "Users can view their own roles"
ON public.user_roles FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all roles"
ON public.user_roles FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Exams policies
CREATE POLICY "Faculty can view their own exams"
ON public.exams FOR SELECT
TO authenticated
USING (auth.uid() = faculty_id);

CREATE POLICY "Faculty can create exams"
ON public.exams FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = faculty_id AND public.has_role(auth.uid(), 'faculty'));

CREATE POLICY "Faculty can update their own exams"
ON public.exams FOR UPDATE
TO authenticated
USING (auth.uid() = faculty_id);

CREATE POLICY "Faculty can delete their own exams"
ON public.exams FOR DELETE
TO authenticated
USING (auth.uid() = faculty_id);

CREATE POLICY "Admins can manage all exams"
ON public.exams FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Evaluations policies
CREATE POLICY "Faculty can view evaluations for their exams"
ON public.evaluations FOR SELECT
TO authenticated
USING (EXISTS (
    SELECT 1 FROM public.exams WHERE exams.id = evaluations.exam_id AND exams.faculty_id = auth.uid()
));

CREATE POLICY "Faculty can create evaluations for their exams"
ON public.evaluations FOR INSERT
TO authenticated
WITH CHECK (EXISTS (
    SELECT 1 FROM public.exams WHERE exams.id = evaluations.exam_id AND exams.faculty_id = auth.uid()
));

CREATE POLICY "Faculty can update evaluations for their exams"
ON public.evaluations FOR UPDATE
TO authenticated
USING (EXISTS (
    SELECT 1 FROM public.exams WHERE exams.id = evaluations.exam_id AND exams.faculty_id = auth.uid()
));

CREATE POLICY "Students can view their own evaluations"
ON public.evaluations FOR SELECT
TO authenticated
USING (auth.uid() = student_id);

CREATE POLICY "Admins can manage all evaluations"
ON public.evaluations FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Question evaluations policies
CREATE POLICY "Users can view question evaluations for accessible evaluations"
ON public.question_evaluations FOR SELECT
TO authenticated
USING (EXISTS (
    SELECT 1 FROM public.evaluations e
    JOIN public.exams ex ON e.exam_id = ex.id
    WHERE e.id = question_evaluations.evaluation_id
    AND (ex.faculty_id = auth.uid() OR e.student_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
));

CREATE POLICY "Faculty can manage question evaluations"
ON public.question_evaluations FOR ALL
TO authenticated
USING (EXISTS (
    SELECT 1 FROM public.evaluations e
    JOIN public.exams ex ON e.exam_id = ex.id
    WHERE e.id = question_evaluations.evaluation_id AND ex.faculty_id = auth.uid()
));

-- Trigger to auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.profiles (user_id, full_name, email)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
        NEW.email
    );
    RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_exams_updated_at
    BEFORE UPDATE ON public.exams
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_evaluations_updated_at
    BEFORE UPDATE ON public.evaluations
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for exam files
INSERT INTO storage.buckets (id, name, public) VALUES ('exam-files', 'exam-files', false);

-- Storage policies
CREATE POLICY "Faculty can upload exam files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'exam-files' AND public.has_role(auth.uid(), 'faculty'));

CREATE POLICY "Users can view exam files they have access to"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'exam-files');

CREATE POLICY "Faculty can update their exam files"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'exam-files' AND public.has_role(auth.uid(), 'faculty'));

CREATE POLICY "Faculty can delete their exam files"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'exam-files' AND public.has_role(auth.uid(), 'faculty'));