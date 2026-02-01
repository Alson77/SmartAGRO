from fastapi import FastAPI, File, UploadFile, Request
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from PIL import Image
import os
import shutil

# Use a dummy predict function if your real model is not ready
# You can replace this with your actual model import
def predict(image: Image.Image):
    # Example result format matching your template
    return {
        "label": "Healthy",
        "confidence": 0.95,
        "remedy": "No action needed"
    }

# -------------------------------
# App Setup
# -------------------------------
app = FastAPI(title="Plant Disease Detection")

# Absolute path to avoid template errors
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# Static & Templates
app.mount("/static", StaticFiles(directory=os.path.join(BASE_DIR, "static")), name="static")
app.mount("/uploads", StaticFiles(directory=os.path.join(BASE_DIR, "uploads")), name="uploads")
templates = Jinja2Templates(directory=os.path.join(BASE_DIR, "templates"))

# Upload directory
UPLOAD_DIR = os.path.join(BASE_DIR, "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

# Allowed image types
ALLOWED_EXTENSIONS = {"jpg", "jpeg", "png", "webp"}

# -------------------------------
# Helper
# -------------------------------
def allowed_file(filename: str) -> bool:
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS

# -------------------------------
# Routes
# -------------------------------
@app.get("/", response_class=HTMLResponse)
async def home(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})

@app.post("/predict", response_class=HTMLResponse)
async def predict_disease(request: Request, file: UploadFile = File(...)):

    if not allowed_file(file.filename):
        return templates.TemplateResponse(
            "index.html",
            {"request": request, "error": "Invalid file type. Please upload JPG, PNG, or WEBP image."}
        )

    file_path = os.path.join(UPLOAD_DIR, file.filename)

    try:
        # Save uploaded file
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        # Open image
        image = Image.open(file_path).convert("RGB")

        # Call model
        result = predict(image)

        return templates.TemplateResponse(
            "index.html",
            {
                "request": request,
                "result": result,
                "image_path": f"/uploads/{file.filename}"
            }
        )

    except Exception as e:
        return templates.TemplateResponse(
            "index.html",
            {"request": request, "error": str(e)}
        )