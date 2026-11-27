import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:provider/provider.dart';
import 'package:the_spot_campus_student/models/resume_version_models.dart';
import 'package:the_spot_campus_student/screens/resume_versions_screen.dart';
import 'package:the_spot_campus_student/services/api_service.dart';
import 'package:the_spot_campus_student/services/resume_versions_service.dart';

class _FakeApiService extends ApiService {
  @override
  Future<Map<String, dynamic>> get(String endpoint) async {
    return {'resume_versions': [], 'templates': []};
  }
}

void main() {
  test('ResumeVersionModel parses canonical reference IDs and validators check name', () {
    final model = ResumeVersionModel.fromJson({
      'id': 'rv1',
      'student_id': 's1',
      'name': 'Data Science Resume',
      'target_role': 'ML Intern',
      'is_default': true,
      'selected_skill_ids': ['sk1', 'sk2'],
      'selected_project_ids': ['p1'],
      'selected_certification_ids': ['c1'],
      'selected_internship_ids': ['i1'],
      'selected_education_ids': ['e1'],
      'visibility': 'Private',
    });

    expect(model.name, 'Data Science Resume');
    expect(model.isDefault, true);
    expect(model.selectedSkillIds.length, 2);
    expect(model.selectedProjectIds, ['p1']);
    expect(ResumeVersionValidators.validateName('A'), isNotNull);
    expect(ResumeVersionValidators.validateName('Backend Resume'), isNull);
  });

  testWidgets('ResumeVersionsScreen renders empty state cleanly', (WidgetTester tester) async {
    final svc = ResumeVersionsService(_FakeApiService());
    await tester.pumpWidget(
      ChangeNotifierProvider<ResumeVersionsService>.value(
        value: svc,
        child: const MaterialApp(home: ResumeVersionsScreen()),
      ),
    );
    await tester.pumpAndSettle();
    expect(find.text('No resume versions created yet'), findsOneWidget);
  });
}
