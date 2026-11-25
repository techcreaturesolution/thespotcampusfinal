import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../models/market_job_models.dart';
import '../../services/job_finder_service.dart';

class MarketJobDetailScreen extends StatefulWidget {
  final MarketJob job;

  const MarketJobDetailScreen({super.key, required this.job});

  @override
  State<MarketJobDetailScreen> createState() => _MarketJobDetailScreenState();
}

class _MarketJobDetailScreenState extends State<MarketJobDetailScreen> {
  final JobFinderService _service = JobFinderService();
  bool _applying = false;

  Future<void> _handleApply([String? directLink]) async {
    setState(() => _applying = true);
    try {
      final url = await _service.applyJob(widget.job.id, link: directLink);
      if (url.isNotEmpty) {
        final uri = Uri.parse(url);
        if (await canLaunchUrl(uri)) {
          await launchUrl(uri, mode: LaunchMode.externalApplication);
        } else {
          if (mounted) {
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(content: Text('Could not launch external job URL')),
            );
          }
        }
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: ${e.toString()}')),
        );
      }
    } finally {
      if (mounted) setState(() => _applying = false);
    }
  }

  Future<void> _openContact(String scheme, String target) async {
    final uri = Uri(scheme: scheme, path: target);
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri);
    }
  }

  @override
  Widget build(BuildContext context) {
    final job = widget.job;

    return Scaffold(
      backgroundColor: const Color(0xFFF9FAFB),
      appBar: AppBar(
        title: const Text('Job Details', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 17)),
        backgroundColor: Colors.white,
        foregroundColor: const Color(0xFF1E293B),
        elevation: 0,
        scrolledUnderElevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new, size: 18),
          onPressed: () => Navigator.pop(context),
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Company & Title Header Card
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(18),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: Colors.grey.shade200),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.02),
                    blurRadius: 8,
                    offset: const Offset(0, 2),
                  ),
                ],
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                        decoration: BoxDecoration(
                          color: const Color(0xFFEEF2FF),
                          borderRadius: BorderRadius.circular(6),
                        ),
                        child: Text(
                          job.platform.isNotEmpty ? job.platform : 'Direct',
                          style: const TextStyle(
                            color: Color(0xFF4F46E5),
                            fontWeight: FontWeight.bold,
                            fontSize: 10,
                          ),
                        ),
                      ),
                      const SizedBox(width: 8),
                      if (job.verified)
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                          decoration: BoxDecoration(
                            color: const Color(0xFFECFDF5),
                            borderRadius: BorderRadius.circular(6),
                          ),
                          child: const Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Icon(Icons.verified, size: 11, color: Color(0xFF059669)),
                              SizedBox(width: 4),
                              Text(
                                'Verified',
                                style: TextStyle(
                                  color: Color(0xFF059669),
                                  fontWeight: FontWeight.bold,
                                  fontSize: 10,
                                ),
                              ),
                            ],
                          ),
                        ),
                      const Spacer(),
                      if (job.workFromHome)
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                          decoration: BoxDecoration(
                            color: const Color(0xFFF0FDF4),
                            borderRadius: BorderRadius.circular(6),
                          ),
                          child: const Text(
                            'Remote',
                            style: TextStyle(
                              color: Color(0xFF16A34A),
                              fontWeight: FontWeight.bold,
                              fontSize: 10,
                            ),
                          ),
                        ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  Text(
                    job.title,
                    style: const TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                      color: Color(0xFF0F172A),
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    job.companyName.isNotEmpty ? job.companyName : 'Confidential Organization',
                    style: TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.w600,
                      color: Colors.grey.shade600,
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 14),

            // Key Attributes Grid
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: Colors.grey.shade200),
              ),
              child: GridView.count(
                crossAxisCount: 2,
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                childAspectRatio: 2.3,
                children: [
                  _attributeTile(
                    'Location',
                    job.location.isNotEmpty ? job.location : 'India',
                    Icons.location_on_outlined,
                  ),
                  _attributeTile(
                    'Salary',
                    job.salary.isNotEmpty ? job.salary : 'Not Disclosed',
                    Icons.payments_outlined,
                    isHighlight: true,
                  ),
                  _attributeTile(
                    'Experience',
                    job.experienceText.isNotEmpty
                        ? job.experienceText
                        : 'Fresher',
                    Icons.work_outline,
                  ),
                  _attributeTile(
                    'Job Type',
                    job.employmentType.isNotEmpty ? job.employmentType : 'Full-time',
                    Icons.access_time_outlined,
                  ),
                ],
              ),
            ),
            const SizedBox(height: 14),

            // HR Direct Contacts
            if (job.emails.isNotEmpty || job.phones.isNotEmpty)
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: const Color(0xFFFFFBEB),
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: const Color(0xFFFDE68A)),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'Direct HR Contacts Detected',
                      style: TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.bold,
                        color: Color(0xFFB45309),
                      ),
                    ),
                    const SizedBox(height: 8),
                    Wrap(
                      spacing: 8,
                      runSpacing: 8,
                      children: [
                        ...job.emails.map(
                          (em) => ActionChip(
                            avatar: const Icon(Icons.email, size: 14, color: Color(0xFFB45309)),
                            label: Text(em, style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold)),
                            backgroundColor: Colors.white,
                            onPressed: () => _openContact('mailto', em),
                          ),
                        ),
                        ...job.phones.map(
                          (ph) => ActionChip(
                            avatar: const Icon(Icons.phone, size: 14, color: Color(0xFFB45309)),
                            label: Text(ph, style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold)),
                            backgroundColor: Colors.white,
                            onPressed: () => _openContact('tel', ph),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            if (job.emails.isNotEmpty || job.phones.isNotEmpty) const SizedBox(height: 14),

            // Description Container
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: Colors.grey.shade200),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Job Description',
                    style: TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.bold,
                      color: Color(0xFF0F172A),
                    ),
                  ),
                  const SizedBox(height: 10),
                  Text(
                    job.description.isNotEmpty
                        ? job.description.replaceAll(RegExp(r'<[^>]*>'), '')
                        : 'No description published with this listing. Tap the apply button below for full details.',
                    style: TextStyle(
                      fontSize: 13,
                      height: 1.5,
                      color: Colors.grey.shade800,
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 20),

            // Multiple Apply Options
            if (job.applyOptions.length > 1) ...[
              const Text(
                'Available Application Portals',
                style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Color(0xFF334155)),
              ),
              const SizedBox(height: 8),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: job.applyOptions.map((opt) {
                  return OutlinedButton.icon(
                    onPressed: _applying ? null : () => _handleApply(opt.link),
                    icon: const Icon(Icons.open_in_new, size: 13),
                    label: Text(opt.title, style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold)),
                    style: OutlinedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                      side: BorderSide(color: Colors.grey.shade300),
                    ),
                  );
                }).toList(),
              ),
              const SizedBox(height: 20),
            ],

            // Apply CTA (Zero-Ads Guaranteed)
            SizedBox(
              width: double.infinity,
              height: 48,
              child: ElevatedButton.icon(
                onPressed: _applying ? null : () => _handleApply(),
                icon: _applying
                    ? const SizedBox(
                        width: 16,
                        height: 16,
                        child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
                      )
                    : const Icon(Icons.open_in_new, size: 16),
                label: Text(
                  _applying ? 'Opening Link...' : 'Apply on Official Site (Direct)',
                  style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold),
                ),
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF2563EB),
                  foregroundColor: Colors.white,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  elevation: 0,
                ),
              ),
            ),
            const SizedBox(height: 20),
          ],
        ),
      ),
    );
  }

  Widget _attributeTile(String title, String value, IconData icon, {bool isHighlight = false}) {
    return Row(
      children: [
        Icon(icon, size: 18, color: isHighlight ? const Color(0xFF059669) : Colors.grey.shade400),
        const SizedBox(width: 8),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Text(
                title,
                style: TextStyle(fontSize: 10, color: Colors.grey.shade500, fontWeight: FontWeight.bold),
              ),
              Text(
                value,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.bold,
                  color: isHighlight ? const Color(0xFF059669) : const Color(0xFF1E293B),
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}
