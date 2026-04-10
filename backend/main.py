from fastapi import FastAPI, BackgroundTasks, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import time
import uuid
import threading
import os

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

# --- MOCK TASK QUEUE FOR SANDBOX ---
# In production, this would use Celery + Redis as shown in celery_worker.py.
# Since Redis is unavailable in the current sandbox, we use an in-memory dictionary
# to mock the exact same API behavior that Celery would provide.
mock_tasks = {}

def simulate_diffusion_task(task_id: str, image_base64: str):
    mock_tasks[task_id] = {"status": "PROCESSING", "progress": 0, "result": None}
    total_steps = 10
    
    # Simple image manipulation to visually confirm processing
    # (Just an example, we return the same image for simplicity,
    # or you could manipulate the base64 string slightly if desired)
    result_image = image_base64

    for step in range(total_steps):
        time.sleep(1) # Simulate GPU processing time
        progress = int(((step + 1) / total_steps) * 100)
        mock_tasks[task_id]["progress"] = progress
        
    mock_tasks[task_id]["status"] = "COMPLETED"
    mock_tasks[task_id]["result"] = result_image

@app.post("/api/cartoonize/fast")
async def cartoonize_fast(req: ImageRequest):
    """
    Simulates AnimeGANv2 fast ONNX inference.
    Takes ~500ms and returns synchronously.
    """
    time.sleep(0.5) # Mock inference time
    return {"result": req.image_base64} # Returns the mock result immediately

@app.post("/api/cartoonize/high-quality")
async def cartoonize_high_quality(req: ImageRequest, background_tasks: BackgroundTasks):
    """
    Simulates Stable Diffusion inference via Celery queue.
    Returns a task ID immediately.
    """
    task_id = str(uuid.uuid4())
    mock_tasks[task_id] = {"status": "PENDING", "progress": 0, "result": None}
    
    # In production:
    # task = generate_diffusion_image.delay(req.image_base64)
    # return {"task_id": task.id}
    
    # In sandbox:
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
