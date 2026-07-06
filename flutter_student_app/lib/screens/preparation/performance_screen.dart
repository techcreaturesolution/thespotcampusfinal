import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../services/api_service.dart';

class PerformanceScreen extends StatefulWidget {
  const PerformanceScreen({super.key});

  @override
  State<PerformanceScreen> createState() => _PerformanceScreenState();
}

class _PerformanceScreenState extends State<PerformanceScreen> {
  Map<String, dynamic>? _progress;
  Map<String, dynamic>? _subjectData;
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _fetchData();
  }

  Future<void> _fetchData() async {
    try {
      final api = Provider.of<ApiService>(context, listen: false);
      final results = await Future.wait([
        api.get('/preparation/progress'),
        api.get('/preparation/progress/subjects'),
      ]);
      setState(() {
        _progress = results[0]['progress'];
        _subjectData = results[1];
        _isLoading = false;
      });
    } catch (e) { setState(() => _isLoading = false); }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      extendBodyBehindAppBar: true,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Colors.black87),
          onPressed: () => Navigator.pop(context),
        ),
        title: const Text(
          'Performance',
          style: TextStyle(color: Colors.black87, fontWeight: FontWeight.w800),
        ),
        centerTitle: true,
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: _fetchData,
              child: SingleChildScrollView(
                physics: const AlwaysScrollableScrollPhysics(),
                child: Column(
                  children: [
                    Stack(
                      children: [
                        // Background gradient for header
                        Positioned(
                          top: 0,
                          left: 0,
                          right: 0,
                          height: 350,
                          child: Container(
                            decoration: const BoxDecoration(
                              gradient: LinearGradient(
                                begin: Alignment.topLeft,
                                end: Alignment.bottomRight,
                                colors: [Color(0xFFF8FAFC), Color(0xFFE0E7FF)],
                              ),
                            ),
                          ),
                        ),
                        // Content
                        SafeArea(
                          child: Column(
                            children: [
                              // Top Text and Graphic
                              Padding(
                                padding: const EdgeInsets.fromLTRB(24, 20, 24, 32),
                                child: Row(
                                  children: [
                                    const Expanded(
                                      child: Text(
                                        'Track your progress and\nimprove every day.',
                                        style: TextStyle(
                                          fontSize: 14,
                                          color: Color(0xFF4B5563),
                                          height: 1.5,
                                          fontWeight: FontWeight.w600,
                                        ),
                                      ),
                                    ),
                                    Container(
                                      width: 76,
                                      height: 76,
                                      decoration: BoxDecoration(
                                        color: Colors.white,
                                        borderRadius: BorderRadius.circular(20),
                                        boxShadow: [
                                          BoxShadow(
                                            color: const Color(0xFF3B82F6).withOpacity(0.2),
                                            blurRadius: 16,
                                            offset: const Offset(0, 8),
                                          )
                                        ],
                                      ),
                                      child: Stack(
                                        alignment: Alignment.center,
                                        children: [
                                          const Icon(Icons.bar_chart_rounded, size: 48, color: Color(0xFF818CF8)),
                                          Positioned(
                                            top: -4,
                                            right: -4,
                                            child: Container(
                                              padding: const EdgeInsets.all(4),
                                              decoration: const BoxDecoration(
                                                color: Color(0xFFFDE047),
                                                shape: BoxShape.circle,
                                              ),
                                              child: const Icon(Icons.star, color: Colors.white, size: 12),
                                            ),
                                          ),
                                        ],
                                      ),
                                    )
                                  ],
                                ),
                              ),

                              // Bottom sheet section
                              Container(
                                width: double.infinity,
                                decoration: const BoxDecoration(
                                  color: Colors.white,
                                  borderRadius: BorderRadius.vertical(top: Radius.circular(32)),
                                ),
                                padding: const EdgeInsets.fromLTRB(20, 24, 20, 40),
                                child: Column(
                                  children: [
                                    _buildStatsGrid(),
                                    const SizedBox(height: 24),
                                    _buildStrongSubjects(),
                                    const SizedBox(height: 16),
                                    _buildWeakSubjects(),
                                    const SizedBox(height: 16),
                                    _buildAllSubjects(),
                                  ],
                                ),
                              ),
                            ],
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

  Widget _buildStatsGrid() {
    return GridView.count(
      crossAxisCount: 3,
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      crossAxisSpacing: 12,
      mainAxisSpacing: 12,
      childAspectRatio: 1.8,
      children: [
        _statCard('Questions', '${_progress?['total_questions_solved'] ?? 0}', Icons.help, const Color(0xFF3B82F6), const Color(0xFFEFF6FF)),
        _statCard('Tests', '${_progress?['tests_attempted'] ?? 0}', Icons.assignment_turned_in, const Color(0xFF10B981), const Color(0xFFECFDF5)),
        _statCard('Accuracy', '${_progress?['overall_accuracy'] ?? 0}%', Icons.track_changes, const Color(0xFFF59E0B), const Color(0xFFFFFBEB)),
        _statCard('Streak', '${_progress?['current_streak'] ?? 0}', Icons.local_fire_department, const Color(0xFFEF4444), const Color(0xFFFEF2F2)),
        _statCard('Best', '${_progress?['longest_streak'] ?? 0}', Icons.emoji_events, const Color(0xFF8B5CF6), const Color(0xFFF5F3FF)),
        _statCard('Challenges', '${_progress?['daily_challenges_completed'] ?? 0}', Icons.bolt, const Color(0xFF0D9488), const Color(0xFFF0FDFA)),
      ],
    );
  }

  Widget _statCard(String label, String value, IconData icon, Color iconColor, Color bgColor) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 8),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.03),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
        border: Border.all(color: Colors.grey.shade100),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            padding: const EdgeInsets.all(6),
            decoration: BoxDecoration(color: bgColor, shape: BoxShape.circle),
            child: Icon(icon, color: iconColor, size: 16),
          ),
          const SizedBox(width: 6),
          Expanded(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  value,
                  style: TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w900,
                    color: iconColor,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                Text(
                  label,
                  style: const TextStyle(
                    fontSize: 9,
                    fontWeight: FontWeight.w600,
                    color: Colors.black54,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStrongSubjects() {
    final subjects = _subjectData?['strong_subjects'] ?? [];
    return _buildSectionCard(
      title: 'Strong Subjects',
      titleIcon: Icons.stars,
      titleColor: const Color(0xFF10B981),
      bgColor: const Color(0xFFF0FDF4),
      borderColor: const Color(0xFFDCFCE7),
      children: subjects.isEmpty
          ? [const Text('No data yet', style: TextStyle(color: Colors.black54, fontSize: 12))]
          : subjects.map<Widget>((s) {
              return Padding(
                padding: const EdgeInsets.only(top: 16),
                child: Row(
                  children: [
                    _subjectIcon(s['subject_name']),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Text(
                        s['subject_name'] ?? '',
                        style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14, color: Color(0xFF1F2937)),
                      ),
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                      decoration: BoxDecoration(
                        color: const Color(0xFFDCFCE7),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Column(
                        children: [
                          Text('${s['accuracy']}%', style: const TextStyle(color: Color(0xFF059669), fontWeight: FontWeight.w900, fontSize: 13)),
                          const Text('Strong', style: TextStyle(color: Color(0xFF059669), fontSize: 9, fontWeight: FontWeight.bold)),
                        ],
                      ),
                    )
                  ],
                ),
              );
            }).toList(),
    );
  }

  Widget _buildWeakSubjects() {
    final subjects = _subjectData?['weak_subjects'] ?? [];
    return _buildSectionCard(
      title: 'Needs Improvement',
      titleIcon: Icons.trending_up,
      titleColor: const Color(0xFFEF4444),
      bgColor: const Color(0xFFFFF1F2),
      borderColor: const Color(0xFFFFE4E6),
      children: subjects.isEmpty
          ? [const Text('No data yet', style: TextStyle(color: Colors.black54, fontSize: 12))]
          : subjects.map<Widget>((s) {
              double acc = (s['accuracy'] ?? 0).toDouble();
              return Padding(
                padding: const EdgeInsets.only(top: 16),
                child: Row(
                  children: [
                    _subjectIcon(s['subject_name']),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Text(
                        s['subject_name'] ?? '',
                        style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13, color: Color(0xFF1F2937)),
                      ),
                    ),
                    Text('${s['accuracy']}%', style: const TextStyle(color: Color(0xFFEF4444), fontWeight: FontWeight.bold, fontSize: 12)),
                    const SizedBox(width: 12),
                    SizedBox(
                      width: 60,
                      child: ClipRRect(
                        borderRadius: BorderRadius.circular(4),
                        child: LinearProgressIndicator(
                          value: acc / 100,
                          backgroundColor: const Color(0xFFFECDD3),
                          valueColor: const AlwaysStoppedAnimation<Color>(Color(0xFFE11D48)),
                          minHeight: 4,
                        ),
                      ),
                    )
                  ],
                ),
              );
            }).toList(),
    );
  }

  Widget _buildAllSubjects() {
    final subjects = List<Map<String, dynamic>>.from(_subjectData?['subject_progress'] ?? []);
    return _buildSectionCard(
      title: 'All Subjects',
      titleIcon: Icons.menu_book,
      titleColor: const Color(0xFF1F2937),
      bgColor: const Color(0xFFF8FAFC),
      borderColor: const Color(0xFFF1F5F9),
      iconBgColor: const Color(0xFFE2E8F0),
      children: subjects.isEmpty
          ? [const Text('No data yet', style: TextStyle(color: Colors.black54, fontSize: 12))]
          : subjects.map<Widget>((s) {
              double acc = (s['accuracy'] ?? 0).toDouble();
              Color barColor = acc >= 70 ? const Color(0xFF10B981) : acc >= 40 ? const Color(0xFFF59E0B) : const Color(0xFFEF4444);
              return Padding(
                padding: const EdgeInsets.only(top: 20),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    _subjectIcon(s['subject_name']),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text(s['subject_name'] ?? '', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: Color(0xFF1F2937))),
                              Text('${s['accuracy']}% (${s['questions_attempted']} Q)', style: const TextStyle(color: Colors.black54, fontSize: 11, fontWeight: FontWeight.w500)),
                            ],
                          ),
                          const SizedBox(height: 8),
                          ClipRRect(
                            borderRadius: BorderRadius.circular(4),
                            child: LinearProgressIndicator(
                              value: acc / 100,
                              backgroundColor: Colors.grey.shade200,
                              valueColor: AlwaysStoppedAnimation<Color>(barColor),
                              minHeight: 5,
                            ),
                          ),
                        ],
                      ),
                    )
                  ],
                ),
              );
            }).toList(),
    );
  }

  Widget _buildSectionCard({
    required String title,
    required IconData titleIcon,
    required Color titleColor,
    required Color bgColor,
    required Color borderColor,
    Color? iconBgColor,
    required List<Widget> children,
  }) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: bgColor,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: borderColor, width: 1.5),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(6),
                decoration: BoxDecoration(color: iconBgColor ?? titleColor.withOpacity(0.15), shape: BoxShape.circle),
                child: Icon(titleIcon, color: titleColor, size: 16),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Text(title, style: TextStyle(fontWeight: FontWeight.w900, fontSize: 15, color: titleColor)),
              ),
              const Icon(Icons.chevron_right, color: Colors.black54, size: 20),
            ],
          ),
          const SizedBox(height: 8),
          ...children,
        ],
      ),
    );
  }

  Widget _subjectIcon(String? name) {
    String n = name?.toLowerCase() ?? '';
    String initial = name != null && name.isNotEmpty ? name[0].toUpperCase() : 'S';
    
    Color bgColor = Colors.blue.shade50;
    Color fgColor = Colors.blue.shade700;
    
    if (n.contains('python')) { bgColor = const Color(0xFFFEF9C3); fgColor = const Color(0xFFCA8A04); }
    else if (n.contains('java')) { bgColor = const Color(0xFFFEF08A); fgColor = const Color(0xFFB45309); }
    else if (n.contains('mongo')) { bgColor = const Color(0xFFDCFCE7); fgColor = const Color(0xFF15803D); }
    else if (n.contains('c++') || n.contains('cpp')) { bgColor = const Color(0xFFDBEAFE); fgColor = const Color(0xFF1D4ED8); }

    return Container(
      width: 36,
      height: 36,
      decoration: BoxDecoration(
        color: Colors.white,
        shape: BoxShape.circle,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 6,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Center(
        child: Container(
          width: 24,
          height: 24,
          decoration: BoxDecoration(
            color: bgColor,
            borderRadius: BorderRadius.circular(6),
          ),
          child: Center(
            child: Text(
              initial,
              style: TextStyle(color: fgColor, fontWeight: FontWeight.w900, fontSize: 14),
            ),
          ),
        ),
      ),
    );
  }
}

