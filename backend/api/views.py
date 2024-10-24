from django.shortcuts import render
from rest_framework.views import APIView
from django.http import HttpResponse
from rest_framework.response import Response
from rest_framework import status, generics
from django.db import models
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.authentication import SessionAuthentication, TokenAuthentication
from django.contrib.auth.models import User
from django.core.validators import validate_email
from django.contrib.auth.hashers import check_password
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from .serializers import *
from django.utils import timezone
import json

class RegisterView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = [SessionAuthentication]
    def post(self, request):
        print('ebe')
        try:
            body = json.loads(request.body)
            username, email, password = body["username"], body["email"], body["password"]
        except (KeyError, json.JSONDecodeError):
            print('invalid body')
            return Response({"error": "Invalid request body."}, status=status.HTTP_400_BAD_REQUEST)
        if not username:
            print('puste username')
            return Response({"error": "Username required."}, status=status.HTTP_400_BAD_REQUEST)
        if len(username) > 25:
            print('za dlugi login')
            return Response({"error": "Username must be at most 25 characters long."}, status=status.HTTP_400_BAD_REQUEST)
        if not email:
            print('puste email')
            return Response({"error": "Email required."}, status=status.HTTP_400_BAD_REQUEST)
        if not password:
            print('puste pw')
            return Response({"error": "Password required."}, status=status.HTTP_400_BAD_REQUEST)
        if User.objects.filter(username=username).exists():
            print('username zajete')
            return Response({"error": "Username already taken."}, status=status.HTTP_409_CONFLICT)
        if User.objects.filter(email=email).exists():
            print('email zajete')
            return Response({"error": "Email already used."}, status=status.HTTP_409_CONFLICT)
        user = User(username=username, email=email)
        # try:
        #     validate_password(password, user)
        # except ValidationError as e:
        #     print('haslo zle')
        #     return Response({"error": e.messages}, status=status.HTTP_400_BAD_REQUEST)
        # try:
        #     validate_email(email)
        # except ValidationError as e:
        #     print('email zle')
        #     return Response({"error": e.messages}, status=status.HTTP_400_BAD_REQUEST)
        print('ok')
        user.set_password(password)
        user.save()
        accountSocials = AccountSocials()
        accountSocials.save()
        account = Account(user=user)
        account.socials = accountSocials
        account.user = user
        account.save()
        return Response({"message": "User created successfully."}, status=status.HTTP_201_CREATED)
    
class ProfileSetupView(APIView):
    def post(self, request):
        try:
            user = request.user
            body = json.loads(request.body)
            firstName, lastName, bio, facebook, instagram, tiktok, linkedin = body["firstName"], body["lastName"], body["bio"], body["facebook"], body["instagram"], body["tiktok"], body["linkedin"]
            account = Account.objects.get(user=user)
            accountSocials = account.socials
            if firstName:
                user.first_name = firstName
            if lastName:
                user.last_name = lastName
            if bio:
                account.bio = bio
            if facebook:
                accountSocials.facebook = facebook
            if instagram:
                accountSocials.instagram = instagram
            if tiktok:
                accountSocials.tiktok = tiktok
            if linkedin:
                accountSocials.linkedin = linkedin
            accountSocials.save()
            user.save()
            account.save()
            return Response({"message": "Profile saved successfully."}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"error": "Bad Request."}, status=status.HTTP_400_BAD_REQUEST)
        
class ProfileAvatarView(APIView):
    def put(self, request):
        try:
            user = request.user
            account = Account.objects.get(user=user)
            account.avatar = request.data.get("avatar")
            account.save()
            print("ok")
            return Response(status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
            
        
class MyProfileView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request):
        user = request.user
        account = Account.objects.get(user=user)
        serializer = AccountSerializer(account)
        return Response(serializer.data, status=status.HTTP_200_OK)

class CourseView(APIView):
    def post(self, request):
        try:
            user = request.user
            author = Account.objects.get(user=user)
            course = Course()
            course.author = author
            if name := request.data.get("name"):
                course.name = name
            if description := request.data.get("description"):
                course.description = description
            if image := request.data.get("image"):
                course.image = image
            if language := request.data.get("language"):
                course.language = language
            if duration := request.data.get("duration"):
                course.duration = duration
            if is_public := request.data.get("is_public"):
                course.is_public = is_public
            if price_currency := request.data.get("price_currency"):
                course.price_currency = price_currency
            if price := request.data.get("price"):
                course.price = price
            if promo_price := request.data.get("promo_price"):
                course.promo_price = promo_price
            if promo_expires := request.data.get("promo_expires"):
                course.promo_expires = promo_expires
            course.save()
            return Response({"message": "Course successfully created."}, status=status.HTTP_201_CREATED)
        except Exception as e:
            print(e)
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        
    def put(self, request, id):
        try:
            user = request.user
            account = Account.objects.get(user=user)
            course = Course.objects.get(id=id)
            if account != course.author:
                return Response(status=status.HTTP_401_UNAUTHORIZED)
            if name := request.data.get("name"):
                course.name = name
            if description := request.data.get("description"):
                course.description = description
            if image := request.data.get("image"):
                course.image = image
            if language := request.data.get("language"):
                course.language = language
            if duration := request.data.get("duration"):
                course.duration = duration
            if is_public := request.data.get("is_public"):
                course.is_public = is_public
            if price_currency := request.data.get("price_currency"):
                course.price_currency = price_currency
            if price := request.data.get("price"):
                course.price = price
            if promo_price := request.data.get("promo_price"):
                course.promo_price = promo_price
            if promo_expires := request.data.get("promo_expires"):
                course.promo_expires = promo_expires
            course.save()
            return Response({"message": "Course successfully created."}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"error": "Bad request."}, status=status.HTTP_400_BAD_REQUEST)
        
    def delete(self, request, id):
        try:
            user = request.user
            try:
                account = Account.objects.get(user=user)
            except Account.DoesNotExist:
                return Response(status=status.HTTP_401_UNAUTHORIZED)
            try:
                course = Course.objects.get(id=id)
            except Course.DoesNotExist:
                return Response(status=status.HTTP_404_NOT_FOUND)
            if account != course.author:
                return Response(status=status.HTTP_401_UNAUTHORIZED)
            course.delete()
            return Response(status=status.HTTP_200_OK)
        except:
            return Response(status=status.HTTP_400_BAD_REQUEST)
            
    def get(self, request, id):
        try:
            try:
                course = Course.objects.get(id=id)
            except Course.DoesNotExist:
                return Response(status=status.HTTP_404_NOT_FOUND)
            if not course.is_public:
                return Response(status=status.HTTP_401_UNAUTHORIZED)
            serializer = CourseSerializer(course)
            return Response(serializer.data)
        except:
            return Response(status=status.HTTP_400_BAD_REQUEST)

class MyCoursesView(APIView):
    def get(self, request):
        user = request.user
        author = Account.objects.get(user=user)
        courses = Course.objects.filter(author=author)
        serializer = CourseSerializer(courses, many=True)
        return Response(serializer.data)