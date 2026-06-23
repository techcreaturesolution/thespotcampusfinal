import 'package:flutter/material.dart';

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

  // TODO: STATIC DATA – remove when API is ready
  static const List<Map<String, dynamic>> _staticMockTests = [
    {
      '_id': 'mock1',
      'title': 'TCS NQT Full Mock Test',
      'test_type': 'company',
      'total_questions': 50,
      'duration_minutes': 60,
      'negative_marking': true,
      'difficulty': 'medium',
    },
    {
      '_id': 'mock2',
      'title': 'Infosys Aptitude Mock – Set 1',
      'test_type': 'company',
      'total_questions': 40,
      'duration_minutes': 45,
      'negative_marking': false,
      'difficulty': 'easy',
    },
    {
      '_id': 'mock3',
      'title': 'Data Structures & Algorithms Test',
      'test_type': 'subject',
      'total_questions': 30,
      'duration_minutes': 30,
      'negative_marking': false,
      'difficulty': 'hard',
    },
    {
      '_id': 'mock4',
      'title': 'Wipro WILP Mock Exam',
      'test_type': 'company',
      'total_questions': 60,
      'duration_minutes': 75,
      'negative_marking': true,
      'difficulty': 'medium',
    },
    {
      '_id': 'mock5',
      'title': 'Verbal Reasoning – Mixed Test',
      'test_type': 'mixed',
      'total_questions': 25,
      'duration_minutes': 20,
      'negative_marking': false,
      'difficulty': 'easy',
    },
    {
      '_id': 'mock6',
      'title': 'Quantitative Aptitude Sprint',
      'test_type': 'topic',
      'total_questions': 20,
      'duration_minutes': 25,
      'negative_marking': true,
      'difficulty': 'medium',
    },
  ];

  Future<void> _fetchMockTests() async {
    // TODO: Uncomment API call and remove static data below when backend is ready
    // try {
    //   final api = Provider.of<ApiService>(context, listen: false);
    //   final params = _filter.isNotEmpty ? '?test_type=$_filter' : '';
    //   final data = await api.get('/preparation/mock-tests/active$params');
    //   setState(() { _mockTests = data['mockTests'] ?? []; _isLoading = false; });
    // } catch (e) {
    //   setState(() => _isLoading = false);
    // }

    await Future.delayed(const Duration(milliseconds: 300)); // simulate loading
    final filtered = _filter.isEmpty
        ? _staticMockTests
        : _staticMockTests.where((t) => t['test_type'] == _filter).toList();
    setState(() { _mockTests = filtered; _isLoading = false; });
  }


  // TODO: Static dummy questions for take-test UI preview – replace with API call when ready
  static const List<Map<String, dynamic>> _staticQuestions = [
    {
      'question_text': 'A train travels 360 km at a uniform speed. If the speed had been 5 km/h more, it would have taken 1 hour less. Find the speed of the train.',
      'options': [{'text': '40 km/h'}, {'text': '45 km/h'}, {'text': '36 km/h'}, {'text': '30 km/h'}],
      'correct_option_index': 0,
      'explanation': 'Using speed–distance–time relation: 360/s - 360/(s+5) = 1 → s = 40 km/h.',
    },
    {
      'question_text': 'Which data structure is used to implement recursion?',
      'options': [{'text': 'Queue'}, {'text': 'Stack'}, {'text': 'Array'}, {'text': 'Linked List'}],
      'correct_option_index': 1,
      'explanation': 'Function call stack is used internally by the OS/compiler to manage recursion.',
    },
    {
      'question_text': 'Find the odd one out: 2, 5, 10, 17, 26, 37, 50, 64',
      'options': [{'text': '37'}, {'text': '50'}, {'text': '64'}, {'text': '26'}],
      'correct_option_index': 2,
      'explanation': 'The series is n²+1: 5, 10, 17, 26, 37, 50, 65. So 64 should be 65.',
    },
    {
      'question_text': 'What is the time complexity of binary search?',
      'options': [{'text': 'O(n)'}, {'text': 'O(n²)'}, {'text': 'O(log n)'}, {'text': 'O(n log n)'}],
      'correct_option_index': 2,
      'explanation': 'Binary search halves the search space at each step, giving O(log n) complexity.',
    },
    {
      'question_text': 'What does SQL stand for?',
      'options': [{'text': 'Structured Query Language'}, {'text': 'Simple Query Language'}, {'text': 'Standard Question Language'}, {'text': 'Sequential Query Logic'}],
      'correct_option_index': 0,
      'explanation': 'SQL stands for Structured Query Language, used to manage relational databases.',
    },
  ];

  Future<void> _startTest(Map<String, dynamic> test) async {
    // TODO: Replace with real API call when backend is ready:
    // final api = Provider.of<ApiService>(context, listen: false);
    // final data = await api.post('/preparation/mock-tests/${test['_id']}/start', {});
    // Navigator.pushNamed(context, '/preparation/take-test', arguments: {
    //   'attempt': data['attempt'],
    //   'questions': data['questions'],
    //   'mockTestId': test['_id'],
    //   'mockTestTitle': test['title'],
    //   'durationMinutes': test['duration_minutes'],
    // });

    if (!mounted) return;
    Navigator.pushNamed(context, '/preparation/take-test', arguments: {
      'questions': _staticQuestions,
      'mockTestTitle': test['title'] ?? 'Mock Test',
      'durationMinutes': test['duration_minutes'] ?? 30,
    });
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
                onPressed: () => _startTest(test),
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
