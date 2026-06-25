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
  List<dynamic> _questions = [];
  bool _isLoading = true;
  String _title = 'Test Result';
  bool _showDetails = false;

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
          _result = data['attempt'];
          _questions = data['questions'] ?? [];
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
    final mockTest = _result!['mock_test_id'] ?? {};
    final marksPerQuestion = mockTest['marks_per_question'] ?? 1;
    final totalQ = _result!['total_questions'] ?? 1;
    final totalMarks = totalQ * (marksPerQuestion is num ? marksPerQuestion : 1);
    final correct = _result!['correct_answers'] ?? 0;
    final wrong = _result!['wrong_answers'] ?? 0;
    final unattempted = _result!['skipped'] ?? 0;
    final percent = _result!['accuracy']?.toString() ?? '0'; // Use accuracy calculated by backend
    final passingPercentage = mockTest['passing_percentage'] ?? 40;
    final passed = (num.tryParse(percent) ?? 0) >= passingPercentage;

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
            // Compact Status Banner
            Container(
              width: double.infinity,
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
              decoration: BoxDecoration(
                color: passed ? const Color(0xFFECFDF5) : const Color(0xFFFEF2F2),
                borderRadius: BorderRadius.circular(16),
                border: Border.all(
                  color: passed ? const Color(0xFFA7F3D0) : const Color(0xFFFECACA),
                  width: 1.5,
                ),
              ),
              child: Row(
                children: [
                  // Left side: Icon and text
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Icon(
                              passed ? Icons.verified_rounded : Icons.error_outline_rounded,
                              color: passed ? const Color(0xFF059669) : const Color(0xFFDC2626),
                              size: 24,
                            ),
                            const SizedBox(width: 8),
                            Expanded(
                              child: Text(
                                passed ? 'Passed Successfully!' : 'Test Not Passed',
                                style: TextStyle(
                                  color: passed ? const Color(0xFF065F46) : const Color(0xFF991B1B),
                                  fontSize: 16,
                                  fontWeight: FontWeight.w800,
                                ),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 6),
                        Text(
                          _title,
                          style: TextStyle(
                            color: passed ? const Color(0xFF047857).withOpacity(0.7) : const Color(0xFFB91C1C).withOpacity(0.7),
                            fontSize: 12,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ],
                    ),
                  ),
                  
                  // Right side: Score
                  Container(
                    padding: const EdgeInsets.only(left: 16),
                    decoration: BoxDecoration(
                      border: Border(
                        left: BorderSide(
                          color: passed ? const Color(0xFF6EE7B7).withOpacity(0.5) : const Color(0xFFFCA5A5).withOpacity(0.5),
                        ),
                      ),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.end,
                      children: [
                        Row(
                          crossAxisAlignment: CrossAxisAlignment.baseline,
                          textBaseline: TextBaseline.alphabetic,
                          children: [
                            Text(
                              '$percent',
                              style: TextStyle(
                                color: passed ? const Color(0xFF059669) : const Color(0xFFDC2626),
                                fontSize: 32,
                                fontWeight: FontWeight.w900,
                                letterSpacing: -1,
                                height: 1,
                              ),
                            ),
                            Text(
                              '%',
                              style: TextStyle(
                                color: passed ? const Color(0xFF059669).withOpacity(0.7) : const Color(0xFFDC2626).withOpacity(0.7),
                                fontSize: 16,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 4),
                        Text(
                          '$correct / $totalQ Correct',
                          style: TextStyle(
                            color: passed ? const Color(0xFF047857) : const Color(0xFFB91C1C),
                            fontSize: 10,
                            fontWeight: FontWeight.w800,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 20),
            // Modern Stats Grid
            Row(
              children: [
                _StatCard(label: 'Correct', value: '$correct', color: const Color(0xFF10B981), bgColor: const Color(0xFFECFDF5), icon: Icons.check_circle_rounded),
                const SizedBox(width: 12),
                _StatCard(label: 'Wrong', value: '$wrong', color: const Color(0xFFEF4444), bgColor: const Color(0xFFFEF2F2), icon: Icons.cancel_rounded),
                const SizedBox(width: 12),
                _StatCard(label: 'Skipped', value: '$unattempted', color: const Color(0xFF64748B), bgColor: const Color(0xFFF8FAFC), icon: Icons.remove_circle_rounded),
              ],
            ),
            const SizedBox(height: 32),

            // Toggle Details Review Button
            SizedBox(
              width: double.infinity,
              height: 52,
              child: OutlinedButton.icon(
                onPressed: () => setState(() => _showDetails = !_showDetails),
                icon: Icon(_showDetails ? Icons.visibility_off_rounded : Icons.visibility_rounded, size: 20),
                label: Text(
                  _showDetails ? 'Hide Detailed Solutions Review' : 'Show Detailed Solutions Review',
                  style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w700),
                ),
                style: OutlinedButton.styleFrom(
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                  foregroundColor: const Color(0xFF3B82F6),
                  side: const BorderSide(color: Color(0xFFBFDBFE), width: 1.5),
                  backgroundColor: const Color(0xFFEFF6FF),
                  elevation: 0,
                ),
              ),
            ),
            const SizedBox(height: 24),

            // Detailed Solutions Review List
            if (_showDetails && _questions.isNotEmpty) ...[
              const SizedBox(height: 8),
              ...List.generate(_result!['answers']?.length ?? 0, (i) {
                final a = _result!['answers'][i];
                final qId = a['question_id']?.toString() ?? a['question_id'];
                final q = _questions.firstWhere((item) => item['_id'] == qId, orElse: () => null);
                if (q == null) return const SizedBox.shrink();

                final isSkipped = a['is_skipped'] ?? false;
                final isCorrect = a['is_correct'] ?? false;
                final userSelected = a['selected_option'];

                return Container(
                  margin: const EdgeInsets.only(bottom: 16),
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: Colors.grey.shade200),
                    boxShadow: [
                      BoxShadow(color: Colors.black.withOpacity(0.02), blurRadius: 4, offset: const Offset(0, 2))
                    ]
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Question header
                      Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          if (isSkipped)
                            Container(
                              width: 24, height: 24,
                              margin: const EdgeInsets.only(right: 12, top: 2),
                              decoration: BoxDecoration(color: Colors.grey.shade100, shape: BoxShape.circle, border: Border.all(color: Colors.grey.shade300)),
                              child: const Icon(Icons.remove, size: 14, color: Colors.grey),
                            )
                          else if (isCorrect)
                            Container(
                              width: 24, height: 24,
                              margin: const EdgeInsets.only(right: 12, top: 2),
                              decoration: const BoxDecoration(color: Color(0xFF10B981), shape: BoxShape.circle),
                              child: const Icon(Icons.check, size: 14, color: Colors.white),
                            )
                          else
                            Container(
                              width: 24, height: 24,
                              margin: const EdgeInsets.only(right: 12, top: 2),
                              decoration: const BoxDecoration(color: Color(0xFFEF4444), shape: BoxShape.circle),
                              child: const Icon(Icons.close, size: 14, color: Colors.white),
                            ),
                          Expanded(
                            child: Text(
                              'Q${i + 1}. ${q['question_text'] ?? ''}',
                              style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14, color: Colors.black87),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 16),
                      // Options
                      Padding(
                        padding: const EdgeInsets.only(left: 36),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            ...List.generate((q['options'] as List?)?.length ?? 0, (idx) {
                              final opt = q['options'][idx];
                              final isCorrectIndex = idx == q['correct_option_index'];
                              final isUserSelectedIndex = idx == userSelected;

                              Color bgColor = Colors.grey.shade50;
                              Color borderColor = Colors.grey.shade200;
                              Color textColor = Colors.black87;
                              FontWeight fw = FontWeight.normal;

                              if (isCorrectIndex) {
                                bgColor = const Color(0xFFECFDF5);
                                borderColor = const Color(0xFFA7F3D0);
                                textColor = const Color(0xFF065F46);
                                fw = FontWeight.bold;
                              } else if (isUserSelectedIndex && !isCorrect) {
                                bgColor = const Color(0xFFFEF2F2);
                                borderColor = const Color(0xFFFECACA);
                                textColor = const Color(0xFF991B1B);
                                fw = FontWeight.w600;
                              }

                              return Container(
                                margin: const EdgeInsets.only(bottom: 8),
                                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                                decoration: BoxDecoration(
                                  color: bgColor,
                                  border: Border.all(color: borderColor),
                                  borderRadius: BorderRadius.circular(12),
                                ),
                                child: Row(
                                  children: [
                                    Text(
                                      '${String.fromCharCode(65 + idx)}.',
                                      style: TextStyle(fontWeight: FontWeight.bold, color: textColor),
                                    ),
                                    const SizedBox(width: 8),
                                    Expanded(
                                      child: Text(opt['text'] ?? '', style: TextStyle(color: textColor, fontWeight: fw)),
                                    ),
                                  ],
                                ),
                              );
                            }),
                            
                            if (q['explanation'] != null && q['explanation'].toString().isNotEmpty) ...[
                              const SizedBox(height: 12),
                              Container(
                                padding: const EdgeInsets.all(12),
                                decoration: BoxDecoration(
                                  color: const Color(0xFFEFF6FF),
                                  border: Border.all(color: const Color(0xFFBFDBFE)),
                                  borderRadius: BorderRadius.circular(12),
                                ),
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    const Row(
                                      children: [
                                        Text('💡', style: TextStyle(fontSize: 12)),
                                        SizedBox(width: 6),
                                        Text('Solution Explanation', style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Color(0xFF3730A3), letterSpacing: 0.5)),
                                      ],
                                    ),
                                    const SizedBox(height: 6),
                                    Text(q['explanation'], style: const TextStyle(fontSize: 12, color: Color(0xFF1E3A8A))),
                                  ],
                                ),
                              )
                            ]
                          ],
                        ),
                      ),
                    ],
                  ),
                );
              }),
            ],
            
            const SizedBox(height: 12),
            
            SizedBox(
              width: double.infinity,
              height: 52,
              child: ElevatedButton.icon(
                onPressed: () => Navigator.pop(context),
                icon: const Icon(Icons.arrow_back_rounded, size: 20),
                label: const Text('Back to Tests', style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold)),
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF2563EB),
                  foregroundColor: Colors.white,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                  elevation: 4,
                  shadowColor: const Color(0xFF2563EB).withOpacity(0.4),
                ),
              ),
            ),
            const SizedBox(height: 24),
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
  final Color bgColor;
  final IconData icon;

  const _StatCard({
    required this.label,
    required this.value,
    required this.color,
    required this.bgColor,
    required this.icon,
  });

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 20, horizontal: 8),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: bgColor, width: 2),
          boxShadow: [
            BoxShadow(
              color: color.withOpacity(0.04),
              blurRadius: 10,
              offset: const Offset(0, 4),
            )
          ]
        ),
        child: Column(
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: bgColor,
                shape: BoxShape.circle,
              ),
              child: Icon(icon, color: color, size: 20),
            ),
            const SizedBox(height: 12),
            Text(value, style: TextStyle(fontWeight: FontWeight.w900, fontSize: 24, color: color, height: 1)),
            const SizedBox(height: 4),
            Text(label.toUpperCase(), style: const TextStyle(fontSize: 10, color: Colors.black45, fontWeight: FontWeight.bold, letterSpacing: 0.5)),
          ],
        ),
      ),
    );
  }
}
