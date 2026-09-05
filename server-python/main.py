import logging
import os
import google.generativeai as genai
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

load_dotenv()

# 1. Configuration & Persona
# This instruction tells the bot exactly how to behave and what NexaSphere is.
SYSTEM_PROMPT = """
You are Nexa-AI, the official digital assistant for NexaSphere, GL Bajaj's student-driven tech ecosystem. 
Your tone is futuristic, helpful, and professional.

About NexaSphere:
- Goal: To foster innovation, learning, and collaboration among students.
- Structure: Includes sections for Activities (coding, workshops), Events (hackathons, sessions), and a Core Team.
- Call to Action: Encourage users to 'Join as Member' or 'Apply for Core Team' if they seem interested.

If asked about something unrelated to tech or NexaSphere, politely steer the conversation back to the ecosystem or provide general tech guidance.
"""

# 2. Initialize Gemini
API_KEY = "AIzaSyBGuAv-NvJwUkjwrz3RJNaDSiFMihFWvLo"
genai.configure(api_key=API_KEY)

model = genai.GenerativeModel(
    model_name='gemini-3.1-flash-lite-preview',
    system_instruction=SYSTEM_PROMPT
)

app = FastAPI(title="NexaSphere AI Core")

# 3. CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ChatRequest(BaseModel):
    message: str

# 4. Chat Endpoint
@app.post("/ai/chat")
async def chat_with_ai(request: ChatRequest):
    try:
        # We send the user message to the model initialized with system instructions
        response = model.generate_content(request.message)
        
        if not response.text:
            return {"reply": "Nexa-AI is processing, but returned an empty signal. Try rephrasing."}
            
        return {"reply": response.text}

    except Exception as e:
        error_msg = str(e)
        print(f"DEBUG ERROR: {error_msg}")
        
        # Friendly error handling for Quota limits
        if "429" in error_msg:
            return {"reply": "Nexa-AI is currently at peak capacity (Quota Limit). Please wait 60 seconds."}
        
        return {"reply": "Nexa-AI Core Offline. Connection recalibrating..."}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)