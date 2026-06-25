import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../services/api_service.dart';

class PracticeScreen extends StatefulWidget {
  const PracticeScreen({super.key});

  @override
  State<PracticeScreen> createState() => _PracticeScreenState();
}

class _PracticeScreenState extends State<PracticeScreen> {
  late Map<String, dynamic> _subject;
  List<dynamic> _questions = [];
  bool _isLoading = true;

  int _currentIndex = 0;
  int _userAnswer = -1;
  bool _showAnswer = false;

  Set<String> _bookmarkedIds = {};

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    final args = ModalRoute.of(context)!.settings.arguments as Map<String, dynamic>? ?? {};
    _subject = args['subject'] as Map<String, dynamic>? ?? {};
    
    _fetchBookmarks();
    _fetchQuestions();
  }

  Future<void> _fetchBookmarks() async {
    try {
      final api = Provider.of<ApiService>(context, listen: false);
      final data = await api.get('/preparation/bookmarks?item_type=question');
      if (data['bookmarks'] != null) {
        if (mounted) {
          setState(() {
            _bookmarkedIds = Set<String>.from(data['bookmarks'].map((bm) => bm['item_id']));
          });
        }
      }
    } catch (_) {}
  }

  Future<void> _handleBookmark(String qId) async {
    try {
      final api = Provider.of<ApiService>(context, listen: false);
      final data = await api.post('/preparation/bookmarks/toggle', {
        'item_type': 'question',
        'item_id': qId,
      });
      if (mounted) {
        setState(() {
          if (data['bookmarked'] == true) {
            _bookmarkedIds.add(qId);
          } else {
            _bookmarkedIds.remove(qId);
          }
        });
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(data['msg'] ?? 'Bookmark toggled')));
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Failed to toggle bookmark')));
      }
    }
  }

  Future<void> _fetchQuestions() async {
    if (!mounted) return;
    setState(() => _isLoading = true);
    try {
      final api = Provider.of<ApiService>(context, listen: false);
      final data = await api.get('/preparation/questions/practice/${_subject['_id']}');
      if (mounted) {
        setState(() {
          _questions = data['questions'] ?? [];
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  void _nextQuestion() {
    if (_currentIndex < _questions.length - 1) {
      setState(() {
        _currentIndex++;
        _userAnswer = -1;
        _showAnswer = false;
      });
    }
  }

  void _prevQuestion() {
    if (_currentIndex > 0) {
      setState(() {
        _currentIndex--;
        _userAnswer = -1;
        _showAnswer = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return Scaffold(
        appBar: AppBar(title: Text(_subject['name'] ?? 'Practice')),
        body: const Center(child: CircularProgressIndicator()),
      );
    }

    if (_questions.isEmpty) {
      return Scaffold(
        appBar: AppBar(title: Text(_subject['name'] ?? 'Practice')),
        body: const Center(child: Text('No practice questions available for this subject.')),
      );
    }

    final q = _questions[_currentIndex];
    final options = List<Map<String, dynamic>>.from(q['options'] ?? []);
    final isBookmarked = _bookmarkedIds.contains(q['_id']);

    return Scaffold(
      backgroundColor: const Color(0xFFF9FAFB),
      appBar: AppBar(
        title: Text(_subject['name'] ?? 'Practice', style: const TextStyle(fontSize: 16)),
        backgroundColor: Colors.white,
        elevation: 0,
        actions: [
          IconButton(
            icon: Icon(isBookmarked ? Icons.bookmark : Icons.bookmark_border, color: isBookmarked ? Colors.blue : Colors.grey),
            onPressed: () => _handleBookmark(q['_id']),
          ),
        ],
      ),
      body: Column(
        children: [
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
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text('Question ${_currentIndex + 1} of ${_questions.length}', style: TextStyle(fontSize: 12, color: Colors.grey.shade600)),
                      if (q['difficulty'] != null)
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                          decoration: BoxDecoration(
                            color: q['difficulty'] == 'easy' ? Colors.green.shade50 : q['difficulty'] == 'hard' ? Colors.red.shade50 : Colors.amber.shade50,
                            borderRadius: BorderRadius.circular(4),
                          ),
                          child: Text(q['difficulty'], style: TextStyle(fontSize: 10, color: q['difficulty'] == 'easy' ? Colors.green.shade700 : q['difficulty'] == 'hard' ? Colors.red.shade700 : Colors.amber.shade700)),
                        ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: Colors.grey.shade200),
                    ),
                    child: Text(q['question_text'] ?? '', style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w500, height: 1.5)),
                  ),
                  const SizedBox(height: 16),
                  ...List.generate(options.length, (idx) {
                    final isCorrect = idx == q['correct_option_index'];
                    final isSelected = idx == _userAnswer;
                    Color borderColor = Colors.grey.shade300;
                    Color bgColor = Colors.white;
                    if (_showAnswer) {
                      if (isCorrect) { borderColor = Colors.green; bgColor = Colors.green.shade50; }
                      else if (isSelected) { borderColor = Colors.red; bgColor = Colors.red.shade50; }
                    } else if (isSelected) { borderColor = Colors.indigo; bgColor = Colors.indigo.shade50; }

                    return GestureDetector(
                      onTap: _showAnswer ? null : () async {
                        setState(() { _userAnswer = idx; _showAnswer = true; });
                        try {
                          final api = Provider.of<ApiService>(context, listen: false);
                          await api.post('/preparation/progress/practice/update', {
                            'subject_id': _subject['_id'],
                            'is_correct': isCorrect,
                          });
                        } catch (e) {
                          if (mounted) {
                            ScaffoldMessenger.of(context).showSnackBar(
                              SnackBar(content: Text('Could not update progress: ${e.toString()}')),
                            );
                          }
                        }
                      },
                      child: Container(
                        margin: const EdgeInsets.only(bottom: 10),
                        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                        decoration: BoxDecoration(
                          color: bgColor,
                          border: Border.all(color: borderColor, width: isSelected || (_showAnswer && isCorrect) ? 2 : 1),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Row(
                          children: [
                            Text('${String.fromCharCode(65 + idx)}. ', style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13)),
                            Expanded(child: Text(options[idx]['text'] ?? '', style: const TextStyle(fontSize: 14))),
                            if (_showAnswer && isCorrect) const Icon(Icons.check_circle, color: Colors.green, size: 20),
                            if (_showAnswer && isSelected && !isCorrect) const Icon(Icons.cancel, color: Colors.red, size: 20),
                          ],
                        ),
                      ),
                    );
                  }),
                  if (_showAnswer && q['explanation'] != null && q['explanation'].toString().isNotEmpty) ...[
                    const SizedBox(height: 12),
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(color: Colors.blue.shade50, borderRadius: BorderRadius.circular(8)),
                      child: Text('Explanation: ${q['explanation']}', style: TextStyle(fontSize: 12, color: Colors.blue.shade800)),
                    ),
                  ],
                ],
              ),
            ),
          ),
          Container(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 20),
            decoration: BoxDecoration(color: Colors.white, border: Border(top: BorderSide(color: Colors.grey.shade200))),
            child: Row(
              children: [
                if (_currentIndex > 0)
                  Expanded(
                    child: OutlinedButton.icon(
                      onPressed: _prevQuestion,
                      icon: const Icon(Icons.arrow_back, size: 16),
                      label: const Text('Prev'),
                      style: OutlinedButton.styleFrom(padding: const EdgeInsets.symmetric(vertical: 12), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12))),
                    ),
                  ),
                if (_currentIndex > 0) const SizedBox(width: 12),
                Expanded(
                  flex: 2,
                  child: ElevatedButton.icon(
                    onPressed: _currentIndex < _questions.length - 1 ? _nextQuestion : () => Navigator.pop(context),
                    icon: Icon(_currentIndex < _questions.length - 1 ? Icons.arrow_forward : Icons.check, size: 16),
                    label: Text(_currentIndex < _questions.length - 1 ? 'Next' : 'Finish'),
                    style: ElevatedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 12),
                      backgroundColor: _currentIndex < _questions.length - 1 ? const Color(0xFF2563EB) : Colors.green,
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
}
