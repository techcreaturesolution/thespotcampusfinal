import 'dart:io';
import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:webview_flutter/webview_flutter.dart';
import 'package:path_provider/path_provider.dart';
import 'package:share_plus/share_plus.dart';
import '../services/api_service.dart';
import '../services/resume_service.dart';
import '../services/auth_service.dart';
import 'package:flutter_file_dialog/flutter_file_dialog.dart';

class ResumePreviewScreen extends StatefulWidget {
  const ResumePreviewScreen({super.key});

  @override
  State<ResumePreviewScreen> createState() => _ResumePreviewScreenState();
}

class _ResumePreviewScreenState extends State<ResumePreviewScreen> {
  late ResumeService _resumeService;
  late WebViewController _webViewController;
  bool _isLoading = true;
  String _compiledHtml = '';
  bool _isPdfProcessing = false;

  @override
  void initState() {
    super.initState();
    _resumeService = ResumeService(context.read<ApiService>());
    _webViewController = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..setBackgroundColor(const Color(0x00000000));
    _compileAndLoad();
  }

  Future<void> _compileAndLoad() async {
    setState(() => _isLoading = true);
    try {
      final res = await _resumeService.compileResume();
      if (res['resume'] != null) {
        _compiledHtml = res['resume']['ai_compiled_html'] ?? '';
        
        final srcDoc = '''
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=794">
              <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Outfit:wght@400;500;600;700;800&display=swap" rel="stylesheet">
              <style>
                body { 
                  margin: 0; 
                  padding: 0; 
                  background: white; 
                  -webkit-print-color-adjust: exact; 
                  print-color-adjust: exact; 
                }
              </style>
            </head>
            <body>
              $_compiledHtml
            </body>
          </html>
        ''';
        
        final String contentBase64 = base64Encode(utf8.encode(srcDoc));
        _webViewController.loadRequest(Uri.parse('data:text/html;base64,$contentBase64'));
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error compiling resume: $e')),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  Future<String?> _preparePdfFile() async {
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Generating high-quality PDF...'),
          duration: Duration(seconds: 2),
        ),
      );
    }

    setState(() => _isPdfProcessing = true);
    try {
      final pdfBytes = await _resumeService.downloadPdf();
      final directory = await getTemporaryDirectory();

      // Retrieve user's name to generate the filename
      String filename = 'Resume.pdf';
      try {
        final auth = context.read<AuthService>();
        final userName = auth.userName;
        final sanitizedName = userName
            .replaceAll(RegExp(r'[^\w\s\-]'), '')
            .replaceAll(RegExp(r'[\s\-]+'), '_')
            .trim();
        
        if (sanitizedName.isNotEmpty && sanitizedName.toLowerCase() != 'student') {
          filename = 'Resume_$sanitizedName.pdf';
        } else {
          final dateStr = DateTime.now().toString().split(' ')[0].replaceAll('-', '_');
          filename = 'Resume_$dateStr.pdf';
        }
      } catch (_) {
        final dateStr = DateTime.now().toString().split(' ')[0].replaceAll('-', '_');
        filename = 'Resume_$dateStr.pdf';
      }

      final targetPath = '${directory.path}/$filename';
      final file = File(targetPath);
      await file.writeAsBytes(pdfBytes);
      
      if (mounted) {
        final double kbSize = pdfBytes.length / 1024;
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('PDF generated successfully! (${kbSize.toStringAsFixed(1)} KB)'),
            duration: const Duration(seconds: 2),
            backgroundColor: Colors.green,
          ),
        );
      }
      
      return targetPath;
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error downloading PDF: $e')),
        );
      }
      return null;
    } finally {
      if (mounted) {
        setState(() => _isPdfProcessing = false);
      }
    }
  }

  Future<void> _sharePdf() async {
    final path = await _preparePdfFile();
    if (path == null) return;

    try {
      await SharePlus.instance.share(
        ShareParams(
          files: [XFile(path)],
          text: 'My Resume',
        ),
      );
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error sharing PDF: $e')),
        );
      }
    }
  }

  Future<void> _savePdfToDevice() async {
    final path = await _preparePdfFile();
    if (path == null) return;

    setState(() => _isPdfProcessing = true);
    try {
      final String suggestedName = path.split('/').last;

      final params = SaveFileDialogParams(
        sourceFilePath: path,
        fileName: suggestedName,
      );
      final resultPath = await FlutterFileDialog.saveFile(params: params);
      
      if (mounted) {
        if (resultPath != null) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('PDF saved successfully!'),
              backgroundColor: Colors.green,
              behavior: SnackBarBehavior.floating,
            ),
          );
        } else {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Save canceled')),
          );
        }
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error saving PDF: $e')),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isPdfProcessing = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final bool actionsDisabled = _isLoading || _isPdfProcessing;
    return Scaffold(
      appBar: AppBar(
        title: const Text('CV Preview'),
        actions: [
          IconButton(
            icon: const Icon(Icons.share),
            onPressed: actionsDisabled ? null : _sharePdf,
            tooltip: 'Share PDF',
          ),
          IconButton(
            icon: const Icon(Icons.download),
            onPressed: actionsDisabled ? null : _savePdfToDevice,
            tooltip: 'Save PDF to Device',
          ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : WebViewWidget(controller: _webViewController),
    );
  }
}
