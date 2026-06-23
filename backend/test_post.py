import requests

# Login to get JWT
login_url = "http://localhost:8000/api/auth/login/"
res = requests.post(login_url, json={"username": "owner", "password": "owner123"})
tokens = res.json()
access_token = tokens.get("access")

headers = {
    "Authorization": f"Bearer {access_token}",
    "Content-Type": "application/json"
}

mela_settings_url = "http://localhost:8000/api/v1/mela-settings/"
payload = {
    "mela_name": "Varahi Grand Monsoon Mela",
    "start_date": "",
    "end_date": "",
    "location": "Varahi Ground, Pendurthi",
    "is_active": True
}

res2 = requests.post(mela_settings_url, json=payload, headers=headers)
print("POST status:", res2.status_code)
print("POST response:", res2.text)
