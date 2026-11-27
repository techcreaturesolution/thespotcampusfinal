import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:provider/provider.dart';
import 'package:the_spot_campus_student/models/internship_models.dart';
import 'package:the_spot_campus_student/screens/internships_screen.dart';
import 'package:the_spot_campus_student/services/api_service.dart';
import 'package:the_spot_campus_student/services/internships_service.dart';

class _FakeApiService extends ApiService {
  @override
  Future<Map<String, dynamic>> get(String endpoint) async {
    return {'internships': []};
  }
}

void main() {
  test('InternshipModel parses JSON and InternshipValidators checks rules', () {
    final model = InternshipModel.fromJson({
      'id': 'i1',
      'student_id': 's1',
      'role_title': 'Cloud Intern',
      'organization_name': 'Nimbus Tech',
      'employment_type': 'Internship',
      'work_mode': 'Remote',
      'start_date': '2025-02-01T00:00:00.000Z',
      'currently_working': true,
      'company_website': 'https://nimbustech.example.com',
      'skills': [
        {'id': 'sk1', 'name': 'AWS', 'category': 'Cloud'}
      ],
      'projects': [
        {'id': 'p1', 'title': 'Cloud Monitor', 'status': 'Completed'}
      ],
    });

    expect(model.roleTitle, 'Cloud Intern');
    expect(model.currentlyWorking, true);
    expect(model.skills.length, 1);
    expect(model.projects.length, 1);
    expect(InternshipValidators.isSafeHttpUrl('javascript:alert(1)'), false);

    final badDate = InternshipValidators.validateForm(
      roleTitle: 'Intern',
      organizationName: 'Acme Corp',
      startDate: DateTime(2025, 6, 1),
      endDate: DateTime(2025, 1, 1),
      currentlyWorking: false,
      companyWebsite: 'https://acme.example.com',
    );
    expect(badDate, isNotNull);

    final currentOk = InternshipValidators.validateForm(
      roleTitle: 'Intern',
      organizationName: 'Acme Corp',
      startDate: DateTime(2025, 6, 1),
      endDate: null,
      currentlyWorking: true,
      companyWebsite: 'https://acme.example.com',
    );
    expect(currentOk, isNull);
  });

  testWidgets('InternshipsScreen renders empty state cleanly', (WidgetTester tester) async {
    final service = InternshipsService(_FakeApiService());
    await tester.pumpWidget(
      ChangeNotifierProvider<InternshipsService>.value(
        value: service,
        child: const MaterialApp(home: InternshipsScreen()),
      ),
    );
    await tester.pumpAndSettle();
    expect(find.text('No internship experiences added yet'), findsOneWidget);
  });
}
