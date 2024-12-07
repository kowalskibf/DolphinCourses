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
                    return Response(status=status.HTTP_201_CREATED)
            return Response(status=status.HTTP_400_BAD_REQUEST)
        except:
            return Response(status=status.HTTP_400_BAD_REQUEST)

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
            elementSerializer = ElementSerializer(newElement)
            return Response(elementSerializer.data, status=status.HTTP_201_CREATED)
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
        if course.author != account and not course.is_public:
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
        moduleToCourse.delete()
        return Response(status=status.HTTP_200_OK)

class ElementToModuleView(APIView):
    def post(self, request, course_id, module_id, element_id):
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
        try:
            course = Course.objects.get(id=course_id)
        except Course.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)
        if module.type != "module":
            return Response({"error": "Module is not of type 'module'"}, status=status.HTTP_400_BAD_REQUEST)
        if not module.author == account or not element.author == account:
            return Response(status=status.HTTP_401_UNAUTHORIZED)
        if ElementToModule.objects.filter(module=module, element=element).exists():
            return Response({"message": "Element is already added to this module"}, status=status.HTTP_400_BAD_REQUEST)
        if not body["copy"]:
            elementToModule = ElementToModule(
                module=module,
                element=element,
                course=course,
                order=ElementToModule.objects.filter(module=module).count() + 1
            )
            elementToModule.save()
        else:
            newElement = element
            newElement.pk = None
            newElement.name += ' (copy)'
            newElement.save()
            elementToModule = ElementToModule(
                module=module,
                element=newElement,
                course=course,
                order=ElementToModule.objects.filter(module=module).count() + 1
            )
            elementToModule.save()

        if element.type == "assignment":
            assignment = AssignmentElement.objects.get(id=element_id)
            assignmentWeightsView = AssignmentWeightsView()
            try:
                assignmentWeightsView.initialize_weights_for_assignment(assignment, course)
            except Exception as e:
                return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        elif element.type == "exam":
            assignmentWeightsView = AssignmentWeightsView()
            try:
                examQuestions = ExamQuestion.objects.filter(exam=element)
                for examQuestion in examQuestions:
                    assignmentWeightsView.initialize_weights_for_assignment(examQuestion.question, course)
            except Exception as e:
                return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        return Response(status=status.HTTP_200_OK)
    
    def put(self, request, course_id, module_id, element_id):
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
            topics = CourseTopic.objects.filter(course=course)
            for topic in topics:
                if not AssignmentWeight.objects.filter(assignment=assignment, topic=topic).exists():
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
            topic_id = pair["topic_id"]
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
            topic_id = pair["topic_id"]
            weight = pair["weight"]
            topic = CourseTopic.objects.get(id=topic_id)
            assignmentWeight = AssignmentWeight.objects.get(assignment=assignment, topic=topic)
            assignmentWeight.weight = weight
            assignmentWeight.save()
        return Response(status=status.HTTP_200_OK)
