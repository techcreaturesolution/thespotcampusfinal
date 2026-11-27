import 'dart:io';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:path_provider/path_provider.dart';
import 'package:share_plus/share_plus.dart';
import '../models/document_models.dart';
import '../services/documents_service.dart';

class DocumentsScreen extends StatefulWidget {
  const DocumentsScreen({super.key});

  @override
  State<DocumentsScreen> createState() => _DocumentsScreenState();
}

class _DocumentsScreenState extends State<DocumentsScreen> {
  String _typeFilter = '';
  final _searchCtrl = TextEditingController();

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<DocumentsService>().loadMyDocuments();
    });
  }

  @override
  void dispose() {
    _searchCtrl.dispose();
    super.dispose();
  }

  Future<void> _downloadAndOpen(DocumentModel doc) async {
    try {
      final bytes = await context.read<DocumentsService>().downloadDocumentBytes(doc.id);
      final dir = await getTemporaryDirectory();
      final safeName = doc.originalFilename.replaceAll(RegExp(r'[^a-zA-Z0-9._-]'), '_');
      final file = File('${dir.path}/$safeName');
      await file.writeAsBytes(bytes);
      await Share.shareXFiles([XFile(file.path)], text: doc.title);
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Unable to download document: $e')),
        );
      }
    }
  }

  Future<void> _confirmDelete(DocumentModel doc) async {
    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Delete Document'),
        content: Text('Delete "${doc.originalFilename}"? Linked resume references will be cleared.'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancel')),
          TextButton(
            onPressed: () => Navigator.pop(ctx, true),
            style: TextButton.styleFrom(foregroundColor: const Color(0xFFDC2626)),
            child: const Text('Delete'),
          ),
        ],
      ),
    );
    if (ok == true && mounted) {
      await context.read<DocumentsService>().deleteDocument(doc.id);
    }
  }

  @override
  Widget build(BuildContext context) {
    final svc = context.watch<DocumentsService>();
    final items = svc.documents;
    final quota = svc.quota;

    return Scaffold(
      backgroundColor: const Color(0xFFF8F9FF),
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        title: const Text(
          'Resume Files & Documents',
          style: TextStyle(color: Color(0xFF1E293B), fontWeight: FontWeight.w900, fontSize: 18),
        ),
        iconTheme: const IconThemeData(color: Color(0xFF1E293B)),
      ),
      body: Column(
        children: [
          Container(
            color: Colors.white,
            padding: const EdgeInsets.fromLTRB(16, 8, 16, 12),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                if (quota != null)
                  Container(
                    margin: const EdgeInsets.only(bottom: 8),
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                    decoration: BoxDecoration(
                      color: const Color(0xFFF1F5F9),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: Text(
                      'Storage Quota: ${quota.documentCount}/${quota.maxDocuments} files • ${DocumentValidators.formatBytes(quota.storageUsedBytes)} / ${DocumentValidators.formatBytes(quota.maxTotalStorageBytes)}',
                      style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w700),
                    ),
                  ),
                TextField(
                  controller: _searchCtrl,
                  decoration: InputDecoration(
                    hintText: 'Search uploaded documents...',
                    prefixIcon: const Icon(Icons.search, size: 18),
                    isDense: true,
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                  onSubmitted: (v) =>
                      svc.loadMyDocuments(documentType: _typeFilter, search: v),
                ),
                const SizedBox(height: 8),
                SizedBox(
                  height: 34,
                  child: ListView(
                    scrollDirection: Axis.horizontal,
                    children: [
                      Padding(
                        padding: const EdgeInsets.only(right: 6),
                        child: ChoiceChip(
                          label: const Text('All'),
                          selected: _typeFilter.isEmpty,
                          onSelected: (_) {
                            setState(() => _typeFilter = '');
                            svc.loadMyDocuments(search: _searchCtrl.text);
                          },
                        ),
                      ),
                      ...DocumentValidators.documentTypes.map(
                        (t) => Padding(
                          padding: const EdgeInsets.only(right: 6),
                          child: ChoiceChip(
                            label: Text(t),
                            selected: _typeFilter == t,
                            onSelected: (_) {
                              setState(() => _typeFilter = t);
                              svc.loadMyDocuments(
                                documentType: _typeFilter,
                                search: _searchCtrl.text,
                              );
                            },
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          Expanded(
            child: svc.isLoading
                ? const Center(child: CircularProgressIndicator())
                : svc.errorMessage != null
                    ? Center(
                        child: Column(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Text(
                              svc.errorMessage!,
                              style: const TextStyle(color: Color(0xFFDC2626)),
                            ),
                            const SizedBox(height: 12),
                            ElevatedButton(
                              onPressed: () => svc.loadMyDocuments(),
                              child: const Text('Retry'),
                            ),
                          ],
                        ),
                      )
                    : items.isEmpty
                        ? Center(
                            child: Column(
                              mainAxisSize: MainAxisSize.min,
                              children: const [
                                Icon(Icons.folder_open_outlined,
                                    size: 48, color: Color(0xFF94A3B8)),
                                SizedBox(height: 12),
                                Text(
                                  'No uploaded documents found',
                                  style: TextStyle(
                                    fontSize: 16,
                                    fontWeight: FontWeight.w800,
                                    color: Color(0xFF334155),
                                  ),
                                ),
                              ],
                            ),
                          )
                        : ListView.builder(
                            padding: const EdgeInsets.all(16),
                            itemCount: items.length,
                            itemBuilder: (ctx, idx) {
                              final doc = items[idx];
                              return Card(
                                margin: const EdgeInsets.only(bottom: 12),
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(16),
                                ),
                                child: Padding(
                                  padding: const EdgeInsets.all(14),
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Row(
                                        children: [
                                          Expanded(
                                            child: Text(
                                              doc.title,
                                              style: const TextStyle(
                                                fontSize: 15,
                                                fontWeight: FontWeight.w900,
                                              ),
                                            ),
                                          ),
                                          IconButton(
                                            icon: const Icon(Icons.delete_outline,
                                                size: 18, color: Color(0xFFDC2626)),
                                            onPressed: () => _confirmDelete(doc),
                                          ),
                                        ],
                                      ),
                                      Text(
                                        '${doc.originalFilename} • ${DocumentValidators.formatBytes(doc.fileSize)} • v${doc.version}',
                                        style: const TextStyle(
                                            fontSize: 12, color: Color(0xFF64748B)),
                                      ),
                                      const SizedBox(height: 8),
                                      Wrap(
                                        spacing: 8,
                                        children: [
                                          Chip(
                                            label: Text(doc.documentType,
                                                style: const TextStyle(fontSize: 11)),
                                            visualDensity: VisualDensity.compact,
                                          ),
                                          OutlinedButton.icon(
                                            onPressed: () => _downloadAndOpen(doc),
                                            icon: const Icon(Icons.download_outlined, size: 15),
                                            label: const Text('Download / Open'),
                                          ),
                                        ],
                                      ),
                                    ],
                                  ),
                                ),
                              );
                            },
                          ),
          ),
        ],
      ),
    );
  }
}
