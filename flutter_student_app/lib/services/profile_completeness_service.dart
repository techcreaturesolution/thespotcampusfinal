import 'package:flutter/foundation.dart';
import '../models/profile_completeness_model.dart';
import 'api_service.dart';

class ProfileCompletenessService extends ChangeNotifier {
  final ApiService _apiService;

  ProfileCompletenessService(this._apiService);

  ProfileCompletenessModel? _completeness;
  bool _isLoading = false;
  String? _errorMessage;

  ProfileCompletenessModel? get completeness => _completeness;
  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;
  int get percentage => _completeness?.percentage ?? 0;

  Future<void> loadMyCompleteness({bool silent = false}) async {
    if (!silent) {
      _isLoading = true;
      _errorMessage = null;
      notifyListeners();
    }

    try {
      final response = await _apiService.get('/profile-completeness/me');
      final raw = response['completeness'];
      if (raw is Map<String, dynamic>) {
        _completeness = ProfileCompletenessModel.fromJson(raw);
      }
      _errorMessage = null;
    } catch (e) {
      _errorMessage = e.toString().replaceAll('Exception: ', '');
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }
}
