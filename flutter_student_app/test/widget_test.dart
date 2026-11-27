import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:provider/provider.dart';
import 'package:the_spot_campus_student/services/auth_service.dart';
import 'package:the_spot_campus_student/services/api_service.dart';
import 'package:the_spot_campus_student/main.dart';

void main() {
  testWidgets('App smoke test', (WidgetTester tester) async {
    await tester.pumpWidget(
      MultiProvider(
        providers: [
          ChangeNotifierProvider(create: (_) => AuthService()),
          Provider(create: (_) => ApiService()),
        ],
        child: const SpotCampusApp(),
      ),
    );

    expect(find.byType(MaterialApp), findsOneWidget);
    // Advance clock past splash/auth timers so no pending timers remain on disposal
    await tester.pump(const Duration(seconds: 4));
  });
}
