"""
FastAPI app for crop disease detection
Uses external inference script to avoid TensorFlow import issues
"""
from fastapi import FastAPI, File, UploadFile, Request
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi.middleware.cors import CORSMiddleware
import os
import json
import subprocess
import sys
import uuid

# FastAPI setup
app = FastAPI(title="Plant Disease Detection")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static directory
app.mount("/static", StaticFiles(directory="static"), name="static")

# Templates
templates = Jinja2Templates(directory="templates")

# Get base directory
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
INFERENCE_SCRIPT = os.path.join(BASE_DIR, "inference.py")

def call_inference(image_bytes):
    """Call external inference script to predict disease"""
    try:
        # Call the inference script with image bytes
        # Increased timeout to 60 seconds for TensorFlow loading
        result = subprocess.run(
            [sys.executable, INFERENCE_SCRIPT],
            input=image_bytes,
            capture_output=True,
            timeout=60,
            text=False  # Keep as binary
        )
        
        # Get stderr for logging
        stderr_text = result.stderr.decode('utf-8', errors='ignore')
        if stderr_text and ("✅" in stderr_text or "📦" in stderr_text or "❌" in stderr_text):
            print(f"[Inference] {stderr_text[:300]}", flush=True)
        
        # Get stdout
        stdout_text = result.stdout.decode('utf-8', errors='ignore').strip()
        
        if result.returncode != 0:
            print(f"❌ Inference script error (code {result.returncode}): {stderr_text[:200]}")
            return {
                "success": False,
                "error": f"Inference failed: {stderr_text[:100]}"
            }
        
        if not stdout_text:
            print("❌ No output from inference script")
            return {
                "success": False,
                "error": "No prediction output"
            }
        
        # Parse JSON
        try:
            prediction = json.loads(stdout_text)
            print(f"✅ Prediction: {prediction.get('label', 'unknown')} ({prediction.get('confidence', 0)}%)")
            return prediction
        except json.JSONDecodeError as e:
            print(f"❌ JSON parse error: {e}")
            print(f"   Output was: {stdout_text[:200]}")
            return {
                "success": False,
                "error": f"Invalid prediction format"
            }
            
    except subprocess.TimeoutExpired:
        print("⚠️  Inference timeout (60s)")
        return {
            "success": False,
            "error": "Model loading took too long - try again"
        }
    except Exception as e:
        print(f"❌ Error calling inference: {e}")
        import traceback
        traceback.print_exc()
        return {
            "success": False,
            "error": str(e)
        }

# Routes
@app.get("/", response_class=HTMLResponse)
async def home(request: Request):
    """Home page"""
    return templates.TemplateResponse("index.html", {
        "request": request,
        "result": None,
        "error": None,
        "image_path": None
    })

@app.post("/predict", response_class=HTMLResponse)
async def predict_route(request: Request, file: UploadFile = File(...)):
    """Handle image upload and prediction"""
    try:
        upload_dir = "static/uploads"
        os.makedirs(upload_dir, exist_ok=True)

        # Safe filename
        original_name = file.filename if file.filename else "image.jpg"
        filename = str(uuid.uuid4()) + "_" + original_name
        file_path = os.path.join(upload_dir, filename)

        # Read file
        content = await file.read()

        if not content:
            raise Exception("Empty file uploaded")

        # Save file
        with open(file_path, "wb") as f:
            f.write(content)

        # Call inference
        print(f"🔍 Making prediction on {filename}")
        result = call_inference(content)

        return templates.TemplateResponse("index.html", {
            "request": request,
            "result": result,
            "image_path": "/" + file_path.replace("\\", "/"),
            "error": None if result.get("success") else result.get("error")
        })

    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        return templates.TemplateResponse("index.html", {
            "request": request,
            "result": None,
            "error": str(e),
            "image_path": None
        })

@app.post("/api/predict")
async def predict_api(file: UploadFile = File(...)):
    """JSON API endpoint for predictions"""
    try:
        content = await file.read()
        
        if not content:
            return JSONResponse(
                status_code=400,
                content={"success": False, "error": "Empty file"}
            )
        
        # Call inference
        result = call_inference(content)
        
        if result.get("success"):
            return JSONResponse(status_code=200, content=result)
        else:
            return JSONResponse(
                status_code=500,
                content=result
            )
            
    except Exception as e:
        print(f"❌ API error: {e}")
        return JSONResponse(
            status_code=500,
            content={"success": False, "error": str(e)}
        )

# Health check
@app.get("/health")
async def health():
    """Health check endpoint"""
    return {"status": "ok", "service": "crop_disease_detection"}

if __name__ == "__main__":
    import uvicorn
    print("🚀 Starting Crop Disease Detection Server...")
    print(f"📁 Using inference script: {INFERENCE_SCRIPT}")
    uvicorn.run(app, host="0.0.0.0", port=8000)
