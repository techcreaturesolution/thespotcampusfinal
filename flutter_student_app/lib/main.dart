import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'services/auth_service.dart';
import 'services/api_service.dart';
import 'services/academic_profile_service.dart';
import 'services/technical_skills_service.dart';
import 'services/projects_service.dart';
import 'services/certifications_service.dart';
import 'services/internships_service.dart';
import 'services/resume_versions_service.dart';
import 'services/documents_service.dart';
import 'services/profile_completeness_service.dart';
import 'services/profile_policy_service.dart';
import 'screens/splash_screen.dart';
import 'screens/login_screen.dart';
import 'screens/register_screen.dart';
import 'screens/home_screen.dart';
import 'screens/job_list_screen.dart';
import 'screens/job_detail_screen.dart';
import 'screens/exam_screen.dart';
import 'screens/my_applications_screen.dart';
import 'screens/profile_screen.dart';
import 'screens/academic_profile_screen.dart';
import 'screens/technical_skills_screen.dart';
import 'screens/projects_screen.dart';
import 'screens/certifications_screen.dart';
import 'screens/internships_screen.dart';
import 'screens/resume_versions_screen.dart';
import 'screens/documents_screen.dart';
import 'screens/interview_list_screen.dart';
import 'screens/plans_screen.dart';
import 'screens/preparation/preparation_dashboard_screen.dart';
import 'screens/preparation/mock_tests_screen.dart';
import 'screens/preparation/subject_practice_screen.dart';
import 'screens/preparation/daily_challenge_screen.dart';
import 'screens/preparation/performance_screen.dart';
import 'screens/preparation/reading_material_screen.dart';
import 'screens/preparation/previous_papers_screen.dart';
import 'screens/preparation/take_test_screen.dart';
import 'screens/preparation/test_result_screen.dart';
import 'screens/preparation/practice_screen.dart';
import 'screens/preparation/pdf_viewer_screen.dart';
import 'screens/resume_builder_screen.dart';
import 'screens/resume_preview_screen.dart';
import 'screens/bookmarks_screen.dart';
import 'screens/forgot_password_screen.dart';
import 'screens/job_finder/market_job_finder_screen.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await dotenv.load(fileName: ".env");
  runApp(
    MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => AuthService()),
        Provider(create: (_) => ApiService()),
        ChangeNotifierProvider(
          create: (context) => AcademicProfileService(context.read<ApiService>()),
        ),
        ChangeNotifierProvider(
          create: (context) => TechnicalSkillsService(context.read<ApiService>()),
        ),
        ChangeNotifierProvider(
          create: (context) => ProjectsService(context.read<ApiService>()),
        ),
        ChangeNotifierProvider(
          create: (context) => CertificationsService(context.read<ApiService>()),
        ),
        ChangeNotifierProvider(
          create: (context) => InternshipsService(context.read<ApiService>()),
        ),
        ChangeNotifierProvider(
          create: (context) => ResumeVersionsService(context.read<ApiService>()),
        ),
        ChangeNotifierProvider(
          create: (context) => DocumentsService(context.read<ApiService>()),
        ),
        ChangeNotifierProvider(
          create: (context) => ProfileCompletenessService(context.read<ApiService>()),
        ),
        ChangeNotifierProvider(
          create: (context) => ProfilePolicyService(context.read<ApiService>()),
        ),
      ],
      child: const SpotCampusApp(),
    ),
  );
}

class SpotCampusApp extends StatelessWidget {
  const SpotCampusApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'The Spot Campus',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        useMaterial3: true,
        colorSchemeSeed: const Color(0xFF2563EB),
        brightness: Brightness.light,
        textTheme: GoogleFonts.outfitTextTheme(),
        appBarTheme: const AppBarTheme(
          centerTitle: true,
          elevation: 0,
        ),
        cardTheme: CardThemeData(
          elevation: 0,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(16),
            side: BorderSide(color: Colors.grey.shade200),
          ),
        ),
        inputDecorationTheme: InputDecorationTheme(
          filled: true,
          fillColor: Colors.grey.shade50,
          border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(12),
            borderSide: BorderSide(color: Colors.grey.shade300),
          ),
          enabledBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(12),
            borderSide: BorderSide(color: Colors.grey.shade300),
          ),
          focusedBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(12),
            borderSide: const BorderSide(color: Color(0xFF2563EB), width: 2),
          ),
          contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        ),
        elevatedButtonTheme: ElevatedButtonThemeData(
          style: ElevatedButton.styleFrom(
            backgroundColor: const Color(0xFF2563EB),
            foregroundColor: Colors.white,
            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(12),
            ),
            textStyle: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
          ),
        ),
      ),
      initialRoute: '/',
      routes: {
        '/': (context) => const SplashScreen(),
        '/login': (context) => const LoginScreen(),
        '/forgot-password': (context) => const ForgotPasswordScreen(),
        '/register': (context) => const RegisterScreen(),
        '/home': (context) => const HomeScreen(),
        '/jobs': (context) => const JobListScreen(),
        '/my-applications': (context) => const MyApplicationsScreen(),
        '/profile': (context) => const ProfileScreen(),
        '/academic-profile': (context) => const AcademicProfileScreen(),
        '/skills': (context) => const TechnicalSkillsScreen(),
        '/projects': (context) => const ProjectsScreen(),
        '/certifications': (context) => const CertificationsScreen(),
        '/internships': (context) => const InternshipsScreen(),
        '/resume-versions': (context) => const ResumeVersionsScreen(),
        '/documents': (context) => const DocumentsScreen(),
        '/interviews': (context) => const InterviewListScreen(),
        '/plans': (context) => const PlansScreen(),
        '/preparation': (context) => const PreparationDashboardScreen(),
        '/preparation/mock-tests': (context) => const MockTestsScreen(),
        '/preparation/subjects': (context) => const SubjectPracticeScreen(),
        '/preparation/daily-challenge': (context) => const DailyChallengeScreen(),
        '/preparation/performance': (context) => const PerformanceScreen(),
        '/preparation/reading': (context) => const ReadingMaterialScreen(),
        '/preparation/previous-papers': (context) => const PreviousPapersScreen(),
        '/resume': (context) => const ResumeBuilderScreen(),
        '/resume-preview': (context) => const ResumePreviewScreen(),
        '/bookmarks': (context) => const BookmarksScreen(),
        '/market-job-finder': (context) => const MarketJobFinderScreen(),
      },
      onGenerateRoute: (settings) {
        if (settings.name == '/job-detail') {
          final jobId = settings.arguments as String;
          return MaterialPageRoute(
            builder: (context) => JobDetailScreen(jobId: jobId),
          );
        }
        if (settings.name == '/exam') {
          final examId = settings.arguments as String;
          return MaterialPageRoute(
            builder: (context) => ExamScreen(examId: examId),
          );
        }
        if (settings.name == '/preparation/take-test') {
          return MaterialPageRoute(
            builder: (context) => const TakeTestScreen(),
            settings: settings,
          );
        }
        if (settings.name == '/preparation/test-result') {
          return MaterialPageRoute(
            builder: (context) => const TestResultScreen(),
            settings: settings,
          );
        }
        if (settings.name == '/preparation/practice') {
          return MaterialPageRoute(
            builder: (context) => const PracticeScreen(),
            settings: settings,
          );
        }
        if (settings.name == '/preparation/pdf-viewer') {
          return MaterialPageRoute(
            builder: (context) => const PdfViewerScreen(),
            settings: settings,
          );
        }
        return null;
      },
    );
  }
}
