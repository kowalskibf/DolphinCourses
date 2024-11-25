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
        fields = ('question', 'image', 'explanation', 'explanation_image')


class AssignmentElementSerializer(serializers.ModelSerializer):
    class Meta:
        model = AssignmentElement
        fields = ('question', 'image', 'answers', 'correct_answer_indices', 'is_multiple_choice', 'explanation', 'explanation_image')


class ExamElementSerializer(serializers.ModelSerializer):
    class Meta:
        model = ExamElement
        fields = ('description', 'duration', 'total_marks')


class ExamQuestionSerializer(serializers.ModelSerializer):
    exam = ExamElementSerializer(read_only=True)
    question = AssignmentElementSerializer(read_only=True)

    class Meta:
        model = ExamQuestion
        fields = ('id', 'exam', 'question', 'marks', 'order')

class ExamQuestionDetailSerializer(serializers.ModelSerializer):
    question = AssignmentElementSerializer(read_only=True)

    class Meta:
        model = ExamQuestion
        fields = ('id', 'question', 'marks', 'order')

class DetailedExamElementSerializer(serializers.ModelSerializer):
    questions = ExamQuestionDetailSerializer(source='examquestion_set', many=True, read_only=True)

    class Meta:
        model = ExamElement
        fields = ('description', 'duration', 'total_marks', 'questions')

class DetailElementSerializer(ElementSerializer):
    def get_data(self, obj):
        if obj.type == 'exam':
            return DetailedExamElementSerializer(obj.examelement).data
        return super().get_data(obj)

class ModuleToCourseSerializer(serializers.ModelSerializer):
    course = CourseSerializer(read_only=True)
    module = ModuleElementSerializer(read_only=True)

    class Meta:
        model = ModuleToCourse
        fields = ('id', 'course', 'module', 'order')


class ElementToModuleSerializer(serializers.ModelSerializer):
    module = ModuleElementSerializer(read_only=True)
    element = ElementSerializer(read_only=True)
    course = CourseSerializer(read_only=True)

    class Meta:
        model = ElementToModule
        fields = ('id', 'module', 'element', 'course', 'order')


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

class AccountTopicSerializer(serializers.ModelSerializer):
    account = AccountSerializer(read_only=True)
    course_topic = CourseTopicSerializer(read_only=True)

    class Meta:
        model = AccountTopic
        fields = ('id', 'account', 'course_topic', 'value')

class CourseTopicStructureSerializer(serializers.ModelSerializer):
    class Meta:
        model = CourseTopic
        fields = ('id', 'topic')

class AssignmentWeightStructureSerializer(serializers.ModelSerializer):
    topic = CourseTopicStructureSerializer(read_only=True)
    class Meta:
        model = AssignmentWeight
        fields = ('id', 'topic', 'weight')

class AssignmentElementStructureSerializer(serializers.ModelSerializer):
    weights = AssignmentWeightSerializer(source='assignment_weights', many=True, read_only=True)
    class Meta:
        model = AssignmentElement
        fields = ('id', 'question', 'image', 'answers', 'correct_answer_indices', 'is_multiple_choice', 'explanation', 'explanation_image', 'weights')

class ExamQuestionStructureSerializer(serializers.ModelSerializer):
    question = AssignmentElementStructureSerializer(read_only=True)
    class Meta:
        model = ExamQuestion
        fields = ('id', 'question', 'marks', 'order')

class ExamElementStructureSerializer(serializers.ModelSerializer):
    questions = ExamQuestionDetailSerializer(source='questions', many=True, read_only=True)
    class Meta:
        model = ExamElement
        fields = ('id', 'description', 'duration', 'total_marks', 'questions')

class ModuleWeightStructureSerializer(serializers.ModelSerializer):
    topic = CourseTopicStructureSerializer(read_only=True)
    class Meta:
        model = ModuleWeight
        fields = ('id', 'topic', 'weight')

class ElementToModuleStructureSerializer(serializers.ModelSerializer):
    element_data = serializers.SerializerMethodField()

    class Meta:
        model = ElementToModule
        fields = ('id', 'order', 'element_data')

    def get_element_data(self, obj):
        return ElementStructureSerializer(obj.element).data

class ModuleElementStructureSerializer(serializers.ModelSerializer):
    elements = ElementToModuleStructureSerializer(many=True, read_only=True)
    weights = ModuleWeightStructureSerializer(source='module_weights', many=True, read_only=True)
    class Meta:
        model = ModuleElement
        fields = ('id', 'title', 'description', 'image', 'elements', 'weights')

class ElementStructureSerializer(serializers.ModelSerializer):
    data = serializers.SerializerMethodField()

    class Meta:
        model = Element
        fields = ('id', 'name', 'type', 'data')

    def get_data(self, obj):
        if obj.type == 'module':
            #element_to_module = ElementToModule.objects.filter(element=obj).first()
            #return ModuleElementStructureSerializer(element_to_module).data
            return ModuleElementStructureSerializer(obj.moduleelement).data
        elif obj.type == 'text':
            return TextElementSerializer(obj.textelement).data
        elif obj.type == 'image':
            return ImageElementSerializer(obj.imageelement).data
        elif obj.type == 'video':
            return VideoElementSerializer(obj.videoelement).data
        elif obj.type == 'example':
            return ExampleElementSerializer(obj.exampleelement).data
        elif obj.type == 'assignment':
            return AssignmentElementStructureSerializer(obj.assignmentelement).data
        elif obj.type == 'exam':
            return ExamElementStructureSerializer(obj.examelement).data
        return None

class ModuleToCourseStructureSerializer(serializers.ModelSerializer):
    #module = ModuleElementStructureSerializer(read_only=True)
    module = ElementStructureSerializer(read_only=True)
    class Meta:
        model = ModuleToCourse
        fields = ('id', 'order', 'module')

class CourseStructureSerializer(serializers.ModelSerializer):
    author = AccountSerializer(read_only=True)
    modules = ModuleToCourseStructureSerializer(many=True, read_only=True)
    class Meta:
        model = Course
        fields = ('id', 'author', 'name', 'description', 'image', 'language', 'duration', 'last_updated', 'is_public', 'price_currency', 'price', 'promo_price', 'promo_expires', 'modules')

