import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../services/api_service.dart';

class BookmarksScreen extends StatefulWidget {
  const BookmarksScreen({super.key});

  @override
  State<BookmarksScreen> createState() => _BookmarksScreenState();
}

class _BookmarksScreenState extends State<BookmarksScreen> {
  List<dynamic> _bookmarks = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _fetchBookmarks();
  }

  Future<void> _fetchBookmarks() async {
    setState(() => _isLoading = true);
    try {
      final api = Provider.of<ApiService>(context, listen: false);
      final data = await api.get('/preparation/bookmarks');
      if (mounted) {
        setState(() {
          _bookmarks = data['bookmarks'] ?? [];
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() => _isLoading = false);
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Failed to load bookmarks')));
      }
    }
  }

  Future<void> _removeBookmark(String itemId, String itemType) async {
    try {
      final api = Provider.of<ApiService>(context, listen: false);
      await api.post('/preparation/bookmarks/toggle', {
        'item_type': itemType,
        'item_id': itemId,
      });
      _fetchBookmarks();
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Bookmark removed')));
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Failed to remove bookmark')));
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        title: const Text('Bookmarks', style: TextStyle(fontWeight: FontWeight.bold, color: Color(0xFF111827))),
        backgroundColor: const Color(0xFFF8FAFC),
        elevation: 0,
        iconTheme: const IconThemeData(color: Color(0xFF111827)),
        centerTitle: true,
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _bookmarks.isEmpty
              ? _buildEmptyState()
              : ListView.builder(
                  padding: const EdgeInsets.all(16),
                  itemCount: _bookmarks.length,
                  itemBuilder: (ctx, i) {
                    final bm = _bookmarks[i];
                    return _buildBookmarkCard(bm);
                  },
                ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.bookmark_border, size: 64, color: Colors.grey.shade400),
          const SizedBox(height: 16),
          Text('No bookmarks yet', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.grey.shade700)),
          const SizedBox(height: 8),
          Text('Items you bookmark will appear here.', style: TextStyle(color: Colors.grey.shade500)),
        ],
      ),
    );
  }

  Widget _buildBookmarkCard(Map<String, dynamic> bookmark) {
    final itemType = bookmark['item_type'] ?? '';
    final item = bookmark['item'];
    if (item == null) return const SizedBox.shrink();

    String title = 'Unknown Item';
    String subtitle = itemType.replaceAll('_', ' ').toUpperCase();
    IconData icon = Icons.bookmark;
    Color color = const Color(0xFF2563EB);

    if (itemType == 'mock_test') {
      title = item['title'] ?? 'Mock Test';
      icon = Icons.assignment;
      color = const Color(0xFF10B981);
    } else if (itemType == 'question') {
      title = item['question_text']?.toString() ?? 'Question';
      if (title.length > 50) title = title.substring(0, 50) + '...';
      icon = Icons.help_outline;
      color = const Color(0xFFF59E0B);
    } else if (itemType == 'pdf') {
      title = item['title'] ?? 'PDF Material';
      icon = Icons.picture_as_pdf;
      color = const Color(0xFFEF4444);
    } else if (itemType == 'subject' || itemType == 'previous_year') {
      title = item['name'] ?? 'Subject';
      icon = Icons.book;
      color = const Color(0xFF8B5CF6);
    }

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.grey.shade200),
        boxShadow: [
          BoxShadow(color: Colors.black.withOpacity(0.02), blurRadius: 8, offset: const Offset(0, 4)),
        ],
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: color.withOpacity(0.1),
              shape: BoxShape.circle,
            ),
            child: Icon(icon, color: color, size: 24),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14, color: Color(0xFF111827))),
                const SizedBox(height: 4),
                Text(subtitle, style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w600, color: Colors.grey)),
              ],
            ),
          ),
          IconButton(
            icon: const Icon(Icons.bookmark, color: Color(0xFF2563EB)),
            onPressed: () => _removeBookmark(bookmark['item_id'], itemType),
          ),
        ],
      ),
    );
  }
}
