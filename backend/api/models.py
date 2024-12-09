from django.db import models
from django.contrib.auth.models import User
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.utils import timezone

class AccountSocials(models.Model):
    facebook = models.CharField(max_length=255, default="")
    instagram = models.CharField(max_length=255, default="")
    tiktok = models.CharField(max_length=255, default="")
    linkedin = models.CharField(max_length=255, default="")

class Account(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='account')
    avatar = models.FileField(upload_to='avatars/', blank=True, null=True)
    is_admin = models.BooleanField(default=False)
    bio = models.CharField(max_length=255, default="")
    socials = models.OneToOneField(AccountSocials, on_delete=models.CASCADE)
    is_banned = models.BooleanField(default=False)

class Course(models.Model):
    author = models.ForeignKey(Account, on_delete=models.CASCADE, related_name='courses')
    name = models.CharField(max_length=255, default="Unnammed Course")
    description = models.CharField(max_length=4095, default="No description provided.")
    image = models.FileField(upload_to='courses_imgs/', blank=True, null=True)
    language = models.CharField(max_length=31, default="en")
    duration = models.IntegerField(default=0)
    last_updated = models.DateTimeField(default=timezone.now)
    is_public = models.BooleanField(default=False)
    price_currency = models.CharField(max_length=7, default="USD")
    price = models.IntegerField(default=0)
    promo_price = models.IntegerField(default=0)
    promo_expires = models.DateTimeField(default=timezone.now)

class Review(models.Model):
    author = models.ForeignKey(Account, on_delete=models.CASCADE, related_name='reviews')
    course = models.ForeignKey(Course, on_delete=models.CASCADE, default=None, related_name='reviews')
    rating = models.IntegerField(default=5)
    comment = models.CharField(max_length=1023, default="")
    date = models.DateTimeField(default=timezone.now)

class Element(models.Model):
    ELEMENT_TYPES = [
        ('text', 'Text'),
        ('image', 'Image'),
        ('video', 'Video'),
        ('example', 'Assignment'),
        ('assignment', 'Assignment'),
        ('exam', 'Exam'),
        ('module', 'Module')
    ]
    name = models.CharField(max_length=255)
    author = models.ForeignKey(Account, on_delete=models.CASCADE, related_name='elements')
    type = models.CharField(max_length=63, choices=ELEMENT_TYPES)
    
class ModuleElement(Element):
    title = models.CharField(max_length=255, default="")
    description = models.CharField(max_length=1023, default="")
    image = models.FileField(upload_to='elem_module/', blank=True, null=True)

class TextElement(Element):
    content = models.CharField(max_length=4095, default="")

class ImageElement(Element):
    image = models.FileField(upload_to='elem_img/', blank=True, null=True)
    description = models.CharField(max_length=1023, default="")

class VideoElement(Element):
    video = models.FileField(upload_to='elem_vid/', blank=True, null=True)
    description = models.CharField(max_length=1023, default="")

class ExampleElement(Element):
    question = models.CharField(max_length=1023, default="")
    image = models.FileField(upload_to='elem_example/', blank=True, null=True)
    explanation = models.CharField(max_length=4095, default="")
    explanation_image = models.FileField(upload_to="elem_example/", blank=True, null=True)

class AssignmentElement(Element):
    question = models.CharField(max_length=1023, default="")
    image = models.FileField(upload_to='elem_assignment/', blank=True, null=True)
    answers = models.JSONField()
    correct_answer_indices = models.JSONField()
    is_multiple_choice = models.BooleanField(default=False)
    hide_answers = models.BooleanField(default=False)
    explanation = models.CharField(max_length=4095, default="")
    explanation_image = models.FileField('elem_assignment/', blank=True, null=True)

class ExamElement(Element):
    description = models.CharField(max_length=1023, default="")
    duration = models.IntegerField(default=3600)
    total_marks = models.IntegerField(default=1)

class ExamQuestion(models.Model):
    exam = models.ForeignKey(ExamElement, on_delete=models.CASCADE, related_name='questions')
    question = models.ForeignKey(AssignmentElement, on_delete=models.CASCADE, related_name='exam_questions')
    marks = models.IntegerField(default=1)
    order = models.IntegerField(default=0)
    class Meta:
        ordering = ['order']

class ModuleToCourse(models.Model):
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='modules')
    module = models.ForeignKey(ModuleElement, on_delete=models.CASCADE, related_name='courses')
    order = models.IntegerField(default=0)
    class Meta:
        ordering = ['order']

class ElementToModule(models.Model):
    module = models.ForeignKey(ModuleElement, on_delete=models.CASCADE, related_name='elements')
    element = models.ForeignKey(Element, on_delete=models.CASCADE, related_name='modules')
    order = models.IntegerField(default=0)
    class Meta:
        ordering = ['order']

class CourseAccess(models.Model):
    account = models.ForeignKey(Account, on_delete=models.CASCADE, related_name='course_accesses')
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='course_accesses')
    expires = models.DateTimeField(default=timezone.now)

class CourseTopic(models.Model):
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='topics')
    topic = models.CharField(max_length=127, default="")

class AccountTopic(models.Model):
    account = models.ForeignKey(Account, on_delete=models.CASCADE, related_name='account_topics')
    course_topic = models.ForeignKey(CourseTopic, on_delete=models.CASCADE, related_name='account_topics')
    value = models.FloatField(default=0.5)

class AssignmentWeight(models.Model):
    assignment = models.ForeignKey(AssignmentElement, on_delete=models.CASCADE, related_name='assignment_weights')
    topic = models.ForeignKey(CourseTopic, on_delete=models.CASCADE, related_name='assignment_weights')
    weight = models.FloatField(default=0.0)