import 'package:flutter/foundation.dart';
import '../models/profile_policy_model.dart';
import 'api_service.dart';

class ProfilePolicyService extends ChangeNotifier {
  final ApiService _apiService;

  ProfilePolicyService(this._apiService);

  ProfilePolicyStatusModel? _policy;
  bool _isLoading = false;
  bool _isMutating = false;
  String? _errorMessage;

  ProfilePolicyStatusModel? get policy => _policy;
  bool get isLoading => _isLoading;
  bool get isMutating => _isMutating;
  String? get errorMessage => _errorMessage;

  Future<void> loadMyPolicy({bool silent = false}) async {
    if (!silent) {
      _isLoading = true;
      _errorMessage = null;
      notifyListeners();
    }

    try {
      final response = await _apiService.get('/profile-policy/me');
      _policy = ProfilePolicyStatusModel.fromJson(response);
      _errorMessage = null;
    } catch (e) {
      _errorMessage = e.toString().replaceAll('Exception: ', '');
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<bool> changeVisibility(String targetVisibility) async {
    _isMutating = true;
    _errorMessage = null;
    notifyListeners();

    try {
      Map<String, dynamic> response;
      if (targetVisibility == 'Private') {
        response = await _apiService.post('/profile-policy/me/unpublish', {});
      } else if (_policy?.isPublished != true) {
        response = await _apiService.post('/profile-policy/me/publish', {
          'visibility': targetVisibility,
        });
      } else {
        response = await _apiService.patch('/profile-policy/me/visibility', {
          'visibility': targetVisibility,
        });
      }
      _policy = ProfilePolicyStatusModel.fromJson(response);
      _errorMessage = null;
      return true;
    } catch (e) {
      _errorMessage = e.toString().replaceAll('Exception: ', '');
      await loadMyPolicy(silent: true);
      return false;
    } finally {
      _isMutating = false;
      notifyListeners();
    }
  }
}
