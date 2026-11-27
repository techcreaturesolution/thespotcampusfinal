import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../models/academic_profile_models.dart';
import '../services/academic_profile_service.dart';
import '../services/auth_service.dart';

class AcademicProfileScreen extends StatefulWidget {
  const AcademicProfileScreen({super.key});

  @override
  State<AcademicProfileScreen> createState() => _AcademicProfileScreenState();
}

class _AcademicProfileScreenState extends State<AcademicProfileScreen> {
  final _formKey = GlobalKey<FormState>();
  bool _isEditing = false;

  final _enrollmentCtrl = TextEditingController();
  final _semesterCtrl = TextEditingController();
  final _backlogCtrl = TextEditingController();
  final _academicYearCtrl = TextEditingController();
  final _batchCtrl = TextEditingController();
  final _cgpaCtrl = TextEditingController();
  final _percentageCtrl = TextEditingController();
  final _admissionYearCtrl = TextEditingController();
  final _graduationYearCtrl = TextEditingController();

  String? _selectedUniversityId;
  String? _selectedCollegeId;
  String? _selectedDegreeId;
  String? _selectedBranchId;

  List<Map<String, dynamic>> _universities = [];
  List<Map<String, dynamic>> _colleges = [];
  List<Map<String, dynamic>> _degrees = [];
  List<Map<String, dynamic>> _branches = [];

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) async {
      final service = context.read<AcademicProfileService>();
      await service.loadAcademicProfile();
      _syncControllersFromProfile(service.profile);
    });
  }

  @override
  void dispose() {
    _enrollmentCtrl.dispose();
    _semesterCtrl.dispose();
    _backlogCtrl.dispose();
    _academicYearCtrl.dispose();
    _batchCtrl.dispose();
    _cgpaCtrl.dispose();
    _percentageCtrl.dispose();
    _admissionYearCtrl.dispose();
    _graduationYearCtrl.dispose();
    super.dispose();
  }

  void _syncControllersFromProfile(AcademicProfileModel? p) {
    if (p == null) return;
    _enrollmentCtrl.text = p.studentEnrollment;
    _semesterCtrl.text = p.currentSemester;
    _backlogCtrl.text = p.totalBacklog;
    _academicYearCtrl.text = p.academicYear;
    _batchCtrl.text = p.academicBatch;
    _cgpaCtrl.text = p.cgpa != null ? p.cgpa.toString() : '';
    _percentageCtrl.text = p.percentage != null ? p.percentage.toString() : '';
    _admissionYearCtrl.text = p.admissionYear != null ? p.admissionYear.toString() : '';
    _graduationYearCtrl.text =
        p.expectedGraduationYear != null ? p.expectedGraduationYear.toString() : '';
    _selectedUniversityId = p.universityId;
    _selectedCollegeId = p.collegeId;
    _selectedDegreeId = p.degreeId;
    _selectedBranchId = p.branchId;
  }

  Future<void> _loadDropdownsForEdit(AcademicProfileModel profile) async {
    if (profile.isVerifiedByTPO) return;
    final service = context.read<AcademicProfileService>();
    try {
      final unis = await service.fetchUniversities();
      List<Map<String, dynamic>> cols = [];
      List<Map<String, dynamic>> degs = [];
      List<Map<String, dynamic>> brs = [];
      if (_selectedUniversityId != null && _selectedUniversityId!.isNotEmpty) {
        cols = await service.fetchColleges(_selectedUniversityId!);
      }
      if (_selectedCollegeId != null && _selectedCollegeId!.isNotEmpty) {
        degs = await service.fetchDegrees(_selectedCollegeId!);
      }
      if (_selectedDegreeId != null && _selectedDegreeId!.isNotEmpty) {
        brs = await service.fetchBranches(_selectedDegreeId!, _selectedCollegeId ?? '');
      }
      if (mounted) {
        setState(() {
          _universities = unis;
          _colleges = cols;
          _degrees = degs;
          _branches = brs;
        });
      }
    } catch (_) {
      // keep existing read-only labels if dropdown load fails
    }
  }

  Future<void> _saveProfile(AcademicProfileModel profile) async {
    if (!_formKey.currentState!.validate()) return;
    final service = context.read<AcademicProfileService>();
    final auth = context.read<AuthService>();

    final payload = <String, dynamic>{
      'student_current_sem': _semesterCtrl.text.trim(),
      'student_total_backlog': _backlogCtrl.text.trim().isEmpty ? '0' : _backlogCtrl.text.trim(),
      'academic_year': _academicYearCtrl.text.trim(),
      'academic_batch': _batchCtrl.text.trim(),
      'cgpa': _cgpaCtrl.text.trim().isEmpty ? null : double.tryParse(_cgpaCtrl.text.trim()),
      'percentage':
          _percentageCtrl.text.trim().isEmpty ? null : double.tryParse(_percentageCtrl.text.trim()),
      'expected_graduation_year': _graduationYearCtrl.text.trim().isEmpty
          ? null
          : int.tryParse(_graduationYearCtrl.text.trim()),
    };

    if (!profile.isVerifiedByTPO) {
      payload['student_enrollment'] = _enrollmentCtrl.text.trim();
      payload['admission_year'] = _admissionYearCtrl.text.trim().isEmpty
          ? null
          : int.tryParse(_admissionYearCtrl.text.trim());
      if (_selectedUniversityId != null && _selectedUniversityId!.isNotEmpty) {
        payload['university_id'] = _selectedUniversityId;
      }
      if (_selectedCollegeId != null && _selectedCollegeId!.isNotEmpty) {
        payload['college_id'] = _selectedCollegeId;
      }
      if (_selectedDegreeId != null && _selectedDegreeId!.isNotEmpty) {
        payload['degree_id'] = _selectedDegreeId;
      }
      if (_selectedBranchId != null && _selectedBranchId!.isNotEmpty) {
        payload['branch_id'] = _selectedBranchId;
      }
    }

    try {
      await service.updateAcademicProfile(payload);
      await auth.checkAuth();
      if (!mounted) return;
      setState(() => _isEditing = false);
      _syncControllersFromProfile(service.profile);
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Academic profile updated successfully!'),
          backgroundColor: Color(0xFF059669),
        ),
      );
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(e.toString().replaceAll('Exception: ', '')),
          backgroundColor: const Color(0xFFDC2626),
        ),
      );
    }
  }

  void _openHistorySheet({AcademicHistoryModel? existing}) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (_) => _AcademicHistorySheet(existing: existing),
    );
  }

  @override
  Widget build(BuildContext context) {
    final service = context.watch<AcademicProfileService>();
    final profile = service.profile;
    final completion = service.completion;

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        title: const Text('Academic Profile', style: TextStyle(fontWeight: FontWeight.w800)),
        backgroundColor: Colors.white,
        foregroundColor: const Color(0xFF1F2937),
      ),
      body: service.isLoading && profile == null
          ? const Center(child: CircularProgressIndicator())
          : service.errorMessage != null && profile == null
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
                          onPressed: service.loadAcademicProfile,
                          child: const Text('Retry'),
                        ),
                      ],
                    ),
                  ),
                )
              : profile == null
                  ? const Center(child: Text('No academic profile data found'))
                  : RefreshIndicator(
                      onRefresh: service.loadAcademicProfile,
                      child: SingleChildScrollView(
                        physics: const AlwaysScrollableScrollPhysics(),
                        padding: const EdgeInsets.all(16),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.stretch,
                          children: [
                            if (completion != null) _buildCompletionCard(completion, profile),
                            const SizedBox(height: 16),
                            _buildAcademicDetailsCard(profile, service),
                            const SizedBox(height: 16),
                            _buildAcademicHistoryCard(service),
                          ],
                        ),
                      ),
                    ),
    );
  }

  Widget _buildCompletionCard(AcademicCompletion completion, AcademicProfileModel profile) {
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: Colors.grey.shade200),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      profile.studentName,
                      style: const TextStyle(fontSize: 17, fontWeight: FontWeight.w800),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      '${profile.degree?.name ?? 'Degree N/A'} • ${profile.branch?.name ?? 'Branch N/A'}',
                      style: TextStyle(fontSize: 12, color: Colors.grey.shade600),
                    ),
                  ],
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                decoration: BoxDecoration(
                  color: profile.isVerifiedByTPO ? const Color(0xFFECFDF5) : const Color(0xFFFFFBEB),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Text(
                  profile.isVerifiedByTPO ? 'TPO Verified' : 'Pending Verification',
                  style: TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.w700,
                    color: profile.isVerifiedByTPO
                        ? const Color(0xFF059669)
                        : const Color(0xFFD97706),
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text('Profile Completion', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 13)),
              Text(
                '${completion.percentage}%',
                style: const TextStyle(
                  fontWeight: FontWeight.w900,
                  color: Color(0xFF2563EB),
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          ClipRRect(
            borderRadius: BorderRadius.circular(8),
            child: LinearProgressIndicator(
              value: completion.percentage / 100,
              minHeight: 8,
              backgroundColor: Colors.grey.shade200,
              color: const Color(0xFF2563EB),
            ),
          ),
          if (completion.missingFields.isNotEmpty) ...[
            const SizedBox(height: 10),
            Wrap(
              spacing: 6,
              runSpacing: 6,
              children: completion.missingFields
                  .map(
                    (f) => Chip(
                      label: Text(f.label, style: const TextStyle(fontSize: 11)),
                      backgroundColor: const Color(0xFFFFFBEB),
                      side: const BorderSide(color: Color(0xFFFDE68A)),
                      visualDensity: VisualDensity.compact,
                    ),
                  )
                  .toList(),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildAcademicDetailsCard(AcademicProfileModel profile, AcademicProfileService service) {
    final locked = profile.isVerifiedByTPO;
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: Colors.grey.shade200),
      ),
      child: Form(
        key: _formKey,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text(
                  'Academic Details',
                  style: TextStyle(fontSize: 16, fontWeight: FontWeight.w800),
                ),
                if (!_isEditing)
                  TextButton.icon(
                    onPressed: () {
                      _syncControllersFromProfile(profile);
                      setState(() => _isEditing = true);
                      _loadDropdownsForEdit(profile);
                    },
                    icon: const Icon(Icons.edit, size: 16),
                    label: const Text('Edit'),
                  ),
              ],
            ),
            if (locked)
              Container(
                margin: const EdgeInsets.only(top: 6, bottom: 12),
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: const Color(0xFFEFF6FF),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: const Text(
                  'Institutional details are locked after TPO verification. You can edit semester, backlogs, academic year, batch, CGPA, and percentage.',
                  style: TextStyle(fontSize: 11, color: Color(0xFF1E40AF)),
                ),
              ),
            const SizedBox(height: 8),
            if (!_isEditing || locked) ...[
              _infoTile('University', profile.university?.name ?? '—'),
              _infoTile('College', profile.college?.name ?? '—'),
              _infoTile('Degree', profile.degree?.name ?? '—'),
              _infoTile('Branch', profile.branch?.name ?? '—'),
              _infoTile('Academic Status', profile.academicStatus),
            ] else ...[
              DropdownButtonFormField<String>(
                value: _universities.any((u) => u['_id'] == _selectedUniversityId)
                    ? _selectedUniversityId
                    : null,
                decoration: const InputDecoration(labelText: 'University'),
                items: _universities
                    .map((u) => DropdownMenuItem(
                          value: u['_id'].toString(),
                          child: Text(u['university_name'].toString()),
                        ))
                    .toList(),
                onChanged: (val) async {
                  setState(() {
                    _selectedUniversityId = val;
                    _selectedCollegeId = null;
                    _selectedDegreeId = null;
                    _selectedBranchId = null;
                    _colleges = [];
                    _degrees = [];
                    _branches = [];
                  });
                  if (val != null) {
                    final cols = await service.fetchColleges(val);
                    if (mounted) setState(() => _colleges = cols);
                  }
                },
              ),
              const SizedBox(height: 12),
              DropdownButtonFormField<String>(
                value: _colleges.any((c) => c['_id'] == _selectedCollegeId) ? _selectedCollegeId : null,
                decoration: const InputDecoration(labelText: 'College'),
                items: _colleges
                    .map((c) => DropdownMenuItem(
                          value: c['_id'].toString(),
                          child: Text(c['college_name'].toString()),
                        ))
                    .toList(),
                onChanged: (val) async {
                  setState(() {
                    _selectedCollegeId = val;
                    _selectedDegreeId = null;
                    _selectedBranchId = null;
                    _degrees = [];
                    _branches = [];
                  });
                  if (val != null) {
                    final degs = await service.fetchDegrees(val);
                    if (mounted) setState(() => _degrees = degs);
                  }
                },
              ),
              const SizedBox(height: 12),
              DropdownButtonFormField<String>(
                value: _degrees.any((d) => d['_id'] == _selectedDegreeId) ? _selectedDegreeId : null,
                decoration: const InputDecoration(labelText: 'Degree'),
                items: _degrees
                    .map((d) => DropdownMenuItem(
                          value: d['_id'].toString(),
                          child: Text(d['degree_name'].toString()),
                        ))
                    .toList(),
                onChanged: (val) async {
                  setState(() {
                    _selectedDegreeId = val;
                    _selectedBranchId = null;
                    _branches = [];
                  });
                  if (val != null) {
                    final brs = await service.fetchBranches(val, _selectedCollegeId ?? '');
                    if (mounted) setState(() => _branches = brs);
                  }
                },
              ),
              const SizedBox(height: 12),
              DropdownButtonFormField<String>(
                value: _branches.any((b) => b['_id'] == _selectedBranchId) ? _selectedBranchId : null,
                decoration: const InputDecoration(labelText: 'Branch'),
                items: _branches
                    .map((b) => DropdownMenuItem(
                          value: b['_id'].toString(),
                          child: Text(b['branch_name'].toString()),
                        ))
                    .toList(),
                onChanged: (val) => setState(() => _selectedBranchId = val),
              ),
              const SizedBox(height: 12),
            ],
            TextFormField(
              controller: _enrollmentCtrl,
              enabled: _isEditing && !locked,
              decoration: const InputDecoration(labelText: 'Enrollment Number'),
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(
                  child: TextFormField(
                    controller: _academicYearCtrl,
                    enabled: _isEditing,
                    decoration: const InputDecoration(
                      labelText: 'Academic Year',
                      hintText: '2025-26',
                    ),
                    validator: AcademicValidators.validateAcademicYear,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: TextFormField(
                    controller: _batchCtrl,
                    enabled: _isEditing,
                    decoration: const InputDecoration(
                      labelText: 'Batch',
                      hintText: '2022-2026',
                    ),
                    validator: AcademicValidators.validateBatch,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(
                  child: TextFormField(
                    controller: _semesterCtrl,
                    enabled: _isEditing,
                    keyboardType: TextInputType.number,
                    decoration: const InputDecoration(labelText: 'Current Semester'),
                    validator: AcademicValidators.validateSemester,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: TextFormField(
                    controller: _backlogCtrl,
                    enabled: _isEditing,
                    keyboardType: TextInputType.number,
                    decoration: const InputDecoration(labelText: 'Total Backlogs'),
                    validator: AcademicValidators.validateBacklog,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(
                  child: TextFormField(
                    controller: _cgpaCtrl,
                    enabled: _isEditing,
                    keyboardType: const TextInputType.numberWithOptions(decimal: true),
                    decoration: const InputDecoration(labelText: 'CGPA (0-10)'),
                    validator: AcademicValidators.validateCgpa,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: TextFormField(
                    controller: _percentageCtrl,
                    enabled: _isEditing,
                    keyboardType: const TextInputType.numberWithOptions(decimal: true),
                    decoration: const InputDecoration(labelText: 'Percentage (0-100)'),
                    validator: AcademicValidators.validatePercentage,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(
                  child: TextFormField(
                    controller: _admissionYearCtrl,
                    enabled: _isEditing && !locked,
                    keyboardType: TextInputType.number,
                    decoration: const InputDecoration(labelText: 'Admission Year'),
                    validator: (v) => AcademicValidators.validateYear(v),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: TextFormField(
                    controller: _graduationYearCtrl,
                    enabled: _isEditing,
                    keyboardType: TextInputType.number,
                    decoration: const InputDecoration(labelText: 'Expected Graduation'),
                    validator: (v) => AcademicValidators.validateYear(
                      v,
                      minYear: int.tryParse(_admissionYearCtrl.text.trim()),
                    ),
                  ),
                ),
              ],
            ),
            if (_isEditing) ...[
              const SizedBox(height: 18),
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton(
                      onPressed: service.isSaving
                          ? null
                          : () {
                              _syncControllersFromProfile(profile);
                              setState(() => _isEditing = false);
                            },
                      child: const Text('Cancel'),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: ElevatedButton(
                      onPressed: service.isSaving ? null : () => _saveProfile(profile),
                      child: service.isSaving
                          ? const SizedBox(
                              width: 18,
                              height: 18,
                              child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
                            )
                          : const Text('Save'),
                    ),
                  ),
                ],
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _infoTile(String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: TextStyle(fontSize: 12, color: Colors.grey.shade600)),
          const SizedBox(width: 12),
          Flexible(
            child: Text(
              value,
              textAlign: TextAlign.right,
              style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w700),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildAcademicHistoryCard(AcademicProfileService service) {
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: Colors.grey.shade200),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                'Academic History',
                style: TextStyle(fontSize: 16, fontWeight: FontWeight.w800),
              ),
              ElevatedButton.icon(
                onPressed: () => _openHistorySheet(),
                icon: const Icon(Icons.add, size: 16),
                label: const Text('Add'),
                style: ElevatedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          if (service.history.isEmpty)
            const Padding(
              padding: EdgeInsets.symmetric(vertical: 16),
              child: Text(
                'No academic history records yet. Add your 10th, 12th, or Diploma records.',
                style: TextStyle(color: Colors.grey, fontSize: 13),
                textAlign: TextAlign.center,
              ),
            )
          else
            ...service.history.map((item) => Container(
                  margin: const EdgeInsets.only(bottom: 10),
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: const Color(0xFFF9FAFB),
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(color: Colors.grey.shade200),
                  ),
                  child: Row(
                    children: [
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              '${item.stageType} • ${item.institutionName}',
                              style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 13),
                            ),
                            const SizedBox(height: 3),
                            Text(
                              '${item.startYear} - ${item.endYear ?? 'Present'} • ${item.status}${item.scoreValue.isNotEmpty ? ' • ${item.scoreType}: ${item.scoreValue}' : ''}',
                              style: TextStyle(fontSize: 11, color: Colors.grey.shade600),
                            ),
                          ],
                        ),
                      ),
                      if (!item.isLocked) ...[
                        IconButton(
                          icon: const Icon(Icons.edit_outlined, size: 18),
                          onPressed: () => _openHistorySheet(existing: item),
                        ),
                        IconButton(
                          icon: const Icon(Icons.delete_outline, color: Colors.red, size: 18),
                          onPressed: () async {
                            try {
                              await service.deleteHistory(item.id);
                              if (!mounted) return;
                              ScaffoldMessenger.of(context).showSnackBar(
                                const SnackBar(content: Text('History record deleted')),
                              );
                            } catch (e) {
                              if (!mounted) return;
                              ScaffoldMessenger.of(context).showSnackBar(
                                SnackBar(content: Text(e.toString())),
                              );
                            }
                          },
                        ),
                      ] else
                        const Icon(Icons.lock_outline, size: 16, color: Colors.grey),
                    ],
                  ),
                )),
        ],
      ),
    );
  }
}

class _AcademicHistorySheet extends StatefulWidget {
  final AcademicHistoryModel? existing;
  const _AcademicHistorySheet({this.existing});

  @override
  State<_AcademicHistorySheet> createState() => _AcademicHistorySheetState();
}

class _AcademicHistorySheetState extends State<_AcademicHistorySheet> {
  final _formKey = GlobalKey<FormState>();
  late String _stageType;
  late String _scoreType;
  late String _status;
  late TextEditingController _institutionCtrl;
  late TextEditingController _boardCtrl;
  late TextEditingController _programCtrl;
  late TextEditingController _startYearCtrl;
  late TextEditingController _endYearCtrl;
  late TextEditingController _scoreValCtrl;
  bool _saving = false;

  @override
  void initState() {
    super.initState();
    final e = widget.existing;
    _stageType = e?.stageType ?? '12th';
    _scoreType = e?.scoreType ?? 'Percentage';
    _status = e?.status ?? 'Completed';
    _institutionCtrl = TextEditingController(text: e?.institutionName ?? '');
    _boardCtrl = TextEditingController(text: e?.boardOrUniversity ?? '');
    _programCtrl = TextEditingController(text: e?.programName ?? '');
    _startYearCtrl = TextEditingController(text: e != null ? e.startYear.toString() : '');
    _endYearCtrl = TextEditingController(text: e?.endYear?.toString() ?? '');
    _scoreValCtrl = TextEditingController(text: e?.scoreValue ?? '');
  }

  @override
  void dispose() {
    _institutionCtrl.dispose();
    _boardCtrl.dispose();
    _programCtrl.dispose();
    _startYearCtrl.dispose();
    _endYearCtrl.dispose();
    _scoreValCtrl.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _saving = true);
    final service = context.read<AcademicProfileService>();
    final payload = {
      'stage_type': _stageType,
      'institution_name': _institutionCtrl.text.trim(),
      'board_or_university': _boardCtrl.text.trim(),
      'program_name': _programCtrl.text.trim(),
      'start_year': int.parse(_startYearCtrl.text.trim()),
      'end_year': _endYearCtrl.text.trim().isEmpty ? null : int.parse(_endYearCtrl.text.trim()),
      'score_type': _scoreType,
      'score_value': _scoreValCtrl.text.trim(),
      'status': _status,
    };

    try {
      if (widget.existing != null) {
        await service.updateHistory(widget.existing!.id, payload);
      } else {
        await service.addHistory(payload);
      }
      if (!mounted) return;
      Navigator.pop(context);
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Academic history saved!'),
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
        child: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Text(
                widget.existing != null ? 'Edit Academic Record' : 'Add Academic Record',
                style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w800),
              ),
              const SizedBox(height: 16),
              DropdownButtonFormField<String>(
                value: _stageType,
                decoration: const InputDecoration(labelText: 'Stage'),
                items: ['10th', '12th', 'Diploma', 'Undergraduate', 'Postgraduate', 'Other']
                    .map((s) => DropdownMenuItem(value: s, child: Text(s)))
                    .toList(),
                onChanged: (v) => setState(() => _stageType = v ?? '12th'),
              ),
              const SizedBox(height: 12),
              TextFormField(
                controller: _institutionCtrl,
                decoration: const InputDecoration(labelText: 'Institution / School Name *'),
                validator: (v) =>
                    (v == null || v.trim().length < 2) ? 'Institution name is required' : null,
              ),
              const SizedBox(height: 12),
              TextFormField(
                controller: _boardCtrl,
                decoration: const InputDecoration(labelText: 'Board / University'),
              ),
              const SizedBox(height: 12),
              TextFormField(
                controller: _programCtrl,
                decoration: const InputDecoration(labelText: 'Program / Stream'),
              ),
              const SizedBox(height: 12),
              Row(
                children: [
                  Expanded(
                    child: TextFormField(
                      controller: _startYearCtrl,
                      keyboardType: TextInputType.number,
                      decoration: const InputDecoration(labelText: 'Start Year *'),
                      validator: (v) => AcademicValidators.validateYear(v, required: true),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: TextFormField(
                      controller: _endYearCtrl,
                      keyboardType: TextInputType.number,
                      decoration: const InputDecoration(labelText: 'End Year'),
                      validator: (v) => AcademicValidators.validateYear(
                        v,
                        minYear: int.tryParse(_startYearCtrl.text.trim()),
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              Row(
                children: [
                  Expanded(
                    child: DropdownButtonFormField<String>(
                      value: _scoreType,
                      decoration: const InputDecoration(labelText: 'Score Type'),
                      items: ['Percentage', 'CGPA', 'Grade']
                          .map((s) => DropdownMenuItem(value: s, child: Text(s)))
                          .toList(),
                      onChanged: (v) => setState(() => _scoreType = v ?? 'Percentage'),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: TextFormField(
                      controller: _scoreValCtrl,
                      decoration: const InputDecoration(labelText: 'Score'),
                      validator: (v) {
                        if (_scoreType == 'CGPA') return AcademicValidators.validateCgpa(v);
                        if (_scoreType == 'Percentage') return AcademicValidators.validatePercentage(v);
                        return null;
                      },
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              DropdownButtonFormField<String>(
                value: _status,
                decoration: const InputDecoration(labelText: 'Status'),
                items: ['Completed', 'Transferred', 'Pursuing', 'Discontinued']
                    .map((s) => DropdownMenuItem(value: s, child: Text(s)))
                    .toList(),
                onChanged: (v) => setState(() => _status = v ?? 'Completed'),
              ),
              const SizedBox(height: 20),
              ElevatedButton(
                onPressed: _saving ? null : _submit,
                child: _saving
                    ? const SizedBox(
                        width: 18,
                        height: 18,
                        child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
                      )
                    : const Text('Save Record'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
