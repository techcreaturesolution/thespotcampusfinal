import 'package:flutter/foundation.dart';
import '../models/certification_models.dart';
import 'api_service.dart';

class CertificationsService extends ChangeNotifier {
  final ApiService _apiService;

  CertificationsService(this._apiService);

  List<CertificationModel> _certifications = [];
  bool _isLoading = false;
  bool _isSaving = false;
  String? _errorMessage;

  List<CertificationModel> get certifications => _certifications;
  bool get isLoading => _isLoading;
  bool get isSaving => _isSaving;
  String? get errorMessage => _errorMessage;

  Future<void> loadMyCertifications({
    String status = '',
    String category = '',
    String search = '',
  }) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final params = <String, String>{'limit': '50'};
      if (status.isNotEmpty) params['status'] = status;
      if (category.isNotEmpty) params['category'] = category;
      if (search.trim().isNotEmpty) params['search'] = search.trim();
      final qs = Uri(queryParameters: params).query;
      final res = await _apiService.get('/certifications/me?$qs');
      final raw = res['certifications'] as List? ?? [];
      _certifications = raw
          .whereType<Map<String, dynamic>>()
          .map(CertificationModel.fromJson)
          .toList();
    } catch (e) {
      _errorMessage = e.toString().replaceAll('Exception: ', '');
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> createCertification(Map<String, dynamic> payload) async {
    _isSaving = true;
    notifyListeners();
    try {
      await _apiService.post('/certifications/me', payload);
      await loadMyCertifications();
    } finally {
      _isSaving = false;
      notifyListeners();
    }
  }

  Future<void> updateCertification(String certId, Map<String, dynamic> payload) async {
    _isSaving = true;
    notifyListeners();
    try {
      await _apiService.patch('/certifications/me/$certId', payload);
      await loadMyCertifications();
    } finally {
      _isSaving = false;
      notifyListeners();
    }
  }

  Future<void> deleteCertification(String certId) async {
    _isSaving = true;
    notifyListeners();
    try {
      await _apiService.delete('/certifications/me/$certId');
      await loadMyCertifications();
    } finally {
      _isSaving = false;
      notifyListeners();
    }
  }

  Future<void> reorderCertifications(List<CertificationModel> ordered) async {
    final orders = <Map<String, dynamic>>[];
    for (int i = 0; i < ordered.length; i++) {
      orders.add({'certification_id': ordered[i].id, 'display_order': i});
    }
    _certifications = List<CertificationModel>.from(ordered);
    notifyListeners();
    try {
      await _apiService.patch('/certifications/me/reorder', {'orders': orders});
    } catch (e) {
      await loadMyCertifications();
      rethrow;
    }
  }
}
