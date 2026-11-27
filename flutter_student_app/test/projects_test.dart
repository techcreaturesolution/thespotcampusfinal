import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:provider/provider.dart';
import 'package:the_spot_campus_student/models/project_models.dart';
import 'package:the_spot_campus_student/screens/projects_screen.dart';
import 'package:the_spot_campus_student/services/api_service.dart';
import 'package:the_spot_campus_student/services/projects_service.dart';

class _FakeProjectsService extends ProjectsService {
  _FakeProjectsService() : super(ApiService());

  @override
  List<ProjectModel> get projects => [
        ProjectModel.fromJson({
          'id': 'proj-1',
          'student_id': 'stu-1',
          'title': 'The Spot Campus App',
          'description': 'AI-proctored exam and campus placement platform.',
          'role': 'Lead Flutter Developer',
          'status': 'Completed',
          'visibility': 'Public',
          'is_ongoing': false,
          'team_size': 3,
          'repository_url': 'https://github.com/org/repo',
          'links': [
            {
              'id': 'lnk-1',
              'link_type': 'GITHUB_REPOSITORY',
              'label': 'GitHub Repository',
              'url': 'https://github.com/org/repo',
              'display_order': 0,
            },
          ],
          'skills': [
            {'id': 'sk-1', 'name': 'Flutter', 'category': 'Mobile'},
          ],
          'display_order': 0,
        }),
      ];

  @override
  bool get isLoading => false;

  @override
  Future<void> loadMyProjects({String status = ''}) async {}
}

void main() {
  test('ProjectModel parsing and ProjectValidators enforce safe URLs and text bounds', () {
    final model = ProjectModel.fromJson({
      'id': 'proj-1',
      'student_id': 'stu-1',
      'title': 'Campus App',
      'description': 'A complete mobile and web placement system.',
      'status': 'In Progress',
      'visibility': 'College Only',
      'is_ongoing': true,
      'skills': [
        {'id': 'sk-1', 'name': 'React', 'category': 'Frameworks'},
      ],
    });

    expect(model.title, 'Campus App');
    expect(model.isOngoing, true);
    expect(model.skills.first.name, 'React');

    expect(ProjectValidators.isSafeHttpUrl('https://github.com/org/repo'), true);
    expect(ProjectValidators.isSafeHttpUrl('javascript:alert(1)'), false);
    expect(ProjectValidators.validateTitle('A'), isNotNull);
    expect(ProjectValidators.validateDescription('short'), isNotNull);
    expect(ProjectValidators.validateOptionalUrl('javascript:alert(1)'), isNotNull);
    expect(ProjectValidators.validateProviderLink('GITHUB_REPOSITORY', 'https://github.com/org/repo'), isNull);
    expect(ProjectValidators.validateProviderLink('GITHUB_REPOSITORY', 'https://github.com.attacker.example/org/repo'), isNotNull);
    expect(ProjectValidators.validateProviderLink('LIVE_DEMO', 'javascript:alert(1)'), isNotNull);

    final link = ProjectLinkModel.fromJson({
      'id': 'lnk-1',
      'link_type': 'GITHUB_REPOSITORY',
      'label': 'GitHub Repository',
      'url': 'https://github.com/org/repo',
    });
    expect(link.linkType, 'GITHUB_REPOSITORY');
  });

  testWidgets('ProjectsScreen renders project cards, links, and skill chips', (WidgetTester tester) async {
    await tester.pumpWidget(
      MultiProvider(
        providers: [
          Provider(create: (_) => ApiService()),
          ChangeNotifierProvider<ProjectsService>(
            create: (_) => _FakeProjectsService(),
          ),
        ],
        child: const MaterialApp(home: ProjectsScreen()),
      ),
    );

    await tester.pumpAndSettle();

    expect(find.text('Projects Portfolio'), findsOneWidget);
    expect(find.text('The Spot Campus App'), findsOneWidget);
    expect(find.text('Flutter'), findsOneWidget);
    expect(find.text('Completed'), findsOneWidget);
    expect(find.text('GitHub Repository'), findsOneWidget);
  });
}
