class ValidationIssueItem {
  final String level;
  final String section;
  final String? field;
  final String code;
  final String message;
  final String severity;
  final String mobileRoute;

  const ValidationIssueItem({
    required this.level,
    required this.section,
    this.field,
    required this.code,
    required this.message,
    required this.severity,
    required this.mobileRoute,
  });

  factory ValidationIssueItem.fromJson(Map<String, dynamic> json) {
    final action = json['action'] is Map<String, dynamic>
        ? json['action'] as Map<String, dynamic>
        : const <String, dynamic>{};
    return ValidationIssueItem(
      level: json['level']?.toString() ?? 'FIELD',
      section: json['section']?.toString() ?? '',
      field: json['field']?.toString(),
      code: json['code']?.toString() ?? '',
      message: json['message']?.toString() ?? '',
      severity: json['severity']?.toString() ?? 'ERROR',
      mobileRoute: action['mobile_route']?.toString() ?? '',
    );
  }
}

class ProfilePolicyStatusModel {
  final String studentId;
  final bool valid;
  final bool publishable;
  final String profileState;
  final int completenessPercentage;
  final String profileVisibility;
  final bool isPublished;
  final String visibilityOverride;
  final String visibilityOverrideReason;
  final bool requiresRepublishReview;
  final List<ValidationIssueItem> errors;
  final List<ValidationIssueItem> warnings;

  const ProfilePolicyStatusModel({
    required this.studentId,
    required this.valid,
    required this.publishable,
    required this.profileState,
    required this.completenessPercentage,
    required this.profileVisibility,
    required this.isPublished,
    required this.visibilityOverride,
    required this.visibilityOverrideReason,
    required this.requiresRepublishReview,
    required this.errors,
    required this.warnings,
  });

  factory ProfilePolicyStatusModel.fromJson(Map<String, dynamic> json) {
    final validation = json['validation'] is Map<String, dynamic>
        ? json['validation'] as Map<String, dynamic>
        : const <String, dynamic>{};
    final visibility = json['visibility'] is Map<String, dynamic>
        ? json['visibility'] as Map<String, dynamic>
        : const <String, dynamic>{};

    return ProfilePolicyStatusModel(
      studentId: json['student_id']?.toString() ?? '',
      valid: validation['valid'] == true,
      publishable: validation['publishable'] == true,
      profileState: validation['profile_state']?.toString() ?? 'DRAFT',
      completenessPercentage: (json['completeness_percentage'] as num?)?.toInt() ?? 0,
      profileVisibility: visibility['profile_visibility']?.toString() ?? 'Private',
      isPublished: visibility['is_published'] == true,
      visibilityOverride: visibility['visibility_override']?.toString() ?? 'NONE',
      visibilityOverrideReason: visibility['visibility_override_reason']?.toString() ?? '',
      requiresRepublishReview: visibility['requires_republish_review'] == true,
      errors: (validation['errors'] as List? ?? const [])
          .whereType<Map<String, dynamic>>()
          .map(ValidationIssueItem.fromJson)
          .toList(),
      warnings: (validation['warnings'] as List? ?? const [])
          .whereType<Map<String, dynamic>>()
          .map(ValidationIssueItem.fromJson)
          .toList(),
    );
  }
}
