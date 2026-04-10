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

import traceback
import logging

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[logging.StreamHandler()]
)
logger = logging.getLogger("cartoonize")

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
    OpenCV based fast cartoon filter, resolution independent.
    """
    h, w = img.shape[:2]
    # Downscale for processing to make the filter size effective on large images
    max_dim = 800
    scale = max_dim / max(h, w)
    
    if scale < 1.0:
        small_w, small_h = int(w * scale), int(h * scale)
        work_img = cv2.resize(img, (small_w, small_h), interpolation=cv2.INTER_AREA)
    else:
        work_img = img

    gray = cv2.cvtColor(work_img, cv2.COLOR_BGR2GRAY)
    gray = cv2.medianBlur(gray, 5)
    edges = cv2.adaptiveThreshold(gray, 255, cv2.ADAPTIVE_THRESH_MEAN_C, cv2.THRESH_BINARY, 9, 9)
    color = cv2.bilateralFilter(work_img, 9, 300, 300)
    cartoon = cv2.bitwise_and(color, color, mask=edges)
    
    if scale < 1.0:
        cartoon = cv2.resize(cartoon, (w, h), interpolation=cv2.INTER_CUBIC)
        
    return cartoon

def process_pixel_art(img, pixel_size=8, num_colors=12, edge_thickness=1):
    """
    OpenCV based pixel art cartoonization.
    Directly converts the image into a clean, flat-color pixel art style 
    suitable for perler beads, without forcing a fixed small resolution.
    """
    h, w = img.shape[:2]
    
    # 1. Dynamic Downsample (Pixelation effect)
    # We calculate the downsample based on the pixel_size parameter (like a mosaic block size)
    small_w, small_h = max(1, w // pixel_size), max(1, h // pixel_size)
    small_img = cv2.resize(img, (small_w, small_h), interpolation=cv2.INTER_LINEAR)
    
    # 2. Smooth colors (Mean Shift)
    # This groups similar colors into flat regions
    smoothed = cv2.pyrMeanShiftFiltering(small_img, sp=15, sr=35)
    
    # 3. Color Quantization using K-Means (Reduce palette)
    data = smoothed.reshape((-1, 3)).astype(np.float32)
    criteria = (cv2.TERM_CRITERIA_EPS + cv2.TERM_CRITERIA_MAX_ITER, 20, 0.001)
    _, labels, centers = cv2.kmeans(
        data, num_colors, None, criteria, 10, cv2.KMEANS_RANDOM_CENTERS
    )
    centers = np.uint8(centers)
    quantized_small = centers[labels.flatten()].reshape(smoothed.shape)
    
    # 4. Optional Soft Edges (Using adaptive threshold instead of harsh Canny)
    if edge_thickness > 0:
        gray = cv2.cvtColor(smoothed, cv2.COLOR_BGR2GRAY)
        gray = cv2.medianBlur(gray, 3)
        edges = cv2.adaptiveThreshold(
            gray, 255, cv2.ADAPTIVE_THRESH_MEAN_C, cv2.THRESH_BINARY, blockSize=7, C=3
        )
        # Dilate edges slightly to make them visible but not overwhelming
        kernel = np.ones((edge_thickness, edge_thickness), np.uint8)
        edges = cv2.erode(edges, kernel, iterations=1) # Erode because lines are black (0)
        quantized_small = cv2.bitwise_and(quantized_small, quantized_small, mask=edges)
    
    # 5. Upsample back to original size using NEAREST to keep the sharp mosaic edges
    pixel_art = cv2.resize(quantized_small, (w, h), interpolation=cv2.INTER_NEAREST)
    
    return pixel_art

class HighQualityRequest(BaseModel):
    image_base64: str
    pixel_size: int = 8
    num_colors: int = 12

def simulate_diffusion_task(task_id: str, req: HighQualityRequest):
    logger.info(f"Task {task_id}: Started pixel art cartoonization with size={req.pixel_size}, colors={req.num_colors}")
    mock_tasks[task_id] = {"status": "PROCESSING", "progress": 0, "result": None, "error": None}
    total_steps = 10
    
    try:
        logger.info(f"Task {task_id}: Decoding base64 image")
        img = base64_to_cv2(req.image_base64)
        
        for step in range(total_steps):
            time.sleep(0.2) # Simulate processing time
            progress = int(((step + 1) / total_steps) * 100)
            mock_tasks[task_id]["progress"] = progress
            if progress % 20 == 0:  # Log every 20%
                logger.info(f"Task {task_id}: Processing... {progress}%")
            
        logger.info(f"Task {task_id}: Applying OpenCV Pixel Art filters")
        # Pass the dynamic parameters to the filter
        result_img = process_pixel_art(img, pixel_size=req.pixel_size, num_colors=req.num_colors)
        
        logger.info(f"Task {task_id}: Encoding result to base64")
        result_base64 = cv2_to_base64(result_img)
        
        mock_tasks[task_id]["status"] = "COMPLETED"
        mock_tasks[task_id]["result"] = result_base64
        logger.info(f"Task {task_id}: Completed successfully")
        
    except Exception as e:
        error_msg = str(e)
        error_trace = traceback.format_exc()
        logger.error(f"Task {task_id}: FAILED with error: {error_msg}\n{error_trace}")
        mock_tasks[task_id]["status"] = "FAILED"
        mock_tasks[task_id]["error"] = error_msg

@app.post("/api/cartoonize/fast")
async def cartoonize_fast(req: ImageRequest):
    """
    Uses OpenCV to perform a real fast cartoonization.
    """
    logger.info("Received FAST cartoonize request")
    try:
        start_time = time.time()
        img = base64_to_cv2(req.image_base64)
        result_img = process_fast_cartoonize(img)
        result_base64 = cv2_to_base64(result_img)
        elapsed = time.time() - start_time
        logger.info(f"FAST cartoonize completed successfully in {elapsed:.2f} seconds")
        return {"result": result_base64}
    except Exception as e:
        error_msg = str(e)
        error_trace = traceback.format_exc()
        logger.error(f"FAST cartoonize FAILED with error: {error_msg}\n{error_trace}")
        raise HTTPException(status_code=500, detail=error_msg)

@app.post("/api/cartoonize/high-quality")
async def cartoonize_high_quality(req: HighQualityRequest, background_tasks: BackgroundTasks):
    """
    Simulates Stable Diffusion inference via a simulated task queue,
    but performs an actual HQ cartoonization using OpenCV.
    """
    task_id = str(uuid.uuid4())
    logger.info(f"Received HIGH-QUALITY cartoonize request, generated Task ID: {task_id}")
    mock_tasks[task_id] = {"status": "PENDING", "progress": 0, "result": None, "error": None}
    
    threading.Thread(target=simulate_diffusion_task, args=(task_id, req)).start()
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
