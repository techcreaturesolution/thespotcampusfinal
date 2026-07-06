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
      backgroundColor: const Color(0xFF143085), // Dark Blue base
      appBar: AppBar(
        backgroundColor: Colors.transparent, // Rich Navy
        elevation: 0,
        scrolledUnderElevation: 0,
        iconTheme: const IconThemeData(color: Colors.white),
        title: const Text(
          'My Applications',
          style: TextStyle(color: Colors.white, fontWeight: FontWeight.w900),
        ),
        centerTitle: true,
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator(color: Colors.white))
          : Column(
              children: [
                // 1. Top Summary Dashboard Banner
                Padding(
                  padding: const EdgeInsets.fromLTRB(16, 8, 16, 24),
                  child: Row(
                    children: [
                      Expanded(
                        child: _buildMetricCard(
                          title: 'Total Applied',
                          value: '$totalCount',
                          icon: Icons.assignment_outlined,
                          color: const Color(0xFF2563EB), // Blue
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: _buildMetricCard(
                          title: 'In Progress',
                          value: '$inProgressCount',
                          icon: Icons.pending_actions_outlined,
                          color: const Color(0xFFF59E0B), // Amber
                        ),
                      ),
                      const SizedBox(width: 12),
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

                // Main White Bottom Sheet
                Expanded(
                  child: Container(
                    width: double.infinity,
                    decoration: const BoxDecoration(
                      color: Color(0xFFF8FAFC),
                      borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
                    ),
                    child: Column(
                      children: [
                        // 2. Custom Filter Tabs Bar
                        Padding(
                          padding: const EdgeInsets.fromLTRB(0, 20, 0, 8),
                          child: SizedBox(
                            height: 40,
                            child: ListView.builder(
                              scrollDirection: Axis.horizontal,
                              padding: const EdgeInsets.symmetric(horizontal: 16),
                              itemCount: _tabs.length,
                              itemBuilder: (context, index) {
                                return _buildFilterTab(_tabs[index]);
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
                                      
                                      final avatarColor = _getAvatarColor(title);

                                      return Card(
                                        elevation: 0,
                                        color: Colors.white,
                                        margin: const EdgeInsets.only(bottom: 14),
                                        shape: RoundedRectangleBorder(
                                          borderRadius: BorderRadius.circular(16),
                                          side: BorderSide(color: Colors.grey.shade200),
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
                                                  crossAxisAlignment: CrossAxisAlignment.center,
                                                  children: [
                                                    // Square Initial
                                                    Container(
                                                      width: 48,
                                                      height: 48,
                                                      decoration: BoxDecoration(
                                                        color: avatarColor.withOpacity(0.08),
                                                        borderRadius: BorderRadius.circular(12),
                                                      ),
                                                      child: Center(
                                                        child: Text(
                                                          title.isNotEmpty ? title[0].toUpperCase() : 'J',
                                                          style: TextStyle(
                                                            fontWeight: FontWeight.bold,
                                                            color: avatarColor,
                                                            fontSize: 20,
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
                                                              fontSize: 16,
                                                              color: Color(0xFF0F172A),
                                                            ),
                                                          ),
                                                          const SizedBox(height: 2),
                                                          Text(
                                                            '$companyName • $position',
                                                            style: TextStyle(
                                                              color: Colors.grey.shade600,
                                                              fontSize: 12,
                                                              fontWeight: FontWeight.w600,
                                                            ),
                                                          ),
                                                        ],
                                                      ),
                                                    ),
                                                    
                                                    // Status Badge
                                                    Container(
                                                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
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
                                                              fontWeight: FontWeight.w900,
                                                            ),
                                                          ),
                                                        ],
                                                      ),
                                                    ),
                                                  ],
                                                ),
                                                
                                                const SizedBox(height: 16),
                                                const Divider(height: 1, color: Color(0xFFF1F5F9)),
                                                const SizedBox(height: 16),
                                                
                                                // Bottom Row: Date & Pills & Exam Button
                                                Row(
                                                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                                  children: [
                                                    Row(
                                                      children: [
                                                        Icon(Icons.calendar_today_outlined, size: 16, color: Colors.grey.shade500),
                                                        const SizedBox(width: 8),
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
                                                                fontWeight: FontWeight.w900,
                                                              ),
                                                            ),
                                                          ],
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
                                                const SizedBox(height: 16),
                                                SizedBox(
                                                  width: double.infinity,
                                                  height: 40,
                                                  child: OutlinedButton.icon(
                                                    icon: const Icon(Icons.quiz_outlined, size: 16),
                                                    label: const Text(
                                                      'Take Aptitude Exam',
                                                      style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold),
                                                    ),
                                                    style: OutlinedButton.styleFrom(
                                                      foregroundColor: const Color(0xFF2563EB),
                                                      side: const BorderSide(color: Color(0xFF2563EB), width: 1.2),
                                                      shape: RoundedRectangleBorder(
                                                        borderRadius: BorderRadius.circular(10),
                                                      ),
                                                    ),
                                                    onPressed: () {
                                                      if (app['hasExam'] == true && job != null) {
                                                        Navigator.pushNamed(context, '/exam', arguments: job['_id']);
                                                      } else {
                                                        ScaffoldMessenger.of(context).showSnackBar(
                                                          const SnackBar(content: Text('No exam available for this application yet')),
                                                        );
                                                      }
                                                    },
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
                        ),
                      ],
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
      padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 4),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
      ),
      child: Column(
        children: [
          Container(
            padding: const EdgeInsets.all(6),
            decoration: BoxDecoration(
              color: color.withOpacity(0.12),
              shape: BoxShape.circle,
            ),
            child: Icon(icon, color: color, size: 20),
          ),
          const SizedBox(height: 8),
          Text(
            value,
            style: TextStyle(
              color: color,
              fontSize: 20,
              fontWeight: FontWeight.w900,
            ),
          ),
          const SizedBox(height: 2),
          Text(
            title,
            style: const TextStyle(
              color: Color(0xFF0F172A),
              fontSize: 9,
              fontWeight: FontWeight.w700,
            ),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
          const SizedBox(height: 8),
          Container(
            width: 16,
            height: 3,
            decoration: BoxDecoration(
              color: color,
              borderRadius: BorderRadius.circular(2),
            ),
          )
        ],
      ),
    );
  }

  Widget _buildFilterTab(String tab) {
    final isSelected = _selectedTab == tab;
    final tabColor = tab == 'All' ? const Color(0xFF2563EB) : _getStatusColor(tab);
    final icon = tab == 'All' ? Icons.grid_view : _getStatusIcon(tab);

    return Padding(
      padding: const EdgeInsets.only(right: 8),
      child: GestureDetector(
        onTap: () => setState(() => _selectedTab = tab),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 18),
          decoration: BoxDecoration(
            color: isSelected ? const Color(0xFF2563EB) : Colors.white,
            borderRadius: BorderRadius.circular(20),
            border: Border.all(
              color: isSelected ? const Color(0xFF2563EB) : Colors.grey.shade300,
            ),
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(
                icon,
                size: 16,
                color: isSelected ? Colors.white : tabColor,
              ),
              const SizedBox(width: 8),
              Text(
                tab,
                style: TextStyle(
                  color: isSelected ? Colors.white : const Color(0xFF0F172A),
                  fontWeight: FontWeight.bold,
                  fontSize: 12,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildInfoPill(String label) {
    Color bgColor = const Color(0xFFEFF6FF); // Blue 50
    Color textColor = const Color(0xFF2563EB); // Blue 600

    if (label.toLowerCase().contains('physical') || label.toLowerCase().contains('office')) {
      bgColor = const Color(0xFFF3E8FF); // Purple 50
      textColor = const Color(0xFF9333EA); // Purple 600
    } else if (label.toLowerCase().contains('remote')) {
      bgColor = const Color(0xFFECFDF5); // Emerald 50
      textColor = const Color(0xFF059669); // Emerald 600
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: bgColor,
        borderRadius: BorderRadius.circular(6),
      ),
      child: Text(
        label,
        style: TextStyle(
          color: textColor,
          fontSize: 10,
          fontWeight: FontWeight.bold,
        ),
      ),
    );
  }
  
  Color _getAvatarColor(String text) {
    final colors = [
      const Color(0xFF2563EB), // Blue
      const Color(0xFF10B981), // Emerald
      const Color(0xFFF59E0B), // Amber
      const Color(0xFF8B5CF6), // Purple
      const Color(0xFFEC4899), // Pink
    ];
    int hash = text.codeUnits.fold(0, (prev, curr) => prev + curr);
    return colors[hash % colors.length];
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            padding: const EdgeInsets.all(20),
            decoration: const BoxDecoration(
              color: Color(0xFFEFF6FF),
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

