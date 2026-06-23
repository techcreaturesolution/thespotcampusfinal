import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
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
  List<dynamic> _jobs = [];
  List<dynamic> _applications = [];
  List<dynamic> _interviews = [];
  bool _isLoading = true;

  // ── Animation controllers ──────────────────────────────────────────────────
  late AnimationController _progressAnimController;

  // ── Design tokens ──────────────────────────────────────────────────────────
  static const Color _primary   = Color(0xFF2563EB);
  static const Color _secondary = Color(0xFF4F46E5);
  static const Color _success   = Color(0xFF10B981);
  static const Color _warning   = Color(0xFFF59E0B);
  static const Color _danger    = Color(0xFFEF4444);
  static const Color _bg        = Color(0xFFF8FAFC);
  static const Color _surface   = Color(0xFFFFFFFF);
  static const Color _text1     = Color(0xFF111827);
  static const Color _text2     = Color(0xFF6B7280);

  // ═══════════════════════════════════════════════════════════════════════════
  // LIFECYCLE
  // ═══════════════════════════════════════════════════════════════════════════

  @override
  void initState() {
    super.initState();
    _fetchDashboardData();
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
  // BUSINESS LOGIC (unchanged — DO NOT MODIFY)
  // ═══════════════════════════════════════════════════════════════════════════

  Future<void> _fetchDashboardData() async {
    try {
      final api = Provider.of<ApiService>(context, listen: false);
      final results = await Future.wait([
        api.get('/jobs/student'),
        api.get('/application/student'),
        api.get('/interviews/student'),
      ]);
      setState(() {
        _jobs         = results[0]['jobs']         ?? [];
        _applications = results[1]['applications'] ?? [];
        _interviews   = results[2]['interviews']   ?? [];
        _isLoading    = false;
      });
    } catch (e) {
      setState(() => _isLoading = false);
    }
  }

  int _calculateProfileCompleteness(Map<String, dynamic>? user) {
    if (user == null) return 0;
    int filledFields = 0;
    const int totalFields = 8;
    if (user['student_name']        != null && user['student_name'].toString().isNotEmpty)        filledFields++;
    if (user['student_email']       != null && user['student_email'].toString().isNotEmpty)       filledFields++;
    if (user['student_contact']     != null && user['student_contact'].toString().isNotEmpty)     filledFields++;
    if (user['student_enrollment']  != null && user['student_enrollment'].toString().isNotEmpty)  filledFields++;
    if (user['student_skills']      != null && user['student_skills'].toString().isNotEmpty)      filledFields++;
    if (user['student_current_sem'] != null && user['student_current_sem'].toString().isNotEmpty) filledFields++;
    if (user['branch_id'] != null) filledFields++;
    if (user['degree_id'] != null) filledFields++;
    return ((filledFields / totalFields) * 100).toInt();
  }

  Map<String, dynamic>? _getUpcomingInterview() {
    final scheduled = _interviews
        .where((i) => i['status'] == 'scheduled' || i['status'] == 'in_progress')
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
        const SnackBar(content: Text('Applied successfully!'), backgroundColor: Colors.green),
      );
      _fetchDashboardData();
    } catch (e) {
      if (!mounted) return;
      final errorStr = e.toString().toLowerCase();
      if (errorStr.contains('subscription') || errorStr.contains('payment')) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('An active subscription plan is required to apply. Redirecting to plans...'),
            backgroundColor: Colors.orange,
          ),
        );
        Future.delayed(const Duration(seconds: 1), () {
          if (mounted) Navigator.pushNamed(context, '/plans');
        });
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed: ${e.toString().replaceAll('Exception: ', '')}'),
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
    final auth              = Provider.of<AuthService>(context);
    final user              = auth.user;
    final completeness      = _calculateProfileCompleteness(user);
    final upcomingInterview = _getUpcomingInterview();
    final scheduledCount    = _interviews
        .where((i) => i['status'] == 'scheduled' || i['status'] == 'in_progress')
        .length;

    return Scaffold(
      backgroundColor: _bg,
      body: _isLoading ? _buildSkeleton() : _buildBody(auth, user, completeness, upcomingInterview, scheduledCount),
      bottomNavigationBar: _buildFloatingNav(),
    );
  }

  // ── Shimmer skeleton ───────────────────────────────────────────────────────
  Widget _buildSkeleton() {
    return SafeArea(
      child: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            _ShimmerBox(height: 64,  radius: 0,  margin: EdgeInsets.zero),
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
          SliverToBoxAdapter(child: _buildHeader(auth)),
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(16, 4, 16, 0),
              child: _buildCareerCard(auth, completeness),
            ),
          ),
          SliverToBoxAdapter(child: _buildTodaysFocus()),
          SliverToBoxAdapter(child: _buildQuickActions()),
          SliverToBoxAdapter(child: _buildPrepAnalytics()),
          SliverToBoxAdapter(child: _buildInterviewAndChallenge(upcomingInterview)),
          SliverToBoxAdapter(child: _buildRecommendedJobs()),
          SliverToBoxAdapter(child: _buildAppliedJobs()),
          const SliverToBoxAdapter(child: SizedBox(height: 100)),
        ],
      ),
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SECTION WIDGETS
  // ═══════════════════════════════════════════════════════════════════════════

  // ── 1. HEADER ──────────────────────────────────────────────────────────────
  Widget _buildHeader(AuthService auth) {
    return Container(
      color: _surface,
      padding: EdgeInsets.fromLTRB(16, MediaQuery.of(context).padding.top + 10, 16, 14),
      child: Row(
        children: [
          Image.asset('assets/images/logo_TSC.png', height: 30, fit: BoxFit.contain),
          const Spacer(),
          // Notification bell
          Stack(
            children: [
              Material(
                color: Colors.transparent,
                child: InkWell(
                  borderRadius: BorderRadius.circular(20),
                  onTap: () {},
                  child: const Padding(
                    padding: EdgeInsets.all(8),
                    child: Icon(Icons.notifications_outlined, size: 24, color: Color(0xFF374151)),
                  ),
                ),
              ),
              Positioned(
                right: 8, top: 8,
                child: Container(
                  width: 8, height: 8,
                  decoration: const BoxDecoration(color: _danger, shape: BoxShape.circle),
                ),
              ),
            ],
          ),
          const SizedBox(width: 6),
          // Profile avatar
          GestureDetector(
            onTap: () => Navigator.pushNamed(context, '/profile'),
            child: CircleAvatar(
              radius: 19,
              backgroundColor: _primary.withOpacity(0.1),
              child: Text(
                auth.userName.isNotEmpty ? auth.userName[0].toUpperCase() : 'S',
                style: const TextStyle(color: _primary, fontWeight: FontWeight.bold, fontSize: 15),
              ),
            ),
          ),
        ],
      ),
    );
  }

  // ── 2. CAREER PROGRESS CARD ────────────────────────────────────────────────
  Widget _buildCareerCard(AuthService auth, int completeness) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [Color(0xFF1D4ED8), Color(0xFF4F46E5)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(24),
        boxShadow: [
          BoxShadow(color: _primary.withOpacity(0.32), blurRadius: 22, offset: const Offset(0, 8)),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Greeting row
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Text(_greetingEmoji(), style: const TextStyle(fontSize: 16)),
                        const SizedBox(width: 6),
                        Text(
                          _greeting(),
                          style: TextStyle(color: Colors.white.withOpacity(0.8), fontSize: 12, fontWeight: FontWeight.w500),
                        ),
                      ],
                    ),
                    const SizedBox(height: 2),
                    Text(
                      auth.userName.isNotEmpty ? auth.userName : 'Student',
                      style: const TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.bold),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      'Ready for today\'s preparation?',
                      style: TextStyle(color: Colors.white.withOpacity(0.7), fontSize: 11),
                    ),
                  ],
                ),
              ),
              // Continue CTA
              GestureDetector(
                onTap: () => Navigator.pushNamed(context, '/preparation'),
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 7),
                  decoration: BoxDecoration(
                    color: Colors.white.withOpacity(0.18),
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(color: Colors.white.withOpacity(0.25)),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Text('Continue Preparation', style: TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.w600)),
                      const SizedBox(width: 4),
                      const Icon(Icons.arrow_forward, size: 12, color: Colors.white),
                    ],
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 18),
          // Stats row
          Container(
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: Colors.white.withOpacity(0.12),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: Colors.white.withOpacity(0.15)),
            ),
            child: Row(
              children: [
                // Circular profile progress
                TweenAnimationBuilder<double>(
                  duration: const Duration(milliseconds: 1500),
                  curve: Curves.easeOutCubic,
                  tween: Tween<double>(begin: 0, end: completeness / 100.0),
                  builder: (_, value, __) {
                    return Stack(
                      alignment: Alignment.center,
                      children: [
                        SizedBox(
                          width: 56, height: 56,
                          child: CircularProgressIndicator(
                            value: value,
                            strokeWidth: 5,
                            backgroundColor: Colors.white.withOpacity(0.2),
                            valueColor: const AlwaysStoppedAnimation<Color>(Colors.white),
                          ),
                        ),
                        Text(
                          '${(value * 100).toInt()}%',
                          style: const TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.bold),
                        ),
                      ],
                    );
                  },
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text('Profile Complete', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 13)),
                      const SizedBox(height: 2),
                      Text(
                        completeness == 100 ? 'Great! Your profile is fully complete.' : 'Add more details to hit 100%',
                        style: TextStyle(color: Colors.white.withOpacity(0.75), fontSize: 10),
                      ),
                    ],
                  ),
                ),
                const SizedBox(width: 10),
                // Mini stats
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    _MiniStat(icon: Icons.assignment_outlined, label: 'Applications', value: '${_applications.length}'),
                    const SizedBox(height: 8),
                    _MiniStat(icon: Icons.people_outline,      label: 'Interviews',   value: '${_interviews.length}'),
                    const SizedBox(height: 8),
                    _MiniStat(icon: Icons.track_changes,       label: 'Practice',     value: '87%'),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  // ── 3. TODAY'S FOCUS ───────────────────────────────────────────────────────
  Widget _buildTodaysFocus() {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 22, 0, 0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.only(right: 16),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text("Today's Focus", style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: _text1)),
                GestureDetector(
                  onTap: () => Navigator.pushNamed(context, '/preparation'),
                  child: const Text('View All', style: TextStyle(fontSize: 12, color: _primary, fontWeight: FontWeight.w600)),
                ),
              ],
            ),
          ),
          const SizedBox(height: 12),
          SizedBox(
            height: 114,
            child: ListView(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.only(right: 16),
              children: [
                _FocusCard(
                  icon: Icons.quiz_outlined,
                  iconBg: const Color(0xFFEDE9FE),
                  iconColor: _secondary,
                  title: 'Practice MCQ',
                  tag: '45 Questions Pending',
                  tagColor: _secondary,
                  onTap: () => Navigator.pushNamed(context, '/preparation/subjects'),
                ),
                _FocusCard(
                  icon: Icons.assignment_outlined,
                  iconBg: const Color(0xFFECFDF5),
                  iconColor: _success,
                  title: 'Mock Test',
                  tag: 'SSC CGL Mock #12',
                  tagColor: _success,
                  onTap: () => Navigator.pushNamed(context, '/preparation/mock-tests'),
                ),
                _FocusCard(
                  icon: Icons.work_outline,
                  iconBg: const Color(0xFFFFF7ED),
                  iconColor: _warning,
                  title: 'Job Matches',
                  tag: '${_jobs.length}+ New Jobs',
                  tagColor: _warning,
                  onTap: () => Navigator.pushNamed(context, '/jobs'),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  // ── 4. QUICK ACTIONS ───────────────────────────────────────────────────────
  Widget _buildQuickActions() {
    final actions = <_QA>[
      _QA(icon: Icons.work_outline,         label: 'Jobs',         color: _primary,              route: '/jobs'),
      _QA(icon: Icons.assignment_outlined,  label: 'Applications', color: _secondary,            route: '/my-applications'),
      _QA(icon: Icons.quiz_outlined,        label: 'Mock Tests',   color: _success,              route: '/preparation/mock-tests'),
      _QA(icon: Icons.video_call_outlined,  label: 'Interview',    color: _danger,               route: '/interviews'),
      _QA(icon: Icons.menu_book_outlined,   label: 'Courses',      color: const Color(0xFF0EA5E9), route: '/preparation'),
      _QA(icon: Icons.bolt_outlined,        label: 'Daily Quiz',   color: _warning,              route: '/preparation/daily-challenge'),
      _QA(icon: Icons.description_outlined, label: 'Resume',       color: const Color(0xFF8B5CF6), route: '/resume'),
      _QA(icon: Icons.person_outline,       label: 'Profile',      color: _success,              route: '/profile'),
    ];

    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 22, 16, 0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('Quick Actions', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: _text1)),
          const SizedBox(height: 16),
          GridView.builder(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: 4,
              mainAxisSpacing: 12,
              crossAxisSpacing: 12,
              childAspectRatio: 0.80,
            ),
            itemCount: actions.length,
            itemBuilder: (_, i) {
              final qa = actions[i];
              return GestureDetector(
                onTap: () async {
                  await Navigator.pushNamed(context, qa.route);
                  _fetchDashboardData();
                },
                child: Container(
                  decoration: BoxDecoration(
                    color: _surface,
                    borderRadius: BorderRadius.circular(18),
                    border: Border.all(color: Colors.grey.shade100, width: 1.5),
                    boxShadow: [
                      BoxShadow(color: Colors.black.withOpacity(0.04), blurRadius: 12, offset: const Offset(0, 4)),
                    ],
                  ),
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Container(
                        width: 44, height: 44,
                        decoration: BoxDecoration(
                          gradient: LinearGradient(
                            colors: [qa.color.withOpacity(0.7), qa.color],
                            begin: Alignment.topLeft,
                            end: Alignment.bottomRight,
                          ),
                          borderRadius: BorderRadius.circular(14),
                          boxShadow: [
                            BoxShadow(color: qa.color.withOpacity(0.3), blurRadius: 8, offset: const Offset(0, 4)),
                          ],
                        ),
                        child: Icon(qa.icon, color: Colors.white, size: 22),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        qa.label,
                        style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: Color(0xFF374151)),
                        textAlign: TextAlign.center,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ],
                  ),
                ),
              );
            },
          ),
        ],
      ),
    );
  }

  // ── 5. PREPARATION ANALYTICS ───────────────────────────────────────────────
  Widget _buildPrepAnalytics() {
    // TODO: Replace placeholder values with real analytics API when available
    const analytics = <Map<String, dynamic>>[
      {'label': 'Reasoning', 'value': 0.82, 'color': Color(0xFF4F46E5)},
      {'label': 'Maths',     'value': 0.67, 'color': Color(0xFF2563EB)},
      {'label': 'English',   'value': 0.74, 'color': Color(0xFF7C3AED)},
      {'label': 'GK',        'value': 0.91, 'color': Color(0xFF10B981)},
    ];

    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 22, 16, 0),
      child: Container(
        padding: const EdgeInsets.fromLTRB(16, 16, 16, 18),
        decoration: BoxDecoration(
          color: _surface,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: Colors.grey.shade100),
          boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.04), blurRadius: 12, offset: const Offset(0, 4))],
        ),
        child: Column(
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text('Preparation Progress', style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: _text1)),
                GestureDetector(
                  onTap: () => Navigator.pushNamed(context, '/preparation/performance'),
                  child: const Text('View Detailed Report', style: TextStyle(fontSize: 11, color: _primary, fontWeight: FontWeight.w600)),
                ),
              ],
            ),
            const SizedBox(height: 14),
            GridView.builder(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: 2,
                mainAxisSpacing: 12,
                crossAxisSpacing: 20,
                childAspectRatio: 4.0,
              ),
              itemCount: analytics.length,
              itemBuilder: (_, i) {
                final a = analytics[i];
                final val  = a['value'] as double;
                final col  = a['color'] as Color;
                return AnimatedBuilder(
                  animation: _progressAnimController,
                  builder: (_, __) {
                    final animated = val * _progressAnimController.value;
                    return Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text(a['label'] as String, style: const TextStyle(fontSize: 11, color: _text2)),
                            Text(
                              '${(val * 100).toInt()}%',
                              style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: col),
                            ),
                          ],
                        ),
                        const SizedBox(height: 5),
                        ClipRRect(
                          borderRadius: BorderRadius.circular(8),
                          child: LinearProgressIndicator(
                            value: animated,
                            minHeight: 7,
                            backgroundColor: col.withOpacity(0.12),
                            valueColor: AlwaysStoppedAnimation<Color>(col),
                          ),
                        ),
                      ],
                    );
                  },
                );
              },
            ),
          ],
        ),
      ),
    );
  }

  // ── 6. UPCOMING INTERVIEW + DAILY CHALLENGE ────────────────────────────────
  Widget _buildInterviewAndChallenge(Map<String, dynamic>? upcomingInterview) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 0),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Expanded(child: _buildInterviewCard(upcomingInterview)),
          const SizedBox(width: 12),
          Expanded(child: _buildDailyChallengeCard()),
        ],
      ),
    );
  }

  Widget _buildInterviewCard(Map<String, dynamic>? interview) {
    final hasInterview = interview != null;
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: _surface,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: Colors.grey.shade100),
        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.04), blurRadius: 10, offset: const Offset(0, 3))],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 36, height: 36,
            decoration: BoxDecoration(
              color: (hasInterview ? _success : _primary).withOpacity(0.1),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Icon(
              hasInterview ? Icons.video_call_outlined : Icons.calendar_today_outlined,
              color: hasInterview ? _success : _primary,
              size: 18,
            ),
          ),
          const SizedBox(height: 10),
          const Text('Upcoming Interview', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: _text1)),
          const SizedBox(height: 4),
          if (!hasInterview) ...[
            Text('No upcoming interviews scheduled', style: TextStyle(fontSize: 10, color: _text2, height: 1.4)),
            const SizedBox(height: 10),
            SizedBox(
              width: double.infinity,
              child: OutlinedButton(
                onPressed: () async {
                  await Navigator.pushNamed(context, '/jobs');
                  _fetchDashboardData();
                },
                style: OutlinedButton.styleFrom(
                  foregroundColor: _primary,
                  side: const BorderSide(color: _primary),
                  padding: const EdgeInsets.symmetric(vertical: 6),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                  textStyle: const TextStyle(fontSize: 10, fontWeight: FontWeight.w600),
                ),
                child: const Text('Browse Jobs'),
              ),
            ),
          ] else ...[
            Text(
              interview['job_id']?['job_title'] ?? 'Interview Round',
              style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: Color(0xFF374151)),
              maxLines: 1, overflow: TextOverflow.ellipsis,
            ),
            const SizedBox(height: 2),
            Text(
              _formatInterviewTime(interview['scheduled_at']),
              style: TextStyle(fontSize: 10, color: _text2),
            ),
            const SizedBox(height: 10),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: () => Navigator.pushNamed(context, '/interviews'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: _success,
                  padding: const EdgeInsets.symmetric(vertical: 6),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                  elevation: 0,
                  textStyle: const TextStyle(fontSize: 10, fontWeight: FontWeight.w600),
                ),
                child: const Text('Join Now'),
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildDailyChallengeCard() {
    // TODO: Replace streak (12) with real API data when available
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [Color(0xFFFFF7ED), Color(0xFFFEF3C7)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: _warning.withOpacity(0.2)),
        boxShadow: [BoxShadow(color: _warning.withOpacity(0.1), blurRadius: 10, offset: const Offset(0, 3))],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 36, height: 36,
                decoration: BoxDecoration(color: _warning.withOpacity(0.15), borderRadius: BorderRadius.circular(10)),
                child: const Icon(Icons.local_fire_department, color: _warning, size: 20),
              ),
              const Spacer(),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                decoration: BoxDecoration(color: _warning, borderRadius: BorderRadius.circular(8)),
                child: const Text('Today\'s Streak', style: TextStyle(color: Colors.white, fontSize: 8, fontWeight: FontWeight.bold)),
              ),
            ],
          ),
          const SizedBox(height: 10),
          const Text('Daily Challenge', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: _text1)),
          const SizedBox(height: 4),
          const Text('12 Days 🔥', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Color(0xFFD97706))),
          const SizedBox(height: 10),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: () async {
                await Navigator.pushNamed(context, '/preparation/daily-challenge');
                _fetchDashboardData();
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: _warning,
                foregroundColor: Colors.white,
                elevation: 0,
                padding: const EdgeInsets.symmetric(vertical: 6),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                textStyle: const TextStyle(fontSize: 10, fontWeight: FontWeight.bold),
              ),
              child: const Text('Start Challenge'),
            ),
          ),
        ],
      ),
    );
  }

  // ── 7. RECOMMENDED JOBS ────────────────────────────────────────────────────
  Widget _buildRecommendedJobs() {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 22, 0, 0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.only(right: 16),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text('Recommended Jobs', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: _text1)),
                GestureDetector(
                  onTap: () async {
                    await Navigator.pushNamed(context, '/jobs');
                    _fetchDashboardData();
                  },
                  child: const Text('View All Jobs', style: TextStyle(fontSize: 12, color: _primary, fontWeight: FontWeight.w600)),
                ),
              ],
            ),
          ),
          const SizedBox(height: 12),
          _jobs.isEmpty
              ? Container(
                  margin: const EdgeInsets.only(right: 16),
                  padding: const EdgeInsets.symmetric(vertical: 28),
                  alignment: Alignment.center,
                  decoration: BoxDecoration(
                    color: _surface,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: Colors.grey.shade100),
                  ),
                  child: Text('No jobs available at the moment.', style: TextStyle(color: _text2, fontSize: 13)),
                )
              : SizedBox(
                  height: 182,
                  child: ListView.builder(
                    scrollDirection: Axis.horizontal,
                    itemCount: _jobs.length.clamp(0, 5),
                    itemBuilder: (_, i) {
                      final job        = _jobs[i];
                      final companyVal = job['job_company_id'];
                      final companyName = companyVal is Map ? (companyVal['company_name'] ?? 'Company') : 'Company';
                      final city       = job['job_location']?['city'] ?? 'India';
                      final salary     = job['job_salary'] ?? 'Competitive';
                      final hasApplied = _applications.any((app) {
                        final jobIdVal = app['job_id'];
                        if (jobIdVal is Map)    return jobIdVal['_id'] == job['_id'];
                        if (jobIdVal is String) return jobIdVal         == job['_id'];
                        return false;
                      });

                      return GestureDetector(
                        onTap: () async {
                          await Navigator.pushNamed(context, '/job-detail', arguments: job['_id']);
                          _fetchDashboardData();
                        },
                        child: Container(
                          width: 190,
                          margin: const EdgeInsets.only(right: 12, bottom: 4),
                          padding: const EdgeInsets.all(14),
                          decoration: BoxDecoration(
                            color: _surface,
                            borderRadius: BorderRadius.circular(20),
                            border: Border.all(color: Colors.grey.shade100),
                            boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.04), blurRadius: 8, offset: const Offset(0, 3))],
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                children: [
                                  Container(
                                    width: 36, height: 36,
                                    decoration: BoxDecoration(color: _primary.withOpacity(0.08), borderRadius: BorderRadius.circular(10)),
                                    child: Center(
                                      child: Text(
                                        companyName[0].toUpperCase(),
                                        style: const TextStyle(fontWeight: FontWeight.bold, color: _primary, fontSize: 15),
                                      ),
                                    ),
                                  ),
                                  const Spacer(),
                                  Icon(Icons.bookmark_border, size: 16, color: Colors.grey.shade400),
                                ],
                              ),
                              const SizedBox(height: 8),
                              Text(
                                job['job_title'] ?? 'Opening',
                                style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: _text1),
                                maxLines: 1, overflow: TextOverflow.ellipsis,
                              ),
                              const SizedBox(height: 2),
                              Text(companyName, style: TextStyle(fontSize: 11, color: _text2), maxLines: 1, overflow: TextOverflow.ellipsis),
                              const SizedBox(height: 4),
                              Row(
                                children: [
                                  Icon(Icons.location_on_outlined, size: 11, color: Colors.grey.shade400),
                                  const SizedBox(width: 2),
                                  Expanded(
                                    child: Text(city, style: TextStyle(fontSize: 10, color: _text2), overflow: TextOverflow.ellipsis),
                                  ),
                                ],
                              ),
                              const Spacer(),
                              Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  Expanded(
                                    child: Text(
                                      salary,
                                      style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 12, color: _primary),
                                      overflow: TextOverflow.ellipsis,
                                    ),
                                  ),
                                  GestureDetector(
                                    onTap: hasApplied ? null : () => _applyForJob(job['_id']),
                                    child: Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                      decoration: BoxDecoration(
                                        color: hasApplied ? Colors.grey.shade100 : _primary,
                                        borderRadius: BorderRadius.circular(20),
                                      ),
                                      child: Text(
                                        hasApplied ? 'Applied' : 'Apply',
                                        style: TextStyle(
                                          fontSize: 10,
                                          fontWeight: FontWeight.bold,
                                          color: hasApplied ? Colors.grey.shade600 : Colors.white,
                                        ),
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                            ],
                          ),
                        ),
                      );
                    },
                  ),
                ),
        ],
      ),
    );
  }

  // ── 8. APPLIED JOBS ────────────────────────────────────────────────────────
  Widget _buildAppliedJobs() {
    if (_applications.isEmpty) return const SizedBox.shrink();
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 22, 16, 0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text('Applied Jobs', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: _text1)),
              GestureDetector(
                onTap: () async {
                  await Navigator.pushNamed(context, '/my-applications');
                  _fetchDashboardData();
                },
                child: const Text('View all', style: TextStyle(fontSize: 12, color: _primary, fontWeight: FontWeight.w600)),
              ),
            ],
          ),
          const SizedBox(height: 10),
          ..._applications.take(3).map<Widget>((app) {
            final jobVal     = app['job_id'];
            final job        = jobVal is Map ? jobVal : null;
            final companyVal = job?['job_company_id'];
            final companyName = companyVal is Map ? (companyVal['company_name'] ?? 'Company') : 'Company';
            final title      = job?['job_title'] ?? 'Job';
            final status     = app['status'] ?? 'Applied';

            Color statusColor;
            switch (status) {
              case 'Selected': statusColor = _success; break;
              case 'Rejected': statusColor = _danger;  break;
              default:          statusColor = _warning;
            }

            return Container(
              margin: const EdgeInsets.only(bottom: 10),
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
              decoration: BoxDecoration(
                color: _surface,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: Colors.grey.shade100),
                boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.03), blurRadius: 6, offset: const Offset(0, 2))],
              ),
              child: Row(
                children: [
                  Container(
                    width: 36, height: 36,
                    decoration: BoxDecoration(color: statusColor.withOpacity(0.1), shape: BoxShape.circle),
                    child: Icon(Icons.check_circle_outline, color: statusColor, size: 18),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(title, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: _text1)),
                        const SizedBox(height: 2),
                        Text(companyName, style: TextStyle(color: _text2, fontSize: 12, fontWeight: FontWeight.w500)),
                      ],
                    ),
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(color: statusColor.withOpacity(0.1), borderRadius: BorderRadius.circular(8)),
                    child: Text(
                      status.toUpperCase(),
                      style: TextStyle(color: statusColor, fontSize: 9, fontWeight: FontWeight.bold),
                    ),
                  ),
                ],
              ),
            );
          }).toList(),
        ],
      ),
    );
  }

  // ── 9. FLOATING BOTTOM NAV ─────────────────────────────────────────────────
  Widget _buildFloatingNav() {
    const tabs = <_NavTab>[
      _NavTab(icon: Icons.home_outlined,       activeIcon: Icons.home_rounded,       label: 'Home'),
      _NavTab(icon: Icons.work_outline,         activeIcon: Icons.work_rounded,       label: 'Jobs'),
      _NavTab(icon: Icons.quiz_outlined,        activeIcon: Icons.quiz_rounded,       label: 'Practice'),
      _NavTab(icon: Icons.video_call_outlined,  activeIcon: Icons.video_call_rounded, label: 'Interviews'),
      _NavTab(icon: Icons.person_outline,       activeIcon: Icons.person_rounded,     label: 'Profile'),
    ];

    return SafeArea(
      child: Container(
        margin: const EdgeInsets.fromLTRB(16, 0, 16, 12),
        height: 64,
        decoration: BoxDecoration(
          color: _surface,
          borderRadius: BorderRadius.circular(24),
          boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.1), blurRadius: 20, offset: const Offset(0, 4))],
          border: Border.all(color: Colors.grey.shade100),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceEvenly,
          children: List.generate(tabs.length, (i) {
            final tab        = tabs[i];
            final isSelected = _currentIndex == i;
            return InkWell(
              onTap: () {
                setState(() => _currentIndex = i);
                switch (i) {
                  case 0: break;
                  case 1: Navigator.pushNamed(context, '/jobs');             break;
                  case 2: Navigator.pushNamed(context, '/preparation');      break;
                  case 3: Navigator.pushNamed(context, '/interviews');        break;
                  case 4: Navigator.pushNamed(context, '/profile');           break;
                }
              },
              borderRadius: BorderRadius.circular(18),
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 200),
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                decoration: BoxDecoration(
                  color: isSelected ? _primary.withOpacity(0.1) : Colors.transparent,
                  borderRadius: BorderRadius.circular(18),
                ),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(
                      isSelected ? tab.activeIcon : tab.icon,
                      color: isSelected ? _primary : const Color(0xFF9CA3AF),
                      size: 22,
                    ),
                    if (isSelected) ...[
                      const SizedBox(height: 2),
                      Text(tab.label, style: const TextStyle(color: _primary, fontSize: 9, fontWeight: FontWeight.bold)),
                    ],
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
  final String   label;
  final String   value;
  const _MiniStat({required this.icon, required this.label, required this.value});

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(icon, size: 11, color: Colors.white70),
        const SizedBox(width: 4),
        Text(value, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 12)),
        const SizedBox(width: 4),
        Text(label, style: TextStyle(color: Colors.white.withOpacity(0.7), fontSize: 10)),
      ],
    );
  }
}

/// Today's Focus card
class _FocusCard extends StatelessWidget {
  final IconData   icon;
  final Color      iconBg;
  final Color      iconColor;
  final String     title;
  final String     tag;
  final Color      tagColor;
  final VoidCallback onTap;

  const _FocusCard({
    required this.icon, required this.iconBg, required this.iconColor,
    required this.title, required this.tag, required this.tagColor,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: 152,
        margin: const EdgeInsets.only(right: 12),
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: Colors.grey.shade100),
          boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 10, offset: const Offset(0, 4))],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Container(
              width: 36, height: 36,
              decoration: BoxDecoration(color: iconBg, borderRadius: BorderRadius.circular(10)),
              child: Icon(icon, color: iconColor, size: 18),
            ),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: Color(0xFF111827))),
                const SizedBox(height: 3),
                Row(
                  children: [
                    Expanded(
                      child: Text(tag, style: TextStyle(fontSize: 10, color: tagColor, fontWeight: FontWeight.w600), overflow: TextOverflow.ellipsis),
                    ),
                    Icon(Icons.arrow_forward, size: 12, color: tagColor),
                  ],
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

/// Quick Action data model
class _QA {
  final IconData icon;
  final String   label;
  final Color    color;
  final String   route;
  const _QA({required this.icon, required this.label, required this.color, required this.route});
}

/// Nav tab data model
class _NavTab {
  final IconData icon;
  final IconData activeIcon;
  final String   label;
  const _NavTab({required this.icon, required this.activeIcon, required this.label});
}

/// Shimmer skeleton box
class _ShimmerBox extends StatefulWidget {
  final double  height;
  final double  radius;
  final EdgeInsets margin;
  const _ShimmerBox({required this.height, required this.radius, required this.margin});

  @override
  State<_ShimmerBox> createState() => _ShimmerBoxState();
}

class _ShimmerBoxState extends State<_ShimmerBox> with SingleTickerProviderStateMixin {
  late AnimationController _ctrl;
  late Animation<double>   _anim;

  @override
  void initState() {
    super.initState();
    _ctrl = AnimationController(vsync: this, duration: const Duration(milliseconds: 1200))
      ..repeat(reverse: true);
    _anim = CurvedAnimation(parent: _ctrl, curve: Curves.easeInOut);
  }

  @override
  void dispose() { _ctrl.dispose(); super.dispose(); }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _anim,
      builder: (_, __) => Container(
        height: widget.height,
        margin: widget.margin,
        decoration: BoxDecoration(
          color: Color.lerp(const Color(0xFFE5E7EB), const Color(0xFFF3F4F6), _anim.value),
          borderRadius: BorderRadius.circular(widget.radius),
        ),
      ),
    );
  }
}

/// Pill badge used in job list
class _JobPill extends StatelessWidget {
  final String text;
  const _JobPill({required this.text});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(color: const Color(0xFFF3F4F6), borderRadius: BorderRadius.circular(8)),
      child: Text(text, style: const TextStyle(color: Color(0xFF4B5563), fontSize: 11, fontWeight: FontWeight.w500)),
    );
  }
}
