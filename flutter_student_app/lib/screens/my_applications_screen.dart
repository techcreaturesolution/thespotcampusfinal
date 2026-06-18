import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import '../services/api_service.dart';

class MyApplicationsScreen extends StatefulWidget {
  const MyApplicationsScreen({super.key});

  @override
  State<MyApplicationsScreen> createState() => _MyApplicationsScreenState();
}

class _MyApplicationsScreenState extends State<MyApplicationsScreen> {
  List<dynamic> _applications = [];
  bool _loading = true;
  String _selectedTab = 'All';

  final List<String> _tabs = ['All', 'In Progress', 'Selected', 'Rejected'];

  @override
  void initState() {
    super.initState();
    _fetchApplications();
  }

  Future<void> _fetchApplications() async {
    try {
      setState(() => _loading = true);
      final api = Provider.of<ApiService>(context, listen: false);
      final data = await api.get('/application/student');
      setState(() {
        _applications = data['applications'] ?? [];
        _loading = false;
      });
    } catch (e) {
      setState(() => _loading = false);
    }
  }

  String _getStatus(Map<String, dynamic> app) {
    final finalResult = app['final_result']?.toString().toLowerCase();
    if (finalResult == 'selected') return 'Selected';
    if (finalResult == 'rejected') return 'Rejected';
    if (finalResult == 'withdrawn') return 'Withdrawn';
    return 'In Progress';
  }

  Color _getStatusColor(String status) {
    switch (status) {
      case 'Selected': return const Color(0xFF10B981); // Emerald 500
      case 'Rejected': return const Color(0xFFEF4444); // Red 500
      case 'Withdrawn': return const Color(0xFF64748B); // Slate 500
      default: return const Color(0xFFF59E0B); // Amber 500
    }
  }

  IconData _getStatusIcon(String status) {
    switch (status) {
      case 'Selected': return Icons.check_circle_outline;
      case 'Rejected': return Icons.cancel_outlined;
      case 'Withdrawn': return Icons.remove_circle_outline;
      default: return Icons.pending_actions_outlined;
    }
  }

  String _formatDate(String? dateStr) {
    if (dateStr == null) return '-';
    try {
      final dateTime = DateTime.parse(dateStr).toLocal();
      return DateFormat('MMM dd, yyyy').format(dateTime);
    } catch (e) {
      return '-';
    }
  }

  List<dynamic> _getFilteredApplications() {
    if (_selectedTab == 'All') return _applications;
    return _applications.where((app) {
      final status = _getStatus(app as Map<String, dynamic>);
      if (_selectedTab == 'In Progress') {
        return status == 'In Progress';
      }
      return status == _selectedTab;
    }).toList();
  }

  @override
  Widget build(BuildContext context) {
    final totalCount = _applications.length;
    final selectedCount = _applications.where((app) => _getStatus(app as Map<String, dynamic>) == 'Selected').length;
    final inProgressCount = _applications.where((app) => _getStatus(app as Map<String, dynamic>) == 'In Progress').length;
    
    final filteredList = _getFilteredApplications();

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC), // Slate 50 background
      appBar: AppBar(
        backgroundColor: const Color(0xFF1E3A8A), // Rich Navy
        elevation: 0,
        scrolledUnderElevation: 0,
        iconTheme: const IconThemeData(color: Colors.white),
        title: const Text(
          'My Applications',
          style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
        ),
        centerTitle: true,
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator(color: Color(0xFF2563EB)))
          : Column(
              children: [
                // 1. Top Summary Dashboard Banner
                Container(
                  width: double.infinity,
                  decoration: const BoxDecoration(
                    gradient: LinearGradient(
                      begin: Alignment.topCenter,
                      end: Alignment.bottomCenter,
                      colors: [Color(0xFF1E3A8A), Color(0xFF0F172A)],
                    ),
                  ),
                  padding: const EdgeInsets.fromLTRB(16, 8, 16, 24),
                  child: Row(
                    children: [
                      Expanded(
                        child: _buildMetricCard(
                          title: 'Total Applied',
                          value: '$totalCount',
                          icon: Icons.assignment_outlined,
                          color: const Color(0xFF3B82F6), // Blue
                        ),
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: _buildMetricCard(
                          title: 'In Progress',
                          value: '$inProgressCount',
                          icon: Icons.pending_actions_outlined,
                          color: const Color(0xFFF59E0B), // Amber
                        ),
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: _buildMetricCard(
                          title: 'Selected',
                          value: '$selectedCount',
                          icon: Icons.emoji_events_outlined,
                          color: const Color(0xFF10B981), // Emerald
                        ),
                      ),
                    ],
                  ),
                ),

                // 2. Custom Filter Tabs Bar
                Container(
                  color: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 12),
                  child: SizedBox(
                    height: 38,
                    child: ListView.builder(
                      scrollDirection: Axis.horizontal,
                      padding: const EdgeInsets.symmetric(horizontal: 16),
                      itemCount: _tabs.length,
                      itemBuilder: (context, index) {
                        final tab = _tabs[index];
                        final isSelected = _selectedTab == tab;
                        return Padding(
                          padding: const EdgeInsets.only(right: 8),
                          child: GestureDetector(
                            onTap: () {
                              setState(() {
                                _selectedTab = tab;
                              });
                            },
                            child: Container(
                              padding: const EdgeInsets.symmetric(horizontal: 18),
                              decoration: BoxDecoration(
                                color: isSelected ? const Color(0xFF2563EB) : const Color(0xFFF1F5F9),
                                borderRadius: BorderRadius.circular(20),
                              ),
                              child: Center(
                                child: Text(
                                  tab,
                                  style: TextStyle(
                                    color: isSelected ? Colors.white : const Color(0xFF475569),
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
                ),

                // 3. Applications List
                Expanded(
                  child: filteredList.isEmpty
                      ? _buildEmptyState()
                      : RefreshIndicator(
                          onRefresh: _fetchApplications,
                          child: ListView.builder(
                            padding: const EdgeInsets.all(16),
                            itemCount: filteredList.length,
                            itemBuilder: (context, index) {
                              final app = filteredList[index];
                              final jobVal = app['job_id'];
                              final job = jobVal is Map ? jobVal : null;
                              
                              final companyVal = job?['job_company_id'];
                              final companyName = companyVal is Map ? (companyVal['company_name'] ?? 'Company') : 'Company';
                              final title = job?['job_title'] ?? 'Job Opening';
                              final position = job?['job_position'] ?? 'Developer';
                              final jobType = job?['job_type'] ?? 'Full-time';
                              final workMode = job?['job_work_mode'] ?? 'Remote';
                              
                              final status = _getStatus(app as Map<String, dynamic>);
                              final statusColor = _getStatusColor(status);
                              final statusIcon = _getStatusIcon(status);
                              
                              final appliedDate = _formatDate(app['createdAt']);

                              return Card(
                                elevation: 0,
                                color: Colors.white,
                                margin: const EdgeInsets.only(bottom: 14),
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(16),
                                  side: const BorderSide(color: Color(0xFFE2E8F0)), // Slate 200
                                ),
                                child: InkWell(
                                  borderRadius: BorderRadius.circular(16),
                                  onTap: () async {
                                    if (job != null) {
                                      await Navigator.pushNamed(
                                        context,
                                        '/job-detail',
                                        arguments: job['_id'],
                                      );
                                      _fetchApplications();
                                    }
                                  },
                                  child: Padding(
                                    padding: const EdgeInsets.all(16),
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        // Header Row: Avatar & Title & Badge
                                        Row(
                                          crossAxisAlignment: CrossAxisAlignment.start,
                                          children: [
                                            // Circular Company Initial
                                            Container(
                                              width: 44,
                                              height: 44,
                                              decoration: BoxDecoration(
                                                color: const Color(0xFFEFF6FF), // Soft Blue
                                                borderRadius: BorderRadius.circular(10),
                                              ),
                                              child: Center(
                                                child: Text(
                                                  companyName.isNotEmpty ? companyName[0].toUpperCase() : 'C',
                                                  style: const TextStyle(
                                                    fontWeight: FontWeight.bold,
                                                    color: Color(0xFF2563EB),
                                                    fontSize: 18,
                                                  ),
                                                ),
                                              ),
                                            ),
                                            const SizedBox(width: 12),
                                            
                                            // Job details
                                            Expanded(
                                              child: Column(
                                                crossAxisAlignment: CrossAxisAlignment.start,
                                                children: [
                                                  Text(
                                                    title,
                                                    style: const TextStyle(
                                                      fontWeight: FontWeight.bold,
                                                      fontSize: 15,
                                                      color: Color(0xFF0F172A),
                                                    ),
                                                  ),
                                                  const SizedBox(height: 2),
                                                  Text(
                                                    '$companyName • $position',
                                                    style: TextStyle(
                                                      color: Colors.grey.shade600,
                                                      fontSize: 12,
                                                      fontWeight: FontWeight.w500,
                                                    ),
                                                  ),
                                                ],
                                              ),
                                            ),
                                            
                                            // Status Badge
                                            Container(
                                              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                                              decoration: BoxDecoration(
                                                color: statusColor.withOpacity(0.12),
                                                borderRadius: BorderRadius.circular(20),
                                              ),
                                              child: Row(
                                                mainAxisSize: MainAxisSize.min,
                                                children: [
                                                  Icon(statusIcon, color: statusColor, size: 14),
                                                  const SizedBox(width: 4),
                                                  Text(
                                                    status,
                                                    style: TextStyle(
                                                      fontSize: 11,
                                                      color: statusColor,
                                                      fontWeight: FontWeight.bold,
                                                    ),
                                                  ),
                                                ],
                                              ),
                                            ),
                                          ],
                                        ),
                                        
                                        const SizedBox(height: 16),
                                        const Divider(height: 1, color: Color(0xFFF1F5F9)),
                                        const SizedBox(height: 12),
                                        
                                        // Bottom Row: Date & Pills & Exam Button
                                        Row(
                                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                          children: [
                                            Column(
                                              crossAxisAlignment: CrossAxisAlignment.start,
                                              children: [
                                                Text(
                                                  'APPLIED ON',
                                                  style: TextStyle(
                                                    color: Colors.grey.shade500,
                                                    fontSize: 9,
                                                    fontWeight: FontWeight.bold,
                                                    letterSpacing: 0.5,
                                                  ),
                                                ),
                                                const SizedBox(height: 2),
                                                Text(
                                                  appliedDate,
                                                  style: const TextStyle(
                                                    color: Color(0xFF0F172A),
                                                    fontSize: 12,
                                                    fontWeight: FontWeight.bold,
                                                  ),
                                                ),
                                              ],
                                            ),
                                            Row(
                                              children: [
                                                _buildInfoPill(jobType),
                                                const SizedBox(width: 6),
                                                _buildInfoPill(workMode),
                                              ],
                                            ),
                                          ],
                                        ),

                                        // Take Exam Button if applicable
                                        if (app['hasExam'] == true) ...[
                                          const SizedBox(height: 12),
                                          SizedBox(
                                            width: double.infinity,
                                            height: 38,
                                            child: OutlinedButton.icon(
                                              icon: const Icon(Icons.quiz_outlined, size: 16),
                                              label: const Text(
                                                'Take Aptitude Exam',
                                                style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold),
                                              ),
                                              style: OutlinedButton.styleFrom(
                                                foregroundColor: const Color(0xFF2563EB),
                                                side: const BorderSide(color: Color(0xFF2563EB)),
                                                shape: RoundedRectangleBorder(
                                                  borderRadius: BorderRadius.circular(10),
                                                ),
                                              ),
                                              onPressed: () {
                                                if (job != null) {
                                                  Navigator.pushNamed(context, '/exam', arguments: job['_id']);
                                                }
                                              },
                                            ),
                                          ),
                                        ],
                                      ],
                                    ),
                                  ),
                                ),
                              );
                            },
                          ),
                        ),
                ),
              ],
            ),
    );
  }

  Widget _buildMetricCard({
    required String title,
    required String value,
    required IconData icon,
    required Color color,
  }) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 10),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.08),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.white.withOpacity(0.12)),
      ),
      child: Column(
        children: [
          CircleAvatar(
            radius: 16,
            backgroundColor: color.withOpacity(0.2),
            child: Icon(icon, color: color, size: 16),
          ),
          const SizedBox(height: 8),
          Text(
            value,
            style: const TextStyle(
              color: Colors.white,
              fontSize: 18,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 2),
          Text(
            title,
            style: TextStyle(
              color: Colors.white.withOpacity(0.7),
              fontSize: 10,
              fontWeight: FontWeight.w500,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildInfoPill(String label) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: const Color(0xFFF1F5F9), // Slate 100
        borderRadius: BorderRadius.circular(6),
      ),
      child: Text(
        label,
        style: const TextStyle(
          color: Color(0xFF475569), // Slate 600
          fontSize: 10,
          fontWeight: FontWeight.bold,
        ),
      ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: const Color(0xFFEFF6FF),
              shape: BoxShape.circle,
            ),
            child: const Icon(
              Icons.assignment_outlined,
              size: 48,
              color: Color(0xFF2563EB),
            ),
          ),
          const SizedBox(height: 16),
          const Text(
            'No applications found',
            style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Color(0xFF0F172A)),
          ),
          const SizedBox(height: 6),
          Text(
            'Try browsing jobs and start applying!',
            style: TextStyle(color: Colors.grey.shade500, fontSize: 13),
          ),
          const SizedBox(height: 20),
          ElevatedButton.icon(
            icon: const Icon(Icons.search, size: 18),
            label: const Text('Browse Jobs', style: TextStyle(fontWeight: FontWeight.bold)),
            onPressed: () {
              Navigator.pushNamed(context, '/jobs');
            },
          ),
        ],
      ),
    );
  }
}
