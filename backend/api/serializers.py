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
        fields = ('question', 'image', 'answers', 'correct_answer_indices', 'is_multiple_choice', 'hide_answers', 'explanation', 'explanation_image')


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

class DetailExamQuestionSerializer(serializers.ModelSerializer):
    #question = AssignmentElementSerializer(read_only=True)
    question = ElementSerializer(read_only=True)

    class Meta:
        model = ExamQuestion
        fields = ('id', 'question', 'marks', 'order')

class DetailExamElementSerializer(serializers.ModelSerializer):
    questions = DetailExamQuestionSerializer(many=True, read_only=True)

    class Meta:
        model = ExamElement
        fields = ('id', 'description', 'duration', 'total_marks', 'questions')

class DetailElementToModuleSerializer(serializers.ModelSerializer):
    element = ElementSerializer(read_only=True)

    class Meta:
        model = ElementToModule
        fields = ('id', 'element', 'order')

class DetailModuleElementSerializer(serializers.ModelSerializer):
    elements = DetailElementToModuleSerializer(many=True, read_only=True)

    class Meta:
        model = ModuleElement
        fields = ('id', 'title', 'description', 'elements')

class DetailElementSerializer(ElementSerializer):
    def get_data(self, obj):
        if obj.type == 'exam':
            return DetailExamElementSerializer(obj.examelement).data
        if obj.type == 'module':
            #module_elements = ElementToModule.objects.filter(module=obj)
            #return DetailElementToModuleSerializer(module_elements, many=True).data
            return DetailModuleElementSerializer(obj.moduleelement).data
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
    #course = CourseSerializer(read_only=True)

    class Meta:
        model = ElementToModule
        #fields = ('id', 'module', 'element', 'course', 'order')
        fields = ('id', 'module', 'element', 'order')


class CourseAccessSerializer(serializers.ModelSerializer):
    account = AccountSerializer(read_only=True)
    course = CourseSerializer(read_only=True)

    class Meta:
        model = CourseAccess
        fields = ('id', 'account', 'course', 'expires', 'is_active', 'obtaining_type')


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

# class ModuleWeightSerializer(serializers.ModelSerializer):
#     module = ModuleElementSerializer(read_only=True)
#     topic = CourseTopicSerializer(read_only=True)

#     class Meta:
#         model = ModuleWeight
#         fields = ('id', 'module', 'topic', 'weight')

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
    #weights = AssignmentWeightSerializer(source='assignment_weights', many=True, read_only=True)
    #weights = AssignmentWeightStructureSerializer(source='assignment_weights', many=True, read_only=True)
    weights = serializers.SerializerMethodField()

    class Meta:
        model = AssignmentElement
        fields = ('id', 'question', 'image', 'answers', 'correct_answer_indices', 'is_multiple_choice', 'hide_answers', 'explanation', 'explanation_image', 'weights')

    def get_weights(self, obj):
        course_id = self.context.get('course_id')
        weights = obj.assignment_weights.filter(topic__course_id=course_id)
        return AssignmentWeightStructureSerializer(weights, many=True).data
        
        

class ExamQuestionStructureSerializer(serializers.ModelSerializer):
    question = AssignmentElementStructureSerializer(read_only=True)
    class Meta:
        model = ExamQuestion
        fields = ('id', 'question', 'marks', 'order')

    def to_representation(self, instance):
        representation = super().to_representation(instance)
        if 'question' in representation:
            question_serializer = AssignmentElementStructureSerializer(instance.question, context=self.context)
            representation['question'] = question_serializer.data
        return representation

class ExamElementStructureSerializer(serializers.ModelSerializer):
    questions = ExamQuestionStructureSerializer(many=True, read_only=True)
    class Meta:
        model = ExamElement
        fields = ('id', 'description', 'duration', 'total_marks', 'questions')

    def to_representation(self, instance):
        representation = super().to_representation(instance)
        if 'questions' in representation:
            questions_serializer = ExamQuestionStructureSerializer(instance.questions, many=True, context=self.context)
            representation['questions'] = questions_serializer.data
        return representation

# class ModuleWeightStructureSerializer(serializers.ModelSerializer):
#     topic = CourseTopicStructureSerializer(read_only=True)
#     class Meta:
#         model = ModuleWeight
#         fields = ('id', 'topic', 'weight')

class ElementToModuleStructureSerializer(serializers.ModelSerializer):
    element_data = serializers.SerializerMethodField()
    uses = serializers.SerializerMethodField()

    class Meta:
        model = ElementToModule
        fields = ('id', 'order', 'element_data', 'uses')

    def get_element_data(self, obj):
        return ElementStructureSerializer(obj.element, context=self.context).data
    
    def get_uses(self, obj):
        return ElementToModule.objects.filter(element=obj.element).count()

class ModuleElementStructureSerializer(serializers.ModelSerializer):
    elements = ElementToModuleStructureSerializer(many=True, read_only=True)
    #weights = ModuleWeightStructureSerializer(source='module_weights', many=True, read_only=True)
    class Meta:
        model = ModuleElement
        #fields = ('id', 'title', 'description', 'image', 'elements', 'weights')
        fields = ('id', 'title', 'description', 'image', 'elements')

class ElementStructureSerializer(serializers.ModelSerializer):
    data = serializers.SerializerMethodField()

    class Meta:
        model = Element
        fields = ('id', 'name', 'type', 'data')

    def get_data(self, obj):
        if obj.type == 'module':
            return ModuleElementStructureSerializer(obj.moduleelement, context=self.context).data
        elif obj.type == 'text':
            return TextElementSerializer(obj.textelement).data
        elif obj.type == 'image':
            return ImageElementSerializer(obj.imageelement).data
        elif obj.type == 'video':
            return VideoElementSerializer(obj.videoelement).data
        elif obj.type == 'example':
            return ExampleElementSerializer(obj.exampleelement).data
        elif obj.type == 'assignment':
            return AssignmentElementStructureSerializer(obj.assignmentelement, context=self.context).data
        elif obj.type == 'exam':
            return ExamElementStructureSerializer(obj.examelement, context=self.context).data
        return None

class ModuleToCourseStructureSerializer(serializers.ModelSerializer):
    #module = ModuleElementStructureSerializer(read_only=True)
    module = ElementStructureSerializer(read_only=True)
    uses = serializers.SerializerMethodField()
    class Meta:
        model = ModuleToCourse
        fields = ('id', 'order', 'module', 'uses')

    def get_uses(self, obj):
        return ModuleToCourse.objects.filter(module=obj.module).count()

    def to_representation(self, instance):
        representation = super().to_representation(instance)
        module_serializer = ElementStructureSerializer(instance.module, context=self.context)
        representation['module'] = module_serializer.data
        return representation

class CourseStructureSerializer(serializers.ModelSerializer):
    author = AccountSerializer(read_only=True)
    modules = ModuleToCourseStructureSerializer(many=True, read_only=True)
    class Meta:
        model = Course
        fields = ('id', 'author', 'name', 'description', 'image', 'language', 'duration', 'last_updated', 'is_public', 'price_currency', 'price', 'promo_price', 'promo_expires', 'modules')

class CourseAccessDetailSerializer(serializers.ModelSerializer):
    account = AccountSerializer(read_only=True)
    course = CourseSerializer(read_only=True)
    class Meta:
        model = CourseAccess
        fields = ('id', 'account', 'course', 'expires', 'is_active', 'obtaining_type')

class CourseWithReviewsSerializer(CourseSerializer):
    reviews = serializers.SerializerMethodField()
    average_rating = serializers.SerializerMethodField()

    class Meta(CourseSerializer.Meta):
        fields = CourseSerializer.Meta.fields + ('reviews', 'average_rating')

    def get_reviews(self, obj):
        reviews = Review.objects.filter(course=obj)
        return ReviewSerializer(reviews, many=True).data
    
    def get_average_rating(self, obj):
        reviews = Review.objects.filter(course=obj)
        average = reviews.aggregate(average_rating=models.Avg('rating'))['average_rating']
        return average if average is not None else 0
    
class AccountWithCoursesSerializer(AccountSerializer):
    courses = serializers.SerializerMethodField()
    class Meta(AccountSerializer.Meta):
        fields = AccountSerializer.Meta.fields + ('courses',)

    def get_courses(self, obj):
        courses = Course.objects.filter(author=obj, is_public=True)
        return CourseWithReviewsSerializer(courses, many=True).data