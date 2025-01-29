import os
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')

from django.test import TestCase
from rest_framework.test import APITestCase
from django.contrib.auth.models import User
from .models import *
from .views import *

from django.utils import timezone
from datetime import timedelta

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
        self.url = "/api/profile/me"

    def test_my_profile_success(self):
        """
        Test get user's profile successfully.
        """
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        serializer = AccountSerializer(self.account)
        self.assertEqual(response.data, serializer.data)

    def test_my_profile_unauthorized(self):
        """
        Test unauthorized profile get.
        """
        self.client.logout()
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

class ProfileViewTestCase(APITestCase):
    def setUp(self):
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
        self.url = "/api/profile/testuser"

    def test_profile_view_success(self):
        """
        Test successul get someone's profile.
        """
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        serializer = AccountWithCoursesSerializer(self.account)
        self.assertEqual(response.data, serializer.data)

    def test_profile_view_profile_not_found(self):
        """
        Test get not existing profile.
        """
        response = self.client.get("/api/profile/testuser2")
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

class CourseViewTestCase(APITestCase):
    def setUp(self):
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
        self.course = Course.objects.create(
            author=self.account,
            name="Course name",
            description="Course description",
            language="en",
            duration=5,
            is_public=True,
            price_currency="USD",
            price=4990,
        )
        self.client.force_authenticate(user=self.user)
        self.url = "/api/course"

    def test_course_create_success(self):
        """
        Test create course successfully.
        """
        data = {
            "name": "Course 2 name",
            "description": "Course 2 description",
            "language": "pl",
            "duration": 8,
            "is_public": "True",
            "price_currency": "PLN",
            "price": 1990
        }
        response = self.client.post(self.url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["newCourseId"], 2)
        self.assertEqual(Course.objects.all().count(), 2)
        self.assertEqual(Course.objects.get(id=2).name, "Course 2 name")

    def test_course_create_unauthorized(self):
        """
        Test create course unauthorized.
        """
        data = {
            "name": "Course 2 name",
            "description": "Course 2 description",
            "language": "pl",
            "duration": 8,
            "is_public": "True",
            "price_currency": "PLN",
            "price": 1990
        }
        self.client.logout()
        response = self.client.post(self.url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(Course.objects.all().count(), 1)

    def test_edit_course_success(self):
        """
        Test successfully edit course.
        """
        data = {
            "description": "New Course description"
        }
        response = self.client.put(f'{self.url}/{self.course.id}', data, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.course.refresh_from_db()
        self.assertEqual(self.course.description, "New Course description")
        self.assertEqual(self.course.name, "Course name")

    def test_edit_course_not_found(self):
        """
        Test edit not existing course.
        """
        data = {
            "description": "New Course description"
        }
        response = self.client.put(f'{self.url}/123', data, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.course.refresh_from_db()
        self.assertEqual(self.course.description, "Course description")
        self.assertEqual(self.course.name, "Course name")

    def test_edit_course_guest(self):
        """
        Test unauthorized edit course by someone else.
        """
        data = {
            "description": "New Course description"
        }
        guest_user = User.objects.create_user(
            username="testuser2",
            password="password123",
            first_name="Jane",
            last_name="Doe"
        )
        guest_socials = AccountSocials.objects.create(
            facebook="https://facebook.com/testuser2",
            instagram="https://instagram.com/testuser2",
            tiktok="https://tiktok.com/@testuser2",
            linkedin="https://linkedin.com/in/testuser2"
        )
        guest_account = Account.objects.create(
            user=guest_user,
            socials=guest_socials,
            bio="Nothing."
        )
        self.client.force_authenticate(guest_user)
        response = self.client.put(f'{self.url}/{self.course.id}', data, format="json")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.course.refresh_from_db()
        self.assertEqual(self.course.description, "Course description")
        self.assertEqual(self.course.name, "Course name")


    def test_edit_course_unauthorized(self):
        """
        Test edit course unauthorized.
        """
        data = {
            "description": "New Course description"
        }
        self.client.logout()
        response = self.client.put(f'{self.url}/{self.course.id}', data, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.course.refresh_from_db()
        self.assertEqual(self.course.description, "Course description")
        self.assertEqual(self.course.name, "Course name")

    def test_delete_course_success(self):
        """
        Test successfully delete course.
        """
        response = self.client.delete(f'{self.url}/{self.course.id}')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(Course.objects.all().count(), 0)

    def test_delete_course_not_found(self):
        """
        Test delete not existing course.
        """
        response = self.client.delete(f'{self.url}/123')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertEqual(Course.objects.all().count(), 1)


    def test_delete_course_unauthorized(self):
        """
        Test delete course unauthorized.
        """
        self.client.logout()
        response = self.client.delete(f'{self.url}/{self.course.id}')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(Course.objects.all().count(), 1)

    def test_get_course_success(self):
        """
        Test successful get course.
        """
        response = self.client.get(f'{self.url}/{self.course.id}')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        serializer = CourseSerializer(self.course)
        self.assertEqual(response.data, serializer.data)

    def test_get_course_not_found(self):
        """
        Test get not existing course.
        """
        response = self.client.get(f'{self.url}/123')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

class MyCoursesViewTest(APITestCase):
    def setUp(self):
        self.user1 = User.objects.create_user(
            username="testuser",
            password="password123",
            first_name="John",
            last_name="Doe"
        )
        self.socials1 = AccountSocials.objects.create(
            facebook="https://facebook.com/testuser",
            instagram="https://instagram.com/testuser",
            tiktok="https://tiktok.com/@testuser",
            linkedin="https://linkedin.com/in/testuser"
        )
        self.account1 = Account.objects.create(
            user=self.user1,
            socials=self.socials1,
            bio="I am a developer."
        )
        self.user2 = User.objects.create_user(
            username="testuser2",
            password="password123",
            first_name="Jane",
            last_name="Doe"
        )
        self.socials2 = AccountSocials.objects.create(
            facebook="https://facebook.com/testuser2",
            instagram="https://instagram.com/testuser2",
            tiktok="https://tiktok.com/@testuser2",
            linkedin="https://linkedin.com/in/testuser2"
        )
        self.account2 = Account.objects.create(
            user=self.user2,
            socials=self.socials2,
            bio="Nothing."
        )
        self.course1 = Course.objects.create(
            author=self.account1,
            name="Course name",
            description="Course description",
            language="en",
            duration=5,
            is_public=True,
            price_currency="USD",
            price=4990,
        )
        self.course2 = Course.objects.create(
            author=self.account1,
            name="Course 2 name",
            description="Course 2 description",
            language="pl",
            duration=3,
            is_public=True,
            price_currency="PLN",
            price=3990,
        )
        self.course3 = Course.objects.create(
            author=self.account2,
            name="Course 3 name",
            description="Course 3 description",
            language="en",
            duration=2,
            is_public=True,
            price_currency="USD",
            price=2990,
        )
        self.client.force_authenticate(user=self.user1)
        self.url = "/api/courses/my"

    def test_get_my_courses_success(self):
        """
        Test successful get authorized user's courses
        """
        response = self.client.get(self.url)
        courses = Course.objects.filter(author=self.account1)
        serializer = CourseSerializer(courses, many=True)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data, serializer.data)
        self.assertEqual(len(response.data), 2)

class MyElementsViewTest(APITestCase):
    def setUp(self):
        self.user1 = User.objects.create_user(
            username="testuser",
            password="password123",
            first_name="John",
            last_name="Doe"
        )
        self.socials1 = AccountSocials.objects.create(
            facebook="https://facebook.com/testuser",
            instagram="https://instagram.com/testuser",
            tiktok="https://tiktok.com/@testuser",
            linkedin="https://linkedin.com/in/testuser"
        )
        self.account1 = Account.objects.create(
            user=self.user1,
            socials=self.socials1,
            bio="I am a developer."
        )
        self.user2 = User.objects.create_user(
            username="testuser2",
            password="password123",
            first_name="Jane",
            last_name="Doe"
        )
        self.socials2 = AccountSocials.objects.create(
            facebook="https://facebook.com/testuser2",
            instagram="https://instagram.com/testuser2",
            tiktok="https://tiktok.com/@testuser2",
            linkedin="https://linkedin.com/in/testuser2"
        )
        self.account2 = Account.objects.create(
            user=self.user2,
            socials=self.socials2,
            bio="Nothing."
        )
        self.elem1 = TextElement.objects.create(
            name="text1",
            author=self.account1,
            type="text",
            content="Text 1 content"
        )
        self.elem2 = ExampleElement.objects.create(
            name="example2",
            author=self.account1,
            type="example",
            question="Some question 2",
            explanation="Some explanation 2"
        )
        self.elem3 = ImageElement.objects.create(
            name="image3",
            author=self.account2,
            type="image",
            description="Some description 3"
        )
        self.client.force_authenticate(user=self.user1)
        self.url = "/api/elements/my"

    def test_get_my_elements_success(self):
        """
        Test successfully get authorized user's elements.
        """
        response = self.client.get(self.url)
        elements = Element.objects.filter(author=self.account1)
        serializer = ElementWithUsesSerializer(elements, many=True)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data, serializer.data)
        self.assertEqual(len(response.data), 2)
    
class ElementViewTest(APITestCase):
    def setUp(self):
        self.user1 = User.objects.create_user(
            username="testuser",
            password="password123",
            first_name="John",
            last_name="Doe"
        )
        self.socials1 = AccountSocials.objects.create(
            facebook="https://facebook.com/testuser",
            instagram="https://instagram.com/testuser",
            tiktok="https://tiktok.com/@testuser",
            linkedin="https://linkedin.com/in/testuser"
        )
        self.account1 = Account.objects.create(
            user=self.user1,
            socials=self.socials1,
            bio="I am a developer."
        )
        self.user2 = User.objects.create_user(
            username="testuser2",
            password="password123",
            first_name="Jane",
            last_name="Doe"
        )
        self.socials2 = AccountSocials.objects.create(
            facebook="https://facebook.com/testuser2",
            instagram="https://instagram.com/testuser2",
            tiktok="https://tiktok.com/@testuser2",
            linkedin="https://linkedin.com/in/testuser2"
        )
        self.account2 = Account.objects.create(
            user=self.user2,
            socials=self.socials2,
            bio="Nothing."
        )
        self.elem1 = TextElement.objects.create(
            type="text",
            name="Text 1 name",
            author=self.account1,
            content="Text 1 content"
        )
        self.client.force_authenticate(self.user1)
    
    def test_post_element_text_success(self):
        """
        Test successfully create a text element.
        """
        url = "/api/element"
        data = {
            "type": "text",
            "name": "Text 2 name",
            "content": "Text 2 content"
        }
        response = self.client.post(url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(Element.objects.filter(name="Text 2 name").exists())
        text2 = TextElement.objects.get(name="Text 2 name")
        self.assertEqual(text2.content, "Text 2 content")

    def test_get_element_success(self):
        """
        Test successfully get specific element.
        """
        url = "/api/element/1"
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        element = Element.objects.get(id=1)
        serializer = DetailElementSerializer(element)
        self.assertEqual(response.data, serializer.data)

    def test_edit_element_success(self):
        """
        Test successfully edit specific element.
        """
        url = "/api/element/1"
        data = {
            "name": "New Text 1 name",
            "content": "New Text 1 content"
        }
        response = self.client.put(url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        element = TextElement.objects.get(id=1)
        self.assertEqual(element.content, "New Text 1 content")

    def test_delete_element_success(self):
        """
        Test successfully delete specific element.
        """
        url = "/api/element/1"
        self.assertEqual(TextElement.objects.all().count(), 1)
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(TextElement.objects.all().count(), 0)

class ElementCopyViewTest(APITestCase):
    def test_copy_text_element_success(self):
        """
        Test successfully copy specific text element.
        """
        user1 = User.objects.create_user(
            username="testuser",
            password="password123",
            first_name="John",
            last_name="Doe"
        )
        socials1 = AccountSocials.objects.create(
            facebook="https://facebook.com/testuser",
            instagram="https://instagram.com/testuser",
            tiktok="https://tiktok.com/@testuser",
            linkedin="https://linkedin.com/in/testuser"
        )
        account1 = Account.objects.create(
            user=user1,
            socials=socials1,
            bio="I am a developer."
        )
        self.client.force_authenticate(user1)
        elem = TextElement.objects.create(
            name="Text 1 name",
            type="text",
            author=account1,
            content="Text 1 content"
        )
        url = f"/api/element/{elem.id}/copy"
        response = self.client.post(url)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(TextElement.objects.all().count(), 2)
        self.assertEqual(TextElement.objects.get(id=2).name, "Text 1 name (copy)")
        self.assertEqual(TextElement.objects.get(id=2).content, "Text 1 content")

class CourseTopicViewTest(APITestCase):
    def setUp(self):
        self.user1 = User.objects.create_user(
            username="testuser",
            password="password123",
            first_name="John",
            last_name="Doe"
        )
        self.socials1 = AccountSocials.objects.create(
            facebook="https://facebook.com/testuser",
            instagram="https://instagram.com/testuser",
            tiktok="https://tiktok.com/@testuser",
            linkedin="https://linkedin.com/in/testuser"
        )
        self.account1 = Account.objects.create(
            user=self.user1,
            socials=self.socials1,
            bio="I am a developer."
        )
        self.course1 = Course.objects.create(
            author=self.account1,
            name="Course name",
            description="Course description",
            language="en",
            duration=5,
            is_public=True,
            price_currency="USD",
            price=4990,
        )
        self.topic1 = CourseTopic.objects.create(
            course=self.course1,
            topic="Topic 1 name"
        )
        self.client.force_authenticate(self.user1)

    def test_course_topic_post(self):
        """
        Test successfully create topic.
        """
        url = f'/api/course/{self.course1.id}/topic'
        data = {
            "topic": "Topic 2 name"
        }
        response = self.client.post(url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(CourseTopic.objects.all().count(), 2)
        topic2 = CourseTopic.objects.get(id=2)
        self.assertEqual(topic2.topic, "Topic 2 name")

    def test_course_topic_get(self):
        """
        Test successfully get topic.
        """
        url = f'/api/coursetopic/{self.topic1.id}'
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        serializer = CourseTopicSerializer(self.topic1)
        self.assertEqual(response.data, serializer.data)

    def test_course_topic_put(self):
        """
        Test successfully update topic.
        """
        url = f'/api/coursetopic/{self.topic1.id}'
        data = {
            "topic": "New Topic 1 name"
        }
        response = self.client.put(url, data, format="json")
        self.topic1.refresh_from_db()
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(self.topic1.topic, "New Topic 1 name")

    def test_course_topic_delete(self):
        """
        Test successfully delete topic.
        """
        url = f'/api/coursetopic/{self.topic1.id}'
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(CourseTopic.objects.all().count(), 0)

class CourseTopicsViewTest(APITestCase):
    def test_course_topic_get_all(self):
        """
        Test get all topics from a specific course.
        """
        self.user1 = User.objects.create_user(
            username="testuser",
            password="password123",
            first_name="John",
            last_name="Doe"
        )
        self.socials1 = AccountSocials.objects.create(
            facebook="https://facebook.com/testuser",
            instagram="https://instagram.com/testuser",
            tiktok="https://tiktok.com/@testuser",
            linkedin="https://linkedin.com/in/testuser"
        )
        self.account1 = Account.objects.create(
            user=self.user1,
            socials=self.socials1,
            bio="I am a developer."
        )
        self.course1 = Course.objects.create(
            author=self.account1,
            name="Course name",
            description="Course description",
            language="en",
            duration=5,
            is_public=True,
            price_currency="USD",
            price=4990,
        )
        self.topic1 = CourseTopic.objects.create(
            course=self.course1,
            topic="Topic 1 name"
        )
        self.topic2 = CourseTopic.objects.create(
            course=self.course1,
            topic="Topic 2 name"
        )
        self.course2 = Course.objects.create(
            author=self.account1,
            name="Course 2 name",
            description="Course 2 description",
            language="pl",
            duration=3,
            is_public=False,
            price_currency="PLN",
            price=1990,
        )
        self.topic3 = CourseTopic.objects.create(
            course=self.course2,
            topic="Topic 3 name"
        )
        url = f'/api/course/{self.course1.id}/topics'
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        topics = CourseTopic.objects.filter(course__id=self.course1.id)
        serializer = CourseTopicSerializer(topics, many=True)
        self.assertEqual(response.data, serializer.data)
        
class CourseStructureViewTest(APITestCase):
    def setUp(self):
        """
        Structure:

        course1
        -module1
        --module2
        ---exam1
        ----assignment1
        ----assignment2
        --module3
        ---exam2
        ----assignment3
        ---module4
        ----assignment1
        ----assignment4

        module5
        -module6
        -module7
        --module8
        """
        self.user1 = User.objects.create_user(
            username="testuser",
            password="password123",
            first_name="John",
            last_name="Doe"
        )
        self.socials1 = AccountSocials.objects.create(
            facebook="https://facebook.com/testuser",
            instagram="https://instagram.com/testuser",
            tiktok="https://tiktok.com/@testuser",
            linkedin="https://linkedin.com/in/testuser"
        )
        self.account1 = Account.objects.create(
            user=self.user1,
            socials=self.socials1,
            bio="I am a developer."
        )
        self.course1 = Course.objects.create(
            author=self.account1,
            name="Course name",
            description="Course description",
            language="en",
            duration=5,
            is_public=True,
            price_currency="USD",
            price=4990,
        )
        self.module1 = ModuleElement.objects.create(
            name="m1",
            author=self.account1,
            type="module",
            title="m1",
            description="m1"
        )
        self.module2 = ModuleElement.objects.create(
            name="m2",
            author=self.account1,
            type="module",
            title="m2",
            description="m2"
        )
        self.module3 = ModuleElement.objects.create(
            name="m3",
            author=self.account1,
            type="module",
            title="m3",
            description="m3"
        )
        self.module4 = ModuleElement.objects.create(
            name="m4",
            author=self.account1,
            type="module",
            title="m4",
            description="m4"
        )
        self.module5 = ModuleElement.objects.create(
            name="m5",
            author=self.account1,
            type="module",
            title="m5",
            description="m5"
        )
        self.module6 = ModuleElement.objects.create(
            name="m6",
            author=self.account1,
            type="module",
            title="m6",
            description="m6"
        )
        self.module7 = ModuleElement.objects.create(
            name="m7",
            author=self.account1,
            type="module",
            title="m7",
            description="m7"
        )
        self.module8 = ModuleElement.objects.create(
            name="m8",
            author=self.account1,
            type="module",
            title="m8",
            description="m8"
        )
        self.exam1 = ExamElement.objects.create(
            name="e1",
            author=self.account1,
            type="exam",
            description="e1",
            duration=1,
            total_marks=10
        )
        self.exam2 = ExamElement.objects.create(
            name="e2",
            author=self.account1,
            type="exam",
            description="e2",
            duration=2,
            total_marks=20
        )
        self.assignment1 = AssignmentElement.objects.create(
            name="a1",
            author=self.account1,
            type="assignment",
            question="a1",
            answers=["1", "2", "3"],
            correct_answer_indices=[1],
            hide_answers=False,
            is_multiple_choice=False,
            explanation="a1"
        )
        self.assignment2 = AssignmentElement.objects.create(
            name="a2",
            author=self.account1,
            type="assignment",
            question="a2",
            answers=["a", "b", "c"],
            correct_answer_indices=[0],
            hide_answers=True,
            is_multiple_choice=True,
            explanation="a2"
        )
        self.assignment3 = AssignmentElement.objects.create(
            name="a3",
            author=self.account1,
            type="assignment",
            question="a3",
            answers=["yes", "no"],
            correct_answer_indices=[0],
            hide_answers=False,
            is_multiple_choice=False,
            explanation="a3"
        )
        self.assignment4 = AssignmentElement.objects.create(
            name="a4",
            author=self.account1,
            type="assignment",
            question="a4",
            answers=["true", "false"],
            correct_answer_indices=[1],
            hide_answers=True,
            is_multiple_choice=True,
            explanation="a4"
        )
        self.mtc1 = ModuleToCourse.objects.create(
            course=self.course1,
            module=self.module1,
            order=1
        )
        self.etm1 = ElementToModule.objects.create(
            module=self.module1,
            element=self.module2,
            order=1
        )
        self.etm2 = ElementToModule.objects.create(
            module=self.module2,
            element=self.exam1,
            order=1
        )
        self.etm3 = ElementToModule.objects.create(
            module=self.module1,
            element=self.module3,
            order=2
        )
        self.etm4 = ElementToModule.objects.create(
            module=self.module3,
            element=self.exam2,
            order=1
        )
        self.etm5 = ElementToModule.objects.create(
            module=self.module3,
            element=self.module4,
            order=2
        )
        self.etm6 = ElementToModule.objects.create(
            module=self.module4,
            element=self.assignment1,
            order=1
        )
        self.etm7 = ElementToModule.objects.create(
            module=self.module4,
            element=self.assignment4,
            order=2
        )
        self.etm8 = ElementToModule.objects.create(
            module=self.module5,
            element=self.module6,
            order=1
        )
        self.etm9 = ElementToModule.objects.create(
            module=self.module5,
            element=self.module7,
            order=2
        )
        self.etm10 = ElementToModule.objects.create(
            module=self.module7,
            element=self.module8,
            order=1
        )
        self.eq1 = ExamQuestion.objects.create(
            exam=self.exam1,
            question=self.assignment1,
            marks=5,
            order=1
        )
        self.eq2 = ExamQuestion.objects.create(
            exam=self.exam1,
            question=self.assignment2,
            marks=5,
            order=2
        )
        self.eq3 = ExamQuestion.objects.create(
            exam=self.exam2,
            question=self.assignment3,
            marks=20,
            order=1
        )
        self.client.force_authenticate(self.user1)
        self.courseStructureView = CourseStructureView()

    def test_get_course_structure(self):
        """
        Test get whole course structure.
        """
        url = f"/api/course/{self.course1.id}/structure"
        response = self.client.get(url)
        serializer = CourseStructureSerializer(self.course1)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data, serializer.data)

    def test_function_get_all_assignments(self):
        result = self.courseStructureView.get_all_assignments(self.course1)
        self.assertEqual(sorted(list(result)), sorted([self.assignment1.id, self.assignment2.id, self.assignment3.id, self.assignment4.id]))

    def test_function_get_all_parent_modules(self):
        result = self.courseStructureView.get_all_parent_modules(self.module4)
        self.assertEqual(sorted(list(result)), sorted([self.module1.id, self.module3.id]))

    def test_function_get_all_children_modules(self):
        result = self.courseStructureView.get_all_children_modules(self.module1)
        self.assertEqual(sorted(list(result)), sorted([self.module2.id, self.module3.id, self.module4.id]))

    def test_function_attaching_would_cause_infinite_recursion_1(self):
        """
        Not a single descendant of the module-child (nor module-child itself) is any ancestor of the module-parent (nor module-parent itself).
        """
        result = self.courseStructureView.attaching_would_cause_infinite_recursion(self.module5, self.module3)
        self.assertFalse(result)

    def test_function_attaching_would_cause_infinite_recursion_2(self):
        """
        One of descendants of the module-child is one of ancestors of the module-parent.
        """
        result = self.courseStructureView.attaching_would_cause_infinite_recursion(self.module3, self.module1)
        self.assertTrue(result)

    def test_function_attaching_would_cause_infinite_recursion_3(self):
        """
        Module-child is a direct ancestor of the module-parent.
        """
        result = self.courseStructureView.attaching_would_cause_infinite_recursion(self.module7, self.module5)
        self.assertTrue(result)

    def test_function_attaching_would_cause_infinite_recursion_4(self):
        """
        Module-child is one of ancestors of the module-parent.
        """
        result = self.courseStructureView.attaching_would_cause_infinite_recursion(self.module8, self.module5)
        self.assertTrue(result)

    def test_function_attaching_would_cause_infinite_recursion_5(self):
        """
        One of the descendants of module-child is a direct ancestor of the module-parent.
        """
        result = self.courseStructureView.attaching_would_cause_infinite_recursion(self.module4, self.module1)
        self.assertTrue(result)

    def test_function_editing_would_cause_infinite_recursion_1(self):
        """
        Not a single descendant of any module-child (nor any module-child itself) is any ancestor of the module-parent (nor module-parent itself).
        """
        result = self.courseStructureView.editing_would_cause_infinite_recursion(self.module1.id, [self.module4.id, self.module5.id, self.module7.id])
        self.assertFalse(result)

    def test_function_editing_would_cause_infinite_recursion_2(self):
        """
        One of descendants of any module-child is one of ancestors of the module-parent.
        """
        result = self.courseStructureView.editing_would_cause_infinite_recursion(self.module8.id, [self.module5.id, self.module6.id])
        self.assertTrue(result)

class ModuleToCourseViewTest(APITestCase):
    def setUp(self):
        self.user1 = User.objects.create_user(
            username="testuser",
            password="password123",
            first_name="John",
            last_name="Doe"
        )
        self.socials1 = AccountSocials.objects.create(
            facebook="https://facebook.com/testuser",
            instagram="https://instagram.com/testuser",
            tiktok="https://tiktok.com/@testuser",
            linkedin="https://linkedin.com/in/testuser"
        )
        self.account1 = Account.objects.create(
            user=self.user1,
            socials=self.socials1,
            bio="I am a developer."
        )
        self.course1 = Course.objects.create(
            author=self.account1,
            name="Course name",
            description="Course description",
            language="en",
            duration=5,
            is_public=True,
            price_currency="USD",
            price=4990,
        )
        self.module1 = ModuleElement.objects.create(
            name="m1",
            author=self.account1,
            type="module",
            title="m1",
            description="m1"
        )
        self.module2 = ModuleElement.objects.create(
            name="m2",
            author=self.account1,
            type="module",
            title="m2",
            description="m2"
        )
        self.mtc1 = ModuleToCourse.objects.create(
            module=self.module1,
            course=self.course1,
            order=1
        )
        self.client.force_authenticate(self.user1)

    def test_module_to_course_post(self):
        """
        Test successfully attach module to course.
        """
        url = f'/api/course/{self.course1.id}/structure/{self.module2.id}'
        response = self.client.post(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(ModuleToCourse.objects.all().count(), 2)
        mtc2 = ModuleToCourse.objects.get(module=self.module2, course=self.course1)
        self.assertEqual(mtc2.order, 2)

    def test_module_to_course_put_move_up(self):
        """
        Test successfully move up a module in a course.
        """
        mtc2 = ModuleToCourse.objects.create(
            module=self.module2,
            course=self.course1,
            order=2
        )
        url = f'/api/course/{self.course1.id}/structure/{self.module2.id}'
        data = {
            "action": "up"
        }
        response = self.client.put(url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        mtc2.refresh_from_db()
        self.mtc1.refresh_from_db()
        self.assertEqual(mtc2.order, 1)
        self.assertEqual(self.mtc1.order, 2)

    def test_module_to_course_put_move_up_bad_request(self):
        """
        Test badly try to move up a module in a course.
        """
        mtc2 = ModuleToCourse.objects.create(
            module=self.module2,
            course=self.course1,
            order=2
        )
        url = f'/api/course/{self.course1.id}/structure/{self.module1.id}'
        data = {
            "action": "up"
        }
        response = self.client.put(url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        mtc2.refresh_from_db()
        self.mtc1.refresh_from_db()
        self.assertEqual(mtc2.order, 2)
        self.assertEqual(self.mtc1.order, 1)

    def test_module_to_course_delete(self):
        """
        Test successfully detach a module from a course.
        """
        url = f'/api/course/{self.course1.id}/structure/{self.module1.id}'
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(ModuleToCourse.objects.all().count(), 0)

    def test_module_to_course_delete_bad_request(self):
        """
        Test badly detach a module from a course.
        """
        url = f'/api/course/{self.course1.id}/structure/{self.module2.id}'
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(ModuleToCourse.objects.all().count(), 1)

class ElementToModuleViewTest(APITestCase):
    def setUp(self):
        self.user1 = User.objects.create_user(
            username="testuser",
            password="password123",
            first_name="John",
            last_name="Doe"
        )
        self.socials1 = AccountSocials.objects.create(
            facebook="https://facebook.com/testuser",
            instagram="https://instagram.com/testuser",
            tiktok="https://tiktok.com/@testuser",
            linkedin="https://linkedin.com/in/testuser"
        )
        self.account1 = Account.objects.create(
            user=self.user1,
            socials=self.socials1,
            bio="I am a developer."
        )
        self.text1 = TextElement.objects.create(
            name="t1",
            author=self.account1,
            type="text",
            content="t1"
        )
        self.text2 = TextElement.objects.create(
            name="t2",
            author=self.account1,
            type="text",
            content="t2"
        )
        self.module1 = ModuleElement.objects.create(
            name="m1",
            author=self.account1,
            type="module",
            title="m1",
            description="m1"
        )
        self.etm1 = ElementToModule.objects.create(
            element=self.text1,
            module=self.module1,
            order=1
        )
        self.client.force_authenticate(self.user1)

    def test_element_to_module_view_post(self):
        """
        Test successfully attach an element to a module.
        """
        url = f'/api/module/{self.module1.id}/structure/{self.text2.id}'
        response = self.client.post(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(ElementToModule.objects.all().count(), 2)
        etm2 = ElementToModule.objects.get(element=self.text2, module=self.module1)
        self.assertEqual(etm2.order, 2)
    
    def test_element_to_module_view_put_move_up(self):
        """
        Test successfully move up an element in a module.
        """
        etm2 = ElementToModule.objects.create(
            module=self.module1,
            element=self.text2,
            order=2
        )
        url = f'/api/module/{self.module1.id}/structure/{self.text2.id}'
        data = {
            "action": "up"
        }
        response = self.client.put(url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        etm2.refresh_from_db()
        self.etm1.refresh_from_db()
        self.assertEqual(etm2.order, 1)
        self.assertEqual(self.etm1.order, 2)


    def test_element_to_module_put_move_up_bad_request(self):
        """
        Test badly try to move up an element in a module.
        """
        etm2 = ElementToModule.objects.create(
            module=self.module1,
            element=self.text2,
            order=2
        )
        url = f'/api/module/{self.module1.id}/structure/{self.text1.id}'
        data = {
            "action": "up"
        }
        response = self.client.put(url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        etm2.refresh_from_db()
        self.etm1.refresh_from_db()
        self.assertEqual(etm2.order, 2)
        self.assertEqual(self.etm1.order, 1)

    def test_element_to_module_delete(self):
        """
        Test successfully detach an element from a module.
        """
        url = f'/api/module/{self.module1.id}/structure/{self.text1.id}'
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(ElementToModule.objects.all().count(), 0)

class AssignmentWeightsViewTest(APITestCase):
    def setUp(self):
        """
        Structure:

        course1
        -module1
        --module2
        ---exam1
        ----assignment1
        ----assignment2
        --module3
        ---exam2
        ----assignment3
        ---module4
        ----assignment1
        ----assignment4

        module5
        -module6
        -module7
        --module8
        """
        self.user1 = User.objects.create_user(
            username="testuser",
            password="password123",
            first_name="John",
            last_name="Doe"
        )
        self.socials1 = AccountSocials.objects.create(
            facebook="https://facebook.com/testuser",
            instagram="https://instagram.com/testuser",
            tiktok="https://tiktok.com/@testuser",
            linkedin="https://linkedin.com/in/testuser"
        )
        self.account1 = Account.objects.create(
            user=self.user1,
            socials=self.socials1,
            bio="I am a developer."
        )
        self.course1 = Course.objects.create(
            author=self.account1,
            name="Course name",
            description="Course description",
            language="en",
            duration=5,
            is_public=True,
            price_currency="USD",
            price=4990,
        )
        self.module1 = ModuleElement.objects.create(
            name="m1",
            author=self.account1,
            type="module",
            title="m1",
            description="m1"
        )
        self.module2 = ModuleElement.objects.create(
            name="m2",
            author=self.account1,
            type="module",
            title="m2",
            description="m2"
        )
        self.module3 = ModuleElement.objects.create(
            name="m3",
            author=self.account1,
            type="module",
            title="m3",
            description="m3"
        )
        self.module4 = ModuleElement.objects.create(
            name="m4",
            author=self.account1,
            type="module",
            title="m4",
            description="m4"
        )
        self.module5 = ModuleElement.objects.create(
            name="m5",
            author=self.account1,
            type="module",
            title="m5",
            description="m5"
        )
        self.module6 = ModuleElement.objects.create(
            name="m6",
            author=self.account1,
            type="module",
            title="m6",
            description="m6"
        )
        self.module7 = ModuleElement.objects.create(
            name="m7",
            author=self.account1,
            type="module",
            title="m7",
            description="m7"
        )
        self.module8 = ModuleElement.objects.create(
            name="m8",
            author=self.account1,
            type="module",
            title="m8",
            description="m8"
        )
        self.exam1 = ExamElement.objects.create(
            name="e1",
            author=self.account1,
            type="exam",
            description="e1",
            duration=1,
            total_marks=10
        )
        self.exam2 = ExamElement.objects.create(
            name="e2",
            author=self.account1,
            type="exam",
            description="e2",
            duration=2,
            total_marks=20
        )
        self.assignment1 = AssignmentElement.objects.create(
            name="a1",
            author=self.account1,
            type="assignment",
            question="a1",
            answers=["1", "2", "3"],
            correct_answer_indices=[1],
            hide_answers=False,
            is_multiple_choice=False,
            explanation="a1"
        )
        self.assignment2 = AssignmentElement.objects.create(
            name="a2",
            author=self.account1,
            type="assignment",
            question="a2",
            answers=["a", "b", "c"],
            correct_answer_indices=[0],
            hide_answers=True,
            is_multiple_choice=True,
            explanation="a2"
        )
        self.assignment3 = AssignmentElement.objects.create(
            name="a3",
            author=self.account1,
            type="assignment",
            question="a3",
            answers=["yes", "no"],
            correct_answer_indices=[0],
            hide_answers=False,
            is_multiple_choice=False,
            explanation="a3"
        )
        self.assignment4 = AssignmentElement.objects.create(
            name="a4",
            author=self.account1,
            type="assignment",
            question="a4",
            answers=["true", "false"],
            correct_answer_indices=[1],
            hide_answers=True,
            is_multiple_choice=True,
            explanation="a4"
        )
        self.mtc1 = ModuleToCourse.objects.create(
            course=self.course1,
            module=self.module1,
            order=1
        )
        self.etm1 = ElementToModule.objects.create(
            module=self.module1,
            element=self.module2,
            order=1
        )
        self.etm2 = ElementToModule.objects.create(
            module=self.module2,
            element=self.exam1,
            order=1
        )
        self.etm3 = ElementToModule.objects.create(
            module=self.module1,
            element=self.module3,
            order=2
        )
        self.etm4 = ElementToModule.objects.create(
            module=self.module3,
            element=self.exam2,
            order=1
        )
        self.etm5 = ElementToModule.objects.create(
            module=self.module3,
            element=self.module4,
            order=2
        )
        self.etm6 = ElementToModule.objects.create(
            module=self.module4,
            element=self.assignment1,
            order=1
        )
        self.etm7 = ElementToModule.objects.create(
            module=self.module4,
            element=self.assignment4,
            order=2
        )
        self.etm8 = ElementToModule.objects.create(
            module=self.module5,
            element=self.module6,
            order=1
        )
        self.etm9 = ElementToModule.objects.create(
            module=self.module5,
            element=self.module7,
            order=2
        )
        self.etm10 = ElementToModule.objects.create(
            module=self.module7,
            element=self.module8,
            order=1
        )
        self.eq1 = ExamQuestion.objects.create(
            exam=self.exam1,
            question=self.assignment1,
            marks=5,
            order=1
        )
        self.eq2 = ExamQuestion.objects.create(
            exam=self.exam1,
            question=self.assignment2,
            marks=5,
            order=2
        )
        self.eq3 = ExamQuestion.objects.create(
            exam=self.exam2,
            question=self.assignment3,
            marks=20,
            order=1
        )
        self.topic1 = CourseTopic.objects.create(
            course=self.course1,
            topic="Topic 1 name"
        )
        self.client.force_authenticate(self.user1)
        self.assignmentWeightsView = AssignmentWeightsView()

    def test_function_initialize_weights_for_assignment_1(self):
        assignment = AssignmentElement.objects.create(
            name="a",
            author=self.account1,
            type="assignment",
            question="a",
            answers=["true", "false"],
            correct_answer_indices=[1],
            hide_answers=True,
            is_multiple_choice=True,
            explanation="a"
        )
        etm = ElementToModule.objects.create(
            element=assignment,
            module=self.module1,
            order=3
        )
        self.assignmentWeightsView.initialize_weights_for_assignment(assignment, self.course1)
        self.assertTrue(AssignmentWeight.objects.filter(topic=self.topic1, assignment=assignment).exists())
        aw = AssignmentWeight.objects.get(topic=self.topic1, assignment=assignment)
        self.assertEqual(aw.weight, 0.0)

    
    def test_function_initialize_weights_for_assignment_2(self):
        assignment = AssignmentElement.objects.create(
            name="a",
            author=self.account1,
            type="assignment",
            question="a",
            answers=["true", "false"],
            correct_answer_indices=[1],
            hide_answers=True,
            is_multiple_choice=True,
            explanation="a"
        )
        etm = ElementToModule.objects.create(
            element=assignment,
            module=self.module1,
            order=3
        )
        aw = AssignmentWeight.objects.create(
            assignment=assignment,
            topic=self.topic1,
            weight=0.5
        )
        etm2 = ElementToModule.objects.create(
            element=assignment,
            module=self.module4,
            order=3
        )
        self.assignmentWeightsView.initialize_weights_for_assignment(assignment, self.course1)
        self.assertEqual(AssignmentWeight.objects.filter(topic=self.topic1, assignment=assignment).count(), 1)
        aw = AssignmentWeight.objects.get(topic=self.topic1, assignment=assignment)
        self.assertEqual(aw.weight, 0.5)

    def test_function_initialize_weights_for_assignment_3(self):
        self.assignmentWeightsView.initialize_weights_for_assignment(self.assignment2, self.course1)
        self.assertEqual(AssignmentWeight.objects.filter(topic=self.topic1, assignment=self.assignment2).count(), 1)
        aw = AssignmentWeight.objects.get(topic=self.topic1, assignment=self.assignment2)
        self.assertEqual(aw.weight, 0.0)

    def test_function_initialize_weights_for_assignment_4(self):
        eq = ExamQuestion.objects.create(
            exam=self.exam1,
            question=self.assignment3,
            marks=1,
            order=3
        )
        aw = AssignmentWeight.objects.create(
            assignment=self.assignment3,
            topic=self.topic1,
            weight=0.5
        )
        self.assignmentWeightsView.initialize_weights_for_assignment(self.assignment3, self.course1)
        self.assertEqual(AssignmentWeight.objects.filter(topic=self.topic1, assignment=self.assignment3).count(), 1)
        aw = AssignmentWeight.objects.get(topic=self.topic1, assignment=self.assignment3)
        self.assertEqual(aw.weight, 0.5)

    def test_function_initialize_weights_for_assignment_5(self):
        aw = AssignmentWeight.objects.create(
            assignment=self.assignment1,
            topic=self.topic1,
            weight=0.5
        )
        self.assignmentWeightsView.initialize_weights_for_assignment(self.assignment1, self.course1)
        self.assertEqual(AssignmentWeight.objects.filter(topic=self.topic1, assignment=self.assignment1).count(), 1)
        aw = AssignmentWeight.objects.get(topic=self.topic1, assignment=self.assignment1)
        self.assertEqual(aw.weight, 0.5)

    def test_function_initialize_weights_for_assignment_in_every_course(self):
        course2 = Course.objects.create(
            author=self.account1,
            name="Course 2 name",
            description="Course 2 description",
            language="pl",
            duration=3,
            is_public=True,
            price_currency="PLN",
            price=1990,
        )
        mtc = ModuleToCourse.objects.create(
            module=self.module2,
            course=course2,
            order=1
        )
        topic2 = CourseTopic.objects.create(
            course=course2,
            topic="Topic 2 name"
        )
        self.assertEqual(AssignmentWeight.objects.filter(topic=self.topic1, assignment=self.assignment1).count(), 0)
        self.assignmentWeightsView.initialize_weights_for_assignment_in_every_course(self.account1, self.assignment1.id)
        self.assertEqual(AssignmentWeight.objects.filter(assignment=self.assignment1).count(), 2)

    def test_function_initialize_weights_for_topic(self):
        topic2 = CourseTopic.objects.create(
            course=self.course1,
            topic="Topic 2 name"
        )
        self.assertEqual(AssignmentWeight.objects.filter(topic=topic2).count(), 0)
        self.assignmentWeightsView.initialize_weights_for_topic(topic2.id, self.course1)
        self.assertEqual(AssignmentWeight.objects.filter(topic=topic2).count(), 4)

    def test_function_remove_weights_for_assignment(self):
        self.assignmentWeightsView.initialize_weights_for_assignment(self.assignment1, self.course1)
        self.assertEqual(AssignmentWeight.objects.filter(topic=self.topic1).count(), 1)
        self.etm1.delete()
        self.etm3.delete()
        self.assignmentWeightsView.remove_weights_for_assignment(self.assignment1.id, self.course1.id)
        self.assertEqual(AssignmentWeight.objects.filter(topic=self.topic1).count(), 0)
    
    def test_function_remove_weights_for_assignment_in_every_course(self):
        course2 = Course.objects.create(
            author=self.account1,
            name="Course 2 name",
            description="Course 2 description",
            language="pl",
            duration=3,
            is_public=True,
            price_currency="PLN",
            price=1990,
        )
        mtc = ModuleToCourse.objects.create(
            module=self.module2,
            course=course2,
            order=1
        )
        topic2 = CourseTopic.objects.create(
            course=course2,
            topic="Topic 2 name"
        )
        self.assignmentWeightsView.initialize_weights_for_assignment_in_every_course(self.account1, self.assignment1.id)
        self.assertEqual(AssignmentWeight.objects.filter(assignment=self.assignment1).count(), 2)
        self.etm1.delete()
        self.etm3.delete()
        mtc.delete()
        self.assignmentWeightsView.remove_weights_for_assignment_in_every_course(self.account1, self.assignment1.id)
        self.assertEqual(AssignmentWeight.objects.filter(assignment=self.assignment1).count(), 0)

    def test_assignment_weights_view_post(self):
        assignment = AssignmentElement.objects.create(
            name="a",
            author=self.account1,
            type="assignment",
            question="a",
            answers=["true", "false"],
            correct_answer_indices=[1],
            hide_answers=True,
            is_multiple_choice=True,
            explanation="a"
        )
        etm = ElementToModule.objects.create(
            element=assignment,
            module=self.module1,
            order=3
        )
        url = f'/api/course/{self.course1.id}/assignment/{assignment.id}/weights'
        response = self.client.post(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(AssignmentWeight.objects.filter(assignment=assignment).count(), 1)

    def test_assignment_weights_view_put(self):
        self.assignmentWeightsView.initialize_weights_for_assignment(self.assignment1, self.course1)
        url = f'/api/course/{self.course1.id}/assignment/{self.assignment1.id}/weights'
        data = {
            "weights": [
                {
                    "topic": {
                        "id": self.topic1.id
                    },
                    "weight": 0.7
                }
            ]
        }
        response = self.client.put(url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(AssignmentWeight.objects.get(assignment=self.assignment1, topic=self.topic1).weight, 0.7)

class CourseAccessViewTest(APITestCase):
    def setUp(self):
        self.user1 = User.objects.create_user(
            username="testuser",
            password="password123",
            first_name="John",
            last_name="Doe"
        )
        self.socials1 = AccountSocials.objects.create(
            facebook="https://facebook.com/testuser",
            instagram="https://instagram.com/testuser",
            tiktok="https://tiktok.com/@testuser",
            linkedin="https://linkedin.com/in/testuser"
        )
        self.account1 = Account.objects.create(
            user=self.user1,
            socials=self.socials1,
            bio="I am a developer."
        )
        self.course1 = Course.objects.create(
            author=self.account1,
            name="Course name",
            description="Course description",
            language="en",
            duration=5,
            is_public=True,
            price_currency="USD",
            price=4990,
        )
        self.user2 = User.objects.create_user(
            username="testuser2",
            password="password123",
            first_name="Jane",
            last_name="Doe"
        )
        self.socials2 = AccountSocials.objects.create(
            facebook="https://facebook.com/testuser2",
            instagram="https://instagram.com/testuser2",
            tiktok="https://tiktok.com/@testuser2",
            linkedin="https://linkedin.com/in/testuser2"
        )
        self.account2 = Account.objects.create(
            user=self.user2,
            socials=self.socials2,
            bio="Nothing."
        )
        self.ca1 = CourseAccess.objects.create(
            account=self.account2,
            course=self.course1,
            expires=timezone.now() + timedelta(weeks=1),
            is_active=True,
            obtaining_type='bought'
        )
        self.client.force_authenticate(self.user2)

    def test_course_access_post(self):
        self.ca1.delete()
        url = f"/api/course/{self.course1.id}/access"
        expires_date = timezone.now() + timedelta(weeks=1)
        formatted_expires_date = expires_date.strftime("%Y-%m-%d %H:%M:%S")
        data = {
            "expires": formatted_expires_date
        }
        self.assertFalse(CourseAccess.objects.filter(account=self.account2, course=self.course1).exists())
        response = self.client.post(url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(CourseAccess.objects.filter(account=self.account2, course=self.course1).exists())

class CourseAccessesViewTest(APITestCase):
    def test_course_accesses_get(self):

        self.user1 = User.objects.create_user(
            username="testuser",
            password="password123",
            first_name="John",
            last_name="Doe"
        )
        self.socials1 = AccountSocials.objects.create(
            facebook="https://facebook.com/testuser",
            instagram="https://instagram.com/testuser",
            tiktok="https://tiktok.com/@testuser",
            linkedin="https://linkedin.com/in/testuser"
        )
        self.account1 = Account.objects.create(
            user=self.user1,
            socials=self.socials1,
            bio="I am a developer."
        )
        self.course1 = Course.objects.create(
            author=self.account1,
            name="Course name",
            description="Course description",
            language="en",
            duration=5,
            is_public=True,
            price_currency="USD",
            price=4990,
        )
        self.user2 = User.objects.create_user(
            username="testuser2",
            password="password123",
            first_name="Jane",
            last_name="Doe"
        )
        self.socials2 = AccountSocials.objects.create(
            facebook="https://facebook.com/testuser2",
            instagram="https://instagram.com/testuser2",
            tiktok="https://tiktok.com/@testuser2",
            linkedin="https://linkedin.com/in/testuser2"
        )
        self.account2 = Account.objects.create(
            user=self.user2,
            socials=self.socials2,
            bio="Nothing."
        )
        self.user3 = User.objects.create_user(
            username="testuser3",
            password="password123",
            first_name="xJane",
            last_name="Doe"
        )
        self.socials3 = AccountSocials.objects.create(
            facebook="https://facebook.com/testuser3",
            instagram="https://instagram.com/testuser3",
            tiktok="https://tiktok.com/@testuser3",
            linkedin="https://linkedin.com/in/testuser3"
        )
        self.account3 = Account.objects.create(
            user=self.user3,
            socials=self.socials3,
            bio="Nothing3."
        )
        self.ca1 = CourseAccess.objects.create(
            account=self.account2,
            course=self.course1,
            expires=timezone.now() + timedelta(weeks=1),
            is_active=True,
            obtaining_type='bought'
        )
        self.ca2 = CourseAccess.objects.create(
            account=self.account3,
            course=self.course1,
            expires=timezone.now() + timedelta(weeks=2),
            is_active=True,
            obtaining_type='gifted'
        )
        self.client.force_authenticate(self.user1)
        url = f'/api/course/{self.course1.id}/accesses'
        response = self.client.get(url)
        cas = CourseAccess.objects.filter(course=self.course1, is_active=True, obtaining_type='gifted', expires__gt=timezone.now())
        serializer = CourseAccessDetailSerializer(cas, many=True)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data, serializer.data)
        self.assertEqual(len(serializer.data), 1)

class CourseAccessgiftViewTest(APITestCase):
    def test_course_access_gift_post(self):


        self.user1 = User.objects.create_user(
            username="testuser",
            password="password123",
            first_name="John",
            last_name="Doe"
        )
        self.socials1 = AccountSocials.objects.create(
            facebook="https://facebook.com/testuser",
            instagram="https://instagram.com/testuser",
            tiktok="https://tiktok.com/@testuser",
            linkedin="https://linkedin.com/in/testuser"
        )
        self.account1 = Account.objects.create(
            user=self.user1,
            socials=self.socials1,
            bio="I am a developer."
        )
        self.course1 = Course.objects.create(
            author=self.account1,
            name="Course name",
            description="Course description",
            language="en",
            duration=5,
            is_public=True,
            price_currency="USD",
            price=4990,
        )
        self.user2 = User.objects.create_user(
            username="testuser2",
            password="password123",
            first_name="Jane",
            last_name="Doe"
        )
        self.socials2 = AccountSocials.objects.create(
            facebook="https://facebook.com/testuser2",
            instagram="https://instagram.com/testuser2",
            tiktok="https://tiktok.com/@testuser2",
            linkedin="https://linkedin.com/in/testuser2"
        )
        self.account2 = Account.objects.create(
            user=self.user2,
            socials=self.socials2,
            bio="Nothing."
        )
        self.client.force_authenticate(self.user1)
        expires_date = datetime.now() + timedelta(weeks=2)
        formatted_expires_date = expires_date.strftime("%Y-%m-%d %H:%M:%S")
        url = f'/api/course/{self.course1.id}/access/gift'
        data = {
            "username": "testuser2",
            "expires": formatted_expires_date
        }
        response = self.client.post(url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(CourseAccess.objects.filter(obtaining_type='gifted').count(), 1)

class MyCourseAccessesViewTest(APITestCase):
    def test_my_course_accesses_test(self):
        
        self.user1 = User.objects.create_user(
            username="testuser",
            password="password123",
            first_name="John",
            last_name="Doe"
        )
        self.socials1 = AccountSocials.objects.create(
            facebook="https://facebook.com/testuser",
            instagram="https://instagram.com/testuser",
            tiktok="https://tiktok.com/@testuser",
            linkedin="https://linkedin.com/in/testuser"
        )
        self.account1 = Account.objects.create(
            user=self.user1,
            socials=self.socials1,
            bio="I am a developer."
        )
        self.course1 = Course.objects.create(
            author=self.account1,
            name="Course name",
            description="Course description",
            language="en",
            duration=5,
            is_public=True,
            price_currency="USD",
            price=4990,
        )
        self.user2 = User.objects.create_user(
            username="testuser2",
            password="password123",
            first_name="Jane",
            last_name="Doe"
        )
        self.socials2 = AccountSocials.objects.create(
            facebook="https://facebook.com/testuser2",
            instagram="https://instagram.com/testuser2",
            tiktok="https://tiktok.com/@testuser2",
            linkedin="https://linkedin.com/in/testuser2"
        )
        self.account2 = Account.objects.create(
            user=self.user2,
            socials=self.socials2,
            bio="Nothing."
        )
        self.course2 = Course.objects.create(
            author=self.account2,
            name="Course 2 name",
            description="Course 2 description",
            language="pl",
            duration=3,
            is_public=True,
            price_currency="PLN",
            price=1990,
        )
        self.user3 = User.objects.create_user(
            username="testuser3",
            password="password123",
            first_name="xJane",
            last_name="Doe"
        )
        self.socials3 = AccountSocials.objects.create(
            facebook="https://facebook.com/testuser3",
            instagram="https://instagram.com/testuser3",
            tiktok="https://tiktok.com/@testuser3",
            linkedin="https://linkedin.com/in/testuser3"
        )
        self.account3 = Account.objects.create(
            user=self.user3,
            socials=self.socials3,
            bio="Nothing3."
        )
        self.course3 = Course.objects.create(
            author=self.account3,
            name="Course 3 name",
            description="Course 3 description",
            language="en",
            duration=33,
            is_public=True,
            price_currency="USD",
            price=19990,
        )
        self.ca1 = CourseAccess.objects.create(
            account=self.account1,
            course=self.course1,
            expires=timezone.now() + timedelta(weeks=1),
            is_active=True,
            obtaining_type='author'
        )
        self.ca2 = CourseAccess.objects.create(
            account=self.account1,
            course=self.course2,
            expires=timezone.now() + timedelta(weeks=2),
            is_active=True,
            obtaining_type='gifted'
        )
        self.ca3 = CourseAccess.objects.create(
            account=self.account1,
            course=self.course3,
            expires=timezone.now() + timedelta(weeks=2),
            is_active=True,
            obtaining_type='bought'
        )
        self.client.force_authenticate(self.user1)
        url = '/api/courseaccesses/my'
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)

class AccountTopicViewTest(APITestCase):
    def setUp(self):

        self.user1 = User.objects.create_user(
            username="testuser",
            password="password123",
            first_name="John",
            last_name="Doe"
        )
        self.socials1 = AccountSocials.objects.create(
            facebook="https://facebook.com/testuser",
            instagram="https://instagram.com/testuser",
            tiktok="https://tiktok.com/@testuser",
            linkedin="https://linkedin.com/in/testuser"
        )
        self.account1 = Account.objects.create(
            user=self.user1,
            socials=self.socials1,
            bio="I am a developer."
        )
        self.course1 = Course.objects.create(
            author=self.account1,
            name="Course name",
            description="Course description",
            language="en",
            duration=5,
            is_public=True,
            price_currency="USD",
            price=4990,
        )
        self.module = ModuleElement.objects.create(
            name="m1",
            type="module",
            author=self.account1,
            title="m1",
            description="m1"
        )
        self.assignment = AssignmentElement.objects.create(
            name="a",
            author=self.account1,
            type="assignment",
            question="a",
            answers=["true", "false"],
            correct_answer_indices=[1],
            hide_answers=True,
            is_multiple_choice=True,
            explanation="a"
        )
        self.mtc = ModuleToCourse.objects.create(
            module=self.module,
            course=self.course1,
            order=1
        )
        self.etm = ElementToModule.objects.create(
            element=self.assignment,
            module=self.module,
            order=1
        )
        self.topic = CourseTopic.objects.create(
            course=self.course1,
            topic="Topic 1 name"
        )
        self.aw = AssignmentWeight.objects.create(
            assignment=self.assignment,
            topic=self.topic,
            weight=0.5
        )
        self.at = AccountTopic.objects.create(
            account=self.account1,
            course_topic=self.topic,
            value=0.7
        )
        self.ca = CourseAccess.objects.create(
            account=self.account1,
            course=self.course1,
            expires=timezone.now() + timedelta(weeks=2),
            is_active=True,
            obtaining_type='author'
        )
        self.client.force_authenticate(self.user1)

    def test_account_topic_get(self):
        """
        Test get topics for a specific course.
        """
        url = f'/api/course/{self.course1.id}/accounttopics'
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        ats = AccountTopic.objects.filter(account=self.account1, course_topic__course=self.course1)
        serializer = AccountTopicSerializer(ats, many=True)
        self.assertEqual(response.data, serializer.data)
        self.assertEqual(len(response.data), 1)

    def test_account_topic_put_correct_answer(self):
        """
        Test give a right answer to the question.
        """
        url = f'/api/course/{self.course1.id}/accounttopics/assignment/{self.assignment.id}'
        data = {
            "selected_answer_indices": [1]
        }
        response = self.client.put(url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.at.refresh_from_db()
        self.assertAlmostEqual(self.at.value, 0.7075)

    def test_account_topic_put_wrong_answer(self):
        """
        Test give a wrong answer to the question.
        """
        url = f'/api/course/{self.course1.id}/accounttopics/assignment/{self.assignment.id}'
        data = {
            "selected_answer_indices": [0]
        }
        response = self.client.put(url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.at.refresh_from_db()
        self.assertAlmostEqual(self.at.value, 0.6825)
    
class ReviewViewTest(APITestCase):
    def setUp(self):

        self.user1 = User.objects.create_user(
            username="testuser",
            password="password123",
            first_name="John",
            last_name="Doe"
        )
        self.socials1 = AccountSocials.objects.create(
            facebook="https://facebook.com/testuser",
            instagram="https://instagram.com/testuser",
            tiktok="https://tiktok.com/@testuser",
            linkedin="https://linkedin.com/in/testuser"
        )
        self.account1 = Account.objects.create(
            user=self.user1,
            socials=self.socials1,
            bio="I am a developer."
        )
        self.course1 = Course.objects.create(
            author=self.account1,
            name="Course name",
            description="Course description",
            language="en",
            duration=5,
            is_public=True,
            price_currency="USD",
            price=4990,
        )
        self.user2 = User.objects.create_user(
            username="testuser2",
            password="password123",
            first_name="Jane",
            last_name="Doe"
        )
        self.socials2 = AccountSocials.objects.create(
            facebook="https://facebook.com/testuser2",
            instagram="https://instagram.com/testuser2",
            tiktok="https://tiktok.com/@testuser2",
            linkedin="https://linkedin.com/in/testuser2"
        )
        self.account2 = Account.objects.create(
            user=self.user2,
            socials=self.socials2,
            bio="Nothing."
        )
        self.ca = CourseAccess.objects.create(
            account=self.account2,
            course=self.course1,
            expires=timezone.now() + timedelta(weeks=2),
            is_active=True,
            obtaining_type='bought'
        )
        self.review = Review.objects.create(
            author=self.account2,
            course=self.course1,
            rating=4,
            comment="Review comment",
            date=timezone.now()
        )
        self.client.force_authenticate(self.user2)

    def test_review_post(self):
        """
        Test successfully review a post.
        """
        self.review.delete()
        self.assertEqual(Review.objects.all().count(), 0)
        url = f'/api/course/{self.course1.id}/review'
        data = {
            "rating": 3,
            "comment": "New comment"
        }
        response = self.client.post(url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Review.objects.all().count(), 1)
        rv = Review.objects.get(author=self.account2)
        self.assertEqual(rv.comment, "New comment")

    def test_review_post_conflict(self):
        """
        Test review post that is already reviewed.
        """
        self.assertEqual(Review.objects.all().count(), 1)
        url = f'/api/course/{self.course1.id}/review'
        data = {
            "rating": 3,
            "comment": "New comment"
        }
        response = self.client.post(url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_409_CONFLICT)
        self.assertEqual(Review.objects.all().count(), 1)
        rv = Review.objects.get(author=self.account2)
        self.assertEqual(rv.comment, "Review comment")

    def test_review_post_invalid_rating(self):
        """
        Test post review with invalid rating, greater than 5.
        """
        self.review.delete()
        self.assertEqual(Review.objects.all().count(), 0)
        url = f'/api/course/{self.course1.id}/review'
        data = {
            "rating": 6,
            "comment": "New comment"
        }
        response = self.client.post(url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(Review.objects.all().count(), 0)

    def test_review_get(self):
        """
        Test successfully get review.
        """
        url = f'/api/course/{self.course1.id}/review'
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        rv = Review.objects.get(author=self.account2, course=self.course1)
        serializer = ReviewSerializer(rv)
        self.assertEqual(response.data, serializer.data)

    def test_review_put(self):
        """
        Test successfully update review.
        """
        url = f'/api/course/{self.course1.id}/review'
        data = {
            "rating": 5,
            "comment": "New comment"
        }
        response = self.client.put(url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        rv = Review.objects.get(author=self.account2)
        self.assertEqual(rv.comment, "New comment")

    def test_review_put_invalid_rating(self):
        """
        Test edit review by passing invalid rating, greater than 5.
        """
        url = f'/api/course/{self.course1.id}/review'
        data = {
            "rating": 6,
            "comment": "New comment"
        }
        response = self.client.put(url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        rv = Review.objects.get(author=self.account2)
        self.assertEqual(rv.comment, "Review comment")

    def test_review_delete(self):
        """
        Test successfully delete review.
        """
        self.assertEqual(Review.objects.all().count(), 1)
        url = f'/api/course/{self.course1.id}/review'
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(Review.objects.all().count(), 0)

    def test_review_delete_not_found(self):
        """
        Test delete not existing review.
        """
        self.review.delete()
        self.assertEqual(Review.objects.all().count(), 0)
        url = f'/api/course/{self.course1.id}/review'
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

class ReviewsViewTest(APITestCase):
    def test_get_reviews(self):
        """
        Test get all reviews from the certain course.
        """
        self.user1 = User.objects.create_user(
            username="testuser",
            password="password123",
            first_name="John",
            last_name="Doe"
        )
        self.socials1 = AccountSocials.objects.create(
            facebook="https://facebook.com/testuser",
            instagram="https://instagram.com/testuser",
            tiktok="https://tiktok.com/@testuser",
            linkedin="https://linkedin.com/in/testuser"
        )
        self.account1 = Account.objects.create(
            user=self.user1,
            socials=self.socials1,
            bio="I am a developer."
        )
        self.course1 = Course.objects.create(
            author=self.account1,
            name="Course name",
            description="Course description",
            language="en",
            duration=5,
            is_public=True,
            price_currency="USD",
            price=4990,
        )
        self.user2 = User.objects.create_user(
            username="testuser2",
            password="password123",
            first_name="Jane",
            last_name="Doe"
        )
        self.socials2 = AccountSocials.objects.create(
            facebook="https://facebook.com/testuser2",
            instagram="https://instagram.com/testuser2",
            tiktok="https://tiktok.com/@testuser2",
            linkedin="https://linkedin.com/in/testuser2"
        )
        self.account2 = Account.objects.create(
            user=self.user2,
            socials=self.socials2,
            bio="Nothing."
        )
        self.user3 = User.objects.create_user(
            username="testuser3",
            password="password123",
            first_name="xJane",
            last_name="Doe"
        )
        self.socials3 = AccountSocials.objects.create(
            facebook="https://facebook.com/testuser3",
            instagram="https://instagram.com/testuser3",
            tiktok="https://tiktok.com/@testuser3",
            linkedin="https://linkedin.com/in/testuser3"
        )
        self.account3 = Account.objects.create(
            user=self.user3,
            socials=self.socials3,
            bio="Nothing3."
        )
        self.ca1 = CourseAccess.objects.create(
            account=self.account2,
            course=self.course1,
            expires=timezone.now() + timedelta(weeks=2),
            is_active=True,
            obtaining_type='bought'
        )
        self.ca2 = CourseAccess.objects.create(
            account=self.account3,
            course=self.course1,
            expires=timezone.now() + timedelta(weeks=2),
            is_active=True,
            obtaining_type='bought'
        )
        self.review1 = Review.objects.create(
            author=self.account2,
            course=self.course1,
            rating=4,
            comment="Review comment",
            date=timezone.now()
        )
        self.review2 = Review.objects.create(
            author=self.account3,
            course=self.course1,
            rating=3,
            comment="Review comment 2",
            date=timezone.now()
        )
        url = f'/api/course/{self.course1.id}/reviews'
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        rvs = Review.objects.filter(course=self.course1)
        serializer = ReviewSerializer(rvs, many=True)
        self.assertEqual(response.data, serializer.data)
        self.assertEqual(len(response.data), 2)

class CoursesExploreViewTest(APITestCase):
    def test_get_courses_explore(self):
        """
        Test get all public courses.
        """
        
        self.user1 = User.objects.create_user(
            username="testuser",
            password="password123",
            first_name="John",
            last_name="Doe"
        )
        self.socials1 = AccountSocials.objects.create(
            facebook="https://facebook.com/testuser",
            instagram="https://instagram.com/testuser",
            tiktok="https://tiktok.com/@testuser",
            linkedin="https://linkedin.com/in/testuser"
        )
        self.account1 = Account.objects.create(
            user=self.user1,
            socials=self.socials1,
            bio="I am a developer."
        )
        self.course1 = Course.objects.create(
            author=self.account1,
            name="Course name",
            description="Course description",
            language="en",
            duration=5,
            is_public=True,
            price_currency="USD",
            price=4990,
        )
        self.course2 = Course.objects.create(
            author=self.account1,
            name="Course 2 name",
            description="Course 2 description",
            language="pl",
            duration=3,
            is_public=False,
            price_currency="PLN",
            price=1990,
        )
        self.user2 = User.objects.create_user(
            username="testuser2",
            password="password123",
            first_name="Jane",
            last_name="Doe"
        )
        self.socials2 = AccountSocials.objects.create(
            facebook="https://facebook.com/testuser2",
            instagram="https://instagram.com/testuser2",
            tiktok="https://tiktok.com/@testuser2",
            linkedin="https://linkedin.com/in/testuser2"
        )
        self.account2 = Account.objects.create(
            user=self.user2,
            socials=self.socials2,
            bio="Nothing."
        )
        self.course3 = Course.objects.create(
            author=self.account2,
            name="Course 3 name",
            description="Course 3 description",
            language="en",
            duration=33,
            is_public=True,
            price_currency="USD",
            price=19990,
        )
        url = '/api/courses/all'
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        courses = Course.objects.filter(is_public=True)
        serializer = CourseWithReviewsSerializer(courses, many=True)
        self.assertEqual(response.data, serializer.data)
        self.assertEqual(len(response.data), 2)



