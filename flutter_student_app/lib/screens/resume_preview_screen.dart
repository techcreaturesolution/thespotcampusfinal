import 'dart:io';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:webview_flutter/webview_flutter.dart';
import 'package:path_provider/path_provider.dart';
import 'package:share_plus/share_plus.dart';
import '../services/api_service.dart';
import '../services/resume_service.dart';

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
  String _compiledCss = '';

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
        _compiledCss = res['resume']['ai_compiled_css'] ?? '';
        
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
        
        _webViewController.loadHtmlString(srcDoc);
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

  Future<void> _downloadPdf() async {
    try {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Generating high-quality PDF...')),
      );
      
      final pdfBytes = await _resumeService.downloadPdf();
      
      final directory = await getTemporaryDirectory();
      final targetPath = '${directory.path}/My_Resume.pdf';
      final file = File(targetPath);
      await file.writeAsBytes(pdfBytes);
      
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('PDF Generated! Ready to share.')),
        );
      }
      
      await Share.shareXFiles([XFile(targetPath)], text: 'My Resume');
      
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error generating PDF: $e')),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('CV Preview'),
        actions: [
          IconButton(
            icon: const Icon(Icons.picture_as_pdf),
            onPressed: _isLoading ? null : _downloadPdf,
            tooltip: 'Download PDF',
          ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : WebViewWidget(controller: _webViewController),
    );
  }
}
