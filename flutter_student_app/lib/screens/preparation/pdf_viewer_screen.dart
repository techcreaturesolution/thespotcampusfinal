import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter_pdfview/flutter_pdfview.dart';
import 'package:path_provider/path_provider.dart';
import 'package:dio/dio.dart';
import 'package:provider/provider.dart';
import '../../services/api_service.dart';

class PdfViewerScreen extends StatefulWidget {
  const PdfViewerScreen({super.key});

  @override
  State<PdfViewerScreen> createState() => _PdfViewerScreenState();
}

class _PdfViewerScreenState extends State<PdfViewerScreen> {
  String? localPath;
  bool isLoading = true;
  int _totalPages = 0;
  int _currentPage = 0;
  PDFViewController? _pdfViewController;
  late Map<String, dynamic> _pdfData;
  double _downloadProgress = 0.0;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    final args = ModalRoute.of(context)!.settings.arguments as Map<String, dynamic>? ?? {};
    _pdfData = args['pdf'] as Map<String, dynamic>? ?? {};
    
    if (_pdfData['file_url'] != null) {
      _downloadAndSavePdf(_pdfData['file_url']);
    } else {
      setState(() => isLoading = false);
    }
  }

  Future<void> _downloadAndSavePdf(String url) async {
    try {
      final dir = await getApplicationDocumentsDirectory();
      final file = File('${dir.path}/${_pdfData['_id']}.pdf');

      if (await file.exists()) {
        setState(() {
          localPath = file.path;
          isLoading = false;
        });
        return;
      }

      final dio = Dio();
      await dio.download(url, file.path, onReceiveProgress: (rec, total) {
        if (mounted) {
          setState(() {
            _downloadProgress = rec / total;
          });
        }
      });

      setState(() {
        localPath = file.path;
        isLoading = false;
      });
    } catch (e) {
      if (mounted) {
        setState(() => isLoading = false);
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Error downloading PDF')));
      }
    }
  }

  Future<void> _updateReadingProgress(int page) async {
    try {
      final api = Provider.of<ApiService>(context, listen: false);
      await api.post('/preparation/pdfs/reading-progress', {
        'pdf_id': _pdfData['_id'],
        'last_page': page + 1,
        'total_pages': _totalPages > 0 ? _totalPages : (_pdfData['total_pages'] ?? 1),
      });
    } catch (_) {}
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(_pdfData['title'] ?? 'PDF Viewer'),
        actions: [
          if (_totalPages > 0)
            Center(
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16.0),
                child: Text('${_currentPage + 1}/$_totalPages'),
              ),
            ),
        ],
      ),
      body: isLoading
          ? Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const CircularProgressIndicator(),
                  const SizedBox(height: 16),
                  Text('Downloading... ${(_downloadProgress * 100).toStringAsFixed(0)}%'),
                ],
              ),
            )
          : localPath != null
              ? PDFView(
                  filePath: localPath,
                  enableSwipe: true,
                  swipeHorizontal: false,
                  autoSpacing: false,
                  pageFling: false,
                  onRender: (pages) {
                    setState(() {
                      _totalPages = pages ?? 0;
                    });
                  },
                  onError: (error) {
                    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(error.toString())));
                  },
                  onPageError: (page, error) {
                    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('$page: ${error.toString()}')));
                  },
                  onViewCreated: (PDFViewController pdfViewController) {
                    _pdfViewController = pdfViewController;
                  },
                  onPageChanged: (int? page, int? total) {
                    if (page != null) {
                      setState(() {
                        _currentPage = page;
                      });
                      _updateReadingProgress(page);
                    }
                  },
                )
              : const Center(child: Text('Could not load PDF')),
    );
  }
}
