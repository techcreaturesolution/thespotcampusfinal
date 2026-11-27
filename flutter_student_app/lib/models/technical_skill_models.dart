class ProficiencyLevelModel {
  final String code;
  final String name;
  final int order;
  final String description;
  final bool isActive;

  const ProficiencyLevelModel({
    required this.code,
    required this.name,
    required this.order,
    this.description = '',
    this.isActive = true,
  });

  factory ProficiencyLevelModel.fromJson(Map<String, dynamic> json) {
    return ProficiencyLevelModel(
      code: (json['code'] ?? '').toString(),
      name: (json['name'] ?? '').toString(),
      order: (json['order'] as num?)?.toInt() ?? 0,
      description: (json['description'] ?? '').toString(),
      isActive: json['is_active'] != false,
    );
  }
}

class SkillMasterModel {
  final String id;
  final String name;
  final String normalizedName;
  final String category;
  final String description;
  final bool isActive;

  const SkillMasterModel({
    required this.id,
    required this.name,
    required this.normalizedName,
    required this.category,
    required this.description,
    required this.isActive,
  });

  factory SkillMasterModel.fromJson(Map<String, dynamic> json) {
    return SkillMasterModel(
      id: (json['id'] ?? json['_id'] ?? '').toString(),
      name: (json['name'] ?? '').toString(),
      normalizedName: (json['normalized_name'] ?? '').toString(),
      category: (json['category'] ?? 'Other').toString(),
      description: (json['description'] ?? '').toString(),
      isActive: json['is_active'] != false,
    );
  }
}

class StudentSkillModel {
  final String id;
  final String studentId;
  final SkillMasterModel skill;
  final String proficiency;
  final int proficiencyOrder;
  final double? yearsOfExperience;
  final int displayOrder;

  const StudentSkillModel({
    required this.id,
    required this.studentId,
    required this.skill,
    required this.proficiency,
    required this.proficiencyOrder,
    this.yearsOfExperience,
    required this.displayOrder,
  });

  factory StudentSkillModel.fromJson(Map<String, dynamic> json) {
    final skillMap = json['skill'] is Map<String, dynamic>
        ? json['skill'] as Map<String, dynamic>
        : <String, dynamic>{};

    return StudentSkillModel(
      id: (json['id'] ?? json['_id'] ?? '').toString(),
      studentId: (json['student_id'] ?? '').toString(),
      skill: SkillMasterModel.fromJson(skillMap),
      proficiency: (json['proficiency'] ?? 'Intermediate').toString(),
      proficiencyOrder: (json['proficiency_order'] as num?)?.toInt() ?? 2,
      yearsOfExperience: (json['years_of_experience'] as num?)?.toDouble(),
      displayOrder: (json['display_order'] as num?)?.toInt() ?? 0,
    );
  }
}

class SkillValidators {
  static const List<ProficiencyLevelModel> proficiencyLevels = [
    ProficiencyLevelModel(
      code: 'BEGINNER',
      name: 'Beginner',
      order: 1,
      description: 'Foundational understanding and guided usage',
    ),
    ProficiencyLevelModel(
      code: 'INTERMEDIATE',
      name: 'Intermediate',
      order: 2,
      description: 'Independent practical application in projects',
    ),
    ProficiencyLevelModel(
      code: 'ADVANCED',
      name: 'Advanced',
      order: 3,
      description: 'Deep proficiency and complex problem solving',
    ),
    ProficiencyLevelModel(
      code: 'EXPERT',
      name: 'Expert',
      order: 4,
      description: 'Mastery, architecture design, and mentoring',
    ),
  ];

  static const List<String> proficiencies = [
    'Beginner',
    'Intermediate',
    'Advanced',
    'Expert',
  ];

  static int orderForProficiency(String name) {
    for (final lvl in proficiencyLevels) {
      if (lvl.name == name) return lvl.order;
    }
    return 0;
  }

  static const List<String> categories = [
    'Programming Languages',
    'Frameworks',
    'Libraries',
    'Databases',
    'Cloud',
    'DevOps',
    'Mobile',
    'Web',
    'AI/ML',
    'Data',
    'Security',
    'Testing',
    'Tools',
    'Other',
  ];

  static String? validateYears(String? value) {
    final trimmed = value?.trim() ?? '';
    if (trimmed.isEmpty) return null;
    final parsed = double.tryParse(trimmed);
    if (parsed == null || parsed < 0 || parsed > 50) {
      return 'Experience must be between 0 and 50 years';
    }
    return null;
  }

  static String? validateProficiency(String? value) {
    if (value == null || !proficiencies.contains(value)) {
      return 'Select a valid proficiency level';
    }
    return null;
  }
}
