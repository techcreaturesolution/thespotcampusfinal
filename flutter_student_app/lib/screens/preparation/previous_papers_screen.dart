import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../services/api_service.dart';
import '../../widgets/premium_paywall.dart';

class PreviousPapersScreen extends StatefulWidget {
  const PreviousPapersScreen({super.key});

  @override
  State<PreviousPapersScreen> createState() => _PreviousPapersScreenState();
}

class _PreviousPapersScreenState extends State<PreviousPapersScreen> {
  List<dynamic> _questions = [];
  List<String> _companies = [];
  List<dynamic> _years = [];
  List<dynamic> _categories = [];
  List<dynamic> _subjectsList = [];

  int? _selectedYear;
  String? _selectedCategory;
  String? _activeSubjectId;
  String? _activeSubjectName;

  bool _isLoading = true;
  bool _needsSubscription = false;
  int _page = 1;
  int _total = 0;
  String _companyFilter = '';
  String _difficultyFilter = '';

  Map<String, dynamic>? _selectedQ;
  int _userAnswer = -1;
  bool _showAnswer = false;

  Set<String> _bookmarkedIds = {};
  Set<String> _bookmarkedPyIds = {};

  @override
  void initState() {
    super.initState();
    _fetchBookmarks();
    _fetchPyBookmarks();
    _fetchYears();
  }

  Future<void> _fetchPyBookmarks() async {
    try {
      final api = Provider.of<ApiService>(context, listen: false);
      final data = await api.get('/preparation/bookmarks?item_type=previous_year');
      if (data['bookmarks'] != null) {
        setState(() {
          _bookmarkedPyIds = Set<String>.from(data['bookmarks'].map((bm) => '${bm['item_id']}_${bm['notes']}'));
        });
      }
    } catch (_) {}
  }

  Future<void> _handlePyBookmark(String subjectId) async {
    final key = '${subjectId}_$_selectedYear';
    try {
      final api = Provider.of<ApiService>(context, listen: false);
      final data = await api.post('/preparation/bookmarks/toggle', {
        'item_type': 'previous_year',
        'item_id': subjectId,
        'notes': _selectedYear.toString(),
      });
      setState(() {
        if (data['bookmarked'] == true) {
          _bookmarkedPyIds.add(key);
        } else {
          _bookmarkedPyIds.remove(key);
        }
      });
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(data['msg'] ?? 'Bookmark toggled')));
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Failed to toggle bookmark')));
    }
  }

  Future<void> _fetchBookmarks() async {
    try {
      final api = Provider.of<ApiService>(context, listen: false);
      final data = await api.get('/preparation/bookmarks?item_type=question');
      if (data['bookmarks'] != null) {
        setState(() {
          _bookmarkedIds = Set<String>.from(data['bookmarks'].map((bm) => bm['item_id']));
        });
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
      setState(() {
        if (data['bookmarked'] == true) {
          _bookmarkedIds.add(qId);
        } else {
          _bookmarkedIds.remove(qId);
        }
      });
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(data['msg'] ?? 'Bookmark toggled')));
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Failed to toggle bookmark')));
    }
  }

  Future<void> _fetchYears() async {
    setState(() {
      _isLoading = true;
      _needsSubscription = false;
    });
    try {
      final api = Provider.of<ApiService>(context, listen: false);
      final data = await api.get('/preparation/questions/previous-year');
      setState(() {
        _years = data['years'] ?? [];
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

  Future<void> _fetchCategories(int year) async {
    setState(() => _isLoading = true);
    try {
      final api = Provider.of<ApiService>(context, listen: false);
      final data = await api.get('/preparation/questions/previous-year/categories?year=$year');
      setState(() {
        _categories = data['categories'] ?? [];
        _isLoading = false;
      });
    } catch (e) {
      setState(() => _isLoading = false);
    }
  }

  Future<void> _fetchSubjects(int year, String cat) async {
    setState(() => _isLoading = true);
    try {
      final api = Provider.of<ApiService>(context, listen: false);
      final data = await api.get('/preparation/questions/previous-year/subjects?year=$year&category=$cat');
      setState(() {
        _subjectsList = data['subjects'] ?? [];
        _isLoading = false;
      });
    } catch (e) {
      setState(() => _isLoading = false);
    }
  }

  Future<void> _fetchQuestions() async {
    setState(() => _isLoading = true);
    try {
      final api = Provider.of<ApiService>(context, listen: false);
      String params = '?page=$_page&limit=10&year=$_selectedYear&category=$_selectedCategory&subject_id=$_activeSubjectId';
      if (_companyFilter.isNotEmpty) params += '&company_name=$_companyFilter';
      if (_difficultyFilter.isNotEmpty) params += '&difficulty=$_difficultyFilter';
      
      final data = await api.get('/preparation/questions/previous-year$params');
      setState(() {
        _questions = data['questions'] ?? [];
        _total = data['total'] ?? 0;
        _companies = List<String>.from(data['companies'] ?? []);
        _isLoading = false;
      });
    } catch (e) {
      setState(() => _isLoading = false);
    }
  }

  void _handleBreadcrumb(String stage) {
    setState(() {
      _selectedQ = null;
      _userAnswer = -1;
      _showAnswer = false;
      if (stage == 'year') {
        _selectedYear = null;
        _selectedCategory = null;
        _activeSubjectId = null;
        _questions = [];
        _page = 1;
      } else if (stage == 'category') {
        _selectedCategory = null;
        _activeSubjectId = null;
        _questions = [];
        _page = 1;
      } else if (stage == 'subject') {
        _activeSubjectId = null;
        _questions = [];
        _page = 1;
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    if (_needsSubscription) {
      return PremiumPaywall(
        onBack: () => Navigator.pop(context),
        onPurchaseSuccess: () {
          _fetchYears();
        },
      );
    }

    return Scaffold(
      appBar: AppBar(title: const Text('Previous Year Papers')),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : Column(
              children: [
                _buildBreadcrumbs(),
                Expanded(
                  child: _selectedYear == null
                      ? _buildYears()
                      : _selectedCategory == null
                          ? _buildCategories()
                          : _activeSubjectId == null
                              ? _buildSubjects()
                              : _selectedQ != null
                                  ? _buildQuestionDetail()
                                  : _buildQuestions(),
                ),
              ],
            ),
    );
  }

  Widget _buildBreadcrumbs() {
    if (_selectedYear == null && _selectedCategory == null && _activeSubjectId == null) {
      return const SizedBox.shrink();
    }
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      width: double.infinity,
      color: Colors.white,
      child: Wrap(
        spacing: 4,
        crossAxisAlignment: WrapCrossAlignment.center,
        children: [
          InkWell(
            onTap: () => _handleBreadcrumb('year'),
            child: const Text('All Years', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.indigo)),
          ),
          if (_selectedYear != null) ...[
            const Icon(Icons.chevron_right, size: 14, color: Colors.grey),
            InkWell(
              onTap: () => _handleBreadcrumb('category'),
              child: Text('$_selectedYear', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: _selectedCategory == null ? Colors.black87 : Colors.indigo)),
            ),
          ],
          if (_selectedCategory != null) ...[
            const Icon(Icons.chevron_right, size: 14, color: Colors.grey),
            InkWell(
              onTap: () => _handleBreadcrumb('subject'),
              child: Text(_selectedCategory!, style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: _activeSubjectId == null ? Colors.black87 : Colors.indigo)),
            ),
          ],
          if (_activeSubjectId != null) ...[
            const Icon(Icons.chevron_right, size: 14, color: Colors.grey),
            Text(_activeSubjectName ?? 'Questions', style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.black87)),
          ],
        ],
      ),
    );
  }

  Widget _buildYears() {
    if (_years.isEmpty) return const Center(child: Text('No previous year papers found.'));
    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: _years.length,
      itemBuilder: (ctx, i) {
        final y = _years[i];
        return Card(
          margin: const EdgeInsets.only(bottom: 12),
          child: ListTile(
            leading: const CircleAvatar(backgroundColor: Colors.indigo, child: Icon(Icons.access_time, color: Colors.white, size: 20)),
            title: Text('$y Papers', style: const TextStyle(fontWeight: FontWeight.bold)),
            trailing: const Icon(Icons.chevron_right),
            onTap: () {
              setState(() {
                _selectedYear = y;
                _page = 1;
              });
              _fetchCategories(y);
            },
          ),
        );
      },
    );
  }

  Widget _buildCategories() {
    if (_categories.isEmpty) return const Center(child: Text('No categories found.'));
    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: _categories.length,
      itemBuilder: (ctx, i) {
        final cat = _categories[i];
        return Card(
          margin: const EdgeInsets.only(bottom: 12),
          child: ListTile(
            leading: const CircleAvatar(backgroundColor: Colors.teal, child: Icon(Icons.filter_alt, color: Colors.white, size: 20)),
            title: Text(cat.toString(), style: const TextStyle(fontWeight: FontWeight.bold)),
            trailing: const Icon(Icons.chevron_right),
            onTap: () {
              setState(() {
                _selectedCategory = cat.toString();
                _page = 1;
              });
              _fetchSubjects(_selectedYear!, cat.toString());
            },
          ),
        );
      },
    );
  }

  Widget _buildSubjects() {
    if (_subjectsList.isEmpty) return const Center(child: Text('No subjects found.'));
    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: _subjectsList.length,
      itemBuilder: (ctx, i) {
        final sub = _subjectsList[i];
        final key = '${sub['_id']}_$_selectedYear';
        final isBookmarked = _bookmarkedPyIds.contains(key);
        return Card(
          margin: const EdgeInsets.only(bottom: 12),
          child: ListTile(
            leading: const CircleAvatar(backgroundColor: Colors.orange, child: Icon(Icons.menu_book, color: Colors.white, size: 20)),
            title: Text(sub['name'] ?? '', style: const TextStyle(fontWeight: FontWeight.bold)),
            trailing: IconButton(
              icon: Icon(isBookmarked ? Icons.bookmark : Icons.bookmark_border, color: isBookmarked ? Colors.blue : Colors.grey),
              onPressed: () => _handlePyBookmark(sub['_id']),
            ),
            onTap: () {
              setState(() {
                _activeSubjectId = sub['_id'];
                _activeSubjectName = sub['name'];
                _page = 1;
              });
              _fetchQuestions();
            },
          ),
        );
      },
    );
  }

  Widget _buildQuestions() {
    return Column(
      children: [
        _buildFilters(),
        if (_questions.isEmpty)
          const Expanded(child: Center(child: Text('No questions found.')))
        else
          Expanded(
            child: ListView.builder(
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
                        if (q['company_name'] != null && q['company_name'].toString().isNotEmpty)
                          Container(
                            margin: const EdgeInsets.only(top: 4, right: 6),
                            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                            decoration: BoxDecoration(color: Colors.blue.shade50, borderRadius: BorderRadius.circular(4)),
                            child: Text(q['company_name'], style: TextStyle(fontSize: 10, color: Colors.blue.shade700)),
                          ),
                        if (q['difficulty'] != null)
                          Container(
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
                    onTap: () => setState(() { _selectedQ = q; _userAnswer = -1; _showAnswer = false; }),
                  ),
                );
              },
            ),
          ),
        if (_questions.isNotEmpty && (_total / 10).ceil() > 1)
          Padding(
            padding: const EdgeInsets.symmetric(vertical: 8.0),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                IconButton(
                  icon: const Icon(Icons.chevron_left),
                  onPressed: _page > 1 ? () { setState(() { _page--; }); _fetchQuestions(); } : null,
                ),
                Text('Page $_page of ${(_total / 10).ceil()}'),
                IconButton(
                  icon: const Icon(Icons.chevron_right),
                  onPressed: _page < (_total / 10).ceil() ? () { setState(() { _page++; }); _fetchQuestions(); } : null,
                ),
              ],
            ),
          ),
      ],
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
              decoration: const InputDecoration(hintText: 'Company', contentPadding: EdgeInsets.symmetric(horizontal: 12, vertical: 8), isDense: true, border: OutlineInputBorder(borderRadius: BorderRadius.all(Radius.circular(10)))),
              items: [const DropdownMenuItem(value: '', child: Text('All')), ..._companies.map((c) => DropdownMenuItem(value: c, child: Text(c, style: const TextStyle(fontSize: 12))))],
              onChanged: (v) { setState(() { _companyFilter = v ?? ''; _page = 1; }); _fetchQuestions(); },
            ),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: DropdownButtonFormField<String>(
              value: _difficultyFilter.isEmpty ? null : _difficultyFilter,
              decoration: const InputDecoration(hintText: 'Difficulty', contentPadding: EdgeInsets.symmetric(horizontal: 12, vertical: 8), isDense: true, border: OutlineInputBorder(borderRadius: BorderRadius.all(Radius.circular(10)))),
              items: ['', 'easy', 'medium', 'hard'].map((d) => DropdownMenuItem(value: d, child: Text(d.isEmpty ? 'All' : d, style: const TextStyle(fontSize: 12)))).toList(),
              onChanged: (v) { setState(() { _difficultyFilter = v ?? ''; _page = 1; }); _fetchQuestions(); },
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildQuestionDetail() {
    final q = _selectedQ!;
    final options = List<Map<String, dynamic>>.from(q['options'] ?? []);
    final isBookmarked = _bookmarkedIds.contains(q['_id']);

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              TextButton.icon(
                icon: const Icon(Icons.arrow_back, size: 16),
                label: const Text('Back', style: TextStyle(fontSize: 12)),
                onPressed: () => setState(() => _selectedQ = null),
              ),
              IconButton(
                icon: Icon(isBookmarked ? Icons.bookmark : Icons.bookmark_border, color: isBookmarked ? Colors.blue : Colors.grey),
                onPressed: () => _handleBookmark(q['_id']),
              ),
            ],
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
    );
  }
}
