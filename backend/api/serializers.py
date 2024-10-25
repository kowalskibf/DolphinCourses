from rest_framework import serializers
from .models import *
from django.contrib.auth.models import User

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'first_name', 'last_name', 'date_joined')

class AccountSocialsSerializer(serializers.ModelSerializer):
    class Meta:
        model = AccountSocials
        fields = ('facebook', 'instagram', 'tiktok', 'linkedin')

class AccountSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    socials = AccountSocialsSerializer(read_only=True)

    class Meta:
        model = Account
        fields = ('id', 'user', 'avatar', 'is_admin', 'bio', 'socials', 'is_banned')

class CourseSerializer(serializers.ModelSerializer):
    author = AccountSerializer(read_only=True)

    class Meta:
        model = Course
        fields = ('id', 'author', 'name', 'description', 'image', 'language', 'duration', 'last_updated', 'is_public', 'price_currency', 'price', 'promo_price', 'promo_expires')

class ReviewSerializer(serializers.ModelSerializer):
    author = AccountSerializer(read_only=True)
    course = CourseSerializer(read_only=True)

    class Meta:
        model = Review
        fields = ('id', 'author', 'course', 'rating', 'comment', 'date')

class ElementSerializer(serializers.ModelSerializer):
    author = AccountSerializer(read_only=True)
    data = serializers.SerializerMethodField()

    class Meta:
        model = Element
        fields = ('id', 'name', 'author', 'type', 'data')

    def get_data(self, obj):
        if obj.type == 'text':
            return TextElementSerializer(obj.textelement).data
        elif obj.type == 'image':
            return ImageElementSerializer(obj.imageelement).data
        elif obj.type == 'video':
            return VideoElementSerializer(obj.videoelement).data
        elif obj.type == 'example':
            return ExampleElementSerializer(obj.exampleelement).data
        elif obj.type == 'assignment':
            return AssignmentElementSerializer(obj.assignmentelement).data
        elif obj.type == 'exam':
            return ExamElementSerializer(obj.examelement).data
        elif obj.type == 'module':
            return ModuleElementSerializer(obj.moduleelement).data
        return None


class ModuleElementSerializer(serializers.ModelSerializer):
    class Meta:
        model = ModuleElement
        fields = ('title', 'description', 'image')


class TextElementSerializer(serializers.ModelSerializer):
    class Meta:
        model = TextElement
        fields = ('content',)


class ImageElementSerializer(serializers.ModelSerializer):
    class Meta:
        model = ImageElement
        fields = ('image', 'description')


class VideoElementSerializer(serializers.ModelSerializer):
    class Meta:
        model = VideoElement
        fields = ('video', 'description')


class ExampleElementSerializer(serializers.ModelSerializer):
    class Meta:
        model = ExampleElement
        fields = ('question', 'explanation', 'image')


class AssignmentElementSerializer(serializers.ModelSerializer):
    class Meta:
        model = AssignmentElement
        fields = ('question', 'answers', 'correct_number_indices', 'is_multiple_choice', 'explanation', 'explanation_image')


class ExamElementSerializer(serializers.ModelSerializer):
    class Meta:
        model = ExamElement
        fields = ('description', 'duration', 'total_marks')


class ExamQuestionSerializer(serializers.ModelSerializer):
    exam = ExamElementSerializer(read_only=True)
    question = AssignmentElementSerializer(read_only=True)

    class Meta:
        model = ExamQuestion
        fields = ('id', 'exam', 'question', 'order')


class CourseModuleSerializer(serializers.ModelSerializer):
    course = CourseSerializer(read_only=True)
    module = ModuleElementSerializer(read_only=True)

    class Meta:
        model = CourseModule
        fields = ('id', 'course', 'module', 'order')


class ModuleToElementSerializer(serializers.ModelSerializer):
    module = ModuleElementSerializer(read_only=True)
    element = ElementSerializer(read_only=True)

    class Meta:
        model = ModuleToElement
        fields = ('id', 'module', 'element', 'order')


class CourseAccessSerializer(serializers.ModelSerializer):
    account = AccountSerializer(read_only=True)
    course = CourseSerializer(read_only=True)

    class Meta:
        model = CourseAccess
        fields = ('id', 'account', 'course', 'expires')


class CourseTopicSerializer(serializers.ModelSerializer):
    course = CourseSerializer(read_only=True)

    class Meta:
        model = CourseTopic
        fields = ('id', 'course', 'topic')


class AssignmentWeightSerializer(serializers.ModelSerializer):
    assignment = AssignmentElementSerializer(read_only=True)
    topic = CourseTopicSerializer(read_only=True)

    class Meta:
        model = AssignmentWeight
        fields = ('id', 'assignment', 'topic', 'weight')

class ModuleWeightSerializer(serializers.ModelSerializer):
    module = ModuleElementSerializer(read_only=True)
    topic = CourseTopicSerializer(read_only=True)

    class Meta:
        model = ModuleWeight
        fields = ('id', 'module', 'topic', 'weight')