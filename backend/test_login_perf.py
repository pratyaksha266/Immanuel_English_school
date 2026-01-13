import requests
import time

API_URL = "https://immanuel-english-school-backend.onrender.com/api/auth/login/"
DATA = {
    "phone": "1234567890", # Replace with a real test phone if known
    "password": "wrong_password", # Testing with wrong password first to check pure latency
    "role": "PARENT"
}

def test_login_latency():
    print(f"Testing latency for {API_URL}...")
    start_time = time.time()
    try:
        response = requests.post(API_URL, json=DATA, timeout=30)
        end_time = time.time()
        print(f"Status Code: {response.status_code}")
        print(f"Response Time: {end_time - start_time:.2f} seconds")
        if response.status_code == 401:
            print("Successfully reached server (Invalid credentials as expected).")
        else:
            print(f"Response Body: {response.text}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    # Test multiple times to see if it's consistent or cold-start
    for i in range(3):
        print(f"\nRun {i+1}:")
        test_login_latency()
