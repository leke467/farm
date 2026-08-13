import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'terra_track.settings')
django.setup()

from rest_framework.test import APIClient
from django.contrib.auth import get_user_model
from farms.models import Farm

User = get_user_model()

def run_tests():
    print("=== STARTING AUTH ISOLATION & REGISTRATION TEST ===")
    client = APIClient()

    # Clean up test users if they exist
    User.objects.filter(username__in=['alpha_user_test', 'beta_user_test']).delete()

    # 1. Register User Alpha
    print("\n1. Registering User Alpha ('alpha_user_test')...")
    payload_a = {
        'username': 'alpha_user_test',
        'email': 'alpha@example.com',
        'first_name': 'Alpha',
        'last_name': 'Tester',
        'password': 'password123',
        'confirm_password': 'password123',
        'phone': '1234567890',
        'farm_name': 'Alpha Valley Farm',
        'farm_location': 'Alpha City',
        'farm_size': 'medium',
        'farm_type': 'mixed',
        'farm_address': '123 Alpha St',
        'farm_total_area': '50.0',
        'farm_description': 'Test farm Alpha'
    }
    resp_a = client.post('/api/auth/register/', payload_a, format='json')
    assert resp_a.status_code == 201, f"Alpha registration failed: {resp_a.data}"
    token_a = resp_a.data['token']
    user_a = resp_a.data['user']
    print(f"Alpha registration SUCCESS: User ID {user_a['id']}, Token: {token_a[:10]}...")

    # Verify User Alpha's profile & farms
    client.credentials(HTTP_AUTHORIZATION=f'Token {token_a}')
    me_a = client.get('/api/auth/profile/').data
    assert me_a['username'] == 'alpha_user_test', f"Expected alpha_user_test, got {me_a['username']}"
    assert me_a['email'] == 'alpha@example.com'

    farms_a = client.get('/api/farms/').data
    farm_list_a = farms_a.get('results', farms_a) if isinstance(farms_a, dict) else farms_a
    assert len(farm_list_a) == 1, f"Expected 1 farm for Alpha, got {len(farm_list_a)}"
    assert farm_list_a[0]['name'] == 'Alpha Valley Farm'

    animals_a = client.get(f"/api/animals/?farm={farm_list_a[0]['id']}").data
    anim_list_a = animals_a.get('results', animals_a) if isinstance(animals_a, dict) else animals_a
    assert len(anim_list_a) == 0, f"Expected 0 animals for new real farm Alpha, got {len(anim_list_a)}"
    print("Alpha profile, farm, and 0-animal clean slate VERIFIED!")

    # 2. Register User Beta
    print("\n2. Registering User Beta ('beta_user_test')...")
    payload_b = {
        'username': 'beta_user_test',
        'email': 'beta@example.com',
        'first_name': 'Beta',
        'last_name': 'Tester',
        'password': 'password123',
        'confirm_password': 'password123',
        'phone': '0987654321',
        'farm_name': 'Beta Plateau Farm',
        'farm_location': 'Beta Town',
        'farm_size': 'small',
        'farm_type': 'crop',
        'farm_address': '456 Beta Ave',
        'farm_total_area': '10.0',
        'farm_description': 'Test farm Beta'
    }
    resp_b = client.post('/api/auth/register/', payload_b, format='json')
    assert resp_b.status_code == 201, f"Beta registration failed: {resp_b.data}"
    token_b = resp_b.data['token']
    user_b = resp_b.data['user']
    print(f"Beta registration SUCCESS: User ID {user_b['id']}, Token: {token_b[:10]}...")

    # Verify User Beta's profile & farms (must NOT match Alpha!)
    client.credentials(HTTP_AUTHORIZATION=f'Token {token_b}')
    me_b = client.get('/api/auth/profile/').data
    assert me_b['username'] == 'beta_user_test', f"Expected beta_user_test, got {me_b['username']}"
    assert me_b['email'] == 'beta@example.com'
    assert me_b['id'] != user_a['id'], "User Beta MUST NOT match User Alpha!"

    farms_b = client.get('/api/farms/').data
    farm_list_b = farms_b.get('results', farms_b) if isinstance(farms_b, dict) else farms_b
    assert len(farm_list_b) == 1, f"Expected 1 farm for Beta, got {len(farm_list_b)}"
    assert farm_list_b[0]['name'] == 'Beta Plateau Farm'
    assert farm_list_b[0]['id'] != farm_list_a[0]['id'], "Farm Beta MUST NOT match Farm Alpha!"

    animals_b = client.get(f"/api/animals/?farm={farm_list_b[0]['id']}").data
    anim_list_b = animals_b.get('results', animals_b) if isinstance(animals_b, dict) else animals_b
    assert len(anim_list_b) == 0, f"Expected 0 animals for new real farm Beta, got {len(anim_list_b)}"
    print("Beta profile, farm, and 0-animal clean slate VERIFIED!")

    # 3. Register User Gamma with email as username
    print("\n3. Registering User Gamma with email as username ('gamma_user@gmail.com')...")
    payload_g = {
        'username': 'gamma_user@gmail.com',
        'email': 'gamma_user@gmail.com',
        'first_name': 'Gamma',
        'last_name': 'Tester',
        'password': 'password123',
        'confirm_password': 'password123',
        'phone': '09033506394',
        'farm_name': 'Gamma Farm',
        'farm_location': 'Gamma City',
        'farm_size': 'medium',
        'farm_type': 'mixed',
        'farm_address': '789 Gamma St',
        'farm_total_area': '1.0',
        'farm_description': 'Test farm Gamma'
    }
    resp_g = client.post('/api/auth/register/', payload_g, format='json')
    assert resp_g.status_code == 201, f"Gamma registration failed: {resp_g.data}"
    token_g = resp_g.data['token']
    user_g = resp_g.data['user']
    print(f"Gamma registration SUCCESS: User ID {user_g['id']}, Token: {token_g[:10]}...")

    client.credentials(HTTP_AUTHORIZATION=f'Token {token_g}')
    me_g = client.get('/api/auth/profile/').data
    assert me_g['username'] == 'gamma_user@gmail.com'
    assert me_g['email'] == 'gamma_user@gmail.com'
    print("Gamma email-username registration and isolation VERIFIED!")

    # 4. Clean up test users
    User.objects.filter(username__in=['alpha_user_test', 'beta_user_test', 'gamma_user@gmail.com']).delete()
    print("\n=== ALL AUTH ISOLATION TESTS PASSED 100% SUCCESSFULLY! ===")

if __name__ == '__main__':
    run_tests()
