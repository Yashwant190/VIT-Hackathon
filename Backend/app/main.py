from fastapi import FastAPI, UploadFile, File, HTTPException, Depends, Header
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import os
import openai
from dotenv import load_dotenv
import uuid
from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel
import json

from .supabase_client import get_supabase_client, get_supabase_anon_client
from .extractor import extract_text
from .summarizer_client import summarize_text

# Load environment variables
load_dotenv()
openai.api_key = os.getenv("OPENAI_API_KEY")

app = FastAPI(title="Document Processing API", version="1.0.0")

# Security
security = HTTPBearer()

# Enable CORS for frontend
frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5173")
origins = [
    "http://127.0.0.1:5173",
    "http://localhost:5173",
    frontend_url
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic models
class DocumentResponse(BaseModel):
    id: str
    name: str
    size_bytes: int
    file_type: str
    status: str
    progress: int
    upload_date: str
    file_url: Optional[str] = None

class SummaryResponse(BaseModel):
    id: str
    document_id: str
    title: str
    key_points: List[str]
    word_count: int
    reading_time: str
    sentiment: str
    categories: List[str]
    full_summary: str
    created_at: str

class AnalyticsResponse(BaseModel):
    total_documents: int
    total_summaries: int
    total_time_saved: int
    documents_today: int
    success_rate: float

class ProcessDocumentRequest(BaseModel):
    document_id: str

# Authentication helper
async def get_current_user(authorization: HTTPAuthorizationCredentials = Depends(security)):
    """Extract user from JWT token"""
    try:
        supabase = get_supabase_anon_client()
        # Verify the JWT token
        user = supabase.auth.get_user(authorization.credentials)
        if not user or not user.user:
            raise HTTPException(status_code=401, detail="Invalid authentication token")
        return user.user
    except Exception as e:
        raise HTTPException(status_code=401, detail="Invalid authentication token")

@app.get("/")
def root():
    return {"message": "Document Processing API is running!", "version": "1.0.0"}

# Health check endpoint
@app.get("/health")
def health_check():
    return {"status": "healthy", "timestamp": datetime.now().isoformat()}

# Upload endpoint
@app.post("/api/upload", response_model=DocumentResponse)
async def upload_document(
    file: UploadFile = File(...),
    current_user = Depends(get_current_user)
):
    try:
        supabase = get_supabase_client()
        
        # Read file content
        content = await file.read()
        file_size = len(content)
        
        # Upload file to Supabase Storage
        file_path = f"{current_user.id}/{uuid.uuid4()}_{file.filename}"
        storage_response = supabase.storage.from_("documents").upload(file_path, content)
        
        if storage_response.get("error"):
            raise HTTPException(status_code=500, detail="Failed to upload file to storage")
        
        # Get public URL
        file_url = supabase.storage.from_("documents").get_public_url(file_path)
        
        # Insert document record
        document_data = {
            "user_id": current_user.id,
            "name": file.filename,
            "size_bytes": file_size,
            "file_type": file.content_type or "application/octet-stream",
            "status": "uploading",
            "progress": 100,
            "file_path": file_path,
            "file_url": file_url["publicURL"] if file_url else None
        }
        
        result = supabase.table("documents").insert(document_data).execute()
        
        if not result.data:
            raise HTTPException(status_code=500, detail="Failed to create document record")
        
        document = result.data[0]
        
        return DocumentResponse(
            id=document["id"],
            name=document["name"],
            size_bytes=document["size_bytes"],
            file_type=document["file_type"],
            status=document["status"],
            progress=document["progress"],
            upload_date=document["upload_date"],
            file_url=document["file_url"]
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")

# Process document endpoint
@app.post("/api/process")
async def process_document(
    request: ProcessDocumentRequest,
    current_user = Depends(get_current_user)
):
    try:
        supabase = get_supabase_client()
        
        # Get document
        doc_result = supabase.table("documents").select("*").eq("id", request.document_id).eq("user_id", current_user.id).execute()
        
        if not doc_result.data:
            raise HTTPException(status_code=404, detail="Document not found")
        
        document = doc_result.data[0]
        
        supabase.table("documents").update({
            "status": "processing",
            "processing_started_at": datetime.now().isoformat()
        }).eq("id", request.document_id).execute()
        
        # Download file bytes for processing using stored file_path
        file_bytes = supabase.storage.from_("documents").download(document["file_path"])
        if not file_bytes:
            raise HTTPException(status_code=500, detail="Failed to download file for processing")

        # Ensure bytes type
        if isinstance(file_bytes, str):
            file_bytes = file_bytes.encode("utf-8", errors="ignore")

        # Extract text from file
        content = extract_text(file_bytes, document.get("file_type"), document.get("name"))
        if not content:
            raise HTTPException(status_code=400, detail="Unable to extract text from file")

        # Summarize content
        summary_struct = summarize_text(content, title_hint=document["name"].split(".")[0])

        # Insert summary record
        summary_data = {
            "document_id": request.document_id,
            "user_id": current_user.id,
            "title": summary_struct.get("title"),
            "key_points": summary_struct.get("key_points", []),
            "word_count": summary_struct.get("word_count", len(content.split())),
            "reading_time": summary_struct.get("reading_time", "1 min"),
            "sentiment": summary_struct.get("sentiment", "neutral"),
            "categories": summary_struct.get("categories", ["Document", "Analysis"]),
            "full_summary": summary_struct.get("full_summary", "")
        }
        summary_result = supabase.table("document_summaries").insert(summary_data).execute()

        # Update document status to completed
        supabase.table("documents").update({
            "status": "completed",
            "processing_completed_at": datetime.now().isoformat()
        }).eq("id", request.document_id).execute()

        if summary_result.data:
            summary = summary_result.data[0]
            return SummaryResponse(
                id=summary["id"],
                document_id=summary["document_id"],
                title=summary["title"],
                key_points=summary["key_points"],
                word_count=summary["word_count"],
                reading_time=summary["reading_time"],
                sentiment=summary["sentiment"],
                categories=summary["categories"],
                full_summary=summary["full_summary"],
                created_at=summary["created_at"]
            )
        else:
            raise HTTPException(status_code=500, detail="Failed to save summary")
        
    except HTTPException:
        raise
    except Exception as e:
        # Update document status to failed
        supabase = get_supabase_client()
        supabase.table("documents").update({"status": "failed"}).eq("id", request.document_id).execute()
        raise HTTPException(status_code=500, detail=f"Processing failed: {str(e)}")

# Get user documents
@app.get("/api/documents", response_model=List[DocumentResponse])
async def get_documents(current_user = Depends(get_current_user)):
    try:
        supabase = get_supabase_client()
        result = supabase.table("documents").select("*").eq("user_id", current_user.id).order("upload_date", desc=True).execute()
        
        documents = []
        for doc in result.data:
            documents.append(DocumentResponse(
                id=doc["id"],
                name=doc["name"],
                size_bytes=doc["size_bytes"],
                file_type=doc["file_type"],
                status=doc["status"],
                progress=doc["progress"],
                upload_date=doc["upload_date"],
                file_url=doc["file_url"]
            ))
        
        return documents
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch documents: {str(e)}")

# Get summaries
@app.get("/api/summaries", response_model=List[SummaryResponse])
async def get_summaries(current_user = Depends(get_current_user)):
    try:
        supabase = get_supabase_client()
        result = supabase.table("document_summaries").select("*").eq("user_id", current_user.id).order("created_at", desc=True).execute()
        
        summaries = []
        for summary in result.data:
            summaries.append(SummaryResponse(
                id=summary["id"],
                document_id=summary["document_id"],
                title=summary["title"],
                key_points=summary["key_points"],
                word_count=summary["word_count"],
                reading_time=summary["reading_time"],
                sentiment=summary["sentiment"],
                categories=summary["categories"],
                full_summary=summary["full_summary"],
                created_at=summary["created_at"]
            ))
        
        return summaries
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch summaries: {str(e)}")

# Analytics endpoint
@app.get("/api/analytics", response_model=AnalyticsResponse)
async def get_analytics(current_user = Depends(get_current_user)):
    try:
        supabase = get_supabase_client()
        
        # Get user analytics
        analytics_result = supabase.table("user_analytics").select("*").eq("user_id", current_user.id).execute()
        
        if analytics_result.data:
            analytics = analytics_result.data[0]
            return AnalyticsResponse(
                total_documents=analytics["total_documents"],
                total_summaries=analytics["total_summaries"],
                total_time_saved=analytics["total_time_saved"],
                documents_today=analytics["documents_today"],
                success_rate=float(analytics["success_rate"])
            )
        else:
            # Return default analytics if none exist
            return AnalyticsResponse(
                total_documents=0,
                total_summaries=0,
                total_time_saved=0,
                documents_today=0,
                success_rate=100.0
            )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch analytics: {str(e)}")

# Delete document
@app.delete("/api/documents/{document_id}")
async def delete_document(document_id: str, current_user = Depends(get_current_user)):
    try:
        supabase = get_supabase_client()
        
        # Get document to check ownership and get file path
        doc_result = supabase.table("documents").select("*").eq("id", document_id).eq("user_id", current_user.id).execute()
        
        if not doc_result.data:
            raise HTTPException(status_code=404, detail="Document not found")
        
        document = doc_result.data[0]
        
        # Delete file from storage using stored file_path
        if document.get("file_path"):
            supabase.storage.from_("documents").remove([document["file_path"]])
        
        # Delete document record (this will cascade delete summaries)
        supabase.table("documents").delete().eq("id", document_id).execute()
        
        return {"message": "Document deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete document: {str(e)}")
