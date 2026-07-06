import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:flutter_colorpicker/flutter_colorpicker.dart';
import '../services/api_service.dart';
import '../services/resume_service.dart';

class ResumeBuilderScreen extends StatefulWidget {
  const ResumeBuilderScreen({super.key});

  @override
  State<ResumeBuilderScreen> createState() => _ResumeBuilderScreenState();
}

class _ResumeBuilderScreenState extends State<ResumeBuilderScreen> {
  late ResumeService _resumeService;
  bool _isLoading = true;
  bool _hasSubscription = false;
  List<dynamic> _templates = [];
  Map<String, dynamic> _resumeData = {
    'punch_line': '',
    'education': [],
    'experience': [],
    'projects': [],
    'skills': [],
    'certifications': [],
    'languages': [],
    'chosen_summary': '',
    'selected_template_id': '',
    'font_family': 'Inter',
    'color_theme': '#3730a3',
    'page_margin': 'medium',
    'layout_columns': 'two_column_left',
  };

  bool _isGeneratingSummary = false;
  List<dynamic> _aiSummaries = [];
  bool _isCompiling = false;

  final _skillCtrl = TextEditingController();
  final _certCtrl = TextEditingController();
  final _langCtrl = TextEditingController();

  Map<String, dynamic> _eduInput = {};
  Map<String, dynamic> _expInput = {};
  Map<String, dynamic> _projInput = {};

  @override
  void initState() {
    super.initState();
    _resumeService = ResumeService(context.read<ApiService>());
    _loadData();
  }

  Future<void> _loadData() async {
    setState(() => _isLoading = true);
    try {
      final subRes = await _resumeService.checkSubscription();
      _hasSubscription = subRes['hasSubscription'] ?? false;

      final tempRes = await _resumeService.getTemplates();
      _templates = tempRes['templates'] ?? [];

      try {
        final resumeRes = await _resumeService.getResume();
        if (resumeRes['resume'] != null) {
          final resData = resumeRes['resume'];
          _resumeData = {
            'punch_line': resData['punch_line'] ?? '',
            'education': resData['education'] ?? [],
            'experience': resData['experience'] ?? [],
            'projects': resData['projects'] ?? [],
            'skills': resData['skills'] ?? [],
            'certifications': resData['certifications'] ?? [],
            'languages': resData['languages'] ?? [],
            'chosen_summary': resData['chosen_summary'] ?? '',
            'selected_template_id': resData['selected_template_id'] ?? '',
            'font_family': resData['font_family'] ?? 'Inter',
            'color_theme': resData['color_theme'] ?? '#3730a3',
            'page_margin': resData['page_margin'] ?? 'medium',
            'layout_columns': resData['layout_columns'] ?? 'two_column_left',
          };
          _aiSummaries = resData['ai_summaries'] ?? [];
        }
      } catch (e) {
        // Resume might not exist yet
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error loading data: $e')));
      }
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  Future<void> _saveResume() async {
    try {
      final payload = Map<String, dynamic>.from(_resumeData);
      if (payload['selected_template_id'] == null || payload['selected_template_id'].toString().isEmpty) {
        payload.remove('selected_template_id');
      }

      final res = await _resumeService.saveResume(payload);
      if (res['resume'] != null) {
        setState(() {
          final resData = res['resume'];
          _resumeData = {
            'punch_line': resData['punch_line'] ?? '',
            'education': resData['education'] ?? [],
            'experience': resData['experience'] ?? [],
            'projects': resData['projects'] ?? [],
            'skills': resData['skills'] ?? [],
            'certifications': resData['certifications'] ?? [],
            'languages': resData['languages'] ?? [],
            'chosen_summary': resData['chosen_summary'] ?? '',
            'selected_template_id': resData['selected_template_id'] ?? '',
            'font_family': resData['font_family'] ?? 'Inter',
            'color_theme': resData['color_theme'] ?? '#3730a3',
            'page_margin': resData['page_margin'] ?? 'medium',
            'layout_columns': resData['layout_columns'] ?? 'two_column_left',
          };
        });
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error saving: $e')));
      }
    }
  }

  Future<void> _saveAndCompileResume() async {
    final payload = Map<String, dynamic>.from(_resumeData);
    if (payload['selected_template_id'] == null || payload['selected_template_id'].toString().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Please select a template from Design Settings first!', style: TextStyle(fontSize: 13)), backgroundColor: Colors.orange));
      return;
    }

    setState(() => _isCompiling = true);
    try {
      final saveRes = await _resumeService.saveResume(payload);
      if (saveRes['resume'] != null) {
        setState(() {
          final resData = saveRes['resume'];
          _resumeData = {
            'punch_line': resData['punch_line'] ?? '',
            'education': resData['education'] ?? [],
            'experience': resData['experience'] ?? [],
            'projects': resData['projects'] ?? [],
            'skills': resData['skills'] ?? [],
            'certifications': resData['certifications'] ?? [],
            'languages': resData['languages'] ?? [],
            'chosen_summary': resData['chosen_summary'] ?? '',
            'selected_template_id': resData['selected_template_id'] ?? '',
            'font_family': resData['font_family'] ?? 'Inter',
            'color_theme': resData['color_theme'] ?? '#3730a3',
            'page_margin': resData['page_margin'] ?? 'medium',
            'layout_columns': resData['layout_columns'] ?? 'two_column_left',
          };
         });
      }

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Saving and compiling CV...', style: TextStyle(fontSize: 13)), duration: Duration(seconds: 2)));
      }

      final compileRes = await _resumeService.compileResume();
      if (compileRes['resume'] != null) {
        setState(() {
          final resData = compileRes['resume'];
          _resumeData = {
            'punch_line': resData['punch_line'] ?? '',
            'education': resData['education'] ?? [],
            'experience': resData['experience'] ?? [],
            'projects': resData['projects'] ?? [],
            'skills': resData['skills'] ?? [],
            'certifications': resData['certifications'] ?? [],
            'languages': resData['languages'] ?? [],
            'chosen_summary': resData['chosen_summary'] ?? '',
            'selected_template_id': resData['selected_template_id'] ?? '',
            'font_family': resData['font_family'] ?? 'Inter',
            'color_theme': resData['color_theme'] ?? '#3730a3',
            'page_margin': resData['page_margin'] ?? 'medium',
            'layout_columns': resData['layout_columns'] ?? 'two_column_left',
          };
        });
      }

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('✨ CV Compiled & Saved to Profile successfully!', style: TextStyle(fontSize: 13)), backgroundColor: Colors.green, behavior: SnackBarBehavior.floating));
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text("Error compiling: ${e.toString().replaceAll('Exception: ', '')}", style: const TextStyle(fontSize: 13)), backgroundColor: Colors.red, behavior: SnackBarBehavior.floating));
      }
    } finally {
      if (mounted) {
        setState(() => _isCompiling = false);
      }
    }
  }

  Future<void> _generateAiSummaries() async {
    if ((_resumeData['skills'] as List).isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Please add some skills first!', style: TextStyle(fontSize: 13))));
      return;
    }
    setState(() => _isGeneratingSummary = true);
    try {
      final res = await _resumeService.generateAiSummaries({
        'skills': _resumeData['skills'],
        'projects': _resumeData['projects'],
        'education': _resumeData['education'],
        'punch_line': _resumeData['punch_line'],
      });
      setState(() {
        _aiSummaries = res['summaries'] ?? [];
      });
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('AI Summaries generated!', style: TextStyle(fontSize: 13))));
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error generating summaries: $e', style: const TextStyle(fontSize: 13))));
      }
    } finally {
      if (mounted) {
        setState(() => _isGeneratingSummary = false);
      }
    }
  }

  void _addSkill() {
    if (_skillCtrl.text.trim().isNotEmpty && (_resumeData['skills'] as List).length < 10) {
      setState(() {
        (_resumeData['skills'] as List).add(_skillCtrl.text.trim());
        _skillCtrl.clear();
      });
    }
  }

  void _addCert() {
    if (_certCtrl.text.trim().isNotEmpty && (_resumeData['certifications'] as List).length < 5) {
      setState(() {
        (_resumeData['certifications'] as List).add(_certCtrl.text.trim());
        _certCtrl.clear();
      });
    }
  }

  void _addLang() {
    if (_langCtrl.text.trim().isNotEmpty && (_resumeData['languages'] as List).length < 5) {
      setState(() {
        (_resumeData['languages'] as List).add(_langCtrl.text.trim());
        _langCtrl.clear();
      });
    }
  }

  void _addEducation() {
    if (_eduInput['institution'] != null && _eduInput['degree'] != null) {
      setState(() {
        (_resumeData['education'] as List).add(Map.from(_eduInput));
        _eduInput.clear();
      });
    }
  }

  void _addExperience() {
    if (_expInput['company'] != null && _expInput['role'] != null) {
      setState(() {
        (_resumeData['experience'] as List).add(Map.from(_expInput));
        _expInput.clear();
      });
    }
  }

  void _addProject() {
    if (_projInput['title'] != null && _projInput['description'] != null) {
      setState(() {
        Map<String, dynamic> proj = Map.from(_projInput);
        if (proj['technologies'] != null && proj['technologies'] is String) {
          proj['technologies'] = (proj['technologies'] as String).split(',').map((e) => e.trim()).where((e) => e.isNotEmpty).toList();
        } else {
          proj['technologies'] = [];
        }
        (_resumeData['projects'] as List).add(proj);
        _projInput.clear();
      });
    }
  }

  void _showColorPicker() {
    String tempHex = _resumeData['color_theme'] ?? '#3730a3';
    Color currentColor;
    try {
      currentColor = Color(int.parse(tempHex.replaceFirst('#', '0xFF')));
    } catch (e) {
      currentColor = const Color(0xFF3730A3);
    }
    
    showDialog(
      context: context,
      builder: (ctx) {
        Color pickerColor = currentColor;
        return AlertDialog(
          backgroundColor: Colors.white,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
          title: const Text('Custom Color Theme', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15, color: Color(0xFF1E293B))),
          content: SingleChildScrollView(
            child: ColorPicker(
              pickerColor: pickerColor,
              onColorChanged: (Color color) {
                pickerColor = color;
              },
              pickerAreaHeightPercent: 0.7,
              enableAlpha: false,
              displayThumbColor: true,
              hexInputBar: true,
            ),
          ),
          actionsPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(ctx),
              child: const Text('Cancel', style: TextStyle(color: Colors.grey, fontSize: 13, fontWeight: FontWeight.bold)),
            ),
            ElevatedButton(
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF2563EB),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
                elevation: 0,
              ),
              onPressed: () {
                final hexString = '#${pickerColor.value.toRadixString(16).padLeft(8, '0').substring(2).toUpperCase()}';
                setState(() => _resumeData['color_theme'] = hexString);
                Navigator.pop(ctx);
              },
              child: const Text('Apply', style: TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.bold)),
            ),
          ],
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Scaffold(backgroundColor: Color(0xFFF8FAFC), body: Center(child: CircularProgressIndicator(strokeWidth: 2)));
    }

    if (!_hasSubscription) {
      return Scaffold(
        backgroundColor: const Color(0xFFF8FAFC),
        appBar: AppBar(title: const Text('Resume Studio', style: TextStyle(fontSize: 16))),
        body: Center(
          child: Padding(
            padding: const EdgeInsets.all(24.0),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Icon(Icons.lock_outline, size: 48, color: Colors.indigo),
                const SizedBox(height: 16),
                const Text('Premium Feature', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                const SizedBox(height: 8),
                const Text('Unlock the Premium CV Builder by upgrading your membership.', textAlign: TextAlign.center, style: TextStyle(fontSize: 13, color: Colors.grey)),
                const SizedBox(height: 24),
                ElevatedButton(
                  onPressed: () => Navigator.pushNamed(context, '/plans'),
                  style: ElevatedButton.styleFrom(
                    elevation: 0,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                    padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                  ),
                  child: const Text('View Subscription Plans', style: TextStyle(fontSize: 13)),
                )
              ],
            ),
          ),
        ),
      );
    }

    return DefaultTabController(
      length: 6,
      child: Scaffold(
        backgroundColor: const Color(0xFFF8FAFC),
        appBar: AppBar(
          title: const Text('Resume Studio', style: TextStyle(fontWeight: FontWeight.bold, color: Color(0xFF1E293B), fontSize: 16)),
          backgroundColor: Colors.white,
          elevation: 0,
          scrolledUnderElevation: 0,
          iconTheme: const IconThemeData(color: Color(0xFF1E293B)),
          bottom: PreferredSize(
            preferredSize: const Size.fromHeight(40),
            child: Container(
              height: 40,
              decoration: BoxDecoration(
                color: Colors.white,
                border: Border(bottom: BorderSide(color: Colors.grey.shade200, width: 1)),
              ),
              child: TabBar(
                isScrollable: true,
                dividerColor: Colors.transparent,
                labelColor: const Color(0xFF2563EB),
                unselectedLabelColor: Colors.grey.shade600,
                labelStyle: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold),
                unselectedLabelStyle: const TextStyle(fontSize: 12, fontWeight: FontWeight.w500),
                indicator: const UnderlineTabIndicator(
                  borderSide: BorderSide(color: Color(0xFF2563EB), width: 2),
                  insets: EdgeInsets.symmetric(horizontal: 16),
                ),
                indicatorSize: TabBarIndicatorSize.tab,
                labelPadding: const EdgeInsets.symmetric(horizontal: 16),
                tabs: const [
                  Tab(text: 'Profile'),
                  Tab(text: 'Education'),
                  Tab(text: 'Experience'),
                  Tab(text: 'Projects'),
                  Tab(text: 'Skills'),
                  Tab(text: 'Design'),
                ],
              ),
            ),
          ),
          actions: [
            Padding(
              padding: const EdgeInsets.only(right: 12),
              child: TextButton.icon(
                icon: const Icon(Icons.remove_red_eye_outlined, size: 16, color: Color(0xFF2563EB)),
                label: const Text('Preview', style: TextStyle(fontSize: 12, color: Color(0xFF2563EB), fontWeight: FontWeight.bold)),
                onPressed: () async {
                  await _saveResume();
                  if (mounted) {
                    Navigator.pushNamed(context, '/resume-preview');
                  }
                },
              ),
            )
          ],
        ),
        body: SafeArea(
          child: TabBarView(
            children: [
              _buildProfileTab(),
              _buildEducationTab(),
              _buildExperienceTab(),
              _buildProjectsTab(),
              _buildTagsTab(),
              _buildDesignTab(),
            ],
          ),
        ),
        floatingActionButton: FloatingActionButton.extended(
          onPressed: _isCompiling ? null : _saveAndCompileResume,
          backgroundColor: const Color(0xFF2563EB),
          elevation: 2,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
          icon: _isCompiling 
            ? const SizedBox(width: 14, height: 14, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
            : const Icon(Icons.auto_awesome_mosaic, color: Colors.white, size: 16),
          label: const Text('Compile', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 13)),
        ),
      ),
    );
  }

  // --- TAB WIDGETS ---

  Widget _buildProfileTab() {
    return ListView(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 80),
      children: [
        _buildSectionHeader('Professional Identity', Icons.person_outline),
        const SizedBox(height: 12),
        _buildCard(
          child: Padding(
            padding: const EdgeInsets.all(12),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _buildInput('Job Title / Punch line', (v) => _resumeData['punch_line'] = v, initialValue: _resumeData['punch_line']),
              ],
            ),
          ),
        ),
        const SizedBox(height: 24),
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            _buildSectionHeader('Summary', Icons.description_outlined),
            SizedBox(
              height: 28,
              child: TextButton.icon(
                onPressed: _isGeneratingSummary ? null : _generateAiSummaries,
                icon: _isGeneratingSummary
                    ? const SizedBox(width: 12, height: 12, child: CircularProgressIndicator(strokeWidth: 2, color: Color(0xFF2563EB)))
                    : const Icon(Icons.auto_awesome, size: 14, color: Color(0xFF2563EB)),
                label: const Text('AI Generate', style: TextStyle(color: Color(0xFF2563EB), fontSize: 12, fontWeight: FontWeight.bold)),
                style: TextButton.styleFrom(
                  padding: const EdgeInsets.symmetric(horizontal: 12),
                  backgroundColor: const Color(0xFF2563EB).withOpacity(0.05),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(6)),
                ),
              ),
            )
          ],
        ),
        const SizedBox(height: 12),
        if (_aiSummaries.isNotEmpty) ...[
          Container(
            height: 140,
            decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(8), border: Border.all(color: Colors.grey.shade200)),
            child: ListView.separated(
              padding: const EdgeInsets.all(4),
              itemCount: _aiSummaries.length,
              separatorBuilder: (c, i) => Divider(color: Colors.grey.shade100, height: 1),
              itemBuilder: (context, idx) {
                final sum = _aiSummaries[idx];
                final isSelected = _resumeData['chosen_summary'] == sum;
                return ListTile(
                  dense: true,
                  contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(6)),
                  title: Text('Option ${idx + 1}', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12, color: isSelected ? const Color(0xFF2563EB) : Colors.grey.shade800)),
                  subtitle: Text(sum.toString(), maxLines: 2, overflow: TextOverflow.ellipsis, style: TextStyle(fontSize: 11, color: Colors.grey.shade600)),
                  selected: isSelected,
                  selectedTileColor: const Color(0xFF2563EB).withOpacity(0.05),
                  onTap: () => setState(() => _resumeData['chosen_summary'] = sum),
                  trailing: isSelected ? const Icon(Icons.check_circle, color: Color(0xFF2563EB), size: 16) : null,
                );
              },
            ),
          ),
          const SizedBox(height: 12),
        ],
        _buildCard(
          child: Padding(
            padding: const EdgeInsets.all(4),
            child: TextFormField(
              initialValue: _resumeData['chosen_summary'] ?? '',
              key: Key(_resumeData['chosen_summary']),
              style: TextStyle(fontSize: 13, height: 1.5, color: Colors.grey.shade800),
              decoration: InputDecoration(
                hintText: 'Write your professional summary here...',
                hintStyle: TextStyle(color: Colors.grey.shade400, fontSize: 13),
                border: InputBorder.none,
                contentPadding: const EdgeInsets.all(12),
              ),
              maxLines: 5,
              onChanged: (v) => _resumeData['chosen_summary'] = v,
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildEducationTab() {
    final eduList = _resumeData['education'] as List;
    return ListView(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 80),
      children: [
        _buildSectionHeader('Education History', Icons.school_outlined),
        const SizedBox(height: 12),
        if (eduList.isNotEmpty)
          ...eduList.asMap().entries.map((e) {
            final idx = e.key;
            final item = e.value;
            return _buildItemCard(
              title: item['institution'] ?? '',
              subtitle: "${item['degree']} in ${item['fieldOfStudy']}",
              trailingText: "${item['startYear']} - ${item['endYear']}",
              onDelete: () => setState(() => eduList.removeAt(idx)),
            );
          }),
        const SizedBox(height: 8),
        _buildCard(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('Add New Education', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14, color: Color(0xFF1E293B))),
                const SizedBox(height: 12),
                Row(
                  children: [
                    Expanded(child: _buildInput('Degree', (v) => _eduInput['degree'] = v)),
                    const SizedBox(width: 8),
                    Expanded(child: _buildInput('Field of Study', (v) => _eduInput['fieldOfStudy'] = v)),
                  ],
                ),
                const SizedBox(height: 10),
                _buildInput('Institution', (v) => _eduInput['institution'] = v),
                const SizedBox(height: 10),
                Row(
                  children: [
                    Expanded(child: _buildInput('Start', (v) => _eduInput['startYear'] = v)),
                    const SizedBox(width: 8),
                    Expanded(child: _buildInput('End', (v) => _eduInput['endYear'] = v)),
                    const SizedBox(width: 8),
                    Expanded(child: _buildInput('Score', (v) => _eduInput['score'] = v)),
                  ],
                ),
                const SizedBox(height: 16),
                _buildAddButton('Add Education', _addEducation),
              ],
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildExperienceTab() {
    final expList = _resumeData['experience'] as List;
    return ListView(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 80),
      children: [
        _buildSectionHeader('Work Experience', Icons.work_outline),
        const SizedBox(height: 12),
        if (expList.isNotEmpty)
          ...expList.asMap().entries.map((e) {
            final idx = e.key;
            final item = e.value;
            return _buildItemCard(
              title: item['role'] ?? '',
              subtitle: item['company'] ?? '',
              trailingText: "${item['startDate']} - ${item['endDate']}",
              onDelete: () => setState(() => expList.removeAt(idx)),
            );
          }),
        const SizedBox(height: 8),
        _buildCard(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('Add New Experience', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14, color: Color(0xFF1E293B))),
                const SizedBox(height: 12),
                Row(
                  children: [
                    Expanded(child: _buildInput('Company', (v) => _expInput['company'] = v)),
                    const SizedBox(width: 8),
                    Expanded(child: _buildInput('Role', (v) => _expInput['role'] = v)),
                  ],
                ),
                const SizedBox(height: 10),
                Row(
                  children: [
                    Expanded(child: _buildInput('Start Date', (v) => _expInput['startDate'] = v)),
                    const SizedBox(width: 8),
                    Expanded(child: _buildInput('End Date', (v) => _expInput['endDate'] = v)),
                  ],
                ),
                const SizedBox(height: 10),
                _buildInput('Description', (v) => _expInput['description'] = v, maxLines: 3),
                const SizedBox(height: 16),
                _buildAddButton('Add Experience', _addExperience),
              ],
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildProjectsTab() {
    final projList = _resumeData['projects'] as List;
    return ListView(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 80),
      children: [
        _buildSectionHeader('Projects', Icons.rocket_launch_outlined),
        const SizedBox(height: 12),
        if (projList.isNotEmpty)
          ...projList.asMap().entries.map((e) {
            final idx = e.key;
            final item = e.value;
            return _buildItemCard(
              title: item['title'] ?? '',
              subtitle: item['description'] ?? '',
              trailingText: "",
              onDelete: () => setState(() => projList.removeAt(idx)),
            );
          }),
        const SizedBox(height: 8),
        _buildCard(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('Add New Project', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14, color: Color(0xFF1E293B))),
                const SizedBox(height: 12),
                _buildInput('Project Title', (v) => _projInput['title'] = v),
                const SizedBox(height: 10),
                _buildInput('Technologies (comma separated)', (v) => _projInput['technologies'] = v),
                const SizedBox(height: 10),
                _buildInput('Project URL', (v) => _projInput['link'] = v),
                const SizedBox(height: 10),
                _buildInput('Description', (v) => _projInput['description'] = v, maxLines: 3),
                const SizedBox(height: 16),
                _buildAddButton('Add Project', _addProject),
              ],
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildTagsTab() {
    final skillList = _resumeData['skills'] as List;
    final certList = _resumeData['certifications'] as List;
    final langList = _resumeData['languages'] as List;

    return ListView(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 80),
      children: [
        _buildSectionHeader('Skills & Abilities', Icons.stars_outlined),
        const SizedBox(height: 12),
        _buildCard(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('Skills', style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: Color(0xFF1E293B))),
                const SizedBox(height: 10),
                Row(
                  children: [
                    Expanded(child: _buildInputCtrl(_skillCtrl, 'e.g. Flutter', (_) => _addSkill())),
                    const SizedBox(width: 8),
                    _buildSmallAddIcon(_addSkill, const Color(0xFF2563EB)),
                  ],
                ),
                if (skillList.isNotEmpty) const SizedBox(height: 12),
                Wrap(
                  spacing: 6,
                  runSpacing: 6,
                  children: skillList.map((s) => _buildMiniChip(s.toString(), const Color(0xFF2563EB), () => setState(() => skillList.remove(s)))).toList(),
                ),
              ],
            ),
          ),
        ),
        
        const SizedBox(height: 12),
        _buildCard(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('Certifications', style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: Color(0xFF1E293B))),
                const SizedBox(height: 10),
                Row(
                  children: [
                    Expanded(child: _buildInputCtrl(_certCtrl, 'Add certification', (_) => _addCert())),
                    const SizedBox(width: 8),
                    _buildSmallAddIcon(_addCert, const Color(0xFF10B981)),
                  ],
                ),
                if (certList.isNotEmpty) const SizedBox(height: 12),
                Wrap(
                  spacing: 6,
                  runSpacing: 6,
                  children: certList.map((c) => _buildMiniChip(c.toString(), const Color(0xFF10B981), () => setState(() => certList.remove(c)))).toList(),
                ),
              ],
            ),
          ),
        ),

        const SizedBox(height: 12),
        _buildCard(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('Languages', style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: Color(0xFF1E293B))),
                const SizedBox(height: 10),
                Row(
                  children: [
                    Expanded(child: _buildInputCtrl(_langCtrl, 'Add language', (_) => _addLang())),
                    const SizedBox(width: 8),
                    _buildSmallAddIcon(_addLang, const Color(0xFF8B5CF6)),
                  ],
                ),
                if (langList.isNotEmpty) const SizedBox(height: 12),
                Wrap(
                  spacing: 6,
                  runSpacing: 6,
                  children: langList.map((l) => _buildMiniChip(l.toString(), const Color(0xFF8B5CF6), () => setState(() => langList.remove(l)))).toList(),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildDesignTab() {
    return ListView(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 80),
      children: [
        _buildSectionHeader('Visual Aesthetics', Icons.palette_outlined),
        const SizedBox(height: 12),
        _buildCard(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('Template Selection', style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: Color(0xFF1E293B))),
                const SizedBox(height: 12),
                SizedBox(
                  height: 160,
                  child: _templates.isEmpty 
                    ? Center(child: Text('Loading templates...', style: TextStyle(color: Colors.grey.shade500, fontSize: 12)))
                    : ListView.builder(
                        scrollDirection: Axis.horizontal,
                        itemCount: _templates.length,
                        itemBuilder: (context, index) {
                          final t = _templates[index];
                          final isSelected = _resumeData['selected_template_id'] == t['_id'];
                          return GestureDetector(
                            onTap: () {
                              setState(() => _resumeData['selected_template_id'] = t['_id']);
                              _saveResume();
                            },
                            child: AnimatedContainer(
                              duration: const Duration(milliseconds: 200),
                              width: 110,
                              margin: const EdgeInsets.only(right: 12, bottom: 4, top: 4),
                              decoration: BoxDecoration(
                                color: Colors.white,
                                borderRadius: BorderRadius.circular(8),
                                border: Border.all(color: isSelected ? const Color(0xFF2563EB) : Colors.grey.shade200, width: isSelected ? 2 : 1),
                                boxShadow: isSelected 
                                  ? [BoxShadow(color: const Color(0xFF2563EB).withOpacity(0.2), blurRadius: 6, offset: const Offset(0, 2))] 
                                  : [BoxShadow(color: Colors.black.withOpacity(0.02), blurRadius: 4, offset: const Offset(0, 1))],
                              ),
                              child: ClipRRect(
                                borderRadius: BorderRadius.circular(6),
                                child: Column(
                                  children: [
                                    Expanded(
                                      child: t['thumbnail'] != null
                                          ? Image.network(t['thumbnail'], fit: BoxFit.cover, width: double.infinity)
                                          : Container(color: Colors.grey.shade50, child: const Icon(Icons.description_outlined, size: 24, color: Colors.grey)),
                                    ),
                                    Container(
                                      padding: const EdgeInsets.symmetric(vertical: 6, horizontal: 4),
                                      color: isSelected ? const Color(0xFF2563EB) : Colors.white,
                                      width: double.infinity,
                                      child: Text(t['name'] ?? 'Template', textAlign: TextAlign.center, maxLines: 1, overflow: TextOverflow.ellipsis, style: TextStyle(fontSize: 11, color: isSelected ? Colors.white : Colors.grey.shade800, fontWeight: isSelected ? FontWeight.bold : FontWeight.w500)),
                                    ),
                                  ],
                                ),
                              ),
                            ),
                          );
                        },
                      ),
                ),
              ],
            ),
          ),
        ),
        
        const SizedBox(height: 12),
        _buildCard(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('Color Theme', style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: Color(0xFF1E293B))),
                const SizedBox(height: 12),
                Wrap(
                  spacing: 12,
                  runSpacing: 12,
                  children: [
                    _buildColorSwatch('#3730a3', 'Indigo'),
                    _buildColorSwatch('#0ea5e9', 'Sky'),
                    _buildColorSwatch('#10b981', 'Emerald'),
                    _buildColorSwatch('#f43f5e', 'Rose'),
                    _buildColorSwatch('#1e293b', 'Slate'),
                    
                    // Custom Color Picker Button
                    GestureDetector(
                      onTap: _showColorPicker,
                      child: Column(
                        children: [
                          Container(
                            width: 36,
                            height: 36,
                            decoration: BoxDecoration(
                              gradient: const SweepGradient(
                                colors: [Colors.red, Colors.yellow, Colors.green, Colors.blue, Colors.purple, Colors.red],
                              ),
                              shape: BoxShape.circle,
                              border: Border.all(color: Colors.white, width: 2),
                              boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 4, offset: const Offset(0, 2))],
                            ),
                            child: const Icon(Icons.colorize, color: Colors.white, size: 16),
                          ),
                          const SizedBox(height: 4),
                          const Text('Custom', style: TextStyle(fontSize: 10, color: Colors.grey, fontWeight: FontWeight.w600)),
                        ],
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),

        const SizedBox(height: 12),
        _buildCard(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('Typography', style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: Color(0xFF1E293B))),
                const SizedBox(height: 12),
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: ['Inter', 'Outfit', 'Playfair Display', 'Roboto']
                      .map((font) => _buildFontChip(font))
                      .toList(),
                ),
              ],
            ),
          ),
        ),

        const SizedBox(height: 12),
        _buildCard(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('Page Margin', style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: Color(0xFF1E293B))),
                const SizedBox(height: 12),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                  children: ['small', 'medium', 'large']
                      .map((m) => _buildMarginButton(m))
                      .toList(),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }

  // --- HELPERS ---

  Widget _buildSectionHeader(String title, IconData icon) {
    return Row(
      children: [
        Icon(icon, color: const Color(0xFF2563EB), size: 18),
        const SizedBox(width: 8),
        Text(title, style: const TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: Color(0xFF1E293B))),
      ],
    );
  }

  Widget _buildCard({required Widget child}) {
    return Container(
      width: double.infinity,
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: Colors.grey.shade200, width: 1),
        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.02), blurRadius: 8, offset: const Offset(0, 2))],
      ),
      child: ClipRRect(borderRadius: BorderRadius.circular(10), child: child),
    );
  }

  Widget _buildItemCard({required String title, required String subtitle, required String trailingText, required VoidCallback onDelete}) {
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: Colors.grey.shade200, width: 1),
      ),
      child: ListTile(
        dense: true,
        contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
        title: Text(title, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: Color(0xFF1E293B))),
        subtitle: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const SizedBox(height: 2),
            Text(subtitle, style: TextStyle(color: Colors.grey.shade600, fontSize: 12)),
            if (trailingText.isNotEmpty) ...[
              const SizedBox(height: 4),
              Text(trailingText, style: TextStyle(fontSize: 11, color: Colors.grey.shade500, fontWeight: FontWeight.w600)),
            ]
          ],
        ),
        trailing: InkWell(
          onTap: onDelete,
          borderRadius: BorderRadius.circular(4),
          child: Padding(
            padding: const EdgeInsets.all(4),
            child: Icon(Icons.close, color: Colors.grey.shade400, size: 16),
          ),
        ),
      ),
    );
  }

  Widget _buildInput(String label, Function(String) onChanged, {int maxLines = 1, String? initialValue}) {
    return TextFormField(
      initialValue: initialValue,
      decoration: InputDecoration(
        labelText: label,
        labelStyle: TextStyle(color: Colors.grey.shade500, fontWeight: FontWeight.w500, fontSize: 12),
        filled: true,
        fillColor: Colors.white,
        isDense: true,
        enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: BorderSide(color: Colors.grey.shade200, width: 1)),
        focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: const BorderSide(color: Color(0xFF2563EB), width: 1.5)),
        contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
      ),
      style: TextStyle(fontSize: 13, color: Colors.grey.shade800),
      maxLines: maxLines,
      onChanged: onChanged,
    );
  }

  Widget _buildInputCtrl(TextEditingController ctrl, String label, Function(String) onSubmitted) {
    return TextField(
      controller: ctrl,
      decoration: InputDecoration(
        labelText: label,
        labelStyle: TextStyle(color: Colors.grey.shade500, fontWeight: FontWeight.w500, fontSize: 12),
        filled: true,
        fillColor: Colors.white,
        isDense: true,
        enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: BorderSide(color: Colors.grey.shade200, width: 1)),
        focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: const BorderSide(color: Color(0xFF2563EB), width: 1.5)),
        contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
      ),
      style: TextStyle(fontSize: 13, color: Colors.grey.shade800),
      onSubmitted: onSubmitted,
    );
  }
  
  Widget _buildAddButton(String text, VoidCallback onPressed) {
    return SizedBox(
      width: double.infinity,
      height: 36,
      child: OutlinedButton.icon(
        onPressed: onPressed,
        icon: const Icon(Icons.add, size: 16),
        label: Text(text, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
        style: OutlinedButton.styleFrom(
          foregroundColor: const Color(0xFF10B981),
          side: const BorderSide(color: Color(0xFF10B981)),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
        ),
      ),
    );
  }

  Widget _buildSmallAddIcon(VoidCallback onTap, Color color) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(8),
      child: Container(
        height: 38,
        width: 38,
        decoration: BoxDecoration(color: color.withOpacity(0.1), borderRadius: BorderRadius.circular(8), border: Border.all(color: color.withOpacity(0.2))),
        child: Icon(Icons.add, color: color, size: 18),
      ),
    );
  }

  Widget _buildMiniChip(String label, Color color, VoidCallback onDeleted) {
    return Container(
      padding: const EdgeInsets.only(left: 10, right: 4, top: 4, bottom: 4),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(6),
        border: Border.all(color: color.withOpacity(0.2)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(label, style: TextStyle(color: color, fontSize: 11, fontWeight: FontWeight.w600)),
          const SizedBox(width: 4),
          InkWell(
            onTap: onDeleted,
            child: Icon(Icons.close, size: 14, color: color),
          )
        ],
      ),
    );
  }

  Widget _buildColorSwatch(String hex, String name) {
    final isSelected = _resumeData['color_theme'] == hex;
    Color color;
    try {
      color = Color(int.parse(hex.replaceFirst('#', '0xFF')));
    } catch (e) {
      color = Colors.grey;
    }
    
    return GestureDetector(
      onTap: () => setState(() => _resumeData['color_theme'] = hex),
      child: Column(
        children: [
          AnimatedContainer(
            duration: const Duration(milliseconds: 200),
            width: 36,
            height: 36,
            decoration: BoxDecoration(
              color: color,
              shape: BoxShape.circle,
              border: Border.all(color: Colors.white, width: isSelected ? 2 : 1),
              boxShadow: [BoxShadow(color: color.withOpacity(0.3), blurRadius: isSelected ? 6 : 2, offset: const Offset(0, 2))],
            ),
            child: isSelected ? const Icon(Icons.check, color: Colors.white, size: 18) : null,
          ),
          const SizedBox(height: 4),
          Text(name, style: TextStyle(fontSize: 10, color: isSelected ? const Color(0xFF1E293B) : Colors.grey, fontWeight: isSelected ? FontWeight.bold : FontWeight.w500)),
        ],
      ),
    );
  }

  Widget _buildFontChip(String font) {
    final isSelected = _resumeData['font_family'] == font;
    return InkWell(
      onTap: () => setState(() => _resumeData['font_family'] = font),
      borderRadius: BorderRadius.circular(6),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
        decoration: BoxDecoration(
          color: isSelected ? const Color(0xFF2563EB) : Colors.white,
          borderRadius: BorderRadius.circular(6),
          border: Border.all(color: isSelected ? const Color(0xFF2563EB) : Colors.grey.shade200),
        ),
        child: Text(
          font,
          style: TextStyle(
            fontFamily: font,
            color: isSelected ? Colors.white : Colors.grey.shade800,
            fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
            fontSize: 12,
          ),
        ),
      ),
    );
  }

  Widget _buildMarginButton(String margin) {
    final isSelected = _resumeData['page_margin'] == margin;
    return Expanded(
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 4),
        child: InkWell(
          onTap: () => setState(() => _resumeData['page_margin'] = margin),
          borderRadius: BorderRadius.circular(6),
          child: AnimatedContainer(
            duration: const Duration(milliseconds: 200),
            padding: const EdgeInsets.symmetric(vertical: 10),
            decoration: BoxDecoration(
              color: isSelected ? const Color(0xFF2563EB).withOpacity(0.05) : Colors.white,
              borderRadius: BorderRadius.circular(6),
              border: Border.all(color: isSelected ? const Color(0xFF2563EB) : Colors.grey.shade200, width: 1),
            ),
            alignment: Alignment.center,
            child: Text(
              margin.toUpperCase(), 
              style: TextStyle(
                fontSize: 11, 
                fontWeight: isSelected ? FontWeight.bold : FontWeight.w600, 
                color: isSelected ? const Color(0xFF2563EB) : Colors.grey.shade600
              ),
            ),
          ),
        ),
      ),
    );
  }
}
