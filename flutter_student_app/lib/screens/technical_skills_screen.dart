import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../models/technical_skill_models.dart';
import '../services/auth_service.dart';
import '../services/technical_skills_service.dart';

class TechnicalSkillsScreen extends StatefulWidget {
  const TechnicalSkillsScreen({super.key});

  @override
  State<TechnicalSkillsScreen> createState() => _TechnicalSkillsScreenState();
}

class _TechnicalSkillsScreenState extends State<TechnicalSkillsScreen> {
  String _categoryFilter = '';
  String _proficiencyFilter = '';
  String _sortBy = 'display_order';

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<TechnicalSkillsService>().loadMySkills();
    });
  }

  void _openAddSkillSheet() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (_) => const _AddSkillSheet(),
    ).then((added) {
      if (added == true && mounted) {
        context.read<AuthService>().checkAuth();
      }
    });
  }

  void _openEditSkillSheet(StudentSkillModel item) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (_) => _EditSkillSheet(item: item),
    ).then((updated) {
      if (updated == true && mounted) {
        context.read<AuthService>().checkAuth();
      }
    });
  }

  Future<void> _moveSkill(List<StudentSkillModel> list, int index, int delta) async {
    final target = index + delta;
    if (target < 0 || target >= list.length) return;
    final copy = List<StudentSkillModel>.from(list);
    final moved = copy.removeAt(index);
    copy.insert(target, moved);
    try {
      await context.read<TechnicalSkillsService>().reorderSkills(copy);
      if (mounted) context.read<AuthService>().checkAuth();
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(e.toString().replaceAll('Exception: ', ''))),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final service = context.watch<TechnicalSkillsService>();
    final byCategory = _categoryFilter.isEmpty
        ? service.skills
        : service.skills.where((s) => s.skill.category == _categoryFilter).toList();
    final byProficiency = _proficiencyFilter.isEmpty
        ? byCategory
        : byCategory.where((s) => s.proficiency == _proficiencyFilter).toList();
    final displayed = List<StudentSkillModel>.from(byProficiency);
    if (_sortBy == 'proficiency_desc') {
      displayed.sort((a, b) => b.proficiencyOrder.compareTo(a.proficiencyOrder));
    } else if (_sortBy == 'proficiency_asc') {
      displayed.sort((a, b) => a.proficiencyOrder.compareTo(b.proficiencyOrder));
    }
    final canReorder = _categoryFilter.isEmpty && _proficiencyFilter.isEmpty && _sortBy == 'display_order';

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        title: const Text('Technical Skills', style: TextStyle(fontWeight: FontWeight.w800)),
        backgroundColor: Colors.white,
        foregroundColor: const Color(0xFF1F2937),
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: _openAddSkillSheet,
        backgroundColor: const Color(0xFF2563EB),
        foregroundColor: Colors.white,
        icon: const Icon(Icons.add),
        label: const Text('Add Skill', style: TextStyle(fontWeight: FontWeight.w700)),
      ),
      body: service.isLoading && service.skills.isEmpty
          ? const Center(child: CircularProgressIndicator())
          : service.errorMessage != null && service.skills.isEmpty
              ? Center(
                  child: Padding(
                    padding: const EdgeInsets.all(24),
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Icon(Icons.error_outline, color: Colors.red, size: 42),
                        const SizedBox(height: 12),
                        Text(service.errorMessage!, textAlign: TextAlign.center),
                        const SizedBox(height: 16),
                        ElevatedButton(
                          onPressed: service.loadMySkills,
                          child: const Text('Retry'),
                        ),
                      ],
                    ),
                  ),
                )
              : RefreshIndicator(
                  onRefresh: service.loadMySkills,
                  child: ListView(
                    padding: const EdgeInsets.fromLTRB(16, 16, 16, 88),
                    children: [
                      DropdownButtonFormField<String>(
                        value: _categoryFilter,
                        decoration: const InputDecoration(
                          labelText: 'Filter by Category',
                          fillColor: Colors.white,
                        ),
                        items: [
                          const DropdownMenuItem(value: '', child: Text('All Categories')),
                          ...SkillValidators.categories
                              .map((c) => DropdownMenuItem(value: c, child: Text(c))),
                        ],
                        onChanged: (val) => setState(() => _categoryFilter = val ?? ''),
                      ),
                      const SizedBox(height: 10),
                      Row(
                        children: [
                          Expanded(
                            child: DropdownButtonFormField<String>(
                              value: _proficiencyFilter,
                              decoration: const InputDecoration(
                                labelText: 'Proficiency',
                                fillColor: Colors.white,
                              ),
                              items: [
                                const DropdownMenuItem(value: '', child: Text('All Levels')),
                                ...service.proficiencyLevels.map(
                                  (p) => DropdownMenuItem(value: p.name, child: Text(p.name)),
                                ),
                              ],
                              onChanged: (val) => setState(() => _proficiencyFilter = val ?? ''),
                            ),
                          ),
                          const SizedBox(width: 10),
                          Expanded(
                            child: DropdownButtonFormField<String>(
                              value: _sortBy,
                              decoration: const InputDecoration(
                                labelText: 'Sort By',
                                fillColor: Colors.white,
                              ),
                              items: const [
                                DropdownMenuItem(value: 'display_order', child: Text('Custom Order')),
                                DropdownMenuItem(value: 'proficiency_desc', child: Text('Level: High-Low')),
                                DropdownMenuItem(value: 'proficiency_asc', child: Text('Level: Low-High')),
                              ],
                              onChanged: (val) => setState(() => _sortBy = val ?? 'display_order'),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 16),
                      if (displayed.isEmpty)
                        Container(
                          padding: const EdgeInsets.all(28),
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(20),
                            border: Border.all(color: Colors.grey.shade200),
                          ),
                          child: const Column(
                            children: [
                              Icon(Icons.code, size: 40, color: Color(0xFF94A3B8)),
                              SizedBox(height: 10),
                              Text(
                                'No technical skills listed yet',
                                style: TextStyle(fontWeight: FontWeight.w800, fontSize: 15),
                              ),
                              SizedBox(height: 4),
                              Text(
                                'Tap "Add Skill" to search the canonical catalog and set your proficiency.',
                                textAlign: TextAlign.center,
                                style: TextStyle(color: Colors.grey, fontSize: 12),
                              ),
                            ],
                          ),
                        )
                      else
                        ...List.generate(displayed.length, (idx) {
                          final item = displayed[idx];
                          return Container(
                            margin: const EdgeInsets.only(bottom: 12),
                            padding: const EdgeInsets.all(14),
                            decoration: BoxDecoration(
                              color: Colors.white,
                              borderRadius: BorderRadius.circular(18),
                              border: Border.all(color: Colors.grey.shade200),
                            ),
                            child: Row(
                              children: [
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                        item.skill.name,
                                        style: const TextStyle(
                                          fontWeight: FontWeight.w800,
                                          fontSize: 15,
                                        ),
                                      ),
                                      const SizedBox(height: 4),
                                      Wrap(
                                        spacing: 8,
                                        runSpacing: 4,
                                        children: [
                                          _badge(item.skill.category, const Color(0xFFF1F5F9),
                                              const Color(0xFF475569)),
                                          _badge(
                                            '${item.proficiency} (L${item.proficiencyOrder}/${service.proficiencyLevels.length})',
                                            const Color(0xFFEFF6FF),
                                            const Color(0xFF2563EB),
                                          ),
                                          if (item.yearsOfExperience != null)
                                            _badge('${item.yearsOfExperience} yrs',
                                                const Color(0xFFECFDF5), const Color(0xFF059669)),
                                        ],
                                      ),
                                    ],
                                  ),
                                ),
                                if (canReorder) ...[
                                  IconButton(
                                    icon: const Icon(Icons.arrow_upward, size: 18),
                                    onPressed: idx == 0 ? null : () => _moveSkill(displayed, idx, -1),
                                  ),
                                  IconButton(
                                    icon: const Icon(Icons.arrow_downward, size: 18),
                                    onPressed: idx == displayed.length - 1
                                        ? null
                                        : () => _moveSkill(displayed, idx, 1),
                                  ),
                                ],
                                IconButton(
                                  icon: const Icon(Icons.edit_outlined, size: 18),
                                  onPressed: () => _openEditSkillSheet(item),
                                ),
                                IconButton(
                                  icon: const Icon(Icons.delete_outline, color: Colors.red, size: 18),
                                  onPressed: () async {
                                    try {
                                      await service.removeSkill(item.id);
                                      if (!mounted) return;
                                      context.read<AuthService>().checkAuth();
                                      ScaffoldMessenger.of(context).showSnackBar(
                                        const SnackBar(content: Text('Skill removed')),
                                      );
                                    } catch (e) {
                                      if (!mounted) return;
                                      ScaffoldMessenger.of(context).showSnackBar(
                                        SnackBar(content: Text(e.toString().replaceAll('Exception: ', ''))),
                                      );
                                    }
                                  },
                                ),
                              ],
                            ),
                          );
                        }),
                    ],
                  ),
                ),
    );
  }

  Widget _badge(String label, Color bg, Color fg) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 3),
      decoration: BoxDecoration(color: bg, borderRadius: BorderRadius.circular(20)),
      child: Text(label, style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: fg)),
    );
  }
}

class _AddSkillSheet extends StatefulWidget {
  const _AddSkillSheet();

  @override
  State<_AddSkillSheet> createState() => _AddSkillSheetState();
}

class _AddSkillSheetState extends State<_AddSkillSheet> {
  final _formKey = GlobalKey<FormState>();
  final _searchCtrl = TextEditingController();
  final _yearsCtrl = TextEditingController();
  String _selectedCategory = '';
  String _proficiency = 'Intermediate';
  SkillMasterModel? _selectedSkill;
  bool _saving = false;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<TechnicalSkillsService>().searchCatalog();
    });
  }

  @override
  void dispose() {
    _searchCtrl.dispose();
    _yearsCtrl.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    if (_selectedSkill == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please select a skill from the search list')),
      );
      return;
    }

    setState(() => _saving = true);
    try {
      final yrs = _yearsCtrl.text.trim().isEmpty ? null : double.parse(_yearsCtrl.text.trim());
      await context.read<TechnicalSkillsService>().addSkill(
            skillId: _selectedSkill!.id,
            proficiency: _proficiency,
            yearsOfExperience: yrs,
          );
      if (!mounted) return;
      Navigator.pop(context, true);
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Technical skill added!'),
          backgroundColor: Color(0xFF059669),
        ),
      );
    } catch (e) {
      if (!mounted) return;
      setState(() => _saving = false);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(e.toString().replaceAll('Exception: ', ''))),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final service = context.watch<TechnicalSkillsService>();
    final existingIds = service.skills.map((s) => s.skill.id).toSet();

    return Padding(
      padding: EdgeInsets.only(
        top: 20,
        left: 20,
        right: 20,
        bottom: MediaQuery.of(context).viewInsets.bottom + 20,
      ),
      child: Form(
        key: _formKey,
        child: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const Text(
                'Add Technical Skill',
                style: TextStyle(fontSize: 18, fontWeight: FontWeight.w800),
              ),
              const SizedBox(height: 14),
              DropdownButtonFormField<String>(
                value: _selectedCategory,
                decoration: const InputDecoration(labelText: 'Category'),
                items: [
                  const DropdownMenuItem(value: '', child: Text('All Categories')),
                  ...SkillValidators.categories
                      .map((c) => DropdownMenuItem(value: c, child: Text(c))),
                ],
                onChanged: (val) {
                  setState(() => _selectedCategory = val ?? '');
                  service.searchCatalog(query: _searchCtrl.text, category: _selectedCategory);
                },
              ),
              const SizedBox(height: 12),
              TextField(
                controller: _searchCtrl,
                decoration: const InputDecoration(
                  labelText: 'Search Canonical Skill',
                  prefixIcon: Icon(Icons.search),
                ),
                onChanged: (val) {
                  setState(() => _selectedSkill = null);
                  service.searchCatalog(query: val, category: _selectedCategory);
                },
              ),
              const SizedBox(height: 8),
              if (service.isSearching)
                const Padding(
                  padding: EdgeInsets.all(10),
                  child: Center(child: CircularProgressIndicator()),
                )
              else
                SizedBox(
                  height: 150,
                  child: service.searchResults.isEmpty
                      ? const Center(child: Text('No matching skills found'))
                      : ListView.builder(
                          itemCount: service.searchResults.length,
                          itemBuilder: (_, idx) {
                            final item = service.searchResults[idx];
                            final added = existingIds.contains(item.id);
                            final selected = _selectedSkill?.id == item.id;
                            return ListTile(
                              dense: true,
                              enabled: !added,
                              selected: selected,
                              title: Text(item.name,
                                  style: const TextStyle(fontWeight: FontWeight.w700)),
                              subtitle: Text(item.category),
                              trailing: added
                                  ? const Text('Added', style: TextStyle(color: Colors.green))
                                  : selected
                                      ? const Icon(Icons.check_circle, color: Color(0xFF2563EB))
                                      : null,
                              onTap: () => setState(() => _selectedSkill = item),
                            );
                          },
                        ),
                ),
              const SizedBox(height: 12),
              Row(
                children: [
                  Expanded(
                    child: DropdownButtonFormField<String>(
                      value: _proficiency,
                      decoration: const InputDecoration(labelText: 'Proficiency'),
                      items: SkillValidators.proficiencies
                          .map((p) => DropdownMenuItem(value: p, child: Text(p)))
                          .toList(),
                      validator: SkillValidators.validateProficiency,
                      onChanged: (val) => setState(() => _proficiency = val ?? 'Intermediate'),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: TextFormField(
                      controller: _yearsCtrl,
                      keyboardType: const TextInputType.numberWithOptions(decimal: true),
                      decoration: const InputDecoration(labelText: 'Years (optional)'),
                      validator: SkillValidators.validateYears,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 18),
              ElevatedButton(
                onPressed: _saving ? null : _submit,
                child: _saving
                    ? const SizedBox(
                        width: 18,
                        height: 18,
                        child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
                      )
                    : const Text('Add Skill'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _EditSkillSheet extends StatefulWidget {
  final StudentSkillModel item;
  const _EditSkillSheet({required this.item});

  @override
  State<_EditSkillSheet> createState() => _EditSkillSheetState();
}

class _EditSkillSheetState extends State<_EditSkillSheet> {
  final _formKey = GlobalKey<FormState>();
  late String _proficiency;
  late TextEditingController _yearsCtrl;
  bool _saving = false;

  @override
  void initState() {
    super.initState();
    _proficiency = widget.item.proficiency;
    _yearsCtrl = TextEditingController(
      text: widget.item.yearsOfExperience?.toString() ?? '',
    );
  }

  @override
  void dispose() {
    _yearsCtrl.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _saving = true);
    try {
      final yrs = _yearsCtrl.text.trim().isEmpty ? null : double.parse(_yearsCtrl.text.trim());
      await context.read<TechnicalSkillsService>().updateSkill(
            userSkillId: widget.item.id,
            proficiency: _proficiency,
            yearsOfExperience: yrs,
          );
      if (!mounted) return;
      Navigator.pop(context, true);
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Skill updated!'),
          backgroundColor: Color(0xFF059669),
        ),
      );
    } catch (e) {
      if (!mounted) return;
      setState(() => _saving = false);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(e.toString().replaceAll('Exception: ', ''))),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.only(
        top: 20,
        left: 20,
        right: 20,
        bottom: MediaQuery.of(context).viewInsets.bottom + 20,
      ),
      child: Form(
        key: _formKey,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text(
              'Edit ${widget.item.skill.name}',
              style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w800),
            ),
            const SizedBox(height: 16),
            DropdownButtonFormField<String>(
              value: _proficiency,
              decoration: const InputDecoration(labelText: 'Proficiency'),
              items: SkillValidators.proficiencies
                  .map((p) => DropdownMenuItem(value: p, child: Text(p)))
                  .toList(),
              validator: SkillValidators.validateProficiency,
              onChanged: (val) => setState(() => _proficiency = val ?? widget.item.proficiency),
            ),
            const SizedBox(height: 12),
            TextFormField(
              controller: _yearsCtrl,
              keyboardType: const TextInputType.numberWithOptions(decimal: true),
              decoration: const InputDecoration(labelText: 'Years of Experience'),
              validator: SkillValidators.validateYears,
            ),
            const SizedBox(height: 18),
            ElevatedButton(
              onPressed: _saving ? null : _save,
              child: _saving
                  ? const SizedBox(
                      width: 18,
                      height: 18,
                      child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
                    )
                  : const Text('Save Changes'),
            ),
          ],
        ),
      ),
    );
  }
}
