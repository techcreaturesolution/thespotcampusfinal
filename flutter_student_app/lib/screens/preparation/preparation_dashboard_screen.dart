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
      final api = Provider.of<ApiService>(context, listen: false);
      final data = await api.get('/preparation/progress');
      setState(() { _progress = data['progress']; _isLoading = false; });
    } catch (e) {
      setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Preparation')),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: _fetchProgress,
              child: ListView(
                padding: const EdgeInsets.all(16),
                children: [
                  _buildStatsRow(),
                  const SizedBox(height: 24),
                  _buildModuleGrid(),
                ],
              ),
            ),
    );
  }

  Widget _buildStatsRow() {
    return Row(
      children: [
        _buildStatCard('Solved', '${_progress?['total_questions_solved'] ?? 0}', Colors.indigo),
        const SizedBox(width: 8),
        _buildStatCard('Tests', '${_progress?['tests_attempted'] ?? 0}', Colors.green),
        const SizedBox(width: 8),
        _buildStatCard('Accuracy', '${_progress?['overall_accuracy'] ?? 0}%', Colors.amber.shade700),
        const SizedBox(width: 8),
        _buildStatCard('Streak', '${_progress?['current_streak'] ?? 0}', Colors.red),
      ],
    );
  }

  Widget _buildStatCard(String label, String value, Color color) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 16),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: Colors.grey.shade200),
        ),
        child: Column(
          children: [
            Text(value, style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: color)),
            const SizedBox(height: 4),
            Text(label, style: TextStyle(fontSize: 11, color: Colors.grey.shade600)),
          ],
        ),
      ),
    );
  }

  Widget _buildModuleGrid() {
    final modules = [
      {'icon': Icons.history_edu, 'title': 'Previous Year Papers', 'route': '/preparation/previous-papers', 'color': Colors.blue},
      {'icon': Icons.quiz, 'title': 'Mock Tests', 'route': '/preparation/mock-tests', 'color': Colors.purple},
      {'icon': Icons.menu_book, 'title': 'Subject Practice', 'route': '/preparation/subjects', 'color': Colors.green},
      {'icon': Icons.picture_as_pdf, 'title': 'Reading Material', 'route': '/preparation/reading', 'color': Colors.orange},
      {'icon': Icons.bolt, 'title': 'Daily Challenge', 'route': '/preparation/daily-challenge', 'color': Colors.red},
      {'icon': Icons.trending_up, 'title': 'Performance', 'route': '/preparation/performance', 'color': Colors.indigo},
    ];

    return GridView.count(
      crossAxisCount: 2,
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      crossAxisSpacing: 12,
      mainAxisSpacing: 12,
      childAspectRatio: 1.3,
      children: modules.map((m) => _buildModuleCard(m)).toList(),
    );
  }

  Widget _buildModuleCard(Map<String, dynamic> module) {
    return InkWell(
      onTap: () => Navigator.pushNamed(context, module['route'] as String),
      borderRadius: BorderRadius.circular(16),
      child: Container(
        decoration: BoxDecoration(
          color: (module['color'] as Color).withOpacity(0.05),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: (module['color'] as Color).withOpacity(0.2)),
        ),
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(module['icon'] as IconData, color: module['color'] as Color, size: 28),
            const SizedBox(height: 12),
            Text(module['title'] as String, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13)),
          ],
        ),
      ),
    );
  }
}
