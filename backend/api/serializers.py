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
    user = serializers.SerializerMethodField()
    socials = serializers.SerializerMethodField()
    class Meta:
        model = Account
        fields = ('id', 'user', 'avatar', 'is_admin', 'bio', 'socials', 'is_banned')
    def get_user(self, obj):
        return UserSerializer(obj.user).data
    def get_socials(self, obj):
        return AccountSocialsSerializer(obj.socials).data
    
class CourseSerializer(serializers.ModelSerializer):
    author = serializers.SerializerMethodField()
    class Meta:
        model = Course
        fields = ('id', 'author', 'name', 'description', 'image', 'language', 'duration', 'last_updated', 'is_public', 'price_currency', 'price', 'promo_price', 'promo_expires')
    def get_author(self, obj):
        return AccountSerializer(obj.author).data
    
class ReviewSerializer(serializers.ModelSerializer):
    author = serializers.SerializerMethodField()
    course = serializers.SerializerMethodField()
    class Meta:
        model = Review
        fields = ('id', 'author', 'course', 'rating', 'comment', 'date')
    def get_author(self, obj):
        return AccountSerializer(obj.author).data
    def get_course(self, obj):
        return CourseSerializer(obj.course).data
    
class ElementSerializer(serializers.ModelSerializer):
    author = serializers.SerializerMethodField()
    class Meta:
        model = Element
        fields = ('id', 'name', 'author', 'type')
    def get_author(self, obj):
        return AccountSerializer(obj.author).data
    def to_representation(self, instance):
        if instance.type == 'text':
            return TextElementSerializer(instance).data
        elif instance.type == 'image':
            return ImageElementSerializer(instance).data
        elif instance.type == 'video':
            return VideoElementSerializer(instance).data
        elif instance.type == 'example':
            return ExampleElementSerializer(instance).data
        elif instance.type == 'assignment':
            return AssignmentElementSerializer(instance).data
        elif instance.type == 'exam':
            return ExamElementSerializer(instance).data
        elif instance.type == 'module':
            return ModuleElementSerializer(instance).data
        else:
            return super().to_representation(instance)
    
class ModuleElementSerializer(ElementSerializer):
    class Meta(ElementSerializer.Meta):
        model = ModuleElement
        fields = ElementSerializer.Meta.fields + ('title', 'description', 'image')

class TextElementSerializer(ElementSerializer):
    class Meta(ElementSerializer.Meta):
        model = TextElement
        fields = ElementSerializer.Meta.fields + ('content',)

class ImageElementSerializer(ElementSerializer):
    class Meta(ElementSerializer.Meta):
        model = ImageElement
        fields = ElementSerializer.Meta.fields + ('image', 'description')

class VideoElementSerializer(ElementSerializer):
    class Meta(ElementSerializer.Meta):
        model = VideoElement
        fields = ElementSerializer.Meta.fields + ('video', 'description')

class ExampleElementSerializer(ElementSerializer):
    class Meta(ElementSerializer.Meta):
        model = ExampleElement
        fields = ElementSerializer.Meta.fields + ('question', 'image', 'explanation')

class AssignmentElementSerializer(ElementSerializer):
    class Meta(ElementSerializer.Meta):
        model = AssignmentElement
        fields = ElementSerializer.Meta.fields + ('question', 'image', 'answers', 'correct_answer_indices', 'is_multiple_choice', 'explanation')
    
class ExamElementSerializer(ElementSerializer):
    class Meta(ElementSerializer.Meta):
        model = ExamElement
        fields = ElementSerializer.Meta.fields + ('description', 'duration', 'total_marks')

class ExamQuestionSerializer(serializers.ModelSerializer):
    exam = serializers.SerializerMethodField()
    question = serializers.SerializerMethodField()
    class Meta:
        model = ExamQuestion
        fields = ('id', 'exam', 'question', 'order')
    def get_exam(self, obj):
        return ExamElementSerializer(obj.exam).data
    def get_question(self, obj):
        return AssignmentElementSerializer(obj.question).data
    
class CourseModuleSerializer(serializers.ModelSerializer):
    course = serializers.SerializerMethodField()
    module = serializers.SerializerMethodField()
    class Meta:
        model = CourseModule
        fields = ('id', 'course', 'module', 'order')
    def get_course(self, obj):
        return CourseSerializer(obj.course).data
    def get_module(self, obj):
        return ModuleElementSerializer(obj.module).data
    
class ModuleToElementSerializer(serializers.ModelSerializer):
    module = serializers.SerializerMethodField()
    element = serializers.SerializerMethodField()
    class Meta:
        model = ModuleToElement
        fields = ('id', 'module', 'element', 'order')
    def get_module(self, obj):
        return ModuleElementSerializer(obj.module).data
    def get_element(self, obj):
        return ElementSerializer(obj.element).data

class CourseAccessSerializer(serializers.ModelSerializer):
    account = serializers.SerializerMethodField()
    course = serializers.SerializerMethodField()
    class Meta:
        model = CourseAccess
        fields = ('id', 'account', 'course', 'expires')
    def get_account(self, obj):
        return AccountSerializer(obj.account).data
    def get_course(self, obj):
        return CourseSerializer(obj.course).data