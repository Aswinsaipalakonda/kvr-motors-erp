import urllib.request
import urllib.error
import json

def test():
    base_url = "http://127.0.0.1:8000"
    
    # 1. Login
    login_url = f"{base_url}/api/auth/login/"
    print(f"Logging in to {login_url}...")
    req = urllib.request.Request(
        login_url,
        data=json.dumps({"username": "supervisor", "password": "super123"}).encode("utf-8"),
        headers={"Content-Type": "application/json"}
    )
    
    try:
        with urllib.request.urlopen(req) as response:
            res_data = json.loads(response.read().decode("utf-8"))
            token = res_data["access"]
            print("Login successful. Token acquired.")
    except urllib.error.HTTPError as e:
        print("Login failed:", e.code, e.read().decode("utf-8"))
        return
        
    # 2. Fetch leads
    leads_url = f"{base_url}/api/v1/leads/"
    print(f"Fetching leads from {leads_url}...")
    req_leads = urllib.request.Request(
        leads_url,
        headers={"Authorization": f"Bearer {token}"}
    )
    try:
        with urllib.request.urlopen(req_leads) as response:
            print("Leads Response Status: 200")
    except urllib.error.HTTPError as e:
        print("Leads Response Status:", e.code, e.read().decode("utf-8"))
        
    # 3. Fetch users
    users_url = f"{base_url}/api/v1/users/"
    print(f"Fetching users from {users_url}...")
    req_users = urllib.request.Request(
        users_url,
        headers={"Authorization": f"Bearer {token}"}
    )
    try:
        with urllib.request.urlopen(req_users) as response:
            print("Users Response Status: 200")
    except urllib.error.HTTPError as e:
        print("Users Response Status:", e.code, e.read().decode("utf-8"))

if __name__ == "__main__":
    test()
