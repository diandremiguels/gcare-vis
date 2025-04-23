import os
from django.shortcuts import render
from django.http import HttpResponse
from django.http import JsonResponse
from django.template import loader
from fileprocessor.utils.read_files import categorize_files
from .utils.read_files import categorize_files
from .utils.parse_query import parse_graph_with_label_offsets

# Create your views here.
def home(request):
    return render(request, 'fileprocessor/contenteditable.html')

def get_filter_types(request):
    # Example logic to return filter types
    filter_types = ['Dataset', 'Pattern', 'Any']
    return JsonResponse({'filter_types': filter_types})

def get_filter_options(request):
    filter_type = request.GET.get('filter_type')
    filter_map, pattern_map = categorize_files('fileprocessor/static/queries')
    # Example logic to return filter options based on filter type
    if filter_type == 'Dataset':
        options = list(filter_map.keys())
    elif filter_type == 'Pattern':
        options = list(pattern_map.keys())
    else:
        options = list(['----'])
    
    return JsonResponse({'options': options})

def get_filtered_files(request):
    filter_option = request.GET.get('filter_option')
    sorting_option = request.GET.get('sort_option')
    filter_map, pattern_map = categorize_files('fileprocessor/static/queries')
    files = []
    if filter_option == 'Dataset':
        files = filter_map.get(sorting_option)
    elif filter_option == 'Pattern':
        files = pattern_map.get(sorting_option)
    else:
        for val in filter_map.values():
            files.extend(val)
    return JsonResponse({'files': files})

def obtain_graph_info(request):
    selected_file = str(request.GET.get('selected_file'))
    path = os.getcwd().join('fileprocessor/static/' + selected_file)

def obtain_file_contents(request):
    selected_file = str(request.GET.get('selected_file'))
    path = os.getcwd() + '/fileprocessor/static/queries/' + selected_file
    contents = ''
    with open(path, 'r') as f:
        contents = f.read()
    return JsonResponse({'contents': contents})

def convert_file_to_graph(request):
    string_contents = str(request.GET.get('selected_file'))
    nodes, edges, graph = parse_graph_with_label_offsets(string_contents)
    return JsonResponse({"nodes": nodes, "edges": edges, "graph": graph})