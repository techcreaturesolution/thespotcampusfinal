import 'package:flutter/foundation.dart';
import '../models/internship_models.dart';
import 'api_service.dart';

class InternshipsService extends ChangeNotifier {
  final ApiService _apiService;

  InternshipsService(this._apiService);

  List<InternshipModel> _internships = [];
  bool _isLoading = false;
  bool _isSaving = false;
  String? _errorMessage;

  List<InternshipModel> get internships => _internships;
  bool get isLoading => _isLoading;
  bool get isSaving => _isSaving;
  String? get errorMessage => _errorMessage;

  Future<void> loadMyInternships({
    String status = '',
    String workMode = '',
    String search = '',
    String sort = 'display_order',
  }) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final params = <String, String>{'limit': '50', 'sort': sort};
      if (status.isNotEmpty) params['status'] = status;
      if (workMode.isNotEmpty) params['work_mode'] = workMode;
      if (search.trim().isNotEmpty) params['search'] = search.trim();
      final qs = Uri(queryParameters: params).query;
      final res = await _apiService.get('/internships/me?$qs');
      final raw = res['internships'] as List? ?? [];
      _internships = raw
          .whereType<Map<String, dynamic>>()
          .map(InternshipModel.fromJson)
          .toList();
    } catch (e) {
      _errorMessage = e.toString().replaceAll('Exception: ', '');
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> createInternship(Map<String, dynamic> payload) async {
    _isSaving = true;
    notifyListeners();
    try {
      await _apiService.post('/internships/me', payload);
      await loadMyInternships();
    } finally {
      _isSaving = false;
      notifyListeners();
    }
  }

  Future<void> updateInternship(String internshipId, Map<String, dynamic> payload) async {
    _isSaving = true;
    notifyListeners();
    try {
      await _apiService.patch('/internships/me/$internshipId', payload);
      await loadMyInternships();
    } finally {
      _isSaving = false;
      notifyListeners();
    }
  }

  Future<void> deleteInternship(String internshipId) async {
    _isSaving = true;
    notifyListeners();
    try {
      await _apiService.delete('/internships/me/$internshipId');
      await loadMyInternships();
    } finally {
      _isSaving = false;
      notifyListeners();
    }
  }
}
