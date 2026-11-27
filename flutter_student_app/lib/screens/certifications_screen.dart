import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:url_launcher/url_launcher.dart';
import '../models/certification_models.dart';
import '../services/certifications_service.dart';

class CertificationsScreen extends StatefulWidget {
  const CertificationsScreen({super.key});

  @override
  State<CertificationsScreen> createState() => _CertificationsScreenState();
}

class _CertificationsScreenState extends State<CertificationsScreen> {
  String _categoryFilter = '';
  String _searchQuery = '';
  final _searchCtrl = TextEditingController();

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<CertificationsService>().loadMyCertifications();
    });
  }

  @override
  void dispose() {
    _searchCtrl.dispose();
    super.dispose();
  }

  Future<void> _launchSafeHttpsUrl(String url) async {
    final uri = Uri.tryParse(url);
    if (uri == null || !CertificationValidators.isSafeHttpsCredentialUrl(url)) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Unsafe or invalid credential URL')),
        );
      }
      return;
    }
    try {
      final launched = await launchUrl(uri, mode: LaunchMode.externalApplication);
      if (!launched && mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Could not open credential URL')),
        );
      }
    } catch (_) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Failed to launch credential URL')),
        );
      }
    }
  }

  Future<void> _openFormSheet([CertificationModel? existing]) async {
    final titleCtrl = TextEditingController(text: existing?.title ?? '');
    final issuerCtrl = TextEditingController(text: existing?.issuingOrganization ?? '');
    final credIdCtrl = TextEditingController(text: existing?.credentialId ?? '');
    final credUrlCtrl = TextEditingController(text: existing?.credentialUrl ?? '');
    final descCtrl = TextEditingController(text: existing?.description ?? '');

    String category = existing?.category ?? CertificationValidators.categories.first;
    String status = existing?.status ?? CertificationValidators.statuses.first;
    String visibility = existing?.visibility ?? CertificationValidators.visibilities.first;
    bool doesNotExpire = existing?.doesNotExpire ?? false;
    DateTime? issueDate = existing?.issueDate ?? DateTime.now();
    DateTime? expiryDate = doesNotExpire ? null : existing?.expiryDate;
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
            final svc = ctx.read<CertificationsService>();
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
                      existing == null ? 'Add Certification' : 'Edit Certification',
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
                          style: const TextStyle(
                            color: Color(0xFFDC2626),
                            fontSize: 12,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ),
                    TextField(
                      controller: titleCtrl,
                      decoration: const InputDecoration(
                        labelText: 'Certification Title *',
                        border: OutlineInputBorder(),
                      ),
                    ),
                    const SizedBox(height: 10),
                    TextField(
                      controller: issuerCtrl,
                      decoration: const InputDecoration(
                        labelText: 'Issuing Organization *',
                        border: OutlineInputBorder(),
                      ),
                    ),
                    const SizedBox(height: 10),
                    DropdownButtonFormField<String>(
                      value: CertificationValidators.categories.contains(category)
                          ? category
                          : CertificationValidators.categories.first,
                      decoration: const InputDecoration(
                        labelText: 'Category',
                        border: OutlineInputBorder(),
                      ),
                      items: CertificationValidators.categories
                          .map((c) => DropdownMenuItem(value: c, child: Text(c)))
                          .toList(),
                      onChanged: (v) {
                        if (v != null) setSheetState(() => category = v);
                      },
                    ),
                    const SizedBox(height: 10),
                    TextField(
                      controller: credIdCtrl,
                      decoration: const InputDecoration(
                        labelText: 'Credential ID',
                        border: OutlineInputBorder(),
                      ),
                    ),
                    const SizedBox(height: 10),
                    TextField(
                      controller: credUrlCtrl,
                      decoration: const InputDecoration(
                        labelText: 'Credential URL (https://)',
                        border: OutlineInputBorder(),
                      ),
                      keyboardType: TextInputType.url,
                    ),
                    const SizedBox(height: 10),
                    Row(
                      children: [
                        Expanded(
                          child: OutlinedButton.icon(
                            onPressed: () async {
                              final picked = await showDatePicker(
                                context: ctx,
                                initialDate: issueDate ?? DateTime.now(),
                                firstDate: DateTime(1990),
                                lastDate: DateTime(2100),
                              );
                              if (picked != null) {
                                setSheetState(() => issueDate = picked);
                              }
                            },
                            icon: const Icon(Icons.date_range, size: 16),
                            label: Text(
                              issueDate == null
                                  ? 'Issue Date *'
                                  : 'Issued: ${issueDate!.toIso8601String().substring(0, 10)}',
                              style: const TextStyle(fontSize: 12),
                            ),
                          ),
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: OutlinedButton.icon(
                            onPressed: doesNotExpire
                                ? null
                                : () async {
                                    final picked = await showDatePicker(
                                      context: ctx,
                                      initialDate: expiryDate ?? issueDate ?? DateTime.now(),
                                      firstDate: DateTime(1990),
                                      lastDate: DateTime(2100),
                                    );
                                    if (picked != null) {
                                      setSheetState(() => expiryDate = picked);
                                    }
                                  },
                            icon: const Icon(Icons.event, size: 16),
                            label: Text(
                              doesNotExpire
                                  ? 'No Expiry'
                                  : expiryDate == null
                                      ? 'Expiry (Opt.)'
                                      : 'Exp: ${expiryDate!.toIso8601String().substring(0, 10)}',
                              style: const TextStyle(fontSize: 12),
                            ),
                          ),
                        ),
                      ],
                    ),
                    CheckboxListTile(
                      contentPadding: EdgeInsets.zero,
                      title: const Text(
                        'This credential does not expire',
                        style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600),
                      ),
                      value: doesNotExpire,
                      onChanged: (val) {
                        setSheetState(() {
                          doesNotExpire = val ?? false;
                          if (doesNotExpire) expiryDate = null;
                        });
                      },
                    ),
                    Row(
                      children: [
                        Expanded(
                          child: DropdownButtonFormField<String>(
                            value: visibility,
                            decoration: const InputDecoration(
                              labelText: 'Visibility',
                              border: OutlineInputBorder(),
                            ),
                            items: CertificationValidators.visibilities
                                .map((v) => DropdownMenuItem(value: v, child: Text(v)))
                                .toList(),
                            onChanged: (v) {
                              if (v != null) setSheetState(() => visibility = v);
                            },
                          ),
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: DropdownButtonFormField<String>(
                            value: status,
                            decoration: const InputDecoration(
                              labelText: 'Status',
                              border: OutlineInputBorder(),
                            ),
                            items: CertificationValidators.statuses
                                .map((s) => DropdownMenuItem(value: s, child: Text(s)))
                                .toList(),
                            onChanged: (v) {
                              if (v != null) setSheetState(() => status = v);
                            },
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 10),
                    TextField(
                      controller: descCtrl,
                      maxLines: 3,
                      decoration: const InputDecoration(
                        labelText: 'Description / Notes',
                        border: OutlineInputBorder(),
                      ),
                    ),
                    const SizedBox(height: 16),
                    ElevatedButton(
                      onPressed: () async {
                        final validationErr = CertificationValidators.validateForm(
                          title: titleCtrl.text,
                          issuingOrganization: issuerCtrl.text,
                          credentialId: credIdCtrl.text,
                          credentialUrl: credUrlCtrl.text,
                          issueDate: issueDate,
                          expiryDate: expiryDate,
                          doesNotExpire: doesNotExpire,
                          description: descCtrl.text,
                        );
                        if (validationErr != null) {
                          setSheetState(() => formError = validationErr);
                          return;
                        }
                        final payload = {
                          'title': titleCtrl.text.trim(),
                          'issuing_organization': issuerCtrl.text.trim(),
                          'category': category,
                          'credential_id': credIdCtrl.text.trim(),
                          'credential_url': credUrlCtrl.text.trim(),
                          'issue_date': issueDate!.toIso8601String(),
                          'expiry_date': doesNotExpire || expiryDate == null
                              ? null
                              : expiryDate!.toIso8601String(),
                          'does_not_expire': doesNotExpire,
                          'description': descCtrl.text.trim(),
                          'visibility': visibility,
                          'status': status,
                        };
                        try {
                          if (existing == null) {
                            await svc.createCertification(payload);
                          } else {
                            await svc.updateCertification(existing.id, payload);
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
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(14),
                        ),
                      ),
                      child: Text(
                        existing == null ? 'Save Certification' : 'Update Certification',
                        style: const TextStyle(fontWeight: FontWeight.w800),
                      ),
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

  Future<void> _confirmDelete(CertificationModel cert) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Delete Certification'),
        content: Text('Delete "${cert.title}"? This action cannot be undone.'),
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
    if (confirmed == true && mounted) {
      try {
        await context.read<CertificationsService>().deleteCertification(cert.id);
      } catch (e) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text(e.toString())),
          );
        }
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final service = context.watch<CertificationsService>();
    final items = service.certifications;

    return Scaffold(
      backgroundColor: const Color(0xFFF8F9FF),
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        title: const Text(
          'Certifications & Credentials',
          style: TextStyle(color: Color(0xFF1E293B), fontWeight: FontWeight.w900, fontSize: 18),
        ),
        iconTheme: const IconThemeData(color: Color(0xFF1E293B)),
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => _openFormSheet(),
        backgroundColor: const Color(0xFF3730A3),
        foregroundColor: Colors.white,
        icon: const Icon(Icons.add),
        label: const Text('Add Certification', style: TextStyle(fontWeight: FontWeight.w800)),
      ),
      body: Column(
        children: [
          Container(
            color: Colors.white,
            padding: const EdgeInsets.fromLTRB(16, 8, 16, 12),
            child: Column(
              children: [
                TextField(
                  controller: _searchCtrl,
                  decoration: InputDecoration(
                    hintText: 'Search certifications, issuers, credential IDs...',
                    prefixIcon: const Icon(Icons.search, size: 18),
                    isDense: true,
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                  onSubmitted: (v) {
                    setState(() => _searchQuery = v);
                    service.loadMyCertifications(
                      category: _categoryFilter,
                      search: _searchQuery,
                    );
                  },
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
                          selected: _categoryFilter.isEmpty,
                          onSelected: (_) {
                            setState(() => _categoryFilter = '');
                            service.loadMyCertifications(search: _searchQuery);
                          },
                        ),
                      ),
                      ...CertificationValidators.categories.map(
                        (cat) => Padding(
                          padding: const EdgeInsets.only(right: 6),
                          child: ChoiceChip(
                            label: Text(cat),
                            selected: _categoryFilter == cat,
                            onSelected: (_) {
                              setState(() => _categoryFilter = cat);
                              service.loadMyCertifications(
                                category: _categoryFilter,
                                search: _searchQuery,
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
            child: service.isLoading
                ? const Center(child: CircularProgressIndicator())
                : service.errorMessage != null
                    ? Center(
                        child: Padding(
                          padding: const EdgeInsets.all(24),
                          child: Column(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Text(
                                service.errorMessage!,
                                textAlign: TextAlign.center,
                                style: const TextStyle(color: Color(0xFFDC2626)),
                              ),
                              const SizedBox(height: 12),
                              ElevatedButton(
                                onPressed: () => service.loadMyCertifications(),
                                child: const Text('Retry'),
                              ),
                            ],
                          ),
                        ),
                      )
                    : items.isEmpty
                        ? Center(
                            child: Padding(
                              padding: const EdgeInsets.all(24),
                              child: Column(
                                mainAxisSize: MainAxisSize.min,
                                children: const [
                                  Icon(Icons.workspace_premium_outlined,
                                      size: 48, color: Color(0xFF94A3B8)),
                                  SizedBox(height: 12),
                                  Text(
                                    'No certifications added yet',
                                    style: TextStyle(
                                      fontSize: 16,
                                      fontWeight: FontWeight.w800,
                                      color: Color(0xFF334155),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          )
                        : ListView.builder(
                            padding: const EdgeInsets.fromLTRB(16, 12, 16, 90),
                            itemCount: items.length,
                            itemBuilder: (ctx, idx) {
                              final cert = items[idx];
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
                                              cert.title,
                                              style: const TextStyle(
                                                fontSize: 15,
                                                fontWeight: FontWeight.w900,
                                                color: Color(0xFF0F172A),
                                              ),
                                            ),
                                          ),
                                          IconButton(
                                            icon: const Icon(Icons.edit_outlined, size: 18),
                                            onPressed: () => _openFormSheet(cert),
                                          ),
                                          IconButton(
                                            icon: const Icon(Icons.delete_outline,
                                                size: 18, color: Color(0xFFDC2626)),
                                            onPressed: () => _confirmDelete(cert),
                                          ),
                                        ],
                                      ),
                                      Text(
                                        cert.issuingOrganization,
                                        style: const TextStyle(
                                          fontSize: 13,
                                          fontWeight: FontWeight.w700,
                                          color: Color(0xFF475569),
                                        ),
                                      ),
                                      const SizedBox(height: 6),
                                      Wrap(
                                        spacing: 6,
                                        runSpacing: 6,
                                        children: [
                                          Chip(
                                            label: Text(cert.category,
                                                style: const TextStyle(fontSize: 11)),
                                            visualDensity: VisualDensity.compact,
                                          ),
                                          Chip(
                                            label: Text(
                                              cert.status == 'Archived'
                                                  ? 'Archived'
                                                  : cert.isExpired
                                                      ? 'Expired'
                                                      : cert.doesNotExpire
                                                          ? 'No Expiry'
                                                          : 'Active',
                                              style: const TextStyle(fontSize: 11),
                                            ),
                                            visualDensity: VisualDensity.compact,
                                          ),
                                        ],
                                      ),
                                      if (cert.credentialId.isNotEmpty) ...[
                                        const SizedBox(height: 6),
                                        Text(
                                          'Credential ID: ${cert.credentialId}',
                                          style: const TextStyle(
                                              fontSize: 12, color: Color(0xFF64748B)),
                                        ),
                                      ],
                                      if (cert.credentialUrl.isNotEmpty &&
                                          CertificationValidators.isSafeHttpsCredentialUrl(
                                              cert.credentialUrl)) ...[
                                        const SizedBox(height: 8),
                                        OutlinedButton.icon(
                                          onPressed: () =>
                                              _launchSafeHttpsUrl(cert.credentialUrl),
                                          icon: const Icon(Icons.open_in_new, size: 15),
                                          label: const Text('View Credential'),
                                        ),
                                      ],
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
