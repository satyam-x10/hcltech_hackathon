import base64
import numpy as np
import cv2
import os
import json

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from models.groq_chat import chat_with_groq
router = APIRouter()
from skimage.metrics import structural_similarity as ssim
from skimage.metrics import structural_similarity as ssim

def compare_faces_ssim(img1, img2):
    """Simple grayscale SSIM comparison."""
    gray1 = cv2.cvtColor(cv2.resize(img1, (200, 200)), cv2.COLOR_BGR2GRAY)
    gray2 = cv2.cvtColor(cv2.resize(img2, (200, 200)), cv2.COLOR_BGR2GRAY)
    score, _ = ssim(gray1, gray2, full=True)
    return score

# ---------- File I/O Helpers ----------
USER_FILE = "config/users.json"

def load_users():
    with open(USER_FILE, "r") as f:
        return json.load(f)

def save_users(users):
    with open(USER_FILE, "w") as f:
        json.dump(users, f, indent=2)

# ---------- Image Utility ----------
def decode_base64_image(base64_str):
    image_bytes = base64.b64decode(base64_str.split(",")[-1])
    nparr = np.frombuffer(image_bytes, np.uint8)
    return cv2.imdecode(nparr, cv2.IMREAD_COLOR)

# ---------- Models ----------
class PhotoLoginRequest(BaseModel):
    id_number: str
    image_data: str

class RegisterRequest(BaseModel):
    name: str
    id_number: str
    image_data: str

class TransferRequest(BaseModel):
    to_account: str
    amount: float

# ---------- Endpoints ----------
from fastapi import Request, APIRouter

router = APIRouter()

@router.post("/user/register")
def register_user(req: RegisterRequest):
    users = load_users()

    if req.id_number in users:
        raise HTTPException(status_code=400, detail="User already exists.")

    image = decode_base64_image(req.image_data)
    image_path = f"faces/{req.id_number}.jpg"
    os.makedirs("faces", exist_ok=True)
    cv2.imwrite(image_path, image)

    users[req.id_number] = {
        "name": req.name,
        "id_number": req.id_number,
        "photo_path": image_path,
        "balance": 0,
        "transactions": [],
        "risk_profile": "moderate"
    }

    save_users(users)

    return {
        "success": True,
        "message": f"User {req.name} registered successfully.",
        "user": users[req.id_number]
    }


@router.post("/user/login")
def photo_login(req: PhotoLoginRequest):
    users = load_users()
    user = users.get(req.id_number)

    if not user:
        return {
            "success": False,
            "message": "User not found. Please register.",
            "user": None
        }

    if "photo_path" not in user or not os.path.exists(user["photo_path"]):
        return {
            "success": False,
            "message": "No registered photo found.",
            "user": None
        }

    # Decode uploaded image
    uploaded_img = decode_base64_image(req.image_data)
    stored_img = cv2.imread(user["photo_path"])

    similarity = compare_faces_ssim(uploaded_img, stored_img)

    if similarity > 0.75:
        return {
            "success": True,
            "message": f"Welcome back, {user['name']}!",
            "user": user
        }
    else:
        return {
            "success": False,
            "message": f"Face mismatch (Similarity: {similarity:.2f}).",
            "user": None
        }
@router.get("/user/{user_id}/balance")
def get_balance(user_id: str):
    users = load_users()
    user = users.get(user_id)

    if not user:
        raise HTTPException(status_code=404, detail="User not found.")

    return {
        "success": True,
        "balance": user["balance"]
    }

@router.post("/user/{user_id}/transfer")
def transfer_funds(user_id: str, req: TransferRequest):
    users = load_users()

    sender = users.get(user_id)
    receiver = users.get(req.to_account)

    if not sender:
        raise HTTPException(status_code=404, detail="Sender not found.")
    if not receiver:
        raise HTTPException(status_code=404, detail="Recipient not found.")

    sender_balance = float(sender["balance"])
    if sender_balance < req.amount:
        raise HTTPException(status_code=400, detail="Insufficient funds.")

    sender["balance"] = sender_balance - req.amount
    receiver["balance"] = float(receiver["balance"]) + req.amount

    # add transaction history
    sender["transactions"].append({
        "to": req.to_account,
        "amount": req.amount,
        "type": "debit",
        "timestamp": "2023-10-01T12:00:00Z"  # Placeholder timestamp
    })
    receiver["transactions"].append({
        "from": user_id,
        "amount": req.amount,
        "type": "credit",
        "timestamp": "2023-10-01T12:00:00Z"  # Placeholder timestamp
    })

    save_users(users)

    return {
        "success": True,
        "message": f"Transferred ₹{req.amount} to {receiver['name']}.",
        "new_balance": sender["balance"],
        "transaction_history": sender["transactions"]
    }




@router.post("/user/{user_id}/advice")
async def get_advice(user_id: str, request: Request):
    body = await request.json()  # Correct way to parse JSON body
    print("Raw Body:", body)
    choice = body.get("choice")
    print("Choice Extracted:", choice)
    users = load_users()
    user = users.get(user_id)

    advice = await chat_with_groq(
        f"User {user_id} is looking for advice on {choice}. "
        "Based on the user's profile and financial data, provide tailored advice."
        f"here is the user profile data:\n {user}.\n PLese only returnin paragraph and statement"
    )
    return {
        "success": True,
        "advice": advice
    }


@router.post("/user/{user_id}/loan")
async def get_loan_status(user_id: str):
    users = load_users()
    user = users.get(user_id)

    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
    
    prompt = (
        f"User {user['name']} (ID: {user['id_number']}) is requesting a loan.\n"
        f"User profile data: {json.dumps(user, indent=2)}\n"
        "Based on the risk profile and overall financial data, "
        "evaluate the eligibility and provide a loan status in the following JSON format:\n\n"
        '{\n  "approved": true/false,\n  "amount": number,\n  "interest_rate": number,\n  "remarks": string\n}.' \
        'do not exolain anything, only return json'
    )

    response = await chat_with_groq(prompt)

    return {
        "success": True,
        "loan_status": response
    }



@router.get("/user/{user_id}/update")
def update_user_data(user_id: str,req:Request):
    users = load_users()
    user = users.get(user_id)

    new_data = req.new_data
    if not new_data:
        raise HTTPException(status_code=400, detail="No new data provided.")
    


    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
    
    # Update user data with new_data
    for key, value in new_data.items():
        if key in user:
            user[key] = value
        else:
            raise HTTPException(status_code=400, detail=f"Invalid field: {key}")
        
    return {
        "success": True,
        "message": f"User {user['name']} data updated successfully.",
        "user": user
    }    

@router.post("/user/{user_id}/natasha")
async def get_natasha_advice(user_id: str, req: Request):
    users = load_users()
    user = users.get(user_id)

    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
    
    body = await req.json()
    message = body.get("message", "")

    prompt = (
        "You are a bank assistant named Natasha, "
        "and you are helping the user with their financial queries.\n"
        f"User {user['name']} (ID: {user['id_number']}) is looking for financial advice.\n"
        f"User profile data:\n{json.dumps(user, indent=2)}\n"
        "Based on the risk profile and overall financial data, "
        "provide tailored advice. if user is greeting dont talk much just a brief intro.\n"
        f"The user said: \"{message}\""
    )

    advice_text = await chat_with_groq(prompt)

    return {
        "success": True,
        "user_id": user_id,
        "data": {
            "name": user["name"],
            "advice": advice_text.strip(),
        }
    }

