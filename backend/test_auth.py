import requests
import time
import json

# Базовый URL API
BASE_URL = "http://localhost/api"

def test_auth_flow():
    """
    Тестирует полный цикл аутентификации с использованием refresh token
    """
    print("=== Тестирование системы аутентификации с refresh token ===")
    
    # 1. Логин пользователя
    print("\n1. Логин пользователя")
    login_data = {
        "username": "bogolyubov2003@bk.ru",  # Замените на существующего пользователя
        "password": "XaG-7ca-7hJ-TUJ"   # Замените на правильный пароль
    }
    
    login_response = requests.post(
        f"{BASE_URL}/auth/login",
        data=login_data
    )
    
    if login_response.status_code != 200:
        print(f"Ошибка при логине: {login_response.status_code}")
        print(login_response.text)
        return
    
    tokens = login_response.json()
    access_token = tokens["access_token"]
    refresh_token = tokens["refresh_token"]
    
    print(f"Получен access token: {access_token[:10]}...")
    print(f"Получен refresh token: {refresh_token[:10]}...")
    
    # 2. Получение данных пользователя с access token
    print("\n2. Получение данных пользователя с access token")
    headers = {"Authorization": f"Bearer {access_token}"}
    
    user_response = requests.get(
        f"{BASE_URL}/users/me/",
        headers=headers
    )
    
    if user_response.status_code != 200:
        print(f"Ошибка при получении данных пользователя: {user_response.status_code}")
        print(user_response.text)
        return
    
    user_data = user_response.json()
    print(f"Данные пользователя: {json.dumps(user_data, indent=2)}")
    
    # 3. Ждем, чтобы access token истек (в тестовых целях можно сделать короткий срок жизни)
    print("\n3. Ждем истечения срока действия access token (в реальном сценарии)")
    print("В тестовом сценарии просто попробуем использовать refresh token")
    
    # 4. Обновление токена с помощью refresh token
    print("\n4. Обновление токена с помощью refresh token")
    
    refresh_response = requests.post(
        f"{BASE_URL}/auth/refresh",
        json={"refresh_token": refresh_token}
    )
    
    if refresh_response.status_code != 200:
        print(f"Ошибка при обновлении токена: {refresh_response.status_code}")
        print(refresh_response.text)
        return
    
    new_tokens = refresh_response.json()
    new_access_token = new_tokens["access_token"]
    new_refresh_token = new_tokens["refresh_token"]
    
    print(f"Получен новый access token: {new_access_token[:10]}...")
    print(f"Получен новый refresh token: {new_refresh_token[:10]}...")
    
    # 5. Проверка нового access token
    print("\n5. Проверка нового access token")
    new_headers = {"Authorization": f"Bearer {new_access_token}"}
    
    new_user_response = requests.get(
        f"{BASE_URL}/users/me/",
        headers=new_headers
    )
    
    if new_user_response.status_code != 200:
        print(f"Ошибка при получении данных пользователя с новым токеном: {new_user_response.status_code}")
        print(new_user_response.text)
        return
    
    new_user_data = new_user_response.json()
    print(f"Данные пользователя с новым токеном: {json.dumps(new_user_data, indent=2)}")
    
    print("\n=== Тестирование успешно завершено ===")

if __name__ == "__main__":
    test_auth_flow()