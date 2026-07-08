import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../services/api_service.dart';
import '../../widgets/premium_paywall.dart';

class MockTestsScreen extends StatefulWidget {
  const MockTestsScreen({super.key});

  @override
  State<MockTestsScreen> createState() => _MockTestsScreenState();
}

class _MockTestsScreenState extends State<MockTestsScreen> {
  List<dynamic> _mockTests = [];
  bool _isLoading = true;
  bool _needsSubscription = false;
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
    setState(() {
      _isLoading = true;
      _needsSubscription = false;
    });
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
        setState(() {
          _isLoading = false;
          if (e is ApiException && (e.statusCode == 403 || e.message.contains('subscription'))) {
            _needsSubscription = true;
          }
        });
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
    if (_needsSubscription) {
      return PremiumPaywall(
        onBack: () => Navigator.pop(context),
        onPurchaseSuccess: () {
          _fetchMockTests();
        },
      );
    }

    final filteredTests = _mockTests.where((test) {
      final title = (test['title'] ?? '').toString().toLowerCase();
      return title.contains(_search.toLowerCase());
    }).toList();

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        title: const Text('Mock Tests', style: TextStyle(fontWeight: FontWeight.bold, color: Color(0xFF111827))),
        backgroundColor: const Color(0xFFF8FAFC),
        elevation: 0,
        iconTheme: const IconThemeData(color: Color(0xFF111827)),
        centerTitle: true,
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : Column(
              children: [
                Padding(
                  padding: const EdgeInsets.fromLTRB(16, 12, 16, 16),
                  child: Container(
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(20),
                      boxShadow: [
                        BoxShadow(color: Colors.black.withOpacity(0.04), blurRadius: 10, offset: const Offset(0, 4)),
                      ],
                    ),
                    child: TextField(
                      decoration: const InputDecoration(
                        hintText: 'Search mock tests...',
                        hintStyle: TextStyle(color: Colors.black38, fontSize: 14),
                        prefixIcon: Icon(Icons.search, color: Colors.black54),
                        border: InputBorder.none,
                        contentPadding: EdgeInsets.symmetric(horizontal: 20, vertical: 14),
                      ),
                      onChanged: (val) => setState(() => _search = val),
                    ),
                  ),
                ),
                SizedBox(
                  height: 40,
                  child: ListView(
                    scrollDirection: Axis.horizontal,
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    children: ['', 'company', 'subject', 'topic', 'mixed'].map((t) {
                      final isSelected = _filter == t;
                      final label = t.isEmpty ? 'All' : t[0].toUpperCase() + t.substring(1);
                      return Padding(
                        padding: const EdgeInsets.only(right: 8),
                        child: ChoiceChip(
                          label: Text(label, style: TextStyle(fontSize: 13, fontWeight: isSelected ? FontWeight.bold : FontWeight.w500, color: isSelected ? Colors.white : const Color(0xFF4B5563))),
                          selected: isSelected,
                          selectedColor: const Color(0xFF2563EB),
                          backgroundColor: Colors.white,
                          side: BorderSide(color: isSelected ? Colors.transparent : Colors.grey.shade300),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                          showCheckmark: false,
                          onSelected: (_) { setState(() => _filter = t); _fetchMockTests(); },
                        ),
                      );
                    }).toList(),
                  ),
                ),
                const SizedBox(height: 8),
                Expanded(
                  child: filteredTests.isEmpty
                      ? const Center(child: Text('No mock tests found.', style: TextStyle(color: Colors.grey)))
                      : ListView.builder(
                          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
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
    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        boxShadow: [
          BoxShadow(color: Colors.black.withOpacity(0.04), blurRadius: 16, offset: const Offset(0, 8)),
        ],
      ),
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Expanded(child: Text(test['title'] ?? '', style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 16, color: Color(0xFF111827)))),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(color: const Color(0xFFEFF6FF), borderRadius: BorderRadius.circular(12)),
                  child: Text(test['test_type'] ?? '', style: const TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Color(0xFF2563EB))),
                ),
              ],
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                const Icon(Icons.help_outline, size: 16, color: Color(0xFF6B7280)),
                const SizedBox(width: 4),
                Text('${test['total_questions']} Q', style: const TextStyle(fontSize: 13, color: Color(0xFF6B7280), fontWeight: FontWeight.w500)),
                const SizedBox(width: 16),
                const Icon(Icons.timer_outlined, size: 16, color: Color(0xFF6B7280)),
                const SizedBox(width: 4),
                Text('${test['duration_minutes']} min', style: const TextStyle(fontSize: 13, color: Color(0xFF6B7280), fontWeight: FontWeight.w500)),
                if (test['negative_marking'] == true) ...[
                  const SizedBox(width: 16),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                    decoration: BoxDecoration(color: Colors.red.shade50, borderRadius: BorderRadius.circular(6)),
                    child: Text('-ve', style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Colors.red.shade700)),
                  ),
                ],
                const Spacer(),
                GestureDetector(
                  onTap: () => _handleBookmark(test['_id']),
                  child: Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: isBookmarked ? const Color(0xFF2563EB).withOpacity(0.1) : Colors.grey.shade100,
                      shape: BoxShape.circle,
                    ),
                    child: Icon(isBookmarked ? Icons.bookmark : Icons.bookmark_border, color: isBookmarked ? const Color(0xFF2563EB) : const Color(0xFF6B7280), size: 18),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 20),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: () => _startTest(test),
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
                    Icon(Icons.play_arrow_rounded, size: 22, color: Colors.white),
                    SizedBox(width: 8),
                    Text('Start Test', style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold)),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
