from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from openai import OpenAI
from fastapi.middleware.cors import CORSMiddleware
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()
api_key = os.getenv("OPENAI_API_KEY")
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Allow only your frontend origin
    allow_credentials=True,
    allow_methods=["*"],  # Allow all methods (GET, POST, etc.)
    allow_headers=["*"],  # Allow all headers
)

client = OpenAI()


class ProgramNoteRequest(BaseModel):
    piece_name: str
    composer: str

@app.post("/generate_program_note/")
async def generate_program_note(request: ProgramNoteRequest):
    prompt = (
        f"Write a short program note for the piece '{request.piece_name}' by {request.composer}. "
        "Provide a brief historical background, stylistic characteristics, and its significance."
    )
    
    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "system", "content": "You are an expert in classical music."}, {"role": "user", "content": prompt}]
        )

        program_note = response.choices[0].message.content
        return {"piece": request.piece_name, "composer": request.composer, "program_note": program_note}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
