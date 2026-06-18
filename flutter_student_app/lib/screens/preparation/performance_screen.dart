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
      appBar: AppBar(title: const Text('Performance')),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: _fetchData,
              child: ListView(
                padding: const EdgeInsets.all(16),
                children: [
                  _buildStatsGrid(),
                  const SizedBox(height: 20),
                  _buildSubjectSection('Strong Subjects', _subjectData?['strong_subjects'] ?? [], Colors.green),
                  const SizedBox(height: 16),
                  _buildSubjectSection('Needs Improvement', _subjectData?['weak_subjects'] ?? [], Colors.red),
                  const SizedBox(height: 16),
                  _buildAllSubjects(),
                ],
              ),
            ),
    );
  }

  Widget _buildStatsGrid() {
    return GridView.count(
      crossAxisCount: 3,
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      crossAxisSpacing: 10,
      mainAxisSpacing: 10,
      childAspectRatio: 1.2,
      children: [
        _statTile('Questions', '${_progress?['total_questions_solved'] ?? 0}', Colors.indigo),
        _statTile('Tests', '${_progress?['tests_attempted'] ?? 0}', Colors.green),
        _statTile('Accuracy', '${_progress?['overall_accuracy'] ?? 0}%', Colors.amber.shade700),
        _statTile('Streak', '${_progress?['current_streak'] ?? 0}', Colors.red),
        _statTile('Best', '${_progress?['longest_streak'] ?? 0}', Colors.purple),
        _statTile('Challenges', '${_progress?['daily_challenges_completed'] ?? 0}', Colors.teal),
      ],
    );
  }

  Widget _statTile(String label, String value, Color color) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.grey.shade200),
      ),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Text(value, style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: color)),
          const SizedBox(height: 4),
          Text(label, style: TextStyle(fontSize: 10, color: Colors.grey.shade600)),
        ],
      ),
    );
  }

  Widget _buildSubjectSection(String title, List<dynamic> subjects, Color color) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(title, style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14, color: color)),
            const SizedBox(height: 12),
            if (subjects.isEmpty) Text('No data yet', style: TextStyle(fontSize: 12, color: Colors.grey.shade500)),
            ...subjects.map((s) => Padding(
              padding: const EdgeInsets.only(bottom: 8),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(s['subject_name'] ?? '', style: const TextStyle(fontSize: 13)),
                  Text('${s['accuracy']}%', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: color)),
                ],
              ),
            )),
          ],
        ),
      ),
    );
  }

  Widget _buildAllSubjects() {
    final subjects = List<Map<String, dynamic>>.from(_subjectData?['subject_progress'] ?? []);
    if (subjects.isEmpty) return const SizedBox.shrink();
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('All Subjects', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
            const SizedBox(height: 12),
            ...subjects.map((s) => Padding(
              padding: const EdgeInsets.only(bottom: 10),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(s['subject_name'] ?? '', style: const TextStyle(fontSize: 12)),
                      Text('${s['accuracy']}% (${s['questions_attempted']}Q)', style: TextStyle(fontSize: 11, color: Colors.grey.shade600)),
                    ],
                  ),
                  const SizedBox(height: 4),
                  ClipRRect(
                    borderRadius: BorderRadius.circular(4),
                    child: LinearProgressIndicator(
                      value: (s['accuracy'] ?? 0) / 100.0,
                      backgroundColor: Colors.grey.shade200,
                      valueColor: AlwaysStoppedAnimation<Color>(
                        (s['accuracy'] ?? 0) >= 70 ? Colors.green : (s['accuracy'] ?? 0) >= 40 ? Colors.amber : Colors.red,
                      ),
                      minHeight: 6,
                    ),
                  ),
                ],
              ),
            )),
          ],
        ),
      ),
    );
  }
}
