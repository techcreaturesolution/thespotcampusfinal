import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../services/api_service.dart';

class SubjectPracticeScreen extends StatefulWidget {
  const SubjectPracticeScreen({super.key});

  @override
  State<SubjectPracticeScreen> createState() => _SubjectPracticeScreenState();
}

class _SubjectPracticeScreenState extends State<SubjectPracticeScreen> {
  List<dynamic> _subjects = [];
  List<dynamic> _topics = [];
  Map<String, dynamic>? _selectedSubject;
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _fetchSubjects();
  }

  Future<void> _fetchSubjects() async {
    try {
      final api = Provider.of<ApiService>(context, listen: false);
      final data = await api.get('/preparation/subjects/active');
      setState(() { _subjects = data['subjects'] ?? []; _isLoading = false; });
    } catch (e) { setState(() => _isLoading = false); }
  }

  Future<void> _fetchTopics(Map<String, dynamic> subject) async {
    setState(() { _selectedSubject = subject; _isLoading = true; });
    try {
      final api = Provider.of<ApiService>(context, listen: false);
      final data = await api.get('/preparation/topics/subject/${subject['_id']}');
      setState(() { _topics = data['topics'] ?? []; _isLoading = false; });
    } catch (e) { setState(() => _isLoading = false); }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(_selectedSubject != null ? _selectedSubject!['name'] : 'Subject Practice'),
        leading: _selectedSubject != null
            ? IconButton(icon: const Icon(Icons.arrow_back), onPressed: () => setState(() { _selectedSubject = null; _topics = []; }))
            : null,
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _selectedSubject == null ? _buildSubjectList() : _buildTopicList(),
    );
  }

  Widget _buildSubjectList() {
    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: _subjects.length,
      itemBuilder: (ctx, i) {
        final s = _subjects[i];
        return Card(
          margin: const EdgeInsets.only(bottom: 10),
          child: ListTile(
            leading: Container(
              width: 40, height: 40,
              decoration: BoxDecoration(color: Colors.indigo.shade50, borderRadius: BorderRadius.circular(10)),
              child: Icon(Icons.menu_book, color: Colors.indigo.shade600, size: 20),
            ),
            title: Text(s['name'] ?? '', style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14)),
            subtitle: Text('${s['topic_count'] ?? 0} topics · ${s['question_count'] ?? 0} questions', style: TextStyle(fontSize: 12, color: Colors.grey.shade600)),
            trailing: const Icon(Icons.chevron_right),
            onTap: () => _fetchTopics(s),
          ),
        );
      },
    );
  }

  Widget _buildTopicList() {
    if (_topics.isEmpty) return const Center(child: Text('No topics available'));
    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: _topics.length,
      itemBuilder: (ctx, i) {
        final t = _topics[i];
        return Card(
          margin: const EdgeInsets.only(bottom: 10),
          child: ListTile(
            leading: Container(
              width: 36, height: 36,
              decoration: BoxDecoration(color: Colors.purple.shade50, borderRadius: BorderRadius.circular(8)),
              child: Icon(Icons.target, color: Colors.purple.shade600, size: 18),
            ),
            title: Text(t['name'] ?? '', style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13)),
            subtitle: Text('${t['question_count'] ?? t['total_questions'] ?? 0} questions', style: TextStyle(fontSize: 11, color: Colors.grey.shade600)),
            trailing: ElevatedButton(
              onPressed: () => Navigator.pushNamed(context, '/preparation/practice', arguments: {'topic': t, 'subject': _selectedSubject}),
              style: ElevatedButton.styleFrom(padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6), textStyle: const TextStyle(fontSize: 12)),
              child: const Text('Practice'),
            ),
          ),
        );
      },
    );
  }
}
