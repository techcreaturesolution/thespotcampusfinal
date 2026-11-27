import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:the_spot_campus_student/models/profile_policy_model.dart';
import 'package:the_spot_campus_student/widgets/profile_policy_card.dart';

void main() {
  test('ProfilePolicyStatusModel.fromJson parses validation, visibility, and publishability cleanly', () {
    final model = ProfilePolicyStatusModel.fromJson({
      'student_id': 'stu_1',
      'completeness_percentage': 85,
      'validation': {
        'valid': false,
        'publishable': false,
        'profile_state': 'INVALID',
        'errors': [
          {
            'level': 'FIELD',
            'section': 'academic_profile',
            'field': 'degree_id',
            'code': 'REQUIRED_FIELD',
            'message': 'Academic degree program is required.',
            'severity': 'ERROR',
            'action': {'mobile_route': '/academic-profile'},
          },
        ],
        'warnings': [
          {
            'level': 'SECTION',
            'section': 'projects',
            'code': 'MISSING_RECOMMENDATION',
            'message': 'Add at least 1 project.',
            'severity': 'WARNING',
            'action': {'mobile_route': '/projects'},
          },
        ],
      },
      'visibility': {
        'profile_visibility': 'Private',
        'is_published': false,
        'visibility_override': 'NONE',
        'visibility_override_reason': '',
        'requires_republish_review': false,
      },
    });

    expect(model.valid, false);
    expect(model.publishable, false);
    expect(model.profileState, 'INVALID');
    expect(model.profileVisibility, 'Private');
    expect(model.errors.length, 1);
    expect(model.errors.first.code, 'REQUIRED_FIELD');
    expect(model.errors.first.mobileRoute, '/academic-profile');
    expect(model.warnings.length, 1);
  });

  testWidgets('ProfilePolicyCard renders validation errors, warnings, and visibility choices',
      (WidgetTester tester) async {
    final model = ProfilePolicyStatusModel.fromJson({
      'student_id': 'stu_1',
      'completeness_percentage': 100,
      'validation': {
        'valid': false,
        'publishable': false,
        'profile_state': 'INVALID',
        'errors': [
          {
            'level': 'SECTION',
            'section': 'technical_skills',
            'code': 'REQUIRED_FIELD',
            'message': 'Add at least 1 technical skill before publishing.',
            'severity': 'ERROR',
            'action': {'mobile_route': '/skills'},
          },
        ],
        'warnings': [],
      },
      'visibility': {
        'profile_visibility': 'Private',
        'is_published': false,
        'visibility_override': 'NONE',
      },
    });

    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(
          body: SingleChildScrollView(
            child: ProfilePolicyCard(
              policy: model,
              isLoading: false,
              isMutating: false,
              errorMessage: null,
              onRefresh: () {},
              onChangeVisibility: (_) async {},
            ),
          ),
        ),
      ),
    );

    expect(find.text('INVALID'), findsOneWidget);
    expect(find.text('Blocking Errors (1)'), findsOneWidget);
    expect(find.text('Private'), findsOneWidget);
    expect(find.text('Institute Only'), findsOneWidget);
    expect(find.text('Public'), findsOneWidget);
  });
}
