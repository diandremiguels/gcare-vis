from django.urls import path
from . import views
from .views import *

urlpatterns = [
    path('', views.home, name='home'),
    path('get-filter-types/', views.get_filter_types, name='get_filter_types'),
    path('get-filter-options/', views.get_filter_options, name='get_filter_options'),
    path('get-filtered-files/', views.get_filtered_files, name='get_filtered_files'),
    path('obtain-graph-info/', views.obtain_graph_info, name='obtain-graph-info'),
    path('obtain-file-contents/', views.obtain_file_contents, name='obtain-file-contents'),
    path('convert-file-to-graph/', views.convert_file_to_graph, name='convert-file-to-graph/')
]
