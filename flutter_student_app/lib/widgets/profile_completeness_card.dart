import 'package:flutter/material.dart';
import '../models/profile_completeness_model.dart';

class ProfileCompletenessCard extends StatelessWidget {
  final ProfileCompletenessModel? completeness;
  final bool isLoading;
  final String? errorMessage;
  final VoidCallback onRefresh;
  final void Function(String route)? onNavigate;

  const ProfileCompletenessCard({
    super.key,
    required this.completeness,
    required this.isLoading,
    required this.errorMessage,
    required this.onRefresh,
    this.onNavigate,
  });

  Color _bandColor(String band) {
    switch (band) {
      case 'COMPLETE':
        return const Color(0xFF10B981);
      case 'STRONG':
        return const Color(0xFF3730A3);
      case 'IN_PROGRESS':
        return const Color(0xFFF59E0B);
      case 'NEEDS_ATTENTION':
        return const Color(0xFFEF4444);
      default:
        return const Color(0xFF64748B);
    }
  }

  void _navigateToRoute(BuildContext context, String route) {
    if (route.isEmpty) return;
    if (onNavigate != null) {
      onNavigate!(route);
      return;
    }
    if (route == '/profile') return;
    Navigator.pushNamed(context, route).then((_) => onRefresh());
  }

  @override
  Widget build(BuildContext context) {
    if (isLoading && completeness == null) {
      return Container(
        margin: const EdgeInsets.only(bottom: 20),
        padding: const EdgeInsets.all(18),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: Colors.grey.shade200),
        ),
        child: const Row(
          children: [
            SizedBox(
              width: 18,
              height: 18,
              child: CircularProgressIndicator(strokeWidth: 2),
            ),
            SizedBox(width: 12),
            Text(
              'Calculating profile completeness...',
              style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600),
            ),
          ],
        ),
      );
    }

    if (errorMessage != null && completeness == null) {
      return Container(
        margin: const EdgeInsets.only(bottom: 20),
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: const Color(0xFFFEF2F2),
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: const Color(0xFFFECACA)),
        ),
        child: Row(
          children: [
            const Icon(Icons.error_outline, color: Color(0xFFDC2626)),
            const SizedBox(width: 12),
            Expanded(
              child: Text(
                errorMessage!,
                style: const TextStyle(fontSize: 12, color: Color(0xFF991B1B)),
              ),
            ),
            TextButton(
              onPressed: onRefresh,
              child: const Text('Retry'),
            ),
          ],
        ),
      );
    }

    final data = completeness;
    if (data == null) return const SizedBox.shrink();

    final color = _bandColor(data.statusBand);
    final applicableSections = data.sections.where((s) => s.applicable).toList();

    return Container(
      margin: const EdgeInsets.only(bottom: 20),
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(22),
        border: Border.all(color: Colors.grey.shade200),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.04),
            blurRadius: 14,
            offset: const Offset(0, 6),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        const Text(
                          'Profile Completeness',
                          style: TextStyle(
                            fontSize: 15,
                            fontWeight: FontWeight.w800,
                            color: Color(0xFF111827),
                          ),
                        ),
                        const SizedBox(width: 8),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                          decoration: BoxDecoration(
                            color: color.withOpacity(0.12),
                            borderRadius: BorderRadius.circular(20),
                          ),
                          child: Text(
                            data.statusLabel,
                            style: TextStyle(
                              fontSize: 10,
                              fontWeight: FontWeight.w800,
                              color: color,
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 4),
                    Text(
                      '${data.completedSections} of ${data.totalApplicableSections} required sections complete',
                      style: const TextStyle(fontSize: 11, color: Color(0xFF6B7280)),
                    ),
                  ],
                ),
              ),
              Text(
                '${data.percentage}%',
                style: TextStyle(
                  fontSize: 22,
                  fontWeight: FontWeight.w900,
                  color: color,
                ),
              ),
              IconButton(
                icon: const Icon(Icons.refresh, size: 18),
                tooltip: 'Refresh',
                onPressed: onRefresh,
              ),
            ],
          ),
          const SizedBox(height: 10),
          ClipRRect(
            borderRadius: BorderRadius.circular(8),
            child: LinearProgressIndicator(
              value: (data.percentage.clamp(0, 100)) / 100.0,
              minHeight: 8,
              backgroundColor: Colors.grey.shade200,
              valueColor: AlwaysStoppedAnimation<Color>(color),
            ),
          ),
          const SizedBox(height: 14),
          ...applicableSections.map(
            (sec) => InkWell(
              onTap: sec.action.mobileRoute.isNotEmpty
                  ? () => _navigateToRoute(context, sec.action.mobileRoute)
                  : null,
              borderRadius: BorderRadius.circular(12),
              child: Padding(
                padding: const EdgeInsets.symmetric(vertical: 6),
                child: Row(
                  children: [
                    Icon(
                      sec.isComplete
                          ? Icons.check_circle
                          : sec.isOptional
                              ? Icons.star_outline
                              : Icons.radio_button_unchecked,
                      size: 18,
                      color: sec.isComplete
                          ? const Color(0xFF10B981)
                          : sec.isOptional
                              ? const Color(0xFF6366F1)
                              : const Color(0xFFF59E0B),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            sec.title,
                            style: const TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.w700,
                              color: Color(0xFF1F2937),
                            ),
                          ),
                          Text(
                            sec.isOptional
                                ? sec.status
                                : '${sec.percentage}% complete (weight ${sec.weight.toInt()}%)',
                            style: const TextStyle(
                              fontSize: 10,
                              color: Color(0xFF6B7280),
                            ),
                          ),
                        ],
                      ),
                    ),
                    if (sec.action.mobileRoute.isNotEmpty && sec.action.mobileRoute != '/profile')
                      const Icon(Icons.chevron_right, size: 16, color: Color(0xFF9CA3AF)),
                  ],
                ),
              ),
            ),
          ),
          if (data.missingItems.isNotEmpty) ...[
            const Divider(height: 20),
            const Text(
              'Missing Items',
              style: TextStyle(
                fontSize: 11,
                fontWeight: FontWeight.w800,
                color: Color(0xFF374151),
              ),
            ),
            const SizedBox(height: 8),
            Wrap(
              spacing: 6,
              runSpacing: 6,
              children: data.missingItems
                  .take(6)
                  .map(
                    (item) => ActionChip(
                      label: Text(
                        item.label,
                        style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w600),
                      ),
                      backgroundColor: const Color(0xFFFFFBEB),
                      side: const BorderSide(color: Color(0xFFFDE68A)),
                      onPressed: item.action.mobileRoute.isNotEmpty
                          ? () => _navigateToRoute(context, item.action.mobileRoute)
                          : null,
                    ),
                  )
                  .toList(),
            ),
          ],
        ],
      ),
    );
  }
}
