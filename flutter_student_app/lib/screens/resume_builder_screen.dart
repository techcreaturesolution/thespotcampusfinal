import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
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

  // Controllers for list inputs
  final _skillCtrl = TextEditingController();
  final _certCtrl = TextEditingController();
  final _langCtrl = TextEditingController();

  // Temporary state for adding new items
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
        ScaffoldMessenger.of(context)
            .showSnackBar(SnackBar(content: Text('Error loading data: \$e')));
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
      if (payload['selected_template_id'] == null ||
          payload['selected_template_id'].toString().isEmpty) {
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
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(content: Text('CV Details saved successfully!')));
        }
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context)
            .showSnackBar(SnackBar(content: Text('Error saving: \$e')));
      }
    }
  }

  Future<void> _saveAndCompileResume() async {
    setState(() => _isCompiling = true);
    try {
      final payload = Map<String, dynamic>.from(_resumeData);
      if (payload['selected_template_id'] == null ||
          payload['selected_template_id'].toString().isEmpty) {
        payload.remove('selected_template_id');
      }

      // 1. Save Resume details first
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

      // 2. Compile CV
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Saving and compiling CV...'),
            duration: Duration(seconds: 2),
          ),
        );
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
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('✨ CV Compiled & Saved to Profile successfully!'),
            backgroundColor: Colors.green,
            behavior: SnackBarBehavior.floating,
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
                "Error compiling: ${e.toString().replaceAll('Exception: ', '')}"),
            backgroundColor: Colors.red,
            behavior: SnackBarBehavior.floating,
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isCompiling = false);
      }
    }
  }

  Future<void> _generateAiSummaries() async {
    if ((_resumeData['skills'] as List).isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Please add some skills first!')));
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
        ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('AI Summaries generated!')));
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('Error generating summaries: \$e')));
      }
    } finally {
      if (mounted) {
        setState(() => _isGeneratingSummary = false);
      }
    }
  }

  void _selectTemplate(String id) {
    setState(() {
      _resumeData['selected_template_id'] = id;
    });
    _saveResume();
  }

  // List Adders
  void _addSkill() {
    if (_skillCtrl.text.trim().isNotEmpty &&
        (_resumeData['skills'] as List).length < 5) {
      setState(() {
        (_resumeData['skills'] as List).add(_skillCtrl.text.trim());
        _skillCtrl.clear();
      });
    }
  }

  void _addCert() {
    if (_certCtrl.text.trim().isNotEmpty &&
        (_resumeData['certifications'] as List).length < 3) {
      setState(() {
        (_resumeData['certifications'] as List).add(_certCtrl.text.trim());
        _certCtrl.clear();
      });
    }
  }

  void _addLang() {
    if (_langCtrl.text.trim().isNotEmpty &&
        (_resumeData['languages'] as List).length < 3) {
      setState(() {
        (_resumeData['languages'] as List).add(_langCtrl.text.trim());
        _langCtrl.clear();
      });
    }
  }

  void _addEducation() {
    if (_eduInput['institution'] != null && _eduInput['degree'] != null) {
      if ((_resumeData['education'] as List).length < 2) {
        setState(() {
          (_resumeData['education'] as List).add(Map.from(_eduInput));
          _eduInput.clear();
        });
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Max 2 education entries allowed!')));
      }
    }
  }

  void _addExperience() {
    if (_expInput['company'] != null && _expInput['role'] != null) {
      if ((_resumeData['experience'] as List).length < 2) {
        setState(() {
          (_resumeData['experience'] as List).add(Map.from(_expInput));
          _expInput.clear();
        });
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Max 2 experience entries allowed!')));
      }
    }
  }

  void _addProject() {
    if (_projInput['title'] != null && _projInput['description'] != null) {
      if ((_resumeData['projects'] as List).length < 2) {
        setState(() {
          Map<String, dynamic> proj = Map.from(_projInput);
          if (proj['technologies'] != null && proj['technologies'] is String) {
            proj['technologies'] = (proj['technologies'] as String)
                .split(',')
                .map((e) => e.trim())
                .where((e) => e.isNotEmpty)
                .toList();
          } else {
            proj['technologies'] = [];
          }
          (_resumeData['projects'] as List).add(proj);
          _projInput.clear();
        });
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Max 2 project entries allowed!')));
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Scaffold(body: Center(child: CircularProgressIndicator()));
    }

    if (!_hasSubscription) {
      return Scaffold(
        appBar: AppBar(title: const Text('Resume Builder')),
        body: Center(
          child: Padding(
            padding: const EdgeInsets.all(24.0),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Icon(Icons.lock, size: 64, color: Colors.indigo),
                const SizedBox(height: 16),
                const Text('Premium Feature',
                    style:
                        TextStyle(fontSize: 24, fontWeight: FontWeight.bold)),
                const SizedBox(height: 8),
                const Text(
                    'Unlock the Premium CV Builder by upgrading your membership.',
                    textAlign: TextAlign.center),
                const SizedBox(height: 24),
                ElevatedButton(
                  onPressed: () => Navigator.pushNamed(context, '/plans'),
                  child: const Text('View Subscription Plans'),
                )
              ],
            ),
          ),
        ),
      );
    }

    if (_resumeData['selected_template_id'] == null ||
        _resumeData['selected_template_id'].toString().isEmpty) {
      return Scaffold(
        appBar: AppBar(title: const Text('Select Template')),
        body: _templates.isEmpty
            ? const Center(
                child: Text("No templates available. Contact admin."))
            : GridView.builder(
                padding: const EdgeInsets.all(16),
                gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                  crossAxisCount: 2,
                  crossAxisSpacing: 16,
                  mainAxisSpacing: 16,
                  childAspectRatio: 0.7,
                ),
                itemCount: _templates.length,
                itemBuilder: (context, index) {
                  final t = _templates[index];
                  return GestureDetector(
                    onTap: () => _selectTemplate(t['_id']),
                    child: Card(
                      clipBehavior: Clip.antiAlias,
                      child: Column(
                        children: [
                          Expanded(
                            child: t['thumbnail'] != null
                                ? Image.network(t['thumbnail'],
                                    fit: BoxFit.cover, width: double.infinity)
                                : const Icon(Icons.file_copy,
                                    size: 64, color: Colors.grey),
                          ),
                          Padding(
                            padding: const EdgeInsets.all(8.0),
                            child: Text(t['name'] ?? 'Template',
                                maxLines: 1, overflow: TextOverflow.ellipsis),
                          ),
                        ],
                      ),
                    ),
                  );
                },
              ),
      );
    }

    return Scaffold(
      appBar: AppBar(
        title: const Text('Edit Resume'),
        actions: [
          IconButton(
            icon: const Icon(Icons.preview),
            onPressed: () async {
              await _saveResume();
              if (mounted) {
                Navigator.pushNamed(context, '/resume-preview');
              }
            },
            tooltip: 'Preview / Compile',
          )
        ],
      ),
      body: Column(
        children: [
          Expanded(
            child: ListView(
              padding: const EdgeInsets.all(12),
              children: [
                _buildProfileSection(),
                _buildEducationSection(),
                _buildExperienceSection(),
                _buildProjectsSection(),
                _buildTagsSection(),
                _buildSummarySection(),
                _buildDesignSection(),
              ],
            ),
          ),
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(color: Colors.white, boxShadow: [
              BoxShadow(
                  color: Colors.black12, blurRadius: 4, offset: Offset(0, -2))
            ]),
            child: Row(
              children: [
                Expanded(
                  child: OutlinedButton(
                    onPressed: () => setState(
                        () => _resumeData['selected_template_id'] = ''),
                    child: const Text('Change Template'),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: ElevatedButton(
                    onPressed: _isCompiling ? null : _saveAndCompileResume,
                    child: _isCompiling
                        ? const SizedBox(
                            width: 20,
                            height: 20,
                            child: CircularProgressIndicator(
                              strokeWidth: 2.5,
                              valueColor:
                                  AlwaysStoppedAnimation<Color>(Colors.white),
                            ),
                          )
                        : const Text('Compile & Save to Profile'),
                  ),
                ),
              ],
            ),
          )
        ],
      ),
    );
  }

  Widget _buildProfileSection() {
    return ExpansionTile(
      title: const Text('Profile Details',
          style: TextStyle(fontWeight: FontWeight.bold)),
      leading: const Icon(Icons.person),
      childrenPadding: const EdgeInsets.all(16),
      children: [
        TextFormField(
          initialValue: _resumeData['punch_line'] ?? '',
          decoration: const InputDecoration(
              labelText: 'Punch line / Job Title',
              hintText: 'e.g. Software Engineer'),
          onChanged: (v) => _resumeData['punch_line'] = v,
        ),
      ],
    );
  }

  Widget _buildEducationSection() {
    final eduList = _resumeData['education'] as List;
    return ExpansionTile(
      title: const Text('Education',
          style: TextStyle(fontWeight: FontWeight.bold)),
      leading: const Icon(Icons.school),
      childrenPadding: const EdgeInsets.all(16),
      children: [
        if (eduList.isNotEmpty)
          ...eduList.asMap().entries.map((e) {
            final idx = e.key;
            final item = e.value;
            return Card(
              margin: const EdgeInsets.only(bottom: 8),
              child: ListTile(
                title: Text(item['institution'] ?? ''),
                subtitle: Text(
                    "\${item['degree']} in \${item['fieldOfStudy']} (\${item['startYear']}-\${item['endYear']})"),
                trailing: IconButton(
                  icon: const Icon(Icons.delete, color: Colors.red),
                  onPressed: () => setState(() => eduList.removeAt(idx)),
                ),
              ),
            );
          }),
        if (eduList.length < 2) ...[
          const Divider(),
          const Text('Add Education',
              style: TextStyle(fontWeight: FontWeight.bold)),
          const SizedBox(height: 8),
          Row(
            children: [
              Expanded(
                  child: TextField(
                      decoration: const InputDecoration(labelText: 'Degree'),
                      onChanged: (v) => _eduInput['degree'] = v)),
              const SizedBox(width: 8),
              Expanded(
                  child: TextField(
                      decoration:
                          const InputDecoration(labelText: 'Field of Study'),
                      onChanged: (v) => _eduInput['fieldOfStudy'] = v)),
            ],
          ),
          const SizedBox(height: 8),
          TextField(
              decoration: const InputDecoration(labelText: 'Institution'),
              onChanged: (v) => _eduInput['institution'] = v),
          const SizedBox(height: 8),
          Row(
            children: [
              Expanded(
                  child: TextField(
                      decoration:
                          const InputDecoration(labelText: 'Start Year'),
                      onChanged: (v) => _eduInput['startYear'] = v)),
              const SizedBox(width: 8),
              Expanded(
                  child: TextField(
                      decoration: const InputDecoration(labelText: 'End Year'),
                      onChanged: (v) => _eduInput['endYear'] = v)),
              const SizedBox(width: 8),
              Expanded(
                  child: TextField(
                      decoration: const InputDecoration(labelText: 'Score'),
                      onChanged: (v) => _eduInput['score'] = v)),
            ],
          ),
          const SizedBox(height: 12),
          ElevatedButton.icon(
              onPressed: _addEducation,
              icon: const Icon(Icons.add),
              label: const Text('Add Education')),
        ]
      ],
    );
  }

  Widget _buildExperienceSection() {
    final expList = _resumeData['experience'] as List;
    return ExpansionTile(
      title: const Text('Work Experience',
          style: TextStyle(fontWeight: FontWeight.bold)),
      leading: const Icon(Icons.work),
      childrenPadding: const EdgeInsets.all(16),
      children: [
        if (expList.isNotEmpty)
          ...expList.asMap().entries.map((e) {
            final idx = e.key;
            final item = e.value;
            return Card(
              margin: const EdgeInsets.only(bottom: 8),
              child: ListTile(
                title: Text(item['company'] ?? ''),
                subtitle: Text(
                    "\${item['role']} (\${item['startDate']} - \${item['endDate']})"),
                trailing: IconButton(
                  icon: const Icon(Icons.delete, color: Colors.red),
                  onPressed: () => setState(() => expList.removeAt(idx)),
                ),
              ),
            );
          }),
        if (expList.length < 2) ...[
          const Divider(),
          const Text('Add Experience',
              style: TextStyle(fontWeight: FontWeight.bold)),
          const SizedBox(height: 8),
          Row(
            children: [
              Expanded(
                  child: TextField(
                      decoration: const InputDecoration(labelText: 'Company'),
                      onChanged: (v) => _expInput['company'] = v)),
              const SizedBox(width: 8),
              Expanded(
                  child: TextField(
                      decoration: const InputDecoration(labelText: 'Role'),
                      onChanged: (v) => _expInput['role'] = v)),
            ],
          ),
          const SizedBox(height: 8),
          Row(
            children: [
              Expanded(
                  child: TextField(
                      decoration:
                          const InputDecoration(labelText: 'Start Date'),
                      onChanged: (v) => _expInput['startDate'] = v)),
              const SizedBox(width: 8),
              Expanded(
                  child: TextField(
                      decoration: const InputDecoration(labelText: 'End Date'),
                      onChanged: (v) => _expInput['endDate'] = v)),
            ],
          ),
          const SizedBox(height: 8),
          TextField(
              decoration: const InputDecoration(labelText: 'Description'),
              maxLines: 2,
              onChanged: (v) => _expInput['description'] = v),
          const SizedBox(height: 12),
          ElevatedButton.icon(
              onPressed: _addExperience,
              icon: const Icon(Icons.add),
              label: const Text('Add Experience')),
        ]
      ],
    );
  }

  Widget _buildProjectsSection() {
    final projList = _resumeData['projects'] as List;
    return ExpansionTile(
      title:
          const Text('Projects', style: TextStyle(fontWeight: FontWeight.bold)),
      leading: const Icon(Icons.code),
      childrenPadding: const EdgeInsets.all(16),
      children: [
        if (projList.isNotEmpty)
          ...projList.asMap().entries.map((e) {
            final idx = e.key;
            final item = e.value;
            return Card(
              margin: const EdgeInsets.only(bottom: 8),
              child: ListTile(
                title: Text(item['title'] ?? ''),
                subtitle: Text(item['description'] ?? '',
                    maxLines: 2, overflow: TextOverflow.ellipsis),
                trailing: IconButton(
                  icon: const Icon(Icons.delete, color: Colors.red),
                  onPressed: () => setState(() => projList.removeAt(idx)),
                ),
              ),
            );
          }),
        if (projList.length < 2) ...[
          const Divider(),
          const Text('Add Project',
              style: TextStyle(fontWeight: FontWeight.bold)),
          const SizedBox(height: 8),
          Row(
            children: [
              Expanded(
                  child: TextField(
                      decoration: const InputDecoration(labelText: 'Title'),
                      onChanged: (v) => _projInput['title'] = v)),
              const SizedBox(width: 8),
              Expanded(
                  child: TextField(
                      decoration: const InputDecoration(
                          labelText: 'Tech (comma separated)'),
                      onChanged: (v) => _projInput['technologies'] = v)),
            ],
          ),
          const SizedBox(height: 8),
          TextField(
              decoration: const InputDecoration(labelText: 'Link / URL'),
              onChanged: (v) => _projInput['link'] = v),
          const SizedBox(height: 8),
          TextField(
              decoration: const InputDecoration(labelText: 'Description'),
              maxLines: 2,
              onChanged: (v) => _projInput['description'] = v),
          const SizedBox(height: 12),
          ElevatedButton.icon(
              onPressed: _addProject,
              icon: const Icon(Icons.add),
              label: const Text('Add Project')),
        ]
      ],
    );
  }

  Widget _buildTagsSection() {
    final skillList = _resumeData['skills'] as List;
    final certList = _resumeData['certifications'] as List;
    final langList = _resumeData['languages'] as List;

    return ExpansionTile(
      title: const Text('Skills, Certs & Languages',
          style: TextStyle(fontWeight: FontWeight.bold)),
      leading: const Icon(Icons.stars),
      childrenPadding: const EdgeInsets.all(16),
      children: [
        // Skills
        const Text('Skills (Max 5)',
            style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12)),
        Row(
          children: [
            Expanded(
                child: TextField(
                    controller: _skillCtrl,
                    decoration: const InputDecoration(labelText: 'Add Skill'),
                    onSubmitted: (_) => _addSkill())),
            IconButton(
                icon: const Icon(Icons.add_circle),
                onPressed: _addSkill,
                color: Colors.indigo),
          ],
        ),
        Wrap(
          spacing: 8,
          children: skillList
              .map((s) => Chip(
                    label: Text(s.toString()),
                    onDeleted: () => setState(() => skillList.remove(s)),
                  ))
              .toList(),
        ),
        const SizedBox(height: 16),

        // Certs
        const Text('Certifications (Max 3)',
            style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12)),
        Row(
          children: [
            Expanded(
                child: TextField(
                    controller: _certCtrl,
                    decoration:
                        const InputDecoration(labelText: 'Add Certification'),
                    onSubmitted: (_) => _addCert())),
            IconButton(
                icon: const Icon(Icons.add_circle),
                onPressed: _addCert,
                color: Colors.indigo),
          ],
        ),
        Wrap(
          spacing: 8,
          children: certList
              .map((c) => Chip(
                    label: Text(c.toString()),
                    onDeleted: () => setState(() => certList.remove(c)),
                  ))
              .toList(),
        ),
        const SizedBox(height: 16),

        // Langs
        const Text('Languages (Max 3)',
            style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12)),
        Row(
          children: [
            Expanded(
                child: TextField(
                    controller: _langCtrl,
                    decoration:
                        const InputDecoration(labelText: 'Add Language'),
                    onSubmitted: (_) => _addLang())),
            IconButton(
                icon: const Icon(Icons.add_circle),
                onPressed: _addLang,
                color: Colors.indigo),
          ],
        ),
        Wrap(
          spacing: 8,
          children: langList
              .map((l) => Chip(
                    label: Text(l.toString()),
                    onDeleted: () => setState(() => langList.remove(l)),
                  ))
              .toList(),
        ),
      ],
    );
  }

  Widget _buildSummarySection() {
    return ExpansionTile(
      title:
          const Text('Summary', style: TextStyle(fontWeight: FontWeight.bold)),
      leading: const Icon(Icons.description),
      childrenPadding: const EdgeInsets.all(16),
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            const Text('Professional Summary'),
            TextButton.icon(
              onPressed: _isGeneratingSummary ? null : _generateAiSummaries,
              icon: _isGeneratingSummary
                  ? const SizedBox(
                      width: 16,
                      height: 16,
                      child: CircularProgressIndicator(strokeWidth: 2))
                  : const Icon(Icons.auto_awesome, size: 16),
              label: const Text('Ask AI'),
            )
          ],
        ),
        if (_aiSummaries.isNotEmpty) ...[
          const SizedBox(height: 8),
          Container(
            height: 150,
            decoration: BoxDecoration(
                border: Border.all(color: Colors.grey.shade300),
                borderRadius: BorderRadius.circular(8)),
            child: ListView.builder(
              itemCount: _aiSummaries.length,
              itemBuilder: (context, idx) {
                final sum = _aiSummaries[idx];
                final isSelected = _resumeData['chosen_summary'] == sum;
                return ListTile(
                  dense: true,
                  title: Text('Option \${idx + 1}',
                      style: TextStyle(
                          fontWeight: FontWeight.bold,
                          color: isSelected ? Colors.indigo : null)),
                  subtitle: Text(sum.toString()),
                  selected: isSelected,
                  selectedTileColor: Colors.indigo.withOpacity(0.1),
                  onTap: () =>
                      setState(() => _resumeData['chosen_summary'] = sum),
                );
              },
            ),
          ),
          const SizedBox(height: 12),
        ],
        TextFormField(
          initialValue: _resumeData['chosen_summary'] ?? '',
          key: Key(_resumeData['chosen_summary']),
          decoration: const InputDecoration(
              hintText: 'Write your summary here or select an AI option...'),
          maxLines: 4,
          onChanged: (v) => _resumeData['chosen_summary'] = v,
        ),
      ],
    );
  }

  Widget _buildDesignSection() {
    return ExpansionTile(
      title: const Text('Design Settings',
          style: TextStyle(fontWeight: FontWeight.bold)),
      leading: const Icon(Icons.color_lens),
      childrenPadding: const EdgeInsets.all(16),
      children: [
        if (_templates.isNotEmpty) ...[
          DropdownButtonFormField<String>(
            value: _templates
                    .any((t) => t['_id'] == _resumeData['selected_template_id'])
                ? _resumeData['selected_template_id']
                : null,
            decoration: const InputDecoration(labelText: 'Template Design'),
            items: _templates
                .map((t) => DropdownMenuItem<String>(
                    value: t['_id'], child: Text(t['name'] ?? 'Template')))
                .toList(),
            onChanged: (v) =>
                setState(() => _resumeData['selected_template_id'] = v),
          ),
          const SizedBox(height: 12),
        ],
        DropdownButtonFormField<String>(
          value: _resumeData['font_family'],
          decoration: const InputDecoration(labelText: 'Font Family'),
          items: ['Inter', 'Outfit', 'Playfair Display', 'Roboto']
              .map((e) => DropdownMenuItem(value: e, child: Text(e)))
              .toList(),
          onChanged: (v) => setState(() => _resumeData['font_family'] = v),
        ),
        const SizedBox(height: 12),
        DropdownButtonFormField<String>(
          value: _resumeData['color_theme'],
          decoration: const InputDecoration(labelText: 'Theme Color'),
          items: const [
            DropdownMenuItem(value: '#3730a3', child: Text('Indigo')),
            DropdownMenuItem(value: '#0ea5e9', child: Text('Sky Blue')),
            DropdownMenuItem(value: '#10b981', child: Text('Emerald')),
            DropdownMenuItem(value: '#f43f5e', child: Text('Rose')),
            DropdownMenuItem(value: '#1e293b', child: Text('Slate')),
          ],
          onChanged: (v) => setState(() => _resumeData['color_theme'] = v),
        ),
        const SizedBox(height: 12),
        DropdownButtonFormField<String>(
          value: _resumeData['page_margin'],
          decoration: const InputDecoration(labelText: 'Page Margin'),
          items: const [
            DropdownMenuItem(value: 'small', child: Text('Small')),
            DropdownMenuItem(value: 'medium', child: Text('Medium')),
            DropdownMenuItem(value: 'large', child: Text('Large')),
          ],
          onChanged: (v) => setState(() => _resumeData['page_margin'] = v),
        ),
      ],
    );
  }
}
