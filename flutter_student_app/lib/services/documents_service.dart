import 'package:flutter/foundation.dart';
import '../models/document_models.dart';
import 'api_service.dart';

class DocumentsService extends ChangeNotifier {
  final ApiService _apiService;

  DocumentsService(this._apiService);

  List<DocumentModel> _documents = [];
  DocumentQuotaModel? _quota;
  bool _isLoading = false;
  bool _isUploading = false;
  String? _errorMessage;

  List<DocumentModel> get documents => _documents;
  DocumentQuotaModel? get quota => _quota;
  bool get isLoading => _isLoading;
  bool get isUploading => _isUploading;
  String? get errorMessage => _errorMessage;

  Future<void> loadMyDocuments({
    String documentType = '',
    String status = '',
    String search = '',
  }) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final params = <String, String>{};
      if (documentType.isNotEmpty) params['document_type'] = documentType;
      if (status.isNotEmpty) params['status'] = status;
      if (search.trim().isNotEmpty) params['search'] = search.trim();
      final qs = Uri(queryParameters: params).query;
      final endpoint = qs.isNotEmpty ? '/documents/me?$qs' : '/documents/me';
      final res = await _apiService.get(endpoint);
      final raw = res['documents'] as List? ?? [];
      _documents = raw
          .whereType<Map<String, dynamic>>()
          .map(DocumentModel.fromJson)
          .toList();
      if (res['quota'] is Map<String, dynamic>) {
        _quota = DocumentQuotaModel.fromJson(res['quota'] as Map<String, dynamic>);
      }
    } catch (e) {
      _errorMessage = e.toString().replaceAll('Exception: ', '');
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> uploadDocumentFile({
    required String filePath,
    String documentType = 'RESUME',
    String visibility = 'Private',
    String title = '',
  }) async {
    _isUploading = true;
    notifyListeners();
    try {
      await _apiService.uploadMultipart(
        '/documents/me',
        filePath: filePath,
        fieldName: 'document',
        fields: {
          'document_type': documentType,
          'visibility': visibility,
          if (title.trim().isNotEmpty) 'title': title.trim(),
        },
      );
      await loadMyDocuments();
    } finally {
      _isUploading = false;
      notifyListeners();
    }
  }

  Future<void> replaceDocumentFile({
    required String docId,
    required String filePath,
    required String documentType,
  }) async {
    _isUploading = true;
    notifyListeners();
    try {
      await _apiService.uploadMultipart(
        '/documents/me/$docId/replace',
        filePath: filePath,
        fieldName: 'document',
        method: 'PUT',
        fields: {'document_type': documentType},
      );
      await loadMyDocuments();
    } finally {
      _isUploading = false;
      notifyListeners();
    }
  }

  Future<void> updateMetadata(String docId, Map<String, dynamic> payload) async {
    await _apiService.patch('/documents/me/$docId', payload);
    await loadMyDocuments();
  }

  Future<void> associateWithResumeVersion(String docId, String? resumeVersionId) async {
    await _apiService.post('/documents/me/$docId/associate-resume', {
      'resume_version_id': resumeVersionId,
    });
  }

  Future<List<int>> downloadDocumentBytes(String docId) async {
    return _apiService.getBytes('/documents/me/$docId/download');
  }

  Future<void> deleteDocument(String docId) async {
    await _apiService.delete('/documents/me/$docId');
    await loadMyDocuments();
  }
}
