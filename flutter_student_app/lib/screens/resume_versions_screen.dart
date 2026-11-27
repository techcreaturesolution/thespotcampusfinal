import 'dart:io';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:path_provider/path_provider.dart';
import 'package:share_plus/share_plus.dart';
import '../models/resume_version_models.dart';
import '../services/resume_versions_service.dart';

class ResumeVersionsScreen extends StatefulWidget {
  const ResumeVersionsScreen({super.key});

  @override
  State<ResumeVersionsScreen> createState() => _ResumeVersionsScreenState();
}

class _ResumeVersionsScreenState extends State<ResumeVersionsScreen> {
  final _searchCtrl = TextEditingController();

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<ResumeVersionsService>().loadMyVersions();
    });
  }

  @override
  void dispose() {
    _searchCtrl.dispose();
    super.dispose();
  }

  Future<void> _openFormSheet([ResumeVersionModel? existing]) async {
    final nameCtrl = TextEditingController(text: existing?.name ?? '');
    final roleCtrl = TextEditingController(text: existing?.targetRole ?? '');
    final summaryCtrl = TextEditingController(text: existing?.summary ?? '');

    String visibility = existing?.visibility ?? 'Private';
    String fontFamily = existing?.fontFamily ?? 'Inter';
    bool isDefault = existing?.isDefault ?? false;
    String? formError;

    await showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (sheetCtx) {
        return StatefulBuilder(
          builder: (ctx, setSheetState) {
            final svc = ctx.read<ResumeVersionsService>();
            return Padding(
              padding: EdgeInsets.only(
                left: 20,
                right: 20,
                top: 20,
                bottom: MediaQuery.of(ctx).viewInsets.bottom + 20,
              ),
              child: SingleChildScrollView(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    Text(
                      existing == null ? 'New Resume Version' : 'Edit Resume Version',
                      style: const TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.w900,
                        color: Color(0xFF1E293B),
                      ),
                    ),
                    const SizedBox(height: 12),
                    if (formError != null)
                      Container(
                        margin: const EdgeInsets.only(bottom: 12),
                        padding: const EdgeInsets.all(10),
                        decoration: BoxDecoration(
                          color: const Color(0xFFFEF2F2),
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: Text(
                          formError!,
                          style: const TextStyle(color: Color(0xFFDC2626), fontSize: 12),
                        ),
                      ),
                    TextField(
                      controller: nameCtrl,
                      decoration: const InputDecoration(
                        labelText: 'Resume Version Name *',
                        border: OutlineInputBorder(),
                      ),
                    ),
                    const SizedBox(height: 10),
                    TextField(
                      controller: roleCtrl,
                      decoration: const InputDecoration(
                        labelText: 'Target Role / Headline',
                        border: OutlineInputBorder(),
                      ),
                    ),
                    const SizedBox(height: 10),
                    TextField(
                      controller: summaryCtrl,
                      maxLines: 3,
                      decoration: const InputDecoration(
                        labelText: 'Professional Summary',
                        border: OutlineInputBorder(),
                      ),
                    ),
                    const SizedBox(height: 10),
                    Row(
                      children: [
                        Expanded(
                          child: DropdownButtonFormField<String>(
                            value: fontFamily,
                            decoration: const InputDecoration(
                              labelText: 'Font',
                              border: OutlineInputBorder(),
                            ),
                            items: ResumeVersionValidators.fontFamilies
                                .map((f) => DropdownMenuItem(value: f, child: Text(f)))
                                .toList(),
                            onChanged: (v) {
                              if (v != null) setSheetState(() => fontFamily = v);
                            },
                          ),
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: DropdownButtonFormField<String>(
                            value: visibility,
                            decoration: const InputDecoration(
                              labelText: 'Visibility',
                              border: OutlineInputBorder(),
                            ),
                            items: ResumeVersionValidators.visibilities
                                .map((v) => DropdownMenuItem(value: v, child: Text(v)))
                                .toList(),
                            onChanged: (v) {
                              if (v != null) setSheetState(() => visibility = v);
                            },
                          ),
                        ),
                      ],
                    ),
                    CheckboxListTile(
                      contentPadding: EdgeInsets.zero,
                      title: const Text('Set as default resume version'),
                      value: isDefault,
                      onChanged: (v) => setSheetState(() => isDefault = v ?? false),
                    ),
                    const SizedBox(height: 12),
                    ElevatedButton(
                      onPressed: () async {
                        final err = ResumeVersionValidators.validateName(nameCtrl.text);
                        if (err != null) {
                          setSheetState(() => formError = err);
                          return;
                        }
                        final payload = {
                          'name': nameCtrl.text.trim(),
                          'target_role': roleCtrl.text.trim(),
                          'summary': summaryCtrl.text.trim(),
                          'font_family': fontFamily,
                          'visibility': visibility,
                          'is_default': isDefault,
                        };
                        try {
                          if (existing == null) {
                            await svc.createVersion(payload);
                          } else {
                            await svc.updateVersion(existing.id, payload);
                          }
                          if (sheetCtx.mounted) Navigator.pop(sheetCtx);
                        } catch (e) {
                          setSheetState(() {
                            formError = e.toString().replaceAll('Exception: ', '');
                          });
                        }
                      },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF3730A3),
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(vertical: 14),
                      ),
                      child: Text(existing == null ? 'Create Version' : 'Update Version'),
                    ),
                  ],
                ),
              ),
            );
          },
        );
      },
    );
  }

  Future<void> _showPreview(ResumeVersionModel ver) async {
    try {
      final res = await context.read<ResumeVersionsService>().previewVersion(ver.id);
      final composed = res['composed_content'] as Map<String, dynamic>? ?? {};
      final header = composed['header'] as Map<String, dynamic>? ?? {};
      final skills = composed['skills'] as List? ?? [];
      final projects = composed['projects'] as List? ?? [];
      final internships = composed['internships'] as List? ?? [];
      final certs = composed['certifications'] as List? ?? [];

      if (!mounted) return;
      await showDialog(
        context: context,
        builder: (ctx) => AlertDialog(
          title: Text('${ver.name} (Live Preview)'),
          content: SingleChildScrollView(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(header['name']?.toString() ?? '',
                    style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                if ((header['target_role']?.toString() ?? '').isNotEmpty)
                  Text(header['target_role'].toString(),
                      style: const TextStyle(color: Color(0xFF475569))),
                const SizedBox(height: 8),
                Text('Skills: ${skills.length}  •  Projects: ${projects.length}'),
                Text('Internships: ${internships.length}  •  Certifications: ${certs.length}'),
              ],
            ),
          ),
          actions: [
            TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Close')),
          ],
        ),
      );
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.toString())));
      }
    }
  }

  Future<void> _downloadAndSharePdf(ResumeVersionModel ver) async {
    try {
      final bytes = await context.read<ResumeVersionsService>().downloadVersionPdf(ver.id);
      final dir = await getTemporaryDirectory();
      final safeName = ver.name.replaceAll(RegExp(r'[^a-zA-Z0-9_-]'), '_');
      final file = File('${dir.path}/$safeName.pdf');
      await file.writeAsBytes(bytes);
      await Share.shareXFiles([XFile(file.path)], text: ver.name);
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('PDF error: $e')));
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final svc = context.watch<ResumeVersionsService>();
    final items = svc.versions;

    return Scaffold(
      backgroundColor: const Color(0xFFF8F9FF),
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        title: const Text(
          'Resume Versions',
          style: TextStyle(color: Color(0xFF1E293B), fontWeight: FontWeight.w900, fontSize: 18),
        ),
        iconTheme: const IconThemeData(color: Color(0xFF1E293B)),
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => _openFormSheet(),
        backgroundColor: const Color(0xFF3730A3),
        foregroundColor: Colors.white,
        icon: const Icon(Icons.add),
        label: const Text('New Version', style: TextStyle(fontWeight: FontWeight.w800)),
      ),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 10, 16, 8),
            child: TextField(
              controller: _searchCtrl,
              decoration: InputDecoration(
                hintText: 'Search resume versions...',
                prefixIcon: const Icon(Icons.search, size: 18),
                isDense: true,
                filled: true,
                fillColor: Colors.white,
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
              ),
              onSubmitted: (v) => svc.loadMyVersions(search: v),
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
                            Text(svc.errorMessage!,
                                style: const TextStyle(color: Color(0xFFDC2626))),
                            const SizedBox(height: 12),
                            ElevatedButton(
                              onPressed: () => svc.loadMyVersions(),
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
                                Icon(Icons.description_outlined,
                                    size: 48, color: Color(0xFF94A3B8)),
                                SizedBox(height: 12),
                                Text(
                                  'No resume versions created yet',
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
                            padding: const EdgeInsets.fromLTRB(16, 8, 16, 90),
                            itemCount: items.length,
                            itemBuilder: (ctx, idx) {
                              final ver = items[idx];
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
                                              ver.name,
                                              style: const TextStyle(
                                                fontSize: 15,
                                                fontWeight: FontWeight.w900,
                                              ),
                                            ),
                                          ),
                                          if (ver.isDefault)
                                            const Chip(
                                              label: Text('Default', style: TextStyle(fontSize: 11)),
                                              visualDensity: VisualDensity.compact,
                                            ),
                                        ],
                                      ),
                                      if (ver.targetRole.isNotEmpty)
                                        Text(
                                          ver.targetRole,
                                          style: const TextStyle(
                                            fontSize: 12,
                                            color: Color(0xFF475569),
                                          ),
                                        ),
                                      const SizedBox(height: 8),
                                      Wrap(
                                        spacing: 8,
                                        runSpacing: 6,
                                        children: [
                                          OutlinedButton.icon(
                                            onPressed: () => _showPreview(ver),
                                            icon: const Icon(Icons.visibility_outlined, size: 15),
                                            label: const Text('Preview'),
                                          ),
                                          OutlinedButton.icon(
                                            onPressed: () => _downloadAndSharePdf(ver),
                                            icon: const Icon(Icons.download_outlined, size: 15),
                                            label: const Text('PDF'),
                                          ),
                                          IconButton(
                                            icon: const Icon(Icons.copy_outlined, size: 18),
                                            onPressed: () => svc.duplicateVersion(ver.id),
                                          ),
                                          IconButton(
                                            icon: const Icon(Icons.edit_outlined, size: 18),
                                            onPressed: () => _openFormSheet(ver),
                                          ),
                                          if (!ver.isDefault)
                                            IconButton(
                                              icon: const Icon(Icons.star_border, size: 18),
                                              onPressed: () => svc.setDefaultVersion(ver.id),
                                            ),
                                          IconButton(
                                            icon: const Icon(Icons.delete_outline,
                                                size: 18, color: Color(0xFFDC2626)),
                                            onPressed: () => svc.deleteVersion(ver.id),
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
