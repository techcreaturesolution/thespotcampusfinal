import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../services/api_service.dart';

class MockTestsScreen extends StatefulWidget {
  const MockTestsScreen({super.key});

  @override
  State<MockTestsScreen> createState() => _MockTestsScreenState();
}

class _MockTestsScreenState extends State<MockTestsScreen> {
  List<dynamic> _mockTests = [];
  bool _isLoading = true;
  String _filter = '';
  String _search = '';
  Set<String> _bookmarkedIds = {};

  @override
  void initState() {
    super.initState();
    _fetchBookmarks();
    _fetchMockTests();
  }

  Future<void> _fetchBookmarks() async {
    try {
      final api = Provider.of<ApiService>(context, listen: false);
      final data = await api.get('/preparation/bookmarks?item_type=mock_test');
      if (data['bookmarks'] != null) {
        if (mounted) {
          setState(() {
            _bookmarkedIds = Set<String>.from(data['bookmarks'].map((bm) => bm['item_id']));
          });
        }
      }
    } catch (_) {}
  }

  Future<void> _handleBookmark(String id) async {
    try {
      final api = Provider.of<ApiService>(context, listen: false);
      final data = await api.post('/preparation/bookmarks/toggle', {
        'item_type': 'mock_test',
        'item_id': id,
      });
      if (mounted) {
        setState(() {
          if (data['bookmarked'] == true) {
            _bookmarkedIds.add(id);
          } else {
            _bookmarkedIds.remove(id);
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

  Future<void> _fetchMockTests() async {
    setState(() => _isLoading = true);
    try {
      final api = Provider.of<ApiService>(context, listen: false);
      final params = _filter.isNotEmpty ? '?test_type=$_filter' : '';
      final data = await api.get('/preparation/mock-tests/active$params');
      if (mounted) {
        setState(() {
          _mockTests = data['mockTests'] ?? [];
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  Future<void> _startTest(Map<String, dynamic> test) async {
    try {
      // Show loading dialog
      showDialog(
        context: context,
        barrierDismissible: false,
        builder: (ctx) => const Center(child: CircularProgressIndicator()),
      );

      final api = Provider.of<ApiService>(context, listen: false);
      final data = await api.post('/preparation/mock-tests/${test['_id']}/start', {});
      
      if (!mounted) return;
      Navigator.pop(context); // Close dialog

      Navigator.pushNamed(context, '/preparation/take-test', arguments: {
        'attempt': data['attempt'],
        'questions': data['questions'],
        'mockTestId': test['_id'],
        'mockTestTitle': test['title'],
        'durationMinutes': test['duration_minutes'],
        'remainingSeconds': data['remaining_seconds'],
      });
    } catch (e) {
      if (!mounted) return;
      Navigator.pop(context); // Close dialog
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Failed to start test')));
    }
  }

  @override
  Widget build(BuildContext context) {
    final filteredTests = _mockTests.where((test) {
      final title = (test['title'] ?? '').toString().toLowerCase();
      return title.contains(_search.toLowerCase());
    }).toList();

    return Scaffold(
      appBar: AppBar(title: const Text('Mock Tests')),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : Column(
              children: [
                Padding(
                  padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
                  child: TextField(
                    decoration: InputDecoration(
                      hintText: 'Search mock tests...',
                      prefixIcon: const Icon(Icons.search),
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(30)),
                      contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 0),
                    ),
                    onChanged: (val) => setState(() => _search = val),
                  ),
                ),
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
                  child: filteredTests.isEmpty
                      ? const Center(child: Text('No mock tests found.'))
                      : ListView.builder(
                          padding: const EdgeInsets.all(16),
                          itemCount: filteredTests.length,
                          itemBuilder: (ctx, i) => _buildTestCard(filteredTests[i]),
                        ),
                ),
              ],
            ),
    );
  }

  Widget _buildTestCard(Map<String, dynamic> test) {
    final isBookmarked = _bookmarkedIds.contains(test['_id']);
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
                const Spacer(),
                IconButton(
                  padding: EdgeInsets.zero,
                  constraints: const BoxConstraints(),
                  icon: Icon(isBookmarked ? Icons.bookmark : Icons.bookmark_border, color: isBookmarked ? Colors.blue : Colors.grey, size: 20),
                  onPressed: () => _handleBookmark(test['_id']),
                ),
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
