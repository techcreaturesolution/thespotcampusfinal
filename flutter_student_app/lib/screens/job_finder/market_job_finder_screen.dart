import 'dart:async';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../models/market_job_models.dart';
import '../../services/job_finder_service.dart';
import '../../services/auth_service.dart';
import 'market_job_detail_screen.dart';
import 'job_finder_constants.dart';

class MarketJobFinderScreen extends StatefulWidget {
  const MarketJobFinderScreen({super.key});

  @override
  State<MarketJobFinderScreen> createState() => _MarketJobFinderScreenState();
}

class _MarketJobFinderScreenState extends State<MarketJobFinderScreen> {
  final JobFinderService _service = JobFinderService();
  final TextEditingController _promptController = TextEditingController();

  MarketJobMeta? _meta;
  List<MarketJobSearch> _history = [];
  MarketJobSearch? _currentSearch;
  List<MarketJob> _jobs = [];

  bool _loadingMeta = true;
  bool _searching = false;
  Timer? _pollTimer;

  // Search parameters
  String _level = 'fresher';
  String _selectedState = '';
  String _selectedCity = '';
  String _selectedCategory = '';
  String _selectedEducation = '';
  int _postedWithin = 30;
  bool _verifiedOnly = false;

  int get _activeFiltersCount {
    int count = 0;
    if (_selectedState.isNotEmpty) count++;
    if (_selectedCity.isNotEmpty) count++;
    if (_selectedCategory.isNotEmpty) count++;
    if (_selectedEducation.isNotEmpty) count++;
    if (_postedWithin != 30) count++;
    if (_verifiedOnly) count++;
    return count;
  }

  final List<String> _fresherSuggestions = [
    'React developer',
    'Graduate Trainee',
    'B.Com Accounts Tally',
    'Telecaller Hindi / English',
    'Digital Marketing',
    'Python Django',
  ];

  final List<String> _expSuggestions = [
    'Senior Java Developer',
    'Node.js Backend 3 yrs',
    'Sales Manager FMCG',
    'HR Recruiter IT',
    'DevOps Cloud Engineer',
  ];

  @override
  void initState() {
    super.initState();
    _loadInitialData();
  }

  @override
  void dispose() {
    _pollTimer?.cancel();
    _promptController.dispose();
    super.dispose();
  }

  Future<void> _loadInitialData() async {
    try {
      final meta = await _service.getMeta();
      final history = await _service.getSearches();
      if (mounted) {
        setState(() {
          _meta = meta;
          _history = history;
          _loadingMeta = false;
        });

        if (history.isNotEmpty) {
          _fetchSearchResults(history.first.id);
        }
      }
    } catch (_) {
      if (mounted) setState(() => _loadingMeta = false);
    }
  }

  Future<void> _startSearch() async {
    final prompt = _promptController.text.trim();
    if (prompt.isEmpty && _selectedCategory.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please enter a job title or pick a category')),
      );
      return;
    }

    FocusScope.of(context).unfocus();
    setState(() {
      _searching = true;
      _jobs = [];
    });

    try {
      final search = await _service.startSearch({
        'prompt': prompt,
        'level': _level,
        'state': _selectedState,
        'city': _selectedCity,
        'category': _selectedCategory,
        'education': _selectedEducation,
        'postedWithin': _postedWithin,
        'verifiedOnly': _verifiedOnly,
      });

      setState(() => _currentSearch = search);
      _pollSearch(search.id);
    } catch (e) {
      setState(() => _searching = false);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(e.toString().replaceAll('Exception: ', ''))),
        );
      }
    }
  }

  void _pollSearch(String searchId) {
    _pollTimer?.cancel();
    _pollTimer = Timer.periodic(const Duration(seconds: 3), (timer) async {
      try {
        final result = await _service.getSearchById(searchId);
        final MarketJobSearch s = result['search'];
        final List<MarketJob> items = result['items'];

        if (mounted) {
          setState(() {
            _currentSearch = s;
            _jobs = items;
          });

          if (s.status == 'completed' || s.status == 'failed') {
            timer.cancel();
            setState(() => _searching = false);
            _service.getSearches().then((h) {
              if (mounted) setState(() => _history = h);
            });
          }
        }
      } catch (_) {
        timer.cancel();
        if (mounted) setState(() => _searching = false);
      }
    });
  }

  Future<void> _fetchSearchResults(String searchId) async {
    setState(() => _searching = true);
    try {
      final result = await _service.getSearchById(searchId);
      if (mounted) {
        setState(() {
          _currentSearch = result['search'];
          _jobs = result['items'];
          _searching = false;
        });
      }
    } catch (_) {
      if (mounted) setState(() => _searching = false);
    }
  }

  Future<void> _handleDirectApply(MarketJob job) async {
    try {
      final url = await _service.applyJob(job.id);
      if (url.isNotEmpty) {
        final uri = Uri.parse(url);
        if (await canLaunchUrl(uri)) {
          await launchUrl(uri, mode: LaunchMode.externalApplication);
        }
      }
    } catch (_) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Could not open external job link')),
        );
      }
    }
  }

  String _getCategoryLabel(String key) {
    if (key.isEmpty) return 'All Categories';
    if (_meta?.categories.isNotEmpty == true) {
      final found = _meta!.categories.firstWhere((c) => c.key == key, orElse: () => MarketJobOption(key: key, label: key));
      return found.label;
    }
    final found = JobFinderConstants.categories.firstWhere((c) => c['key'] == key, orElse: () => {'key': key, 'label': key});
    return found['label']!;
  }

  String _getEducationLabel(String key) {
    if (key.isEmpty) return 'Any Qualification';
    if (_meta?.education.isNotEmpty == true) {
      final found = _meta!.education.firstWhere((e) => e.key == key, orElse: () => MarketJobOption(key: key, label: key));
      return found.label;
    }
    final found = JobFinderConstants.education.firstWhere((e) => e['key'] == key, orElse: () => {'key': key, 'label': key});
    return found['label']!;
  }

  String _getPostedWithinLabel(int days) {
    final found = JobFinderConstants.postedWithinOptions.firstWhere((p) => p['value'] == days, orElse: () => {'value': days, 'label': '$days Days'});
    return found['label'] as String;
  }

  Widget _buildActiveFilterChip({required String label, required VoidCallback onClear}) {
    return Padding(
      padding: const EdgeInsets.only(left: 6.0),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 5),
        decoration: BoxDecoration(
          color: const Color(0xFFEFF6FF),
          borderRadius: BorderRadius.circular(8),
          border: Border.all(color: const Color(0xFFBFDBFE)),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              label,
              style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: Color(0xFF1D4ED8)),
            ),
            const SizedBox(width: 4),
            GestureDetector(
              onTap: onClear,
              child: const Icon(Icons.close, size: 13, color: Color(0xFF1D4ED8)),
            ),
          ],
        ),
      ),
    );
  }

  void _openFilterModal() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (context) {
        return StatefulBuilder(
          builder: (context, setModalState) {
            final List<String> statesList =
                (_meta?.states.isNotEmpty == true ? _meta!.states : JobFinderConstants.states);

            final List<String> citiesList =
                JobFinderConstants.getCitiesForState(_selectedState);

            final List<Map<String, String>> categoriesList =
                (_meta?.categories.isNotEmpty == true
                    ? _meta!.categories.map((c) => {'key': c.key, 'label': c.label}).toList()
                    : JobFinderConstants.categories);

            final List<Map<String, String>> educationList =
                (_meta?.education.isNotEmpty == true
                    ? _meta!.education.map((e) => {'key': e.key, 'label': e.label}).toList()
                    : JobFinderConstants.education);

            final List<Map<String, dynamic>> postedList = JobFinderConstants.postedWithinOptions;

            return Container(
              constraints: BoxConstraints(
                maxHeight: MediaQuery.of(context).size.height * 0.88,
              ),
              padding: EdgeInsets.only(
                left: 20,
                right: 20,
                top: 14,
                bottom: MediaQuery.of(context).viewInsets.bottom + 20,
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Center(
                    child: Container(
                      width: 40,
                      height: 4,
                      decoration: BoxDecoration(
                        color: Colors.grey.shade300,
                        borderRadius: BorderRadius.circular(2),
                      ),
                    ),
                  ),
                  const SizedBox(height: 12),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text(
                            'Filter Preferences',
                            style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Color(0xFF111827)),
                          ),
                          if (_activeFiltersCount > 0)
                            Text(
                              '$_activeFiltersCount filter${_activeFiltersCount > 1 ? 's' : ''} active',
                              style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: Color(0xFF2563EB)),
                            ),
                        ],
                      ),
                      Row(
                        children: [
                          if (_activeFiltersCount > 0)
                            TextButton(
                              onPressed: () {
                                setModalState(() {
                                  _selectedState = '';
                                  _selectedCity = '';
                                  _selectedCategory = '';
                                  _selectedEducation = '';
                                  _postedWithin = 30;
                                  _verifiedOnly = false;
                                });
                                setState(() {
                                  _selectedState = '';
                                  _selectedCity = '';
                                  _selectedCategory = '';
                                  _selectedEducation = '';
                                  _postedWithin = 30;
                                  _verifiedOnly = false;
                                });
                              },
                              child: const Text('Reset All', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Color(0xFFEF4444))),
                            ),
                          IconButton(
                            icon: const Icon(Icons.close),
                            onPressed: () => Navigator.pop(context),
                          ),
                        ],
                      ),
                    ],
                  ),
                  const Divider(),
                  const SizedBox(height: 8),

                  Expanded(
                    child: SingleChildScrollView(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          // 1. INDIAN STATE / UT
                          _buildFilterSelectorTile(
                            title: 'INDIAN STATE / UT',
                            value: _selectedState.isEmpty ? 'All States across India' : _selectedState,
                            icon: Icons.location_on_outlined,
                            hasValue: _selectedState.isNotEmpty,
                            onTap: () {
                              _openSearchablePicker<String>(
                                context: context,
                                title: 'Select State / UT',
                                searchHint: 'Search state or UT...',
                                items: ['', ...statesList],
                                labelBuilder: (st) => st.isEmpty ? 'All States across India' : st,
                                selectedValue: _selectedState,
                                onSelected: (val) {
                                  setModalState(() {
                                    _selectedState = val;
                                    _selectedCity = '';
                                  });
                                  setState(() {
                                    _selectedState = val;
                                    _selectedCity = '';
                                  });
                                },
                              );
                            },
                          ),
                          const SizedBox(height: 14),

                          // 2. TARGET CITY
                          _buildFilterSelectorTile(
                            title: 'TARGET CITY',
                            value: _selectedCity.isEmpty ? 'All Cities' : _selectedCity,
                            icon: Icons.location_city_outlined,
                            hasValue: _selectedCity.isNotEmpty,
                            onTap: () {
                              _openSearchablePicker<String>(
                                context: context,
                                title: _selectedState.isNotEmpty ? 'Select City in $_selectedState' : 'Select City',
                                searchHint: 'Search city...',
                                items: ['', ...citiesList],
                                labelBuilder: (ct) => ct.isEmpty ? 'All Cities' : ct,
                                selectedValue: _selectedCity,
                                onSelected: (val) {
                                  setModalState(() => _selectedCity = val);
                                  setState(() => _selectedCity = val);
                                },
                              );
                            },
                          ),
                          const SizedBox(height: 14),

                          // 3. INDUSTRY / CATEGORY
                          _buildFilterSelectorTile(
                            title: 'INDUSTRY / CATEGORY',
                            value: categoriesList.firstWhere(
                              (c) => c['key'] == _selectedCategory,
                              orElse: () => {'label': 'All Categories'},
                            )['label'] ?? 'All Categories',
                            icon: Icons.business_center_outlined,
                            hasValue: _selectedCategory.isNotEmpty,
                            onTap: () {
                              final allCats = [
                                {'key': '', 'label': 'All Categories'},
                                ...categoriesList,
                              ];
                              _openSearchablePicker<Map<String, String>>(
                                context: context,
                                title: 'Select Industry / Category',
                                searchHint: 'Search category...',
                                items: allCats,
                                labelBuilder: (c) => c['label'] ?? '',
                                selectedValue: allCats.firstWhere(
                                  (c) => c['key'] == _selectedCategory,
                                  orElse: () => allCats.first,
                                ),
                                onSelected: (cat) {
                                  final newKey = cat['key'] ?? '';
                                  setModalState(() => _selectedCategory = newKey);
                                  setState(() => _selectedCategory = newKey);
                                },
                              );
                            },
                          ),
                          const SizedBox(height: 14),

                          // 4. MINIMUM QUALIFICATION
                          _buildFilterSelectorTile(
                            title: 'MINIMUM QUALIFICATION',
                            value: educationList.firstWhere(
                              (e) => e['key'] == _selectedEducation,
                              orElse: () => {'label': 'Any Qualification'},
                            )['label'] ?? 'Any Qualification',
                            icon: Icons.school_outlined,
                            hasValue: _selectedEducation.isNotEmpty,
                            onTap: () {
                              final allEdu = [
                                {'key': '', 'label': 'Any Qualification'},
                                ...educationList,
                              ];
                              _openSearchablePicker<Map<String, String>>(
                                context: context,
                                title: 'Select Qualification',
                                searchHint: 'Search qualification...',
                                items: allEdu,
                                labelBuilder: (e) => e['label'] ?? '',
                                selectedValue: allEdu.firstWhere(
                                  (e) => e['key'] == _selectedEducation,
                                  orElse: () => allEdu.first,
                                ),
                                onSelected: (edu) {
                                  final newKey = edu['key'] ?? '';
                                  setModalState(() => _selectedEducation = newKey);
                                  setState(() => _selectedEducation = newKey);
                                },
                              );
                            },
                          ),
                          const SizedBox(height: 16),

                          // 5. RECENCY / POSTED WITHIN
                          const Text(
                            'RECENCY / POSTED WITHIN',
                            style: TextStyle(fontSize: 11, fontWeight: FontWeight.w800, letterSpacing: 0.5, color: Color(0xFF475569)),
                          ),
                          const SizedBox(height: 8),
                          Wrap(
                            spacing: 8,
                            runSpacing: 8,
                            children: postedList.map((p) {
                              final pVal = p['value'] as int;
                              final isSel = _postedWithin == pVal;
                              return ChoiceChip(
                                label: Text(
                                  p['label'] as String,
                                  style: TextStyle(
                                    fontSize: 12,
                                    fontWeight: isSel ? FontWeight.w700 : FontWeight.w500,
                                    color: isSel ? Colors.white : const Color(0xFF334155),
                                  ),
                                ),
                                selected: isSel,
                                selectedColor: const Color(0xFF2563EB),
                                backgroundColor: const Color(0xFFF1F5F9),
                                elevation: 0,
                                pressElevation: 0,
                                side: BorderSide(
                                  color: isSel ? const Color(0xFF2563EB) : Colors.grey.shade300,
                                ),
                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                                onSelected: (sel) {
                                  if (sel) {
                                    setModalState(() => _postedWithin = pVal);
                                    setState(() => _postedWithin = pVal);
                                  }
                                },
                              );
                            }).toList(),
                          ),
                          const SizedBox(height: 16),

                          // 6. Verified Checkbox
                          Container(
                            decoration: BoxDecoration(
                              color: const Color(0xFFF8FAFC),
                              borderRadius: BorderRadius.circular(12),
                              border: Border.all(color: Colors.grey.shade200),
                            ),
                            child: CheckboxListTile(
                              contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 0),
                              title: const Text('Verified jobs only', style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: Color(0xFF1E293B))),
                              subtitle: const Text('Confirmed on official career portal or Google Jobs', style: TextStyle(fontSize: 11, color: Color(0xFF64748B))),
                              value: _verifiedOnly,
                              activeColor: const Color(0xFF2563EB),
                              onChanged: (val) {
                                setModalState(() => _verifiedOnly = val ?? false);
                                setState(() => _verifiedOnly = val ?? false);
                              },
                            ),
                          ),
                          const SizedBox(height: 16),
                        ],
                      ),
                    ),
                  ),

                  // Apply Button
                  SizedBox(
                    width: double.infinity,
                    height: 48,
                    child: ElevatedButton(
                      onPressed: () {
                        Navigator.pop(context);
                        _startSearch();
                      },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF2563EB),
                        foregroundColor: Colors.white,
                        elevation: 0,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      ),
                      child: Text(
                        _activeFiltersCount > 0 ? 'Apply $_activeFiltersCount Filters' : 'Apply Filters',
                        style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
                      ),
                    ),
                  ),
                ],
              ),
            );
          },
        );
      },
    );
  }

  Widget _buildFilterSelectorTile({
    required String title,
    required String value,
    required IconData icon,
    required VoidCallback onTap,
    bool hasValue = false,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          title,
          style: const TextStyle(
            fontSize: 11,
            fontWeight: FontWeight.w800,
            letterSpacing: 0.5,
            color: Color(0xFF475569),
          ),
        ),
        const SizedBox(height: 6),
        InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(12),
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
            decoration: BoxDecoration(
              color: const Color(0xFFF8FAFC),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(
                color: hasValue ? const Color(0xFF2563EB) : Colors.grey.shade200,
                width: hasValue ? 1.5 : 1,
              ),
            ),
            child: Row(
              children: [
                Icon(
                  icon,
                  size: 18,
                  color: hasValue ? const Color(0xFF2563EB) : const Color(0xFF64748B),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: Text(
                    value,
                    style: TextStyle(
                      fontSize: 13,
                      fontWeight: hasValue ? FontWeight.w600 : FontWeight.w500,
                      color: hasValue ? const Color(0xFF0F172A) : const Color(0xFF64748B),
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
                Icon(
                  Icons.keyboard_arrow_down_rounded,
                  size: 20,
                  color: Colors.grey.shade600,
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }

  Future<void> _openSearchablePicker<T>({
    required BuildContext context,
    required String title,
    required String searchHint,
    required List<T> items,
    required String Function(T) labelBuilder,
    required T selectedValue,
    required void Function(T) onSelected,
  }) async {
    String searchQuery = '';

    await showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (pickerCtx) {
        return StatefulBuilder(
          builder: (pickerCtx, setPickerState) {
            final filteredItems = items.where((item) {
              if (searchQuery.trim().isEmpty) return true;
              final label = labelBuilder(item).toLowerCase();
              return label.contains(searchQuery.trim().toLowerCase());
            }).toList();

            return Container(
              constraints: BoxConstraints(
                maxHeight: MediaQuery.of(pickerCtx).size.height * 0.55,
              ),
              padding: EdgeInsets.only(
                left: 18,
                right: 18,
                top: 12,
                bottom: MediaQuery.of(pickerCtx).viewInsets.bottom + 16,
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Center(
                    child: Container(
                      width: 36,
                      height: 4,
                      decoration: BoxDecoration(
                        color: Colors.grey.shade300,
                        borderRadius: BorderRadius.circular(2),
                      ),
                    ),
                  ),
                  const SizedBox(height: 12),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        title,
                        style: const TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                          color: Color(0xFF0F172A),
                        ),
                      ),
                      IconButton(
                        icon: const Icon(Icons.close, size: 20, color: Color(0xFF64748B)),
                        padding: EdgeInsets.zero,
                        constraints: const BoxConstraints(),
                        onPressed: () => Navigator.pop(pickerCtx),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  TextField(
                    autofocus: false,
                    style: const TextStyle(fontSize: 13),
                    decoration: InputDecoration(
                      hintText: searchHint,
                      hintStyle: const TextStyle(fontSize: 13, color: Color(0xFF94A3B8)),
                      prefixIcon: const Icon(Icons.search, size: 20, color: Color(0xFF64748B)),
                      suffixIcon: searchQuery.isNotEmpty
                          ? IconButton(
                              icon: const Icon(Icons.clear, size: 16),
                              onPressed: () => setPickerState(() => searchQuery = ''),
                            )
                          : null,
                      filled: true,
                      fillColor: const Color(0xFFF1F5F9),
                      contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                        borderSide: BorderSide.none,
                      ),
                    ),
                    onChanged: (val) {
                      setPickerState(() => searchQuery = val);
                    },
                  ),
                  const SizedBox(height: 10),
                  Expanded(
                    child: filteredItems.isEmpty
                        ? const Center(
                            child: Padding(
                              padding: EdgeInsets.all(24.0),
                              child: Text(
                                'No matching options found',
                                style: TextStyle(fontSize: 13, color: Color(0xFF94A3B8)),
                              ),
                            ),
                          )
                        : ListView.separated(
                            itemCount: filteredItems.length,
                            separatorBuilder: (_, __) => Divider(height: 1, color: Colors.grey.shade100),
                            itemBuilder: (context, index) {
                              final item = filteredItems[index];
                              final label = labelBuilder(item);
                              final isSelected = item == selectedValue;

                              return InkWell(
                                onTap: () {
                                  Navigator.pop(pickerCtx);
                                  onSelected(item);
                                },
                                borderRadius: BorderRadius.circular(8),
                                child: Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
                                  decoration: BoxDecoration(
                                    color: isSelected ? const Color(0xFFEFF6FF) : Colors.transparent,
                                    borderRadius: BorderRadius.circular(8),
                                  ),
                                  child: Row(
                                    children: [
                                      Expanded(
                                        child: Text(
                                          label,
                                          style: TextStyle(
                                            fontSize: 13,
                                            fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500,
                                            color: isSelected ? const Color(0xFF2563EB) : const Color(0xFF1E293B),
                                          ),
                                        ),
                                      ),
                                      if (isSelected)
                                        const Icon(
                                          Icons.check_circle_rounded,
                                          color: Color(0xFF2563EB),
                                          size: 18,
                                        ),
                                    ],
                                  ),
                                ),
                              );
                            },
                          ),
                  ),
                ],
              ),
            );
          },
        );
      },
    );
  }

  InputDecoration _inputDecoration(String hint) {
    return InputDecoration(
      hintText: hint,
      filled: true,
      fillColor: const Color(0xFFF8FAFC),
      contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: Colors.grey.shade200)),
      enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: Colors.grey.shade200)),
      focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: Color(0xFF2563EB), width: 1.5)),
    );
  }

  @override
  Widget build(BuildContext context) {
    final auth = Provider.of<AuthService>(context);
    final suggestions = _level == 'fresher' ? _fresherSuggestions : _expSuggestions;

    return Scaffold(
      backgroundColor: const Color(0xFFF9FAFB),
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        scrolledUnderElevation: 0,
        automaticallyImplyLeading: true,
        title: Align(
          alignment: Alignment.centerLeft,
          child: Image.asset(
            'assets/images/logo_TSC.png',
            height: 30,
            fit: BoxFit.contain,
          ),
        ),
        actions: [
          Stack(
            alignment: Alignment.center,
            children: [
              IconButton(
                icon: const Icon(Icons.tune, color: Color(0xFF1E293B)),
                onPressed: _openFilterModal,
              ),
              if (_activeFiltersCount > 0)
                Positioned(
                  top: 8,
                  right: 8,
                  child: Container(
                    padding: const EdgeInsets.all(3),
                    decoration: const BoxDecoration(
                      color: Color(0xFF2563EB),
                      shape: BoxShape.circle,
                    ),
                    constraints: const BoxConstraints(minWidth: 16, minHeight: 16),
                    child: Center(
                      child: Text(
                        '$_activeFiltersCount',
                        style: const TextStyle(color: Colors.white, fontSize: 9, fontWeight: FontWeight.bold),
                      ),
                    ),
                  ),
                ),
            ],
          ),
          Padding(
            padding: const EdgeInsets.only(right: 16.0),
            child: CircleAvatar(
              radius: 17,
              backgroundColor: const Color(0xFF2563EB).withOpacity(0.1),
              child: Text(
                auth.userName.isNotEmpty ? auth.userName[0].toUpperCase() : 'S',
                style: const TextStyle(color: Color(0xFF2563EB), fontWeight: FontWeight.bold, fontSize: 14),
              ),
            ),
          ),
        ],
      ),
      body: _loadingMeta
          ? const Center(child: CircularProgressIndicator())
          : Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Top Search & Hero Container
                Container(
                  color: Colors.white,
                  padding: const EdgeInsets.fromLTRB(16, 12, 16, 16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'Market Job Finder',
                        style: TextStyle(
                          fontSize: 24,
                          fontWeight: FontWeight.bold,
                          color: Color(0xFF111827),
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        'Discover verified off-campus opportunities across India with direct apply.',
                        style: TextStyle(fontSize: 13, color: Colors.grey.shade600),
                      ),
                      const SizedBox(height: 14),

                      // Campus & Fresher Openings Badge
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                        decoration: BoxDecoration(
                          color: const Color(0xFFEFF6FF),
                          borderRadius: BorderRadius.circular(10),
                          border: Border.all(color: const Color(0xFFDBEAFE)),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            const Icon(Icons.school, size: 16, color: Color(0xFF1D4ED8)),
                            const SizedBox(width: 8),
                            Text(
                              'Campus & Fresher Openings (0-1 yrs)',
                              style: TextStyle(
                                fontSize: 12,
                                fontWeight: FontWeight.w700,
                                color: Colors.blue.shade900,
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 12),

                      // Search Input
                      Row(
                        children: [
                          Expanded(
                            child: TextField(
                              controller: _promptController,
                              textInputAction: TextInputAction.search,
                              onSubmitted: (_) => _startSearch(),
                              decoration: InputDecoration(
                                hintText: 'Search roles, skills (e.g. React)...',
                                hintStyle: TextStyle(fontSize: 13, color: Colors.grey.shade400),
                                prefixIcon: const Icon(Icons.search, size: 20, color: Colors.grey),
                                suffixIcon: _promptController.text.isNotEmpty
                                    ? IconButton(
                                        icon: const Icon(Icons.clear, size: 18),
                                        onPressed: () {
                                          _promptController.clear();
                                          setState(() {});
                                        },
                                      )
                                    : null,
                                filled: true,
                                fillColor: const Color(0xFFF9FAFB),
                                contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                                border: OutlineInputBorder(
                                  borderRadius: BorderRadius.circular(12),
                                  borderSide: BorderSide(color: Colors.grey.shade200),
                                ),
                                enabledBorder: OutlineInputBorder(
                                  borderRadius: BorderRadius.circular(12),
                                  borderSide: BorderSide(color: Colors.grey.shade200),
                                ),
                              ),
                            ),
                          ),
                          const SizedBox(width: 8),
                          ElevatedButton(
                            onPressed: _searching ? null : _startSearch,
                            style: ElevatedButton.styleFrom(
                              backgroundColor: const Color(0xFF2563EB),
                              foregroundColor: Colors.white,
                              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                            ),
                            child: _searching
                                ? const SizedBox(
                                    width: 16,
                                    height: 16,
                                    child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
                                  )
                                : const Icon(Icons.arrow_forward, size: 18),
                          ),
                        ],
                      ),
                      const SizedBox(height: 10),

                      // Suggestion Chips
                      SingleChildScrollView(
                        scrollDirection: Axis.horizontal,
                        child: Row(
                          children: suggestions.map((sug) {
                            return Padding(
                              padding: const EdgeInsets.only(right: 6.0),
                              child: GestureDetector(
                                onTap: () {
                                  _promptController.text = sug;
                                  _startSearch();
                                },
                                child: Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                                  decoration: BoxDecoration(
                                    color: const Color(0xFFEEF2FF),
                                    borderRadius: BorderRadius.circular(8),
                                    border: Border.all(color: const Color(0xFFE0E7FF)),
                                  ),
                                  child: Text(
                                    sug,
                                    style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: Color(0xFF3730A3)),
                                  ),
                                ),
                              ),
                            );
                          }).toList(),
                        ),
                      ),
                      const SizedBox(height: 10),

                      // Active Filters Bar
                      SingleChildScrollView(
                        scrollDirection: Axis.horizontal,
                        child: Row(
                          children: [
                            GestureDetector(
                              onTap: _openFilterModal,
                              child: Container(
                                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                                decoration: BoxDecoration(
                                  color: _activeFiltersCount > 0 ? const Color(0xFFEFF6FF) : const Color(0xFFF8FAFC),
                                  borderRadius: BorderRadius.circular(8),
                                  border: Border.all(
                                    color: _activeFiltersCount > 0 ? const Color(0xFFBFDBFE) : const Color(0xFFE2E8F0),
                                  ),
                                ),
                                child: Row(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    Icon(Icons.tune, size: 13, color: _activeFiltersCount > 0 ? const Color(0xFF2563EB) : const Color(0xFF475569)),
                                    const SizedBox(width: 5),
                                    Text(
                                      _activeFiltersCount > 0 ? 'Filters ($_activeFiltersCount)' : 'Filters',
                                      style: TextStyle(
                                        fontSize: 11,
                                        fontWeight: FontWeight.bold,
                                        color: _activeFiltersCount > 0 ? const Color(0xFF2563EB) : const Color(0xFF475569),
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ),
                            if (_selectedState.isNotEmpty)
                              _buildActiveFilterChip(
                                label: _selectedState,
                                onClear: () => setState(() {
                                  _selectedState = '';
                                  _selectedCity = '';
                                }),
                              ),
                            if (_selectedCity.isNotEmpty)
                              _buildActiveFilterChip(
                                label: _selectedCity,
                                onClear: () => setState(() => _selectedCity = ''),
                              ),
                            if (_selectedCategory.isNotEmpty)
                              _buildActiveFilterChip(
                                label: _getCategoryLabel(_selectedCategory),
                                onClear: () => setState(() => _selectedCategory = ''),
                              ),
                            if (_selectedEducation.isNotEmpty)
                              _buildActiveFilterChip(
                                label: _getEducationLabel(_selectedEducation),
                                onClear: () => setState(() => _selectedEducation = ''),
                              ),
                            if (_postedWithin != 30)
                              _buildActiveFilterChip(
                                label: _getPostedWithinLabel(_postedWithin),
                                onClear: () => setState(() => _postedWithin = 30),
                              ),
                            if (_verifiedOnly)
                              _buildActiveFilterChip(
                                label: 'Verified',
                                onClear: () => setState(() => _verifiedOnly = false),
                              ),
                            if (_activeFiltersCount > 0)
                              Padding(
                                padding: const EdgeInsets.only(left: 6),
                                child: GestureDetector(
                                  onTap: () => setState(() {
                                    _selectedState = '';
                                    _selectedCity = '';
                                    _selectedCategory = '';
                                    _selectedEducation = '';
                                    _postedWithin = 30;
                                    _verifiedOnly = false;
                                  }),
                                  child: const Text(
                                    'Clear all',
                                    style: TextStyle(fontSize: 11, color: Color(0xFFEF4444), fontWeight: FontWeight.bold),
                                  ),
                                ),
                              ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),

                // Recent Searches Horizontal Bar
                if (_history.isNotEmpty)
                  Container(
                    width: double.infinity,
                    color: const Color(0xFFF8FAFC),
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                    child: SingleChildScrollView(
                      scrollDirection: Axis.horizontal,
                      child: Row(
                        children: [
                          const Text('Recent: ', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Color(0xFF64748B))),
                          ..._history.take(5).map((h) {
                            return Padding(
                              padding: const EdgeInsets.only(right: 6.0),
                              child: InkWell(
                                onTap: () => _fetchSearchResults(h.id),
                                borderRadius: BorderRadius.circular(8),
                                child: Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                  decoration: BoxDecoration(
                                    color: Colors.white,
                                    borderRadius: BorderRadius.circular(8),
                                    border: Border.all(color: Colors.grey.shade300),
                                  ),
                                  child: Text(
                                    h.prompt.isNotEmpty ? h.prompt : (h.query.isNotEmpty ? h.query : 'Search'),
                                    style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: Color(0xFF334155)),
                                  ),
                                ),
                              ),
                            );
                          }),
                        ],
                      ),
                    ),
                  ),

                // Header Results Count
                if (_currentSearch != null)
                  Padding(
                    padding: const EdgeInsets.fromLTRB(16, 12, 16, 4),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          '${_jobs.length} Openings Found',
                          style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: Color(0xFF1E293B)),
                        ),
                        if (_searching)
                          const Row(
                            children: [
                              SizedBox(width: 12, height: 12, child: CircularProgressIndicator(strokeWidth: 2)),
                              SizedBox(width: 6),
                              Text('Gathering live feeds...', style: TextStyle(fontSize: 11, color: Color(0xFF2563EB), fontWeight: FontWeight.bold)),
                            ],
                          ),
                      ],
                    ),
                  ),

                // Job Cards List
                Expanded(
                  child: _searching && _jobs.isEmpty
                      ? const Center(
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              CircularProgressIndicator(),
                              SizedBox(height: 16),
                              Text('Crawling live job feeds across India...'),
                            ],
                          ),
                        )
                      : _jobs.isEmpty
                          ? Center(
                              child: Column(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  Icon(Icons.work_outline, size: 48, color: Colors.grey.shade400),
                                  const SizedBox(height: 12),
                                  Text(
                                    'No market jobs found',
                                    style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.grey.shade700),
                                  ),
                                  const SizedBox(height: 4),
                                  Text(
                                    'Try another job role or remove filters.',
                                    style: TextStyle(fontSize: 12, color: Colors.grey.shade500),
                                  ),
                                ],
                              ),
                            )
                          : ListView.builder(
                              padding: const EdgeInsets.all(16),
                              itemCount: _jobs.length,
                              itemBuilder: (context, index) {
                                final job = _jobs[index];
                                return _jobCard(job);
                              },
                            ),
                ),
              ],
            ),
    );
  }

  Widget _levelToggle(String key, String label) {
    final isSelected = _level == key;
    return GestureDetector(
      onTap: () => setState(() => _level = key),
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 8),
        alignment: Alignment.center,
        decoration: BoxDecoration(
          color: isSelected ? Colors.white : Colors.transparent,
          borderRadius: BorderRadius.circular(10),
          boxShadow: isSelected
              ? [BoxShadow(color: Colors.black.withOpacity(0.04), blurRadius: 4, offset: const Offset(0, 1))]
              : null,
        ),
        child: Text(
          label,
          style: TextStyle(
            fontSize: 12,
            fontWeight: FontWeight.bold,
            color: isSelected ? const Color(0xFF2563EB) : const Color(0xFF64748B),
          ),
        ),
      ),
    );
  }

  Widget _jobCard(MarketJob job) {
    return Container(
      margin: const EdgeInsets.only(bottom: 14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.grey.shade200),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.02),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: InkWell(
        borderRadius: BorderRadius.circular(16),
        onTap: () {
          Navigator.push(
            context,
            MaterialPageRoute(
              builder: (context) => MarketJobDetailScreen(job: job),
            ),
          );
        },
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Top Badges Row
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                    decoration: BoxDecoration(
                      color: const Color(0xFFEEF2FF),
                      borderRadius: BorderRadius.circular(6),
                    ),
                    child: Text(
                      job.platform.isNotEmpty ? job.platform : 'Direct',
                      style: const TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Color(0xFF4F46E5)),
                    ),
                  ),
                  const SizedBox(width: 6),
                  if (job.verified)
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                      decoration: BoxDecoration(
                        color: const Color(0xFFECFDF5),
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: const Row(
                        children: [
                          Icon(Icons.verified, size: 10, color: Color(0xFF059669)),
                          SizedBox(width: 3),
                          Text('Verified', style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Color(0xFF059669))),
                        ],
                      ),
                    ),
                  const Spacer(),
                  Text(
                    job.postedText.isNotEmpty ? job.postedText : 'Recent',
                    style: TextStyle(fontSize: 11, color: Colors.grey.shade500, fontWeight: FontWeight.w500),
                  ),
                ],
              ),
              const SizedBox(height: 10),

              // Title & Company
              Text(
                job.title,
                style: const TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: Color(0xFF0F172A)),
              ),
              const SizedBox(height: 2),
              Text(
                job.companyName.isNotEmpty ? job.companyName : 'Confidential Company',
                style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: Colors.grey.shade700),
              ),
              const SizedBox(height: 10),

              // Chips: Location & Salary
              Row(
                children: [
                  Icon(Icons.location_on_outlined, size: 14, color: Colors.grey.shade500),
                  const SizedBox(width: 4),
                  Expanded(
                    child: Text(
                      job.location.isNotEmpty ? job.location : 'India',
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: TextStyle(fontSize: 12, color: Colors.grey.shade600, fontWeight: FontWeight.w500),
                    ),
                  ),
                  if (job.salary.isNotEmpty) ...[
                    const SizedBox(width: 8),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                      decoration: BoxDecoration(
                        color: const Color(0xFFF0FDF4),
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: Text(
                        job.salary,
                        style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Color(0xFF16A34A)),
                      ),
                    ),
                  ],
                ],
              ),
              const SizedBox(height: 14),

              // Action Buttons
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton(
                      onPressed: () {
                        Navigator.push(
                          context,
                          MaterialPageRoute(
                            builder: (context) => MarketJobDetailScreen(job: job),
                          ),
                        );
                      },
                      style: OutlinedButton.styleFrom(
                        padding: const EdgeInsets.symmetric(vertical: 9),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                        side: BorderSide(color: Colors.grey.shade300),
                      ),
                      child: const Text('Details', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Color(0xFF334155))),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: ElevatedButton.icon(
                      onPressed: () => _handleDirectApply(job),
                      icon: const Icon(Icons.open_in_new, size: 13),
                      label: const Text('Apply Direct', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF2563EB),
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(vertical: 9),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                        elevation: 0,
                      ),
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
