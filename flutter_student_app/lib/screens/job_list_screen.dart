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
        const SnackBar(content: Text('Applied successfully!'), backgroundColor: Colors.green),
      );
      _fetchJobsAndApplications();
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

  @override
  Widget build(BuildContext context) {
    final auth = Provider.of<AuthService>(context);

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
                    // Find Your Path Title
                    const Text(
                      'Find Your Path',
                      style: TextStyle(
                        fontSize: 26,
                        fontWeight: FontWeight.bold,
                        color: Color(0xFF111827),
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      'Discover opportunities at top-tier companies tailored for your growth.',
                      style: TextStyle(
                        fontSize: 14,
                        color: Colors.grey.shade600,
                      ),
                    ),
                    const SizedBox(height: 20),

                    // Search & Filter Bar
                    TextField(
                      decoration: InputDecoration(
                        hintText: 'Search jobs, companies...',
                        prefixIcon: const Icon(Icons.search, color: Colors.grey),
                        filled: true,
                        fillColor: Colors.white,
                        contentPadding: const EdgeInsets.symmetric(vertical: 12),
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(12),
                          borderSide: BorderSide(color: Colors.grey.shade200),
                        ),
                        enabledBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(12),
                          borderSide: BorderSide(color: Colors.grey.shade200),
                        ),
                      ),
                      onChanged: (v) {
                        _search = v;
                        _fetchJobsAndApplications();
                      },
                    ),
                    const SizedBox(height: 20),

                    // Category Tags Pills (Horizontal List)
                    SizedBox(
                      height: 38,
                      child: ListView.builder(
                        scrollDirection: Axis.horizontal,
                        itemCount: _categories.length,
                        itemBuilder: (context, index) {
                          final category = _categories[index];
                          final isSelected = _selectedCategory == category;
                          return Padding(
                            padding: const EdgeInsets.only(right: 8.0),
                            child: GestureDetector(
                              onTap: () {
                                setState(() {
                                  _selectedCategory = category;
                                  _filterJobs();
                                });
                              },
                              child: Container(
                                padding: const EdgeInsets.symmetric(horizontal: 16),
                                decoration: BoxDecoration(
                                  color: isSelected ? const Color(0xFF2563EB) : Colors.white,
                                  borderRadius: BorderRadius.circular(20),
                                  border: Border.all(
                                    color: isSelected ? Colors.transparent : Colors.grey.shade200,
                                  ),
                                ),
                                child: Center(
                                  child: Text(
                                    category,
                                    style: TextStyle(
                                      color: isSelected ? Colors.white : Colors.grey.shade700,
                                      fontWeight: FontWeight.bold,
                                      fontSize: 13,
                                    ),
                                  ),
                                ),
                              ),
                            ),
                          );
                        },
                      ),
                    ),
                    const SizedBox(height: 20),

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
                              final jobType = job['job_type'] ?? 'Full-time';
                              final workMode = job['job_work_mode'] ?? 'Remote';
                              final exp = job['job_exp'] ?? 'Freshers';

                              return Card(
                                margin: const EdgeInsets.only(bottom: 16),
                                child: InkWell(
                                  borderRadius: BorderRadius.circular(16),
                                  onTap: () async {
                                    await Navigator.pushNamed(context, '/job-detail', arguments: job['_id']);
                                    _fetchJobsAndApplications();
                                  },
                                  child: Padding(
                                    padding: const EdgeInsets.all(16),
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        // Card Row 1: Logo & Title & Bookmark
                                        Row(
                                          crossAxisAlignment: CrossAxisAlignment.start,
                                          children: [
                                            Container(
                                              width: 48,
                                              height: 48,
                                              decoration: BoxDecoration(
                                                color: const Color(0xFFEFF6FF),
                                                borderRadius: BorderRadius.circular(12),
                                              ),
                                              child: Center(
                                                child: Text(
                                                  companyName[0].toUpperCase(),
                                                  style: const TextStyle(
                                                    fontWeight: FontWeight.bold,
                                                    color: Color(0xFF2563EB),
                                                    fontSize: 18,
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
                                                    style: const TextStyle(
                                                      fontWeight: FontWeight.bold,
                                                      fontSize: 15,
                                                      color: Color(0xFF111827),
                                                    ),
                                                  ),
                                                  const SizedBox(height: 2),
                                                  Text(
                                                    '$companyName • $city',
                                                    style: const TextStyle(
                                                      color: Color(0xFF2563EB),
                                                      fontWeight: FontWeight.bold,
                                                      fontSize: 13,
                                                    ),
                                                  ),
                                                ],
                                              ),
                                            ),
                                            Icon(
                                              hasApplied ? Icons.bookmark : Icons.bookmark_border,
                                              color: hasApplied ? const Color(0xFF2563EB) : Colors.grey.shade400,
                                              size: 20,
                                            ),
                                          ],
                                        ),
                                      const SizedBox(height: 12),

                                      // Card Row 2: Pills
                                      Row(
                                        children: [
                                          _JobPill(
                                            text: jobType,
                                            color: const Color(0xFF3B82F6), // Blue
                                          ),
                                          const SizedBox(width: 8),
                                          _JobPill(
                                            text: workMode,
                                            color: const Color(0xFF8B5CF6), // Purple
                                          ),
                                          const SizedBox(width: 8),
                                          _JobPill(
                                            text: exp,
                                            color: const Color(0xFFF97316), // Orange
                                          ),
                                        ],
                                      ),
                                      const SizedBox(height: 16),

                                      // Card Row 3: Salary, Date & Apply
                                      Row(
                                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                        children: [
                                          Column(
                                            crossAxisAlignment: CrossAxisAlignment.start,
                                            children: [
                                              Text(
                                                salary,
                                                style: const TextStyle(
                                                  fontWeight: FontWeight.bold,
                                                  fontSize: 15,
                                                  color: Color(0xFF111827),
                                                ),
                                              ),
                                              const SizedBox(height: 2),
                                              Text(
                                                'Posted 2 days ago',
                                                style: TextStyle(
                                                  color: Colors.grey.shade500,
                                                  fontSize: 11,
                                                ),
                                              ),
                                            ],
                                          ),
                                          ElevatedButton(
                                            style: ElevatedButton.styleFrom(
                                              backgroundColor: hasApplied ? Colors.grey.shade100 : const Color(0xFF2563EB),
                                              foregroundColor: hasApplied ? Colors.grey.shade600 : Colors.white,
                                              elevation: 0,
                                              padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 10),
                                              shape: RoundedRectangleBorder(
                                                borderRadius: BorderRadius.circular(10),
                                              ),
                                            ),
                                            onPressed: hasApplied
                                                ? null
                                                : () => _applyForJob(job['_id']),
                                            child: Text(
                                              hasApplied ? 'Applied' : 'Apply Now',
                                              style: const TextStyle(
                                                fontSize: 12,
                                                fontWeight: FontWeight.bold,
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
                    const SizedBox(height: 16),


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
  const _JobPill({required this.text, required this.color});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(6),
      ),
      child: Text(
        text,
        style: TextStyle(
          color: color,
          fontSize: 11,
          fontWeight: FontWeight.bold,
        ),
      ),
    );
  }
}
