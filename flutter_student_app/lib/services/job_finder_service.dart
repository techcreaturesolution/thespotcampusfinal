import 'dart:convert';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:http/http.dart' as http;
import '../models/market_job_models.dart';
import '../utils/constants.dart';

class JobFinderService {
  final _storage = const FlutterSecureStorage();

  Future<String?> _getToken() async {
    return await _storage.read(key: AppConstants.tokenKey);
  }

  Map<String, String> _headers(String? token) {
    final headers = {'Content-Type': 'application/json'};
    if (token != null) {
      headers['Cookie'] = 'token=$token';
      headers['Authorization'] = 'Bearer $token';
    }
    return headers;
  }

  Future<MarketJobMeta> getMeta() async {
    final token = await _getToken();
    final res = await http.get(
      Uri.parse('${AppConstants.baseUrl}/job-finder/meta'),
      headers: _headers(token),
    );
    if (res.statusCode >= 200 && res.statusCode < 300) {
      final data = jsonDecode(res.body);
      return MarketJobMeta.fromJson(data);
    }
    throw Exception('Failed to load job meta');
  }

  Future<MarketJobSearch> startSearch(Map<String, dynamic> body) async {
    final token = await _getToken();
    final res = await http.post(
      Uri.parse('${AppConstants.baseUrl}/job-finder/search'),
      headers: _headers(token),
      body: jsonEncode(body),
    );
    if (res.statusCode >= 200 && res.statusCode < 300) {
      final data = jsonDecode(res.body);
      return MarketJobSearch.fromJson(data['search']);
    }
    final err = jsonDecode(res.body);
    throw Exception(err['message'] ?? err['error'] ?? 'Search failed');
  }

  Future<List<MarketJobSearch>> getSearches() async {
    final token = await _getToken();
    final res = await http.get(
      Uri.parse('${AppConstants.baseUrl}/job-finder/searches'),
      headers: _headers(token),
    );
    if (res.statusCode >= 200 && res.statusCode < 300) {
      final data = jsonDecode(res.body);
      final items = (data['items'] as List? ?? []);
      return items.map((i) => MarketJobSearch.fromJson(i)).toList();
    }
    return [];
  }

  Future<Map<String, dynamic>> getSearchById(String id) async {
    final token = await _getToken();
    final res = await http.get(
      Uri.parse('${AppConstants.baseUrl}/job-finder/searches/$id'),
      headers: _headers(token),
    );
    if (res.statusCode >= 200 && res.statusCode < 300) {
      final data = jsonDecode(res.body);
      final search = MarketJobSearch.fromJson(data['search']);
      final jobs = (data['items'] as List? ?? [])
          .map((j) => MarketJob.fromJson(j))
          .toList();
      return {'search': search, 'items': jobs};
    }
    throw Exception('Search result not found');
  }

  Future<MarketJob> getJobDetails(String id) async {
    final token = await _getToken();
    final res = await http.get(
      Uri.parse('${AppConstants.baseUrl}/job-finder/jobs/$id'),
      headers: _headers(token),
    );
    if (res.statusCode >= 200 && res.statusCode < 300) {
      final data = jsonDecode(res.body);
      return MarketJob.fromJson(data['job']);
    }
    throw Exception('Job not found');
  }

  Future<String> applyJob(String id, {String? link}) async {
    final token = await _getToken();
    final res = await http.post(
      Uri.parse('${AppConstants.baseUrl}/job-finder/jobs/$id/apply'),
      headers: _headers(token),
      body: jsonEncode(link != null ? {'link': link} : {}),
    );
    if (res.statusCode >= 200 && res.statusCode < 300) {
      final data = jsonDecode(res.body);
      return data['url'] ?? '';
    }
    throw Exception('Failed to resolve job application link');
  }
}
