import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../services/api_service.dart';
import '../../widgets/premium_paywall.dart';

class SubjectPracticeScreen extends StatefulWidget {
  const SubjectPracticeScreen({super.key});

  @override
  State<SubjectPracticeScreen> createState() => _SubjectPracticeScreenState();
}

class _SubjectPracticeScreenState extends State<SubjectPracticeScreen> {
  List<dynamic> _subjects = [];
  bool _isLoading = true;
  bool _needsSubscription = false;

  @override
  void initState() {
    super.initState();
    _fetchSubjects();
  }

  Future<void> _fetchSubjects() async {
    setState(() {
      _isLoading = true;
      _needsSubscription = false;
    });
    try {
      final api = Provider.of<ApiService>(context, listen: false);
      final data = await api.get('/preparation/subjects/active');
      setState(() { _subjects = data['subjects'] ?? []; _isLoading = false; });
    } catch (e) {
      setState(() {
        _isLoading = false;
        if (e is ApiException && (e.statusCode == 403 || e.message.contains('subscription'))) {
          _needsSubscription = true;
        }
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_needsSubscription) {
      return PremiumPaywall(
        onBack: () => Navigator.pop(context),
        onPurchaseSuccess: () {
          _fetchSubjects();
        },
      );
    }

    return Scaffold(
      appBar: AppBar(
        title: const Text('Subject Practice'),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _buildSubjectList(),
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
            subtitle: Text('${s['question_count'] ?? 0} questions', style: TextStyle(fontSize: 12, color: Colors.grey.shade600)),
            trailing: const Icon(Icons.chevron_right),
            onTap: () => Navigator.pushNamed(context, '/preparation/practice', arguments: {'subject': s}),
          ),
        );
      },
    );
  }
}
