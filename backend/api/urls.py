from django.urls import path
from . import views
from .views import *

urlpatterns = [
    path('register', RegisterView.as_view(), name='register'),
    path('profile/setup', ProfileSetupView.as_view(), name='profile_setup'),
    path('profile/me', MyProfileView.as_view(), name='my_profile'),
]