class CompletenessAction {
  final String label;
  final String webPath;
  final String mobileRoute;

  const CompletenessAction({
    required this.label,
    required this.webPath,
    required this.mobileRoute,
  });

  factory CompletenessAction.fromJson(Map<String, dynamic>? json) {
    final map = json ?? const <String, dynamic>{};
    return CompletenessAction(
      label: map['label']?.toString() ?? 'Complete Section',
      webPath: map['web_path']?.toString() ?? '',
      mobileRoute: map['mobile_route']?.toString() ?? '',
    );
  }
}

class CompletenessMissingItem {
  final String sectionKey;
  final String key;
  final String label;
  final CompletenessAction action;

  const CompletenessMissingItem({
    required this.sectionKey,
    required this.key,
    required this.label,
    required this.action,
  });

  factory CompletenessMissingItem.fromJson(Map<String, dynamic> json) {
    return CompletenessMissingItem(
      sectionKey: json['section_key']?.toString() ?? '',
      key: json['key']?.toString() ?? '',
      label: json['label']?.toString() ?? '',
      action: CompletenessAction.fromJson(
        json['action'] is Map<String, dynamic> ? json['action'] as Map<String, dynamic> : null,
      ),
    );
  }
}

class CompletenessSection {
  final String key;
  final String title;
  final List<String> featureRefs;
  final double weight;
  final double earnedWeight;
  final int percentage;
  final bool applicable;
  final bool requiredSection;
  final bool isOptional;
  final bool isComplete;
  final String status;
  final int completedItems;
  final int totalItems;
  final String criteriaSummary;
  final CompletenessAction action;

  const CompletenessSection({
    required this.key,
    required this.title,
    required this.featureRefs,
    required this.weight,
    required this.earnedWeight,
    required this.percentage,
    required this.applicable,
    required this.requiredSection,
    required this.isOptional,
    required this.isComplete,
    required this.status,
    required this.completedItems,
    required this.totalItems,
    required this.criteriaSummary,
    required this.action,
  });

  factory CompletenessSection.fromJson(Map<String, dynamic> json) {
    return CompletenessSection(
      key: json['key']?.toString() ?? '',
      title: json['title']?.toString() ?? '',
      featureRefs: (json['feature_refs'] as List? ?? const [])
          .map((e) => e.toString())
          .toList(),
      weight: (json['weight'] as num?)?.toDouble() ?? 0.0,
      earnedWeight: (json['earned_weight'] as num?)?.toDouble() ?? 0.0,
      percentage: (json['percentage'] as num?)?.toInt() ?? 0,
      applicable: json['applicable'] == true,
      requiredSection: json['required'] == true,
      isOptional: json['is_optional'] == true,
      isComplete: json['is_complete'] == true,
      status: json['status']?.toString() ?? '',
      completedItems: (json['completed_items'] as num?)?.toInt() ?? 0,
      totalItems: (json['total_items'] as num?)?.toInt() ?? 0,
      criteriaSummary: json['criteria_summary']?.toString() ?? '',
      action: CompletenessAction.fromJson(
        json['action'] is Map<String, dynamic> ? json['action'] as Map<String, dynamic> : null,
      ),
    );
  }
}

class ProfileCompletenessModel {
  final String formulaVersion;
  final String targetRole;
  final int percentage;
  final double rawPercentage;
  final double earnedWeight;
  final double applicableWeight;
  final bool isComplete;
  final String statusBand;
  final String statusLabel;
  final int completedSections;
  final int totalApplicableSections;
  final List<CompletenessSection> sections;
  final List<CompletenessMissingItem> missingItems;
  final List<CompletenessMissingItem> recommendations;

  const ProfileCompletenessModel({
    required this.formulaVersion,
    required this.targetRole,
    required this.percentage,
    required this.rawPercentage,
    required this.earnedWeight,
    required this.applicableWeight,
    required this.isComplete,
    required this.statusBand,
    required this.statusLabel,
    required this.completedSections,
    required this.totalApplicableSections,
    required this.sections,
    required this.missingItems,
    required this.recommendations,
  });

  factory ProfileCompletenessModel.fromJson(Map<String, dynamic> json) {
    return ProfileCompletenessModel(
      formulaVersion: json['formula_version']?.toString() ?? '',
      targetRole: json['target_role']?.toString() ?? 'Student',
      percentage: (json['percentage'] as num?)?.toInt() ?? 0,
      rawPercentage: (json['raw_percentage'] as num?)?.toDouble() ?? 0.0,
      earnedWeight: (json['earned_weight'] as num?)?.toDouble() ?? 0.0,
      applicableWeight: (json['applicable_weight'] as num?)?.toDouble() ?? 0.0,
      isComplete: json['is_complete'] == true,
      statusBand: json['status_band']?.toString() ?? 'EMPTY',
      statusLabel: json['status_label']?.toString() ?? 'Empty',
      completedSections: (json['completed_sections'] as num?)?.toInt() ?? 0,
      totalApplicableSections: (json['total_applicable_sections'] as num?)?.toInt() ?? 0,
      sections: (json['sections'] as List? ?? const [])
          .whereType<Map<String, dynamic>>()
          .map(CompletenessSection.fromJson)
          .toList(),
      missingItems: (json['missing_items'] as List? ?? const [])
          .whereType<Map<String, dynamic>>()
          .map(CompletenessMissingItem.fromJson)
          .toList(),
      recommendations: (json['recommendations'] as List? ?? const [])
          .whereType<Map<String, dynamic>>()
          .map(CompletenessMissingItem.fromJson)
          .toList(),
    );
  }
}
