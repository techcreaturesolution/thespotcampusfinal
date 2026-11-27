class ResumeSectionConfig {
  final String sectionKey;
  final bool enabled;
  final int order;

  ResumeSectionConfig({
    required this.sectionKey,
    this.enabled = true,
    this.order = 0,
  });

  factory ResumeSectionConfig.fromJson(Map<String, dynamic> json) {
    return ResumeSectionConfig(
      sectionKey: json['section_key']?.toString() ?? 'summary',
      enabled: json['enabled'] != false,
      order: int.tryParse(json['order']?.toString() ?? '0') ?? 0,
    );
  }

  Map<String, dynamic> toJson() => {
        'section_key': sectionKey,
        'enabled': enabled,
        'order': order,
      };
}

class ResumeVersionModel {
  final String id;
  final String studentId;
  final String name;
  final String description;
  final String targetRole;
  final String summary;
  final String? templateId;
  final String templateName;
  final String fontFamily;
  final String colorTheme;
  final String layoutColumns;
  final String pageMargin;
  final List<ResumeSectionConfig> sectionConfig;
  final List<String> selectedSkillIds;
  final List<String> selectedProjectIds;
  final List<String> selectedCertificationIds;
  final List<String> selectedInternshipIds;
  final List<String> selectedEducationIds;
  final bool includeAcademicSummary;
  final bool includeSkillProficiency;
  final bool includeProjectLinks;
  final String status;
  final String visibility;
  final bool isDefault;
  final bool shareEnabled;
  final String? shareToken;

  ResumeVersionModel({
    required this.id,
    required this.studentId,
    required this.name,
    this.description = '',
    this.targetRole = '',
    this.summary = '',
    this.templateId,
    this.templateName = '',
    this.fontFamily = 'Inter',
    this.colorTheme = '#3730a3',
    this.layoutColumns = 'two_column_left',
    this.pageMargin = 'medium',
    this.sectionConfig = const [],
    this.selectedSkillIds = const [],
    this.selectedProjectIds = const [],
    this.selectedCertificationIds = const [],
    this.selectedInternshipIds = const [],
    this.selectedEducationIds = const [],
    this.includeAcademicSummary = true,
    this.includeSkillProficiency = true,
    this.includeProjectLinks = true,
    this.status = 'Active',
    this.visibility = 'Private',
    this.isDefault = false,
    this.shareEnabled = false,
    this.shareToken,
  });

  factory ResumeVersionModel.fromJson(Map<String, dynamic> json) {
    final rawSections = json['section_config'] as List? ?? [];
    return ResumeVersionModel(
      id: (json['id'] ?? json['_id'] ?? '').toString(),
      studentId: (json['student_id'] ?? '').toString(),
      name: json['name']?.toString() ?? '',
      description: json['description']?.toString() ?? '',
      targetRole: json['target_role']?.toString() ?? '',
      summary: json['summary']?.toString() ?? '',
      templateId: json['template_id']?.toString(),
      templateName: json['template_name']?.toString() ?? '',
      fontFamily: json['font_family']?.toString() ?? 'Inter',
      colorTheme: json['color_theme']?.toString() ?? '#3730a3',
      layoutColumns: json['layout_columns']?.toString() ?? 'two_column_left',
      pageMargin: json['page_margin']?.toString() ?? 'medium',
      sectionConfig: rawSections
          .whereType<Map<String, dynamic>>()
          .map(ResumeSectionConfig.fromJson)
          .toList(),
      selectedSkillIds: (json['selected_skill_ids'] as List? ?? []).map((e) => e.toString()).toList(),
      selectedProjectIds:
          (json['selected_project_ids'] as List? ?? []).map((e) => e.toString()).toList(),
      selectedCertificationIds:
          (json['selected_certification_ids'] as List? ?? []).map((e) => e.toString()).toList(),
      selectedInternshipIds:
          (json['selected_internship_ids'] as List? ?? []).map((e) => e.toString()).toList(),
      selectedEducationIds:
          (json['selected_education_ids'] as List? ?? []).map((e) => e.toString()).toList(),
      includeAcademicSummary: json['include_academic_summary'] != false,
      includeSkillProficiency: json['include_skill_proficiency'] != false,
      includeProjectLinks: json['include_project_links'] != false,
      status: json['status']?.toString() ?? 'Active',
      visibility: json['visibility']?.toString() ?? 'Private',
      isDefault: json['is_default'] == true,
      shareEnabled: json['share_enabled'] == true,
      shareToken: json['share_token']?.toString(),
    );
  }
}

class ResumeVersionValidators {
  static const List<String> fontFamilies = [
    'Inter',
    'Outfit',
    'Playfair Display',
    'Roboto',
  ];
  static const List<String> statuses = ['Active', 'Archived'];
  static const List<String> visibilities = ['Private', 'Institute Only', 'Public', 'Shared'];

  static String? validateName(String name) {
    final trimmed = name.trim();
    if (trimmed.length < 2 || trimmed.length > 120) {
      return 'Resume name must be between 2 and 120 characters';
    }
    return null;
  }
}
