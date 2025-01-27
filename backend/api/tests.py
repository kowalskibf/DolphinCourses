import os
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')

from django.test import TestCase
from rest_framework.test import APITestCase
from django.contrib.auth.models import User
from .models import *
from .views import *

class RegisterViewTestCase(APITestCase):
    def setUp(self):
        self.url = '/api/register'

    def test_user_registration_success(self):
        """
        Test successful user registration.
        """
        data = {
            "username": "testuser",
            "email": "testuser@example.com",
            "password": "password123"
        }
        response = self.client.post(self.url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["message"], "User created successfully.")
        self.assertTrue(User.objects.filter(username="testuser").exists())
        self.assertTrue(Account.objects.filter(user__username="testuser").exists())
        self.assertTrue(AccountSocials.objects.filter(id=Account.objects.get(user__username="testuser").id).exists())

    def test_user_registration_invalid(self):
        """
        Test registration with missing fields.
        """
        data = {"username": "", "email": "", "password": ""}
        response = self.client.post(self.url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_user_registration_username_taken(self):
        """
        Test registration with taken username.
        """
        User.objects.create_user(username="taken123", password="password123")
        data = {"username": "taken123", "email": "taken123@example.com", "password": "password123"}
        response = self.client.post(self.url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_409_CONFLICT)

class ProfileSetupViewTestCase(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="testuser", password="password123")
        self.socials = AccountSocials.objects.create()
        self.account = Account.objects.create(user=self.user, socials=self.socials)
        self.client.force_authenticate(user=self.user)
        self.url = "/api/profile/setup"

    def test_profile_setup_success(self):
        """
        Test successful profile setup.
        """
        data = {
            "firstName": "John",
            "lastName": "Doe",
            "bio": "I am a developer.",
            "facebook": "https://facebook.com/johndoe",
            "instagram": "https://instagram.com/johndoe",
            "tiktok": "https://tiktok.com/@johndoe",
            "linkedin": "https://linkedin.com/in/johndoe"
        }
        response = self.client.post(self.url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["message"], "Profile saved successfully.")

        self.user.refresh_from_db()
        self.socials.refresh_from_db()
        self.account.refresh_from_db()
        self.assertEqual(self.user.first_name, "John")
        self.assertEqual(self.user.last_name, "Doe")
        self.assertEqual(self.account.bio, "I am a developer.")
        self.assertEqual(self.socials.facebook, "https://facebook.com/johndoe")
        self.assertEqual(self.socials.instagram, "https://instagram.com/johndoe")

class MyProfileViewTestCase(APITestCase):
    def setUp(self):
        """
        Przygotowanie danych testowych.
        """
        self.user = User.objects.create_user(
            username="testuser",
            password="password123",
            first_name="John",
            last_name="Doe"
        )
        self.socials = AccountSocials.objects.create(
            facebook="https://facebook.com/testuser",
            instagram="https://instagram.com/testuser",
            tiktok="https://tiktok.com/@testuser",
            linkedin="https://linkedin.com/in/testuser"
        )
        self.account = Account.objects.create(
            user=self.user,
            socials=self.socials,
            bio="I am a developer."
        )
        self.client.force_authenticate(user=self.user)
        self.url = "/api/profile/me"  # Upewnij się, że ścieżka jest poprawna

    def test_my_profile_success(self):
        """
        Test poprawnego pobrania profilu.
        """
        response = self.client.get(self.url)
        
        # Sprawdzanie kodu statusu
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Sprawdzanie zawartości odpowiedzi
        serializer = AccountSerializer(self.account)
        self.assertEqual(response.data, serializer.data)

    def test_my_profile_unauthenticated(self):
        """
        Test pobrania profilu bez uwierzytelnienia.
        """
        self.client.logout()  # Wylogowanie użytkownika
        response = self.client.get(self.url)

        # Sprawdzanie kodu statusu
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)