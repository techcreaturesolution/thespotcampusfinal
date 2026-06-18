import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import 'package:url_launcher/url_launcher.dart';
import '../services/api_service.dart';
import '../utils/constants.dart';

class InterviewListScreen extends StatefulWidget {
  const InterviewListScreen({super.key});

  @override
  State<InterviewListScreen> createState() => _InterviewListScreenState();
}

class _InterviewListScreenState extends State<InterviewListScreen> {
  List<dynamic> _interviews = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _fetchInterviews();
  }

  Future<void> _fetchInterviews() async {
    try {
      final api = Provider.of<ApiService>(context, listen: false);
      final data = await api.get('/interviews/student');
      setState(() {
        _interviews = data['interviews'] ?? [];
        _loading = false;
      });
    } catch (e) {
      setState(() => _loading = false);
    }
  }

  bool _isJoinable(Map<String, dynamic> interview) {
    final status = interview['status'];
    if (status != 'scheduled' && status != 'in_progress') return false;
    final scheduledAtStr = interview['scheduled_at'];
    if (scheduledAtStr == null) return false;
    final scheduledTime = DateTime.parse(scheduledAtStr).toLocal();
    final now = DateTime.now();
    
    // Difference between scheduled time and now in minutes
    final diffMinutes = scheduledTime.difference(now).inMinutes;
    
    // Can join starting from 10 minutes prior to the scheduled time
    return diffMinutes <= 10;
  }

  Future<void> _joinInterview(String roomId) async {
    final baseUrlClean = AppConstants.baseUrl.replaceAll('/api', '');
    final url = Uri.parse('$baseUrlClean/dashboard/video-interview/$roomId');
    try {
      await launchUrl(url, mode: LaunchMode.externalApplication);
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error: $e'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }

  Color _getStatusColor(String status) {
    switch (status) {
      case 'scheduled':
        return const Color(0xFF2563EB); // Blue
      case 'in_progress':
        return const Color(0xFF059669); // Emerald Green
      case 'completed':
        return const Color(0xFF4B5563); // Grey
      case 'cancelled':
        return const Color(0xFFDC2626); // Red
      case 'no_show':
        return const Color(0xFFD97706); // Amber
      default:
        return const Color(0xFF4B5563);
    }
  }

  String _formatStatus(String status) {
    return status.replaceAll('_', ' ').toUpperCase();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('My Interviews'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () {
              setState(() => _loading = true);
              _fetchInterviews();
            },
          ),
        ],
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _interviews.isEmpty
              ? Center(
                  child: Padding(
                    padding: const EdgeInsets.all(24.0),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Container(
                          padding: const EdgeInsets.all(20),
                          decoration: BoxDecoration(
                            color: const Color(0xFF2563EB).withOpacity(0.1),
                            shape: BoxShape.circle,
                          ),
                          child: const Icon(
                            Icons.video_camera_back_outlined,
                            size: 64,
                            color: Color(0xFF2563EB),
                          ),
                        ),
                        const SizedBox(height: 24),
                        const Text(
                          'No interviews scheduled yet',
                          style: TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        const SizedBox(height: 8),
                        Text(
                          'Scheduled interview rounds will appear here.',
                          textAlign: TextAlign.center,
                          style: TextStyle(
                            color: Colors.grey.shade600,
                            fontSize: 14,
                          ),
                        ),
                      ],
                    ),
                  ),
                )
              : RefreshIndicator(
                  onRefresh: _fetchInterviews,
                  child: ListView.builder(
                    padding: const EdgeInsets.all(16),
                    itemCount: _interviews.length,
                    itemBuilder: (context, index) {
                      final interview = _interviews[index];
                      final job = interview['job_id'];
                      final company = interview['company_id'];
                      final status = interview['status'] ?? 'scheduled';
                      final scheduledAtStr = interview['scheduled_at'];
                      
                      DateTime? scheduledTime;
                      String dateStr = '-';
                      String timeStr = '-';
                      if (scheduledAtStr != null) {
                        scheduledTime = DateTime.parse(scheduledAtStr).toLocal();
                        dateStr = DateFormat('dd MMM yyyy').format(scheduledTime);
                        timeStr = DateFormat('hh:mm a').format(scheduledTime);
                      }

                      final duration = interview['duration_minutes']?.toString();
                      final isVideo = interview['interview_mode'] == 'video_conference';
                      final joinable = _isJoinable(interview);

                      return Card(
                        margin: const EdgeInsets.only(bottom: 16),
                        child: Container(
                          decoration: BoxDecoration(
                            border: Border(
                              left: BorderSide(
                                color: _getStatusColor(status),
                                width: 5,
                              ),
                            ),
                          ),
                          child: Padding(
                            padding: const EdgeInsets.all(16),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Icon(
                                      Icons.videocam_outlined,
                                      color: _getStatusColor(status),
                                      size: 20,
                                    ),
                                    const SizedBox(width: 8),
                                    Expanded(
                                      child: Column(
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        children: [
                                          Text(
                                            job?['job_title'] ?? 'Selection Round',
                                            style: const TextStyle(
                                              fontSize: 16,
                                              fontWeight: FontWeight.bold,
                                            ),
                                          ),
                                          const SizedBox(height: 4),
                                          Text(
                                            company?['company_name'] ?? 'Unknown Company',
                                            style: TextStyle(
                                              color: Colors.grey.shade600,
                                              fontSize: 14,
                                              fontWeight: FontWeight.w500,
                                            ),
                                          ),
                                        ],
                                      ),
                                    ),
                                    Container(
                                      padding: const EdgeInsets.symmetric(
                                        horizontal: 8,
                                        vertical: 4,
                                      ),
                                      decoration: BoxDecoration(
                                        color: _getStatusColor(status).withOpacity(0.1),
                                        borderRadius: BorderRadius.circular(6),
                                      ),
                                      child: Text(
                                        _formatStatus(status),
                                        style: TextStyle(
                                          color: _getStatusColor(status),
                                          fontSize: 10,
                                          fontWeight: FontWeight.bold,
                                        ),
                                      ),
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 16),
                                Row(
                                  children: [
                                    Icon(Icons.calendar_today_outlined, size: 14, color: Colors.grey.shade600),
                                    const SizedBox(width: 4),
                                    Text(
                                      dateStr,
                                      style: TextStyle(
                                        fontSize: 12,
                                        color: Colors.grey.shade600,
                                        fontWeight: FontWeight.w500,
                                      ),
                                    ),
                                    const SizedBox(width: 16),
                                    Icon(Icons.access_time, size: 14, color: Colors.grey.shade600),
                                    const SizedBox(width: 4),
                                    Text(
                                      timeStr,
                                      style: TextStyle(
                                        fontSize: 12,
                                        color: Colors.grey.shade600,
                                        fontWeight: FontWeight.w500,
                                      ),
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 8),
                                Container(
                                  padding: const EdgeInsets.symmetric(
                                    horizontal: 8,
                                    vertical: 6,
                                  ),
                                  decoration: BoxDecoration(
                                    color: Colors.grey.shade100,
                                    borderRadius: BorderRadius.circular(8),
                                  ),
                                  child: Text(
                                    '${isVideo ? "Mode: Video Conference (Online)" : "Mode: Offline/Other"}${duration != null ? "  |  Duration: $duration mins" : ""}',
                                    style: TextStyle(
                                      fontSize: 11,
                                      color: Colors.grey.shade700,
                                      fontWeight: FontWeight.w500,
                                    ),
                                  ),
                                ),
                                if (isVideo && (status == 'scheduled' || status == 'in_progress')) ...[
                                  const SizedBox(height: 16),
                                  SizedBox(
                                    width: double.infinity,
                                    child: joinable
                                        ? ElevatedButton.icon(
                                            style: ElevatedButton.styleFrom(
                                              backgroundColor: const Color(0xFF2563EB),
                                              foregroundColor: Colors.white,
                                              padding: const EdgeInsets.symmetric(vertical: 12),
                                              shape: RoundedRectangleBorder(
                                                borderRadius: BorderRadius.circular(10),
                                              ),
                                            ),
                                            icon: const Icon(Icons.videocam, size: 18),
                                            label: const Text(
                                              'JOIN INTERVIEW',
                                              style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold),
                                            ),
                                            onPressed: () {
                                              final roomId = interview['room_id'];
                                              if (roomId != null) {
                                                _joinInterview(roomId);
                                              }
                                            },
                                          )
                                        : Container(
                                            padding: const EdgeInsets.all(12),
                                            decoration: BoxDecoration(
                                              color: Colors.grey.shade50,
                                              border: Border.all(color: Colors.grey.shade200),
                                              borderRadius: BorderRadius.circular(10),
                                            ),
                                            child: Row(
                                              mainAxisAlignment: MainAxisAlignment.center,
                                              children: [
                                                Icon(Icons.info_outline, size: 16, color: Colors.grey.shade500),
                                                const SizedBox(width: 6),
                                                Text(
                                                  'Starts 10 min prior to scheduled time',
                                                  style: TextStyle(
                                                    fontSize: 12,
                                                    color: Colors.grey.shade500,
                                                    fontWeight: FontWeight.w500,
                                                  ),
                                                ),
                                              ],
                                            ),
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
    );
  }
}
