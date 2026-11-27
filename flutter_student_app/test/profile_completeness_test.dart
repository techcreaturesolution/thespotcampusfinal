import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:the_spot_campus_student/models/profile_completeness_model.dart';
import 'package:the_spot_campus_student/widgets/profile_completeness_card.dart';

void main() {
  test('ProfileCompletenessModel.fromJson parses full completeness payload cleanly', () {
    final model = ProfileCompletenessModel.fromJson({
      'formula_version': 'S1-10.v1',
      'target_role': 'Student',
      'percentage': 75,
      'raw_percentage': 75.0,
      'earned_weight': 75.0,
      'applicable_weight': 100.0,
      'is_complete': false,
      'status_band': 'STRONG',
      'status_label': 'Strong',
      'completed_sections': 3,
      'total_applicable_sections': 5,
      'sections': [
        {
          'key': 'basic_identity',
          'title': 'Basic Identity & Contact',
          'feature_refs': ['S1-01'],
          'weight': 15,
          'earned_weight': 15,
          'percentage': 100,
          'applicable': true,
          'required': true,
          'is_optional': false,
          'is_complete': true,
          'status': 'Complete',
          'completed_items': 3,
          'total_items': 3,
          'criteria_summary': 'Name, email, contact',
          'action': {
            'label': 'Update Profile',
            'web_path': '/dashboard/student/profile',
            'mobile_route': '/profile',
          },
        },
      ],
      'missing_items': [
        {
          'section_key': 'projects',
          'key': 'project_minimum',
          'label': 'Add at least 1 academic or personal project',
          'action': {
            'label': 'Manage Projects',
            'web_path': '/dashboard/student/projects',
            'mobile_route': '/projects',
          },
        },
      ],
      'recommendations': [],
    });

    expect(model.percentage, 75);
    expect(model.statusBand, 'STRONG');
    expect(model.completedSections, 3);
    expect(model.sections.length, 1);
    expect(model.sections.first.isComplete, true);
    expect(model.missingItems.first.action.mobileRoute, '/projects');
  });

  testWidgets('ProfileCompletenessCard displays percentage, sections, and missing chips',
      (WidgetTester tester) async {
    final model = ProfileCompletenessModel.fromJson({
      'formula_version': 'S1-10.v1',
      'target_role': 'Student',
      'percentage': 60,
      'raw_percentage': 60.0,
      'earned_weight': 60.0,
      'applicable_weight': 100.0,
      'is_complete': false,
      'status_band': 'IN_PROGRESS',
      'status_label': 'In Progress',
      'completed_sections': 2,
      'total_applicable_sections': 5,
      'sections': [
        {
          'key': 'technical_skills',
          'title': 'Technical Skills & Proficiency',
          'feature_refs': ['S1-02', 'S1-03'],
          'weight': 20,
          'earned_weight': 10,
          'percentage': 50,
          'applicable': true,
          'required': true,
          'is_optional': false,
          'is_complete': false,
          'status': 'In Progress',
          'completed_items': 1,
          'total_items': 2,
          'criteria_summary': '3 skills with proficiency',
          'action': {
            'label': 'Manage Technical Skills',
            'web_path': '/dashboard/student/skills',
            'mobile_route': '/skills',
          },
        },
      ],
      'missing_items': [
        {
          'section_key': 'technical_skills',
          'key': 'skills_breadth',
          'label': 'Add 2 more technical skills',
          'action': {
            'label': 'Manage Technical Skills',
            'web_path': '/dashboard/student/skills',
            'mobile_route': '/skills',
          },
        },
      ],
      'recommendations': [],
    });

    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(
          body: SingleChildScrollView(
            child: ProfileCompletenessCard(
              completeness: model,
              isLoading: false,
              errorMessage: null,
              onRefresh: () {},
            ),
          ),
        ),
      ),
    );

    expect(find.text('60%'), findsOneWidget);
    expect(find.text('Technical Skills & Proficiency'), findsOneWidget);
    expect(find.text('Add 2 more technical skills'), findsOneWidget);
  });
}
