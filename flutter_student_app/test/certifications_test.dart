import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:provider/provider.dart';
import 'package:the_spot_campus_student/models/certification_models.dart';
import 'package:the_spot_campus_student/screens/certifications_screen.dart';
import 'package:the_spot_campus_student/services/api_service.dart';
import 'package:the_spot_campus_student/services/certifications_service.dart';

class _FakeApiService extends ApiService {
  @override
  Future<Map<String, dynamic>> get(String endpoint) async {
    return {'certifications': []};
  }
}

void main() {
  test('CertificationModel parses fields and CertificationValidators validates rules', () {
    final model = CertificationModel.fromJson({
      'id': 'c1',
      'student_id': 's1',
      'title': 'AWS Developer Associate',
      'issuing_organization': 'Amazon Web Services',
      'category': 'Cloud & DevOps',
      'credential_id': 'AWS-100',
      'credential_url': 'https://aws.amazon.com/verify/100',
      'issue_date': '2025-01-01T00:00:00.000Z',
      'does_not_expire': true,
      'visibility': 'Public',
      'status': 'Active',
    });

    expect(model.title, 'AWS Developer Associate');
    expect(model.doesNotExpire, true);
    expect(CertificationValidators.isSafeHttpsCredentialUrl('https://credly.com/b/1'), true);
    expect(CertificationValidators.isSafeHttpsCredentialUrl('http://credly.com/b/1'), false);
    expect(CertificationValidators.isSafeHttpsCredentialUrl('javascript:alert(1)'), false);

    final badDate = CertificationValidators.validateForm(
      title: 'Valid Cert',
      issuingOrganization: 'Oracle',
      credentialId: 'ORC-1',
      credentialUrl: 'https://education.oracle.com/verify/1',
      issueDate: DateTime(2025, 6, 1),
      expiryDate: DateTime(2025, 1, 1),
      doesNotExpire: false,
      description: '',
    );
    expect(badDate, isNotNull);

    final neverExp = CertificationValidators.validateForm(
      title: 'Valid Cert',
      issuingOrganization: 'Oracle',
      credentialId: 'ORC-1',
      credentialUrl: 'https://education.oracle.com/verify/1',
      issueDate: DateTime(2025, 6, 1),
      expiryDate: DateTime(2025, 1, 1),
      doesNotExpire: true,
      description: '',
    );
    expect(neverExp, isNull);
  });

  testWidgets('CertificationsScreen renders empty state cleanly', (WidgetTester tester) async {
    final service = CertificationsService(_FakeApiService());
    await tester.pumpWidget(
      ChangeNotifierProvider<CertificationsService>.value(
        value: service,
        child: const MaterialApp(home: CertificationsScreen()),
      ),
    );
    await tester.pumpAndSettle();
    expect(find.text('No certifications added yet'), findsOneWidget);
  });
}
