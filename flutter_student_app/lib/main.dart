import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'services/auth_service.dart';
import 'services/api_service.dart';
import 'screens/splash_screen.dart';
import 'screens/login_screen.dart';
import 'screens/register_screen.dart';
import 'screens/home_screen.dart';
import 'screens/job_list_screen.dart';
import 'screens/job_detail_screen.dart';
import 'screens/exam_screen.dart';
import 'screens/my_applications_screen.dart';
import 'screens/profile_screen.dart';
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

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await dotenv.load(fileName: ".env");
  runApp(
    MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => AuthService()),
        Provider(create: (_) => ApiService()),
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
        '/register': (context) => const RegisterScreen(),
        '/home': (context) => const HomeScreen(),
        '/jobs': (context) => const JobListScreen(),
        '/my-applications': (context) => const MyApplicationsScreen(),
        '/profile': (context) => const ProfileScreen(),
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
