-- Enable Row Level Security
ALTER DATABASE postgres SET "app.jwt_secret" TO 'your-jwt-secret';

-- Create custom types
CREATE TYPE document_status AS ENUM ('uploading', 'processing', 'completed', 'failed');
CREATE TYPE summary_sentiment AS ENUM ('positive', 'neutral', 'negative');

-- Users table (extends Supabase auth.users)
CREATE TABLE public.user_profiles (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Documents table
CREATE TABLE public.documents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    name TEXT NOT NULL,
    size_bytes BIGINT NOT NULL,
    file_type TEXT NOT NULL,
    status document_status DEFAULT 'uploading',
    progress INTEGER DEFAULT 0,
    upload_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processing_started_at TIMESTAMP WITH TIME ZONE,
    processing_completed_at TIMESTAMP WITH TIME ZONE,
    file_path TEXT,
    file_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Document summaries table
CREATE TABLE public.document_summaries (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    document_id UUID REFERENCES public.documents(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    title TEXT NOT NULL,
    key_points TEXT[] DEFAULT '{}',
    word_count INTEGER DEFAULT 0,
    reading_time TEXT DEFAULT '0 min',
    sentiment summary_sentiment DEFAULT 'neutral',
    categories TEXT[] DEFAULT '{}',
    full_summary TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Analytics table for tracking user metrics
CREATE TABLE public.user_analytics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    total_documents INTEGER DEFAULT 0,
    total_summaries INTEGER DEFAULT 0,
    total_time_saved INTEGER DEFAULT 0, -- in minutes
    documents_today INTEGER DEFAULT 0,
    success_rate DECIMAL(5,2) DEFAULT 100.00,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Document processing logs
CREATE TABLE public.processing_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    document_id UUID REFERENCES public.documents(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    status document_status NOT NULL,
    message TEXT,
    processing_time_ms INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security on all tables
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.processing_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_profiles
CREATE POLICY "Users can view their own profile" ON public.user_profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.user_profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON public.user_profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- RLS Policies for documents
CREATE POLICY "Users can view their own documents" ON public.documents
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own documents" ON public.documents
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own documents" ON public.documents
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own documents" ON public.documents
    FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for document_summaries
CREATE POLICY "Users can view their own summaries" ON public.document_summaries
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own summaries" ON public.document_summaries
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own summaries" ON public.document_summaries
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own summaries" ON public.document_summaries
    FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for user_analytics
CREATE POLICY "Users can view their own analytics" ON public.user_analytics
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own analytics" ON public.user_analytics
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own analytics" ON public.user_analytics
    FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for processing_logs
CREATE POLICY "Users can view their own processing logs" ON public.processing_logs
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own processing logs" ON public.processing_logs
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX idx_documents_user_id ON public.documents(user_id);
CREATE INDEX idx_documents_status ON public.documents(status);
CREATE INDEX idx_documents_upload_date ON public.documents(upload_date);
CREATE INDEX idx_document_summaries_document_id ON public.document_summaries(document_id);
CREATE INDEX idx_document_summaries_user_id ON public.document_summaries(user_id);
CREATE INDEX idx_processing_logs_document_id ON public.processing_logs(document_id);
CREATE INDEX idx_processing_logs_user_id ON public.processing_logs(user_id);

-- Create functions for updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updating timestamps
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON public.user_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON public.documents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_document_summaries_updated_at BEFORE UPDATE ON public.document_summaries
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to automatically create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.user_profiles (id, username, full_name, avatar_url)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'username', NEW.email),
        COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
        COALESCE(NEW.raw_user_meta_data->>'avatar_url', '')
    );
    
    INSERT INTO public.user_analytics (user_id)
    VALUES (NEW.id);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create user profile on signup
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update analytics when documents change
CREATE OR REPLACE FUNCTION update_user_analytics()
RETURNS TRIGGER AS $$
BEGIN
    -- Update analytics for the user
    INSERT INTO public.user_analytics (user_id, total_documents, total_summaries, last_updated)
    VALUES (
        COALESCE(NEW.user_id, OLD.user_id),
        (SELECT COUNT(*) FROM public.documents WHERE user_id = COALESCE(NEW.user_id, OLD.user_id)),
        (SELECT COUNT(*) FROM public.document_summaries WHERE user_id = COALESCE(NEW.user_id, OLD.user_id)),
        NOW()
    )
    ON CONFLICT (user_id) DO UPDATE SET
        total_documents = (SELECT COUNT(*) FROM public.documents WHERE user_id = COALESCE(NEW.user_id, OLD.user_id)),
        total_summaries = (SELECT COUNT(*) FROM public.document_summaries WHERE user_id = COALESCE(NEW.user_id, OLD.user_id)),
        last_updated = NOW();
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Triggers to update analytics
CREATE TRIGGER update_analytics_on_document_change
    AFTER INSERT OR UPDATE OR DELETE ON public.documents
    FOR EACH ROW EXECUTE FUNCTION update_user_analytics();

CREATE TRIGGER update_analytics_on_summary_change
    AFTER INSERT OR UPDATE OR DELETE ON public.document_summaries
    FOR EACH ROW EXECUTE FUNCTION update_user_analytics();

-- Create Supabase Storage bucket for documents (id must be lowercase)
INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', true)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS policies for objects in 'documents' bucket
-- Allow anyone to read public files in this bucket
CREATE POLICY "Public read for documents bucket" ON storage.objects
    FOR SELECT USING (bucket_id = 'documents');

-- Allow authenticated users to manage their own folder (user_id prefix)
CREATE POLICY "Users can upload to their folder" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'documents'
        AND (auth.uid())::text = split_part(name, '/', 1)
    );

CREATE POLICY "Users can update their files" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'documents'
        AND (auth.uid())::text = split_part(name, '/', 1)
    );

CREATE POLICY "Users can delete their files" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'documents'
        AND (auth.uid())::text = split_part(name, '/', 1)
    );
