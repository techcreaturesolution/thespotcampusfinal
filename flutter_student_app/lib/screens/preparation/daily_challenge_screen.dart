import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../services/api_service.dart';
import '../../widgets/premium_paywall.dart';

class DailyChallengeScreen extends StatefulWidget {
  const DailyChallengeScreen({super.key});

  @override
  State<DailyChallengeScreen> createState() => _DailyChallengeScreenState();
}

class _DailyChallengeScreenState extends State<DailyChallengeScreen> {
  Map<String, dynamic>? _challenge;
  bool _alreadyCompleted = false;
  Map<String, dynamic>? _previousAttempt;
  bool _isLoading = true;
  bool _needsSubscription = false;
  int _currentIdx = 0;
  final Map<String, int> _answers = {};
  bool _submitted = false;
  Map<String, dynamic>? _result;

  @override
  void initState() {
    super.initState();
    _fetchChallenge();
  }

  Future<void> _fetchChallenge() async {
    setState(() {
      _isLoading = true;
      _needsSubscription = false;
    });
    try {
      final api = Provider.of<ApiService>(context, listen: false);
      final data = await api.get('/preparation/daily-challenge');
      setState(() {
        _challenge = data['challenge'];
        _alreadyCompleted = data['already_completed'] ?? false;
        _previousAttempt = data['attempt'];
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _isLoading = false;
        if (e is ApiException && (e.statusCode == 403 || e.message.contains('subscription'))) {
          _needsSubscription = true;
        }
      });
    }
  }

  Future<void> _submitChallenge() async {
    if (_submitted) return;
    final questions = List<Map<String, dynamic>>.from(_challenge!['questions']);
    final answerPayload = questions.map((q) {
      return {'question_id': q['_id'], 'selected_option': _answers[q['_id']] ?? -1};
    }).toList();

    try {
      final api = Provider.of<ApiService>(context, listen: false);
      final data = await api.post('/preparation/daily-challenge/submit', {
        'answers': answerPayload,
        'time_taken_seconds': 0,
      });
      setState(() { _result = data['attempt']; _submitted = true; });
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Streak: ${data['streak']} days!')));
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e')));
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_needsSubscription) {
      return PremiumPaywall(
        onBack: () => Navigator.pop(context),
        onPurchaseSuccess: () {
          _fetchChallenge();
        },
      );
    }

    return Scaffold(
      appBar: AppBar(title: const Text('Daily Challenge')),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _challenge == null ? _buildNoChallenge()
          : _alreadyCompleted ? _buildCompleted()
          : _submitted ? _buildResult()
          : _buildChallenge(),
    );
  }

  Widget _buildNoChallenge() {
    return const Center(child: Text('No challenge available today. Check back tomorrow!'));
  }

  Widget _buildCompleted() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.check_circle, color: Colors.green.shade400, size: 64),
          const SizedBox(height: 16),
          const Text("Today's Challenge Completed!", style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
          if (_previousAttempt != null) ...[
            const SizedBox(height: 16),
            Text('Score: ${_previousAttempt!['correct_answers']}/${_previousAttempt!['total_questions']}', style: const TextStyle(fontSize: 16)),
            Text('Accuracy: ${_previousAttempt!['accuracy']}%', style: TextStyle(color: Colors.grey.shade600)),
          ],
        ],
      ),
    );
  }

  Widget _buildResult() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.bolt, color: Colors.amber.shade600, size: 64),
          const SizedBox(height: 16),
          const Text('Challenge Complete!', style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
          const SizedBox(height: 16),
          Text('Score: ${_result?['correct_answers']}/${_result?['total_questions']}', style: const TextStyle(fontSize: 18)),
          Text('Accuracy: ${_result?['accuracy']}%', style: TextStyle(color: Colors.grey.shade600, fontSize: 16)),
        ],
      ),
    );
  }

  Widget _buildChallenge() {
    final questions = List<Map<String, dynamic>>.from(_challenge!['questions']);
    final q = questions[_currentIdx];
    final options = List<Map<String, dynamic>>.from(q['options'] ?? []);

    return Column(
      children: [
        LinearProgressIndicator(value: (_currentIdx + 1) / questions.length),
        Expanded(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Q${_currentIdx + 1}/${questions.length}', style: TextStyle(color: Colors.grey.shade600, fontSize: 12)),
                const SizedBox(height: 12),
                Text(q['question_text'] ?? '', style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w500)),
                const SizedBox(height: 20),
                ...List.generate(options.length, (idx) {
                  final selected = _answers[q['_id']] == idx;
                  return Container(
                    margin: const EdgeInsets.only(bottom: 8),
                    child: InkWell(
                      onTap: () => setState(() => _answers[q['_id']] = idx),
                      borderRadius: BorderRadius.circular(10),
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                        decoration: BoxDecoration(
                          borderRadius: BorderRadius.circular(10),
                          border: Border.all(color: selected ? Colors.indigo : Colors.grey.shade300),
                          color: selected ? Colors.indigo.shade50 : Colors.white,
                        ),
                        child: Row(
                          children: [
                            Text('${String.fromCharCode(65 + idx)}. ', style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13)),
                            Expanded(child: Text(options[idx]['text'] ?? '', style: const TextStyle(fontSize: 13))),
                          ],
                        ),
                      ),
                    ),
                  );
                }),
              ],
            ),
          ),
        ),
        Padding(
          padding: const EdgeInsets.all(16),
          child: Row(
            children: [
              if (_currentIdx > 0)
                Expanded(child: OutlinedButton(onPressed: () => setState(() => _currentIdx--), child: const Text('Previous'))),
              if (_currentIdx > 0) const SizedBox(width: 12),
              Expanded(
                child: _currentIdx == questions.length - 1
                    ? ElevatedButton(onPressed: _submitChallenge, child: const Text('Submit'))
                    : ElevatedButton(onPressed: () => setState(() => _currentIdx++), child: const Text('Next')),
              ),
            ],
          ),
        ),
      ],
    );
  }
}
