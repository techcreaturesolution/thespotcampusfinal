import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:provider/provider.dart';
import 'package:the_spot_campus_student/models/document_models.dart';
import 'package:the_spot_campus_student/screens/documents_screen.dart';
import 'package:the_spot_campus_student/services/api_service.dart';
import 'package:the_spot_campus_student/services/documents_service.dart';

class _FakeApiService extends ApiService {
  @override
  Future<Map<String, dynamic>> get(String endpoint) async {
    return {
      'documents': [],
      'quota': {
        'document_count': 0,
        'storage_used_bytes': 0,
        'max_documents': 25,
        'max_total_storage_bytes': 52428800,
      },
    };
  }
}

void main() {
  test('DocumentModel parses metadata and DocumentValidators validates filename and size', () {
    final doc = DocumentModel.fromJson({
      'id': 'd1',
      'owner_id': 's1',
      'document_type': 'RESUME',
      'title': 'Backend Engineer CV',
      'original_filename': 'Resume.pdf',
      'mime_type': 'application/pdf',
      'file_size': 4096,
      'checksum': 'abc123',
      'version': 2,
      'visibility': 'Private',
      'status': 'Available',
      'preview_supported': true,
      'download_path': '/api/documents/me/d1/download',
    });

    expect(doc.title, 'Backend Engineer CV');
    expect(doc.version, 2);
    expect(DocumentValidators.validateResumeFileName('CV.pdf', 1024), isNull);
    expect(DocumentValidators.validateResumeFileName('../CV.pdf', 1024), isNotNull);
    expect(DocumentValidators.validateResumeFileName('script.exe', 1024), isNotNull);
    expect(
      DocumentValidators.validateResumeFileName('big.pdf', 11 * 1024 * 1024),
      isNotNull,
    );
  });

  testWidgets('DocumentsScreen renders empty state and quota cleanly', (WidgetTester tester) async {
    final svc = DocumentsService(_FakeApiService());
    await tester.pumpWidget(
      ChangeNotifierProvider<DocumentsService>.value(
        value: svc,
        child: const MaterialApp(home: DocumentsScreen()),
      ),
    );
    await tester.pumpAndSettle();
    expect(find.text('No uploaded documents found'), findsOneWidget);
  });
}
