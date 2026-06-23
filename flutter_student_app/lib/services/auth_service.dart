import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../utils/constants.dart';

class AuthService extends ChangeNotifier {
  final _storage = const FlutterSecureStorage();
  Map<String, dynamic>? _user;
  bool _isLoading = false;
  bool _isAuthenticated = false;

  Map<String, dynamic>? get user => _user;
  bool get isLoading => _isLoading;
  bool get isAuthenticated => _isAuthenticated;
  String get userName => _user?['student_name'] ?? 'Student';
  String get userEmail => _user?['student_email'] ?? '';

  Future<void> checkAuth() async {
    _isLoading = true;
    notifyListeners();

    try {
      final token = await _storage.read(key: AppConstants.tokenKey);
      if (token != null) {
        final response = await http.get(
          Uri.parse('${AppConstants.baseUrl}/login/current-user'),
          headers: {
            'Content-Type': 'application/json',
            'Cookie': 'token=$token',
          },
        ).timeout(const Duration(seconds: 5));
        if (response.statusCode == 200) {
          final data = jsonDecode(response.body);
          _user = data['user'];
          _isAuthenticated = true;
        } else {
          await _storage.deleteAll();
          _isAuthenticated = false;
        }
      }
    } catch (e) {
      _isAuthenticated = false;
    }

    _isLoading = false;
    notifyListeners();
  }

  Future<bool> login(String email, String password) async {
    _isLoading = true;
    notifyListeners();

    try {
      final response = await http.post(
        Uri.parse('${AppConstants.baseUrl}/login'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'email': email,
          'password': password,
          'role': 'Student',
        }),
      ).timeout(const Duration(seconds: 10));

      if (response.statusCode == 200) {
        final cookies = response.headers['set-cookie'];
        if (cookies != null) {
          final token = RegExp(r'token=([^;]+)').firstMatch(cookies)?.group(1);
          if (token != null) {
            await _storage.write(key: AppConstants.tokenKey, value: token);
          }
        }

        final data = jsonDecode(response.body);
        _user = data['user'];
        _isAuthenticated = true;
        _isLoading = false;
        notifyListeners();
        return true;
      }
    } catch (e) {
      // Login failed
    }

    _isLoading = false;
    notifyListeners();
    return false;
  }

  Future<bool> register(Map<String, dynamic> studentData) async {
    _isLoading = true;
    notifyListeners();

    try {
      final response = await http.post(
        Uri.parse('${AppConstants.baseUrl}/register'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode(studentData),
      ).timeout(const Duration(seconds: 10));

      _isLoading = false;
      notifyListeners();
      return response.statusCode == 201;
    } catch (e) {
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  Future<void> logout() async {
    try {
      final token = await _storage.read(key: AppConstants.tokenKey);
      await http.get(
        Uri.parse('${AppConstants.baseUrl}/login/logout'),
        headers: {
          'Content-Type': 'application/json',
          'Cookie': 'token=$token',
        },
      );
    } catch (e) {
      // Logout failed
    }

    await _storage.deleteAll();
    _user = null;
    _isAuthenticated = false;
    notifyListeners();
  }
}
