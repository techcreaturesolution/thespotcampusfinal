import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../services/auth_service.dart';
import '../services/api_service.dart';

// ═══════════════════════════════════════════════════════════════════════════════
// HOME SCREEN
// ═══════════════════════════════════════════════════════════════════════════════

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> with TickerProviderStateMixin {
  // ── State (unchanged) ──────────────────────────────────────────────────────
  int _currentIndex = 0;
  int _streakDays = 0;
  List<dynamic> _jobs = [];
  List<dynamic> _applications = [];
  List<dynamic> _interviews = [];
  List<Map<String, dynamic>> _prepAnalytics = [
    {'label': 'Loading...', 'value': 0.0, 'color': const Color(0xFF4F46E5)},
    {'label': 'Loading...', 'value': 0.0, 'color': const Color(0xFF2563EB)},
  ];
  Map<String, dynamic>? _studentProgress;
  List<dynamic> _recentActivity = [];
  bool _isLoading = true;

  // ── Animation controllers ──────────────────────────────────────────────────
  late AnimationController _progressAnimController;

  // ── Design tokens ──────────────────────────────────────────────────────────
  static const Color _primary = Color(0xFF2563EB);
  static const Color _secondary = Color(0xFF4F46E5);
  static const Color _success = Color(0xFF10B981);
  static const Color _warning = Color(0xFFF59E0B);
  static const Color _danger = Color(0xFFEF4444);
  static const Color _bg = Color(0xFFF8FAFC);
  static const Color _surface = Color(0xFFFFFFFF);
  static const Color _text1 = Color(0xFF111827);
  static const Color _text2 = Color(0xFF6B7280);

  // ═══════════════════════════════════════════════════════════════════════════
  // LIFECYCLE
  // ═══════════════════════════════════════════════════════════════════════════

  @override
  void initState() {
    super.initState();
    _fetchDashboardData();
    _fetchPrepAnalytics();
    _calculateStreak();
    _progressAnimController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1600),
    );
    Future.delayed(const Duration(milliseconds: 700), () {
      if (mounted) _progressAnimController.forward();
    });
  }

  @override
  void dispose() {
    _progressAnimController.dispose();
    super.dispose();
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // BUSINESS LOGIC
  // ═══════════════════════════════════════════════════════════════════════════

  Future<void> _calculateStreak() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final now = DateTime.now();
      final todayStr = DateFormat('yyyy-MM-dd').format(now);
      
      final lastOpened = prefs.getString('last_opened_date');
      int currentStreak = prefs.getInt('streak_count') ?? 1;

      if (lastOpened != null) {
        if (lastOpened != todayStr) {
          final lastDate = DateFormat('yyyy-MM-dd').parse(lastOpened);
          final todayDate = DateFormat('yyyy-MM-dd').parse(todayStr);
          final difference = todayDate.difference(lastDate).inDays;
          
          if (difference == 1) {
            currentStreak++;
          } else if (difference > 1) {
            currentStreak = 1;
          }
          
          await prefs.setString('last_opened_date', todayStr);
          await prefs.setInt('streak_count', currentStreak);
        }
      } else {
        await prefs.setString('last_opened_date', todayStr);
        await prefs.setInt('streak_count', 1);
        currentStreak = 1;
      }
      
      if (mounted) {
        setState(() {
          _streakDays = currentStreak;
        });
      }
    } catch (e) {
      debugPrint('Error calculating streak: $e');
    }
  }

  Future<void> _fetchDashboardData() async {
    _fetchPrepAnalytics(); // Refresh analytics when dashboard refreshes
    try {
      final api = Provider.of<ApiService>(context, listen: false);
      final results = await Future.wait([
        api.get('/jobs/student'),
        api.get('/application/student'),
        api.get('/interviews/student'),
        api.get('/preparation/progress'),
        api.get('/preparation/progress/activity'),
      ]);
      setState(() {
        _jobs = results[0]['jobs'] ?? [];
        _applications = results[1]['applications'] ?? [];
        _interviews = results[2]['interviews'] ?? [];
        _studentProgress = results[3]['progress'];
        _recentActivity = (results[4]['activities'] ?? []).cast<dynamic>();
        _isLoading = false;
      });
    } catch (e) {
      setState(() => _isLoading = false);
    }
  }

  Future<void> _fetchPrepAnalytics() async {
    try {
      final api = Provider.of<ApiService>(context, listen: false);
      final data = await api.get('/preparation/progress/subjects');
      if (mounted && data['subject_progress'] != null) {
        final List sp = data['subject_progress'];
        final colors = [
          const Color(0xFF4F46E5),
          const Color(0xFF2563EB),
          const Color(0xFF7C3AED),
          const Color(0xFF10B981)
        ];
        
        if (sp.isEmpty) {
          setState(() {
            _prepAnalytics = [
              {'label': 'No Subjects', 'value': 0.0, 'color': const Color(0xFF4F46E5)},
            ];
          });
          return;
        }

        final List<Map<String, dynamic>> loaded = [];
        for (int i = 0; i < sp.length && i < 4; i++) {
          loaded.add({
            'label': sp[i]['subject_name'] ?? 'Subject',
            'value': (sp[i]['accuracy'] ?? 0) / 100.0,
            'color': colors[i % colors.length],
          });
        }
        setState(() {
          _prepAnalytics = loaded;
        });
      }
    } catch (e) {
      // Ignored, defaults will show
      if (mounted) {
        setState(() {
          _prepAnalytics = [
            {'label': 'Error loading', 'value': 0.0, 'color': const Color(0xFFEF4444)},
          ];
        });
      }
    }
  }

  int _calculateProfileCompleteness(Map<String, dynamic>? user) {
    if (user == null) return 0;
    int filledFields = 0;
    const int totalFields = 8;
    if (user['student_name'] != null &&
        user['student_name'].toString().isNotEmpty) filledFields++;
    if (user['student_email'] != null &&
        user['student_email'].toString().isNotEmpty) filledFields++;
    if (user['student_contact'] != null &&
        user['student_contact'].toString().isNotEmpty) filledFields++;
    if (user['student_enrollment'] != null &&
        user['student_enrollment'].toString().isNotEmpty) filledFields++;
    if (user['student_skills'] != null &&
        user['student_skills'].toString().isNotEmpty) filledFields++;
    if (user['student_current_sem'] != null &&
        user['student_current_sem'].toString().isNotEmpty) filledFields++;
    if (user['branch_id'] != null) filledFields++;
    if (user['degree_id'] != null) filledFields++;
    return ((filledFields / totalFields) * 100).toInt();
  }

  Map<String, dynamic>? _getUpcomingInterview() {
    final scheduled = _interviews
        .where(
            (i) => i['status'] == 'scheduled' || i['status'] == 'in_progress')
        .toList();
    if (scheduled.isEmpty) return null;
    try {
      scheduled.sort((a, b) {
        final aTime = DateTime.parse(a['scheduled_at'] ?? '');
        final bTime = DateTime.parse(b['scheduled_at'] ?? '');
        return aTime.compareTo(bTime);
      });
    } catch (_) {}
    return scheduled.first;
  }

  Future<void> _applyForJob(String jobId) async {
    try {
      final api = Provider.of<ApiService>(context, listen: false);
      await api.post('/application/$jobId', {});
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
            content: Text('Applied successfully!'),
            backgroundColor: Colors.green),
      );
      _fetchDashboardData();
    } catch (e) {
      if (!mounted) return;
      final errorStr = e.toString().toLowerCase();
      if (errorStr.contains('subscription') || errorStr.contains('payment')) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text(
                'An active subscription plan is required to apply. Redirecting to plans...'),
            backgroundColor: Colors.orange,
          ),
        );
        Future.delayed(const Duration(seconds: 1), () {
          if (mounted) Navigator.pushNamed(context, '/plans');
        });
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content:
                Text('Failed: ${e.toString().replaceAll('Exception: ', '')}'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }

  String _formatInterviewTime(String? scheduledAtStr) {
    if (scheduledAtStr == null) return '-';
    try {
      final dateTime = DateTime.parse(scheduledAtStr).toLocal();
      return DateFormat('MMM dd, hh:mm a').format(dateTime);
    } catch (_) {
      return '-';
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // HELPERS
  // ═══════════════════════════════════════════════════════════════════════════

  String _greeting() {
    final h = DateTime.now().hour;
    if (h < 12) return 'Good Morning';
    if (h < 17) return 'Good Afternoon';
    if (h < 21) return 'Good Evening';
    return 'Good Night';
  }

  String _greetingEmoji() {
    final h = DateTime.now().hour;
    if (h < 12) return '🌅';
    if (h < 17) return '☀️';
    if (h < 21) return '🌆';
    return '🌙';
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // BUILD
  // ═══════════════════════════════════════════════════════════════════════════

  @override
  Widget build(BuildContext context) {
    final auth = Provider.of<AuthService>(context);
    final user = auth.user;
    final completeness = _calculateProfileCompleteness(user);
    final upcomingInterview = _getUpcomingInterview();
    final scheduledCount = _interviews
        .where(
            (i) => i['status'] == 'scheduled' || i['status'] == 'in_progress')
        .length;

    return Scaffold(
      backgroundColor: _bg,
      body: Stack(
        children: [
          _isLoading
              ? _buildSkeleton()
              : _buildBody(
                  auth, user, completeness, upcomingInterview, scheduledCount),
          Positioned(
            left: 0,
            right: 0,
            bottom: 0,
            child: _buildFloatingNav(),
          ),
        ],
      ),
    );
  }

  // ── Shimmer skeleton ───────────────────────────────────────────────────────
  Widget _buildSkeleton() {
    return SafeArea(
      child: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            _ShimmerBox(height: 64, radius: 0, margin: EdgeInsets.zero),
            const SizedBox(height: 16),
            _ShimmerBox(height: 140, radius: 24, margin: EdgeInsets.zero),
            const SizedBox(height: 20),
            _ShimmerBox(height: 110, radius: 16, margin: EdgeInsets.zero),
            const SizedBox(height: 20),
            _ShimmerBox(height: 160, radius: 16, margin: EdgeInsets.zero),
            const SizedBox(height: 20),
            _ShimmerBox(height: 120, radius: 16, margin: EdgeInsets.zero),
          ],
        ),
      ),
    );
  }

  // ── Main body ──────────────────────────────────────────────────────────────
  Widget _buildBody(
    AuthService auth,
    Map<String, dynamic>? user,
    int completeness,
    Map<String, dynamic>? upcomingInterview,
    int scheduledCount,
  ) {
    return RefreshIndicator(
      onRefresh: _fetchDashboardData,
      color: _primary,
      child: CustomScrollView(
        physics: const AlwaysScrollableScrollPhysics(),
        slivers: [
          SliverToBoxAdapter(
            child: Stack(
              children: [
                // Top Blue curved background
                Container(
                  height: 240,
                  decoration: const BoxDecoration(
                    gradient: LinearGradient(
                      colors: [Color(0xFF2563EB), Color(0xFF4F46E5)],
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                    ),
                    borderRadius: BorderRadius.only(
                      bottomLeft: Radius.circular(30),
                      bottomRight: Radius.circular(30),
                    ),
                  ),
                ),
                Column(
                  children: [
                    _buildHeader(auth),
                    Padding(
                      padding: const EdgeInsets.fromLTRB(16, 20, 16, 0),
                      child: _buildHeroCard(auth, completeness, _studentProgress?['overall_accuracy'] ?? 0),
                    ),
                  ],
                ),
              ],
            ),
          ),
          SliverToBoxAdapter(child: _buildTodaysFocus()),
          SliverToBoxAdapter(child: _buildQuickActions()),
          SliverToBoxAdapter(child: _buildPrepInsights()),
          SliverToBoxAdapter(child: _buildSubjectPerformance()),
          SliverToBoxAdapter(child: _buildDailyChallengeAndJobs()),
          SliverToBoxAdapter(child: _buildInterviewAndRecentActivity(upcomingInterview)),
          const SliverToBoxAdapter(child: SizedBox(height: 120)),
        ],
      ),
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SECTION WIDGETS
  // ═══════════════════════════════════════════════════════════════════════════

  String _getGreeting() {
    final hour = DateTime.now().hour;
    if (hour < 12) {
      return 'Good Morning,';
    } else if (hour < 17) {
      return 'Good Afternoon,';
    } else {
      return 'Good Evening,';
    }
  }

  // ── 1. HEADER ──────────────────────────────────────────────────────────────
  Widget _buildHeader(AuthService auth) {
    return Padding(
      padding: EdgeInsets.fromLTRB(
          16, MediaQuery.of(context).padding.top + 10, 16, 14),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    _getGreeting(),
                    style: TextStyle(
                        color: Colors.white.withOpacity(0.9),
                        fontSize: 14,
                        fontWeight: FontWeight.w500),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    '${auth.userName.isNotEmpty ? auth.userName : 'Student'} 👋',
                    style: const TextStyle(
                        color: Colors.white,
                        fontSize: 22,
                        fontWeight: FontWeight.bold),
                  ),
                ],
              ),
              Row(
                children: [
                  // Notification bell
                  Stack(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(8),
                        decoration: BoxDecoration(
                          color: Colors.white.withOpacity(0.2),
                          shape: BoxShape.circle,
                          border: Border.all(color: Colors.white.withOpacity(0.5)),
                        ),
                        child: const Icon(Icons.notifications_outlined, color: Colors.white, size: 20),
                      ),
                      Positioned(
                        right: 0,
                        top: 0,
                        child: Container(
                          width: 8,
                          height: 8,
                          decoration: BoxDecoration(
                            color: Colors.red,
                            shape: BoxShape.circle,
                            border: Border.all(color: Colors.white, width: 1.5),
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(width: 12),
                  // Avatar
                  GestureDetector(
                    onTap: () => Navigator.pushNamed(context, '/profile'),
                    child: CircleAvatar(
                      radius: 20,
                      backgroundColor: Colors.white,
                      child: Text(
                        auth.userName.isNotEmpty ? auth.userName[0].toUpperCase() : 'S',
                        style: const TextStyle(color: _primary, fontWeight: FontWeight.bold),
                      ),
                    ),
                  ),
                ],
              ),
            ],
          ),
          const SizedBox(height: 16),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Expanded(
                child: Text(
                  '❝ Discipline today, success tomorrow.\n    You\'ve got this! ❞',
                  style: TextStyle(
                      color: Colors.white70,
                      fontSize: 12,
                      fontStyle: FontStyle.italic),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildHeroCard(AuthService auth, int completeness, int prepScore) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        boxShadow: [
          BoxShadow(
              color: Colors.black.withOpacity(0.08),
              blurRadius: 20,
              offset: const Offset(0, 10)),
        ],
      ),
      child: Column(
        children: [
          Row(
            children: [
              // Left: Circular Progress
              SizedBox(
                width: 100,
                height: 100,
                child: Stack(
                  fit: StackFit.expand,
                  children: [
                    CircularProgressIndicator(
                      value: prepScore / 100.0,
                      strokeWidth: 8,
                      backgroundColor: Colors.grey.shade100,
                      valueColor: const AlwaysStoppedAnimation<Color>(_primary),
                    ),
                    Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Text('$prepScore%', style: const TextStyle(fontSize: 26, fontWeight: FontWeight.w900, color: _text1, height: 1.0)),
                        const SizedBox(height: 4),
                        Text('Preparation\nScore', textAlign: TextAlign.center, style: TextStyle(fontSize: 9, color: Colors.grey.shade500, height: 1.1)),
                      ],
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 20),
              // Right: Profile + Stats
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Profile complete
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text('Profile Complete', style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: _text1)),
                        const Spacer(),
                        Text('$completeness%', style: const TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: _success)),
                        const SizedBox(width: 4),
                        const Icon(Icons.arrow_forward_ios, size: 8, color: _text2),
                      ],
                    ),
                    const SizedBox(height: 6),
                    ClipRRect(
                      borderRadius: BorderRadius.circular(4),
                      child: LinearProgressIndicator(
                        value: completeness / 100.0,
                        minHeight: 4,
                        backgroundColor: Colors.grey.shade200,
                        valueColor: const AlwaysStoppedAnimation<Color>(_success),
                      ),
                    ),
                    const SizedBox(height: 14),
                    const Text('Quick Stats', style: TextStyle(fontSize: 9, color: _text2)),
                    const SizedBox(height: 8),
                    // Stats Row
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        _buildHeroStat(Icons.work, 'Applications', '${_applications.length}', const Color(0xFF2563EB)),
                        _buildHeroStat(Icons.people, 'Interviews', '${_interviews.length}', const Color(0xFF8B5CF6)),
                        _buildHeroStat(Icons.description, 'Mock Tests', '32', const Color(0xFF10B981)), 
                        _buildHeroStat(Icons.local_fire_department, 'Current Streak', '$_streakDays Days', const Color(0xFFF59E0B)),
                      ],
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 20),
          // Continue Button
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: () => Navigator.pushNamed(context, '/preparation'),
              style: ElevatedButton.styleFrom(
                backgroundColor: _primary,
                padding: const EdgeInsets.symmetric(vertical: 14),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(30)),
                elevation: 0,
              ),
              child: const Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text('Continue Preparation', style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: Colors.white)),
                  SizedBox(width: 8),
                  Icon(Icons.arrow_forward, size: 16, color: Colors.white),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildHeroStat(IconData icon, String label, String value, Color color) {
    return Column(
      children: [
        Icon(icon, size: 14, color: color),
        const SizedBox(height: 4),
        Text(label, style: const TextStyle(fontSize: 7, color: _text2)),
        const SizedBox(height: 2),
        Text(value, style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: _text1)),
      ],
    );
  }

  // ── 3. TODAY'S GOALS ───────────────────────────────────────────────────────
  Widget _buildTodaysFocus() {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 24, 0, 0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.only(right: 16),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text("Today's Goals",
                    style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                        color: _text1)),
                GestureDetector(
                  onTap: () => Navigator.pushNamed(context, '/preparation'),
                  child: const Text('See All',
                      style: TextStyle(
                          fontSize: 12,
                          color: _primary,
                          fontWeight: FontWeight.w600)),
                ),
              ],
            ),
          ),
          const SizedBox(height: 12),
          SizedBox(
            height: 120,
            child: ListView(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.only(right: 16),
              children: [
                _GoalCard(
                  icon: Icons.menu_book,
                  iconColor: const Color(0xFF2563EB),
                  title: 'Practice MCQ',
                  subtitle: '45 Questions\nRemaining',
                  onTap: () => Navigator.pushNamed(context, '/preparation/subjects'),
                ),
                _GoalCard(
                  icon: Icons.assignment_outlined,
                  iconColor: const Color(0xFF8B5CF6),
                  title: 'Mock Test',
                  subtitle: '',
                  onTap: () => Navigator.pushNamed(context, '/preparation/mock-tests'),
                ),
                _GoalCard(
                  icon: Icons.description_outlined,
                  iconColor: const Color(0xFF10B981),
                  title: 'Reading Material',
                  subtitle: '5 New PDFs',
                  onTap: () => Navigator.pushNamed(context, '/preparation/reading'),
                ),
                _GoalCard(
                  icon: Icons.track_changes,
                  iconColor: const Color(0xFFF59E0B),
                  title: 'Subject Practice',
                  subtitle: 'Continue\nPython',
                  onTap: () => Navigator.pushNamed(context, '/preparation/subjects'),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }


  // ── 5. PREPARATION INSIGHTS ────────────────────────────────────────────────
  Widget _buildPrepInsights() {
    final int overallAccuracy = _studentProgress?['overall_accuracy'] ?? 0;
    final int totalQuestions = _studentProgress?['total_questions_solved'] ?? 0;
    
    // Calculate today's progress
    final todayStr = DateFormat('yyyy-MM-dd').format(DateTime.now());
    int todayQuestions = 0;
    int weeklyQuestions = 0;
    if (_studentProgress?['weekly_activity'] != null) {
      final List weekData = _studentProgress!['weekly_activity'];
      for (var w in weekData) {
        final qs = w['questions_solved'] ?? 0;
        weeklyQuestions += qs as int;
        if (w['date'] == todayStr) {
          todayQuestions = qs;
        }
      }
    }
    
    final int dailyGoal = 40;
    final double dailyProgress = (todayQuestions / dailyGoal).clamp(0.0, 1.0);
    final int dailyPercent = (dailyProgress * 100).toInt();

    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 24, 16, 0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text('Preparation Insights',
                  style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: _text1)),
              Row(
                children: [
                  const Text('This Week', style: TextStyle(fontSize: 11, color: _text2)),
                  const SizedBox(width: 4),
                  const Icon(Icons.keyboard_arrow_down, size: 14, color: _text2),
                ],
              ),
            ],
          ),
          const SizedBox(height: 12),
          GridView.count(
            crossAxisCount: 2,
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            mainAxisSpacing: 12,
            crossAxisSpacing: 12,
            childAspectRatio: 1.15,
            children: [
              _buildInsightCard(
                'Overall Accuracy',
                Center(
                  child: SizedBox(
                    width: 50,
                    height: 50,
                    child: Stack(
                      fit: StackFit.expand,
                      children: [
                        CircularProgressIndicator(value: overallAccuracy / 100.0, strokeWidth: 4, backgroundColor: Colors.grey.shade100, valueColor: const AlwaysStoppedAnimation<Color>(_primary)),
                        Center(child: Text('$overallAccuracy%', style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: _text1))),
                      ],
                    ),
                  ),
                ),
                'Keep practicing',
                const Color(0xFF10B981),
              ),
              _buildInsightCard(
                'Today\'s Progress',
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text('$dailyPercent%', style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: _text1)),
                    const SizedBox(height: 8),
                    ClipRRect(
                      borderRadius: BorderRadius.circular(4),
                      child: LinearProgressIndicator(value: dailyProgress, minHeight: 6, backgroundColor: const Color(0xFFE0E7FF), valueColor: const AlwaysStoppedAnimation<Color>(_primary)),
                    ),
                  ],
                ),
                '$todayQuestions / $dailyGoal Goals',
                _text2,
              ),
              _buildInsightCard(
                'Weekly Growth',
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text('$weeklyQuestions Qs', style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Color(0xFF10B981))),
                    const SizedBox(height: 6),
                    const Icon(Icons.show_chart, color: _primary, size: 30),
                  ],
                ),
                'Solved this week',
                _text2,
              ),
              _buildInsightCard(
                'Questions Solved',
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text('$totalQuestions', style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: _text1)),
                    const SizedBox(height: 6),
                    const Icon(Icons.multiline_chart, color: _primary, size: 30),
                  ],
                ),
                'Total lifetime',
                const Color(0xFF10B981),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildInsightCard(String title, Widget content, String footer, Color footerColor) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.grey.shade100),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(title, style: const TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: _text1)),
          const SizedBox(height: 8),
          Expanded(child: content),
          const SizedBox(height: 8),
          Text(footer, style: TextStyle(fontSize: 9, color: footerColor)),
        ],
      ),
    );
  }

  // ── 6. SUBJECT PERFORMANCE ───────────────────────────────────────────────────
  Widget _buildSubjectPerformance() {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 24, 0, 0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.only(right: 16),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text('Subject Performance',
                    style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                        color: _text1)),
                GestureDetector(
                  onTap: () => Navigator.pushNamed(context, '/preparation/performance'),
                  child: const Text('View All',
                      style: TextStyle(
                          fontSize: 12,
                          color: _primary,
                          fontWeight: FontWeight.w600)),
                ),
              ],
            ),
          ),
          const SizedBox(height: 12),
          SizedBox(
            height: 75,
            child: ListView.builder(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.only(right: 16),
              itemCount: _prepAnalytics.length,
              itemBuilder: (context, index) {
                final a = _prepAnalytics[index];
                final val = a['value'] as double;
                final col = a['color'] as Color;
                return Container(
                  width: 140,
                  margin: const EdgeInsets.only(right: 12),
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: Colors.grey.shade100),
                  ),
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.all(6),
                            decoration: BoxDecoration(
                              color: col.withOpacity(0.1),
                              shape: BoxShape.circle,
                            ),
                            child: Icon(Icons.book, size: 16, color: col),
                          ),
                          const SizedBox(width: 8),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(a['label'], style: const TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: _text1), maxLines: 1, overflow: TextOverflow.ellipsis),
                                const SizedBox(height: 2),
                                Text('${(val * 100).toInt()}%', style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w900, color: _text1)),
                              ],
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 8),
                      ClipRRect(
                        borderRadius: BorderRadius.circular(2),
                        child: LinearProgressIndicator(
                          value: val,
                          minHeight: 4,
                          backgroundColor: col.withOpacity(0.1),
                          valueColor: AlwaysStoppedAnimation<Color>(col),
                        ),
                      ),
                    ],
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }

  // ── 7. TODAY'S CHALLENGE & RECOMMENDED JOBS ────────────────────────────────
  Widget _buildDailyChallengeAndJobs() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 24, 16, 0),
          child: _buildDailyChallengeCard(),
        ),
        _buildRecommendedJobs(),
      ],
    );
  }

  Widget _buildDailyChallengeCard() {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [Color(0xFFFDBA74), Color(0xFFF97316)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(color: const Color(0xFFF97316).withOpacity(0.3), blurRadius: 16, offset: const Offset(0, 8))
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(Icons.local_fire_department, color: Colors.white, size: 16),
              const SizedBox(width: 4),
              Text('$_streakDays Day Streak', style: const TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.bold)),
            ],
          ),
          const SizedBox(height: 12),
          const Text('Today\'s Challenge', style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.w900)),
          const SizedBox(height: 4),
          Text('Solve 50 Questions &\nImprove Accuracy!', style: TextStyle(color: Colors.white.withOpacity(0.9), fontSize: 12)),
          const SizedBox(height: 16),
          ElevatedButton(
            onPressed: () async {
              await Navigator.pushNamed(context, '/preparation/daily-challenge');
              _fetchDashboardData();
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.white,
              foregroundColor: const Color(0xFFF97316),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
              elevation: 0,
            ),
            child: const Text('Start Challenge', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
          ),
        ],
      ),
    );
  }

  Widget _buildRecommendedJobs() {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 24, 0, 0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.only(right: 16),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text('Recommended Jobs',
                    style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                        color: _text1)),
                GestureDetector(
                  onTap: () async {
                    await Navigator.pushNamed(context, '/jobs');
                    _fetchDashboardData();
                  },
                  child: const Text('View All',
                      style: TextStyle(
                          fontSize: 12,
                          color: _primary,
                          fontWeight: FontWeight.w600)),
                ),
              ],
            ),
          ),
          const SizedBox(height: 12),
          _jobs.isEmpty
              ? Padding(
                  padding: const EdgeInsets.only(right: 16),
                  child: Text('No jobs available at the moment.', style: TextStyle(color: _text2, fontSize: 13)),
                )
              : SizedBox(
                  height: 200,
                  child: ListView.builder(
                    scrollDirection: Axis.horizontal,
                    padding: const EdgeInsets.only(right: 16),
                    itemCount: _jobs.length.clamp(0, 5),
                    itemBuilder: (_, i) {
                      final job = _jobs[i];
                      final companyVal = job['job_company_id'];
                      final companyName = companyVal is Map ? (companyVal['company_name'] ?? 'Company') : 'Company';
                      final city = job['job_location']?['city'] ?? 'India';
                      final salary = job['job_salary'] ?? 'Competitive';
                      final hasApplied = _applications.any((app) {
                        final jobIdVal = app['job_id'];
                        if (jobIdVal is Map) return jobIdVal['_id'] == job['_id'];
                        if (jobIdVal is String) return jobIdVal == job['_id'];
                        return false;
                      });

                      return Container(
                        width: 220,
                        margin: const EdgeInsets.only(right: 12),
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(20),
                          border: Border.all(color: Colors.grey.shade100),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              children: [
                                CircleAvatar(
                                  radius: 16,
                                  backgroundColor: _primary.withOpacity(0.1),
                                  child: Text(companyName[0].toUpperCase(), style: const TextStyle(color: _primary, fontSize: 12, fontWeight: FontWeight.bold)),
                                ),
                                const Spacer(),
                                const Icon(Icons.bookmark_border, size: 18, color: Colors.grey),
                              ],
                            ),
                            const SizedBox(height: 12),
                            Text(companyName, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 11, color: _text1), maxLines: 1, overflow: TextOverflow.ellipsis),
                            const SizedBox(height: 4),
                            Text(job['job_title'] ?? 'Role', style: TextStyle(fontSize: 10, color: _text2), maxLines: 1, overflow: TextOverflow.ellipsis),
                            const SizedBox(height: 8),
                            Text('₹ $salary', style: const TextStyle(fontSize: 10, color: _text2)),
                            Text('📍 $city', style: const TextStyle(fontSize: 10, color: _text2)),
                            const Spacer(),
                            SizedBox(
                              width: double.infinity,
                              child: ElevatedButton(
                                onPressed: hasApplied ? null : () => _applyForJob(job['_id']),
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: hasApplied ? Colors.grey.shade200 : _primary,
                                  foregroundColor: hasApplied ? Colors.grey : Colors.white,
                                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                                  padding: const EdgeInsets.symmetric(vertical: 8),
                                  elevation: 0,
                                ),
                                child: Text(hasApplied ? 'Applied' : 'Apply', style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold)),
                              ),
                            ),
                          ],
                        ),
                      );
                    },
                  ),
                ),
        ],
      ),
    );
  }

  // ── 8. UPCOMING INTERVIEW & RECENT ACTIVITY ────────────────────────────────
  Widget _buildInterviewAndRecentActivity(Map<String, dynamic>? upcomingInterview) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 24, 16, 0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('Upcoming Interview', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: _text1)),
                    const SizedBox(height: 12),
                    _buildInterviewCard(upcomingInterview),
                  ],
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('Recent Activity', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: _text1)),
                    const SizedBox(height: 12),
                    _buildRecentActivity(),
                  ],
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildInterviewCard(Map<String, dynamic>? interview) {
    if (interview == null) {
      return Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(16), border: Border.all(color: Colors.grey.shade100)),
        child: const Text('No upcoming interviews.', style: TextStyle(fontSize: 12, color: Colors.grey)),
      );
    }
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.grey.shade100),
      ),
      child: Column(
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(color: const Color(0xFFEFF6FF), borderRadius: BorderRadius.circular(12)),
                child: const Icon(Icons.calendar_today, color: Color(0xFF2563EB), size: 16),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(_formatInterviewTime(interview['scheduled_at']), style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 11, color: _text1)),
                    Text(interview['job_id']?['job_title'] ?? 'Technical Round', style: TextStyle(fontSize: 10, color: _text2), maxLines: 1, overflow: TextOverflow.ellipsis),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: () => Navigator.pushNamed(context, '/interviews'),
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFFEFF6FF),
                foregroundColor: const Color(0xFF2563EB),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                elevation: 0,
              ),
              child: const Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text('View Details', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold)),
                  SizedBox(width: 4),
                  Icon(Icons.arrow_forward, size: 14),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildRecentActivity() {
    if (_recentActivity.isEmpty) {
      return Padding(
        padding: const EdgeInsets.symmetric(vertical: 20),
        child: Center(child: Text('No recent activity', style: TextStyle(color: _text2, fontSize: 12))),
      );
    }
    return Column(
      children: _recentActivity.take(5).map((activity) {
        final String type = activity['test_type'] ?? 'practice';
        final String timeStr = activity['completed_at'] ?? activity['createdAt'] ?? '';
        final DateTime time = DateTime.tryParse(timeStr) ?? DateTime.now();
        final String timeFormatted = _formatTimeAgo(time);

        IconData icon = Icons.check_circle;
        Color color = const Color(0xFF10B981);
        String title = 'Completed';
        String subtitle = '';

        if (type == 'mock_test') {
          title = 'Mock Test Completed';
          subtitle = (activity['mock_test_id'] != null && activity['mock_test_id'] is Map) 
              ? activity['mock_test_id']['title'] ?? 'Mock Test' 
              : 'Mock Test';
        } else if (type == 'daily_challenge') {
          icon = Icons.local_fire_department;
          color = const Color(0xFFF59E0B);
          title = 'Daily Challenge';
          subtitle = 'Completed daily goal';
        } else if (type == 'exam' || type == 'application_exam' || type == 'assessment') {
          icon = Icons.assignment_turned_in;
          color = const Color(0xFF3B82F6);
          title = 'Application Exam';
          subtitle = (activity['exam_id'] != null && activity['exam_id'] is Map) 
              ? activity['exam_id']['title'] ?? 'Exam Completed' 
              : 'Exam Completed';
        } else {
          icon = Icons.menu_book;
          color = const Color(0xFF8B5CF6);
          title = 'Subject Practice';
          subtitle = (activity['subject_id'] != null && activity['subject_id'] is Map) 
              ? activity['subject_id']['name'] ?? 'Practice' 
              : 'Practice Module';
        }

        return _buildActivityTile(icon, color, title, subtitle, timeFormatted);
      }).toList(),
    );
  }

  String _formatTimeAgo(DateTime time) {
    final diff = DateTime.now().difference(time);
    if (diff.inDays > 1) return '${diff.inDays}d ago';
    if (diff.inHours > 1) return '${diff.inHours}h ago';
    if (diff.inMinutes > 1) return '${diff.inMinutes}m ago';
    return 'Just now';
  }

  Widget _buildActivityTile(IconData icon, Color color, String title, String subtitle, String time) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.all(6),
            decoration: BoxDecoration(color: color.withOpacity(0.1), shape: BoxShape.circle),
            child: Icon(icon, color: color, size: 12),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 10, color: _text1)),
                const SizedBox(height: 2),
                Text(subtitle, style: TextStyle(fontSize: 9, color: _text2)),
              ],
            ),
          ),
          Text(time, style: TextStyle(fontSize: 9, color: Colors.grey.shade400)),
        ],
      ),
    );
  }

  // ── 9. QUICK ACTIONS ─────────────────────────────────────────────────────────
  Widget _buildQuickActions() {
    final actions = <_QA>[
      _QA(icon: Icons.work, label: 'Jobs', color: const Color(0xFF2563EB), route: '/jobs'),
      _QA(icon: Icons.assignment, label: 'Applications', color: const Color(0xFF4F46E5), route: '/my-applications'),
      _QA(icon: Icons.description, label: 'Resume', color: const Color(0xFF8B5CF6), route: '/resume'),
      _QA(icon: Icons.video_call, label: 'Interview', color: const Color(0xFFEF4444), route: '/interviews'),
      _QA(icon: Icons.bookmark, label: 'Bookmarks', color: const Color(0xFFF59E0B), route: '/bookmarks'),
    ];

    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 24, 0, 0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Padding(
            padding: EdgeInsets.only(right: 16),
            child: Text('Quick Actions',
                style: TextStyle(
                    fontSize: 16, fontWeight: FontWeight.bold, color: _text1)),
          ),
          const SizedBox(height: 12),
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            child: Row(
              children: actions.map((qa) {
                return GestureDetector(
                  onTap: () async {
                    await Navigator.pushNamed(context, qa.route);
                    _fetchDashboardData();
                  },
                  child: Container(
                    width: 78,
                    margin: const EdgeInsets.only(right: 12),
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: Colors.grey.shade100, width: 1.5),
                    ),
                    child: Column(
                      children: [
                        Container(
                          width: 42,
                          height: 42,
                          decoration: BoxDecoration(
                            color: qa.color.withOpacity(0.1),
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: Icon(qa.icon, color: qa.color, size: 22),
                        ),
                        const SizedBox(height: 8),
                        Text(
                          qa.label,
                          style: const TextStyle(
                              fontSize: 11,
                              fontWeight: FontWeight.w700,
                              color: Color(0xFF111827)),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ],
                    ),
                  ),
                );
              }).toList(),
            ),
          ),
        ],
      ),
    );
  }

  // ── 10. FLOATING BOTTOM NAV ────────────────────────────────────────────────
  Widget _buildFloatingNav() {
    const tabs = <_NavTab>[
      _NavTab(icon: Icons.home_filled, activeIcon: Icons.home_filled, label: 'Home'),
      _NavTab(icon: Icons.work_outline, activeIcon: Icons.work_rounded, label: 'Jobs'),
      _NavTab(icon: Icons.assignment_outlined, activeIcon: Icons.assignment, label: 'Mock Tests'),
      _NavTab(icon: Icons.video_call_outlined, activeIcon: Icons.video_call_rounded, label: 'Interview'),
      _NavTab(icon: Icons.person_outline, activeIcon: Icons.person_rounded, label: 'Profile'),
    ];

    return SafeArea(
      child: Container(
        height: 68,
        margin: const EdgeInsets.fromLTRB(16, 0, 16, 20),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(30),
          boxShadow: [
            BoxShadow(
                color: Colors.black.withOpacity(0.08),
                blurRadius: 20,
                offset: const Offset(0, 8))
          ],
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceEvenly,
          children: List.generate(tabs.length, (i) {
            final tab = tabs[i];
            final isSelected = _currentIndex == i;
            return InkWell(
              onTap: () {
                setState(() => _currentIndex = i);
                switch (i) {
                  case 0:
                    break;
                  case 1:
                    Navigator.pushNamed(context, '/jobs');
                    break;
                  case 2:
                    Navigator.pushNamed(context, '/preparation/mock-tests');
                    break;
                  case 3:
                    Navigator.pushNamed(context, '/interviews');
                    break;
                  case 4:
                    Navigator.pushNamed(context, '/profile');
                    break;
                }
              },
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                decoration: BoxDecoration(
                  color: isSelected ? _primary.withOpacity(0.1) : Colors.transparent,
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(
                      isSelected ? tab.activeIcon : tab.icon,
                      color: isSelected ? _primary : const Color(0xFF9CA3AF),
                      size: 24,
                    ),
                    const SizedBox(height: 4),
                    Text(tab.label,
                        style: TextStyle(
                            color: isSelected ? _primary : const Color(0xFF9CA3AF),
                            fontSize: 10,
                            fontWeight: isSelected ? FontWeight.bold : FontWeight.w500)),
                  ],
                ),
              ),
            );
          }),
        ),
      ),
    );
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// SUPPORTING WIDGETS
// ═══════════════════════════════════════════════════════════════════════════════

/// Stat pill inside the Career card
class _MiniStat extends StatelessWidget {
  final IconData icon;
  final String label;
  final String value;
  const _MiniStat(
      {required this.icon, required this.label, required this.value});

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(icon, size: 11, color: Colors.white70),
        const SizedBox(width: 4),
        Text(value,
            style: const TextStyle(
                color: Colors.white,
                fontWeight: FontWeight.bold,
                fontSize: 12)),
        const SizedBox(width: 4),
        Text(label,
            style:
                TextStyle(color: Colors.white.withOpacity(0.7), fontSize: 10)),
      ],
    );
  }
}

/// Today's Goals card
class _GoalCard extends StatelessWidget {
  final IconData icon;
  final Color iconColor;
  final String title;
  final String subtitle;
  final VoidCallback onTap;

  const _GoalCard({
    required this.icon,
    required this.iconColor,
    required this.title,
    required this.subtitle,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: 140,
        margin: const EdgeInsets.only(right: 12),
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: Colors.grey.shade100),
          boxShadow: [
            BoxShadow(
                color: Colors.black.withOpacity(0.03),
                blurRadius: 10,
                offset: const Offset(0, 4))
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Container(
              width: 36,
              height: 36,
              decoration: BoxDecoration(
                  color: iconColor.withOpacity(0.1), borderRadius: BorderRadius.circular(10)),
              child: Icon(icon, color: iconColor, size: 18),
            ),
            const Spacer(),
            Text(title,
                style: const TextStyle(
                    fontWeight: FontWeight.bold,
                    fontSize: 12,
                    color: Color(0xFF111827))),
            const SizedBox(height: 4),
            Text(subtitle,
                style: TextStyle(
                    fontSize: 9,
                    color: Colors.grey.shade500,
                    height: 1.2)),
          ],
        ),
      ),
    );
  }
}

/// Quick Action data model
class _QA {
  final IconData icon;
  final String label;
  final Color color;
  final String route;
  const _QA(
      {required this.icon,
      required this.label,
      required this.color,
      required this.route});
}

/// Nav tab data model
class _NavTab {
  final IconData icon;
  final IconData activeIcon;
  final String label;
  const _NavTab(
      {required this.icon, required this.activeIcon, required this.label});
}

/// Shimmer skeleton box
class _ShimmerBox extends StatefulWidget {
  final double height;
  final double radius;
  final EdgeInsets margin;
  const _ShimmerBox(
      {required this.height, required this.radius, required this.margin});

  @override
  State<_ShimmerBox> createState() => _ShimmerBoxState();
}

class _ShimmerBoxState extends State<_ShimmerBox>
    with SingleTickerProviderStateMixin {
  late AnimationController _ctrl;
  late Animation<double> _anim;

  @override
  void initState() {
    super.initState();
    _ctrl = AnimationController(
        vsync: this, duration: const Duration(milliseconds: 1200))
      ..repeat(reverse: true);
    _anim = CurvedAnimation(parent: _ctrl, curve: Curves.easeInOut);
  }

  @override
  void dispose() {
    _ctrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _anim,
      builder: (_, __) => Container(
        height: widget.height,
        margin: widget.margin,
        decoration: BoxDecoration(
          color: Color.lerp(
              const Color(0xFFE5E7EB), const Color(0xFFF3F4F6), _anim.value),
          borderRadius: BorderRadius.circular(widget.radius),
        ),
      ),
    );
  }
}
