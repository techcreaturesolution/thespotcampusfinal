class CertificateAttachmentModel {
  final String originalName;
  final String mimeType;
  final int sizeBytes;
  final String downloadPath;

  CertificateAttachmentModel({
    required this.originalName,
    required this.mimeType,
    required this.sizeBytes,
    required this.downloadPath,
  });

  factory CertificateAttachmentModel.fromJson(Map<String, dynamic> json) {
    return CertificateAttachmentModel(
      originalName: json['original_name']?.toString() ?? 'certificate',
      mimeType: json['mime_type']?.toString() ?? 'application/pdf',
      sizeBytes: int.tryParse(json['size_bytes']?.toString() ?? '0') ?? 0,
      downloadPath: json['download_path']?.toString() ?? '',
    );
  }
}

class CertificationModel {
  final String id;
  final String studentId;
  final String title;
  final String issuingOrganization;
  final String category;
  final String credentialId;
  final String credentialUrl;
  final DateTime? issueDate;
  final DateTime? expiryDate;
  final bool doesNotExpire;
  final bool isExpired;
  final String description;
  final String visibility;
  final String status;
  final int displayOrder;
  final bool hasAttachment;
  final CertificateAttachmentModel? attachment;

  CertificationModel({
    required this.id,
    required this.studentId,
    required this.title,
    required this.issuingOrganization,
    required this.category,
    this.credentialId = '',
    this.credentialUrl = '',
    this.issueDate,
    this.expiryDate,
    this.doesNotExpire = false,
    this.isExpired = false,
    this.description = '',
    this.visibility = 'Public',
    this.status = 'Active',
    this.displayOrder = 0,
    this.hasAttachment = false,
    this.attachment,
  });

  factory CertificationModel.fromJson(Map<String, dynamic> json) {
    final attRaw = json['attachment'];
    return CertificationModel(
      id: (json['id'] ?? json['_id'] ?? '').toString(),
      studentId: (json['student_id'] ?? '').toString(),
      title: json['title']?.toString() ?? '',
      issuingOrganization: json['issuing_organization']?.toString() ?? '',
      category: json['category']?.toString() ?? 'Technical',
      credentialId: json['credential_id']?.toString() ?? '',
      credentialUrl: json['credential_url']?.toString() ?? '',
      issueDate: json['issue_date'] != null
          ? DateTime.tryParse(json['issue_date'].toString())
          : null,
      expiryDate: json['expiry_date'] != null
          ? DateTime.tryParse(json['expiry_date'].toString())
          : null,
      doesNotExpire: json['does_not_expire'] == true,
      isExpired: json['is_expired'] == true,
      description: json['description']?.toString() ?? '',
      visibility: json['visibility']?.toString() ?? 'Public',
      status: json['status']?.toString() ?? 'Active',
      displayOrder: int.tryParse(json['display_order']?.toString() ?? '0') ?? 0,
      hasAttachment: json['has_attachment'] == true,
      attachment: attRaw is Map<String, dynamic>
          ? CertificateAttachmentModel.fromJson(attRaw)
          : null,
    );
  }
}

class CertificationValidators {
  static const List<String> categories = [
    'Technical',
    'Cloud & DevOps',
    'Data & AI',
    'Security',
    'Academic',
    'Professional',
    'Language',
    'Competition',
    'Other',
  ];

  static const List<String> statuses = ['Active', 'Archived'];
  static const List<String> visibilities = ['Public', 'Institute Only', 'Private'];

  static bool isSafeHttpsCredentialUrl(String raw) {
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
        uri.scheme.toLowerCase() == 'https' &&
        uri.host.contains('.') &&
        trimmed.length <= 500;
  }

  static String? validateForm({
    required String title,
    required String issuingOrganization,
    required String credentialId,
    required String credentialUrl,
    required DateTime? issueDate,
    required DateTime? expiryDate,
    required bool doesNotExpire,
    required String description,
  }) {
    final cleanTitle = title.trim();
    if (cleanTitle.length < 2 || cleanTitle.length > 150) {
      return 'Title must be between 2 and 150 characters';
    }
    final cleanIssuer = issuingOrganization.trim();
    if (cleanIssuer.length < 2 || cleanIssuer.length > 120) {
      return 'Issuing organization must be between 2 and 120 characters';
    }
    if (credentialId.trim().length > 120) {
      return 'Credential ID must not exceed 120 characters';
    }
    if (credentialUrl.trim().isNotEmpty && !isSafeHttpsCredentialUrl(credentialUrl)) {
      return 'Credential URL must be a valid https:// link';
    }
    if (issueDate == null) {
      return 'Issue date is required';
    }
    if (!doesNotExpire && expiryDate != null && expiryDate.isBefore(issueDate)) {
      return 'Expiry date cannot be earlier than issue date';
    }
    if (description.trim().length > 1000) {
      return 'Description must not exceed 1000 characters';
    }
    return null;
  }
}
