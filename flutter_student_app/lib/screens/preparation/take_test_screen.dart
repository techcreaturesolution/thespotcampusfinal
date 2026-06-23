import 'dart:async';
import 'package:flutter/material.dart';

/// Arguments expected via Navigator:
///   { 'questions': List<Map>, 'mockTestTitle': String, 'durationMinutes': int }
class TakeTestScreen extends StatefulWidget {
  const TakeTestScreen({super.key});

  @override
  State<TakeTestScreen> createState() => _TakeTestScreenState();
}

class _TakeTestScreenState extends State<TakeTestScreen> {
  late List<Map<String, dynamic>> _questions;
  late String _title;
  late int _durationMinutes;

  final Map<int, int> _answers = {}; // questionIndex -> selectedOptionIndex
  int _currentIndex = 0;
  late Timer _timer;
  late int _secondsLeft;
  bool _submitted = false;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    final args =
        ModalRoute.of(context)!.settings.arguments as Map<String, dynamic>;
    _questions =
        List<Map<String, dynamic>>.from(args['questions'] as List? ?? []);
    _title = args['mockTestTitle'] as String? ?? 'Mock Test';
    _durationMinutes = args['durationMinutes'] as int? ?? 30;
    _secondsLeft = _durationMinutes * 60;
    _startTimer();
  }

  void _startTimer() {
    _timer = Timer.periodic(const Duration(seconds: 1), (_) {
      if (!mounted) return;
      if (_secondsLeft <= 0) {
        _timer.cancel();
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

  void _submitTest() {
    if (!mounted) return;
    _timer.cancel();
    setState(() => _submitted = true);
  }

  int get _correctCount {
    int count = 0;
    for (int i = 0; i < _questions.length; i++) {
      final correct = _questions[i]['correct_option_index'];
      if (_answers[i] == correct) count++;
    }
    return count;
  }

  @override
  void dispose() {
    _timer.cancel();
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
            content: const Text('Your progress will be lost.'),
            actions: [
              TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Stay')),
              TextButton(onPressed: () => Navigator.pop(ctx, true), child: const Text('Leave')),
            ],
          ),
        );
        if (leave == true && mounted) Navigator.pop(context);
      },
      child: _submitted ? _buildResult() : _buildTestUI(),
    );
  }

  // ─── TEST UI ────────────────────────────────────────────────────────────────

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
      body: Column(
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
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: Colors.grey.shade200),
                    ),
                    child: Text(
                      q['question_text'] ?? '',
                      style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w500, height: 1.5),
                    ),
                  ),
                  const SizedBox(height: 16),
                  // Options
                  ...List.generate(options.length, (idx) {
                    final isSelected = selectedAns == idx;
                    return GestureDetector(
                      onTap: () => setState(() => _answers[_currentIndex] = idx),
                      child: AnimatedContainer(
                        duration: const Duration(milliseconds: 150),
                        margin: const EdgeInsets.only(bottom: 10),
                        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                        decoration: BoxDecoration(
                          color: isSelected ? const Color(0xFFEFF6FF) : Colors.white,
                          border: Border.all(
                            color: isSelected ? const Color(0xFF2563EB) : Colors.grey.shade300,
                            width: isSelected ? 2 : 1,
                          ),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Row(
                          children: [
                            AnimatedContainer(
                              duration: const Duration(milliseconds: 150),
                              width: 28,
                              height: 28,
                              decoration: BoxDecoration(
                                color: isSelected ? const Color(0xFF2563EB) : Colors.grey.shade100,
                                shape: BoxShape.circle,
                              ),
                              child: Center(
                                child: Text(
                                  String.fromCharCode(65 + idx),
                                  style: TextStyle(
                                    fontWeight: FontWeight.bold,
                                    fontSize: 13,
                                    color: isSelected ? Colors.white : Colors.grey.shade700,
                                  ),
                                ),
                              ),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Text(
                                options[idx]['text'] ?? '',
                                style: TextStyle(
                                  fontSize: 14,
                                  color: isSelected ? const Color(0xFF1D4ED8) : Colors.black87,
                                  fontWeight: isSelected ? FontWeight.w600 : FontWeight.normal,
                                ),
                              ),
                            ),
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
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 20),
            decoration: BoxDecoration(
              color: Colors.white,
              border: Border(top: BorderSide(color: Colors.grey.shade200)),
            ),
            child: Row(
              children: [
                if (_currentIndex > 0)
                  Expanded(
                    child: OutlinedButton.icon(
                      onPressed: () => setState(() => _currentIndex--),
                      icon: const Icon(Icons.arrow_back, size: 16),
                      label: const Text('Prev'),
                      style: OutlinedButton.styleFrom(
                        padding: const EdgeInsets.symmetric(vertical: 12),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      ),
                    ),
                  ),
                if (_currentIndex > 0) const SizedBox(width: 12),
                Expanded(
                  flex: 2,
                  child: _currentIndex < _questions.length - 1
                      ? ElevatedButton.icon(
                          onPressed: () => setState(() => _currentIndex++),
                          icon: const Icon(Icons.arrow_forward, size: 16),
                          label: const Text('Next'),
                          style: ElevatedButton.styleFrom(
                            padding: const EdgeInsets.symmetric(vertical: 12),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                          ),
                        )
                      : ElevatedButton.icon(
                          onPressed: _submitTest,
                          icon: const Icon(Icons.check_circle_outline, size: 16),
                          label: const Text('Submit'),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: const Color(0xFF059669),
                            padding: const EdgeInsets.symmetric(vertical: 12),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
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

  // ─── RESULT UI ───────────────────────────────────────────────────────────────

  Widget _buildResult() {
    final total = _questions.length;
    final correct = _correctCount;
    final wrong = _answers.length - correct;
    final unattempted = total - _answers.length;
    final percent = total > 0 ? (correct / total * 100).toStringAsFixed(1) : '0';
    final passed = correct >= (total * 0.4);

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
                    '$_title',
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
                    '$correct / $total correct',
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
            // Review answers section
            Align(
              alignment: Alignment.centerLeft,
              child: Text(
                'Answer Review',
                style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Color(0xFF1F2937)),
              ),
            ),
            const SizedBox(height: 10),
            ..._questions.asMap().entries.map((entry) {
              final i = entry.key;
              final q = entry.value;
              final selected = _answers[i];
              final correct2 = q['correct_option_index'] as int?;
              final isCorrect = selected != null && selected == correct2;
              final isWrong = selected != null && selected != correct2;
              final options = List<Map<String, dynamic>>.from(q['options'] ?? []);

              Color borderColor = Colors.grey.shade200;
              Color iconColor = Colors.grey;
              IconData icon = Icons.help_outline;
              if (isCorrect) { borderColor = Colors.green; iconColor = Colors.green; icon = Icons.check_circle; }
              if (isWrong) { borderColor = Colors.red; iconColor = Colors.red; icon = Icons.cancel; }

              return Container(
                margin: const EdgeInsets.only(bottom: 12),
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: borderColor),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Icon(icon, color: iconColor, size: 18),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Text(
                            'Q${i + 1}. ${q['question_text'] ?? ''}',
                            style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w500),
                          ),
                        ),
                      ],
                    ),
                    if (selected != null && correct2 != null && options.isNotEmpty) ...[
                      const SizedBox(height: 8),
                      if (isWrong)
                        Text(
                          'Your answer: ${options[selected]['text']}',
                          style: const TextStyle(fontSize: 12, color: Colors.red),
                        ),
                      Text(
                        'Correct: ${options[correct2]['text']}',
                        style: const TextStyle(fontSize: 12, color: Colors.green, fontWeight: FontWeight.w600),
                      ),
                    ],
                    if (selected == null)
                      const Text('Not attempted', style: TextStyle(fontSize: 12, color: Colors.orange)),
                    if (q['explanation'] != null && (q['explanation'] as String).isNotEmpty) ...[
                      const SizedBox(height: 6),
                      Text(
                        'Explanation: ${q['explanation']}',
                        style: TextStyle(fontSize: 11, color: Colors.blue.shade700),
                      ),
                    ],
                  ],
                ),
              );
            }),
            const SizedBox(height: 16),
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
            Text(value, style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold, color: color)),
            const SizedBox(height: 2),
            Text(label, style: TextStyle(fontSize: 11, color: color.withOpacity(0.8))),
          ],
        ),
      ),
    );
  }
}
