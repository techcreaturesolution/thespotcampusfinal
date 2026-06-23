import 'api_service.dart';

class ResumeService {
  final ApiService _apiService;

  ResumeService(this._apiService);

  Future<Map<String, dynamic>> checkSubscription() async {
    return await _apiService.get('/payment/check');
  }

  Future<Map<String, dynamic>> getResume() async {
    return await _apiService.get('/student/resume/me');
  }

  Future<Map<String, dynamic>> saveResume(Map<String, dynamic> data) async {
    return await _apiService.post('/student/resume/me', data);
  }

  Future<Map<String, dynamic>> getTemplates() async {
    return await _apiService.get('/cv-templates');
  }

  Future<Map<String, dynamic>> compileResume() async {
    return await _apiService.post('/cv-templates/compile', {});
  }

  Future<List<int>> downloadPdf() async {
    return await _apiService.getBytes('/cv-templates/download-pdf');
  }

  Future<Map<String, dynamic>> generateAiSummaries(Map<String, dynamic> data) async {
    return await _apiService.post('/student/resume/ai-summaries', data);
  }
}
