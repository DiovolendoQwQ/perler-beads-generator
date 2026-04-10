from fastapi import FastAPI, BackgroundTasks, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import time
import uuid
import threading
import os
import base64
import numpy as np
import cv2

app = FastAPI(title="Cartoonize API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ImageRequest(BaseModel):
    image_base64: str

# --- TASK QUEUE FOR SANDBOX ---
mock_tasks = {}

def base64_to_cv2(base64_str):
    # Remove header if present
    if "," in base64_str:
        base64_str = base64_str.split(",")[1]
    img_data = base64.b64decode(base64_str)
    np_arr = np.frombuffer(img_data, np.uint8)
    img = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
    return img

def cv2_to_base64(img):
    _, buffer = cv2.imencode('.png', img)
    b64 = base64.b64encode(buffer).decode('utf-8')
    return "data:image/png;base64," + b64

def process_fast_cartoonize(img):
    """
    OpenCV based fast cartoon filter.
    """
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    gray = cv2.medianBlur(gray, 5)
    edges = cv2.adaptiveThreshold(gray, 255, cv2.ADAPTIVE_THRESH_MEAN_C, cv2.THRESH_BINARY, 9, 9)
    color = cv2.bilateralFilter(img, 9, 300, 300)
    cartoon = cv2.bitwise_and(color, color, mask=edges)
    return cartoon

def process_hq_cartoonize(img):
    """
    OpenCV based high quality cartoon filter (simulating more passes).
    """
    # Stylization
    styled = cv2.stylization(img, sigma_s=60, sigma_r=0.07)
    
    # Edges
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    gray = cv2.medianBlur(gray, 7)
    edges = cv2.adaptiveThreshold(gray, 255, cv2.ADAPTIVE_THRESH_MEAN_C, cv2.THRESH_BINARY, 9, 2)
    
    # Color Smoothing
    color = styled
    for _ in range(2):
        color = cv2.bilateralFilter(color, 9, 300, 300)
        
    cartoon = cv2.bitwise_and(color, color, mask=edges)
    return cartoon

def simulate_diffusion_task(task_id: str, image_base64: str):
    mock_tasks[task_id] = {"status": "PROCESSING", "progress": 0, "result": None}
    total_steps = 10
    
    try:
        img = base64_to_cv2(image_base64)
        
        for step in range(total_steps):
            time.sleep(0.5) # Simulate GPU processing time (Wait 5s total)
            progress = int(((step + 1) / total_steps) * 100)
            mock_tasks[task_id]["progress"] = progress
            
        result_img = process_hq_cartoonize(img)
        result_base64 = cv2_to_base64(result_img)
        
        mock_tasks[task_id]["status"] = "COMPLETED"
        mock_tasks[task_id]["result"] = result_base64
    except Exception as e:
        print(f"Task failed: {e}")
        mock_tasks[task_id]["status"] = "FAILED"

@app.post("/api/cartoonize/fast")
async def cartoonize_fast(req: ImageRequest):
    """
    Uses OpenCV to perform a real fast cartoonization.
    """
    try:
        img = base64_to_cv2(req.image_base64)
        result_img = process_fast_cartoonize(img)
        result_base64 = cv2_to_base64(result_img)
        return {"result": result_base64}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/cartoonize/high-quality")
async def cartoonize_high_quality(req: ImageRequest, background_tasks: BackgroundTasks):
    """
    Simulates Stable Diffusion inference via a simulated task queue,
    but performs an actual HQ cartoonization using OpenCV.
    """
    task_id = str(uuid.uuid4())
    mock_tasks[task_id] = {"status": "PENDING", "progress": 0, "result": None}
    
    threading.Thread(target=simulate_diffusion_task, args=(task_id, req.image_base64)).start()
    return {"task_id": task_id}

@app.get("/api/tasks/{task_id}")
async def get_task_status(task_id: str):
    """
    Poll task status.
    """
    # In production:
    # task = celery_app.AsyncResult(task_id)
    # if task.state == 'PROCESSING':
    #     progress = task.info.get('progress', 0)
    # ...
    
    if task_id not in mock_tasks:
        raise HTTPException(status_code=404, detail="Task not found")
        
    return mock_tasks[task_id]

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
