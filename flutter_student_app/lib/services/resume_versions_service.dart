import 'package:flutter/foundation.dart';
import '../models/resume_version_models.dart';
import 'api_service.dart';

class ResumeVersionsService extends ChangeNotifier {
  final ApiService _apiService;

  ResumeVersionsService(this._apiService);

  List<ResumeVersionModel> _versions = [];
  List<Map<String, dynamic>> _templates = [];
  bool _isLoading = false;
  bool _isSaving = false;
  String? _errorMessage;

  List<ResumeVersionModel> get versions => _versions;
  List<Map<String, dynamic>> get templates => _templates;
  bool get isLoading => _isLoading;
  bool get isSaving => _isSaving;
  String? get errorMessage => _errorMessage;

  Future<void> loadMyVersions({String status = '', String search = ''}) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final params = <String, String>{};
      if (status.isNotEmpty) params['status'] = status;
      if (search.trim().isNotEmpty) params['search'] = search.trim();
      final qs = Uri(queryParameters: params).query;
      final endpoint = qs.isNotEmpty ? '/resume-versions/me?$qs' : '/resume-versions/me';
      final res = await _apiService.get(endpoint);
      final raw = res['resume_versions'] as List? ?? [];
      final rawTpl = res['templates'] as List? ?? [];
      _versions = raw
          .whereType<Map<String, dynamic>>()
          .map(ResumeVersionModel.fromJson)
          .toList();
      _templates = rawTpl.whereType<Map<String, dynamic>>().toList();
    } catch (e) {
      _errorMessage = e.toString().replaceAll('Exception: ', '');
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> createVersion(Map<String, dynamic> payload) async {
    _isSaving = true;
    notifyListeners();
    try {
      await _apiService.post('/resume-versions/me', payload);
      await loadMyVersions();
    } finally {
      _isSaving = false;
      notifyListeners();
    }
  }

  Future<void> updateVersion(String resumeId, Map<String, dynamic> payload) async {
    _isSaving = true;
    notifyListeners();
    try {
      await _apiService.patch('/resume-versions/me/$resumeId', payload);
      await loadMyVersions();
    } finally {
      _isSaving = false;
      notifyListeners();
    }
  }

  Future<void> duplicateVersion(String resumeId) async {
    _isSaving = true;
    notifyListeners();
    try {
      await _apiService.post('/resume-versions/me/$resumeId/duplicate', {});
      await loadMyVersions();
    } finally {
      _isSaving = false;
      notifyListeners();
    }
  }

  Future<void> setDefaultVersion(String resumeId) async {
    _isSaving = true;
    notifyListeners();
    try {
      await _apiService.post('/resume-versions/me/$resumeId/default', {});
      await loadMyVersions();
    } finally {
      _isSaving = false;
      notifyListeners();
    }
  }

  Future<void> deleteVersion(String resumeId) async {
    _isSaving = true;
    notifyListeners();
    try {
      await _apiService.delete('/resume-versions/me/$resumeId');
      await loadMyVersions();
    } finally {
      _isSaving = false;
      notifyListeners();
    }
  }

  Future<Map<String, dynamic>> previewVersion(String resumeId) async {
    return _apiService.post('/resume-versions/me/$resumeId/preview', {});
  }

  Future<List<int>> downloadVersionPdf(String resumeId) async {
    return _apiService.getBytes('/resume-versions/me/$resumeId/download-pdf');
  }
}
