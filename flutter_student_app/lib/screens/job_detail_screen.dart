import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../services/api_service.dart';

class JobDetailScreen extends StatefulWidget {
  final String jobId;
  const JobDetailScreen({super.key, required this.jobId});

  @override
  State<JobDetailScreen> createState() => _JobDetailScreenState();
}

class _JobDetailScreenState extends State<JobDetailScreen> {
  Map<String, dynamic>? _job;
  bool _loading = true;
  bool _applied = false;

  @override
  void initState() {
    super.initState();
    _fetchJob();
  }

  Future<void> _fetchJob() async {
    try {
      final api = Provider.of<ApiService>(context, listen: false);

      // Fetch both job details and user applications in parallel
      final results = await Future.wait([
        api.get('/jobs/${widget.jobId}'),
        api.get('/application/student'),
      ]);

      final jobData = results[0];
      final appsData = results[1];

      final jobMap = jobData['job'];
      final appsList = appsData['applications'] as List? ?? [];

      // Robust applied check: True if backend flag is set OR if client finds it in applications
      final isAppliedBackend = jobMap?['isApplied'] ?? false;
      final isAppliedClient = appsList.any((app) {
        final jobIdVal = app['job_id'];
        if (jobIdVal is Map) {
          return jobIdVal['_id'] == widget.jobId;
        } else if (jobIdVal is String) {
          return jobIdVal == widget.jobId;
        }
        return false;
      });

      setState(() {
        _job = jobMap;
        _applied = isAppliedBackend || isAppliedClient;
        _loading = false;
      });
    } catch (e) {
      setState(() => _loading = false);
    }
  }

  Future<void> _applyJob() async {
    try {
      final api = Provider.of<ApiService>(context, listen: false);
      await api.post('/application/${widget.jobId}', {});
      setState(() {
        _applied = true;
      });
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Applied successfully!'),
          backgroundColor: Colors.green,
          behavior: SnackBarBehavior.floating,
        ),
      );
    } catch (e) {
      final errorStr = e.toString().toLowerCase();
      if (errorStr.contains('subscription') || errorStr.contains('payment')) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text(
                'An active subscription plan is required to apply. Redirecting to plans...'),
            backgroundColor: Colors.orange,
            behavior: SnackBarBehavior.floating,
          ),
        );
        Future.delayed(const Duration(seconds: 1), () {
          if (mounted) {
            Navigator.pushNamed(context, '/plans');
          }
        });
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(e.toString().replaceAll('Exception: ', '')),
            backgroundColor: Colors.red,
            behavior: SnackBarBehavior.floating,
          ),
        );
      }
    }
  }

  List<String> _parseSkills(String? skillsStr) {
    if (skillsStr == null || skillsStr.trim().isEmpty) return [];
    return skillsStr
        .split(',')
        .map((s) => s.trim())
        .where((s) => s.isNotEmpty)
        .toList();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC), // Slate 50 background
      appBar: AppBar(
        backgroundColor: const Color(0xFF1E3A8A), // Match gradient start
        elevation: 0,
        scrolledUnderElevation: 0,
        iconTheme: const IconThemeData(color: Colors.white),
        title: const Text(
          'Job Details',
          style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
        ),
        centerTitle: true,
      ),
      body: _loading
          ? const Center(
              child: CircularProgressIndicator(color: Color(0xFF2563EB)))
          : _job == null
              ? const Center(
                  child: Text('Job not found',
                      style:
                          TextStyle(fontSize: 16, fontWeight: FontWeight.bold)))
              : Stack(
                  children: [
                    // Main Content
                    SingleChildScrollView(
                      physics: const BouncingScrollPhysics(),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          // 1. Gradient Header Area
                          Container(
                            width: double.infinity,
                            decoration: const BoxDecoration(
                              gradient: LinearGradient(
                                begin: Alignment.topCenter,
                                end: Alignment.bottomCenter,
                                colors: [Color(0xFF1E3A8A), Color(0xFF0F172A)],
                              ),
                            ),
                            padding: const EdgeInsets.fromLTRB(20, 16, 20, 36),
                            child: Column(
                              children: [
                                // Company Logo Avatar
                                _buildCompanyLogo(
                                    _job!['job_company_id']?['company_name'],
                                    _job!['job_company_id']?['company_logo']),
                                const SizedBox(height: 16),

                                // Job Title
                                Text(
                                  _job!['job_title'] ?? '',
                                  textAlign: TextAlign.center,
                                  style: const TextStyle(
                                    fontSize: 24,
                                    fontWeight: FontWeight.bold,
                                    color: Colors.white,
                                    letterSpacing: -0.5,
                                  ),
                                ),
                                const SizedBox(height: 8),

                                // Company Name
                                Text(
                                  _job!['job_company_id']?['company_name'] ??
                                      'Company Name',
                                  textAlign: TextAlign.center,
                                  style: const TextStyle(
                                    fontSize: 16,
                                    color: Color(0xFFCBD5E1), // Slate 300
                                    fontWeight: FontWeight.w500,
                                  ),
                                ),
                                const SizedBox(height: 16),

                                // Chips Wrap
                                Wrap(
                                  spacing: 8,
                                  runSpacing: 8,
                                  alignment: WrapAlignment.center,
                                  children: [
                                    _buildHeaderChip(
                                        _job!['job_type'] ?? 'Full-time',
                                        const Color(0xFF3B82F6)),
                                    _buildHeaderChip(
                                        _job!['job_work_mode'] ?? 'In Office',
                                        const Color(0xFF10B981)),
                                  ],
                                ),
                              ],
                            ),
                          ),

                          // 2. Info Cards Grid (Salary, Location, Exp, Openings)
                          Padding(
                            padding: const EdgeInsets.fromLTRB(16, 20, 16, 8),
                            child: GridView.count(
                              crossAxisCount: 2,
                              shrinkWrap: true,
                              physics: const NeverScrollableScrollPhysics(),
                              crossAxisSpacing: 12,
                              mainAxisSpacing: 12,
                              childAspectRatio: 2.2,
                              children: [
                                _buildInfoCard(
                                  icon: Icons.currency_rupee_outlined,
                                  title: 'SALARY',
                                  value: _job!['job_salary'] ?? 'Not Disclosed',
                                ),
                                _buildInfoCard(
                                  icon: Icons.location_on_outlined,
                                  title: 'LOCATION',
                                  value: _job!['job_location'] != null
                                      ? '${_job!['job_location']['city'] ?? 'Remote'}'
                                      : 'Remote',
                                ),
                                _buildInfoCard(
                                  icon: Icons.work_outline,
                                  title: 'EXPERIENCE',
                                  value: _job!['job_exp'] ?? 'Freshers',
                                ),
                                _buildInfoCard(
                                  icon: Icons.people_outline,
                                  title: 'OPENINGS',
                                  value: _job!['job_noofposition'] ?? 'N/A',
                                ),
                              ],
                            ),
                          ),

                          // 3. Description & Skills
                          Padding(
                            padding: const EdgeInsets.symmetric(
                                horizontal: 16, vertical: 12),
                            child: Card(
                              elevation: 0,
                              color: Colors.white,
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(20),
                                side:
                                    const BorderSide(color: Color(0xFFF1F5F9)),
                              ),
                              child: Padding(
                                padding: const EdgeInsets.all(20),
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    // Description Section
                                    const Text(
                                      'Job Description',
                                      style: TextStyle(
                                        fontSize: 16,
                                        fontWeight: FontWeight.bold,
                                        color: Color(0xFF0F172A),
                                      ),
                                    ),
                                    const SizedBox(height: 10),
                                    Text(
                                      _job!['job_desc'] ??
                                          'No description provided.',
                                      style: const TextStyle(
                                        color: Color(0xFF475569),
                                        height: 1.5,
                                        fontSize: 14,
                                      ),
                                    ),
                                    const SizedBox(height: 24),

                                    // Skills Section
                                    const Text(
                                      'Skills Required',
                                      style: TextStyle(
                                        fontSize: 16,
                                        fontWeight: FontWeight.bold,
                                        color: Color(0xFF0F172A),
                                      ),
                                    ),
                                    const SizedBox(height: 12),
                                    Wrap(
                                      spacing: 8,
                                      runSpacing: 8,
                                      children:
                                          _parseSkills(_job!['job_skills'])
                                              .map((skill) {
                                        return Container(
                                          padding: const EdgeInsets.symmetric(
                                              horizontal: 14, vertical: 6),
                                          decoration: BoxDecoration(
                                            color: const Color(
                                                0xFFEFF6FF), // soft blue
                                            borderRadius:
                                                BorderRadius.circular(20),
                                          ),
                                          child: Text(
                                            skill,
                                            style: const TextStyle(
                                              color: Color(0xFF2563EB),
                                              fontWeight: FontWeight.bold,
                                              fontSize: 12,
                                            ),
                                          ),
                                        );
                                      }).toList(),
                                    ),
                                  ],
                                ),
                              ),
                            ),
                          ),

                          // 4. Recruitment Process (Multiple Rounds Timeline)
                          if (_job!['rounds'] != null &&
                              (_job!['rounds'] as List).isNotEmpty)
                            Padding(
                              padding: const EdgeInsets.symmetric(
                                  horizontal: 16, vertical: 8),
                              child: Card(
                                elevation: 0,
                                color: Colors.white,
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(20),
                                  side: const BorderSide(
                                      color: Color(0xFFF1F5F9)),
                                ),
                                child: Padding(
                                  padding: const EdgeInsets.all(20),
                                  child: Column(
                                    crossAxisAlignment:
                                        CrossAxisAlignment.start,
                                    children: [
                                      const Text(
                                        'Recruitment Process',
                                        style: TextStyle(
                                          fontSize: 16,
                                          fontWeight: FontWeight.bold,
                                          color: Color(0xFF0F172A),
                                        ),
                                      ),
                                      const SizedBox(height: 20),
                                      ...List.generate(
                                          (_job!['rounds'] as List).length,
                                          (index) {
                                        final round =
                                            (_job!['rounds'] as List)[index];
                                        return Row(
                                          crossAxisAlignment:
                                              CrossAxisAlignment.start,
                                          children: [
                                            // Timeline dot & line
                                            Column(
                                              children: [
                                                Container(
                                                  width: 24,
                                                  height: 24,
                                                  decoration: BoxDecoration(
                                                      color: const Color(
                                                          0xFF2563EB),
                                                      shape: BoxShape.circle,
                                                      border: Border.all(
                                                          color: Colors.white,
                                                          width: 3),
                                                      boxShadow: const [
                                                        BoxShadow(
                                                          color:
                                                              Color(0x332563EB),
                                                          blurRadius: 6,
                                                        )
                                                      ]),
                                                  child: Center(
                                                    child: Text(
                                                      '${round['round_number']}',
                                                      style: const TextStyle(
                                                        color: Colors.white,
                                                        fontSize: 10,
                                                        fontWeight:
                                                            FontWeight.bold,
                                                      ),
                                                    ),
                                                  ),
                                                ),
                                                if (index <
                                                    (_job!['rounds'] as List)
                                                            .length -
                                                        1)
                                                  Container(
                                                    width: 2,
                                                    height: 48,
                                                    color:
                                                        const Color(0xFFE2E8F0),
                                                  ),
                                              ],
                                            ),
                                            const SizedBox(width: 14),

                                            // Round Info
                                            Expanded(
                                              child: Column(
                                                crossAxisAlignment:
                                                    CrossAxisAlignment.start,
                                                children: [
                                                  Text(
                                                    round['round_name'] ??
                                                        'Round Name',
                                                    style: const TextStyle(
                                                      fontWeight:
                                                          FontWeight.bold,
                                                      fontSize: 14,
                                                      color: Color(0xFF0F172A),
                                                    ),
                                                  ),
                                                  const SizedBox(height: 2),
                                                  Text(
                                                    'Type: ${round['round_type']?.toString().replaceAll('_', ' ').toUpperCase()}',
                                                    style: const TextStyle(
                                                      color: Color(0xFF64748B),
                                                      fontSize: 11,
                                                      fontWeight:
                                                          FontWeight.w600,
                                                    ),
                                                  ),
                                                  if (round['round_description'] !=
                                                          null &&
                                                      round['round_description']
                                                          .toString()
                                                          .trim()
                                                          .isNotEmpty) ...[
                                                    const SizedBox(height: 6),
                                                    Text(
                                                      round[
                                                          'round_description'],
                                                      style: const TextStyle(
                                                        color:
                                                            Color(0xFF475569),
                                                        fontSize: 12,
                                                      ),
                                                    ),
                                                  ],
                                                  const SizedBox(height: 16),
                                                ],
                                              ),
                                            ),
                                          ],
                                        );
                                      }),
                                    ],
                                  ),
                                ),
                              ),
                            ),

                          // Leave space for floating action bar
                          const SizedBox(height: 100),
                        ],
                      ),
                    ),

                    // Bottom Floating Action Button Bar
                    Positioned(
                      bottom: 0,
                      left: 0,
                      right: 0,
                      child: Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 20, vertical: 16),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          border: Border(
                              top: BorderSide(color: Colors.grey.shade100)),
                          boxShadow: const [
                            BoxShadow(
                              color: Color(0x0F000000),
                              blurRadius: 10,
                              offset: Offset(0, -5),
                            )
                          ],
                        ),
                        child: SafeArea(
                          top: false,
                          child: _applied
                              ? Container(
                                  height: 52,
                                  decoration: BoxDecoration(
                                    color:
                                        const Color(0xFFD1FAE5), // Soft green
                                    borderRadius: BorderRadius.circular(26),
                                  ),
                                  child: const Center(
                                    child: Row(
                                      mainAxisAlignment:
                                          MainAxisAlignment.center,
                                      children: [
                                        Icon(Icons.check_circle_outline,
                                            color: Color(0xFF059669), size: 22),
                                        SizedBox(width: 8),
                                        Text(
                                          'Applied',
                                          style: TextStyle(
                                            color: Color(0xFF059669),
                                            fontSize: 16,
                                            fontWeight: FontWeight.bold,
                                            letterSpacing: 0.5,
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                )
                              : Container(
                                  height: 52,
                                  decoration: BoxDecoration(
                                    borderRadius: BorderRadius.circular(26),
                                    gradient: const LinearGradient(
                                      colors: [
                                        Color(0xFF2563EB),
                                        Color(0xFF1D4ED8)
                                      ],
                                    ),
                                    boxShadow: const [
                                      BoxShadow(
                                        color: Color(0x4D2563EB),
                                        blurRadius: 12,
                                        offset: Offset(0, 6),
                                      ),
                                    ],
                                  ),
                                  child: ElevatedButton(
                                    onPressed: _applyJob,
                                    style: ElevatedButton.styleFrom(
                                      backgroundColor: Colors.transparent,
                                      foregroundColor: Colors.white,
                                      shadowColor: Colors.transparent,
                                      shape: RoundedRectangleBorder(
                                        borderRadius: BorderRadius.circular(26),
                                      ),
                                    ),
                                    child: const Text(
                                      'Apply for this Job',
                                      style: TextStyle(
                                        fontSize: 16,
                                        fontWeight: FontWeight.bold,
                                        letterSpacing: 0.5,
                                      ),
                                    ),
                                  ),
                                ),
                        ),
                      ),
                    ),
                  ],
                ),
    );
  }

  Widget _buildCompanyLogo(String? companyName, String? logoUrl) {
    if (logoUrl != null && logoUrl.isNotEmpty) {
      return Container(
        padding: const EdgeInsets.all(3),
        decoration: const BoxDecoration(
            color: Colors.white,
            shape: BoxShape.circle,
            boxShadow: [
              BoxShadow(
                color: Color(0x1A000000),
                blurRadius: 12,
                offset: Offset(0, 4),
              )
            ]),
        child: CircleAvatar(
          radius: 36,
          backgroundColor: Colors.white,
          backgroundImage: NetworkImage(logoUrl),
        ),
      );
    }

    final name = companyName ?? 'C';
    return Container(
      decoration: const BoxDecoration(shape: BoxShape.circle, boxShadow: [
        BoxShadow(
          color: Color(0x1A000000),
          blurRadius: 12,
          offset: Offset(0, 4),
        )
      ]),
      child: CircleAvatar(
        radius: 36,
        backgroundColor: const Color(0xFF2563EB),
        child: Text(
          name.isNotEmpty ? name[0].toUpperCase() : 'C',
          style: const TextStyle(
              fontSize: 28, fontWeight: FontWeight.bold, color: Colors.white),
        ),
      ),
    );
  }

  Widget _buildHeaderChip(String label, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.18),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: color.withValues(alpha: 0.3), width: 1),
      ),
      child: Text(
        label,
        style:
            TextStyle(fontSize: 12, color: color, fontWeight: FontWeight.bold),
      ),
    );
  }

  Widget _buildInfoCard({
    required IconData icon,
    required String title,
    required String value,
  }) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFE2E8F0)), // Slate 200
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: const Color(0xFFF1F5F9), // Slate 100
              borderRadius: BorderRadius.circular(10),
            ),
            child: Icon(icon, color: const Color(0xFF2563EB), size: 20),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Text(
                  title,
                  style: const TextStyle(
                    color: Color(0xFF64748B), // Slate 500
                    fontSize: 9,
                    fontWeight: FontWeight.w700,
                    letterSpacing: 0.5,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  value,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    color: Color(0xFF0F172A), // Slate 900
                    fontSize: 13,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
