import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:url_launcher/url_launcher.dart';
import '../models/internship_models.dart';
import '../services/internships_service.dart';

class InternshipsScreen extends StatefulWidget {
  const InternshipsScreen({super.key});

  @override
  State<InternshipsScreen> createState() => _InternshipsScreenState();
}

class _InternshipsScreenState extends State<InternshipsScreen> {
  String _workModeFilter = '';
  String _sortMode = 'display_order';
  final _searchCtrl = TextEditingController();

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<InternshipsService>().loadMyInternships();
    });
  }

  @override
  void dispose() {
    _searchCtrl.dispose();
    super.dispose();
  }

  Future<void> _launchSafeUrl(String url) async {
    final uri = Uri.tryParse(url);
    if (uri == null || !InternshipValidators.isSafeHttpUrl(url)) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Invalid or unsafe URL')),
        );
      }
      return;
    }
    try {
      final launched = await launchUrl(uri, mode: LaunchMode.externalApplication);
      if (!launched && mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Could not open URL')),
        );
      }
    } catch (_) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Failed to launch URL')),
        );
      }
    }
  }

  Future<void> _openFormSheet([InternshipModel? existing]) async {
    final roleCtrl = TextEditingController(text: existing?.roleTitle ?? '');
    final orgCtrl = TextEditingController(text: existing?.organizationName ?? '');
    final locationCtrl = TextEditingController(text: existing?.location ?? '');
    final websiteCtrl = TextEditingController(text: existing?.companyWebsite ?? '');
    final descCtrl = TextEditingController(text: existing?.description ?? '');
    final respCtrl = TextEditingController(text: existing?.responsibilities ?? '');
    final achCtrl = TextEditingController(text: existing?.achievements ?? '');

    String employmentType = existing?.employmentType ?? 'Internship';
    String workMode = existing?.workMode ?? 'Hybrid';
    String visibility = existing?.visibility ?? 'Public';
    String status = existing?.status ?? 'Active';
    bool currentlyWorking = existing?.currentlyWorking ?? false;
    DateTime? startDate = existing?.startDate ?? DateTime.now();
    DateTime? endDate = currentlyWorking ? null : existing?.endDate;
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
            final svc = ctx.read<InternshipsService>();
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
                      existing == null
                          ? 'Add Internship Experience'
                          : 'Edit Internship Experience',
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
                      controller: roleCtrl,
                      decoration: const InputDecoration(
                        labelText: 'Role / Job Title *',
                        border: OutlineInputBorder(),
                      ),
                    ),
                    const SizedBox(height: 10),
                    TextField(
                      controller: orgCtrl,
                      decoration: const InputDecoration(
                        labelText: 'Company / Organization *',
                        border: OutlineInputBorder(),
                      ),
                    ),
                    const SizedBox(height: 10),
                    Row(
                      children: [
                        Expanded(
                          child: DropdownButtonFormField<String>(
                            value: employmentType,
                            decoration: const InputDecoration(
                              labelText: 'Type',
                              border: OutlineInputBorder(),
                            ),
                            items: InternshipValidators.employmentTypes
                                .map((t) => DropdownMenuItem(value: t, child: Text(t)))
                                .toList(),
                            onChanged: (v) {
                              if (v != null) setSheetState(() => employmentType = v);
                            },
                          ),
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: DropdownButtonFormField<String>(
                            value: workMode,
                            decoration: const InputDecoration(
                              labelText: 'Work Mode',
                              border: OutlineInputBorder(),
                            ),
                            items: InternshipValidators.workModes
                                .map((w) => DropdownMenuItem(value: w, child: Text(w)))
                                .toList(),
                            onChanged: (v) {
                              if (v != null) setSheetState(() => workMode = v);
                            },
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 10),
                    TextField(
                      controller: locationCtrl,
                      decoration: const InputDecoration(
                        labelText: 'Location',
                        border: OutlineInputBorder(),
                      ),
                    ),
                    const SizedBox(height: 10),
                    TextField(
                      controller: websiteCtrl,
                      decoration: const InputDecoration(
                        labelText: 'Company Website (https://...)',
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
                                initialDate: startDate ?? DateTime.now(),
                                firstDate: DateTime(1990),
                                lastDate: DateTime(2100),
                              );
                              if (picked != null) {
                                setSheetState(() => startDate = picked);
                              }
                            },
                            icon: const Icon(Icons.date_range, size: 16),
                            label: Text(
                              startDate == null
                                  ? 'Start Date *'
                                  : 'Start: ${startDate!.toIso8601String().substring(0, 10)}',
                              style: const TextStyle(fontSize: 12),
                            ),
                          ),
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: OutlinedButton.icon(
                            onPressed: currentlyWorking
                                ? null
                                : () async {
                                    final picked = await showDatePicker(
                                      context: ctx,
                                      initialDate: endDate ?? startDate ?? DateTime.now(),
                                      firstDate: DateTime(1990),
                                      lastDate: DateTime(2100),
                                    );
                                    if (picked != null) {
                                      setSheetState(() => endDate = picked);
                                    }
                                  },
                            icon: const Icon(Icons.event, size: 16),
                            label: Text(
                              currentlyWorking
                                  ? 'Present'
                                  : endDate == null
                                      ? 'End Date *'
                                      : 'End: ${endDate!.toIso8601String().substring(0, 10)}',
                              style: const TextStyle(fontSize: 12),
                            ),
                          ),
                        ),
                      ],
                    ),
                    CheckboxListTile(
                      contentPadding: EdgeInsets.zero,
                      title: const Text(
                        'Currently working in this role',
                        style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600),
                      ),
                      value: currentlyWorking,
                      onChanged: (val) {
                        setSheetState(() {
                          currentlyWorking = val ?? false;
                          if (currentlyWorking) endDate = null;
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
                            items: InternshipValidators.visibilities
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
                            items: InternshipValidators.statuses
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
                      maxLines: 2,
                      decoration: const InputDecoration(
                        labelText: 'Description',
                        border: OutlineInputBorder(),
                      ),
                    ),
                    const SizedBox(height: 10),
                    TextField(
                      controller: respCtrl,
                      maxLines: 2,
                      decoration: const InputDecoration(
                        labelText: 'Responsibilities',
                        border: OutlineInputBorder(),
                      ),
                    ),
                    const SizedBox(height: 10),
                    TextField(
                      controller: achCtrl,
                      maxLines: 2,
                      decoration: const InputDecoration(
                        labelText: 'Achievements',
                        border: OutlineInputBorder(),
                      ),
                    ),
                    const SizedBox(height: 16),
                    ElevatedButton(
                      onPressed: () async {
                        final err = InternshipValidators.validateForm(
                          roleTitle: roleCtrl.text,
                          organizationName: orgCtrl.text,
                          startDate: startDate,
                          endDate: endDate,
                          currentlyWorking: currentlyWorking,
                          companyWebsite: websiteCtrl.text,
                        );
                        if (err != null) {
                          setSheetState(() => formError = err);
                          return;
                        }
                        final payload = {
                          'role_title': roleCtrl.text.trim(),
                          'organization_name': orgCtrl.text.trim(),
                          'employment_type': employmentType,
                          'work_mode': workMode,
                          'location': locationCtrl.text.trim(),
                          'company_website': websiteCtrl.text.trim(),
                          'start_date': startDate!.toIso8601String(),
                          'end_date': currentlyWorking ? null : endDate!.toIso8601String(),
                          'currently_working': currentlyWorking,
                          'description': descCtrl.text.trim(),
                          'responsibilities': respCtrl.text.trim(),
                          'achievements': achCtrl.text.trim(),
                          'visibility': visibility,
                          'status': status,
                        };
                        try {
                          if (existing == null) {
                            await svc.createInternship(payload);
                          } else {
                            await svc.updateInternship(existing.id, payload);
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
                        existing == null ? 'Save Internship' : 'Update Internship',
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

  Future<void> _confirmDelete(InternshipModel item) async {
    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Delete Internship'),
        content: Text('Delete "${item.roleTitle}" at ${item.organizationName}?'),
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
      await context.read<InternshipsService>().deleteInternship(item.id);
    }
  }

  @override
  Widget build(BuildContext context) {
    final service = context.watch<InternshipsService>();
    final items = service.internships;

    return Scaffold(
      backgroundColor: const Color(0xFFF8F9FF),
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        title: const Text(
          'Internship Experience',
          style: TextStyle(color: Color(0xFF1E293B), fontWeight: FontWeight.w900, fontSize: 18),
        ),
        iconTheme: const IconThemeData(color: Color(0xFF1E293B)),
        actions: [
          IconButton(
            tooltip: 'Toggle timeline sort',
            icon: Icon(
              _sortMode == 'timeline' ? Icons.schedule : Icons.sort,
              color: const Color(0xFF3730A3),
            ),
            onPressed: () {
              setState(() {
                _sortMode = _sortMode == 'timeline' ? 'display_order' : 'timeline';
              });
              service.loadMyInternships(
                workMode: _workModeFilter,
                search: _searchCtrl.text,
                sort: _sortMode,
              );
            },
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => _openFormSheet(),
        backgroundColor: const Color(0xFF3730A3),
        foregroundColor: Colors.white,
        icon: const Icon(Icons.add),
        label: const Text('Add Internship', style: TextStyle(fontWeight: FontWeight.w800)),
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
                    hintText: 'Search role, company, location...',
                    prefixIcon: const Icon(Icons.search, size: 18),
                    isDense: true,
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                  onSubmitted: (_) => service.loadMyInternships(
                    workMode: _workModeFilter,
                    search: _searchCtrl.text,
                    sort: _sortMode,
                  ),
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
                          label: const Text('All Modes'),
                          selected: _workModeFilter.isEmpty,
                          onSelected: (_) {
                            setState(() => _workModeFilter = '');
                            service.loadMyInternships(search: _searchCtrl.text, sort: _sortMode);
                          },
                        ),
                      ),
                      ...InternshipValidators.workModes.map(
                        (wm) => Padding(
                          padding: const EdgeInsets.only(right: 6),
                          child: ChoiceChip(
                            label: Text(wm),
                            selected: _workModeFilter == wm,
                            onSelected: (_) {
                              setState(() => _workModeFilter = wm);
                              service.loadMyInternships(
                                workMode: _workModeFilter,
                                search: _searchCtrl.text,
                                sort: _sortMode,
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
                        child: Column(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Text(
                              service.errorMessage!,
                              style: const TextStyle(color: Color(0xFFDC2626)),
                            ),
                            const SizedBox(height: 12),
                            ElevatedButton(
                              onPressed: () => service.loadMyInternships(),
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
                                Icon(Icons.work_outline, size: 48, color: Color(0xFF94A3B8)),
                                SizedBox(height: 12),
                                Text(
                                  'No internship experiences added yet',
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
                            padding: const EdgeInsets.fromLTRB(16, 12, 16, 90),
                            itemCount: items.length,
                            itemBuilder: (ctx, idx) {
                              final item = items[idx];
                              final startTxt = item.startDate != null
                                  ? item.startDate!.toIso8601String().substring(0, 10)
                                  : '-';
                              final endTxt = item.currentlyWorking
                                  ? 'Present'
                                  : (item.endDate != null
                                      ? item.endDate!.toIso8601String().substring(0, 10)
                                      : '-');

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
                                              item.roleTitle,
                                              style: const TextStyle(
                                                fontSize: 15,
                                                fontWeight: FontWeight.w900,
                                              ),
                                            ),
                                          ),
                                          IconButton(
                                            icon: const Icon(Icons.edit_outlined, size: 18),
                                            onPressed: () => _openFormSheet(item),
                                          ),
                                          IconButton(
                                            icon: const Icon(Icons.delete_outline,
                                                size: 18, color: Color(0xFFDC2626)),
                                            onPressed: () => _confirmDelete(item),
                                          ),
                                        ],
                                      ),
                                      Text(
                                        item.organizationName,
                                        style: const TextStyle(
                                          fontSize: 13,
                                          fontWeight: FontWeight.w700,
                                          color: Color(0xFF475569),
                                        ),
                                      ),
                                      const SizedBox(height: 6),
                                      Text(
                                        '$startTxt — $endTxt  •  ${item.workMode}${item.location.isNotEmpty ? ' • ${item.location}' : ''}',
                                        style: const TextStyle(
                                            fontSize: 12, color: Color(0xFF64748B)),
                                      ),
                                      if (item.description.isNotEmpty) ...[
                                        const SizedBox(height: 6),
                                        Text(item.description, style: const TextStyle(fontSize: 12)),
                                      ],
                                      if (item.companyWebsite.isNotEmpty &&
                                          InternshipValidators.isSafeHttpUrl(item.companyWebsite)) ...[
                                        const SizedBox(height: 8),
                                        OutlinedButton.icon(
                                          onPressed: () => _launchSafeUrl(item.companyWebsite),
                                          icon: const Icon(Icons.open_in_new, size: 14),
                                          label: const Text('Company Website'),
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
