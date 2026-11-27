import '../models/market_job_models.dart';
import 'api_service.dart';

/// Unified Dio-backed service for Market Job Finder (eliminates duplicate raw http client).
class JobFinderService {
  final ApiService _api;

  JobFinderService({ApiService? api}) : _api = api ?? ApiService();

  Future<MarketJobMeta> getMeta() async {
    final data = await _api.get('/job-finder/meta');
    return MarketJobMeta.fromJson(data);
  }

  Future<MarketJobSearch> startSearch(Map<String, dynamic> body) async {
    final data = await _api.post('/job-finder/search', body);
    return MarketJobSearch.fromJson(data['search']);
  }

  Future<List<MarketJobSearch>> getSearches() async {
    try {
      final data = await _api.get('/job-finder/searches');
      final items = (data['items'] as List? ?? []);
      return items.map((i) => MarketJobSearch.fromJson(i)).toList();
    } catch (_) {
      return [];
    }
  }

  Future<Map<String, dynamic>> getSearchById(String id) async {
    final data = await _api.get('/job-finder/searches/$id');
    final search = MarketJobSearch.fromJson(data['search']);
    final jobs = (data['items'] as List? ?? [])
        .map((j) => MarketJob.fromJson(j))
        .toList();
    return {'search': search, 'items': jobs};
  }

  Future<MarketJob> getJobDetails(String id) async {
    final data = await _api.get('/job-finder/jobs/$id');
    return MarketJob.fromJson(data['job']);
  }

  Future<String> applyJob(String id, {String? link}) async {
    final data = await _api.post(
      '/job-finder/jobs/$id/apply',
      link != null ? {'link': link} : {},
    );
    return data['url'] ?? '';
  }
}
