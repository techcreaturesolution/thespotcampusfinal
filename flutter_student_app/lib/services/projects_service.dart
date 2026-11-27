import 'package:flutter/foundation.dart';
import '../models/project_models.dart';
import '../models/technical_skill_models.dart';
import 'api_service.dart';

class ProjectsService extends ChangeNotifier {
  final ApiService _apiService;

  ProjectsService(this._apiService);

  List<ProjectModel> _projects = [];
  bool _isLoading = false;
  bool _isSaving = false;
  String? _errorMessage;

  List<ProjectModel> get projects => _projects;
  bool get isLoading => _isLoading;
  bool get isSaving => _isSaving;
  String? get errorMessage => _errorMessage;

  Future<void> loadMyProjects({String status = ''}) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final params = <String, String>{'limit': '50'};
      if (status.isNotEmpty) params['status'] = status;
      final qs = Uri(queryParameters: params).query;
      final res = await _apiService.get('/projects/me?$qs');
      final raw = res['projects'] as List? ?? [];
      _projects = raw.whereType<Map<String, dynamic>>().map(ProjectModel.fromJson).toList();
    } catch (e) {
      _errorMessage = e.toString().replaceAll('Exception: ', '');
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<List<SkillMasterModel>> searchCanonicalSkills(String query) async {
    final params = <String, String>{'limit': '20'};
    if (query.trim().isNotEmpty) params['q'] = query.trim();
    final qs = Uri(queryParameters: params).query;
    final res = await _apiService.get('/skills/master?$qs');
    final raw = res['skills'] as List? ?? [];
    return raw.whereType<Map<String, dynamic>>().map(SkillMasterModel.fromJson).toList();
  }

  Future<void> createProject(Map<String, dynamic> payload) async {
    _isSaving = true;
    notifyListeners();
    try {
      await _apiService.post('/projects/me', payload);
      await loadMyProjects();
    } finally {
      _isSaving = false;
      notifyListeners();
    }
  }

  Future<void> updateProject(String projectId, Map<String, dynamic> payload) async {
    _isSaving = true;
    notifyListeners();
    try {
      await _apiService.patch('/projects/me/$projectId', payload);
      await loadMyProjects();
    } finally {
      _isSaving = false;
      notifyListeners();
    }
  }

  Future<void> deleteProject(String projectId) async {
    _isSaving = true;
    notifyListeners();
    try {
      await _apiService.delete('/projects/me/$projectId');
      await loadMyProjects();
    } finally {
      _isSaving = false;
      notifyListeners();
    }
  }

  Future<void> reorderProjects(List<ProjectModel> reordered) async {
    final orders = <Map<String, dynamic>>[];
    for (int i = 0; i < reordered.length; i++) {
      orders.add({'project_id': reordered[i].id, 'display_order': i});
    }
    _projects = reordered;
    notifyListeners();
    await _apiService.patch('/projects/me/reorder', {'orders': orders});
    await loadMyProjects();
  }

  Future<void> addProjectLink(String projectId, Map<String, dynamic> payload) async {
    _isSaving = true;
    notifyListeners();
    try {
      await _apiService.post('/projects/me/$projectId/links', payload);
      await loadMyProjects();
    } finally {
      _isSaving = false;
      notifyListeners();
    }
  }

  Future<void> updateProjectLink(
      String projectId, String linkId, Map<String, dynamic> payload) async {
    _isSaving = true;
    notifyListeners();
    try {
      await _apiService.patch('/projects/me/$projectId/links/$linkId', payload);
      await loadMyProjects();
    } finally {
      _isSaving = false;
      notifyListeners();
    }
  }

  Future<void> deleteProjectLink(String projectId, String linkId) async {
    _isSaving = true;
    notifyListeners();
    try {
      await _apiService.delete('/projects/me/$projectId/links/$linkId');
      await loadMyProjects();
    } finally {
      _isSaving = false;
      notifyListeners();
    }
  }
}
