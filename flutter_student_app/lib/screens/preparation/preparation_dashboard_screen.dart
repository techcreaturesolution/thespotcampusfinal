import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../services/api_service.dart';

class PreparationDashboardScreen extends StatefulWidget {
  const PreparationDashboardScreen({super.key});

  @override
  State<PreparationDashboardScreen> createState() => _PreparationDashboardScreenState();
}

class _PreparationDashboardScreenState extends State<PreparationDashboardScreen> {
  Map<String, dynamic>? _progress;
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _fetchProgress();
  }

  Future<void> _fetchProgress() async {
    try {
      setState(() {
        _isLoading = true;
      });
      final api = Provider.of<ApiService>(context, listen: false);
      final data = await api.get('/preparation/progress');
      setState(() { 
        _progress = data['progress']; 
        _isLoading = false; 
      });
    } catch (e) {
      setState(() {
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFFAFAFA),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: _fetchProgress,
              child: SingleChildScrollView(
                physics: const AlwaysScrollableScrollPhysics(),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    _buildHeaderSection(),
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 20),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          _buildSectionTitle(Icons.trending_up, 'Your Progress', null),
                          const SizedBox(height: 16),
                          _buildStatsRow(),
                          const SizedBox(height: 32),
                          _buildSectionTitle(Icons.layers, 'Study Modules', null),
                          const SizedBox(height: 16),
                          _buildModuleGrid(),
                          const SizedBox(height: 40),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
    );
  }

  Widget _buildHeaderSection() {
    return Container(
      padding: EdgeInsets.only(
        top: MediaQuery.of(context).padding.top + 16,
        left: 20,
        right: 20,
        bottom: 32,
      ),
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [Color(0xFFF5F3FF), Color(0xFFE0E7FF)], 
        ),
        borderRadius: BorderRadius.only(
          bottomLeft: Radius.circular(32),
          bottomRight: Radius.circular(32),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              IconButton(
                icon: const Icon(Icons.arrow_back_ios_new, color: Color(0xFF1E293B), size: 20),
                onPressed: () => Navigator.pop(context),
              ),
              const Expanded(
                child: Center(
                  child: Padding(
                    padding: EdgeInsets.only(right: 40.0), // counterbalance the back button for centering
                    child: Text(
                      'Preparation',
                      style: TextStyle(
                        fontSize: 22,
                        fontWeight: FontWeight.w900,
                        color: Color(0xFF1E293B),
                      ),
                    ),
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 32),
          Row(
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              Expanded(
                flex: 3,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'Keep going!',
                      style: TextStyle(
                        fontSize: 24,
                        fontWeight: FontWeight.w900,
                        color: Color(0xFF4F46E5),
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      'Every question brings you closer\nto your goal.',
                      style: TextStyle(
                        fontSize: 14,
                        color: Colors.grey.shade700,
                        height: 1.4,
                      ),
                    ),
                  ],
                ),
              ),
              Expanded(
                flex: 2,
                child: SizedBox(
                  height: 100,
                  child: Stack(
                    alignment: Alignment.centerRight,
                    children: [
                      Positioned(
                        right: 16,
                        top: 0,
                        child: Container(
                          width: 70,
                          height: 80,
                          decoration: BoxDecoration(
                            color: Colors.white.withOpacity(0.6),
                            borderRadius: BorderRadius.circular(16),
                            boxShadow: [
                              BoxShadow(
                                color: const Color(0xFF6366F1).withOpacity(0.2),
                                blurRadius: 10,
                                offset: const Offset(0, 4),
                              ),
                            ],
                          ),
                          child: const Icon(Icons.assignment_turned_in, size: 40, color: Color(0xFF6366F1)),
                        ),
                      ),
                      Positioned(
                        right: 0,
                        bottom: 0,
                        child: Container(
                          width: 50,
                          height: 50,
                          decoration: BoxDecoration(
                            color: const Color(0xFF818CF8),
                            shape: BoxShape.circle,
                            border: Border.all(color: Colors.white, width: 4),
                          ),
                          child: const Icon(Icons.track_changes, size: 24, color: Colors.white),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildSectionTitle(IconData icon, String title, String? actionText) {
    return Row(
      children: [
        Icon(icon, color: const Color(0xFF4F46E5), size: 22),
        const SizedBox(width: 8),
        Text(
          title,
          style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w800, color: Color(0xFF1E293B)),
        ),
        const Spacer(),
        if (actionText != null)
          Text(
            actionText,
            style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w700, color: Color(0xFF4F46E5)),
          ),
      ],
    );
  }

  Widget _buildStatsRow() {
    return Row(
      children: [
        _buildStatCard('Solved', '${_progress?['total_questions_solved'] ?? 0}', const Color(0xFF4F46E5), Icons.menu_book),
        const SizedBox(width: 12),
        _buildStatCard('Tests', '${_progress?['tests_attempted'] ?? 0}', const Color(0xFF10B981), Icons.assignment),
        const SizedBox(width: 12),
        _buildStatCard('Accuracy', '${_progress?['overall_accuracy'] ?? 0}%', const Color(0xFFF59E0B), Icons.track_changes),
        const SizedBox(width: 12),
        _buildStatCard('Streak', '${_progress?['current_streak'] ?? 0}', const Color(0xFFEF4444), Icons.local_fire_department),
      ],
    );
  }

  Widget _buildStatCard(String label, String value, Color color, IconData icon) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 4),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(20),
          boxShadow: [
            BoxShadow(
              color: color.withOpacity(0.12),
              blurRadius: 15,
              offset: const Offset(0, 8),
            ),
          ],
        ),
        child: Column(
          children: [
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: color,
                borderRadius: BorderRadius.circular(12),
              ),
              child: Icon(icon, color: Colors.white, size: 22),
            ),
            const SizedBox(height: 16),
            Text(value, style: TextStyle(fontSize: 22, fontWeight: FontWeight.w900, color: color)),
            const SizedBox(height: 4),
            Text(
              label,
              style: const TextStyle(fontSize: 11, color: Colors.black54, fontWeight: FontWeight.w600),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildModuleGrid() {
    final modules = [
      {'icon': Icons.description, 'title': 'Previous Year Papers', 'route': '/preparation/previous-papers', 'color': const Color(0xFF4F46E5)},
      {'icon': Icons.assignment_turned_in, 'title': 'Mock Tests', 'route': '/preparation/mock-tests', 'color': const Color(0xFF9333EA)},
      {'icon': Icons.menu_book, 'title': 'Subject Practice', 'route': '/preparation/subjects', 'color': const Color(0xFF10B981)},
      {'icon': Icons.picture_as_pdf, 'title': 'Reading Material', 'route': '/preparation/reading', 'color': const Color(0xFFF59E0B)},
      {'icon': Icons.bolt, 'title': 'Daily Challenge', 'route': '/preparation/daily-challenge', 'color': const Color(0xFFEF4444)},
      {'icon': Icons.trending_up, 'title': 'Performance Analytics', 'route': '/preparation/performance', 'color': const Color(0xFF3B82F6)},
    ];

    return GridView.count(
      crossAxisCount: 2,
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      crossAxisSpacing: 16,
      mainAxisSpacing: 16,
      childAspectRatio: 2.1,
      children: modules.map((m) => _buildModuleCard(m)).toList(),
    );
  }

  Widget _buildModuleCard(Map<String, dynamic> module) {
    final color = module['color'] as Color;
    return InkWell(
      onTap: () => Navigator.pushNamed(context, module['route'] as String),
      borderRadius: BorderRadius.circular(16),
      child: Container(
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.04),
              blurRadius: 10,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: ClipRRect(
          borderRadius: BorderRadius.circular(16),
          child: Container(
            decoration: BoxDecoration(
              border: Border(
                left: BorderSide(color: color, width: 4),
              ),
            ),
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
            child: Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: color,
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Icon(module['icon'] as IconData, color: Colors.white, size: 20),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    module['title'] as String,
                    style: const TextStyle(
                      fontWeight: FontWeight.w800,
                      fontSize: 12,
                      color: Color(0xFF1E293B),
                      height: 1.2,
                    ),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
                Icon(Icons.chevron_right, color: Colors.grey.shade400, size: 18),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
