class DocumentQuotaModel {
  final int documentCount;
  final int storageUsedBytes;
  final int maxDocuments;
  final int maxTotalStorageBytes;

  DocumentQuotaModel({
    required this.documentCount,
    required this.storageUsedBytes,
    required this.maxDocuments,
    required this.maxTotalStorageBytes,
  });

  factory DocumentQuotaModel.fromJson(Map<String, dynamic> json) {
    return DocumentQuotaModel(
      documentCount: int.tryParse(json['document_count']?.toString() ?? '0') ?? 0,
      storageUsedBytes: int.tryParse(json['storage_used_bytes']?.toString() ?? '0') ?? 0,
      maxDocuments: int.tryParse(json['max_documents']?.toString() ?? '25') ?? 25,
      maxTotalStorageBytes:
          int.tryParse(json['max_total_storage_bytes']?.toString() ?? '52428800') ?? 52428800,
    );
  }
}

class DocumentModel {
  final String id;
  final String ownerId;
  final String documentType;
  final String title;
  final String description;
  final String originalFilename;
  final String mimeType;
  final int fileSize;
  final String checksum;
  final int version;
  final String malwareScanStatus;
  final String visibility;
  final String status;
  final bool previewSupported;
  final String downloadPath;

  DocumentModel({
    required this.id,
    required this.ownerId,
    required this.documentType,
    required this.title,
    this.description = '',
    required this.originalFilename,
    required this.mimeType,
    required this.fileSize,
    this.checksum = '',
    this.version = 1,
    this.malwareScanStatus = 'NotScanned',
    this.visibility = 'Private',
    this.status = 'Available',
    this.previewSupported = false,
    required this.downloadPath,
  });

  factory DocumentModel.fromJson(Map<String, dynamic> json) {
    return DocumentModel(
      id: (json['id'] ?? json['_id'] ?? '').toString(),
      ownerId: (json['owner_id'] ?? '').toString(),
      documentType: json['document_type']?.toString() ?? 'RESUME',
      title: json['title']?.toString() ?? json['original_filename']?.toString() ?? '',
      description: json['description']?.toString() ?? '',
      originalFilename: json['original_filename']?.toString() ?? 'document',
      mimeType: json['mime_type']?.toString() ?? 'application/pdf',
      fileSize: int.tryParse(json['file_size']?.toString() ?? '0') ?? 0,
      checksum: json['checksum']?.toString() ?? '',
      version: int.tryParse(json['version']?.toString() ?? '1') ?? 1,
      malwareScanStatus: json['malware_scan_status']?.toString() ?? 'NotScanned',
      visibility: json['visibility']?.toString() ?? 'Private',
      status: json['status']?.toString() ?? 'Available',
      previewSupported: json['preview_supported'] == true,
      downloadPath: json['download_path']?.toString() ?? '',
    );
  }
}

class DocumentValidators {
  static const List<String> documentTypes = [
    'RESUME',
    'CERTIFICATE',
    'ACADEMIC_DOCUMENT',
    'OTHER',
  ];
  static const List<String> visibilities = ['Private', 'Institute Only', 'Public'];
  static const int maxFileBytes = 10 * 1024 * 1024;

  static String? validateResumeFileName(String filename, int sizeBytes,
      {String documentType = 'RESUME'}) {
    if (filename.contains('..') || filename.contains('/') || filename.contains('\\')) {
      return 'Invalid filename';
    }
    final lower = filename.toLowerCase();
    final allowed = documentType == 'RESUME'
        ? ['.pdf', '.doc', '.docx']
        : ['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png'];
    if (!allowed.any((ext) => lower.endsWith(ext))) {
      return documentType == 'RESUME'
          ? 'Resume files must be PDF, DOC, or DOCX'
          : 'Unsupported document extension';
    }
    if (sizeBytes <= 0 || sizeBytes > maxFileBytes) {
      return 'File size must be between 1 byte and 10 MB';
    }
    return null;
  }

  static String formatBytes(int bytes) {
    if (bytes < 1024) return '$bytes B';
    if (bytes < 1024 * 1024) return '${(bytes / 1024).toStringAsFixed(1)} KB';
    return '${(bytes / (1024 * 1024)).toStringAsFixed(2)} MB';
  }
}
