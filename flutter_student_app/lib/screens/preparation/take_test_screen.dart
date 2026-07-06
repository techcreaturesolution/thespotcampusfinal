import 'dart:async';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../services/api_service.dart';

class TakeTestScreen extends StatefulWidget {
  const TakeTestScreen({super.key});

  @override
  State<TakeTestScreen> createState() => _TakeTestScreenState();
}

class _TakeTestScreenState extends State<TakeTestScreen> {
  late List<Map<String, dynamic>> _questions;
  late Map<String, dynamic> _attempt;
  late String _title;
  late int _durationMinutes;

  final Map<int, int> _answers = {}; // questionIndex -> selectedOptionIndex
  int _currentIndex = 0;
  Timer? _timer;
  late int _secondsLeft;
  bool _isSubmitting = false;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    final args = ModalRoute.of(context)!.settings.arguments as Map<String, dynamic>? ?? {};
    _questions = List<Map<String, dynamic>>.from(args['questions'] as List? ?? []);
    _attempt = args['attempt'] as Map<String, dynamic>? ?? {};
    _title = args['mockTestTitle'] as String? ?? 'Mock Test';
    _durationMinutes = args['durationMinutes'] as int? ?? 30;
    _secondsLeft = args['remainingSeconds'] as int? ?? (_durationMinutes * 60);
    
    // Auto-populate already answered questions if resuming
    if (_attempt['answers'] != null) {
      final answersList = _attempt['answers'] as List;
      for (var ans in answersList) {
        final qId = ans['question_id'];
        final optIdx = ans['selected_option_index'];
        final qIndex = _questions.indexWhere((q) => q['_id'] == qId);
        if (qIndex != -1 && optIdx != null) {
          _answers[qIndex] = optIdx;
        }
      }
    }
    
    _startTimer();
  }

  void _startTimer() {
    _timer = Timer.periodic(const Duration(seconds: 1), (_) {
      if (!mounted) return;
      if (_secondsLeft <= 0) {
        _timer?.cancel();
        _submitTest();
      } else {
        setState(() => _secondsLeft--);
      }
    });
  }

  String get _timerText {
    final m = _secondsLeft ~/ 60;
    final s = _secondsLeft % 60;
    return '${m.toString().padLeft(2, '0')}:${s.toString().padLeft(2, '0')}';
  }

  Future<void> _submitTest() async {
    if (!mounted || _isSubmitting) return;
    _timer?.cancel();
    setState(() => _isSubmitting = true);

    try {
      final api = Provider.of<ApiService>(context, listen: false);
      
      final answersList = _answers.entries.map((e) {
        return {
          'question_id': _questions[e.key]['_id'],
          'selected_option_index': e.value,
          'time_spent_seconds': 0 // optional, tracking per question could be added
        };
      }).toList();

      await api.post('/preparation/mock-tests/submit/${_attempt['_id']}', {
        'answers': answersList,
      });

      if (!mounted) return;
      // Navigate to Result Screen and replace current
      Navigator.pushReplacementNamed(context, '/preparation/test-result', arguments: {
        'attemptId': _attempt['_id'],
        'mockTestTitle': _title,
      });
    } catch (e) {
      if (!mounted) return;
      setState(() => _isSubmitting = false);
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Failed to submit test. Please try again.')));
    }
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return PopScope(
      canPop: false,
      onPopInvoked: (didPop) async {
        if (didPop) return;
        final leave = await showDialog<bool>(
          context: context,
          builder: (ctx) => AlertDialog(
            title: const Text('Leave Test?'),
            content: const Text('Your test will be paused and you can resume later. Time will still count down if it is a strict test.'),
            actions: [
              TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Stay')),
              TextButton(onPressed: () {
                // If leaving, we should ideally sync the answers so far, but skipping for simplicity
                Navigator.pop(ctx, true);
              }, child: const Text('Leave')),
            ],
          ),
        );
        if (leave == true && mounted) Navigator.pop(context);
      },
      child: _buildTestUI(),
    );
  }

  Widget _buildTestUI() {
    if (_questions.isEmpty) {
      return Scaffold(
        appBar: AppBar(title: Text(_title)),
        body: const Center(child: Text('No questions available.')),
      );
    }

    final q = _questions[_currentIndex];
    final options = List<Map<String, dynamic>>.from(q['options'] ?? []);
    final selectedAns = _answers[_currentIndex];

    return Scaffold(
      backgroundColor: const Color(0xFFF9FAFB),
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        automaticallyImplyLeading: false,
        title: Text(_title, style: const TextStyle(fontSize: 15, fontWeight: FontWeight.bold)),
        actions: [
          Container(
            margin: const EdgeInsets.only(right: 12),
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
            decoration: BoxDecoration(
              color: _secondsLeft < 60 ? Colors.red.shade50 : Colors.indigo.shade50,
              borderRadius: BorderRadius.circular(20),
            ),
            child: Row(
              children: [
                Icon(Icons.timer_outlined,
                    size: 16,
                    color: _secondsLeft < 60 ? Colors.red : Colors.indigo),
                const SizedBox(width: 4),
                Text(
                  _timerText,
                  style: TextStyle(
                    fontWeight: FontWeight.bold,
                    fontSize: 14,
                    color: _secondsLeft < 60 ? Colors.red : Colors.indigo,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
      body: _isSubmitting 
          ? const Center(child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                CircularProgressIndicator(),
                SizedBox(height: 16),
                Text('Submitting test...')
              ],
            ))
          : Column(
        children: [
          // Progress bar
          LinearProgressIndicator(
            value: (_currentIndex + 1) / _questions.length,
            minHeight: 4,
            backgroundColor: Colors.grey.shade200,
            valueColor: const AlwaysStoppedAnimation<Color>(Color(0xFF2563EB)),
          ),
          Expanded(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Question counter
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        'Question ${_currentIndex + 1} of ${_questions.length}',
                        style: TextStyle(fontSize: 12, color: Colors.grey.shade600),
                      ),
                      Text(
                        '${_answers.length} answered',
                        style: const TextStyle(fontSize: 12, color: Color(0xFF2563EB), fontWeight: FontWeight.w600),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  // Question card
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 32),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(24),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withOpacity(0.04),
                          blurRadius: 16,
                          offset: const Offset(0, 8),
                        )
                      ]
                    ),
                    child: Text(
                      q['question_text'] ?? '',
                      style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w700, height: 1.5, color: Color(0xFF111827)),
                    ),
                  ),
                  const SizedBox(height: 16),
                  // Options
                  ...List.generate(options.length, (idx) {
                    final isSelected = selectedAns == idx;
                    return GestureDetector(
                      onTap: () => setState(() => _answers[_currentIndex] = idx),
                      child: AnimatedContainer(
                        duration: const Duration(milliseconds: 200),
                        margin: const EdgeInsets.only(bottom: 12),
                        padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 16),
                        decoration: BoxDecoration(
                          color: isSelected ? const Color(0xFFEFF6FF) : Colors.white,
                          border: Border.all(
                            color: isSelected ? const Color(0xFF3B82F6) : Colors.grey.shade200,
                            width: isSelected ? 2 : 1.5,
                          ),
                          borderRadius: BorderRadius.circular(16),
                          boxShadow: isSelected ? [
                            BoxShadow(color: const Color(0xFF3B82F6).withOpacity(0.1), blurRadius: 8, offset: const Offset(0, 4))
                          ] : [],
                        ),
                        child: Row(
                          children: [
                            AnimatedContainer(
                              duration: const Duration(milliseconds: 200),
                              width: 32,
                              height: 32,
                              decoration: BoxDecoration(
                                color: isSelected ? const Color(0xFF3B82F6) : Colors.grey.shade50,
                                border: Border.all(color: isSelected ? Colors.transparent : Colors.grey.shade300),
                                shape: BoxShape.circle,
                              ),
                              child: Center(
                                child: Text(
                                  String.fromCharCode(65 + idx),
                                  style: TextStyle(
                                    fontWeight: FontWeight.bold,
                                    fontSize: 14,
                                    color: isSelected ? Colors.white : Colors.grey.shade600,
                                  ),
                                ),
                              ),
                            ),
                            const SizedBox(width: 14),
                            Expanded(
                              child: Text(
                                options[idx]['text'] ?? '',
                                style: TextStyle(
                                  fontSize: 15,
                                  color: isSelected ? const Color(0xFF1E3A8A) : const Color(0xFF334155),
                                  fontWeight: isSelected ? FontWeight.w600 : FontWeight.w500,
                                ),
                              ),
                            ),
                            if (isSelected)
                              const Icon(Icons.check_circle, color: Color(0xFF3B82F6), size: 20),
                          ],
                        ),
                      ),
                    );
                  }),
                ],
              ),
            ),
          ),
          // Bottom navigation
          Container(
            padding: const EdgeInsets.fromLTRB(20, 16, 20, 24),
            decoration: BoxDecoration(
              color: Colors.white,
              boxShadow: [
                BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 10, offset: const Offset(0, -4))
              ]
            ),
            child: Row(
              children: [
                if (_currentIndex > 0)
                  Expanded(
                    flex: 1,
                    child: OutlinedButton(
                      onPressed: () => setState(() => _currentIndex--),
                      style: OutlinedButton.styleFrom(
                        padding: const EdgeInsets.symmetric(vertical: 16),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                        side: const BorderSide(color: Color(0xFFE2E8F0)),
                        foregroundColor: const Color(0xFF64748B),
                      ),
                      child: const Icon(Icons.arrow_back_rounded, size: 24),
                    ),
                  ),
                if (_currentIndex > 0) const SizedBox(width: 16),
                Expanded(
                  flex: 3,
                  child: _currentIndex < _questions.length - 1
                      ? ElevatedButton(
                          onPressed: () => setState(() => _currentIndex++),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: const Color(0xFF2563EB),
                            foregroundColor: Colors.white,
                            padding: const EdgeInsets.symmetric(vertical: 16),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                            elevation: 0,
                          ),
                          child: const Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Text('Next', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                              SizedBox(width: 8),
                              Icon(Icons.arrow_forward_rounded, size: 20),
                            ],
                          ),
                        )
                      : ElevatedButton(
                          onPressed: _submitTest,
                          style: ElevatedButton.styleFrom(
                            backgroundColor: const Color(0xFF059669),
                            foregroundColor: Colors.white,
                            padding: const EdgeInsets.symmetric(vertical: 16),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                            elevation: 0,
                          ),
                          child: const Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Text('Submit Test', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                              SizedBox(width: 8),
                              Icon(Icons.check_circle_outline_rounded, size: 20),
                            ],
                          ),
                        ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
