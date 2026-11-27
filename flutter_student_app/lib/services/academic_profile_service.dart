import 'package:flutter/foundation.dart';
import '../models/academic_profile_models.dart';
import 'api_service.dart';

class AcademicProfileService extends ChangeNotifier {
  final ApiService _apiService;

  AcademicProfileService(this._apiService);

  AcademicProfileModel? _profile;
  AcademicCompletion? _completion;
  List<AcademicHistoryModel> _history = [];
  bool _isLoading = false;
  bool _isSaving = false;
  String? _errorMessage;

  AcademicProfileModel? get profile => _profile;
  AcademicCompletion? get completion => _completion;
  List<AcademicHistoryModel> get history => _history;
  bool get isLoading => _isLoading;
  bool get isSaving => _isSaving;
  String? get errorMessage => _errorMessage;

  Future<void> loadAcademicProfile() async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final results = await Future.wait([
        _apiService.get('/academic-profile/me'),
        _apiService.get('/academic-profile/me/history?page=1&limit=25'),
      ]);

      final profileRes = results[0];
      final historyRes = results[1];

      if (profileRes['academic_profile'] is Map<String, dynamic>) {
        _profile = AcademicProfileModel.fromJson(profileRes['academic_profile']);
      }
      if (profileRes['completion'] is Map<String, dynamic>) {
        _completion = AcademicCompletion.fromJson(profileRes['completion']);
      }

      final historyList = historyRes['history'] as List? ?? [];
      _history = historyList
          .whereType<Map<String, dynamic>>()
          .map(AcademicHistoryModel.fromJson)
          .toList();
    } catch (e) {
      _errorMessage = e.toString().replaceAll('Exception: ', '');
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> updateAcademicProfile(Map<String, dynamic> payload) async {
    _isSaving = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final res = await _apiService.patch('/academic-profile/me', payload);
      if (res['academic_profile'] is Map<String, dynamic>) {
        _profile = AcademicProfileModel.fromJson(res['academic_profile']);
      }
      if (res['completion'] is Map<String, dynamic>) {
        _completion = AcademicCompletion.fromJson(res['completion']);
      }
    } finally {
      _isSaving = false;
      notifyListeners();
    }
  }

  Future<void> addHistory(Map<String, dynamic> payload) async {
    _isSaving = true;
    notifyListeners();
    try {
      await _apiService.post('/academic-profile/me/history', payload);
      await loadAcademicProfile();
    } finally {
      _isSaving = false;
      notifyListeners();
    }
  }

  Future<void> updateHistory(String historyId, Map<String, dynamic> payload) async {
    _isSaving = true;
    notifyListeners();
    try {
      await _apiService.patch('/academic-profile/me/history/$historyId', payload);
      await loadAcademicProfile();
    } finally {
      _isSaving = false;
      notifyListeners();
    }
  }

  Future<void> deleteHistory(String historyId) async {
    _isSaving = true;
    notifyListeners();
    try {
      await _apiService.delete('/academic-profile/me/history/$historyId');
      await loadAcademicProfile();
    } finally {
      _isSaving = false;
      notifyListeners();
    }
  }

  Future<List<Map<String, dynamic>>> fetchUniversities() async {
    final res = await _apiService.get('/dropdown/universities');
    return (res['universities'] as List? ?? []).whereType<Map<String, dynamic>>().toList();
  }

  Future<List<Map<String, dynamic>>> fetchColleges(String universityId) async {
    final res = await _apiService.get('/dropdown/colleges?university_id=$universityId');
    return (res['colleges'] as List? ?? []).whereType<Map<String, dynamic>>().toList();
  }

  Future<List<Map<String, dynamic>>> fetchDegrees(String collegeId) async {
    final res = await _apiService.get('/dropdown/degrees?college_id=$collegeId');
    return (res['degrees'] as List? ?? []).whereType<Map<String, dynamic>>().toList();
  }

  Future<List<Map<String, dynamic>>> fetchBranches(String degreeId, String collegeId) async {
    final res = await _apiService.get('/dropdown/branches?degree_id=$degreeId&college_id=$collegeId');
    return (res['branches'] as List? ?? []).whereType<Map<String, dynamic>>().toList();
  }
}
