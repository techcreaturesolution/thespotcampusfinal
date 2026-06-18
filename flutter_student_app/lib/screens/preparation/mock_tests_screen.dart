import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../services/api_service.dart';

class MockTestsScreen extends StatefulWidget {
  const MockTestsScreen({super.key});

  @override
  State<MockTestsScreen> createState() => _MockTestsScreenState();
}

class _MockTestsScreenState extends State<MockTestsScreen> {
  List<dynamic> _mockTests = [];
  bool _isLoading = true;
  String _filter = '';

  @override
  void initState() {
    super.initState();
    _fetchMockTests();
  }

  Future<void> _fetchMockTests() async {
    try {
      final api = Provider.of<ApiService>(context, listen: false);
      final params = _filter.isNotEmpty ? '?test_type=$_filter' : '';
      final data = await api.get('/preparation/mock-tests/active$params');
      setState(() { _mockTests = data['mockTests'] ?? []; _isLoading = false; });
    } catch (e) {
      setState(() => _isLoading = false);
    }
  }

  Future<void> _startTest(String id) async {
    try {
      final api = Provider.of<ApiService>(context, listen: false);
      final data = await api.post('/preparation/mock-tests/$id/start', {});
      if (mounted) {
        Navigator.pushNamed(context, '/preparation/take-test', arguments: {
          'attempt': data['attempt'],
          'questions': data['questions'],
          'mockTestId': id,
        });
      }
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Failed to start: $e')));
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Mock Tests')),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : Column(
              children: [
                SizedBox(
                  height: 44,
                  child: ListView(
                    scrollDirection: Axis.horizontal,
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
                    children: ['', 'company', 'subject', 'topic', 'mixed'].map((t) {
                      return Padding(
                        padding: const EdgeInsets.only(right: 8),
                        child: FilterChip(
                          label: Text(t.isEmpty ? 'All' : t[0].toUpperCase() + t.substring(1), style: const TextStyle(fontSize: 12)),
                          selected: _filter == t,
                          onSelected: (_) { setState(() => _filter = t); _fetchMockTests(); },
                        ),
                      );
                    }).toList(),
                  ),
                ),
                Expanded(
                  child: ListView.builder(
                    padding: const EdgeInsets.all(16),
                    itemCount: _mockTests.length,
                    itemBuilder: (ctx, i) => _buildTestCard(_mockTests[i]),
                  ),
                ),
              ],
            ),
    );
  }

  Widget _buildTestCard(Map<String, dynamic> test) {
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Expanded(child: Text(test['title'] ?? '', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14))),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                  decoration: BoxDecoration(color: Colors.indigo.shade50, borderRadius: BorderRadius.circular(8)),
                  child: Text(test['test_type'] ?? '', style: TextStyle(fontSize: 10, color: Colors.indigo.shade700)),
                ),
              ],
            ),
            const SizedBox(height: 8),
            Row(
              children: [
                Icon(Icons.quiz, size: 14, color: Colors.grey.shade500),
                const SizedBox(width: 4),
                Text('${test['total_questions']} Q', style: TextStyle(fontSize: 12, color: Colors.grey.shade600)),
                const SizedBox(width: 12),
                Icon(Icons.timer, size: 14, color: Colors.grey.shade500),
                const SizedBox(width: 4),
                Text('${test['duration_minutes']} min', style: TextStyle(fontSize: 12, color: Colors.grey.shade600)),
                if (test['negative_marking'] == true) ...[
                  const SizedBox(width: 12),
                  Text('-ve', style: TextStyle(fontSize: 11, color: Colors.red.shade600)),
                ],
              ],
            ),
            const SizedBox(height: 12),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton.icon(
                onPressed: () => _startTest(test['_id']),
                icon: const Icon(Icons.play_arrow, size: 18),
                label: const Text('Start Test'),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
