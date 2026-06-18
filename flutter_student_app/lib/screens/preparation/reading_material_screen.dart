import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../services/api_service.dart';

class ReadingMaterialScreen extends StatefulWidget {
  const ReadingMaterialScreen({super.key});

  @override
  State<ReadingMaterialScreen> createState() => _ReadingMaterialScreenState();
}

class _ReadingMaterialScreenState extends State<ReadingMaterialScreen> {
  List<dynamic> _pdfs = [];
  bool _isLoading = true;
  String _filter = '';

  final _categories = ['aptitude', 'reasoning', 'programming', 'interview_preparation', 'company_specific', 'general'];

  @override
  void initState() {
    super.initState();
    _fetchPdfs();
  }

  Future<void> _fetchPdfs() async {
    try {
      final api = Provider.of<ApiService>(context, listen: false);
      final params = _filter.isNotEmpty ? '?category=$_filter' : '';
      final data = await api.get('/preparation/pdfs/active$params');
      setState(() { _pdfs = data['pdfs'] ?? []; _isLoading = false; });
    } catch (e) { setState(() => _isLoading = false); }
  }

  Future<void> _openPdf(Map<String, dynamic> pdf) async {
    final url = pdf['file_url'];
    if (url != null && url.isNotEmpty) {
      final uri = Uri.parse(url);
      if (await canLaunchUrl(uri)) {
        await launchUrl(uri, mode: LaunchMode.externalApplication);
        try {
          final api = Provider.of<ApiService>(context, listen: false);
          await api.post('/preparation/pdfs/reading-progress', {'pdf_id': pdf['_id'], 'last_page': 1, 'total_pages': pdf['total_pages'] ?? 1});
        } catch (_) {}
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Reading Material')),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : Column(
              children: [
                SizedBox(
                  height: 44,
                  child: ListView(
                    scrollDirection: Axis.horizontal,
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
                    children: [
                      Padding(
                        padding: const EdgeInsets.only(right: 8),
                        child: FilterChip(label: const Text('All', style: TextStyle(fontSize: 12)), selected: _filter.isEmpty, onSelected: (_) { setState(() => _filter = ''); _fetchPdfs(); }),
                      ),
                      ..._categories.map((c) => Padding(
                        padding: const EdgeInsets.only(right: 8),
                        child: FilterChip(
                          label: Text(c.replaceAll('_', ' '), style: const TextStyle(fontSize: 11)),
                          selected: _filter == c,
                          onSelected: (_) { setState(() => _filter = c); _fetchPdfs(); },
                        ),
                      )),
                    ],
                  ),
                ),
                Expanded(
                  child: _pdfs.isEmpty
                      ? const Center(child: Text('No materials available'))
                      : ListView.builder(
                          padding: const EdgeInsets.all(16),
                          itemCount: _pdfs.length,
                          itemBuilder: (ctx, i) => _buildPdfCard(_pdfs[i]),
                        ),
                ),
              ],
            ),
    );
  }

  Widget _buildPdfCard(Map<String, dynamic> pdf) {
    return Card(
      margin: const EdgeInsets.only(bottom: 10),
      child: ListTile(
        leading: Container(
          width: 40, height: 40,
          decoration: BoxDecoration(color: Colors.red.shade50, borderRadius: BorderRadius.circular(8)),
          child: Icon(Icons.picture_as_pdf, color: Colors.red.shade500, size: 20),
        ),
        title: Text(pdf['title'] ?? '', style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13)),
        subtitle: Text(
          '${pdf['category']?.toString().replaceAll('_', ' ') ?? ''} · ${pdf['total_pages'] ?? 0} pages',
          style: TextStyle(fontSize: 11, color: Colors.grey.shade600),
        ),
        trailing: IconButton(icon: const Icon(Icons.open_in_new, size: 20), onPressed: () => _openPdf(pdf)),
        onTap: () => _openPdf(pdf),
      ),
    );
  }
}
