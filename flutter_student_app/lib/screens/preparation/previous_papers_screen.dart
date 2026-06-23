import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../services/api_service.dart';

class PreviousPapersScreen extends StatefulWidget {
  const PreviousPapersScreen({super.key});

  @override
  State<PreviousPapersScreen> createState() => _PreviousPapersScreenState();
}

class _PreviousPapersScreenState extends State<PreviousPapersScreen> {
  List<dynamic> _questions = [];
  List<String> _companies = [];
  bool _isLoading = true;
  String _companyFilter = '';
  String _difficultyFilter = '';
  int? _selectedQIdx;
  int _userAnswer = -1;
  bool _showAnswer = false;

  @override
  void initState() {
    super.initState();
    _fetchQuestions();
  }

  // TODO: STATIC DATA – remove when API is ready
  static final List<Map<String, dynamic>> _staticQuestions = [
    {
      'question_text': 'A train travels 360 km at a uniform speed. If the speed had been 5 km/h more, it would have taken 1 hour less. Find the speed of the train.',
      'options': [{'text': '40 km/h'}, {'text': '45 km/h'}, {'text': '36 km/h'}, {'text': '30 km/h'}],
      'correct_option_index': 0,
      'company_name': 'TCS',
      'difficulty': 'medium',
      'explanation': 'Using speed–distance–time relation: 360/s - 360/(s+5) = 1 → s = 40 km/h.',
    },
    {
      'question_text': 'Which data structure is used to implement recursion?',
      'options': [{'text': 'Queue'}, {'text': 'Stack'}, {'text': 'Array'}, {'text': 'Linked List'}],
      'correct_option_index': 1,
      'company_name': 'Infosys',
      'difficulty': 'easy',
      'explanation': 'Function call stack is used internally by the OS/compiler to manage recursion.',
    },
    {
      'question_text': 'Find the odd one out: 2, 5, 10, 17, 26, 37, 50, 64',
      'options': [{'text': '37'}, {'text': '50'}, {'text': '64'}, {'text': '26'}],
      'correct_option_index': 2,
      'company_name': 'Wipro',
      'difficulty': 'medium',
      'explanation': 'The series is n²+1: 5, 10, 17, 26, 37, 50, 65. 64 should be 65.',
    },
    {
      'question_text': 'What is the time complexity of binary search?',
      'options': [{'text': 'O(n)'}, {'text': 'O(n²)'}, {'text': 'O(log n)'}, {'text': 'O(n log n)'}],
      'correct_option_index': 2,
      'company_name': 'Accenture',
      'difficulty': 'easy',
      'explanation': 'Binary search halves the search space at each step, giving O(log n) complexity.',
    },
    {
      'question_text': 'A bag contains 4 red, 5 blue and 3 green balls. If 2 balls are picked at random, what is the probability that both are blue?',
      'options': [{'text': '5/33'}, {'text': '10/66'}, {'text': '2/11'}, {'text': '5/22'}],
      'correct_option_index': 1,
      'company_name': 'TCS',
      'difficulty': 'hard',
      'explanation': 'P = C(5,2)/C(12,2) = 10/66.',
    },
    {
      'question_text': 'Which of the following is NOT a feature of Object-Oriented Programming?',
      'options': [{'text': 'Encapsulation'}, {'text': 'Pointer Arithmetic'}, {'text': 'Inheritance'}, {'text': 'Polymorphism'}],
      'correct_option_index': 1,
      'company_name': 'HCL',
      'difficulty': 'easy',
      'explanation': 'Pointer arithmetic is a feature of procedural languages like C, not OOP.',
    },
    {
      'question_text': 'In a class of 30, 20 students play cricket, 15 play football and 10 play both. How many play neither?',
      'options': [{'text': '3'}, {'text': '5'}, {'text': '7'}, {'text': '10'}],
      'correct_option_index': 1,
      'company_name': 'Capgemini',
      'difficulty': 'medium',
      'explanation': 'By inclusion-exclusion: 20+15-10=25. Neither = 30-25 = 5.',
    },
    {
      'question_text': 'What does SQL stand for?',
      'options': [{'text': 'Structured Query Language'}, {'text': 'Simple Query Language'}, {'text': 'Standard Question Language'}, {'text': 'Sequential Query Logic'}],
      'correct_option_index': 0,
      'company_name': 'Infosys',
      'difficulty': 'easy',
      'explanation': 'SQL stands for Structured Query Language, used to manage relational databases.',
    },
  ];

  Future<void> _fetchQuestions() async {
    // TODO: Uncomment API call and remove static data below when backend is ready
    // try {
    //   final api = Provider.of<ApiService>(context, listen: false);
    //   String params = '?page=1&limit=30';
    //   if (_companyFilter.isNotEmpty) params += '&company_name=$_companyFilter';
    //   if (_difficultyFilter.isNotEmpty) params += '&difficulty=$_difficultyFilter';
    //   final data = await api.get('/preparation/questions/previous-year$params');
    //   setState(() {
    //     _questions = data['questions'] ?? [];
    //     _companies = List<String>.from(data['companies'] ?? []);
    //     _isLoading = false;
    //   });
    // } catch (e) { setState(() => _isLoading = false); }

    await Future.delayed(const Duration(milliseconds: 300)); // simulate loading
    var filtered = List<Map<String, dynamic>>.from(_staticQuestions);
    if (_companyFilter.isNotEmpty) {
      filtered = filtered.where((q) => q['company_name'] == _companyFilter).toList();
    }
    if (_difficultyFilter.isNotEmpty) {
      filtered = filtered.where((q) => q['difficulty'] == _difficultyFilter).toList();
    }
    setState(() {
      _questions = filtered;
      _companies = ['TCS', 'Infosys', 'Wipro', 'Accenture', 'HCL', 'Capgemini'];
      _isLoading = false;
    });
  }


  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Previous Year Papers')),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : Column(
              children: [
                _buildFilters(),
                Expanded(child: _selectedQIdx != null ? _buildQuestionDetail() : _buildQuestionList()),
              ],
            ),
    );
  }

  Widget _buildFilters() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      child: Row(
        children: [
          Expanded(
            child: DropdownButtonFormField<String>(
              value: _companyFilter.isEmpty ? null : _companyFilter,
              decoration: const InputDecoration(hintText: 'Company', contentPadding: EdgeInsets.symmetric(horizontal: 12, vertical: 8), isDense: true),
              items: [const DropdownMenuItem(value: '', child: Text('All')), ..._companies.map((c) => DropdownMenuItem(value: c, child: Text(c, style: const TextStyle(fontSize: 12))))],
              onChanged: (v) { setState(() => _companyFilter = v ?? ''); _fetchQuestions(); },
              style: const TextStyle(fontSize: 12, color: Colors.black87),
            ),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: DropdownButtonFormField<String>(
              value: _difficultyFilter.isEmpty ? null : _difficultyFilter,
              decoration: const InputDecoration(hintText: 'Difficulty', contentPadding: EdgeInsets.symmetric(horizontal: 12, vertical: 8), isDense: true),
              items: ['', 'easy', 'medium', 'hard'].map((d) => DropdownMenuItem(value: d, child: Text(d.isEmpty ? 'All' : d, style: const TextStyle(fontSize: 12)))).toList(),
              onChanged: (v) { setState(() => _difficultyFilter = v ?? ''); _fetchQuestions(); },
              style: const TextStyle(fontSize: 12, color: Colors.black87),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildQuestionList() {
    if (_questions.isEmpty) return const Center(child: Text('No questions found'));
    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: _questions.length,
      itemBuilder: (ctx, i) {
        final q = _questions[i];
        return Card(
          margin: const EdgeInsets.only(bottom: 8),
          child: ListTile(
            title: Text(q['question_text'] ?? '', maxLines: 2, overflow: TextOverflow.ellipsis, style: const TextStyle(fontSize: 13)),
            subtitle: Row(
              children: [
                if (q['company_name'] != null) Container(
                  margin: const EdgeInsets.only(top: 4, right: 6),
                  padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                  decoration: BoxDecoration(color: Colors.blue.shade50, borderRadius: BorderRadius.circular(4)),
                  child: Text(q['company_name'], style: TextStyle(fontSize: 10, color: Colors.blue.shade700)),
                ),
                if (q['difficulty'] != null) Container(
                  margin: const EdgeInsets.only(top: 4),
                  padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                  decoration: BoxDecoration(
                    color: q['difficulty'] == 'easy' ? Colors.green.shade50 : q['difficulty'] == 'hard' ? Colors.red.shade50 : Colors.amber.shade50,
                    borderRadius: BorderRadius.circular(4),
                  ),
                  child: Text(q['difficulty'], style: TextStyle(fontSize: 10, color: q['difficulty'] == 'easy' ? Colors.green.shade700 : q['difficulty'] == 'hard' ? Colors.red.shade700 : Colors.amber.shade700)),
                ),
              ],
            ),
            trailing: const Icon(Icons.chevron_right, size: 20),
            onTap: () => setState(() { _selectedQIdx = i; _userAnswer = -1; _showAnswer = false; }),
          ),
        );
      },
    );
  }

  Widget _buildQuestionDetail() {
    final q = _questions[_selectedQIdx!];
    final options = List<Map<String, dynamic>>.from(q['options'] ?? []);
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          TextButton.icon(
            icon: const Icon(Icons.arrow_back, size: 16),
            label: const Text('Back to list', style: TextStyle(fontSize: 12)),
            onPressed: () => setState(() => _selectedQIdx = null),
          ),
          const SizedBox(height: 8),
          Text(q['question_text'] ?? '', style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w500)),
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
              onTap: _showAnswer ? null : () {
                setState(() { _userAnswer = idx; _showAnswer = true; });
              },
              child: Container(
                margin: const EdgeInsets.only(bottom: 8),
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                decoration: BoxDecoration(border: Border.all(color: borderColor), borderRadius: BorderRadius.circular(10), color: bgColor),
                child: Row(
                  children: [
                    Text('${String.fromCharCode(65 + idx)}. ', style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13)),
                    Expanded(child: Text(options[idx]['text'] ?? '', style: const TextStyle(fontSize: 13))),
                    if (_showAnswer && isCorrect) const Icon(Icons.check_circle, color: Colors.green, size: 18),
                    if (_showAnswer && isSelected && !isCorrect) const Icon(Icons.cancel, color: Colors.red, size: 18),
                  ],
                ),
              ),
            );
          }),
          if (_showAnswer && q['explanation'] != null && q['explanation'].isNotEmpty) ...[
            const SizedBox(height: 12),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(color: Colors.blue.shade50, borderRadius: BorderRadius.circular(8)),
              child: Text('Explanation: ${q['explanation']}', style: TextStyle(fontSize: 12, color: Colors.blue.shade800)),
            ),
          ],
        ],
      ),
    );
  }
}
