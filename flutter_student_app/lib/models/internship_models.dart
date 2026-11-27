class InternshipLinkModel {
  final String linkType;
  final String url;
  final String label;

  InternshipLinkModel({
    required this.linkType,
    required this.url,
    this.label = '',
  });

  factory InternshipLinkModel.fromJson(Map<String, dynamic> json) {
    return InternshipLinkModel(
      linkType: json['link_type']?.toString() ?? 'OTHER',
      url: json['url']?.toString() ?? '',
      label: json['label']?.toString() ?? '',
    );
  }

  Map<String, dynamic> toJson() => {
        'link_type': linkType,
        'url': url,
        'label': label,
      };
}

class InternshipSkillRef {
  final String id;
  final String name;
  final String category;

  InternshipSkillRef({
    required this.id,
    required this.name,
    this.category = '',
  });

  factory InternshipSkillRef.fromJson(Map<String, dynamic> json) {
    return InternshipSkillRef(
      id: (json['id'] ?? json['_id'] ?? '').toString(),
      name: json['name']?.toString() ?? '',
      category: json['category']?.toString() ?? '',
    );
  }
}

class InternshipProjectRef {
  final String id;
  final String title;
  final String status;

  InternshipProjectRef({
    required this.id,
    required this.title,
    this.status = '',
  });

  factory InternshipProjectRef.fromJson(Map<String, dynamic> json) {
    return InternshipProjectRef(
      id: (json['id'] ?? json['_id'] ?? '').toString(),
      title: json['title']?.toString() ?? '',
      status: json['status']?.toString() ?? '',
    );
  }
}

class InternshipModel {
  final String id;
  final String studentId;
  final String roleTitle;
  final String organizationName;
  final String employmentType;
  final String workMode;
  final String location;
  final DateTime? startDate;
  final DateTime? endDate;
  final bool currentlyWorking;
  final String description;
  final String responsibilities;
  final String achievements;
  final String companyWebsite;
  final List<InternshipLinkModel> links;
  final List<InternshipSkillRef> skills;
  final List<InternshipProjectRef> projects;
  final String visibility;
  final String status;
  final int displayOrder;

  InternshipModel({
    required this.id,
    required this.studentId,
    required this.roleTitle,
    required this.organizationName,
    this.employmentType = 'Internship',
    this.workMode = 'Hybrid',
    this.location = '',
    this.startDate,
    this.endDate,
    this.currentlyWorking = false,
    this.description = '',
    this.responsibilities = '',
    this.achievements = '',
    this.companyWebsite = '',
    this.links = const [],
    this.skills = const [],
    this.projects = const [],
    this.visibility = 'Public',
    this.status = 'Active',
    this.displayOrder = 0,
  });

  factory InternshipModel.fromJson(Map<String, dynamic> json) {
    final rawLinks = json['links'] as List? ?? [];
    final rawSkills = json['skills'] as List? ?? [];
    final rawProjects = json['projects'] as List? ?? [];

    return InternshipModel(
      id: (json['id'] ?? json['_id'] ?? '').toString(),
      studentId: (json['student_id'] ?? '').toString(),
      roleTitle: json['role_title']?.toString() ?? '',
      organizationName: json['organization_name']?.toString() ?? '',
      employmentType: json['employment_type']?.toString() ?? 'Internship',
      workMode: json['work_mode']?.toString() ?? 'Hybrid',
      location: json['location']?.toString() ?? '',
      startDate: json['start_date'] != null
          ? DateTime.tryParse(json['start_date'].toString())
          : null,
      endDate: json['end_date'] != null
          ? DateTime.tryParse(json['end_date'].toString())
          : null,
      currentlyWorking: json['currently_working'] == true,
      description: json['description']?.toString() ?? '',
      responsibilities: json['responsibilities']?.toString() ?? '',
      achievements: json['achievements']?.toString() ?? '',
      companyWebsite: json['company_website']?.toString() ?? '',
      links: rawLinks
          .whereType<Map<String, dynamic>>()
          .map(InternshipLinkModel.fromJson)
          .toList(),
      skills: rawSkills
          .whereType<Map<String, dynamic>>()
          .map(InternshipSkillRef.fromJson)
          .toList(),
      projects: rawProjects
          .whereType<Map<String, dynamic>>()
          .map(InternshipProjectRef.fromJson)
          .toList(),
      visibility: json['visibility']?.toString() ?? 'Public',
      status: json['status']?.toString() ?? 'Active',
      displayOrder: int.tryParse(json['display_order']?.toString() ?? '0') ?? 0,
    );
  }
}

class InternshipValidators {
  static const List<String> employmentTypes = [
    'Internship',
    'Part-Time',
    'Full-Time',
    'Contract',
  ];
  static const List<String> workModes = ['Remote', 'Hybrid', 'Physical'];
  static const List<String> statuses = ['Active', 'Archived'];
  static const List<String> visibilities = ['Public', 'Institute Only', 'Private'];

  static bool isSafeHttpUrl(String raw) {
    final trimmed = raw.trim();
    if (trimmed.isEmpty) return true;
    final lower = trimmed.toLowerCase();
    if (lower.startsWith('javascript:') ||
        lower.startsWith('data:') ||
        lower.startsWith('vbscript:') ||
        lower.startsWith('file:')) {
      return false;
    }
    final uri = Uri.tryParse(trimmed);
    return uri != null &&
        (uri.scheme == 'http' || uri.scheme == 'https') &&
        uri.host.contains('.') &&
        trimmed.length <= 500;
  }

  static String? validateForm({
    required String roleTitle,
    required String organizationName,
    required DateTime? startDate,
    required DateTime? endDate,
    required bool currentlyWorking,
    required String companyWebsite,
  }) {
    if (roleTitle.trim().length < 2 || roleTitle.trim().length > 120) {
      return 'Role / job title must be between 2 and 120 characters';
    }
    if (organizationName.trim().length < 2 || organizationName.trim().length > 120) {
      return 'Organization name must be between 2 and 120 characters';
    }
    if (startDate == null) {
      return 'Start date is required';
    }
    if (!currentlyWorking) {
      if (endDate == null) {
        return 'End date is required unless currently working';
      }
      if (endDate.isBefore(startDate)) {
        return 'End date cannot be earlier than start date';
      }
    }
    if (companyWebsite.trim().isNotEmpty && !isSafeHttpUrl(companyWebsite)) {
      return 'Company website must be a valid http:// or https:// URL';
    }
    return null;
  }
}
