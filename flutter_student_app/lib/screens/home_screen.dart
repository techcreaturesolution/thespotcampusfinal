import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import '../services/auth_service.dart';
import '../services/api_service.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  int _currentIndex = 0;
  List<dynamic> _jobs = [];
  List<dynamic> _applications = [];
  List<dynamic> _interviews = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _fetchDashboardData();
  }

  Future<void> _fetchDashboardData() async {
    try {
      final api = Provider.of<ApiService>(context, listen: false);
      final results = await Future.wait([
        api.get('/jobs/student'),
        api.get('/application/student'),
        api.get('/interviews/student'),
      ]);
      setState(() {
        _jobs = results[0]['jobs'] ?? [];
        _applications = results[1]['applications'] ?? [];
        _interviews = results[2]['interviews'] ?? [];
        _isLoading = false;
      });
    } catch (e) {
      setState(() => _isLoading = false);
    }
  }

  int _calculateProfileCompleteness(Map<String, dynamic>? user) {
    if (user == null) return 0;
    int filledFields = 0;
    int totalFields = 8;
    if (user['student_name'] != null && user['student_name'].toString().isNotEmpty) filledFields++;
    if (user['student_email'] != null && user['student_email'].toString().isNotEmpty) filledFields++;
    if (user['student_contact'] != null && user['student_contact'].toString().isNotEmpty) filledFields++;
    if (user['student_enrollment'] != null && user['student_enrollment'].toString().isNotEmpty) filledFields++;
    if (user['student_skills'] != null && user['student_skills'].toString().isNotEmpty) filledFields++;
    if (user['student_current_sem'] != null && user['student_current_sem'].toString().isNotEmpty) filledFields++;
    if (user['branch_id'] != null) filledFields++;
    if (user['degree_id'] != null) filledFields++;
    return ((filledFields / totalFields) * 100).toInt();
  }

  Map<String, dynamic>? _getUpcomingInterview() {
    final scheduled = _interviews.where((i) => i['status'] == 'scheduled' || i['status'] == 'in_progress').toList();
    if (scheduled.isEmpty) return null;
    try {
      scheduled.sort((a, b) {
        final aTime = DateTime.parse(a['scheduled_at'] ?? '');
        final bTime = DateTime.parse(b['scheduled_at'] ?? '');
        return aTime.compareTo(bTime);
      });
    } catch (e) {
      // ignore
    }
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
          if (mounted) {
            Navigator.pushNamed(context, '/plans');
          }
        });
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed: ${e.toString().replaceAll('Exception: ', '')}'), backgroundColor: Colors.red),
        );
      }
    }
  }

  String _formatInterviewTime(String? scheduledAtStr) {
    if (scheduledAtStr == null) return '-';
    try {
      final dateTime = DateTime.parse(scheduledAtStr).toLocal();
      return DateFormat('MMM dd, hh:mm a').format(dateTime);
    } catch (e) {
      return '-';
    }
  }

  @override
  Widget build(BuildContext context) {
    final auth = Provider.of<AuthService>(context);
    final user = auth.user;
    final completeness = _calculateProfileCompleteness(user);
    final upcomingInterview = _getUpcomingInterview();

    final scheduledCount = _interviews.where((i) => i['status'] == 'scheduled' || i['status'] == 'in_progress').length;

    return Scaffold(
      backgroundColor: const Color(0xFFF9FAFB),
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        scrolledUnderElevation: 0,
        automaticallyImplyLeading: false,
        title: Align(
          alignment: Alignment.centerLeft,
          child: Image.asset(
            'assets/images/logo_TSC.png',
            height: 32,
            fit: BoxFit.contain,
          ),
        ),
        actions: [
          Padding(
            padding: const EdgeInsets.only(right: 16.0),
            child: CircleAvatar(
              radius: 18,
              backgroundColor: const Color(0xFF2563EB).withOpacity(0.1),
              child: Text(
                auth.userName.isNotEmpty ? auth.userName[0].toUpperCase() : 'S',
                style: const TextStyle(
                  color: Color(0xFF2563EB),
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
          ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: _fetchDashboardData,
              child: SingleChildScrollView(
                physics: const AlwaysScrollableScrollPhysics(),
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Welcome & Completeness Card
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.all(20),
                      decoration: BoxDecoration(
                        gradient: const LinearGradient(
                          colors: [Color(0xFF2563EB), Color(0xFF4F46E5)],
                          begin: Alignment.topLeft,
                          end: Alignment.bottomRight,
                        ),
                        borderRadius: BorderRadius.circular(24),
                        boxShadow: [
                          BoxShadow(
                            color: const Color(0xFF2563EB).withOpacity(0.3),
                            blurRadius: 16,
                            offset: const Offset(0, 8),
                          ),
                        ],
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Hello, ${auth.userName}!',
                            style: const TextStyle(
                              fontSize: 24,
                              fontWeight: FontWeight.bold,
                              color: Colors.white,
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            'Your dream career starts here.',
                            style: TextStyle(
                              fontSize: 14,
                              color: Colors.white.withOpacity(0.85),
                            ),
                          ),
                          const SizedBox(height: 20),
                          Container(
                            padding: const EdgeInsets.all(12),
                            decoration: BoxDecoration(
                              color: Colors.white.withValues(alpha: 0.15),
                              borderRadius: BorderRadius.circular(16),
                            ),
                            child: Row(
                              children: [
                                TweenAnimationBuilder<double>(
                                  duration: const Duration(milliseconds: 1500),
                                  curve: Curves.easeOutCubic,
                                  tween: Tween<double>(begin: 0.0, end: completeness / 100.0),
                                  builder: (context, value, child) {
                                    final percentageText = (value * 100).toInt();
                                    return Stack(
                                      alignment: Alignment.center,
                                      children: [
                                        SizedBox(
                                          width: 48,
                                          height: 48,
                                          child: CircularProgressIndicator(
                                            value: value,
                                            backgroundColor: Colors.white.withValues(alpha: 0.2),
                                            valueColor: const AlwaysStoppedAnimation<Color>(Colors.white),
                                            strokeWidth: 4,
                                          ),
                                        ),
                                        Text(
                                          '$percentageText%',
                                          style: const TextStyle(
                                            color: Colors.white,
                                            fontSize: 10,
                                            fontWeight: FontWeight.bold,
                                          ),
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
                                      const Text(
                                        'Profile Complete',
                                        style: TextStyle(
                                          color: Colors.white,
                                          fontWeight: FontWeight.bold,
                                          fontSize: 14,
                                        ),
                                      ),
                                      const SizedBox(height: 2),
                                      Text(
                                        completeness == 100
                                            ? 'Great! Your profile is fully complete.'
                                            : 'Add more details in profile to hit 100%',
                                        style: TextStyle(
                                          color: Colors.white.withOpacity(0.8),
                                          fontSize: 11,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 24),

                    // Quick Actions
                    const Text(
                      'Quick Actions',
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                        color: Color(0xFF1F2937),
                      ),
                    ),
                    const SizedBox(height: 12),
                    GridView.count(
                      crossAxisCount: 3,
                      shrinkWrap: true,
                      physics: const NeverScrollableScrollPhysics(),
                      mainAxisSpacing: 12,
                      crossAxisSpacing: 12,
                      childAspectRatio: 1.0,
                      children: [
                        _QuickActionCard(
                          icon: Icons.work_outline,
                          title: 'Browse Jobs',
                          subtitle: '${_jobs.length}+ New',
                          color: const Color(0xFF2563EB),
                          onTap: () async {
                            await Navigator.pushNamed(context, '/jobs');
                            _fetchDashboardData();
                          },
                        ),
                        _QuickActionCard(
                          icon: Icons.assignment_outlined,
                          title: 'My Applications',
                          subtitle: '${_applications.length} Active',
                          color: const Color(0xFF7C3AED),
                          onTap: () async {
                            await Navigator.pushNamed(context, '/my-applications');
                            _fetchDashboardData();
                          },
                        ),
                        _QuickActionCard(
                          icon: Icons.quiz_outlined,
                          title: 'Exams',
                          subtitle: 'Next: Tomorrow',
                          color: const Color(0xFFD97706),
                          onTap: () async {
                            await Navigator.pushNamed(context, '/my-applications');
                            _fetchDashboardData();
                          },
                        ),
                        _QuickActionCard(
                          icon: Icons.video_call_outlined,
                          title: 'Interviews',
                          subtitle: '$scheduledCount Scheduled',
                          color: const Color(0xFFDC2626),
                          onTap: () async {
                            await Navigator.pushNamed(context, '/interviews');
                            _fetchDashboardData();
                          },
                        ),
                        _QuickActionCard(
                          icon: Icons.menu_book_outlined,
                          title: 'Preparation',
                          subtitle: 'Practice Now',
                          color: const Color(0xFF059669),
                          onTap: () async {
                            await Navigator.pushNamed(context, '/preparation');
                            _fetchDashboardData();
                          },
                        ),
                        _QuickActionCard(
                          icon: Icons.bolt_outlined,
                          title: 'Daily Challenge',
                          subtitle: '10 Questions',
                          color: const Color(0xFFEA580C),
                          onTap: () async {
                            await Navigator.pushNamed(context, '/preparation/daily-challenge');
                            _fetchDashboardData();
                          },
                        ),
                      ],
                    ),
                    const SizedBox(height: 24),

                    // Upcoming Interview Section
                    const Text(
                      'Upcoming Interview',
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                        color: Color(0xFF1F2937),
                      ),
                    ),
                    const SizedBox(height: 12),
                    Card(
                      child: Padding(
                        padding: const EdgeInsets.all(16),
                        child: upcomingInterview == null
                            ? const Row(
                                children: [
                                  Icon(Icons.calendar_today, color: Colors.grey),
                                  SizedBox(width: 12),
                                  Text(
                                    'No upcoming interviews scheduled',
                                    style: TextStyle(color: Colors.grey, fontSize: 14),
                                  ),
                                ],
                              )
                            : Row(
                                children: [
                                  Container(
                                    width: 48,
                                    height: 48,
                                    decoration: BoxDecoration(
                                      color: const Color(0xFFF3F4F6),
                                      borderRadius: BorderRadius.circular(12),
                                    ),
                                    child: Center(
                                      child: Text(
                                        upcomingInterview['company_id']?['company_name']?[0].toUpperCase() ?? 'I',
                                        style: const TextStyle(
                                          fontSize: 20,
                                          fontWeight: FontWeight.bold,
                                          color: Color(0xFF4B5563),
                                        ),
                                      ),
                                    ),
                                  ),
                                  const SizedBox(width: 12),
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Row(
                                          children: [
                                            Expanded(
                                              child: Text(
                                                upcomingInterview['job_id']?['job_title'] ?? 'Interview Round',
                                                style: const TextStyle(
                                                  fontWeight: FontWeight.bold,
                                                  fontSize: 14,
                                                ),
                                                overflow: TextOverflow.ellipsis,
                                              ),
                                            ),
                                            const SizedBox(width: 4),
                                            Container(
                                              padding: const EdgeInsets.symmetric(
                                                horizontal: 6,
                                                vertical: 2,
                                              ),
                                              decoration: BoxDecoration(
                                                color: const Color(0xFFF3E8FF),
                                                borderRadius: BorderRadius.circular(6),
                                              ),
                                              child: const Text(
                                                'ONLINE',
                                                style: TextStyle(
                                                  color: Color(0xFF7E22CE),
                                                  fontSize: 9,
                                                  fontWeight: FontWeight.bold,
                                                ),
                                              ),
                                            ),
                                          ],
                                        ),
                                        const SizedBox(height: 4),
                                        Text(
                                          '${upcomingInterview['company_id']?['company_name'] ?? 'Company'} • ${_formatInterviewTime(upcomingInterview['scheduled_at'])}',
                                          style: TextStyle(
                                            color: Colors.grey.shade600,
                                            fontSize: 12,
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                  const SizedBox(width: 8),
                                  GestureDetector(
                                    onTap: () => Navigator.pushNamed(context, '/interviews'),
                                    child: Container(
                                      width: 36,
                                      height: 36,
                                      decoration: const BoxDecoration(
                                        color: Color(0xFF2563EB),
                                        shape: BoxShape.circle,
                                      ),
                                      child: const Icon(
                                        Icons.arrow_forward,
                                        color: Colors.white,
                                        size: 18,
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                      ),
                    ),
                    const SizedBox(height: 24),

                    // Recommended Jobs Section
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text(
                          'Recommended Jobs',
                          style: TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                            color: Color(0xFF1F2937),
                          ),
                        ),
                        TextButton(
                          onPressed: () async {
                            await Navigator.pushNamed(context, '/jobs');
                            _fetchDashboardData();
                          },
                          child: const Text(
                            'View all',
                            style: TextStyle(
                              color: Color(0xFF2563EB),
                              fontWeight: FontWeight.bold,
                              fontSize: 14,
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 4),
                    _jobs.isEmpty
                        ? Container(
                            width: double.infinity,
                            padding: const EdgeInsets.symmetric(vertical: 24),
                            alignment: Alignment.center,
                            child: Text(
                              'No jobs recommended at this moment.',
                              style: TextStyle(color: Colors.grey.shade500),
                            ),
                          )
                        : SizedBox(
                            height: 185,
                            child: ListView.builder(
                              scrollDirection: Axis.horizontal,
                              itemCount: _jobs.length.clamp(0, 5),
                              itemBuilder: (context, index) {
                                final job = _jobs[index];
                                final companyVal = job['job_company_id'];
                                final companyName = companyVal is Map ? (companyVal['company_name'] ?? 'Company') : 'Company';
                                final city = job['job_location']?['city'] ?? 'India';
                                final salary = job['job_salary'] ?? 'Competitive';
                                final hasApplied = _applications.any((app) {
                                  final jobIdVal = app['job_id'];
                                  if (jobIdVal is Map) {
                                    return jobIdVal['_id'] == job['_id'];
                                  } else if (jobIdVal is String) {
                                    return jobIdVal == job['_id'];
                                  }
                                  return false;
                                });

                                return GestureDetector(
                                  onTap: () async {
                                    await Navigator.pushNamed(context, '/job-detail', arguments: job['_id']);
                                    _fetchDashboardData();
                                  },
                                  child: Container(
                                    width: 280,
                                    margin: const EdgeInsets.only(right: 16, bottom: 4),
                                    padding: const EdgeInsets.all(16),
                                    decoration: BoxDecoration(
                                      color: Colors.white,
                                      borderRadius: BorderRadius.circular(16),
                                      border: Border.all(color: Colors.grey.shade200),
                                      boxShadow: [
                                        BoxShadow(
                                          color: Colors.black.withOpacity(0.02),
                                          blurRadius: 6,
                                          offset: const Offset(0, 4),
                                        ),
                                      ],
                                    ),
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                      children: [
                                        Row(
                                          crossAxisAlignment: CrossAxisAlignment.start,
                                          children: [
                                            Container(
                                              width: 40,
                                              height: 40,
                                              decoration: BoxDecoration(
                                                color: const Color(0xFFEFF6FF),
                                                borderRadius: BorderRadius.circular(10),
                                              ),
                                              child: Center(
                                                child: Text(
                                                  companyName[0].toUpperCase(),
                                                  style: const TextStyle(
                                                    fontWeight: FontWeight.bold,
                                                    color: Color(0xFF2563EB),
                                                    fontSize: 16,
                                                  ),
                                                ),
                                              ),
                                            ),
                                            const SizedBox(width: 12),
                                            Expanded(
                                              child: Column(
                                                crossAxisAlignment: CrossAxisAlignment.start,
                                                children: [
                                                  Text(
                                                    job['job_title'] ?? 'Opening',
                                                    maxLines: 1,
                                                    overflow: TextOverflow.ellipsis,
                                                    style: const TextStyle(
                                                      fontWeight: FontWeight.bold,
                                                      fontSize: 14,
                                                    ),
                                                  ),
                                                  const SizedBox(height: 2),
                                                  Text(
                                                    '$companyName • $city',
                                                    maxLines: 1,
                                                    overflow: TextOverflow.ellipsis,
                                                    style: TextStyle(
                                                      color: Colors.grey.shade600,
                                                      fontSize: 12,
                                                    ),
                                                  ),
                                                ],
                                              ),
                                            ),
                                          ],
                                        ),
                                        Row(
                                          children: [
                                            _JobPill(text: job['job_type'] ?? 'Full-time'),
                                            const SizedBox(width: 8),
                                            _JobPill(text: job['job_work_mode'] ?? 'Remote'),
                                          ],
                                        ),
                                        Row(
                                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                          children: [
                                            Text(
                                              salary,
                                              style: const TextStyle(
                                                fontWeight: FontWeight.bold,
                                                fontSize: 13,
                                                color: Color(0xFF1F2937),
                                              ),
                                            ),
                                            SizedBox(
                                              height: 32,
                                              child: ElevatedButton(
                                                style: ElevatedButton.styleFrom(
                                                  backgroundColor: hasApplied ? Colors.grey.shade100 : const Color(0xFF2563EB),
                                                  foregroundColor: hasApplied ? Colors.grey.shade600 : Colors.white,
                                                  elevation: 0,
                                                  padding: const EdgeInsets.symmetric(horizontal: 16),
                                                  shape: RoundedRectangleBorder(
                                                    borderRadius: BorderRadius.circular(20),
                                                  ),
                                                ),
                                                onPressed: hasApplied
                                                    ? null
                                                    : () => _applyForJob(job['_id']),
                                                child: Text(
                                                  hasApplied ? 'Applied' : 'Apply',
                                                  style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold),
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
                    const SizedBox(height: 24),

                    // Applied Jobs Section
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text(
                          'Applied Jobs',
                          style: TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                            color: Color(0xFF1F2937),
                          ),
                        ),
                        TextButton(
                          onPressed: () async {
                            await Navigator.pushNamed(context, '/my-applications');
                            _fetchDashboardData();
                          },
                          child: const Text(
                            'View all',
                            style: TextStyle(
                              color: Color(0xFF2563EB),
                              fontWeight: FontWeight.bold,
                              fontSize: 14,
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 4),
                    _applications.isEmpty
                        ? Container(
                            width: double.infinity,
                            padding: const EdgeInsets.symmetric(vertical: 20, horizontal: 16),
                            decoration: BoxDecoration(
                              color: Colors.white,
                              borderRadius: BorderRadius.circular(16),
                              border: Border.all(color: Colors.grey.shade200),
                            ),
                            child: Center(
                              child: Text(
                                'You haven\'t applied to any jobs yet.',
                                style: TextStyle(color: Colors.grey.shade500, fontSize: 13),
                              ),
                            ),
                          )
                        : Column(
                            children: _applications.take(3).map<Widget>((app) {
                              final jobVal = app['job_id'];
                              final job = jobVal is Map ? jobVal : null;
                              final companyVal = job?['job_company_id'];
                              final companyName = companyVal is Map ? (companyVal['company_name'] ?? 'Company') : 'Company';
                              final title = job?['job_title'] ?? 'Job';
                              final status = app['status'] ?? 'Applied';

                              Color statusColor;
                              switch (status) {
                                case 'Selected':
                                  statusColor = const Color(0xFF059669);
                                  break;
                                case 'Rejected':
                                  statusColor = const Color(0xFFDC2626);
                                  break;
                                default:
                                  statusColor = const Color(0xFFD97706);
                              }

                              return Container(
                                margin: const EdgeInsets.only(bottom: 12),
                                padding: const EdgeInsets.all(16),
                                decoration: BoxDecoration(
                                  color: Colors.white,
                                  borderRadius: BorderRadius.circular(16),
                                  border: Border.all(color: Colors.grey.shade200),
                                ),
                                child: Row(
                                  children: [
                                    Container(
                                      width: 36,
                                      height: 36,
                                      decoration: BoxDecoration(
                                        color: statusColor.withOpacity(0.1),
                                        shape: BoxShape.circle,
                                      ),
                                      child: Icon(
                                        Icons.check_circle_outline,
                                        color: statusColor,
                                        size: 20,
                                      ),
                                    ),
                                    const SizedBox(width: 12),
                                    Expanded(
                                      child: Column(
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        children: [
                                          Text(
                                            title,
                                            style: const TextStyle(
                                              fontWeight: FontWeight.bold,
                                              fontSize: 14,
                                            ),
                                          ),
                                          const SizedBox(height: 2),
                                          Text(
                                            companyName,
                                            style: TextStyle(
                                              color: Colors.grey.shade600,
                                              fontSize: 12,
                                              fontWeight: FontWeight.w500,
                                            ),
                                          ),
                                        ],
                                      ),
                                    ),
                                    Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                      decoration: BoxDecoration(
                                        color: statusColor.withOpacity(0.1),
                                        borderRadius: BorderRadius.circular(6),
                                      ),
                                      child: Text(
                                        status.toUpperCase(),
                                        style: TextStyle(
                                          color: statusColor,
                                          fontSize: 10,
                                          fontWeight: FontWeight.bold,
                                        ),
                                      ),
                                    ),
                                  ],
                                ),
                              );
                            }).toList(),
                          ),

                  ],
                ),
              ),
            ),
      bottomNavigationBar: SafeArea(
        child: Container(
          margin: const EdgeInsets.fromLTRB(24, 0, 24, 16),
          height: 64,
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(24),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.06),
                blurRadius: 16,
                offset: const Offset(0, 4),
              ),
            ],
            border: Border.all(color: Colors.grey.shade200),
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceEvenly,
            children: [
              _buildFloatingTabItem(0, Icons.home_outlined, Icons.home, 'Home'),
              _buildFloatingTabItem(1, Icons.work_outline, Icons.work, 'Jobs'),
              _buildFloatingTabItem(2, Icons.quiz_outlined, Icons.quiz, 'Exams'),
              _buildFloatingTabItem(3, Icons.video_call_outlined, Icons.video_call, 'Interviews'),
              _buildFloatingTabItem(4, Icons.person_outline, Icons.person, 'Profile'),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildFloatingTabItem(int index, IconData icon, IconData activeIcon, String label) {
    final isSelected = _currentIndex == index;
    final activeColor = const Color(0xFF2563EB);
    final inactiveColor = const Color(0xFF4B5563);

    return InkWell(
      onTap: () {
        setState(() => _currentIndex = index);
        switch (index) {
          case 0:
            break;
          case 1:
            Navigator.pushNamed(context, '/jobs');
            break;
          case 2:
            Navigator.pushNamed(context, '/my-applications');
            break;
          case 3:
            Navigator.pushNamed(context, '/interviews');
            break;
          case 4:
            Navigator.pushNamed(context, '/profile');
            break;
        }
      },
      borderRadius: BorderRadius.circular(20),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        child: Icon(
          isSelected ? activeIcon : icon,
          color: isSelected ? activeColor : inactiveColor,
          size: 24,
        ),
      ),
    );
  }
}

class _QuickActionCard extends StatelessWidget {
  final IconData icon;
  final String title;
  final String subtitle;
  final Color color;
  final VoidCallback onTap;

  const _QuickActionCard({
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.color,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      elevation: 0,
      margin: EdgeInsets.zero,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
        side: BorderSide(color: Colors.grey.shade100),
      ),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(16),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: color.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Icon(icon, color: color, size: 20),
              ),
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: const TextStyle(
                      fontWeight: FontWeight.bold,
                      fontSize: 14,
                      color: Color(0xFF1F2937),
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    subtitle,
                    style: TextStyle(
                      fontSize: 12,
                      color: color,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _JobPill extends StatelessWidget {
  final String text;
  const _JobPill({required this.text});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: const Color(0xFFF3F4F6),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Text(
        text,
        style: const TextStyle(
          color: Color(0xFF4B5563),
          fontSize: 11,
          fontWeight: FontWeight.w500,
        ),
      ),
    );
  }
}
