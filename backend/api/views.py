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
from datetime import datetime

class RegisterView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = [SessionAuthentication]
    def post(self, request):
        try:
            body = json.loads(request.body)
            username, email, password = body["username"], body["email"], body["password"]
        except (KeyError, json.JSONDecodeError):
            return Response({"error": "Invalid request body."}, status=status.HTTP_400_BAD_REQUEST)
        if not username:
            return Response({"error": "Username required."}, status=status.HTTP_400_BAD_REQUEST)
        if len(username) > 25:
            return Response({"error": "Username must be at most 25 characters long."}, status=status.HTTP_400_BAD_REQUEST)
        if not email:
            return Response({"error": "Email required."}, status=status.HTTP_400_BAD_REQUEST)
        if not password:
            return Response({"error": "Password required."}, status=status.HTTP_400_BAD_REQUEST)
        if User.objects.filter(username=username).exists():
            return Response({"error": "Username already taken."}, status=status.HTTP_409_CONFLICT)
        if User.objects.filter(email=email).exists():
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
            return Response(status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
            
class MyProfileView(APIView):
    def get(self, request):
        if not request.user:
            return Response(status=status.HTTP_401_UNAUTHORIZED)
        user = request.user
        if not Account.objects.filter(user=user).exists():
            return Response(status=status.HTTP_404_NOT_FOUND)
        account = Account.objects.get(user=user)
        serializer = AccountSerializer(account)
        return Response(serializer.data, status=status.HTTP_200_OK)

class ProfileView(APIView):
    def get(self, request, username):
        if not User.objects.filter(username=username).exists():
            return Response(status=status.HTTP_404_NOT_FOUND)
        user = User.objects.get(username=username)
        if not Account.objects.filter(user=user).exists():
            return Response(status=status.HTTP_404_NOT_FOUND)
        account = Account.objects.get(user=user)
        serializer = AccountWithCoursesSerializer(account)
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
            newCourseId = course.pk
            courseAccess = CourseAccess(
                account=author,
                course=course,
                expires=datetime.max,
                is_active=True,
                obtaining_type='author'
            )
            courseAccess.save()
            return Response({"newCourseId": newCourseId}, status=status.HTTP_201_CREATED)
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
        try:
            try:
                course = Course.objects.get(id=id)
            except Course.DoesNotExist:
                return Response(status=status.HTTP_404_NOT_FOUND)
            # hasAccess = CourseAccess.objects.filter(account=account, course=course, is_active=True, expires__gt=timezone.now()).exists()
            # if (not course.is_public or not hasAccess) and not course.author == account:
            #     return Response(status=status.HTTP_401_UNAUTHORIZED)
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
        serializer = ElementWithUsesSerializer(elements, many=True)
        #serializer = ElementSerializer(elements, many=True)
        #serializer = DetailElementSerializer(elements, many=True)
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
                    example_data = {
                        "name": request.data.get("name"),
                        "author": account,
                        "type": "example",
                        "question": request.data.get("question"),
                        "explanation": request.data.get("explanation")
                    }
                    if request.data.get("image"):
                        example_data["image"] = request.data.get("image")
                    if request.data.get("explanation_image"):
                        example_data["explanation_image"] = request.data.get("explanation_image")
                    exampleElement = ExampleElement(**example_data)
                    exampleElement.save()
                    return Response(status=status.HTTP_201_CREATED)
                elif type_ == 'assignment':
                    assignment_data = {
                        "name": request.data.get("name"),
                        "author": account,
                        "type": "assignment",
                        "question": request.data.get("question"),
                        "answers": json.loads(request.data.get("answers")),
                        "correct_answer_indices": json.loads(request.data.get("correct_answer_indices")),
                        "hide_answers": request.data.get("hide_answers")=="true",
                        "is_multiple_choice": request.data.get("is_multiple_choice")=="true",
                        "explanation": request.data.get("explanation")
                    }
                    if request.data.get("image"):
                        assignment_data["image"] = request.data.get("image")
                    if request.data.get("explanation_image"):
                        assignment_data["explanation_image"] = request.data.get("explanation_image")
                    assignmentElement = AssignmentElement(**assignment_data)
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
                    for rawElement in json.loads(request.data.get("module_elements")):
                        try:
                            for Type in (TextElement, ImageElement, VideoElement, ExampleElement, AssignmentElement, ExamElement, ModuleElement):
                                if Type.objects.filter(id=int(rawElement["id"])).exists():
                                    element = Type.objects.get(id=int(rawElement["id"]))
                                    break
                        except Element.DoesNotExist:
                            return Response(status=status.HTTP_404_NOT_FOUND)
                        if not element.author == account:
                            return Response(status=status.HTTP_401_UNAUTHORIZED)
                        elementToModule = ElementToModule(
                            element=element,
                            module=moduleElement,
                            order=int(rawElement["order"])
                        )
                        elementToModule.save()
                    return Response(status=status.HTTP_201_CREATED)
            return Response(status=status.HTTP_400_BAD_REQUEST)
        except:
            return Response(status=status.HTTP_400_BAD_REQUEST)
        
    def get(self, request, element_id):
        try:
            user = request.user
            account = Account.objects.get(user=user)
        except:
            return Response(status=status.HTTP_401_UNAUTHORIZED)
        if not Element.objects.filter(id=element_id).exists():
            return Response(status=status.HTTP_404_NOT_FOUND)
        if not Element.objects.filter(id=element_id, author=account).exists():
            return Response(status=status.HTTP_401_UNAUTHORIZED)
        element = Element.objects.get(id=element_id, author=account)
        serializer = DetailElementSerializer(element)
        return Response(serializer.data)

    def put(self, request, element_id):
        try:
            user = request.user
            account = Account.objects.get(user=user)
        except:
            return Response(status=status.HTTP_401_UNAUTHORIZED)
        try:
            element = Element.objects.get(id=element_id)
        except Element.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)
        for Type in (TextElement, ImageElement, VideoElement, ExampleElement, AssignmentElement, ExamElement, ModuleElement):
            if Type.objects.filter(id=element_id).exists():
                element = Type.objects.get(id=element_id)
                break
        if not element.author == account:
            return Response(status=status.HTTP_401_UNAUTHORIZED)
        try:
            element.name = request.data.get("name")
            if element.type == 'text':
                element.content = request.data.get("content")
            elif element.type == 'image':
                element.description = request.data.get("description")
                if request.data.get("image"):
                    element.image = request.data.get("image")
            elif element.type == 'video':
                element.description = request.data.get("description")
                if request.data.get("video"):
                    element.video = request.data.get("video")
            elif element.type == 'example':
                element.question = request.data.get("question")
                element.explanation = request.data.get("explanation")
                if request.data.get("image"):
                    element.image = request.data.get("image")
                if request.data.get("explanation_image"):
                    element.explanation_image = request.data.get("explanation_image")
            elif element.type == 'assignment':
                element.question = request.data.get("question")
                element.answers = json.loads(request.data.get("answers"))
                element.correct_answer_indices = json.loads(request.data.get("correct_answer_indices"))
                element.is_multiple_choice = request.data.get("is_multiple_choice") == "true"
                element.hide_answers = request.data.get("hide_answers") == "true"
                element.explanation = request.data.get("explanation")
                if request.data.get("image"):
                    element.image = request.data.get("image")
                if request.data.get("explanation_image"):
                    element.explanation_image = request.data.get("explanation_image")
            elif element.type == 'exam':
                element.description = request.data.get("description")
                element.duration = request.data.get("duration")
                element.total_marks = request.data.get("total_marks")
                for examQuestion in ExamQuestion.objects.filter(exam=element):
                    examQuestion.delete()
                for exam_question in json.loads(request.data.get("questions")):
                    try:
                        assignmentElement = AssignmentElement.objects.get(id=int(exam_question["question"]["id"]))
                    except AssignmentElement.DoesNotExist:
                        return Response(status=status.HTTP_404_NOT_FOUND)
                    try:
                        assignmentElement = AssignmentElement.objects.get(id=int(exam_question["question"]["id"]), author=account)
                    except AssignmentElement.DoesNotExist:
                        return Response(status=status.HTTP_401_UNAUTHORIZED)
                    examQuestion = ExamQuestion(
                        exam=element,
                        question=assignmentElement,
                        marks=exam_question["marks"],
                        order=exam_question["order"]
                    )
                    examQuestion.save()
                    assignmentWeightsView = AssignmentWeightsView()
                    assignmentWeightsView.initialize_weights_for_assignment_in_every_course(account, assignmentElement.id)
                    assignmentWeightsView.remove_weights_for_assignment_in_every_course(account, assignmentElement.id)
            elif element.type == 'module':
                courseStructureView = CourseStructureView()
                new_modules_ids = [int(elem["element"]["id"]) for elem in json.loads(request.data.get("elements"))]
                if courseStructureView.editing_would_cause_infinite_recursion(element, new_modules_ids):
                    return Response({"error": "This action would cause infinite recursion."}, status=status.HTTP_400_BAD_REQUEST)
                element.title = request.data.get("title")
                element.description = request.data.get("description")
                if request.data.get("image"):
                    element.image = request.data.get("image")
                assignmentWeightsView = AssignmentWeightsView()
                assignmentIds2D_before = []
                for course in Course.objects.filter(author=account):
                    assignmentIds2D_before.append(courseStructureView.get_all_assignments(course))
                for elementOfModule in ElementToModule.objects.filter(module=element):
                    elementOfModule.delete()
                for elementOfModule in json.loads(request.data.get("elements")):
                    try:
                        elem = Element.objects.get(id=int(elementOfModule["element"]["id"]))
                    except Element.DoesNotExist:
                        return Response(status=status.HTTP_404_NOT_FOUND)
                    try:
                        elem = Element.objects.get(id=int(elementOfModule["element"]["id"]), author=account)
                    except Element.DoesNotExist:
                        return Response(status=status.HTTP_401_UNAUTHORIZED)
                    elementToModule = ElementToModule(
                        module=element,
                        element=elem,
                        order=elementOfModule["order"]
                    )
                    elementToModule.save()
                assignmentIds2D_new = []
                for course in Course.objects.filter(author=account):
                    assignmentIds2D_new.append(courseStructureView.get_all_assignments(course))
                i = 0
                for course in Course.objects.filter(author=account):
                    for assignmentId in assignmentIds2D_before[i]:
                        assignmentWeightsView.remove_weights_for_assignment(assignmentId, course.id)
                    for assignmentId in assignmentIds2D_new[i]:
                        assignmentWeightsView.initialize_weights_for_assignment(AssignmentElement.objects.get(id=assignmentId), course)
                    i += 1
            element.save()
            return Response(status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        
    def delete(self, request, element_id):
        try:
            user = request.user
        except:
            return Response(status=status.HTTP_400_BAD_REQUEST)
        try:
            account = Account.objects.get(user=user)
        except Account.DoesNotExist:
            return Response(status=status.HTTP_401_UNAUTHORIZED)
        try:
            element = Element.objects.get(id=element_id)
        except Element.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)
        if not element.author == account:
            return Response(status=status.HTTP_401_UNAUTHORIZED)
        for Type in (TextElement, ImageElement, VideoElement, ExampleElement, AssignmentElement, ExamElement, ModuleElement):
            if Type.objects.filter(id=element_id).exists():
                element = Type.objects.get(id=element_id)
                break
        if ElementToModule.objects.filter(element=element).exists():
            return Response({"error": "Detach element from all modules to delete it."}, status=status.HTTP_400_BAD_REQUEST)
        if element.type == 'assignment':
            if ExamQuestion.objects.filter(question=element).exists():
                return Response({"error": "Detach assignment from all exams to delete it."}, status=status.HTTP_400_BAD_REQUEST)
        if element.type == 'module':
            if ModuleToCourse.objects.filter(module=element).exists():
                return Response({"error": "Detach module from all courses to delete it."}, status=status.HTTP_400_BAD_REQUEST)
        element.delete()
        return Response(status=status.HTTP_200_OK)

class ElementCopyView(APIView):
    def post(self, request, element_id):
        try:
            user = request.user
            account = Account.objects.get(user=user)
        except:
            return Response(status=status.HTTP_401_UNAUTHORIZED)
        try:
            try:
                element = Element.objects.get(id=element_id)
            except Element.DoesNotExist:
                return Response(status=status.HTTP_404_NOT_FOUND)
            if not element.author == account:
                return Response(status=status.HTTP_401_UNAUTHORIZED)
            for Type in (TextElement, ImageElement, VideoElement, ExampleElement, AssignmentElement, ExamElement, ModuleElement):
                if Type.objects.filter(id=element_id).exists():
                    element = Type.objects.get(id=element_id)
                    if Type in (ExamElement, ModuleElement):
                        return Response(status=status.HTTP_400_BAD_REQUEST)
                    break
            newElement = element
            newElement.pk = None
            newElement.id = None
            newElement.name += ' (copy)'
            newElement.save()
            return Response(status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

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
        try:
            assignmentWeightsView = AssignmentWeightsView()
            assignmentWeightsView.initialize_weights_for_topic(courseTopic.id, course)
        except Exception as e:
            print(str(e))
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
        hasAccess = CourseAccess.objects.filter(account=account, course=course, is_active=True, expires__gt=datetime.now()).exists()
        if (not course.is_public or not hasAccess) and not course.author == account:
            return Response(status=status.HTTP_401_UNAUTHORIZED)
        serializer = CourseStructureSerializer(course, context={'course_id': id})
        return Response(serializer.data)
    
    def get_course_structure(self, course_id):
        course = Course.objects.get(id=course_id)
        courseStructure = CourseStructureSerializer(course, context={'course_id': course.id}).data
        return courseStructure
    
    def get_all_assignments(self, course):

        def process_element(element):
            if element["element_data"]["type"] == "assignment":
                assignmentIds.append(element["element_data"]["id"])
            elif element["element_data"]["type"] == "exam":
                for question in element["element_data"]["data"]["questions"]:
                    assignmentIds.append(question["question"]["id"])
            elif element["element_data"]["type"] == "module":
                for sub_element in element["element_data"]["data"].get("elements", []):
                    process_element(sub_element)

        assignmentIds = []
        courseStructure = CourseStructureSerializer(course, context={'course_id': course.id}).data
        modulesToCourse = courseStructure["modules"]
        for moduleToCourse in modulesToCourse:
            for element in moduleToCourse["module"]["data"]["elements"]:
                process_element(element)

        return list(set(assignmentIds))
    
    def get_all_parent_modules(self, module):
        def process_parent(child):
            for elementToModule in ElementToModule.objects.filter(element=child):
                parent = elementToModule.module
                parentModulesIds.append(parent.id)
                process_parent(parent)
        parentModulesIds = []
        process_parent(module)
        return list(set(parentModulesIds))

    def get_all_children_modules(self, module):
        def process_child(parent):
            for elementToModule in ElementToModule.objects.filter(module=parent):
                child = elementToModule.element
                if child.type == "module":
                    childModulesIds.append(child.id)
                    process_child(child)
        childModulesIds = []
        process_child(module)
        return list(set(childModulesIds))

    def attaching_would_cause_infinite_recursion(self, parent_module, child_module):
        parent_modules = self.get_all_parent_modules(parent_module)
        children_modules = self.get_all_children_modules(child_module)
        if parent_module.id == child_module.id:
            return True
        if child_module.id in parent_modules:
            return True
        for child in children_modules:
            if child in parent_modules:
                return True
        return False
    
    def editing_would_cause_infinite_recursion(self, parent_module, new_modules_ids):
        parent_modules = self.get_all_parent_modules(parent_module)
        for new_module_id in new_modules_ids:
            if ModuleElement.objects.filter(id=new_module_id).exists():
                curr_module = ModuleElement.objects.get(id=new_module_id)
                if curr_module.id == parent_module.id:
                    return True
                if curr_module.id in parent_modules:
                    return True
                for curr_child_id in self.get_all_children_modules(curr_module):
                    curr_child = ModuleElement.objects.get(id=curr_child_id)
                    if curr_child.id == parent_module.id:
                        return True
                    if curr_child.id in parent_modules:
                        return True
        return False

class ModuleToCourseView(APIView):
    def post(self, request, course_id, module_id):
        user = request.user
        account = Account.objects.get(user=user)
        try:
            course = Course.objects.get(id=course_id)
        except Course.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)
        try:
            module = ModuleElement.objects.get(id=module_id)
        except ModuleElement.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)
        if module.type != "module":
            return Response({"error": "Element is not of type 'module'"}, status=status.HTTP_400_BAD_REQUEST)
        if not course.author == account or not module.author == account:
            return Response(status=status.HTTP_401_UNAUTHORIZED)
        if ModuleToCourse.objects.filter(course=course, module=module).exists():
            return Response({"message": "Module is already added to the course"}, status=status.HTTP_400_BAD_REQUEST)
        moduleToCourse = ModuleToCourse(
            course=course,
            module=module,
            order=ModuleToCourse.objects.filter(course=course).count() + 1
        )
        moduleToCourse.save()
        courseStructureView = CourseStructureView()
        assignmentWeightsView = AssignmentWeightsView()
        for assignmentId in courseStructureView.get_all_assignments(course):
            assignmentWeightsView.initialize_weights_for_assignment(AssignmentElement.objects.get(id=assignmentId), course)
        return Response(status=status.HTTP_200_OK)
    
    def put(self, request, course_id, module_id):
        user = request.user
        account = Account.objects.get(user=user)
        body = json.loads(request.body)
        try:
            course = Course.objects.get(id=course_id)
        except Course.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)
        try:
            module = ModuleElement.objects.get(id=module_id)
        except ModuleElement.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)
        if module.type != "module":
            return Response({"error": "Element is not of type 'module'"}, status=status.HTTP_400_BAD_REQUEST)
        if not course.author == account or not module.author == account:
            return Response(status=status.HTTP_401_UNAUTHORIZED)
        if not ModuleToCourse.objects.filter(course=course, module=module).exists():
            return Response({"message": "Module is not even added to the course"}, status=status.HTTP_400_BAD_REQUEST)
        moduleToCourse = ModuleToCourse.objects.get(course=course, module=module)
        if not body["action"] in ("up", "down"):
            return Response(status=status.HTTP_400_BAD_REQUEST)
        if body["action"] == "up":
            if moduleToCourse.order == 1:
                print(moduleToCourse.order)
                return Response(status=status.HTTP_400_BAD_REQUEST)
            prev = ModuleToCourse.objects.get(course=course, order=moduleToCourse.order-1)
            prev.order += 1
            prev.save()
            moduleToCourse.order -= 1
            moduleToCourse.save()
        elif body["action"] == "down":
            if moduleToCourse.order == ModuleToCourse.objects.filter(course=course).count():
                return Response(status=status.HTTP_400_BAD_REQUEST)
            next = ModuleToCourse.objects.get(course=course, order=moduleToCourse.order+1)
            next.order -= 1
            next.save()
            moduleToCourse.order += 1
            moduleToCourse.save()
        return Response(status=status.HTTP_200_OK)
    
    def delete(self, request, course_id, module_id):
        user = request.user
        account = Account.objects.get(user=user)
        try:
            course = Course.objects.get(id=course_id)
        except Course.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)
        try:
            module = ModuleElement.objects.get(id=module_id)
        except ModuleElement.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)
        if module.type != "module":
            return Response({"error": "Element is not of type 'module'"}, status=status.HTTP_400_BAD_REQUEST)
        if not course.author == account or not module.author == account:
            return Response(status=status.HTTP_401_UNAUTHORIZED)
        if not ModuleToCourse.objects.filter(course=course, module=module).exists():
            return Response({"message": "Module is not even added to the course"}, status=status.HTTP_400_BAD_REQUEST)
        moduleToCourse = ModuleToCourse.objects.get(course=course, module=module)
        for mtc in ModuleToCourse.objects.filter(course=course, order__gt=moduleToCourse.order):
            mtc.order -= 1
            mtc.save()
        courseStructureView = CourseStructureView()
        assignmentWeightsView = AssignmentWeightsView()
        assignmentIds = courseStructureView.get_all_assignments(course)
        moduleToCourse.delete()
        for assignmentId in assignmentIds:
            assignmentWeightsView.remove_weights_for_assignment(assignmentId, course_id)
        return Response(status=status.HTTP_200_OK)

class ElementToModuleView(APIView):
    def post(self, request, module_id, element_id):
        try:
            user = request.user
            account = Account.objects.get(user=user)
            try:
                body={}
            except Exception as e:
                return Response(status=status.HTTP_400_BAD_REQUEST)
            try:
                module = ModuleElement.objects.get(id=module_id)
            except ModuleElement.DoesNotExist:
                return Response(status=status.HTTP_404_NOT_FOUND)
            try:
                element = Element.objects.get(id=element_id)
            except Element.DoesNotExist:
                return Response(status=status.HTTP_404_NOT_FOUND)
            if module.type != "module":
                return Response({"error": "Module is not of type 'module'"}, status=status.HTTP_400_BAD_REQUEST)
            if not module.author == account or not element.author == account:
                return Response(status=status.HTTP_401_UNAUTHORIZED)
            if ElementToModule.objects.filter(module=module, element=element).exists():
                return Response({"message": "Element is already added to this module"}, status=status.HTTP_400_BAD_REQUEST)
            if element.type == "module":
                courseStructureView = CourseStructureView()
                if courseStructureView.attaching_would_cause_infinite_recursion(module, element):
                    return Response({"error": "This action would cause infinite recursion."}, status=status.HTTP_400_BAD_REQUEST)
            elementToModule = ElementToModule(
                module=module,
                element=element,
                order=ElementToModule.objects.filter(module=module).count() + 1
            )
            elementToModule.save()
            courseStructureView = CourseStructureView()
            assignmentWeightsView = AssignmentWeightsView()
            for course in Course.objects.filter(author=account):
                for assignmentId in courseStructureView.get_all_assignments(course):
                    assignmentWeightsView.initialize_weights_for_assignment(AssignmentElement.objects.get(id=assignmentId), course)
            return Response(status=status.HTTP_200_OK)
        except Exception as e:
            print(str(e))
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
    
    def put(self, request, module_id, element_id):
        user = request.user
        account = Account.objects.get(user=user)
        body = json.loads(request.body)
        try:
            module = ModuleElement.objects.get(id=module_id)
        except ModuleElement.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)
        try:
            element = Element.objects.get(id=element_id)
        except Element.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)
        if module.type != "module":
            return Response({"error": "Module is not of type 'module'"}, status=status.HTTP_400_BAD_REQUEST)
        if not module.author == account or not element.author == account:
            return Response(status=status.HTTP_401_UNAUTHORIZED)
        if not ElementToModule.objects.filter(module=module, element=element).exists():
            return Response({"message": "This element is not even assigned to this module"}, status=status.HTTP_400_BAD_REQUEST)
        elementToModule = ElementToModule.objects.get(module=module, element=element)
        if not body["action"] in ("up", "down"):
            return Response(status=status.HTTP_400_BAD_REQUEST)
        if body["action"] == "up":
            if elementToModule.order == 1:
                return Response(status=status.HTTP_400_BAD_REQUEST)
            prev = ElementToModule.objects.get(module=module, order=elementToModule.order-1)
            prev.order += 1
            prev.save()
            elementToModule.order -= 1
            elementToModule.save()
        elif body["action"] == "down":
            if elementToModule.order == ElementToModule.objects.filter(module=module).count():
                return Response(status=status.HTTP_400_BAD_REQUEST)
            next = ElementToModule.objects.get(module=module, order=elementToModule.order+1)
            next.order -= 1
            next.save()
            elementToModule.order += 1
            elementToModule.save()
        return Response(status=status.HTTP_200_OK)
    
    def delete(self, request, module_id, element_id):
        try:
            user = request.user
        except:
            return Response(status=status.HTTP_400_BAD_REQUEST)
        try:
            account = Account.objects.get(user=user)
        except Account.DoesNotExist:
            return Response(status=status.HTTP_401_UNAUTHORIZED)
        try:
            module = ModuleElement.objects.get(id=module_id)
        except ModuleElement.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)
        try:
            element = Element.objects.get(id=element_id)
        except Element.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)
        if not module.author == account or not element.author == account:
            return Response(status=status.HTTP_401_UNAUTHORIZED)
        try:
            elementToModule = ElementToModule.objects.get(module=module, element=element)
        except ElementToModule.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)
        for elementToModuleGT in ElementToModule.objects.filter(module=module, order__gt=elementToModule.order):
            elementToModuleGT.order -= 1
            elementToModuleGT.save()
        assignmentIds2D = []
        courseStructureView = CourseStructureView()
        assignmentWeightsView = AssignmentWeightsView()
        for course in Course.objects.filter(author=account):
            assignmentIds2D.append(courseStructureView.get_all_assignments(course))
        elementToModule.delete()
        i = 0
        for course in Course.objects.filter(author=account):
            for assignmentId in assignmentIds2D[i]:
                assignmentWeightsView.remove_weights_for_assignment(assignmentId, course.id)
            i += 1
        return Response(status=status.HTTP_200_OK)

class AssignmentWeightView(APIView):
    def post(self, request, assignment_id, topic_id):
        user = request.user
        try:
            account = Account.objects.get(user=user)
        except Account.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)
        body = json.loads(request.body)
        try:
            weight = body["weight"]
        except:
            return Response(status=status.HTTP_400_BAD_REQUEST)
        try:
            topic = CourseTopic.objects.get(id=topic_id)
        except CourseTopic.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)
        try:
            assignment = AssignmentElement.objects.get(id=assignment_id)
        except AssignmentElement.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)
        if not topic.course.author == account or not assignment.author == account:
            return Response(status=status.HTTP_401_UNAUTHORIZED)
        if AssignmentWeight.objects.get(assignment=assignment, topic=topic).exists():
            return Response(status=status.HTTP_409_CONFLICT)
        assignmentWeight = AssignmentWeight(
            assignment=assignment,
            topic=topic,
            weight=weight
        )
        assignmentWeight.save()
        return Response(status=status.HTTP_201_CREATED)
    
class AssignmentWeightsView(APIView):

    def initialize_weights_for_assignment(self, assignment, course):
        try:
            courseStructureView = CourseStructureView()
            topics = CourseTopic.objects.filter(course=course)
            for topic in topics:
                if not AssignmentWeight.objects.filter(assignment=assignment, topic=topic).exists() and assignment.id in courseStructureView.get_all_assignments(course):
                    try:
                        assignmentWeight = AssignmentWeight(
                        assignment=assignment,
                        topic=topic,
                        weight=0.0
                        )
                        assignmentWeight.save()
                    except Exception as e:
                        return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    def initialize_weights_for_assignment_in_every_course(self, author, assignment_id):
        try:
            courseStructureView = CourseStructureView()
            courses = Course.objects.filter(author=author)
            for course in courses:
                if assignment_id in courseStructureView.get_all_assignments(course):
                    assignment = AssignmentElement.objects.get(id=assignment_id)
                    self.initialize_weights_for_assignment(assignment, course)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    def initialize_weights_for_topic(self, topic_id, course):
        try:
            try:
                topic = CourseTopic.objects.get(id=topic_id)
            except CourseTopic.DoesNotExist:
                return Response(status=status.HTTP_404_NOT_FOUND)
            courseStructureView = CourseStructureView()
            for assignment_id in courseStructureView.get_all_assignments(course):
                try:
                    assignment = AssignmentElement.objects.get(id=assignment_id)
                except AssignmentElement.DoesNotExist:
                    return Response(status=status.HTTP_404_NOT_FOUND)
                if not AssignmentWeight.objects.filter(assignment=assignment, topic=topic).exists():
                    assignmentWeight = AssignmentWeight(
                        assignment=assignment,
                        topic=topic,
                        weight=0.0
                    )
                    assignmentWeight.save()
        except Exception as e:
            print(str(e))

    def remove_weights_for_assignment(self, assignment_id, course_id):
        try:
            try:
                assignment = AssignmentElement.objects.get(id=assignment_id)
            except AssignmentElement.DoesNotExist:
                return Response(status=status.HTTP_404_NOT_FOUND)
            try:
                course = Course.objects.get(id=course_id)
            except Course.DoesNotExist:
                return Response(status=status.HTTP_404_NOT_FOUND)
            topics = CourseTopic.objects.filter(course=course)
            courseStructureView = CourseStructureView()
            for topic in topics:
                if AssignmentWeight.objects.filter(assignment=assignment, topic=topic).exists() and assignment_id not in courseStructureView.get_all_assignments(course):
                    assignmentWeight = AssignmentWeight.objects.get(topic=topic, assignment=assignment)
                    assignmentWeight.delete()
            return True
        except Exception as e:
            return False

    def remove_weights_for_assignment_in_every_course(self, author, assignment_id):
        try:
            courseStructureView = CourseStructureView()
            courses = Course.objects.filter(author=author)
            for course in courses:
                if not self.remove_weights_for_assignment(assignment_id, course.id):
                    return False
            return True
        except Exception as e:
            return False
        
    def post(self, request, course_id, assignment_id): # dodanie zadania do kursu, zrobienie wag
        user = request.user
        try:
            account = Account.objects.get(user=user)
        except Account.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)
        try:
            assignment = AssignmentElement.objects.get(id=assignment_id)
        except AssignmentElement.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)
        try:
            course = Course.objects.get(id=course_id)
        except Course.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)
        if not assignment.author == account or not course.author == account:
            return Response(status=status.HTTP_401_UNAUTHORIZED)
        topics = CourseTopic.objects.filter(course=course)
        try:
            self.initialize_weights_for_assignment(assignment, course)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        return Response(status=status.HTTP_200_OK)
        
    def put(self, request, course_id, assignment_id):
        user = request.user
        try:
            account = Account.objects.get(user=user)
        except Account.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)
        try:
            course = Course.objects.get(id=course_id)
        except Course.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)
        if not course.author == account:
            return Response(status=status.HTTP_401_UNAUTHORIZED)
        body = json.loads(request.body)
        try:
            weights = body["weights"] # struktura [{topic_id, weight}, {topic_id, weight}, ...]
        except:
            return Response(status=status.HTTP_400_BAD_REQUEST)
        try:
            assignment = AssignmentElement.objects.get(id=assignment_id)
        except AssignmentElement.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)
        if not assignment.author == account:
            return Response(status=status.HTTP_401_UNAUTHORIZED)
        for pair in weights:
            topic_id = pair["topic"]["id"]
            weight = pair["weight"]
            try:
                topic = CourseTopic.objects.get(id=topic_id)
                if not topic.course.id == course_id:
                    return Response(status=status.HTTP_401_UNAUTHORIZED)
                if not topic.course.author == account:
                    return Response(status=status.HTTP_401_UNAUTHORIZED)
                if weight < 0.0 or weight > 1.0:
                    return Response(status=status.HTTP_400_BAD_REQUEST)
            except CourseTopic.DoesNotExist:
                return Response(status=status.HTTP_404_NOT_FOUND)
        for pair in weights:
            topic_id = pair["topic"]["id"]
            weight = pair["weight"]
            topic = CourseTopic.objects.get(id=topic_id)
            assignmentWeight = AssignmentWeight.objects.get(assignment=assignment, topic=topic)
            assignmentWeight.weight = weight
            assignmentWeight.save()
        return Response(status=status.HTTP_200_OK)
    
    def get(self, request, course_id, assignment_id):
        try:
            user = request.user
        except:
            return Response(status=status.HTTP_400_BAD_REQUEST)
        try:
            account = Account.objects.get(user=user)
        except Account.DoesNotExist:
            return Response(status=status.HTTP_401_UNAUTHORIZED)
        try:
            course = Course.objects.get(id=course_id)
        except Course.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)
        try:
            assignment = AssignmentElement.objects.get(id=assignment_id)
        except AssignmentElement.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)
        if not course.author == account or not assignment.author == account:
            return Response(status=status.HTTP_401_UNAUTHORIZED)
        serializer = AssignmentElementStructureSerializer(assignment, context={"course_id": course_id})
        return Response(serializer.data)

class CourseAccessView(APIView):
    def post(self, request, course_id):
        try:
            user = request.user
        except:
            return Response(status=status.HTTP_401_UNAUTHORIZED)
        try:
            account = Account.objects.get(user=user)
        except Account.DoesNotExist:
            return Response(status=status.HTTP_401_UNAUTHORIZED)
        try:
            course = Course.objects.get(id=course_id)
        except Course.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)
        try:
            body = json.loads(request.body)
        except:
            return Response(status=status.HTTP_400_BAD_REQUEST)
        if not body["expires"]:
            return Response(status=status.HTTP_400_BAD_REQUEST)
        if datetime.strptime(body["expires"], "%Y-%m-%d %H:%M:%S") < timezone.now():
            return Response({"error": "Access expiration date cannot be in the past."}, status=status.HTTP_400_BAD_REQUEST)
        if CourseAccess.objects.filter(account=account, course=course).exists():
            ca = CourseAccess.objects.get(account=account, course=course)
            ca.delete()
        # logika potencjalnej przyszłej płatności itp.
        courseAccess = CourseAccess(
            account=account,
            course=course,
            expires=body["expires"],
            is_active=True,
            obtaining_type='bought'
        )
        courseAccess.save()
        return Response(status=status.HTTP_201_CREATED)

    def put(self, request, course_access_id):
        try:
            user = request.user
        except:
            return Response(status=status.HTTP_401_UNAUTHORIZED)
        try:
            account = Account.objects.get(user=user)
        except Account.DoesNotExist:
            return Response(status=status.HTTP_401_UNAUTHORIZED)
        if not CourseAccess.objects.filter(id=course_access_id, obtaining_type='gifted').exists():
            return Response(status=status.HTTP_404_NOT_FOUND)
        try:
            courseAccess = CourseAccess.objects.get(id=course_access_id)
        except CourseAccess.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)
        if not courseAccess.course.author == account:
            return Response(status=status.HTTP_401_UNAUTHORIZED)
        try:
            body = json.loads(request.body)
        except:
            return Response(status=status.HTTP_400_BAD_REQUEST)
        if not body["expires"]:
            return Response(status=status.HTTP_400_BAD_REQUEST)
        courseAccess = CourseAccess.objects.get(id=course_access_id)
        courseAccess.expires = body["expires"]
        if datetime.strptime(body["expires"], "%Y-%m-%d %H:%M:%S") < timezone.now():
            courseAccess.is_active = False
        courseAccess.save()
        return Response(status=status.HTTP_200_OK)
    
    def delete(self, request, course_access_id):
        try:
            user = request.user
        except:
            return Response(status=status.HTTP_401_UNAUTHORIZED)
        try:
            account = Account.objects.get(user=user)
        except Account.DoesNotExist:
            return Response(status=status.HTTP_401_UNAUTHORIZED)
        if not CourseAccess.objects.filter(id=course_access_id, obtaining_type='gifted').exists():
            return Response(status=status.HTTP_404_NOT_FOUND)
        try:
            courseAccess = CourseAccess.objects.get(id=course_access_id)
        except CourseAccess.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)
        if not courseAccess.course.author == account:
            return Response(status=status.HTTP_401_UNAUTHORIZED)
        courseAccess = CourseAccess.objects.get(id=course_access_id)
        courseAccess.is_active = False
        courseAccess.save()
        return Response(status=status.HTTP_200_OK)

    def get(self, request, course_id):
        try:
            user = request.user
        except:
            return Response(status=status.HTTP_400_BAD_REQUEST)
        try:
            account = Account.objects.get(user=user)
        except Account.DoesNotExist:
            return Response(status=status.HTTP_401_UNAUTHORIZED)
        try:
            course = Course.objects.get(id=course_id)
        except Course.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)
        if CourseAccess.objects.filter(account=account, course=course, expires__lt=timezone.now()).exists():
            return Response(status=status.HTTP_410_GONE)
        hasAccess = CourseAccess.objects.filter(account=account, course=course, is_active=True, expires__gt=timezone.now()).exists()
        if (not hasAccess or not course.is_public) and not course.author == account:
            return Response(status=status.HTTP_401_UNAUTHORIZED)
        courseAccess = CourseAccess.objects.get(account=account, course=course, is_active=True, expires__gt=timezone.now())
        serializer = CourseAccessSerializer(courseAccess)
        return Response(serializer.data)
    
class CourseAccessesView(APIView):
    def get(self, request, course_id):
        try:
            user = request.user
        except:
            return Response(status=status.HTTP_401_UNAUTHORIZED)
        try:
            account = Account.objects.get(user=user)
        except Account.DoesNotExist:
            return Response(status=status.HTTP_401_UNAUTHORIZED)
        try:
            course = Course.objects.get(id=course_id)
        except Course.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)
        courseAccesses = CourseAccess.objects.filter(
            course=course,
            is_active=True,
            obtaining_type='gifted',
            expires__gt=datetime.now()
        )
        serializer = CourseAccessDetailSerializer(courseAccesses, many=True)
        return Response(serializer.data)
    
class CourseAccessGiftView(APIView):
    def post(self, request, course_id):
        try:
            user = request.user
        except:
            return Response(status=status.HTTP_401_UNAUTHORIZED)
        try:
            account = Account.objects.get(user=user)
        except Account.DoesNotExist:
            return Response(status=status.HTTP_401_UNAUTHORIZED)
        try:
            course = Course.objects.get(id=course_id)
        except Course.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)
        if not course.author == account:
            return Response(status=status.HTTP_401_UNAUTHORIZED)
        try:
            body = json.loads(request.body)
        except:
            return Response(status=status.HTTP_400_BAD_REQUEST)
        if not body["username"]:
            return Response(status=status.HTTP_400_BAD_REQUEST)
        if not body["expires"]:
            return Response(status=status.HTTP_400_BAD_REQUEST)
        if datetime.strptime(body["expires"], "%Y-%m-%d %H:%M:%S") < timezone.now():
            return Response(status=status.HTTP_400_BAD_REQUEST)
        try:
            invitedUser = User.objects.get(username=body["username"])
        except User.DoesNotExist:
            return Response({"error": "User does not exist."}, status=status.HTTP_404_NOT_FOUND)
        try:
            invitedAccount = Account.objects.get(user=invitedUser)
        except Account.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)
        if CourseAccess.objects.filter(account=invitedAccount, course=course).exists():
            if CourseAccess.objects.filter(account=invitedAccount, course=course, is_active=True, expires__gt=timezone.now()).exists():
                return Response(status=status.HTTP_409_CONFLICT)
            courseAccess = CourseAccess.objects.get(account=invitedAccount, course=course)
            courseAccess.delete()
        courseAccess = CourseAccess(
            account=invitedAccount,
            course=course,
            expires=body["expires"],
            is_active=True,
            obtaining_type='gifted'
        )
        courseAccess.save()
        return Response(status=status.HTTP_201_CREATED)
  
class MyCourseAccessesView(APIView):
    def get(self, request):
        try:
            user = request.user
        except:
            return Response(status=status.HTTP_401_UNAUTHORIZED)
        try:
            account = Account.objects.get(user=user)
        except Account.DoesNotExist:
            return Response(status=status.HTTP_401_UNAUTHORIZED)
        courseAccesses = CourseAccess.objects.filter(
            account=account,
            is_active=True,
            expires__gt=datetime.now()
        ).exclude(course__author=account)
        serializer = CourseAccessDetailSerializer(courseAccesses, many=True)
        return Response(serializer.data)

class AccountTopicView(APIView):
    def get(self, request, course_id):
        try:
            user = request.user
        except:
            return Response(status=status.HTTP_401_UNAUTHORIZED)
        try:
            account = Account.objects.get(user=user)
        except Account.DoesNotExist:
            return Response(status=status.HTTP_401_UNAUTHORIZED)
        try:
            course = Course.objects.get(id=course_id)
        except Course.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)
        accountTopics = AccountTopic.objects.filter(account=account, course_topic__course=course)
        serializer = AccountTopicSerializer(accountTopics, many=True)
        return Response(serializer.data)

    def put(self, request, course_id, assignment_id):
        LOWER_BOUND = 0.0
        UPPER_BOUND = 1.0
        K = 0.05
        try:
            user = request.user
        except:
            return Response(status=status.HTTP_401_UNAUTHORIZED)
        try:
            account = Account.objects.get(user=user)
        except Account.DoesNotExist:
            return Response(status=status.HTTP_401_UNAUTHORIZED)
        try:
            body = json.loads(request.body)
        except:
            return Response(status=status.HTTP_400_BAD_REQUEST)
        if not body["selected_answer_indices"]:
            return Response(status=status.HTTP_404_NOT_FOUND)
        try:
            course = Course.objects.get(id=course_id)
        except Course.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)
        if not CourseAccess.objects.filter(account=account, course=course, is_active=True, expires__gt=timezone.now()).exists():
            return Response(status=status.HTTP_401_UNAUTHORIZED)
        try:
            assignment = AssignmentElement.objects.get(id=assignment_id)
        except AssignmentElement.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)
        correct_answer_indices = sorted(assignment.correct_answer_indices)
        selected_answer_indices = sorted(body["selected_answer_indices"])
        R = correct_answer_indices == selected_answer_indices
        for courseTopic in CourseTopic.objects.filter(course=course):
            assignmentWeight = AssignmentWeight.objects.get(assignment=assignment, topic=courseTopic)
            w = assignmentWeight.weight
            accountTopic = AccountTopic.objects.get(account=account, course_topic=courseTopic)
            c = accountTopic.value
            if R:
                accountTopic.value += K * (UPPER_BOUND - c) * w
            else:
                accountTopic.value -= K * (c - LOWER_BOUND) * w
            accountTopic.save()
        return Response(status=status.HTTP_200_OK)
        
class ReviewView(APIView):
    def post(self, request, course_id):
        try:
            user = request.user
        except:
            return Response(status=status.HTTP_401_UNAUTHORIZED)
        try:
            account = Account.objects.get(user=user)
        except Account.DoesNotExist:
            return Response(status=status.HTTP_401_UNAUTHORIZED)
        try:
            course = Course.objects.get(id=course_id)
        except Course.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)
        try:
            body = json.loads(request.body)
        except:
            return Response(status=status.HTTP_400_BAD_REQUEST)
        if not CourseAccess.objects.filter(account=account, course=course).exists():
            return Response(status=status.HTTP_401_UNAUTHORIZED)
        if Review.objects.filter(author=account, course=course).exists():
            return Response({"error": "You already reviewed this course."}, status=status.HTTP_409_CONFLICT)
        if not body["rating"]:
            return Response(status=status.HTTP_400_BAD_REQUEST)
        if body["comment"]:
            comment = body["comment"]
        else:
            comment = ""
        if len(comment) > 1023:
            return Response({"error": "Comment too long."}, status=status.HTTP_400_BAD_REQUEST)
        try:
            rating = int(body["rating"])
        except:
            return Response(status=status.HTTP_400_BAD_REQUEST)
        if rating < 1 or rating > 5:
            return Response({"error": "Rating must be from 1 to 5."}, status=status.HTTP_400_BAD_REQUEST)
        review = Review(
            author=account,
            course=course,
            rating=rating,
            comment=comment,
            date=timezone.now()
        )
        review.save()
        return Response(status=status.HTTP_201_CREATED)
    
    def get(self, request, course_id):
        try:
            user = request.user
        except:
            return Response(status=status.HTTP_401_UNAUTHORIZED)
        try:
            account = Account.objects.get(user=user)
        except Account.DoesNotExist:
            return Response(status=status.HTTP_401_UNAUTHORIZED)
        try:
            course = Course.objects.get(id=course_id)
        except Course.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)
        if not CourseAccess.objects.filter(account=account, course=course).exists():
            return Response(status=status.HTTP_401_UNAUTHORIZED)
        if not Review.objects.filter(author=account, course=course).exists():
            return Response({"message": "You have not reviewed this course."}, status=status.HTTP_404_NOT_FOUND)
        review = Review.objects.get(author=account, course=course)
        serializer = ReviewSerializer(review)
        return Response(serializer.data)

    def put(self, request, course_id):
        try:
            user = request.user
        except:
            return Response(status=status.HTTP_401_UNAUTHORIZED)
        try:
            account = Account.objects.get(user=user)
        except Account.DoesNotExist:
            return Response(status=status.HTTP_401_UNAUTHORIZED)
        try:
            course = Course.objects.get(id=course_id)
        except Course.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)
        try:
            body = json.loads(request.body)
        except:
            return Response(status=status.HTTP_400_BAD_REQUEST)
        if not CourseAccess.objects.filter(account=account, course=course).exists():
            return Response(status=status.HTTP_401_UNAUTHORIZED)
        if not Review.objects.filter(author=account, course=course).exists():
            return Response({"message": "You have not reviewed this course."}, status=status.HTTP_404_NOT_FOUND)
        if not body["rating"]:
            return Response(status=status.HTTP_400_BAD_REQUEST)
        if body["comment"]:
            comment = body["comment"]
        else:
            comment = ""
        if len(comment) > 1023:
            return Response({"error": "Comment too long."}, status=status.HTTP_400_BAD_REQUEST)
        try:
            rating = int(body["rating"])
        except:
            return Response(status=status.HTTP_400_BAD_REQUEST)
        if rating < 1 or rating > 5:
            return Response({"error": "Rating must be from 1 to 5."}, status=status.HTTP_400_BAD_REQUEST)
        review = Review.objects.get(author=account, course=course)
        review.comment = comment
        review.rating = rating
        review.date = timezone.now()
        review.save()
        return Response(status=status.HTTP_200_OK)
    
    def delete(self, request, course_id):
        try:
            user = request.user
        except:
            return Response(status=status.HTTP_401_UNAUTHORIZED)
        try:
            account = Account.objects.get(user=user)
        except Account.DoesNotExist:
            return Response(status=status.HTTP_401_UNAUTHORIZED)
        try:
            course = Course.objects.get(id=course_id)
        except Course.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)
        if not CourseAccess.objects.filter(account=account, course=course).exists():
            return Response(status=status.HTTP_401_UNAUTHORIZED)
        if not Review.objects.filter(author=account, course=course).exists():
            return Response({"message": "You have not reviewed this course."}, status=status.HTTP_404_NOT_FOUND)
        review = Review.objects.get(author=account, course=course)
        review.delete()
        return Response(status=status.HTTP_200_OK)
    
class ReviewsView(APIView):
    def get(self, request, course_id):
        try:
            course = Course.objects.get(id=course_id)
        except Course.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)
        reviews = Review.objects.filter(course=course)
        serializer = ReviewSerializer(reviews, many=True)
        return Response(serializer.data)

class CoursesExploreView(APIView):
    permission_classes = [AllowAny]
    def get(self, request):
        courses = Course.objects.filter(is_public=True)
        serializer = CourseWithReviewsSerializer(courses, many=True)
        return Response(serializer.data)