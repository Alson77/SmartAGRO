#!/bin/bash
cd "/Users/alson/Desktop/SmartAGRO copy/src/crop_disease_detection"
export TF_ENABLE_METAL_PLUGIN=0
export TF_METAL_ENABLE_PLUGIN=0
export TF_CPP_MIN_LOG_LEVEL=2
export TF_ENABLE_ONEDNN_OPTS=0
/Users/alson/Desktop/SmartAGRO\ copy/venv311/bin/python -m uvicorn app:app --host 0.0.0.0 --port 8000
