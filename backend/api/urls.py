from django.urls import path
from . import views
from .views import *

urlpatterns = [
    path('register', RegisterView.as_view(), name='register'),
    path('profile/setup', ProfileSetupView.as_view(), name='profile_setup'),
    path('profile/me', MyProfileView.as_view(), name='my_profile'),
    path('course/<int:id>', CourseView.as_view(), name='course'),
    path('courses/my', MyCoursesView.as_view(), name='my_courses'),
    path('course', CourseView.as_view(), name='course'),
    path('profile/avatar', ProfileAvatarView.as_view(), name='my_avatar_edit'),
    path('elements/my', MyElementsView.as_view(), name='my_elements'),
    path('element', ElementView.as_view(), name='element'),
    path('element/<int:element_id>', ElementView.as_view(), name='specific_element'),
    path('coursetopic/<int:id>', CourseTopicView.as_view(), name='course_topic'),
    path('course/<int:course_id>/topic', CourseTopicView.as_view(), name='course_topic_post'),
    path('course/<int:course_id>/topics', CourseTopicsView.as_view(), name='course_topics'),
    path('course/<int:id>/structure', CourseStructureView.as_view(), name='course_structure'),
    path('course/<int:course_id>/structure/<int:module_id>', ModuleToCourseView.as_view(), name='module_to_course'),
    path('course/<int:course_id>/module/<int:module_id>/structure/<int:element_id>', ElementToModuleView.as_view(), name='element_to_module'),
    path('module/<int:module_id>/structure/<int:element_id>', ElementToModuleView.as_view(), name='element_to_module'),
    path('element/<int:element_id>/copy', ElementCopyView.as_view(), name='element_copy'),
    path('course/<int:course_id>/assignment/<int:assignment_id>/weights', AssignmentWeightsView.as_view(), name='assignment_weights'),
    path('course/<int:course_id>/accesses', CourseAccessesView.as_view(), name='course_accesses'),
    path('course/<int:course_id>/access/gift', CourseAccessGiftView.as_view(), name='course_access_gift'),
    path('course/<int:course_id>/access', CourseAccessView.as_view(), name='course_access'),
    path('courseaccess/<int:course_access_id>', CourseAccessView.as_view(), name='course_access_specific'),
    path('courseaccesses/my', MyCourseAccessesView.as_view(), name='my_course_accesses'),
    path('course/<int:course_id>/accounttopics', AccountTopicView.as_view(), name='get_account_topics'),
    path('course/<int:course_id>/accounttopics/assignment/<int:assignment_id>', AccountTopicView.as_view(), name='put_account_topics')
]