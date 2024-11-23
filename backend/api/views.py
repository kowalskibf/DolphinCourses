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
            if "image" in request.data:
                image = request.data.get("image")
                if image and not isinstance(image, str):
                    course.image = image
            if language := request.data.get("language"):
                course.language = language
            if duration := request.data.get("duration"):
                course.duration = duration
            if is_public := request.data.get("is_public"):
                course.is_public = is_public == "true"
            if price_currency := request.data.get("price_currency"):
                course.price_currency = price_currency
            if price := request.data.get("price"):
                course.price = price
            if promo_price := request.data.get("promo_price"):
                course.promo_price = promo_price
            if promo_expires := request.data.get("promo_expires"):
                course.promo_expires = promo_expires
            course.last_updated = timezone.now()
            course.save()
            return Response({"message": "Course successfully created."}, status=status.HTTP_200_OK)
        except Exception as e:
            print(e)
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
        user = request.user
        account = Account.objects.get(user=user)
        try:
            try:
                course = Course.objects.get(id=id)
            except Course.DoesNotExist:
                return Response(status=status.HTTP_404_NOT_FOUND)
            if not course.is_public and not course.author == account:
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
    
class MyElementsView(APIView):
    def get(self, request):
        user = request.user
        account = Account.objects.get(user=user)
        elements = Element.objects.filter(author=account)
        #serializer = ElementSerializer(elements, many=True)
        serializer = DetailElementSerializer(elements, many=True)
        return Response(serializer.data)
    
class ElementView(APIView):
    def post(self, request):
        try:
            try:
                user = request.user
                account = Account.objects.get(user=user)
            except:
                return Response(status=status.HTTP_401_UNAUTHORIZED)
            if type_ := request.data.get("type"):
                if type_ == 'text':
                    textElement = TextElement(
                        name=request.data.get("name"),
                        author=account,
                        type="text",
                        content=request.data.get("content")
                    )
                    textElement.save()
                    return Response(status=status.HTTP_201_CREATED)
                elif type_ == 'image':
                    imageElement = ImageElement(
                        name=request.data.get("name"),
                        author=account,
                        type="image",
                        image=request.data.get("image"),
                        description=request.data.get("description")
                    )
                    imageElement.save()
                    return Response(status=status.HTTP_201_CREATED)
                elif type_ == 'video':
                    videoElement = VideoElement(
                        name=request.data.get("name"),
                        author=account,
                        type="video",
                        video=request.data.get("video"),
                        description=request.data.get("description")
                    )
                    videoElement.save()
                    return Response(status=status.HTTP_201_CREATED)
                elif type_ == 'example':
                    exampleElement = ExampleElement(
                        name=request.data.get("name"),
                        author=account,
                        type="example",
                        question=request.data.get("question"),
                        image=request.data.get("image"),
                        explanation=request.data.get("explanation"),
                        explanation_image=request.data.get("explanation_image")
                    )
                    exampleElement.save()
                    return Response(status=status.HTTP_201_CREATED)
                elif type_ == 'assignment':
                    assignmentElement = AssignmentElement(
                        name=request.data.get("name"),
                        author=account,
                        type="assignment",
                        question=request.data.get("question"),
                        image=request.data.get("image"),
                        answers=json.loads(request.data.get("answers")),
                        correct_answer_indices=json.loads(request.data.get("correct_answer_indices")),
                        is_multiple_choice=request.data.get("is_multiple_choice")=="true",
                        explanation=request.data.get("explanation"),
                        explanation_image=request.data.get("explanation_image")
                    )
                    assignmentElement.save()
                    return Response(status=status.HTTP_201_CREATED)
                elif type_ == 'exam':
                    examElement = ExamElement(
                        name=request.data.get("name"),
                        author=account,
                        type="exam",
                        description=request.data.get("description"),
                        duration=int(request.data.get("duration")),
                        total_marks=int(request.data.get("total_marks"))
                    )
                    examElement.save()
                    for assignment in json.loads(request.data.get("exam_assignments")):
                        try:
                            assignmentElement = AssignmentElement.objects.get(id=int(assignment["id"]))
                        except AssignmentElement.DoesNotExist:
                            return Response(status=status.HTTP_404_NOT_FOUND)
                        try:
                            assignmentElement = AssignmentElement.objects.get(id=int(assignment["id"]), author=account)
                        except AssignmentElement.DoesNotExist:
                            return Response(status=status.HTTP_401_UNAUTHORIZED)
                        examQuestion = ExamQuestion(
                            exam=examElement,
                            question=assignmentElement,
                            marks=assignment["marks"],
                            order=assignment["order"]
                        )
                        examQuestion.save()
                    return Response(status=status.HTTP_201_CREATED)
                elif type_ == 'module':
                    module_data = {
                        "name": request.data.get("name"),
                        "author": account,
                        "type": "module",
                        "title": request.data.get("title"),
                        "description": request.data.get("description"),
                    }
                    if request.data.get("image"):
                        module_data["image"] = request.data.get("image")
                    moduleElement = ModuleElement(**module_data)
                    moduleElement.save()
                    return Response(status=status.HTTP_201_CREATED)
        except:
            return Response(status=status.HTTP_400_BAD_REQUEST)

class CourseTopicView(APIView):
    def post(self, request, course_id):
        user = request.user
        body = json.loads(request.body)
        try:
            account = Account.objects.get(user=user)
        except Account.DoesNotExist:
            return Response(status=status.HTTP_401_UNAUTHORIZED)
        try:
            course = Course.objects.get(id=course_id)
        except Course.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)
        try:
            course = Course.objects.get(id=course_id, author=account)
        except:
            return Response(status=status.HTTP_401_UNAUTHORIZED)
        if not body["topic"]:
            return Response(status=status.HTTP_400_BAD_REQUEST)
        courseTopic = CourseTopic(
            course=course,
            topic=body["topic"]
        )
        courseTopic.save()
        return Response(status=status.HTTP_201_CREATED)

    def get(self, request, id):
        user = request.user
        try:
            account = Account.objects.get(user=user)
        except Account.DoesNotExist:
            return Response(status=status.HTTP_401_UNAUTHORIZED)
        try:
            courseTopic = CourseTopic.objects.get(id=id)
        except CourseTopic.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)
        if not courseTopic.course.author == account:
            return Response(status=status.HTTP_401_UNAUTHORIZED)
        serializer = CourseTopicSerializer(courseTopic)
        return Response(serializer.data)
    
    def put(self, request, id):
        user = request.user
        body = json.loads(request.body)
        try:
            account = Account.objects.get(user=user)
        except Account.DoesNotExist:
            return Response(status=status.HTTP_401_UNAUTHORIZED)
        try:
            courseTopic = CourseTopic.objects.get(id=id)
        except CourseTopic.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)
        if not courseTopic.course.author == account:
            return Response(status=status.HTTP_401_UNAUTHORIZED)
        if not body["topic"]:
            return Response(status=status.HTTP_400_BAD_REQUEST)
        courseTopic.topic = body["topic"]
        courseTopic.save()
        return Response(status=status.HTTP_200_OK)
    
    def delete(self, request, id):
        user = request.user
        try:
            account = Account.objects.get(user=user)
        except Account.DoesNotExist:
            return Response(status=status.HTTP_401_UNAUTHORIZED)
        try:
            courseTopic = CourseTopic.objects.get(id=id)
        except CourseTopic.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)
        if not courseTopic.course.author == account:
            return Response(status=status.HTTP_401_UNAUTHORIZED)
        courseTopic.delete()
        return Response(status=status.HTTP_200_OK)

class CourseTopicsView(APIView):
    def get(self, request, course_id):
        course = Course.objects.get(id=course_id)
        courseTopics = CourseTopic.objects.filter(course=course)
        serializer = CourseTopicSerializer(courseTopics, many=True)
        return Response(serializer.data)

class CourseStructureView(APIView):
    def get(self, request, id):
        user = request.user
        account = Account.objects.get(user=user)
        try:
            course = Course.objects.get(id=id)
        except Course.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)
        if course.author != account and not course.is_public:
            return Response(status=status.HTTP_401_UNAUTHORIZED)
        serializer = CourseStructureSerializer(course)
        return Response(serializer.data)