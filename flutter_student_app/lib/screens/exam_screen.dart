import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import '../services/api_service.dart';

class ExamScreen extends StatefulWidget {
  final String examId;
  const ExamScreen({super.key, required this.examId});

  @override
  State<ExamScreen> createState() => _ExamScreenState();
}

class _ExamScreenState extends State<ExamScreen> with WidgetsBindingObserver {
  Map<String, dynamic>? _exam;
  String? _paperId;
  bool _loading = true;
  bool _examStarted = false;
  int _currentIndex = 0;
  Map<String, dynamic> _selectedAnswers = {};
  int _timeLeft = 0;
  Timer? _timer;
  int _violations = 0;
  int _trustScore = 100;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    _fetchExam();
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    _timer?.cancel();
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (_examStarted && (state == AppLifecycleState.paused || state == AppLifecycleState.inactive)) {
      _recordViolation('tab_switch', 'App went to background');
    }
  }

  Future<void> _fetchExam() async {
    try {
      final api = Provider.of<ApiService>(context, listen: false);
      final data = await api.get('/exam/${widget.examId}');
      setState(() { _exam = data['exam']; _timeLeft = (data['exam']['timeLimit'] ?? 30) * 60; _loading = false; });
    } catch (e) {
      setState(() => _loading = false);
    }
  }

  Future<void> _startExam() async {
    try {
      final api = Provider.of<ApiService>(context, listen: false);
      final data = await api.post('/paper/session/${widget.examId}', {
        'browserInfo': 'Flutter App',
      });
      setState(() { _paperId = data['paper']['_id']; _examStarted = true; });
      _startTimer();
      // Lock orientation
      SystemChrome.setPreferredOrientations([DeviceOrientation.portraitUp]);
      // Hide system UI
      SystemChrome.setEnabledSystemUIMode(SystemUiMode.immersiveSticky);
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Failed to start: $e'), backgroundColor: Colors.red),
      );
    }
  }

  void _startTimer() {
    _timer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (_timeLeft <= 0) {
        _autoSubmit('Time limit exceeded');
        return;
      }
      setState(() => _timeLeft--);
    });
  }

  Future<void> _recordViolation(String type, String details) async {
    setState(() { _violations++; _trustScore = (_trustScore - 10).clamp(0, 100); });

    final maxViolations = _exam?['proctoring']?['maxViolations'] ?? 5;
    if (_violations >= maxViolations) {
      _autoSubmit('Maximum violations exceeded');
      return;
    }

    if (_paperId != null) {
      try {
        final api = Provider.of<ApiService>(context, listen: false);
        await api.post('/paper/$_paperId/violation', {'type': type, 'details': details});
      } catch (e) {
        // Silent fail
      }
    }

    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Warning: $details'),
          backgroundColor: Colors.red,
          duration: const Duration(seconds: 2),
        ),
      );
    }
  }

  Future<void> _autoSubmit(String reason) async {
    _timer?.cancel();
    SystemChrome.setPreferredOrientations(DeviceOrientation.values);
    SystemChrome.setEnabledSystemUIMode(SystemUiMode.edgeToEdge);

    final answers = _selectedAnswers.entries.map((e) => {
      'question_id': e.key,
      'selectedOption': e.value is List ? e.value : [e.value],
    }).toList();

    try {
      final api = Provider.of<ApiService>(context, listen: false);
      if (_paperId != null) {
        await api.post('/paper/$_paperId/auto-submit', {'reason': reason, 'answers': answers});
      }
    } catch (e) {
      // Silent
    }

    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Exam auto-submitted: $reason'), backgroundColor: Colors.orange),
      );
      Navigator.pop(context);
    }
  }

  Future<void> _submitExam() async {
    _timer?.cancel();
    SystemChrome.setPreferredOrientations(DeviceOrientation.values);
    SystemChrome.setEnabledSystemUIMode(SystemUiMode.edgeToEdge);

    final answers = _selectedAnswers.entries.map((e) => {
      'question_id': e.key,
      'selectedOption': e.value is List ? e.value : [e.value],
    }).toList();

    try {
      final api = Provider.of<ApiService>(context, listen: false);
      await api.post('/paper/${widget.examId}', {'answers': answers});
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Exam submitted!'), backgroundColor: Colors.green),
        );
        Navigator.pop(context);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed: $e'), backgroundColor: Colors.red),
        );
      }
    }
  }

  String _formatTime(int seconds) {
    final m = (seconds ~/ 60).toString().padLeft(2, '0');
    final s = (seconds % 60).toString().padLeft(2, '0');
    return '$m:$s';
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) return const Scaffold(body: Center(child: CircularProgressIndicator()));
    if (_exam == null) return const Scaffold(body: Center(child: Text('Exam not found')));

    if (!_examStarted) {
      return Scaffold(
        body: SafeArea(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Icon(Icons.security, size: 64, color: Color(0xFF2563EB)),
                const SizedBox(height: 24),
                Text(_exam!['title'] ?? 'Exam', style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold), textAlign: TextAlign.center),
                const SizedBox(height: 16),
                Card(
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      children: [
                        _ExamInfoRow(icon: Icons.timer, label: 'Time', value: '${_exam!['timeLimit']} min'),
                        _ExamInfoRow(icon: Icons.quiz, label: 'Questions', value: '${_exam!['noOfQuestion']}'),
                        if (_exam!['proctoring']?['tabLockEnabled'] == true)
                          const _ExamInfoRow(icon: Icons.tab, label: 'Tab Lock', value: 'Enabled'),
                        if (_exam!['proctoring']?['cameraEnabled'] == true)
                          const _ExamInfoRow(icon: Icons.videocam, label: 'Camera', value: 'Enabled'),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 24),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton.icon(
                    icon: const Icon(Icons.play_arrow),
                    label: const Text('Start Exam'),
                    onPressed: _startExam,
                    style: ElevatedButton.styleFrom(padding: const EdgeInsets.symmetric(vertical: 16)),
                  ),
                ),
              ],
            ),
          ),
        ),
      );
    }

    final questions = _exam!['questions'] as List<dynamic>? ?? [];
    if (questions.isEmpty) return const Scaffold(body: Center(child: Text('No questions')));
    final q = questions[_currentIndex];

    return WillPopScope(
      onWillPop: () async {
        _recordViolation('browser_resize', 'Back button pressed during exam');
        return false;
      },
      child: Scaffold(
        appBar: AppBar(
          automaticallyImplyLeading: false,
          title: Text('Q${_currentIndex + 1}/${questions.length}'),
          actions: [
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
              margin: const EdgeInsets.symmetric(vertical: 8),
              decoration: BoxDecoration(
                color: _timeLeft < 60 ? Colors.red.shade100 : Colors.grey.shade100,
                borderRadius: BorderRadius.circular(8),
              ),
              child: Row(
                children: [
                  Icon(Icons.timer, size: 16, color: _timeLeft < 60 ? Colors.red : Colors.grey.shade700),
                  const SizedBox(width: 4),
                  Text(_formatTime(_timeLeft),
                    style: TextStyle(fontWeight: FontWeight.bold, color: _timeLeft < 60 ? Colors.red : Colors.grey.shade700)),
                ],
              ),
            ),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
              margin: const EdgeInsets.only(right: 8, top: 8, bottom: 8),
              decoration: BoxDecoration(
                color: _trustScore >= 70 ? Colors.green.shade100 : Colors.red.shade100,
                borderRadius: BorderRadius.circular(8),
              ),
              child: Text('$_trustScore%',
                style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold,
                  color: _trustScore >= 70 ? Colors.green.shade800 : Colors.red.shade800)),
            ),
          ],
        ),
        body: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Progress
              LinearProgressIndicator(
                value: (_currentIndex + 1) / questions.length,
                backgroundColor: Colors.grey.shade200,
              ),
              const SizedBox(height: 20),
              Text(q['questionText'] ?? '', style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w600)),
              const SizedBox(height: 20),
              Expanded(
                child: ListView.builder(
                  itemCount: (q['options'] as List?)?.length ?? 0,
                  itemBuilder: (context, optIdx) {
                    final opt = q['options'][optIdx];
                    final isSelected = _selectedAnswers[q['_id']] == opt['_id'];
                    return GestureDetector(
                      onTap: () => setState(() => _selectedAnswers[q['_id']] = opt['_id']),
                      child: Container(
                        margin: const EdgeInsets.only(bottom: 8),
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          border: Border.all(color: isSelected ? const Color(0xFF2563EB) : Colors.grey.shade300, width: isSelected ? 2 : 1),
                          borderRadius: BorderRadius.circular(12),
                          color: isSelected ? const Color(0xFF2563EB).withOpacity(0.05) : null,
                        ),
                        child: Row(
                          children: [
                            Container(
                              width: 24, height: 24,
                              decoration: BoxDecoration(
                                shape: BoxShape.circle,
                                border: Border.all(color: isSelected ? const Color(0xFF2563EB) : Colors.grey.shade400, width: 2),
                                color: isSelected ? const Color(0xFF2563EB) : null,
                              ),
                              child: isSelected ? const Icon(Icons.check, size: 14, color: Colors.white) : null,
                            ),
                            const SizedBox(width: 12),
                            Expanded(child: Text(opt['optionText'] ?? '', style: TextStyle(
                              fontWeight: isSelected ? FontWeight.w600 : FontWeight.normal,
                              color: isSelected ? const Color(0xFF2563EB) : null,
                            ))),
                          ],
                        ),
                      ),
                    );
                  },
                ),
              ),
              Row(
                children: [
                  if (_currentIndex > 0)
                    Expanded(
                      child: OutlinedButton.icon(
                        icon: const Icon(Icons.arrow_back),
                        label: const Text('Previous'),
                        onPressed: () => setState(() => _currentIndex--),
                      ),
                    ),
                  if (_currentIndex > 0) const SizedBox(width: 12),
                  Expanded(
                    child: _currentIndex == questions.length - 1
                        ? ElevatedButton.icon(
                            icon: const Icon(Icons.send),
                            label: const Text('Submit'),
                            onPressed: () {
                              showDialog(context: context, builder: (ctx) => AlertDialog(
                                title: const Text('Submit Exam?'),
                                content: Text('Answered: ${_selectedAnswers.length}/${questions.length}'),
                                actions: [
                                  TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
                                  ElevatedButton(onPressed: () { Navigator.pop(ctx); _submitExam(); }, child: const Text('Submit')),
                                ],
                              ));
                            },
                          )
                        : ElevatedButton.icon(
                            icon: const Icon(Icons.arrow_forward),
                            label: const Text('Next'),
                            onPressed: () => setState(() => _currentIndex++),
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
}

class _ExamInfoRow extends StatelessWidget {
  final IconData icon;
  final String label;
  final String value;
  const _ExamInfoRow({required this.icon, required this.label, required this.value});
  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Row(
        children: [
          Icon(icon, size: 20, color: Colors.grey.shade600),
          const SizedBox(width: 12),
          Text(label, style: TextStyle(color: Colors.grey.shade600)),
          const Spacer(),
          Text(value, style: const TextStyle(fontWeight: FontWeight.w600)),
        ],
      ),
    );
  }
}
