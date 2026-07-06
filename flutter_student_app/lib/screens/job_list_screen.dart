import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../services/auth_service.dart';
import '../services/api_service.dart';

class JobListScreen extends StatefulWidget {
  const JobListScreen({super.key});

  @override
  State<JobListScreen> createState() => _JobListScreenState();
}

class _JobListScreenState extends State<JobListScreen> {
  List<dynamic> _allJobs = [];
  List<dynamic> _filteredJobs = [];
  List<dynamic> _applications = [];
  bool _loading = true;
  String _search = '';
  String _selectedCategory = 'All Jobs';

  final List<String> _categories = [
    'All Jobs',
    'Full-time',
    'Internship',
    'Remote',
    'On-site',
  ];

  @override
  void initState() {
    super.initState();
    _fetchJobsAndApplications();
  }

  Future<void> _fetchJobsAndApplications() async {
    try {
      final api = Provider.of<ApiService>(context, listen: false);
      final results = await Future.wait([
        api.get('/jobs/student?search=$_search'),
        api.get('/application/student'),
      ]);
      setState(() {
        _allJobs = results[0]['jobs'] ?? [];
        _applications = results[1]['applications'] ?? [];
        _filterJobs();
        _loading = false;
      });
    } catch (e) {
      setState(() => _loading = false);
    }
  }

  void _filterJobs() {
    setState(() {
      _filteredJobs = _allJobs.where((job) {
        if (_selectedCategory == 'All Jobs') return true;
        if (_selectedCategory == 'Full-time') {
          return job['job_type']?.toString().toLowerCase() == 'full-time';
        }
        if (_selectedCategory == 'Internship') {
          return job['job_type']?.toString().toLowerCase() == 'internship';
        }
        if (_selectedCategory == 'Remote') {
          return job['job_work_mode']?.toString().toLowerCase() == 'remote';
        }
        if (_selectedCategory == 'On-site') {
          return job['job_work_mode']?.toString().toLowerCase() == 'onsite';
        }
        return true;
      }).toList();
    });
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
      _fetchJobsAndApplications();
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
          if (mounted) {
            Navigator.pushNamed(context, '/plans');
          }
        });
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
              content:
                  Text('Failed: ${e.toString().replaceAll('Exception: ', '')}'),
              backgroundColor: Colors.red),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final auth = Provider.of<AuthService>(context);

    final List<Map<String, dynamic>> categoryData = [
      {'name': 'All Jobs', 'icon': Icons.grid_view},
      {'name': 'Full-time', 'icon': Icons.business_center_outlined},
      {'name': 'Internship', 'icon': Icons.school_outlined},
      {'name': 'Remote', 'icon': Icons.wifi},
    ];

    return Scaffold(
      backgroundColor: const Color(0xFFF9FAFB),
      appBar: AppBar(
        backgroundColor: const Color(0xFFF9FAFB),
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
          IconButton(
            icon: const Icon(Icons.notifications_outlined, color: Colors.black87),
            onPressed: () {},
          ),
          Padding(
            padding: const EdgeInsets.only(right: 20.0, left: 8.0),
            child: CircleAvatar(
              radius: 18,
              backgroundColor: const Color(0xFFEFF6FF),
              child: Text(
                auth.userName.isNotEmpty ? auth.userName[0].toUpperCase() : 'S',
                style: const TextStyle(
                  color: Color(0xFF2563EB),
                  fontWeight: FontWeight.w900,
                ),
              ),
            ),
          ),
        ],
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: _fetchJobsAndApplications,
              child: SingleChildScrollView(
                physics: const AlwaysScrollableScrollPhysics(),
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Find Your Path Title & Search
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.all(20),
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(24),
                        gradient: const LinearGradient(
                          begin: Alignment.topLeft,
                          end: Alignment.bottomRight,
                          colors: [Color(0xFFF0F5FF), Color(0xFFE0E7FF)],
                        ),
                      ),
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
                                    const Text(
                                      'Find Your Path',
                                      style: TextStyle(
                                        fontSize: 26,
                                        fontWeight: FontWeight.w900,
                                        color: Color(0xFF111827),
                                      ),
                                    ),
                                    const SizedBox(height: 8),
                                    Text(
                                      'Discover opportunities at top-tier companies tailored for your growth.',
                                      style: TextStyle(
                                        fontSize: 13,
                                        color: Colors.grey.shade700,
                                        height: 1.4,
                                        fontWeight: FontWeight.w500,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                              const SizedBox(width: 16),
                              // Mocking the graphic with an icon
                              Container(
                                padding: const EdgeInsets.all(12),
                                decoration: BoxDecoration(
                                  color: const Color(0xFF2563EB).withOpacity(0.1),
                                  shape: BoxShape.circle,
                                ),
                                child: const Icon(
                                  Icons.business_center,
                                  size: 50,
                                  color: Color(0xFF2563EB),
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 24),
                          TextField(
                            decoration: InputDecoration(
                              hintText: 'Search jobs, companies...',
                              hintStyle: TextStyle(color: Colors.grey.shade500, fontSize: 14),
                              prefixIcon: const Icon(Icons.search, color: Colors.grey),
                              filled: true,
                              fillColor: Colors.white,
                              contentPadding: const EdgeInsets.symmetric(vertical: 14),
                              border: OutlineInputBorder(
                                borderRadius: BorderRadius.circular(16),
                                borderSide: BorderSide.none,
                              ),
                            ),
                            onChanged: (v) {
                              _search = v;
                              _fetchJobsAndApplications();
                            },
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 24),

                    // Category Tags Pills (Horizontal List)
                    SizedBox(
                      height: 42,
                      child: ListView.builder(
                        scrollDirection: Axis.horizontal,
                        itemCount: categoryData.length,
                        itemBuilder: (context, index) {
                          final category = categoryData[index];
                          final isSelected = _selectedCategory == category['name'];
                          return Padding(
                            padding: const EdgeInsets.only(right: 12.0),
                            child: GestureDetector(
                              onTap: () {
                                setState(() {
                                  _selectedCategory = category['name'];
                                  _filterJobs();
                                });
                              },
                              child: Container(
                                padding: const EdgeInsets.symmetric(horizontal: 16),
                                decoration: BoxDecoration(
                                  color: isSelected ? const Color(0xFF2563EB) : Colors.white,
                                  borderRadius: BorderRadius.circular(24),
                                  border: Border.all(
                                    color: isSelected ? Colors.transparent : Colors.grey.shade200,
                                  ),
                                ),
                                child: Row(
                                  children: [
                                    Icon(
                                      category['icon'],
                                      size: 16,
                                      color: isSelected ? Colors.white : Colors.grey.shade600,
                                    ),
                                    const SizedBox(width: 8),
                                    Text(
                                      category['name'],
                                      style: TextStyle(
                                        color: isSelected ? Colors.white : Colors.grey.shade700,
                                        fontWeight: FontWeight.w700,
                                        fontSize: 13,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ),
                          );
                        },
                      ),
                    ),
                    const SizedBox(height: 24),

                    // Job Cards List
                    _filteredJobs.isEmpty
                        ? Container(
                            height: 200,
                            alignment: Alignment.center,
                            child: Column(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Icon(Icons.work_outline, size: 48, color: Colors.grey.shade400),
                                const SizedBox(height: 12),
                                Text(
                                  'No job openings found',
                                  style: TextStyle(color: Colors.grey.shade500),
                                ),
                              ],
                            ),
                          )
                        : ListView.builder(
                            shrinkWrap: true,
                            physics: const NeverScrollableScrollPhysics(),
                            itemCount: _filteredJobs.length,
                            itemBuilder: (context, index) {
                              final job = _filteredJobs[index];
                              final companyVal = job['job_company_id'];
                              final companyName = companyVal is Map
                                  ? (companyVal['company_name'] ?? 'Company')
                                  : 'Company';
                              final city = job['job_location']?['city'] ?? 'Hyderabad';
                              final salary = job['job_salary'] ?? '₹50,000';
                              final hasApplied = _applications.any((app) {
                                final jobIdVal = app['job_id'];
                                if (jobIdVal is Map) {
                                  return jobIdVal['_id'] == job['_id'];
                                } else if (jobIdVal is String) {
                                  return jobIdVal == job['_id'];
                                }
                                return false;
                              });
                              final jobType = job['job_type'] ?? 'Full-Time';
                              final workMode = job['job_work_mode'] ?? 'Physical';
                              final exp = job['job_exp'] ?? 'Fresher';
                              final jobTitle = job['job_title'] ?? 'Role';

                              return Card(
                                margin: const EdgeInsets.only(bottom: 16),
                                elevation: 0,
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(20),
                                  side: BorderSide(color: Colors.grey.shade200),
                                ),
                                child: InkWell(
                                  borderRadius: BorderRadius.circular(20),
                                  onTap: () async {
                                    await Navigator.pushNamed(context, '/job-detail', arguments: job['_id']);
                                    _fetchJobsAndApplications();
                                  },
                                  child: Padding(
                                    padding: const EdgeInsets.all(20),
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        // Card Row 1: Logo & Title & Bookmark
                                        Row(
                                          crossAxisAlignment: CrossAxisAlignment.start,
                                          children: [
                                            Container(
                                              width: 54,
                                              height: 54,
                                              decoration: BoxDecoration(
                                                color: Colors.white,
                                                borderRadius: BorderRadius.circular(14),
                                                border: Border.all(color: Colors.grey.shade100),
                                              ),
                                              child: Center(
                                                child: Text(
                                                  companyName[0].toUpperCase(),
                                                  style: const TextStyle(
                                                    fontWeight: FontWeight.w900,
                                                    color: Color(0xFFEF4444), // Matches the TCS logo red-ish in the image
                                                    fontSize: 22,
                                                  ),
                                                ),
                                              ),
                                            ),
                                            const SizedBox(width: 16),
                                            Expanded(
                                              child: Column(
                                                crossAxisAlignment: CrossAxisAlignment.start,
                                                children: [
                                                  Text(
                                                    jobTitle,
                                                    style: const TextStyle(
                                                      fontWeight: FontWeight.w900,
                                                      fontSize: 16,
                                                      color: Color(0xFF111827),
                                                    ),
                                                    maxLines: 1,
                                                    overflow: TextOverflow.ellipsis,
                                                  ),
                                                  const SizedBox(height: 4),
                                                  Row(
                                                    children: [
                                                      Text(
                                                        companyName,
                                                        style: const TextStyle(
                                                          color: Color(0xFF4B5563),
                                                          fontWeight: FontWeight.w700,
                                                          fontSize: 14,
                                                        ),
                                                      ),
                                                      const SizedBox(width: 4),
                                                      const Icon(Icons.verified, color: Color(0xFF2563EB), size: 14),
                                                    ],
                                                  ),
                                                ],
                                              ),
                                            ),
                                            Icon(
                                              hasApplied ? Icons.bookmark : Icons.bookmark_outline_rounded,
                                              color: const Color(0xFF2563EB),
                                              size: 24,
                                            ),
                                          ],
                                        ),
                                        const SizedBox(height: 16),

                                        // Card Row 2: Pills
                                        Row(
                                          children: [
                                            _JobPill(
                                              text: jobType,
                                              color: const Color(0xFF2563EB),
                                              bgColor: const Color(0xFFEFF6FF),
                                            ),
                                            const SizedBox(width: 8),
                                            _JobPill(
                                              text: workMode,
                                              color: const Color(0xFF8B5CF6),
                                              bgColor: const Color(0xFFF5F3FF),
                                            ),
                                            const SizedBox(width: 8),
                                            _JobPill(
                                              text: exp,
                                              color: const Color(0xFFEA580C),
                                              bgColor: const Color(0xFFFFF7ED),
                                            ),
                                            // Match % omitted as requested
                                          ],
                                        ),
                                        const SizedBox(height: 20),

                                        // Card Row 3: Salary
                                        Text(
                                          salary.contains('₹') ? salary : '₹$salary',
                                          style: const TextStyle(
                                            fontWeight: FontWeight.w900,
                                            fontSize: 18,
                                            color: Color(0xFF111827),
                                          ),
                                        ),
                                        const SizedBox(height: 12),

                                        // Card Row 4: Date, Location & Apply Button
                                        Row(
                                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                          crossAxisAlignment: CrossAxisAlignment.end,
                                          children: [
                                            Row(
                                              children: [
                                                const Icon(Icons.calendar_today_outlined, size: 12, color: Color(0xFF6B7280)),
                                                const SizedBox(width: 4),
                                                const Text(
                                                  'Posted 2 days ago',
                                                  style: TextStyle(
                                                    color: Color(0xFF6B7280),
                                                    fontSize: 11,
                                                    fontWeight: FontWeight.w500,
                                                  ),
                                                ),
                                                const SizedBox(width: 8),
                                                const Text('•', style: TextStyle(color: Color(0xFF6B7280), fontSize: 11)),
                                                const SizedBox(width: 8),
                                                const Icon(Icons.location_on_outlined, size: 12, color: Color(0xFF6B7280)),
                                                const SizedBox(width: 4),
                                                Text(
                                                  city,
                                                  style: const TextStyle(
                                                    color: Color(0xFF6B7280),
                                                    fontSize: 11,
                                                    fontWeight: FontWeight.w500,
                                                  ),
                                                ),
                                              ],
                                            ),
                                            GestureDetector(
                                              onTap: hasApplied ? null : () => _applyForJob(job['_id']),
                                              child: Container(
                                                padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 10),
                                                decoration: BoxDecoration(
                                                  color: hasApplied ? const Color(0xFFE5E7EB) : const Color(0xFF2563EB),
                                                  borderRadius: BorderRadius.circular(10),
                                                ),
                                                child: Text(
                                                  hasApplied ? 'Applied' : 'Apply',
                                                  style: TextStyle(
                                                    color: hasApplied ? const Color(0xFF4B5563) : Colors.white,
                                                    fontWeight: FontWeight.w800,
                                                    fontSize: 13,
                                                  ),
                                                ),
                                              ),
                                            ),
                                          ],
                                        ),
                                      ],
                                    ),
                                  ),
                                ),
                              );
                            },
                          ),
                    const SizedBox(height: 32),
                  ],
                ),
              ),
            ),
    );
  }
}

class _JobPill extends StatelessWidget {
  final String text;
  final Color color;
  final Color bgColor;
  const _JobPill({required this.text, required this.color, required this.bgColor});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: bgColor,
        borderRadius: BorderRadius.circular(8),
      ),
      child: Text(
        text,
        style: TextStyle(
          color: color,
          fontSize: 11,
          fontWeight: FontWeight.w800,
        ),
      ),
    );
  }
}
