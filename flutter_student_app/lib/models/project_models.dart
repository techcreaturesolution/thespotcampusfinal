class ProjectLinkTypeMeta {
  final String code;
  final String label;
  final bool singlePerProject;
  final List<String>? allowedHosts;

  const ProjectLinkTypeMeta({
    required this.code,
    required this.label,
    this.singlePerProject = false,
    this.allowedHosts,
  });
}

class ProjectLinkModel {
  final String id;
  final String linkType;
  final String label;
  final String url;
  final int displayOrder;

  const ProjectLinkModel({
    this.id = '',
    required this.linkType,
    required this.label,
    required this.url,
    this.displayOrder = 0,
  });

  factory ProjectLinkModel.fromJson(Map<String, dynamic> json) {
    return ProjectLinkModel(
      id: (json['id'] ?? json['_id'] ?? '').toString(),
      linkType: (json['link_type'] ?? 'PROJECT_WEBSITE').toString(),
      label: (json['label'] ?? '').toString(),
      url: (json['url'] ?? '').toString(),
      displayOrder: (json['display_order'] as num?)?.toInt() ?? 0,
    );
  }

  Map<String, dynamic> toPayload() => {
        'link_type': linkType,
        'url': url,
        'label': label,
      };
}

class ProjectSkillRef {
  final String id;
  final String name;
  final String category;

  const ProjectSkillRef({
    required this.id,
    required this.name,
    required this.category,
  });

  factory ProjectSkillRef.fromJson(Map<String, dynamic> json) {
    return ProjectSkillRef(
      id: (json['id'] ?? json['_id'] ?? '').toString(),
      name: (json['name'] ?? '').toString(),
      category: (json['category'] ?? 'Other').toString(),
    );
  }
}

class ProjectModel {
  final String id;
  final String studentId;
  final String title;
  final String description;
  final String role;
  final String status;
  final String visibility;
  final bool isOngoing;
  final DateTime? startDate;
  final DateTime? endDate;
  final int teamSize;
  final String projectUrl;
  final String repositoryUrl;
  final String liveDemoUrl;
  final int displayOrder;
  final List<ProjectSkillRef> skills;
  final List<ProjectLinkModel> links;

  const ProjectModel({
    required this.id,
    required this.studentId,
    required this.title,
    required this.description,
    required this.role,
    required this.status,
    required this.visibility,
    required this.isOngoing,
    this.startDate,
    this.endDate,
    required this.teamSize,
    required this.projectUrl,
    required this.repositoryUrl,
    required this.liveDemoUrl,
    required this.displayOrder,
    required this.skills,
    this.links = const [],
  });

  factory ProjectModel.fromJson(Map<String, dynamic> json) {
    final skillsRaw = json['skills'] as List? ?? [];
    final linksRaw = json['links'] as List? ?? [];
    return ProjectModel(
      id: (json['id'] ?? json['_id'] ?? '').toString(),
      studentId: (json['student_id'] ?? '').toString(),
      title: (json['title'] ?? '').toString(),
      description: (json['description'] ?? '').toString(),
      role: (json['role'] ?? '').toString(),
      status: (json['status'] ?? 'Completed').toString(),
      visibility: (json['visibility'] ?? 'Public').toString(),
      isOngoing: json['is_ongoing'] == true,
      startDate: json['start_date'] != null ? DateTime.tryParse(json['start_date'].toString()) : null,
      endDate: json['end_date'] != null ? DateTime.tryParse(json['end_date'].toString()) : null,
      teamSize: (json['team_size'] as num?)?.toInt() ?? 1,
      projectUrl: (json['project_url'] ?? '').toString(),
      repositoryUrl: (json['repository_url'] ?? '').toString(),
      liveDemoUrl: (json['live_demo_url'] ?? '').toString(),
      displayOrder: (json['display_order'] as num?)?.toInt() ?? 0,
      skills: skillsRaw.whereType<Map<String, dynamic>>().map(ProjectSkillRef.fromJson).toList(),
      links: linksRaw.whereType<Map<String, dynamic>>().map(ProjectLinkModel.fromJson).toList(),
    );
  }
}

class ProjectValidators {
  static const List<String> statuses = ['Planned', 'In Progress', 'Completed', 'Archived'];
  static const List<String> visibilities = ['Public', 'College Only', 'Private'];

  static const List<ProjectLinkTypeMeta> linkTypes = [
    ProjectLinkTypeMeta(
      code: 'GITHUB_REPOSITORY',
      label: 'GitHub Repository',
      singlePerProject: true,
      allowedHosts: ['github.com', 'www.github.com'],
    ),
    ProjectLinkTypeMeta(
      code: 'GITLAB_REPOSITORY',
      label: 'GitLab Repository',
      allowedHosts: ['gitlab.com', 'www.gitlab.com'],
    ),
    ProjectLinkTypeMeta(
      code: 'BITBUCKET_REPOSITORY',
      label: 'Bitbucket Repository',
      allowedHosts: ['bitbucket.org', 'www.bitbucket.org'],
    ),
    ProjectLinkTypeMeta(code: 'LIVE_DEMO', label: 'Live Demo'),
    ProjectLinkTypeMeta(code: 'PROJECT_WEBSITE', label: 'Project Website'),
    ProjectLinkTypeMeta(code: 'DOCUMENTATION', label: 'Documentation'),
  ];

  static String? validateProviderLink(String linkType, String? rawUrl) {
    final trimmed = rawUrl?.trim() ?? '';
    if (trimmed.isEmpty) return 'URL is required';
    if (!isSafeHttpUrl(trimmed)) return 'Enter a valid http:// or https:// URL';

    final meta = linkTypes.where((t) => t.code == linkType).firstOrNull;
    if (meta == null) return 'Unsupported link type';

    final uri = Uri.parse(trimmed);
    if (meta.allowedHosts != null) {
      if (uri.scheme != 'https') {
        return '${meta.label} must use https://';
      }
      if (!meta.allowedHosts!.contains(uri.host.toLowerCase())) {
        return '${meta.label} host must be ${meta.allowedHosts!.first}';
      }
      if (uri.pathSegments.where((s) => s.isNotEmpty).length < 2) {
        return 'Include owner and repository (e.g. https://${meta.allowedHosts!.first}/owner/repo)';
      }
    }
    return null;
  }

  static bool isSafeHttpUrl(String? raw) {
    if (raw == null || raw.trim().isEmpty) return false;
    final trimmed = raw.trim();
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
        uri.host.contains('.');
  }

  static String? validateTitle(String? value) {
    final trimmed = value?.trim() ?? '';
    if (trimmed.length < 2 || trimmed.length > 120) {
      return 'Title must be between 2 and 120 characters';
    }
    return null;
  }

  static String? validateDescription(String? value) {
    final trimmed = value?.trim() ?? '';
    if (trimmed.length < 10 || trimmed.length > 2000) {
      return 'Description must be between 10 and 2000 characters';
    }
    return null;
  }

  static String? validateOptionalUrl(String? value) {
    final trimmed = value?.trim() ?? '';
    if (trimmed.isEmpty) return null;
    if (!isSafeHttpUrl(trimmed)) {
      return 'Enter a valid http:// or https:// URL';
    }
    return null;
  }

  static String? validateTeamSize(String? value) {
    final trimmed = value?.trim() ?? '';
    if (trimmed.isEmpty) return null;
    final numVal = int.tryParse(trimmed);
    if (numVal == null || numVal < 1 || numVal > 100) {
      return 'Team size must be between 1 and 100';
    }
    return null;
  }
}
