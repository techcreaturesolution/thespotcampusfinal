import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:provider/provider.dart';
import 'package:the_spot_campus_student/models/academic_profile_models.dart';
import 'package:the_spot_campus_student/screens/academic_profile_screen.dart';
import 'package:the_spot_campus_student/services/academic_profile_service.dart';
import 'package:the_spot_campus_student/services/api_service.dart';
import 'package:the_spot_campus_student/services/auth_service.dart';

class _FakeAcademicProfileService extends AcademicProfileService {
  _FakeAcademicProfileService() : super(ApiService());

  @override
  AcademicProfileModel? get profile => AcademicProfileModel.fromJson({
        'student_id': 'stu-1',
        'student_name': 'Prachi Makwana',
        'student_email': 'prachi@example.com',
        'student_enrollment': '220170107001',
        'university': {'_id': 'u1', 'university_name': 'GTU'},
        'college': {'_id': 'c1', 'college_name': 'Alpha College'},
        'degree': {'_id': 'd1', 'degree_name': 'B.Tech'},
        'branch': {'_id': 'b1', 'branch_name': 'Computer Engineering'},
        'student_current_sem': '6',
        'student_total_backlog': '0',
        'academic_year': '2025-26',
        'academic_batch': '2022-2026',
        'academic_status': 'Active',
        'cgpa': 8.7,
        'isVerifiedByTPO': true,
      });

  @override
  AcademicCompletion? get completion => AcademicCompletion.fromJson({
        'completed_count': 9,
        'total_fields': 10,
        'percentage': 90,
        'missing_fields': [
          {'key': 'academic_history', 'label': 'Academic History'}
        ],
        'is_complete': false,
      });

  @override
  List<AcademicHistoryModel> get history => [];

  @override
  bool get isLoading => false;

  @override
  Future<void> loadAcademicProfile() async {}
}

void main() {
  test('AcademicProfileModel & AcademicCompletion parse JSON correctly', () {
    final profile = AcademicProfileModel.fromJson({
      'student_id': 'stu-1',
      'student_name': 'Test Student',
      'student_email': 'test@example.com',
      'student_enrollment': 'ENR123',
      'student_current_sem': '4',
      'student_total_backlog': '1',
      'academic_year': '2025-26',
      'academic_batch': '2023-2027',
      'academic_status': 'Active',
      'cgpa': 8.5,
      'isVerifiedByTPO': false,
    });

    expect(profile.studentEnrollment, 'ENR123');
    expect(profile.cgpa, 8.5);
    expect(profile.isVerifiedByTPO, false);

    final completion = AcademicCompletion.fromJson({
      'completed_count': 8,
      'total_fields': 10,
      'percentage': 80,
      'missing_fields': [
        {'key': 'academic_year', 'label': 'Academic Year'},
      ],
      'is_complete': false,
    });
    expect(completion.percentage, 80);
    expect(completion.missingFields.length, 1);
  });

  test('AcademicValidators enforce valid academic bounds', () {
    expect(AcademicValidators.validateSemester('6'), isNull);
    expect(AcademicValidators.validateSemester('20'), isNotNull);
    expect(AcademicValidators.validateCgpa('8.9'), isNull);
    expect(AcademicValidators.validateCgpa('11'), isNotNull);
    expect(AcademicValidators.validateAcademicYear('2025-26'), isNull);
    expect(AcademicValidators.validateAcademicYear('2025'), isNotNull);
    expect(AcademicValidators.validateYear('2021', minYear: 2022), isNotNull);
  });

  testWidgets('AcademicProfileScreen renders profile, completion, and empty history state',
      (WidgetTester tester) async {
    await tester.pumpWidget(
      MultiProvider(
        providers: [
          ChangeNotifierProvider(create: (_) => AuthService()),
          Provider(create: (_) => ApiService()),
          ChangeNotifierProvider<AcademicProfileService>(
            create: (_) => _FakeAcademicProfileService(),
          ),
        ],
        child: const MaterialApp(home: AcademicProfileScreen()),
      ),
    );

    await tester.pumpAndSettle();

    expect(find.text('Academic Profile'), findsOneWidget);
    expect(find.text('Prachi Makwana'), findsOneWidget);
    expect(find.text('90%'), findsOneWidget);
    expect(find.text('TPO Verified'), findsOneWidget);
    expect(find.text('Academic History'), findsWidgets);
  });
}
