import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../services/api_service.dart';

class TestResultScreen extends StatefulWidget {
  const TestResultScreen({super.key});

  @override
  State<TestResultScreen> createState() => _TestResultScreenState();
}

class _TestResultScreenState extends State<TestResultScreen> {
  Map<String, dynamic>? _result;
  bool _isLoading = true;
  String _title = 'Test Result';

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    final args = ModalRoute.of(context)!.settings.arguments as Map<String, dynamic>? ?? {};
    final attemptId = args['attemptId'] as String?;
    if (args['mockTestTitle'] != null) {
      _title = args['mockTestTitle'];
    }
    if (attemptId != null) {
      _fetchResult(attemptId);
    } else {
      setState(() => _isLoading = false);
    }
  }

  Future<void> _fetchResult(String attemptId) async {
    try {
      final api = Provider.of<ApiService>(context, listen: false);
      final data = await api.get('/preparation/mock-tests/result/$attemptId');
      if (mounted) {
        setState(() {
          _result = data['result'];
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() => _isLoading = false);
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Failed to load result')));
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return Scaffold(
        appBar: AppBar(title: Text(_title)),
        body: const Center(child: CircularProgressIndicator()),
      );
    }

    if (_result == null) {
      return Scaffold(
        appBar: AppBar(title: Text(_title)),
        body: const Center(child: Text('Result not found')),
      );
    }

    final score = _result!['score'] ?? 0;
    final totalMarks = _result!['total_marks'] ?? 1;
    final correct = _result!['total_correct'] ?? 0;
    final totalQ = _result!['total_questions'] ?? 1;
    final wrong = _result!['total_wrong'] ?? 0;
    final unattempted = _result!['total_unattempted'] ?? 0;
    final percent = totalMarks > 0 ? (score / totalMarks * 100).toStringAsFixed(1) : '0';
    final passed = score >= (totalMarks * 0.4);

    return Scaffold(
      backgroundColor: const Color(0xFFF9FAFB),
      appBar: AppBar(
        title: const Text('Test Result'),
        automaticallyImplyLeading: false,
        backgroundColor: Colors.white,
        elevation: 0,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            // Score card
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: passed
                      ? [const Color(0xFF059669), const Color(0xFF10B981)]
                      : [const Color(0xFFDC2626), const Color(0xFFEF4444)],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                borderRadius: BorderRadius.circular(20),
              ),
              child: Column(
                children: [
                  Icon(
                    passed ? Icons.emoji_events : Icons.sentiment_dissatisfied_outlined,
                    color: Colors.white,
                    size: 48,
                  ),
                  const SizedBox(height: 8),
                  Text(
                    passed ? 'Congratulations!' : 'Better Luck Next Time',
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 20,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    _title,
                    style: TextStyle(color: Colors.white.withOpacity(0.85), fontSize: 13),
                  ),
                  const SizedBox(height: 16),
                  Text(
                    '$percent%',
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 52,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  Text(
                    '$correct / $totalQ correct',
                    style: TextStyle(color: Colors.white.withOpacity(0.9), fontSize: 15),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),
            // Stats row
            Row(
              children: [
                _StatCard(label: 'Correct', value: '$correct', color: const Color(0xFF059669), icon: Icons.check_circle_outline),
                const SizedBox(width: 10),
                _StatCard(label: 'Wrong', value: '$wrong', color: const Color(0xFFDC2626), icon: Icons.cancel_outlined),
                const SizedBox(width: 10),
                _StatCard(label: 'Skipped', value: '$unattempted', color: const Color(0xFFD97706), icon: Icons.remove_circle_outline),
              ],
            ),
            const SizedBox(height: 20),
            
            SizedBox(
              width: double.infinity,
              child: ElevatedButton.icon(
                onPressed: () => Navigator.pop(context),
                icon: const Icon(Icons.arrow_back, size: 16),
                label: const Text('Back to Tests'),
                style: ElevatedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _StatCard extends StatelessWidget {
  final String label;
  final String value;
  final Color color;
  final IconData icon;

  const _StatCard({
    required this.label,
    required this.value,
    required this.color,
    required this.icon,
  });

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 12),
        decoration: BoxDecoration(
          color: color.withOpacity(0.08),
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: color.withOpacity(0.2)),
        ),
        child: Column(
          children: [
            Icon(icon, color: color, size: 24),
            const SizedBox(height: 6),
            Text(value, style: TextStyle(fontWeight: FontWeight.bold, fontSize: 22, color: color)),
            const SizedBox(height: 2),
            Text(label, style: TextStyle(fontSize: 11, color: color.withOpacity(0.8))),
          ],
        ),
      ),
    );
  }
}
