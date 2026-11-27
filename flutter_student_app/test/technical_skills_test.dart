import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:provider/provider.dart';
import 'package:the_spot_campus_student/models/technical_skill_models.dart';
import 'package:the_spot_campus_student/screens/technical_skills_screen.dart';
import 'package:the_spot_campus_student/services/api_service.dart';
import 'package:the_spot_campus_student/services/auth_service.dart';
import 'package:the_spot_campus_student/services/technical_skills_service.dart';

class _FakeTechnicalSkillsService extends TechnicalSkillsService {
  _FakeTechnicalSkillsService() : super(ApiService());

  @override
  List<StudentSkillModel> get skills => [
        StudentSkillModel.fromJson({
          'id': 'us-1',
          'student_id': 'stu-1',
          'skill': {
            'id': 'sk-1',
            'name': 'Flutter',
            'category': 'Mobile',
            'is_active': true,
          },
          'proficiency': 'Advanced',
          'proficiency_order': 3,
          'years_of_experience': 2.0,
          'display_order': 0,
        }),
      ];

  @override
  bool get isLoading => false;

  @override
  Future<void> loadMySkills() async {}
}

void main() {
  test('SkillMasterModel and StudentSkillModel parse JSON and validate bounds', () {
    final master = SkillMasterModel.fromJson({
      'id': 'sk-1',
      'name': 'JavaScript',
      'normalized_name': 'javascript',
      'category': 'Programming Languages',
      'is_active': true,
    });
    expect(master.name, 'JavaScript');
    expect(master.isActive, true);

    final assoc = StudentSkillModel.fromJson({
      'id': 'us-1',
      'student_id': 'stu-1',
      'skill': {
        'id': 'sk-1',
        'name': 'JavaScript',
        'category': 'Programming Languages',
        'is_active': true,
      },
      'proficiency': 'Intermediate',
      'proficiency_order': 2,
      'display_order': 0,
    });
    expect(assoc.skill.name, 'JavaScript');
    expect(assoc.proficiency, 'Intermediate');

    expect(SkillValidators.validateProficiency('Advanced'), isNull);
    expect(SkillValidators.validateProficiency('Unknown'), isNotNull);
    expect(SkillValidators.orderForProficiency('Expert'), 4);
    expect(SkillValidators.validateYears('3.5'), isNull);
    expect(SkillValidators.validateYears('80'), isNotNull);

    final profLevel = ProficiencyLevelModel.fromJson({
      'code': 'ADVANCED',
      'name': 'Advanced',
      'order': 3,
      'description': 'Deep proficiency',
      'is_active': true,
    });
    expect(profLevel.order, 3);
  });

  testWidgets('TechnicalSkillsScreen renders student skills and proficiency badges',
      (WidgetTester tester) async {
    await tester.pumpWidget(
      MultiProvider(
        providers: [
          ChangeNotifierProvider(create: (_) => AuthService()),
          Provider(create: (_) => ApiService()),
          ChangeNotifierProvider<TechnicalSkillsService>(
            create: (_) => _FakeTechnicalSkillsService(),
          ),
        ],
        child: const MaterialApp(home: TechnicalSkillsScreen()),
      ),
    );

    await tester.pumpAndSettle();

    expect(find.text('Technical Skills'), findsOneWidget);
    expect(find.text('Flutter'), findsOneWidget);
    expect(find.text('Mobile'), findsOneWidget);
    expect(find.text('Advanced (L3/4)'), findsOneWidget);
  });
}
