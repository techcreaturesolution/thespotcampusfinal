import 'package:flutter/material.dart';
import 'package:dio/dio.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../utils/constants.dart';
import 'api_service.dart';

class AuthService extends ChangeNotifier {
  final _storage = const FlutterSecureStorage();
  late Dio _dio;
  
  Map<String, dynamic>? _user;
  bool _isLoading = false;
  bool _isAuthenticated = false;

  Map<String, dynamic>? get user => _user;
  bool get isLoading => _isLoading;
  bool get isAuthenticated => _isAuthenticated;
  String get userName => _user?['student_name'] ?? 'Student';
  String get userEmail => _user?['student_email'] ?? '';

  AuthService() {
    _dio = Dio(BaseOptions(
      baseUrl: AppConstants.baseUrl,
      connectTimeout: const Duration(seconds: 15),
      receiveTimeout: const Duration(seconds: 15),
      headers: {'Content-Type': 'application/json'},
    ));
  }

  Future<void> checkAuth() async {
    _isLoading = true;
    notifyListeners();

    try {
      final token = await _storage.read(key: AppConstants.tokenKey);
      if (token != null) {
        final response = await _dio.get(
          '/login/current-user',
          options: Options(headers: {'Cookie': 'token=$token'}),
        );
        
        if (response.statusCode == 200) {
          _user = response.data['user'];
          _isAuthenticated = true;
        } else {
          await _storage.deleteAll();
          _isAuthenticated = false;
        }
      }
    } catch (e) {
      _isAuthenticated = false;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<bool> login(String email, String password) async {
    _isLoading = true;
    notifyListeners();

    try {
      final response = await _dio.post(
        '/login',
        data: {
          'email': email,
          'password': password,
          'role': 'Student',
        },
      );

      if (response.statusCode == 200) {
        // Extract token from cookies
        final cookies = response.headers.map['set-cookie'];
        if (cookies != null && cookies.isNotEmpty) {
          for (var cookie in cookies) {
            final token = RegExp(r'token=([^;]+)').firstMatch(cookie)?.group(1);
            if (token != null) {
              await _storage.write(key: AppConstants.tokenKey, value: token);
              break;
            }
          }
        }

        _user = response.data['user'];
        _isAuthenticated = true;
        _isLoading = false;
        notifyListeners();
        return true;
      }
      return false;
    } on DioException catch (e) {
      _isLoading = false;
      notifyListeners();
      
      String message = 'Login failed';
      if (e.response?.data != null) {
         final data = e.response!.data;
         message = data is Map ? (data['error'] ?? data['message'] ?? message) : message;
      }
      throw ApiException(message, e.response?.statusCode);
    } catch (e) {
      _isLoading = false;
      notifyListeners();
      throw ApiException('An unexpected error occurred during login');
    }
  }

  Future<bool> register(Map<String, dynamic> studentData) async {
    _isLoading = true;
    notifyListeners();

    try {
      final response = await _dio.post('/register', data: studentData);
      
      _isLoading = false;
      notifyListeners();
      return response.statusCode == 201;
    } on DioException catch (e) {
      _isLoading = false;
      notifyListeners();
      
      String message = 'Registration failed';
      if (e.response?.data != null) {
         final data = e.response!.data;
         message = data is Map ? (data['error'] ?? data['message'] ?? message) : message;
      }
      throw ApiException(message, e.response?.statusCode);
    } catch (e) {
      _isLoading = false;
      notifyListeners();
      throw ApiException('An unexpected error occurred during registration');
    }
  }

  Future<void> logout() async {
    try {
      final token = await _storage.read(key: AppConstants.tokenKey);
      await _dio.get(
        '/login/logout',
        options: Options(headers: {'Cookie': 'token=$token'}),
      );
    } catch (e) {
      debugPrint('Logout error: $e');
    } finally {
      await _storage.deleteAll();
      _user = null;
      _isAuthenticated = false;
      notifyListeners();
    }
  }
}
