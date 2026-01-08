import requests
import time

def check_prod():
    url = 'https://outpassapp.onrender.com/api/auth/admin-login/'
    data = {'phone': '9999999900', 'password': 'admin'}
    
    print(f"Checking {url}...")
    try:
        response = requests.post(url, json=data, timeout=10)
        if response.status_code == 200:
            print("SUCCESS: Production login verified!")
            print("Response:", response.json())
        elif response.status_code == 401:
            print("FAILED: 401 Unauthorized. User might not exist yet (seed_data pending).")
        else:
            print(f"FAILED: Status {response.status_code}")
            print(response.text)
    except Exception as e:
        print(f"ERROR: {e}")

if __name__ == '__main__':
    check_prod()
