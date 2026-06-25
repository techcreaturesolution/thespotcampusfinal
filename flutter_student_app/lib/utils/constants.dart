import 'package:flutter/material.dart';

class AppConstants {
  static const String appName = 'The Spot Campus';
  //static const String baseUrl = 'http://localhost:5000/api';

  // Render URL (Production - running old code)
  // static const String baseUrl = 'https://thespotcampus.onrender.com/api';
  static const String baseUrl = 'https://thespotcampusfinal.onrender.com/api';

  static const String tokenKey = 'auth_token';
  static const String roleKey = 'user_role';
  static const String userIdKey = 'user_id';
}

class AppColors {
  static const int primaryValue = 0xFF2563EB;
  static const int secondaryValue = 0xFF4F46E5;
  static const int successValue = 0xFF059669;
  static const int warningValue = 0xFFD97706;
  static const int dangerValue = 0xFFDC2626;
}

class AppStyles {
  // Deep vibrant mesh gradient for glassmorphism background
  static const BoxDecoration glassmorphismBackground = BoxDecoration(
    gradient: LinearGradient(
      begin: Alignment.topLeft,
      end: Alignment.bottomRight,
      colors: [
        Color(0xFF0F172A), // Deep Slate
        Color(0xFF312E81), // Deep Indigo
        Color(0xFF4C1D95), // Deep Purple
        Color(0xFF0F172A), // Back to Slate
      ],
      stops: [0.0, 0.4, 0.7, 1.0],
    ),
  );

  // Alternative bright background if light theme is preferred
  static const BoxDecoration lightGlassBackground = BoxDecoration(
    gradient: LinearGradient(
      begin: Alignment.topLeft,
      end: Alignment.bottomRight,
      colors: [
        Color(0xFFE0E7FF),
        Color(0xFFF3E8FF),
        Color(0xFFCFFAFE),
      ],
    ),
  );
}
