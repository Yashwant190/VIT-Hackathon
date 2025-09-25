import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

# Supabase configuration
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY")

if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
    raise ValueError("Missing Supabase configuration. Please check your .env file.")

# Create Supabase client with service role key for backend operations
supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

# Create client with anon key for user operations
supabase_anon: Client = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)

def get_supabase_client() -> Client:
    """Get Supabase client with service role key"""
    return supabase

def get_supabase_anon_client() -> Client:
    """Get Supabase client with anonymous key"""
    return supabase_anon