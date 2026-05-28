import multiprocessing

worker_class = "uvicorn.workers.UvicornWorker"
workers = multiprocessing.cpu_count() * 2 + 1
timeout = 30
bind = "0.0.0.0:8001"
