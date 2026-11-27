class AcademicEntityRef {
  final String id;
  final String name;
  final String? code;

  const AcademicEntityRef({
    required this.id,
    required this.name,
    this.code,
  });

  factory AcademicEntityRef.fromJson(
    dynamic json, {
    required String nameKey,
    String? codeKey,
  }) {
    if (json is Map<String, dynamic>) {
      return AcademicEntityRef(
        id: (json['_id'] ?? '').toString(),
        name: (json[nameKey] ?? '').toString(),
        code: codeKey != null ? json[codeKey]?.toString() : null,
      );
    }
    return AcademicEntityRef(id: json?.toString() ?? '', name: '');
  }
}

class AcademicCompletionField {
  final String key;
  final String label;

  const AcademicCompletionField({required this.key, required this.label});

  factory AcademicCompletionField.fromJson(Map<String, dynamic> json) {
    return AcademicCompletionField(
      key: (json['key'] ?? '').toString(),
      label: (json['label'] ?? '').toString(),
    );
  }
}

class AcademicCompletion {
  final int completedCount;
  final int totalFields;
  final int percentage;
  final List<AcademicCompletionField> missingFields;
  final bool isComplete;

  const AcademicCompletion({
    required this.completedCount,
    required this.totalFields,
    required this.percentage,
    required this.missingFields,
    required this.isComplete,
  });

  factory AcademicCompletion.fromJson(Map<String, dynamic> json) {
    final missingRaw = json['missing_fields'] as List? ?? [];
    return AcademicCompletion(
      completedCount: (json['completed_count'] as num?)?.toInt() ?? 0,
      totalFields: (json['total_fields'] as num?)?.toInt() ?? 10,
      percentage: (json['percentage'] as num?)?.toInt() ?? 0,
      missingFields: missingRaw
          .whereType<Map<String, dynamic>>()
          .map(AcademicCompletionField.fromJson)
          .toList(),
      isComplete: json['is_complete'] == true,
    );
  }
}

class AcademicProfileModel {
  final String studentId;
  final String studentName;
  final String studentEmail;
  final String studentEnrollment;
  final String? universityId;
  final String? collegeId;
  final String? degreeId;
  final String? branchId;
  final AcademicEntityRef? university;
  final AcademicEntityRef? college;
  final AcademicEntityRef? degree;
  final AcademicEntityRef? branch;
  final String currentSemester;
  final String totalBacklog;
  final String academicYear;
  final String academicBatch;
  final String academicStatus;
  final double? cgpa;
  final double? percentage;
  final int? admissionYear;
  final int? expectedGraduationYear;
  final bool isVerifiedByTPO;
  final List<String> editableFields;

  const AcademicProfileModel({
    required this.studentId,
    required this.studentName,
    required this.studentEmail,
    required this.studentEnrollment,
    this.universityId,
    this.collegeId,
    this.degreeId,
    this.branchId,
    this.university,
    this.college,
    this.degree,
    this.branch,
    required this.currentSemester,
    required this.totalBacklog,
    required this.academicYear,
    required this.academicBatch,
    required this.academicStatus,
    this.cgpa,
    this.percentage,
    this.admissionYear,
    this.expectedGraduationYear,
    required this.isVerifiedByTPO,
    this.editableFields = const [],
  });

  factory AcademicProfileModel.fromJson(Map<String, dynamic> json) {
    final editableRaw = json['editable_fields'] as List? ?? [];
    return AcademicProfileModel(
      studentId: (json['student_id'] ?? '').toString(),
      studentName: (json['student_name'] ?? '').toString(),
      studentEmail: (json['student_email'] ?? '').toString(),
      studentEnrollment: (json['student_enrollment'] ?? '').toString(),
      universityId: json['university_id']?.toString(),
      collegeId: json['college_id']?.toString(),
      degreeId: json['degree_id']?.toString(),
      branchId: json['branch_id']?.toString(),
      university: json['university'] != null
          ? AcademicEntityRef.fromJson(json['university'], nameKey: 'university_name')
          : null,
      college: json['college'] != null
          ? AcademicEntityRef.fromJson(json['college'],
              nameKey: 'college_name', codeKey: 'college_code')
          : null,
      degree: json['degree'] != null
          ? AcademicEntityRef.fromJson(json['degree'],
              nameKey: 'degree_name', codeKey: 'degree_code')
          : null,
      branch: json['branch'] != null
          ? AcademicEntityRef.fromJson(json['branch'],
              nameKey: 'branch_name', codeKey: 'branch_code')
          : null,
      currentSemester: (json['student_current_sem'] ?? '').toString(),
      totalBacklog: (json['student_total_backlog'] ?? '0').toString(),
      academicYear: (json['academic_year'] ?? '').toString(),
      academicBatch: (json['academic_batch'] ?? '').toString(),
      academicStatus: (json['academic_status'] ?? 'Active').toString(),
      cgpa: (json['cgpa'] as num?)?.toDouble(),
      percentage: (json['percentage'] as num?)?.toDouble(),
      admissionYear: (json['admission_year'] as num?)?.toInt(),
      expectedGraduationYear: (json['expected_graduation_year'] as num?)?.toInt(),
      isVerifiedByTPO: json['isVerifiedByTPO'] == true,
      editableFields: editableRaw.map((e) => e.toString()).toList(),
    );
  }
}

class AcademicHistoryModel {
  final String id;
  final String stageType;
  final String institutionName;
  final String boardOrUniversity;
  final String programName;
  final String departmentName;
  final String academicYear;
  final String semesterOrYear;
  final int startYear;
  final int? endYear;
  final String scoreType;
  final String scoreValue;
  final String status;
  final String remarks;
  final bool isLocked;

  const AcademicHistoryModel({
    required this.id,
    required this.stageType,
    required this.institutionName,
    required this.boardOrUniversity,
    required this.programName,
    required this.departmentName,
    required this.academicYear,
    required this.semesterOrYear,
    required this.startYear,
    this.endYear,
    required this.scoreType,
    required this.scoreValue,
    required this.status,
    required this.remarks,
    required this.isLocked,
  });

  factory AcademicHistoryModel.fromJson(Map<String, dynamic> json) {
    return AcademicHistoryModel(
      id: (json['_id'] ?? '').toString(),
      stageType: (json['stage_type'] ?? 'Other').toString(),
      institutionName: (json['institution_name'] ?? '').toString(),
      boardOrUniversity: (json['board_or_university'] ?? '').toString(),
      programName: (json['program_name'] ?? '').toString(),
      departmentName: (json['department_name'] ?? '').toString(),
      academicYear: (json['academic_year'] ?? '').toString(),
      semesterOrYear: (json['semester_or_year'] ?? '').toString(),
      startYear: (json['start_year'] as num?)?.toInt() ?? 2020,
      endYear: (json['end_year'] as num?)?.toInt(),
      scoreType: (json['score_type'] ?? 'Percentage').toString(),
      scoreValue: (json['score_value'] ?? '').toString(),
      status: (json['status'] ?? 'Completed').toString(),
      remarks: (json['remarks'] ?? '').toString(),
      isLocked: json['is_locked'] == true,
    );
  }
}

class AcademicValidators {
  static final RegExp _academicYearRegex = RegExp(r'^(19|20)\d{2}-(\d{2}|(19|20)\d{2})$');
  static final RegExp _batchRegex = RegExp(r'^((19|20)\d{2}-(19|20)\d{2}|(19|20)\d{2}-\d{2}|(19|20)\d{2})$');

  static String? validateSemester(String? value) {
    final trimmed = value?.trim() ?? '';
    if (trimmed.isEmpty) return null;
    final numVal = int.tryParse(trimmed);
    if (numVal == null || numVal < 1 || numVal > 16) {
      return 'Semester must be between 1 and 16';
    }
    return null;
  }

  static String? validateBacklog(String? value) {
    final trimmed = value?.trim() ?? '';
    if (trimmed.isEmpty) return null;
    final numVal = int.tryParse(trimmed);
    if (numVal == null || numVal < 0 || numVal > 50) {
      return 'Backlogs must be between 0 and 50';
    }
    return null;
  }

  static String? validateAcademicYear(String? value) {
    final trimmed = value?.trim() ?? '';
    if (trimmed.isEmpty) return null;
    if (!_academicYearRegex.hasMatch(trimmed)) {
      return 'Format must be YYYY-YY or YYYY-YYYY (e.g. 2025-26)';
    }
    return null;
  }

  static String? validateBatch(String? value) {
    final trimmed = value?.trim() ?? '';
    if (trimmed.isEmpty) return null;
    if (!_batchRegex.hasMatch(trimmed)) {
      return 'Enter a valid batch (e.g. 2022-2026)';
    }
    return null;
  }

  static String? validateCgpa(String? value) {
    final trimmed = value?.trim() ?? '';
    if (trimmed.isEmpty) return null;
    final numVal = double.tryParse(trimmed);
    if (numVal == null || numVal < 0 || numVal > 10) {
      return 'CGPA must be between 0 and 10';
    }
    return null;
  }

  static String? validatePercentage(String? value) {
    final trimmed = value?.trim() ?? '';
    if (trimmed.isEmpty) return null;
    final numVal = double.tryParse(trimmed);
    if (numVal == null || numVal < 0 || numVal > 100) {
      return 'Percentage must be between 0 and 100';
    }
    return null;
  }

  static String? validateYear(String? value, {bool required = false, int? minYear}) {
    final trimmed = value?.trim() ?? '';
    if (trimmed.isEmpty) {
      return required ? 'Year is required' : null;
    }
    final year = int.tryParse(trimmed);
    if (year == null || year < 1970 || year > 2100) {
      return 'Enter a valid year (1970-2100)';
    }
    if (minYear != null && year < minYear) {
      return 'Cannot be earlier than $minYear';
    }
    return null;
  }
}
