#!/usr/bin/env python3
"""Generate Go Fish game icon via RunningHub API"""
import requests
import json
import time
import sys
import os

API_KEY = "c9daa99350384cfa90ce7eaacead3f7a"
BASE_URL = "https://www.runninghub.cn"

# Step 1: Check account info
resp = requests.post(f"{BASE_URL}/api/openapi/userInfo", json={"apiKey": API_KEY})
print("User info:", json.dumps(resp.json(), indent=2))

# Step 2: Try to create with a well-known SDXL text-to-image workflow
# Using workflow 1914855659867058176 (popular SDXL icon generator)
# If that fails, we'll try another approach

# Common workflow IDs for text-to-image on RunningHub
workflow_ids_to_try = [
    "1914855659867058176",  # SDXL popular
    "1913705302492954624",  # Another SDXL
    "1904101666750783488",  # FLUX
]

prompt = "game icon for Go Fish card game, colorful playing cards, fish illustration, 3D rendered, glossy, vibrant blue background, professional app icon, 1024x1024"
negative_prompt = "text, watermark, blurry, low quality, distorted"

for wf_id in workflow_ids_to_try:
    print(f"\nTrying workflow: {wf_id}")
    
    # Get workflow node info first
    try:
        resp = requests.post(f"{BASE_URL}/api/openapi/getJsonApiFormat",
            json={"apiKey": API_KEY, "workflowId": wf_id}, timeout=15)
        data = resp.json()
        if data.get("code") != 0:
            print(f"  Failed to get workflow: {data}")
            continue
        print(f"  Workflow nodes: {json.dumps(data, indent=2)[:500]}")
        
        # Extract node IDs for text prompts
        nodes_info = data.get("data", [])
        node_list = []
        for node in nodes_info:
            node_id = node.get("nodeId", "")
            fields = node.get("fields", [])
            for field in fields:
                field_name = field.get("fieldName", "")
                if "text" in field_name.lower() or "prompt" in field_name.lower():
                    if "negative" not in field_name.lower() and "neg" not in field_name.lower():
                        node_list.append({"nodeId": node_id, "fieldName": field_name, "fieldValue": prompt})
                    else:
                        node_list.append({"nodeId": node_id, "fieldName": field_name, "fieldValue": negative_prompt})
                elif "width" in field_name.lower():
                    node_list.append({"nodeId": node_id, "fieldName": field_name, "fieldValue": "1024"})
                elif "height" in field_name.lower():
                    node_list.append({"nodeId": node_id, "fieldName": field_name, "fieldValue": "1024"})
        
        if not node_list:
            print("  No text/prompt fields found, trying default node 6...")
            node_list = [
                {"nodeId": "6", "fieldName": "text", "fieldValue": prompt},
                {"nodeId": "3", "fieldName": "seed", "fieldValue": "42"},
            ]
        
        print(f"  Submitting with nodes: {json.dumps(node_list, indent=2)}")
        
        # Create task
        resp = requests.post(f"{BASE_URL}/task/openapi/create",
            json={
                "apiKey": API_KEY,
                "workflowId": wf_id,
                "nodeInfoList": node_list
            }, timeout=30)
        create_data = resp.json()
        print(f"  Create response: {json.dumps(create_data, indent=2)}")
        
        if create_data.get("code") != 0:
            print(f"  Task creation failed: {create_data}")
            continue
            
        task_id = create_data.get("data", {}).get("taskId")
        if not task_id:
            print("  No task ID returned")
            continue
        
        print(f"  Task ID: {task_id}")
        
        # Poll for results
        for attempt in range(60):
            time.sleep(5)
            resp = requests.post(f"{BASE_URL}/task/openapi/outputs",
                json={"apiKey": API_KEY, "taskId": task_id}, timeout=15)
            output_data = resp.json()
            print(f"  Poll {attempt+1}: code={output_data.get('code')}")
            
            if output_data.get("code") == 0:
                files = output_data.get("data", [])
                for f in files:
                    file_url = f.get("fileUrl", "")
                    print(f"  ✅ Generated: {file_url} ({f.get('fileType', 'unknown')})")
                    
                    # Download the image
                    if file_url:
                        img_resp = requests.get(file_url, timeout=30)
                        out_dir = "/home/msdn/gamezipper.com/go-fish"
                        # Save as icon
                        with open(f"{out_dir}/icon.png", "wb") as imgf:
                            imgf.write(img_resp.content)
                        print(f"  ✅ Saved icon.png ({len(img_resp.content)} bytes)")
                        
                        # Also save as og-image
                        with open(f"{out_dir}/og-image.png", "wb") as imgf:
                            imgf.write(img_resp.content)
                        print(f"  ✅ Saved og-image.png")
                sys.exit(0)
            elif output_data.get("code") == 805:
                print(f"  ❌ Task failed: {output_data}")
                break
        
    except Exception as e:
        print(f"  Error with workflow {wf_id}: {e}")
        continue

print("\n❌ All workflows failed. Will use a generated SVG icon instead.")
